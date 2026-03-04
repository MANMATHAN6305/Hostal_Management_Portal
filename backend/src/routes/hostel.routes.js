const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { sequelize } = require('../config/database');

router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT'), async (_req, res) => {
  try {
    // Get hostels with their wardens
    const hostels = await Hostel.findAll({ 
      include: [
        {
          model: User,
          as: 'warden',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['name', 'ASC']] 
    });

    // Get actual room counts per hostel
    const roomCounts = await Room.findAll({
      attributes: [
        'hostelId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'actualRoomCount']
      ],
      group: ['hostelId']
    });

    // Create a map of room counts
    const roomCountMap = {};
    roomCounts.forEach(rc => {
      roomCountMap[Number(rc.hostelId)] = parseInt(rc.get('actualRoomCount'));
    });

    // Add actual room counts to hostels
    const hostelsWithCounts = hostels.map(hostel => {
      const hostelData = hostel.toJSON();
      hostelData.actualRoomCount = roomCountMap[Number(hostel.id)] || 0;
      return hostelData;
    });

    res.json({ success: true, hostels: hostelsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch hostels.', error: error.message });
  }
});

router.post('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const hostel = await Hostel.create(req.body);
    res.json({ success: true, hostel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create hostel.', error: error.message });
  }
});

router.put('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const hostel = await Hostel.findByPk(req.params.id);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });
    await hostel.update(req.body);
    res.json({ success: true, hostel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update hostel.', error: error.message });
  }
});

router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const hostel = await Hostel.findByPk(req.params.id);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });
    await hostel.destroy();
    res.json({ success: true, message: 'Hostel deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete hostel.', error: error.message });
  }
});

module.exports = router;
