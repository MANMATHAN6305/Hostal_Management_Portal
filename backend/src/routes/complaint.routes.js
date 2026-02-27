const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const categoryToStaffRole = {
  ELECTRICAL: 'ELECTRICIAN',
  CLEANING: 'CLEANER',
  MAINTENANCE: 'CARETAKER'
};

const canViewComplaint = (complaint, reqUser, studentId) => {
  if (['ADMIN', 'WARDEN'].includes(reqUser.role)) return true;
  if (reqUser.role === 'STAFF') return complaint.assignedStaffRole === reqUser.staffRole;
  if (reqUser.role === 'STUDENT') return complaint.StudentId === studentId;
  return false;
};

router.post('/', verifyToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const { message, category } = req.body;
    if (!message || !category) {
      return res.status(400).json({ success: false, message: 'message and category are required.' });
    }

    const student = await Student.findOne({ where: { email: req.user.email } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const assignedStaffRole = categoryToStaffRole[category] || null;
    const complaint = await Complaint.create({
      StudentId: student.id,
      message: message.trim(),
      category,
      assignedStaffRole
    });

    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create complaint.', error: error.message });
  }
});

router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT', 'STAFF'), async (req, res) => {
  try {
    const include = [{ model: Student, attributes: ['id', 'studentId', 'firstName', 'lastName', 'email'] }];
    let complaints = await Complaint.findAll({ include, order: [['createdAt', 'DESC']] });

    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { email: req.user.email } });
      complaints = complaints.filter((c) => c.StudentId === student?.id);
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
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const assignedStaffRole = req.body.assignedStaffRole || categoryToStaffRole[complaint.category] || null;
    complaint.assignedStaffRole = assignedStaffRole;
    complaint.assignedById = req.user.id;
    complaint.status = complaint.status === 'PENDING' ? 'IN_PROGRESS' : complaint.status;
    await complaint.save();

    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign complaint.', error: error.message });
  }
});

router.put('/:id/status', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STAFF'), async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    let studentId = null;
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { email: req.user.email } });
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
