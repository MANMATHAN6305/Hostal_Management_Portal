const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const buildStudentId = () => `STU${Date.now()}${Math.floor(Math.random() * 1000)}`;

router.post('/', verifyToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const requiredFields = [
      'fullName',
      'registerNumber',
      'department',
      'yearOfStudy',
      'gender',
      'dateOfBirth',
      'studentEmail',
      'mobileNumber',
      'guardianName',
      'relationship',
      'guardianContactNumber',
      'guardianAddress'
    ];

    const missing = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || String(value).trim() === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    let student = await Student.findOne({ where: { email: req.user.email } });

    const nameParts = String(req.body.fullName).trim().split(/\s+/);
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (!student) {
      student = await Student.create({
        studentId: req.body.registerNumber || buildStudentId(),
        firstName,
        lastName,
        email: req.body.studentEmail || req.user.email,
        phone: req.body.mobileNumber || null,
        department: req.body.department || null,
        year: req.body.yearOfStudy ? Number(req.body.yearOfStudy) : null,
        dateOfBirth: req.body.dateOfBirth || null,
        gender: req.body.gender || 'Select Gender',
        guardianName: req.body.guardianName || null,
        guardianPhone: req.body.guardianContactNumber || null,
        address: req.body.guardianAddress || null
      });
    }

    const updatedFirstName = firstName || student.firstName;
    const updatedLastName = lastName || student.lastName;

    await student.update({
      studentId: req.body.registerNumber || student.studentId,
      firstName: updatedFirstName,
      lastName: updatedLastName,
      email: req.body.studentEmail || student.email,
      phone: req.body.mobileNumber || student.phone,
      department: req.body.department || student.department,
      year: req.body.yearOfStudy ? Number(req.body.yearOfStudy) : student.year,
      dateOfBirth: req.body.dateOfBirth || student.dateOfBirth,
      gender: req.body.gender || student.gender,
      guardianName: req.body.guardianName || student.guardianName,
      guardianPhone: req.body.guardianContactNumber || student.guardianPhone,
      address: req.body.guardianAddress || student.address
    });

    const application = await Application.create({
      StudentId: student.id,
      HostelId: req.body.hostelId || null,
      fullName: req.body.fullName,
      registerNumber: req.body.registerNumber,
      department: req.body.department,
      yearOfStudy: req.body.yearOfStudy,
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      studentEmail: req.body.studentEmail,
      mobileNumber: req.body.mobileNumber,
      roomType: req.body.roomType || null,
      blockName: req.body.blockName || null,
      specialPreferences: req.body.specialPreferences || null,
      guardianName: req.body.guardianName,
      relationship: req.body.relationship,
      guardianContactNumber: req.body.guardianContactNumber,
      guardianAddress: req.body.guardianAddress,
      preferredRoomType: req.body.preferredRoomType || null,
      reason: req.body.reason || null
    });
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit application.', error: error.message });
  }
});

router.get('/', verifyToken, authorizeRoles('STUDENT', 'WARDEN', 'ADMIN'), async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { email: req.user.email } });
      where.StudentId = student?.id || -1;
    }

    const applications = await Application.findAll({
      where,
      include: [
        { model: Student, attributes: ['id', 'studentId', 'firstName', 'lastName', 'email'] },
        { model: Hostel, attributes: ['id', 'name', 'blockCode', 'gender'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications.', error: error.message });
  }
});

router.put('/:id/review', verifyToken, authorizeRoles('WARDEN', 'ADMIN'), async (req, res) => {
  try {
    const application = await Application.findByPk(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (!['APPROVED', 'REJECTED'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    application.status = req.body.status;
    application.remarks = req.body.remarks || null;
    await application.save();
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to review application.', error: error.message });
  }
});

module.exports = router;
