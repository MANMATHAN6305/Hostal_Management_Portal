const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT'), async (_req, res) => {
  try {
    const hostels = await Hostel.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, hostels });
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

module.exports = router;
