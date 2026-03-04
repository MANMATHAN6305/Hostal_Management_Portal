const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const User = require('../models/User');
const Allocation = require('../models/Allocation');
const { Op, fn, col } = require('sequelize');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

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
  const mappedCapacity = roomTypeCapacityMap[roomType];
  if (mappedCapacity) return mappedCapacity;

  const parsedFallback = Number(fallbackCapacity);
  if (Number.isFinite(parsedFallback) && parsedFallback > 0) return parsedFallback;

  return 1;
};

const getActiveOccupancyMap = async (roomIds = []) => {
  if (!Array.isArray(roomIds) || roomIds.length === 0) return {};

  const allocationRows = await Allocation.findAll({
    where: {
      RoomId: { [Op.in]: roomIds },
      status: 'ACTIVE'
    },
    attributes: ['RoomId', [fn('COUNT', col('id')), 'occupiedCount']],
    group: ['RoomId'],
    raw: true
  });

  return allocationRows.reduce((acc, row) => {
    const roomId = Number(row.RoomId);
    if (Number.isNaN(roomId)) return acc;
    acc[roomId] = Number(row.occupiedCount) || 0;
    return acc;
  }, {});
};

// Helper function to format room response
const formatRoom = (room, occupancyMap = null, hostelData = null) => {
  const capacity = getCapacityFromRoomType(room.roomType, room.capacity);
  const occupiedFromAllocations =
    occupancyMap && Object.prototype.hasOwnProperty.call(occupancyMap, Number(room.id))
      ? Number(occupancyMap[Number(room.id)])
      : Number(room.occupied);
  const occupied = Math.max(0, Math.min(capacity, Number.isFinite(occupiedFromAllocations) ? occupiedFromAllocations : 0));
  const computedStatus = room.status === 'MAINTENANCE' ? 'MAINTENANCE' : (occupied >= capacity ? 'OCCUPIED' : 'AVAILABLE');

  const formattedRoom = {
    id: room.id,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    capacity,
    occupied,
    availableBeds: Math.max(0, capacity - occupied),
    floorNumber: room.floorNumber,
    blockName: room.blockName,
    gender: room.gender,
    status: computedStatus,
    pricePerNight: room.pricePerNight,
    description: room.description,
    amenities: room.amenities,
    hostelId: room.hostelId
  };

  // Add hostel information if available
  if (hostelData || room.hostel) {
    const hostel = hostelData || room.hostel;
    formattedRoom.hostel = {
      id: hostel.id,
      name: hostel.name,
      gender: hostel.gender,
      totalRooms: hostel.totalRooms,
      warden: hostel.warden ? {
        id: hostel.warden.id,
        fullName: hostel.warden.fullName,
        email: hostel.warden.email
      } : null
    };
  }

  return formattedRoom;
};

// GET /api/rooms - Get all rooms
router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT'), async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [
        {
          model: Hostel,
          as: 'hostel',
          include: [
            {
              model: User,
              as: 'warden',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        }
      ],
      order: [['id', 'DESC']]
    });

    const occupancyMap = await getActiveOccupancyMap(rooms.map((room) => Number(room.id)));
    
    res.json(rooms.map((room) => formatRoom(room, occupancyMap)));
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// GET /api/rooms/available - Get available rooms
router.get('/available', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT'), async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: {
        status: { [Op.ne]: 'MAINTENANCE' }
      },
      include: [
        {
          model: Hostel,
          as: 'hostel',
          include: [
            {
              model: User,
              as: 'warden',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        }
      ],
      order: [['roomNumber', 'ASC']]
    });

    const occupancyMap = await getActiveOccupancyMap(rooms.map((room) => Number(room.id)));
    const availableRooms = rooms
      .map((room) => formatRoom(room, occupancyMap))
      .filter((room) => room.status === 'AVAILABLE');
    
    res.json(availableRooms);
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Server error fetching available rooms' });
  }
});

// GET /api/rooms/:id - Get room by ID
router.get('/:id', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT'), async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [
        {
          model: Hostel,
          as: 'hostel',
          include: [
            {
              model: User,
              as: 'warden',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        }
      ]
    });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const occupancyMap = await getActiveOccupancyMap([Number(room.id)]);

    res.json(formatRoom(room, occupancyMap));
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error fetching room' });
  }
});

// POST /api/rooms - Create new room
router.post('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const roomType = req.body.roomType || 'DOUBLE';
    const capacity = getCapacityFromRoomType(roomType, req.body.capacity);
    const status = req.body.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE';

    const roomData = {
      roomNumber: req.body.roomNumber,
      roomType,
      capacity,
      occupied: 0,
      floorNumber: req.body.floorNumber || 1,
      blockName: req.body.blockName || 'A',
      gender: req.body.gender || 'MALE',
      status,
      pricePerNight: req.body.pricePerNight || 0,
      description: req.body.description || '',
      amenities: req.body.amenities || '',
      hostelId: req.body.hostelId || null
    };
    
    const room = await Room.create(roomData);
    
    // Fetch the created room with hostel and warden information
    const createdRoom = await Room.findByPk(room.id, {
      include: [
        {
          model: Hostel,
          as: 'hostel',
          include: [
            {
              model: User,
              as: 'warden',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        }
      ]
    });
    
    res.json(formatRoom(createdRoom, { [Number(createdRoom.id)]: 0 }));
  } catch (error) {
    console.error('Create room error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Room number already exists. Please use a different room number.' });
    }
    res.status(500).json({ message: 'Server error creating room' });
  }
});

// PUT /api/rooms/:id - Update room
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const roomType = req.body.roomType || room.roomType;
    const capacity = getCapacityFromRoomType(roomType, req.body.capacity || room.capacity);
    const activeOccupancy = await Allocation.count({
      where: {
        RoomId: room.id,
        status: 'ACTIVE'
      }
    });
    const occupied = Math.max(0, Math.min(capacity, Number(activeOccupancy) || 0));
    const status = req.body.status === 'MAINTENANCE' ? 'MAINTENANCE' : (occupied >= capacity ? 'OCCUPIED' : 'AVAILABLE');

    await room.update({
      roomNumber: req.body.roomNumber,
      roomType,
      capacity,
      occupied,
      floorNumber: req.body.floorNumber,
      blockName: req.body.blockName,
      gender: req.body.gender,
      status,
      pricePerNight: req.body.pricePerNight,
      description: req.body.description,
      amenities: req.body.amenities,
      hostelId: req.body.hostelId || null
    });
    
    // Fetch the updated room with hostel and warden information
    const updatedRoom = await Room.findByPk(room.id, {
      include: [
        {
          model: Hostel,
          as: 'hostel',
          include: [
            {
              model: User,
              as: 'warden',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        }
      ]
    });
    
    res.json(formatRoom(updatedRoom, { [Number(updatedRoom.id)]: occupied }));
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error updating room' });
  }
});

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    await room.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error deleting room' });
  }
});

module.exports = router;
