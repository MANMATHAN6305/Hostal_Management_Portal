const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const { Op } = require('sequelize');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

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

const syncRoomOccupancy = async (roomId) => {
  const room = await Room.findByPk(roomId);
  if (!room) return;

  const activeCount = await Allocation.count({
    where: {
      RoomId: room.id,
      status: 'ACTIVE'
    }
  });

  const occupied = Math.max(0, Math.min(Number(room.capacity) || 0, Number(activeCount) || 0));
  const status = room.status === 'MAINTENANCE' ? 'MAINTENANCE' : (occupied >= room.capacity ? 'OCCUPIED' : 'AVAILABLE');

  await room.update({
    occupied,
    status
  });
};

// Helper function to format allocation response
const formatAllocation = (allocation) => ({
  id: allocation.id,
  roomId: allocation.RoomId,
  studentId: allocation.StudentId,
  academicYear: allocation.academicYear,
  semester: allocation.semester,
  status: allocation.status,
  allocationDate: allocation.allocationDate,
  endDate: allocation.endDate,
  specialRequests: allocation.specialRequests,
  roomNumber: allocation.Room?.roomNumber,
  studentName: allocation.Student ? `${allocation.Student.firstName} ${allocation.Student.lastName}` : null,
  blockName: allocation.Room?.blockName
});

// GET /api/allocations - Get all allocations
router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    let include = [
      { model: Room, attributes: ['roomNumber', 'blockName'] },
      { model: Student, attributes: ['firstName', 'lastName'] }
    ];

    if (req.user.role === 'WARDEN') {
      const hostelScope = await getWardenHostelScope(req.user.id);
      const roomWhere = getWardenRoomWhere(hostelScope);

      if (!roomWhere) {
        return res.json([]);
      }

      include = [
        {
          model: Room,
          attributes: ['roomNumber', 'blockName'],
          where: roomWhere
        },
        { model: Student, attributes: ['firstName', 'lastName'] }
      ];
    }

    const allocations = await Allocation.findAll({
      include,
      order: [['id', 'DESC']]
    });
    
    res.json(allocations.map(formatAllocation));
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ message: 'Server error fetching allocations' });
  }
});

// GET /api/allocations/:id - Get allocation by ID
router.get('/:id', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    let allocation = null;

    if (req.user.role === 'WARDEN') {
      const hostelScope = await getWardenHostelScope(req.user.id);
      const roomWhere = getWardenRoomWhere(hostelScope);
      if (!roomWhere) {
        return res.status(404).json({ message: 'Allocation not found' });
      }

      allocation = await Allocation.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: Room,
            attributes: ['roomNumber', 'blockName'],
            where: roomWhere
          },
          { model: Student, attributes: ['firstName', 'lastName'] }
        ]
      });
    } else {
      allocation = await Allocation.findByPk(req.params.id, {
        include: [
          { model: Room, attributes: ['roomNumber', 'blockName'] },
          { model: Student, attributes: ['firstName', 'lastName'] }
        ]
      });
    }
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    res.json(formatAllocation(allocation));
  } catch (error) {
    console.error('Get allocation error:', error);
    res.status(500).json({ message: 'Server error fetching allocation' });
  }
});

// POST /api/allocations - Create new allocation
router.post('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    const { roomId, studentId, academicYear, semester, allocationDate, endDate, specialRequests } = req.body;

    // Step 1: Check if room exists and is available
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (req.user.role === 'WARDEN') {
      const hostelScope = await getWardenHostelScope(req.user.id);
      const roomWhere = getWardenRoomWhere(hostelScope);
      if (!roomWhere) {
        return res.status(403).json({ message: 'No assigned hostel found for this warden.' });
      }

      const canAccessRoom = await Room.findOne({
        where: {
          id: room.id,
          ...roomWhere
        }
      });

      if (!canAccessRoom) {
        return res.status(403).json({ message: 'You can only allocate rooms in your assigned hostels.' });
      }
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!['MALE', 'FEMALE'].includes(student.gender)) {
      return res.status(400).json({ message: 'Student gender must be set before allocation.' });
    }

    if (room.gender !== student.gender) {
      return res.status(400).json({ message: `Selected room is ${room.gender.toLowerCase()} only.` });
    }

    // Step 2: Verify room availability (check if occupied < capacity)
    if (room.status === 'MAINTENANCE') {
      return res.status(400).json({ message: 'Room is under maintenance and cannot be allocated' });
    }

    if (room.occupied >= room.capacity) {
      return res.status(400).json({ message: 'Room is fully occupied. No beds available.' });
    }

    // Step 3: Check if student is already allocated to a room in the same academic year/semester
    const existingAllocation = await Allocation.findOne({
      where: {
        StudentId: studentId,
        academicYear: academicYear,
        semester: semester,
        status: 'ACTIVE'
      }
    });

    if (existingAllocation) {
      return res.status(400).json({ message: 'Student already has an active room allocation for this academic year/semester' });
    }

    // Step 4: Create the allocation
    const allocationData = {
      RoomId: roomId,
      StudentId: studentId,
      academicYear: academicYear,
      semester: semester,
      status: req.body.status || 'ACTIVE',
      allocationDate: allocationDate,
      endDate: endDate,
      specialRequests: specialRequests
    };
    
    const allocation = await Allocation.create(allocationData);

    // Step 5: Update room occupied count and status only for active allocations
    if (allocation.status === 'ACTIVE') {
      await syncRoomOccupancy(room.id);
    }
    
    // Fetch the allocation with related data
    const createdAllocation = await Allocation.findByPk(allocation.id, {
      include: [
        { model: Room, attributes: ['roomNumber', 'blockName'] },
        { model: Student, attributes: ['firstName', 'lastName'] }
      ]
    });
    
    res.json(formatAllocation(createdAllocation));
  } catch (error) {
    console.error('Create allocation error:', error);
    res.status(500).json({ message: 'Server error creating allocation' });
  }
});

// PUT /api/allocations/:id - Update allocation
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    const allocation = await Allocation.findByPk(req.params.id);
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    const oldRoomId = Number(allocation.RoomId);
    const oldStatus = allocation.status;
    const newRoomId = req.body.roomId ? Number(req.body.roomId) : oldRoomId;
    const newStatus = req.body.status;
    const nextStudentId = req.body.studentId ? Number(req.body.studentId) : allocation.StudentId;

    const nextStudent = await Student.findByPk(nextStudentId);
    if (!nextStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!['MALE', 'FEMALE'].includes(nextStudent.gender)) {
      return res.status(400).json({ message: 'Student gender must be set before allocation.' });
    }

    if (req.user.role === 'WARDEN') {
      const hostelScope = await getWardenHostelScope(req.user.id);
      const roomWhere = getWardenRoomWhere(hostelScope);
      if (!roomWhere) {
        return res.status(403).json({ message: 'No assigned hostel found for this warden.' });
      }

      const isCurrentRoomAccessible = await Room.findOne({
        where: {
          id: oldRoomId,
          ...roomWhere
        }
      });

      if (!isCurrentRoomAccessible) {
        return res.status(403).json({ message: 'You can only manage allocations in your assigned hostels.' });
      }
    }

    // Handle room change
    if (newRoomId !== oldRoomId) {
      // Check if new room is available
      const newRoom = await Room.findByPk(newRoomId);
      if (!newRoom) {
        return res.status(404).json({ message: 'New room not found' });
      }
      if (newRoom.status === 'MAINTENANCE') {
        return res.status(400).json({ message: 'New room is under maintenance' });
      }
      if (newRoom.occupied >= newRoom.capacity) {
        return res.status(400).json({ message: 'New room is fully occupied' });
      }
      if (newRoom.gender !== nextStudent.gender) {
        return res.status(400).json({ message: `Selected room is ${newRoom.gender.toLowerCase()} only.` });
      }

      if (req.user.role === 'WARDEN') {
        const hostelScope = await getWardenHostelScope(req.user.id);
        const roomWhere = getWardenRoomWhere(hostelScope);
        const isNewRoomAccessible = roomWhere ? await Room.findOne({
          where: {
            id: newRoom.id,
            ...roomWhere
          }
        }) : null;

        if (!isNewRoomAccessible) {
          return res.status(403).json({ message: 'New room must belong to your assigned hostels.' });
        }
      }
    } else if (newStatus !== oldStatus) {
      // Status change without room change
      const room = await Room.findByPk(oldRoomId);
      if (room && oldStatus !== 'ACTIVE' && newStatus === 'ACTIVE' && room.occupied >= room.capacity) {
        return res.status(400).json({ message: 'Room is fully occupied. Cannot reactivate allocation.' });
      }
    } else {
      const currentRoom = await Room.findByPk(oldRoomId);
      if (currentRoom && currentRoom.gender !== nextStudent.gender) {
        return res.status(400).json({ message: `Selected room is ${currentRoom.gender.toLowerCase()} only.` });
      }
    }
    
    await allocation.update({
      RoomId: newRoomId,
      StudentId: nextStudentId,
      academicYear: req.body.academicYear,
      semester: req.body.semester,
      status: req.body.status,
      allocationDate: req.body.allocationDate,
      endDate: req.body.endDate,
      specialRequests: req.body.specialRequests
    });

    if (newRoomId !== oldRoomId) {
      await syncRoomOccupancy(oldRoomId);
      await syncRoomOccupancy(newRoomId);
    } else if (newStatus !== oldStatus) {
      await syncRoomOccupancy(oldRoomId);
    }
    
    // Fetch the updated allocation with related data
    const updatedAllocation = await Allocation.findByPk(allocation.id, {
      include: [
        { model: Room, attributes: ['roomNumber', 'blockName'] },
        { model: Student, attributes: ['firstName', 'lastName'] }
      ]
    });
    
    res.json(formatAllocation(updatedAllocation));
  } catch (error) {
    console.error('Update allocation error:', error);
    res.status(500).json({ message: 'Server error updating allocation' });
  }
});

// DELETE /api/allocations/:id - Delete allocation
router.delete('/:id', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    const allocation = await Allocation.findByPk(req.params.id);
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (req.user.role === 'WARDEN') {
      const hostelScope = await getWardenHostelScope(req.user.id);
      const roomWhere = getWardenRoomWhere(hostelScope);
      if (!roomWhere) {
        return res.status(403).json({ message: 'No assigned hostel found for this warden.' });
      }

      const canAccessAllocation = await Allocation.findOne({
        where: { id: allocation.id },
        include: [{
          model: Room,
          required: true,
          where: roomWhere,
          attributes: ['id']
        }]
      });

      if (!canAccessAllocation) {
        return res.status(403).json({ message: 'You can only delete allocations in your assigned hostels.' });
      }
    }

    // If allocation was active, update room occupancy
    const previousRoomId = Number(allocation.RoomId);
    
    await allocation.destroy();

    if (allocation.status === 'ACTIVE') {
      await syncRoomOccupancy(previousRoomId);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete allocation error:', error);
    res.status(500).json({ message: 'Server error deleting allocation' });
  }
});

module.exports = router;
