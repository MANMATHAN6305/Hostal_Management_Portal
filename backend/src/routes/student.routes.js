const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const { Op } = require('sequelize');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const {
  DEPARTMENT_OPTIONS,
  normalizeDepartment,
  isValidDepartment,
  sanitizePhoneNumber,
  isValidPhoneNumber
} = require('../utils/validation');

const getWardenHostelNames = async (wardenId) => {
  const hostels = await Hostel.findAll({
    where: { wardenId },
    attributes: ['name'],
    raw: true
  });

  return hostels
    .map((hostel) => String(hostel.name || '').trim())
    .filter(Boolean);
};

const getWardenStudentIds = async (wardenId) => {
  const hostelNames = await getWardenHostelNames(wardenId);
  if (hostelNames.length === 0) return [];

  const allocations = await Allocation.findAll({
    where: { status: 'ACTIVE' },
    include: [{
      model: Room,
      where: {
        blockName: {
          [Op.in]: hostelNames
        }
      },
      attributes: []
    }],
    attributes: ['StudentId'],
    raw: true
  });

  return [...new Set(
    allocations
      .map((allocation) => Number(allocation.StudentId))
      .filter((studentId) => Number.isFinite(studentId) && studentId > 0)
  )];
};

const canWardenAccessStudent = async (wardenId, studentId) => {
  const wardenStudentIds = await getWardenStudentIds(wardenId);
  return wardenStudentIds.includes(Number(studentId));
};

// GET /api/students - Get all students
router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    let students = [];

    if (req.user.role === 'WARDEN') {
      const scopedStudentIds = await getWardenStudentIds(req.user.id);
      if (scopedStudentIds.length === 0) {
        return res.json([]);
      }

      students = await Student.findAll({
        where: {
          id: { [Op.in]: scopedStudentIds }
        },
        order: [['id', 'DESC']]
      });
    } else {
      students = await Student.findAll({
        order: [['id', 'DESC']]
      });
    }
    
    res.json(students.map(student => ({
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      address: student.address,
      department: student.department,
      year: student.year,
      dateOfBirth: student.dateOfBirth,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      bloodGroup: student.bloodGroup,
      gender: student.gender
    })));
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

// GET /api/students/:id - Get student by ID
router.get('/:id', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    if (req.user.role === 'WARDEN') {
      const hasAccess = await canWardenAccessStudent(req.user.id, req.params.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied for this student' });
      }
    }

    const student = await Student.findByPk(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      address: student.address,
      department: student.department,
      year: student.year,
      dateOfBirth: student.dateOfBirth,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      bloodGroup: student.bloodGroup,
      gender: student.gender
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error fetching student' });
  }
});

// POST /api/students - Create new student
router.post('/', async (req, res) => {
  try {
    const normalizedDepartment = normalizeDepartment(req.body.department);
    const normalizedPhone = sanitizePhoneNumber(req.body.phone);
    const normalizedGuardianPhone = sanitizePhoneNumber(req.body.guardianPhone);

    if (!isValidDepartment(normalizedDepartment)) {
      return res.status(400).json({ message: `Invalid department. Allowed values: ${DEPARTMENT_OPTIONS.join(', ')}` });
    }

    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    if (normalizedGuardianPhone && !isValidPhoneNumber(normalizedGuardianPhone)) {
      return res.status(400).json({ message: 'Guardian phone number must be exactly 10 digits.' });
    }

    const studentData = {
      studentId: req.body.studentId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: normalizedPhone,
      address: req.body.address,
      department: normalizedDepartment,
      year: req.body.year,
      dateOfBirth: req.body.dateOfBirth,
      guardianName: req.body.guardianName,
      guardianPhone: normalizedGuardianPhone || null,
      bloodGroup: req.body.bloodGroup,
      gender: req.body.gender
    };
    
    const student = await Student.create(studentData);
    
    res.json({
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      address: student.address,
      department: student.department,
      year: student.year,
      dateOfBirth: student.dateOfBirth,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      bloodGroup: student.bloodGroup,
      gender: student.gender
    });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.fields && (error.fields.student_id || error.fields.studentId)) {
        return res.status(400).json({ message: 'Student ID already exists. Please use a different Student ID.' });
      }
      if (error.fields && error.fields.email) {
        return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
      }
      return res.status(400).json({ message: 'A student with this information already exists.' });
    }
    res.status(500).json({ message: 'Server error creating student' });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const normalizedDepartment = normalizeDepartment(req.body.department);
    const normalizedPhone = sanitizePhoneNumber(req.body.phone);
    const normalizedGuardianPhone = sanitizePhoneNumber(req.body.guardianPhone);

    if (!isValidDepartment(normalizedDepartment)) {
      return res.status(400).json({ message: `Invalid department. Allowed values: ${DEPARTMENT_OPTIONS.join(', ')}` });
    }

    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    if (normalizedGuardianPhone && !isValidPhoneNumber(normalizedGuardianPhone)) {
      return res.status(400).json({ message: 'Guardian phone number must be exactly 10 digits.' });
    }

    await student.update({
      studentId: req.body.studentId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: normalizedPhone,
      address: req.body.address,
      department: normalizedDepartment,
      year: req.body.year,
      dateOfBirth: req.body.dateOfBirth,
      guardianName: req.body.guardianName,
      guardianPhone: normalizedGuardianPhone || null,
      bloodGroup: req.body.bloodGroup,
      gender: req.body.gender
    });
    
    res.json({
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      address: student.address,
      department: student.department,
      year: student.year,
      dateOfBirth: student.dateOfBirth,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      bloodGroup: student.bloodGroup,
      gender: student.gender
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error updating student' });
  }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    await student.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error deleting student' });
  }
});

module.exports = router;
