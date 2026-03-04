const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Student = require('../models/Student');
const { verifyToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

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
        include: [{
          model: Student,
          as: 'students',
          attributes: ['id', 'studentId', 'firstName', 'lastName', 'department']
        }]
      });

      const totalStudents = await Student.count({
        include: [{
          model: Room,
          where: { hostelId: hostel.id }
        }]
      });

      const occupiedRooms = rooms.filter(r => r.students && r.students.length > 0).length;
      const availableRooms = rooms.filter(r => !r.students || r.students.length < r.capacity).length;

      hostelStats = {
        hostel: {
          id: hostel.id,
          name: hostel.name,
          blockCode: hostel.blockCode,
          gender: hostel.gender,
          totalRooms: hostel.totalRooms
        },
        totalRooms: rooms.length,
        occupiedRooms,
        availableRooms,
        totalStudents,
        rooms: rooms.map(r => ({
          id: r.id,
          roomNumber: r.roomNumber,
          capacity: r.capacity,
          currentOccupancy: r.students?.length || 0,
          status: r.students?.length >= r.capacity ? 'Full' : 'Available',
          students: r.students || []
        }))
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

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
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
      fullName,
      email,
      password: hashedPassword,
      phone,
      gender,
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
    if (email && email !== warden.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
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
    if (fullName) warden.fullName = fullName;
    if (email) warden.email = email;
    if (phone !== undefined) warden.phone = phone;
    if (gender) warden.gender = gender;
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
