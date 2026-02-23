const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET /api/students - Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.findAll({
      order: [['id', 'DESC']]
    });
    
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
router.get('/:id', async (req, res) => {
  try {
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
    const studentData = {
      studentId: req.body.studentId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      department: req.body.department,
      year: req.body.year,
      dateOfBirth: req.body.dateOfBirth,
      guardianName: req.body.guardianName,
      guardianPhone: req.body.guardianPhone,
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
    
    await student.update({
      studentId: req.body.studentId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      department: req.body.department,
      year: req.body.year,
      dateOfBirth: req.body.dateOfBirth,
      guardianName: req.body.guardianName,
      guardianPhone: req.body.guardianPhone,
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
