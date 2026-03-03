const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Request = require('../models/Request');
const Allocation = require('../models/Allocation');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/summary', verifyToken, authorizeRoles('ADMIN', 'WARDEN', 'STUDENT', 'STAFF'), async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const [students, wardens, staff, complaints, requests, payments] = await Promise.all([
        Student.count(),
        User.count({ where: { role: 'WARDEN' } }),
        User.count({ where: { role: 'STAFF' } }),
        Complaint.count(),
        Request.count(),
        Payment.count()
      ]);
      return res.json({ success: true, role: 'ADMIN', stats: { students, wardens, staff, complaints, requests, payments } });
    }

    if (req.user.role === 'WARDEN') {
      const today = new Date().toISOString().split('T')[0];
      const complaintScope = {
        [Op.or]: [{ assignedById: null }, { assignedById: req.user.id }]
      };

      const [
        pendingRequests,
        approvedRequests,
        openComplaints,
        resolvedComplaints,
        attendanceLogs,
        totalStudents,
        allocatedStudents,
        todayAttendance
      ] = await Promise.all([
        Request.count({ where: { status: 'PENDING' } }),
        Request.count({ where: { status: 'APPROVED' } }),
        Complaint.count({
          where: {
            ...complaintScope,
            status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] }
          }
        }),
        Complaint.count({
          where: {
            ...complaintScope,
            status: 'RESOLVED'
          }
        }),
        Attendance.count(),
        Student.count(),
        Allocation.count({
          where: { status: 'ACTIVE' },
          distinct: true,
          col: 'StudentId'
        }),
        Attendance.count({ where: { date: today } })
      ]);

      return res.json({
        success: true,
        role: 'WARDEN',
        stats: {
          pendingRequests,
          openComplaints,
          attendanceLogs,
          totalStudents,
          allocatedStudents,
          resolvedComplaints,
          approvedRequests,
          todayAttendance
        }
      });
    }

    if (req.user.role === 'STAFF') {
      const assigned = await Complaint.count({ where: { assignedStaffRole: req.user.staffRole } });
      const unresolved = await Complaint.count({
        where: { assignedStaffRole: req.user.staffRole, status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] } }
      });
      return res.json({ success: true, role: 'STAFF', stats: { assigned, unresolved } });
    }

    const student = await Student.findOne({ where: { email: req.user.email } });
    const [complaints, requests, allocations, payments] = await Promise.all([
      Complaint.count({ where: { StudentId: student?.id || -1 } }),
      Request.count({ where: { StudentId: student?.id || -1 } }),
      Allocation.count({ where: { StudentId: student?.id || -1 } }),
      Payment.count({ where: { StudentId: student?.id || -1 } })
    ]);
    return res.json({ success: true, role: 'STUDENT', stats: { complaints, requests, allocations, payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary.', error: error.message });
  }
});

module.exports = router;
