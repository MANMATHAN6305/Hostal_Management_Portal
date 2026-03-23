const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Student = require('../models/Student');
const Allocation = require('../models/Allocation');
const { verifyToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { sanitizePhoneNumber, isValidPhoneNumber } = require('../utils/validation');

const normalizeGender = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'male') return 'male';
  if (normalized === 'female') return 'female';
  if (normalized === 'other') return 'other';
  return null;
};

// GET /api/admin/wardens - Get all wardens
router.get('/wardens', verifyToken, isAdmin, async (req, res) => {
  try {
    const wardens = await User.findAll({
      where: { role: 'WARDEN' },
      attributes: ['id', 'fullName', 'email', 'phone', 'gender', 'isActive', 'createdAt'],
      include: [{
        model: Hostel,
        as: 'assignedHostels',
        attributes: ['id', 'name', 'blockCode', 'gender', 'totalRooms'],
        required: false
      }]
    });

    console.log('Fetched wardens:', wardens.length, 'wardens');

    res.json({
      success: true,
      wardens: wardens.map(w => ({
        id: w.id,
        fullName: w.fullName || '',
        email: w.email,
        phone: w.phone,
        gender: w.gender,
        isActive: w.isActive,
        createdAt: w.createdAt,
        assignedHostel: w.assignedHostels?.[0] || null
      }))
    });
  } catch (error) {
    console.error('Get wardens error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching wardens' 
    });
  }
});

// GET /api/admin/wardens/:id - Get warden details with hostel stats
router.get('/wardens/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const warden = await User.findOne({
      where: { id: req.params.id, role: 'WARDEN' },
      attributes: ['id', 'fullName', 'email', 'phone', 'gender', 'isActive', 'createdAt']
    });

    if (!warden) {
      return res.status(404).json({
        success: false,
        message: 'Warden not found'
      });
    }

    // Get assigned hostel
    const hostel = await Hostel.findOne({
      where: { wardenId: req.params.id }
    });

    let hostelStats = null;
    if (hostel) {
      // Get rooms in this hostel
      const rooms = await Room.findAll({
        where: { hostelId: hostel.id },
        attributes: ['id', 'roomNumber', 'capacity']
      });

      const roomIds = rooms
        .map((room) => Number(room.id))
        .filter((roomId) => Number.isFinite(roomId));

      let allocations = [];
      if (roomIds.length > 0) {
        allocations = await Allocation.findAll({
          where: {
            status: 'ACTIVE',
            RoomId: { [Op.in]: roomIds }
          },
          attributes: ['RoomId', 'StudentId'],
          include: [{
            model: Student,
            attributes: ['id', 'studentId', 'firstName', 'lastName', 'department']
          }]
        });
      }

      const studentsByRoom = new Map();
      const uniqueStudentIds = new Set();

      allocations.forEach((allocation) => {
        const roomId = Number(allocation.RoomId);
        if (!Number.isFinite(roomId)) return;

        if (!studentsByRoom.has(roomId)) {
          studentsByRoom.set(roomId, []);
        }

        if (allocation.Student) {
          studentsByRoom.get(roomId).push(allocation.Student);
          uniqueStudentIds.add(Number(allocation.Student.id));
        }
      });

      const roomStats = rooms.map((room) => {
        const roomId = Number(room.id);
        const students = studentsByRoom.get(roomId) || [];
        const capacity = Number(room.capacity) || 0;
        const currentOccupancy = students.length;

        return {
          id: room.id,
          roomNumber: room.roomNumber,
          capacity,
          currentOccupancy,
          status: capacity > 0 && currentOccupancy >= capacity ? 'Full' : 'Available',
          students
        };
      });

      const occupiedRooms = roomStats.filter((room) => room.currentOccupancy > 0).length;
      const availableRooms = roomStats.filter((room) => room.currentOccupancy < room.capacity).length;

      hostelStats = {
        hostel: {
          id: hostel.id,
          name: hostel.name,
          blockCode: hostel.blockCode,
          gender: hostel.gender,
          totalRooms: hostel.totalRooms
        },
        totalRooms: roomStats.length,
        occupiedRooms,
        availableRooms,
        totalStudents: uniqueStudentIds.size,
        rooms: roomStats
      };
    }

    res.json({
      success: true,
      warden: {
        id: warden.id,
        fullName: warden.fullName,
        email: warden.email,
        phone: warden.phone,
        gender: warden.gender,
        isActive: warden.isActive,
        createdAt: warden.createdAt
      },
      hostelStats
    });
  } catch (error) {
    console.error('Get warden details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching warden details' 
    });
  }
});

// POST /api/admin/wardens - Create new warden
router.post('/wardens', verifyToken, isAdmin, async (req, res) => {
  try {
    const { fullName, email, password, phone, gender, hostelId } = req.body;
    const normalizedFullName = String(fullName || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedGender = normalizeGender(gender);
    const normalizedPhone = phone ? sanitizePhoneNumber(phone) : '';

    if (!normalizedFullName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    if (gender !== undefined && gender !== null && !normalizedGender) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender. Allowed values: male, female, other'
      });
    }

    if (normalizedPhone && !isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits.'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // If hostelId provided, check if hostel already has a warden
    if (hostelId) {
      const hostel = await Hostel.findByPk(hostelId);
      if (!hostel) {
        return res.status(404).json({
          success: false,
          message: 'Hostel not found'
        });
      }

      if (hostel.wardenId) {
        return res.status(400).json({
          success: false,
          message: 'This hostel already has an assigned warden'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create warden
    const warden = await User.create({
      fullName: normalizedFullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone || null,
      gender: normalizedGender,
      role: 'WARDEN',
      isActive: true
    });

    // Assign to hostel if provided
    if (hostelId) {
      await Hostel.update(
        { wardenId: warden.id },
        { where: { id: hostelId } }
      );
    }

    res.json({
      success: true,
      message: 'Warden created successfully',
      warden: {
        id: warden.id,
        fullName: warden.fullName,
        email: warden.email,
        phone: warden.phone,
        gender: warden.gender
      }
    });
  } catch (error) {
    console.error('Create warden error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating warden' 
    });
  }
});

// PUT /api/admin/wardens/:id - Update warden
router.put('/wardens/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { fullName, email, phone, gender, hostelId, isActive, password } = req.body;
    const normalizedEmail = email !== undefined ? String(email || '').trim().toLowerCase() : undefined;
    const normalizedGender = gender !== undefined ? normalizeGender(gender) : undefined;
    const normalizedPhone = phone !== undefined && phone !== null ? sanitizePhoneNumber(phone) : undefined;

    const warden = await User.findOne({
      where: { id: req.params.id, role: 'WARDEN' }
    });

    if (!warden) {
      return res.status(404).json({
        success: false,
        message: 'Warden not found'
      });
    }

    // Check email uniqueness if changing
    if (normalizedEmail && normalizedEmail !== warden.email) {
      const existingUser = await User.findOne({ where: { email: normalizedEmail } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    if (gender !== undefined && gender !== null && !normalizedGender) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender. Allowed values: male, female, other'
      });
    }

    if (phone !== undefined && phone !== null && String(phone).trim() !== '' && !isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits.'
      });
    }

    // Handle hostel reassignment
    if (hostelId !== undefined) {
      // Remove from current hostel
      await Hostel.update(
        { wardenId: null },
        { where: { wardenId: warden.id } }
      );

      if (hostelId) {
        const hostel = await Hostel.findByPk(hostelId);
        if (!hostel) {
          return res.status(404).json({
            success: false,
            message: 'Hostel not found'
          });
        }

        if (hostel.wardenId && hostel.wardenId !== warden.id) {
          return res.status(400).json({
            success: false,
            message: 'This hostel already has an assigned warden'
          });
        }

        await Hostel.update(
          { wardenId: warden.id },
          { where: { id: hostelId } }
        );
      }
    }

    // Update warden details
    if (fullName) warden.fullName = String(fullName).trim();
    if (normalizedEmail) warden.email = normalizedEmail;
    if (phone !== undefined) warden.phone = String(phone || '').trim() ? normalizedPhone : null;
    if (gender !== undefined) warden.gender = normalizedGender;
    if (isActive !== undefined) warden.isActive = isActive;
    if (password) {
      warden.password = await bcrypt.hash(password, 10);
    }

    await warden.save();

    res.json({
      success: true,
      message: 'Warden updated successfully',
      warden: {
        id: warden.id,
        fullName: warden.fullName,
        email: warden.email,
        phone: warden.phone,
        gender: warden.gender,
        isActive: warden.isActive
      }
    });
  } catch (error) {
    console.error('Update warden error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating warden' 
    });
  }
});

// DELETE /api/admin/wardens/:id - Delete warden
router.delete('/wardens/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const warden = await User.findOne({
      where: { id: req.params.id, role: 'WARDEN' }
    });

    if (!warden) {
      return res.status(404).json({
        success: false,
        message: 'Warden not found'
      });
    }

    // Remove warden assignment from hostel
    await Hostel.update(
      { wardenId: null },
      { where: { wardenId: warden.id } }
    );

    // Delete warden
    await warden.destroy();

    res.json({
      success: true,
      message: 'Warden deleted successfully'
    });
  } catch (error) {
    console.error('Delete warden error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting warden' 
    });
  }
});

module.exports = router;
