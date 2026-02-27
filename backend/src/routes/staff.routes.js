const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: { [Op.in]: ['STAFF', 'WARDEN'] } },
      attributes: ['id', 'fullName', 'email', 'phone', 'role', 'staffRole', 'isActive'],
      order: [['role', 'ASC'], ['fullName', 'ASC']]
    });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch staff.', error: error.message });
  }
});

router.post('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const password = req.body.password ? await bcrypt.hash(req.body.password, 10) : null;
    const user = await User.create({
      fullName: req.body.fullName,
      email: req.body.email,
      password,
      phone: req.body.phone || null,
      role: req.body.role,
      staffRole: req.body.role === 'STAFF' ? req.body.staffRole : null,
      isActive: req.body.isActive ?? true
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create staff.', error: error.message });
  }
});

router.put('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const updates = { ...req.body };
    if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
    if (updates.role !== 'STAFF') updates.staffRole = null;
    await user.update(updates);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update staff.', error: error.message });
  }
});

module.exports = router;
