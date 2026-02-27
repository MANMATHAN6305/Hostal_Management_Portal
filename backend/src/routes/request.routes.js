const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Student = require('../models/Student');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.post('/', verifyToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const student = await Student.findOne({ where: { email: req.user.email } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const request = await Request.create({
      StudentId: student.id,
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      fromDate: req.body.fromDate || null,
      toDate: req.body.toDate || null,
      targetRoomNumber: req.body.targetRoomNumber || null
    });
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create request.', error: error.message });
  }
});

router.get('/', verifyToken, authorizeRoles('STUDENT', 'WARDEN', 'ADMIN'), async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { email: req.user.email } });
      where = { StudentId: student?.id || -1 };
    }
    const requests = await Request.findAll({
      where,
      include: [{ model: Student, attributes: ['id', 'studentId', 'firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch requests.', error: error.message });
  }
});

router.put('/:id/review', verifyToken, authorizeRoles('WARDEN', 'ADMIN'), async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (!['APPROVED', 'REJECTED'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status.' });
    }

    request.status = req.body.status;
    request.wardenRemarks = req.body.wardenRemarks || null;
    request.handledById = req.user.id;
    await request.save();
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to review request.', error: error.message });
  }
});

module.exports = router;
