const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const Complaint = require('../models/Complaint');
const Menu = require('../models/Menu');
const { verifyToken, isStudent } = require('../middleware/auth');

// GET /api/student/me - Get student profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const student = await Student.findOne({ 
      where: { email: req.user.email }
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    res.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        department: student.department,
        year: student.year,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        address: student.address
      }
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching profile' 
    });
  }
});

// GET /api/student/room - Get room details for student
router.get('/room', verifyToken, async (req, res) => {
  try {
    const student = await Student.findOne({ 
      where: { email: req.user.email }
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Find active allocation for this student
    const allocation = await Allocation.findOne({
      where: { 
        StudentId: student.id,
        status: { [Op.ne]: 'VACATED' }
      },
      include: [{
        model: Room,
        attributes: ['id', 'roomNumber', 'roomType', 'floorNumber', 'blockName', 'status', 'amenities', 'description']
      }],
      order: [['createdAt', 'DESC']]
    });

    if (!allocation || !allocation.Room) {
      return res.json({
        success: true,
        allocated: false,
        message: 'No room allocated yet',
        room: null,
        allocation: null
      });
    }

    res.json({
      success: true,
      allocated: true,
      room: {
        id: allocation.Room.id,
        roomNumber: allocation.Room.roomNumber,
        roomType: allocation.Room.roomType,
        floorNumber: allocation.Room.floorNumber,
        blockName: allocation.Room.blockName,
        status: allocation.Room.status,
        amenities: allocation.Room.amenities,
        description: allocation.Room.description
      },
      allocation: {
        id: allocation.id,
        academicYear: allocation.academicYear,
        semester: allocation.semester,
        status: allocation.status,
        allocationDate: allocation.allocationDate,
        endDate: allocation.endDate
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching room details' 
    });
  }
});

// GET /api/student/menu - Get weekly menu
router.get('/menu', verifyToken, async (req, res) => {
  try {
    // Get current week's start date (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const menu = await Menu.findAll({
      where: {
        weekStartDate: {
          [Op.gte]: weekStart.toISOString().split('T')[0]
        }
      },
      order: [
        ['weekStartDate', 'ASC'],
        ['day', 'ASC']
      ]
    });

    // If no menu found for current week, get the latest menu
    if (menu.length === 0) {
      const latestMenu = await Menu.findAll({
        order: [
          ['weekStartDate', 'DESC'],
          ['day', 'ASC']
        ],
        limit: 7
      });
      
      return res.json({
        success: true,
        menu: latestMenu,
        weekStart: latestMenu[0]?.weekStartDate || null
      });
    }

    res.json({
      success: true,
      menu: menu,
      weekStart: weekStart.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching menu' 
    });
  }
});

// POST /api/student/complaint - Submit a complaint
router.post('/complaint', verifyToken, async (req, res) => {
  try {
    const { message, category } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Complaint message is required'
      });
    }

    const student = await Student.findOne({ 
      where: { email: req.user.email }
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    const complaint = await Complaint.create({
      StudentId: student.id,
      message: message.trim(),
      category: category || 'OTHER',
      status: 'PENDING'
    });

    res.json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: {
        id: complaint.id,
        message: complaint.message,
        category: complaint.category,
        status: complaint.status,
        createdAt: complaint.createdAt
      }
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error submitting complaint' 
    });
  }
});

// GET /api/student/complaints - Get student's complaints
router.get('/complaints', verifyToken, async (req, res) => {
  try {
    const student = await Student.findOne({ 
      where: { email: req.user.email }
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    const complaints = await Complaint.findAll({
      where: { StudentId: student.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      complaints: complaints.map(c => ({
        id: c.id,
        message: c.message,
        category: c.category,
        status: c.status,
        adminReply: c.adminReply,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching complaints' 
    });
  }
});

// GET /api/student/dashboard - Get all dashboard data at once
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const student = await Student.findOne({ 
      where: { email: req.user.email }
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found. Please contact admin.' 
      });
    }

    // Get room allocation
    const allocation = await Allocation.findOne({
      where: { 
        StudentId: student.id,
        status: { [Op.ne]: 'VACATED' }
      },
      include: [{
        model: Room,
        attributes: ['id', 'roomNumber', 'roomType', 'floorNumber', 'blockName', 'status', 'amenities']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Get complaints count
    const complaintStats = await Complaint.findAll({
      where: { StudentId: student.id },
      attributes: ['status']
    });

    const pendingComplaints = complaintStats.filter(c => c.status === 'PENDING').length;
    const totalComplaints = complaintStats.length;

    res.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        department: student.department,
        year: student.year,
        gender: student.gender
      },
      room: allocation?.Room ? {
        roomNumber: allocation.Room.roomNumber,
        roomType: allocation.Room.roomType,
        floorNumber: allocation.Room.floorNumber,
        blockName: allocation.Room.blockName,
        amenities: allocation.Room.amenities
      } : null,
      allocation: allocation ? {
        academicYear: allocation.academicYear,
        semester: allocation.semester,
        status: allocation.status,
        allocationDate: allocation.allocationDate
      } : null,
      stats: {
        pendingComplaints,
        totalComplaints
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching dashboard data' 
    });
  }
});

module.exports = router;
