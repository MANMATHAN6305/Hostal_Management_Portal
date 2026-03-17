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
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
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

      const wardenHostels = await Hostel.findAll({
        where: { wardenId: req.user.id },
        attributes: ['id', 'name', 'blockCode', 'gender'],
        raw: true
      });
      const hostelNames = wardenHostels
        .map((hostel) => String(hostel.name || '').trim())
        .filter(Boolean);
      const assignedHostels = wardenHostels.map((hostel) => ({
        id: Number(hostel.id),
        name: hostel.name,
        blockCode: hostel.blockCode,
        gender: hostel.gender
      }));
      const assignedHostelName = hostelNames.length > 0 ? hostelNames.join(', ') : 'Not Assigned';

      if (hostelNames.length === 0) {
        return res.json({
          success: true,
          role: 'WARDEN',
          assignedHostelName,
          assignedHostels,
          stats: {
            pendingRequests: 0,
            openComplaints: 0,
            attendanceLogs: 0,
            totalStudents: 0,
            allocatedStudents: 0,
            resolvedComplaints: 0,
            approvedRequests: 0,
            todayAttendance: 0
          }
        });
      }

      const scopedAllocations = await Allocation.findAll({
        where: { status: 'ACTIVE' },
        include: [{
          model: Room,
          where: {
            blockName: {
              [Op.in]: hostelNames
            }
          },
          attributes: []
        }],
        attributes: ['StudentId'],
        raw: true
      });

      const studentIds = [...new Set(
        scopedAllocations
          .map((allocation) => Number(allocation.StudentId))
          .filter((studentId) => Number.isFinite(studentId) && studentId > 0)
      )];

      if (studentIds.length === 0) {
        return res.json({
          success: true,
          role: 'WARDEN',
          assignedHostelName,
          assignedHostels,
          stats: {
            pendingRequests: 0,
            openComplaints: 0,
            attendanceLogs: 0,
            totalStudents: 0,
            allocatedStudents: 0,
            resolvedComplaints: 0,
            approvedRequests: 0,
            todayAttendance: 0
          }
        });
      }

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
        Request.count({
          where: {
            StudentId: { [Op.in]: studentIds },
            status: 'PENDING'
          }
        }),
        Request.count({
          where: {
            StudentId: { [Op.in]: studentIds },
            status: 'APPROVED'
          }
        }),
        Complaint.count({
          where: {
            StudentId: { [Op.in]: studentIds },
            status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] }
          }
        }),
        Complaint.count({
          where: {
            StudentId: { [Op.in]: studentIds },
            status: 'RESOLVED'
          }
        }),
        Attendance.count({ where: { StudentId: { [Op.in]: studentIds } } }),
        Student.count({ where: { id: { [Op.in]: studentIds } } }),
        Promise.resolve(studentIds.length),
        Attendance.count({
          where: {
            StudentId: { [Op.in]: studentIds },
            date: today
          }
        })
      ]);

      return res.json({
        success: true,
        role: 'WARDEN',
        assignedHostelName,
        assignedHostels,
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
