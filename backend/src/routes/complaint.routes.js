const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const User = require('../models/User');
const Application = require('../models/Application');
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { sequelize } = require('../config/database');

let complaintSchemaReady = false;

const categoryToStaffRole = {
  ELECTRICAL: 'ELECTRICIAN',
  CLEANING: 'CLEANER',
  MAINTENANCE: 'CARETAKER'
};

const canViewComplaint = async (complaint, reqUser, studentId = null) => {
  const complaintWardenId = complaint.assignedById !== null && complaint.assignedById !== undefined ? Number(complaint.assignedById) : null;
  const currentUserId = reqUser?.id !== null && reqUser?.id !== undefined ? Number(reqUser.id) : null;
  const complaintStudentId = complaint.StudentId !== null && complaint.StudentId !== undefined ? Number(complaint.StudentId) : null;
  const currentStudentId = studentId !== null && studentId !== undefined ? Number(studentId) : null;

  if (reqUser.role === 'ADMIN') return true;
  
  if (reqUser.role === 'WARDEN') {
    // Check if this warden is assigned to the complaint
    if (complaintWardenId === currentUserId) return true;
    
    // Check if the student is in one of this warden's hostels
    try {
      const wardenHostels = await Hostel.findAll({
        where: { wardenId: currentUserId },
        attributes: ['name']
      });
      
      if (wardenHostels.length === 0) return false;
      
      const hostelNames = wardenHostels.map(h => h.name);
      
      const allocation = await Allocation.findOne({
        where: { StudentId: complaintStudentId, status: 'ACTIVE' },
        include: [{
          model: Room,
          where: { blockName: hostelNames },
          attributes: ['blockName']
        }]
      });
      
      return allocation !== null;
    } catch (error) {
      console.error('Error checking warden access:', error);
      return false;
    }
  }
  
  if (reqUser.role === 'STAFF') return complaint.assignedStaffRole === reqUser.staffRole;
  if (reqUser.role === 'STUDENT') return complaintStudentId === currentStudentId;
  return false;
};

// Find the warden assigned to a student's hostel
const findWardenForStudent = async (studentId) => {
  try {
    // Get the student's active allocation
    const allocation = await Allocation.findOne({
      where: { StudentId: studentId, status: 'ACTIVE' },
      include: [{ model: Room, attributes: ['blockName'] }]
    });

    if (!allocation || !allocation.Room) return null;

    // Find the hostel by blockName and get its warden
    const hostel = await Hostel.findOne({
      where: { name: allocation.Room.blockName }
    });

    return hostel?.wardenId || null;
  } catch (error) {
    console.error('Error finding warden for student:', error);
    return null;
  }
};

const getStudentForRequest = async (reqUser) => {
  let student = await Student.findOne({ where: { email: reqUser.email } });
  if (student) return student;

  // Fallback for legacy data where student email differs from login email.
  const application = await Application.findOne({
    where: { studentEmail: reqUser.email },
    include: [{ model: Student }],
    order: [['createdAt', 'DESC']]
  });

  if (application?.Student) return application.Student;

  return null;
};

const ensureComplaintSchema = async () => {
  if (complaintSchemaReady) return;
  await Complaint.sync({ alter: true });
  complaintSchemaReady = true;
};

router.post('/', verifyToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    await ensureComplaintSchema();

    const { message, category } = req.body;
    if (!message || !category) {
      return res.status(400).json({ success: false, message: 'message and category are required.' });
    }

    const student = await getStudentForRequest(req.user);
    if (!student) {
      return res.status(400).json({ success: false, message: 'Complete Apply Hostel form before raising complaints.' });
    }

    // Find the warden assigned to the student's hostel
    const assignedWardenId = await findWardenForStudent(student.id);
    
    const complaint = await Complaint.create({
      StudentId: student.id,
      message: message.trim(),
      category,
      assignedById: assignedWardenId
    });

    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create complaint.', error: error.message });
  }
});

router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT', 'STAFF'), async (req, res) => {
  try {
    await ensureComplaintSchema();

    const include = [
      { model: Student, attributes: ['id', 'studentId', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'AssignedBy', attributes: ['id', 'fullName', 'email'] }
    ];
    let complaints = await Complaint.findAll({ include, order: [['createdAt', 'DESC']] });

    if (req.user.role === 'STUDENT') {
      const student = await getStudentForRequest(req.user);
      if (!student) {
        return res.json({ success: true, complaints: [] });
      }
      complaints = complaints.filter((c) => Number(c.StudentId) === Number(student.id));
    }
    
    if (req.user.role === 'WARDEN') {
      // Get all hostels assigned to this warden
      const wardenHostels = await Hostel.findAll({
        where: { wardenId: req.user.id },
        attributes: ['name']
      });
      
      const hostelNames = wardenHostels.map(h => h.name);
      
      if (hostelNames.length === 0) {
        // Warden has no hostels assigned, show no complaints
        complaints = [];
      } else {
        // Get all active allocations for students in these hostels
        const allocations = await Allocation.findAll({
          where: { status: 'ACTIVE' },
          include: [{
            model: Room,
            where: { blockName: hostelNames },
            attributes: ['blockName']
          }],
          attributes: ['StudentId']
        });
        
        const studentIds = allocations.map(a => a.StudentId);
        
        // Filter complaints to only show those from students in these hostels
        // Also show complaints assigned to this warden
        complaints = complaints.filter((c) => 
          studentIds.includes(Number(c.StudentId)) || 
          Number(c.assignedById) === Number(req.user.id)
        );
      }
    }
    
    if (req.user.role === 'STAFF') {
      complaints = complaints.filter((c) => c.assignedStaffRole === req.user.staffRole);
    }

    res.json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaints.', error: error.message });
  }
});

router.put('/:id/assign', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    await ensureComplaintSchema();

    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const assignedStaffRole = req.body.assignedStaffRole || categoryToStaffRole[complaint.category] || null;
    complaint.assignedStaffRole = assignedStaffRole;
    if (req.user.role === 'WARDEN') {
      complaint.assignedById = req.user.id;
    } else if (!complaint.assignedById) {
      complaint.assignedById = await findWardenForStudent(complaint.StudentId);
    }
    complaint.status = complaint.status === 'PENDING' ? 'IN_PROGRESS' : complaint.status;
    await complaint.save();

    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign complaint.', error: error.message });
  }
});

router.put('/:id/status', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STAFF'), async (req, res) => {
  try {
    await ensureComplaintSchema();

    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    let studentId = null;
    if (req.user.role === 'STUDENT') {
      const student = await getStudentForRequest(req.user);
      studentId = student?.id;
    }
    
    const canView = await canViewComplaint(complaint, req.user, studentId);
    if (!canView) {
      return res.status(403).json({ success: false, message: 'You cannot update this complaint.' });
    }

    const nextStatus = req.body.status;
    if (!['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    complaint.status = nextStatus;
    if (req.body.adminReply !== undefined) complaint.adminReply = req.body.adminReply;
    if (req.user.role === 'WARDEN' && !complaint.assignedById) complaint.assignedById = req.user.id;
    if (nextStatus === 'RESOLVED') complaint.resolvedAt = new Date();
    await complaint.save();

    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update complaint.', error: error.message });
  }
});

router.get('/directory/staff', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT'), async (req, res) => {
  try {
    const staff = await User.findAll({
      where: { role: 'STAFF', isActive: true },
      attributes: ['id', 'fullName', 'email', 'phone', 'staffRole']
    });
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch staff directory.', error: error.message });
  }
});

module.exports = router;