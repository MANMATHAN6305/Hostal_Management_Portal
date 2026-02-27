const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.post('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    const { studentId, date, checkInTime, checkOutTime, deviceId } = req.body;
    const attendance = await Attendance.create({
      StudentId: studentId,
      date,
      checkInTime,
      checkOutTime,
      deviceId
    });
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record attendance.', error: error.message });
  }
});

router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    const where = {};
    if (req.query.studentId) where.StudentId = req.query.studentId;
    if (req.query.dateFrom || req.query.dateTo) {
      where.date = {};
      if (req.query.dateFrom) where.date[Op.gte] = req.query.dateFrom;
      if (req.query.dateTo) where.date[Op.lte] = req.query.dateTo;
    }

    const attendance = await Attendance.findAll({
      where,
      include: [{ model: Student, attributes: ['id', 'studentId', 'firstName', 'lastName', 'email'] }],
      order: [['date', 'DESC']]
    });
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.', error: error.message });
  }
});

module.exports = router;
