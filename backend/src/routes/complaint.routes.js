const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const User = require('../models/User');
const Application = require('../models/Application');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

let complaintSchemaReady = false;

const categoryToStaffRole = {
  ELECTRICAL: 'ELECTRICIAN',
  CLEANING: 'CLEANER',
  MAINTENANCE: 'CARETAKER'
};

const canViewComplaint = (complaint, reqUser, studentId) => {
  const complaintWardenId = complaint.assignedById !== null && complaint.assignedById !== undefined ? Number(complaint.assignedById) : null;
  const currentUserId = reqUser?.id !== null && reqUser?.id !== undefined ? Number(reqUser.id) : null;
  const complaintStudentId = complaint.StudentId !== null && complaint.StudentId !== undefined ? Number(complaint.StudentId) : null;
  const currentStudentId = studentId !== null && studentId !== undefined ? Number(studentId) : null;

  if (reqUser.role === 'ADMIN') return true;
  if (reqUser.role === 'WARDEN') return complaintWardenId === currentUserId || complaintWardenId === null;
  if (reqUser.role === 'STAFF') return complaint.assignedStaffRole === reqUser.staffRole;
  if (reqUser.role === 'STUDENT') return complaintStudentId === currentStudentId;
  return false;
};

const findAssignedWardenId = async (studentId) => {
  const wardens = await User.findAll({
    where: { role: 'WARDEN', isActive: true },
    attributes: ['id'],
    order: [['id', 'ASC']]
  });

  if (wardens.length === 0) return null;

  const index = studentId ? studentId % wardens.length : 0;
  return wardens[index].id;
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

    const assignedWardenId = await findAssignedWardenId(student.id);
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
      complaints = complaints.filter((c) => c.assignedById === null || Number(c.assignedById) === Number(req.user.id));
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
      complaint.assignedById = await findAssignedWardenId(complaint.StudentId);
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
    if (!canViewComplaint(complaint, req.user, studentId)) {
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
