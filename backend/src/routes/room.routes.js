const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { Op } = require('sequelize');

// Helper function to format room response
const formatRoom = (room) => ({
  id: room.id,
  roomNumber: room.roomNumber,
  roomType: room.roomType,
  capacity: room.capacity,
  occupied: room.occupied,
  floorNumber: room.floorNumber,
  blockName: room.blockName,
  gender: room.gender,
  status: room.status,
  pricePerNight: room.pricePerNight,
  description: room.description,
  amenities: room.amenities
});

// GET /api/rooms - Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.findAll({
      order: [['id', 'DESC']]
    });
    
    res.json(rooms.map(formatRoom));
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// GET /api/rooms/available - Get available rooms
router.get('/available', async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: {
        status: 'AVAILABLE'
      },
      order: [['roomNumber', 'ASC']]
    });
    
    res.json(rooms.map(formatRoom));
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Server error fetching available rooms' });
  }
});

// GET /api/rooms/:id - Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(formatRoom(room));
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error fetching room' });
  }
});

// POST /api/rooms - Create new room
router.post('/', async (req, res) => {
  try {
    const roomData = {
      roomNumber: req.body.roomNumber,
      roomType: req.body.roomType || 'DOUBLE',
      capacity: req.body.capacity || 4,
      occupied: req.body.occupied || 0,
      floorNumber: req.body.floorNumber || 1,
      blockName: req.body.blockName || 'A',
      gender: req.body.gender || 'MALE',
      status: req.body.status || 'AVAILABLE',
      pricePerNight: req.body.pricePerNight || 0,
      description: req.body.description || '',
      amenities: req.body.amenities || ''
    };
    
    const room = await Room.create(roomData);
    
    res.json(formatRoom(room));
  } catch (error) {
    console.error('Create room error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Room number already exists. Please use a different room number.' });
    }
    res.status(500).json({ message: 'Server error creating room' });
  }
});

// PUT /api/rooms/:id - Update room
router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    await room.update({
      roomNumber: req.body.roomNumber,
      roomType: req.body.roomType,
      capacity: req.body.capacity,
      occupied: req.body.occupied,
      floorNumber: req.body.floorNumber,
      blockName: req.body.blockName,
      gender: req.body.gender,
      status: req.body.status,
      pricePerNight: req.body.pricePerNight,
      description: req.body.description,
      amenities: req.body.amenities
    });
    
    res.json(formatRoom(room));
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error updating room' });
  }
});

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', async (req, res) => {
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
