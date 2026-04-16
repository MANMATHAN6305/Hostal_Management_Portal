const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const User = require('../models/User');
const Application = require('../models/Application');
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const complaintsUploadDir = path.join(__dirname, '..', '..', 'uploads', 'complaints');
if (!fs.existsSync(complaintsUploadDir)) {
  fs.mkdirSync(complaintsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, complaintsUploadDir);
  },
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `complaint-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const uploadComplaintImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed for complaint upload.'));
      return;
    }
    cb(null, true);
  }
}).single('image');

const complaintImageUploadHandler = (req, res, next) => {
  uploadComplaintImage(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Complaint image must be 5MB or smaller.'
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to upload complaint image.'
    });
  });
};

let complaintSchemaReady = false;

const categoryToStaffRole = {
  ELECTRICAL: 'ELECTRICIAN',
  CLEANING: 'CLEANER',
  MAINTENANCE: 'CARETAKER'
};

const getWardenHostelScope = async (wardenId) => {
  const hostels = await Hostel.findAll({
    where: { wardenId },
    attributes: ['id', 'name'],
    raw: true
  });

  return {
    hostelIds: hostels
      .map((hostel) => Number(hostel.id))
      .filter((hostelId) => Number.isFinite(hostelId) && hostelId > 0),
    hostelNames: hostels
      .map((hostel) => String(hostel.name || '').trim())
      .filter(Boolean)
  };
};

const getWardenRoomWhere = (hostelScope) => {
  const scopeConditions = [];

  if (hostelScope.hostelIds.length > 0) {
    scopeConditions.push({
      hostelId: {
        [Op.in]: hostelScope.hostelIds
      }
    });
  }

  if (hostelScope.hostelNames.length > 0) {
    scopeConditions.push({
      blockName: {
        [Op.in]: hostelScope.hostelNames
      }
    });
  }

  if (scopeConditions.length === 0) {
    return null;
  }

  if (scopeConditions.length === 1) {
    return scopeConditions[0];
  }

  return { [Op.or]: scopeConditions };
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
      const hostelScope = await getWardenHostelScope(currentUserId);
      const roomWhere = getWardenRoomWhere(hostelScope);

      if (!roomWhere) return false;
      
      const allocation = await Allocation.findOne({
        where: { StudentId: complaintStudentId, status: 'ACTIVE' },
        include: [{
          model: Room,
          where: roomWhere,
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
      include: [{ model: Room, attributes: ['blockName', 'hostelId'] }]
    });

    if (!allocation || !allocation.Room) return null;

    // Find the hostel by blockName and get its warden
    let hostel = null;

    if (allocation.Room.hostelId) {
      hostel = await Hostel.findByPk(allocation.Room.hostelId);
    }

    if (!hostel) {
      hostel = await Hostel.findOne({
        where: { name: allocation.Room.blockName }
      });
    }

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
  // Avoid runtime ALTER in production (some managed DB users don't have ALTER privileges).
  await Complaint.sync();
  complaintSchemaReady = true;
};

router.post('/', verifyToken, authorizeRoles('STUDENT'), complaintImageUploadHandler, async (req, res) => {
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
      assignedById: assignedWardenId,
      imageUrl: req.file ? `/uploads/complaints/${req.file.filename}` : null
    });

    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create complaint.' });
  }
});

router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT', 'STAFF'), async (req, res) => {
  try {
    await ensureComplaintSchema();

    const include = [
      { model: Student, attributes: ['id', 'studentId', 'firstName', 'lastName', 'email', 'phone'] },
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
        attributes: ['id', 'name']
      });
      
      const hostelScope = {
        hostelIds: wardenHostels
          .map((hostel) => Number(hostel.id))
          .filter((hostelId) => Number.isFinite(hostelId) && hostelId > 0),
        hostelNames: wardenHostels
          .map((hostel) => String(hostel.name || '').trim())
          .filter(Boolean)
      };
      const roomWhere = getWardenRoomWhere(hostelScope);
      
      if (!roomWhere) {
        // Warden has no hostels assigned, show no complaints
        complaints = [];
      } else {
        // Get all active allocations for students in these hostels
        const allocations = await Allocation.findAll({
          where: { status: 'ACTIVE' },
          include: [{
            model: Room,
            where: roomWhere,
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
    res.status(500).json({ success: false, message: 'Failed to fetch complaints.' });
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
    res.status(500).json({ success: false, message: 'Failed to assign complaint.' });
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
    res.status(500).json({ success: false, message: 'Failed to update complaint.' });
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
    res.status(500).json({ success: false, message: 'Failed to fetch staff directory.' });
  }
});

module.exports = router;