const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.post('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const payment = await Payment.create({
      StudentId: req.body.studentId,
      amount: req.body.amount,
      paymentDate: req.body.paymentDate,
      mode: req.body.mode || 'UPI',
      status: req.body.status || 'PAID',
      transactionId: req.body.transactionId || null
    });
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create payment.', error: error.message });
  }
});

router.get('/', verifyToken, authorizeRoles('ADMIN', 'STUDENT', 'WARDEN'), async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { email: req.user.email } });
      where.StudentId = student?.id || -1;
    } else if (req.query.studentId) {
      where.StudentId = req.query.studentId;
    }

    const payments = await Payment.findAll({
      where,
      include: [{ model: Student, attributes: ['id', 'studentId', 'firstName', 'lastName', 'email'] }],
      order: [['paymentDate', 'DESC']]
    });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments.', error: error.message });
  }
});

module.exports = router;
