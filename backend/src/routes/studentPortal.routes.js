const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const Complaint = require('../models/Complaint');
const Menu = require('../models/Menu');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const { verifyToken, isStudent } = require('../middleware/auth');

const roomTypeCapacityMap = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  FOUR_BED: 4,
  FIVE_BED: 5,
  EIGHT_BED: 8,
  DORMITORY: 10
};

const getCapacityFromRoomType = (roomType, fallbackCapacity = 1) => {
  const mapped = roomTypeCapacityMap[roomType];
  if (mapped) return mapped;

  const parsedFallback = Number(fallbackCapacity);
  if (Number.isFinite(parsedFallback) && parsedFallback > 0) return parsedFallback;

  return 1;
};

const getRoomOccupancyDetails = async (room) => {
  if (!room) {
    return {
      capacity: 0,
      currentOccupancy: 0,
      availableBeds: 0
    };
  }

  const capacity = getCapacityFromRoomType(room.roomType, room.capacity);
  const occupiedCount = await Allocation.count({
    where: {
      RoomId: room.id,
      status: 'ACTIVE'
    }
  });

  const currentOccupancy = Math.max(0, Math.min(capacity, Number(occupiedCount) || 0));

  return {
    capacity,
    currentOccupancy,
    availableBeds: Math.max(0, capacity - currentOccupancy)
  };
};

async function getStudentFromTokenUser(tokenUser) {
  return Student.findOne({ where: { email: tokenUser.email } });
}

async function getUserFromTokenUser(tokenUser) {
  return User.findByPk(tokenUser.id, { attributes: ['id', 'fullName', 'email', 'role'] });
}

// GET /api/student/me - Get student profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const student = await getStudentFromTokenUser(req.user);
    
    if (!student) {
      const user = await getUserFromTokenUser(req.user);
      const nameParts = (user?.fullName || req.user.fullName || '').trim().split(/\s+/);
      return res.json({
        success: true,
        profileCompleted: false,
        student: {
          id: null,
          studentId: null,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user?.email || req.user.email,
          phone: null,
          department: null,
          year: null,
          gender: null,
          bloodGroup: null,
          guardianName: null,
          guardianPhone: null,
          address: null
        }
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
    const student = await getStudentFromTokenUser(req.user);
    
    if (!student) {
      return res.json({ 
        success: true,
        allocated: false,
        message: 'No profile yet. Submit Apply Hostel form first.',
        room: null,
        allocation: null
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
        attributes: ['id', 'roomNumber', 'roomType', 'capacity', 'occupied', 'floorNumber', 'blockName', 'status', 'pricePerNight', 'amenities', 'description']
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

    const occupancy = await getRoomOccupancyDetails(allocation.Room);

    res.json({
      success: true,
      allocated: true,
      room: {
        id: allocation.Room.id,
        roomNumber: allocation.Room.roomNumber,
        roomType: allocation.Room.roomType,
        capacity: occupancy.capacity,
        currentOccupancy: occupancy.currentOccupancy,
        availableBeds: occupancy.availableBeds,
        floorNumber: allocation.Room.floorNumber,
        blockName: allocation.Room.blockName,
        status: allocation.status === 'ACTIVE' ? 'Allocated' : 'Available',
        semesterFee: Number(allocation.Room.pricePerNight) || 0,
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
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    let targetWeek = monday.toISOString().split('T')[0];

    let menu = await Menu.findAll({
      where: { weekStartDate: targetWeek },
      order: [['day', 'ASC']]
    });

    if (menu.length === 0) {
      const latestWeek = await Menu.findOne({
        attributes: ['weekStartDate'],
        order: [['weekStartDate', 'DESC']]
      });

      if (!latestWeek?.weekStartDate) {
        return res.json({
          success: true,
          menu: [],
          weekStart: null
        });
      }

      targetWeek = latestWeek.weekStartDate;
      menu = await Menu.findAll({
        where: { weekStartDate: targetWeek },
        order: [['day', 'ASC']]
      });
    }

    return res.json({
      success: true,
      menu,
      weekStart: targetWeek
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

    const student = await getStudentFromTokenUser(req.user);
    
    if (!student) {
      return res.status(400).json({ 
        success: false, 
        message: 'Complete Apply Hostel form before raising complaints.' 
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
    const student = await getStudentFromTokenUser(req.user);
    
    if (!student) {
      return res.status(400).json({ 
        success: false, 
        message: 'Complete Apply Hostel form first.' 
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
    const student = await getStudentFromTokenUser(req.user);
    
    if (!student) {
      const user = await getUserFromTokenUser(req.user);
      const nameParts = (user?.fullName || req.user.fullName || '').trim().split(/\s+/);

      return res.json({
        success: true,
        profileCompleted: false,
        student: {
          id: null,
          studentId: null,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user?.email || req.user.email,
          phone: null,
          department: null,
          year: null,
          gender: null
        },
        room: null,
        allocation: null,
        warden: null,
        stats: {
          pendingComplaints: 0,
          totalComplaints: 0
        },
        message: 'Complete Apply Hostel form to create your student profile.'
      });
    }

    // Get room allocation
    const hostelWardenInclude = [{
      model: User,
      as: 'warden',
      attributes: ['id', 'fullName', 'email', 'phone']
    }];

    const allocation = await Allocation.findOne({
      where: { 
        StudentId: student.id,
        status: { [Op.ne]: 'VACATED' }
      },
      include: [{
        model: Room,
        attributes: ['id', 'roomNumber', 'roomType', 'capacity', 'occupied', 'floorNumber', 'blockName', 'status', 'pricePerNight', 'amenities', 'hostelId'],
        include: [{
          model: Hostel,
          as: 'hostel',
          attributes: ['id', 'name', 'blockCode', 'wardenId'],
          include: hostelWardenInclude
        }]
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

    const toWardenInfo = (hostel) => {
      if (!hostel?.warden) return null;
      return {
        name: hostel.warden.fullName,
        email: hostel.warden.email,
        phone: hostel.warden.phone || null
      };
    };

    // Get assigned warden info from allocated room's hostel
    let wardenInfo = null;
    if (allocation?.Room) {
      // Prefer direct Room -> Hostel -> Warden relation if present
      wardenInfo = toWardenInfo(allocation.Room.hostel);

      let hostel = null;
      
      // Try to find hostel by hostelId first
      if (!wardenInfo && allocation.Room.hostelId) {
        hostel = await Hostel.findByPk(allocation.Room.hostelId, {
          include: hostelWardenInclude
        });
      }
      
      // If not found by hostelId, try to match by blockName
      const roomBlockName = String(allocation.Room.blockName || '').trim();
      if (!wardenInfo && !hostel && roomBlockName) {
        hostel = await Hostel.findOne({
          where: {
            [Op.or]: [
              { name: roomBlockName },
              { name: { [Op.like]: `%${roomBlockName}%` } },
              { blockCode: roomBlockName },
              { blockCode: { [Op.like]: `${roomBlockName}%` } }
            ]
          },
          include: hostelWardenInclude
        });
      }
      
      // If still not found, try to match by room number prefix
      const roomPrefix = String(allocation.Room.roomNumber || '').split('-')[0].trim();
      if (!wardenInfo && !hostel && roomPrefix) {
        hostel = await Hostel.findOne({
          where: {
            [Op.or]: [
              { blockCode: roomPrefix },
              { blockCode: { [Op.like]: `${roomPrefix}%` } },
              { name: { [Op.like]: `${roomPrefix}%` } }
            ]
          },
          include: hostelWardenInclude
        });
      }
      
      if (!wardenInfo) {
        wardenInfo = toWardenInfo(hostel);
      }
    }

    const roomOccupancy = allocation?.Room ? await getRoomOccupancyDetails(allocation.Room) : null;

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
        capacity: roomOccupancy?.capacity || 0,
        currentOccupancy: roomOccupancy?.currentOccupancy || 0,
        availableBeds: roomOccupancy?.availableBeds || 0,
        semesterFee: Number(allocation.Room.pricePerNight) || 0,
        status: allocation.status === 'ACTIVE' ? 'Allocated' : 'Available',
        amenities: allocation.Room.amenities
      } : null,
      allocation: allocation ? {
        academicYear: allocation.academicYear,
        semester: allocation.semester,
        status: allocation.status,
        allocationDate: allocation.allocationDate
      } : null,
      warden: wardenInfo,
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
