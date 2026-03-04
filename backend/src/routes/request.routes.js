const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Request = require('../models/Request');
const Student = require('../models/Student');
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

let requestSchemaReady = false;

const buildRoomChangeDescription = ({ reasonForRoomChange, studentName, rollNumber, currentRoomNumber, targetRoomNumber }) => (
  `Reason: ${reasonForRoomChange}\n` +
  `Student Name: ${studentName}\n` +
  `Roll Number: ${rollNumber}\n` +
  `Current Room Number: ${currentRoomNumber}\n` +
  `Target Room Number: ${targetRoomNumber}`
);

const parseRoomChangeDescription = (description = '') => {
  const read = (label) => {
    const regex = new RegExp(`${label}:\\s*([^\\n]+)`, 'i');
    const match = description.match(regex);
    return match?.[1]?.trim() || null;
  };

  return {
    reasonForRoomChange: read('Reason'),
    studentName: read('Student Name'),
    rollNumber: read('Roll Number'),
    currentRoomNumber: read('Current Room Number'),
    targetRoomNumber: read('Target Room Number')
  };
};

const ensureRequestSchema = async () => {
  if (requestSchemaReady) return;
  await Request.sync({ alter: true });
  requestSchemaReady = true;
};

const parseDateInput = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getWardenHostelNames = async (wardenId) => {
  const hostels = await Hostel.findAll({
    where: { wardenId },
    attributes: ['name'],
    raw: true
  });

  return hostels
    .map((hostel) => String(hostel.name || '').trim())
    .filter(Boolean);
};

const getWardenStudentIds = async (wardenId) => {
  const hostelNames = await getWardenHostelNames(wardenId);
  if (hostelNames.length === 0) return [];

  const allocations = await Allocation.findAll({
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

  return [...new Set(
    allocations
      .map((allocation) => Number(allocation.StudentId))
      .filter((studentId) => Number.isFinite(studentId) && studentId > 0)
  )];
};

const canWardenAccessStudent = async (wardenId, studentId) => {
  const wardenStudentIds = await getWardenStudentIds(wardenId);
  return wardenStudentIds.includes(Number(studentId));
};

router.post('/', verifyToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    await ensureRequestSchema();

    const student = await Student.findOne({ where: { email: req.user.email } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const type = req.body.type;
    if (!['LEAVE', 'ROOM_CHANGE'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid request type.' });
    }

    const isLeave = type === 'LEAVE';
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const parsedFromDate = parseDateInput(req.body.fromDate);
    const parsedToDate = parseDateInput(req.body.toDate);
    const fromDate = parsedFromDate || null;
    const toDate = parsedToDate || null;

    if (isLeave) {
      if (!title || !description || !fromDate || !toDate) {
        return res.status(400).json({
          success: false,
          message: 'Leave requests require Start Date & Time, End Date & Time, Title, and Description.'
        });
      }
      if (fromDate >= toDate) {
        return res.status(400).json({ success: false, message: 'End Date & Time must be after Start Date & Time.' });
      }
    } else {
      const requiredRoomChangeFields = [
        'studentName',
        'rollNumber',
        'reasonForRoomChange',
        'currentRoomNumber',
        'targetRoomNumber'
      ];
      const missing = requiredRoomChangeFields.filter(
        (field) => !req.body[field] || !String(req.body[field]).trim()
      );

      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Room Change request missing required fields: ${missing.join(', ')}`
        });
      }
    }

    const roomChangeMeta = isLeave ? null : {
      studentName: String(req.body.studentName || '').trim(),
      rollNumber: String(req.body.rollNumber || '').trim(),
      reasonForRoomChange: String(req.body.reasonForRoomChange || '').trim(),
      currentRoomNumber: String(req.body.currentRoomNumber || '').trim(),
      targetRoomNumber: String(req.body.targetRoomNumber || '').trim()
    };

    const request = await Request.create({
      StudentId: student.id,
      type,
      title: isLeave ? title : (title || `Room Change Request - ${roomChangeMeta.rollNumber || student.studentId || 'Student'}`),
      description: isLeave ? description : buildRoomChangeDescription(roomChangeMeta),
      fromDate,
      toDate,
      targetRoomNumber: req.body.targetRoomNumber || null
    });
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create request.', error: error.message });
  }
});

router.get('/', verifyToken, authorizeRoles('STUDENT', 'WARDEN', 'ADMIN'), async (req, res) => {
  try {
    await ensureRequestSchema();

    let where = {};
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { email: req.user.email } });
      where = { StudentId: student?.id || -1 };
    } else if (req.user.role === 'WARDEN') {
      const wardenStudentIds = await getWardenStudentIds(req.user.id);
      where = wardenStudentIds.length > 0 ? { StudentId: { [Op.in]: wardenStudentIds } } : { StudentId: -1 };
    }
    const requests = await Request.findAll({
      where,
      include: [{ model: Student, attributes: ['id', 'studentId', 'firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({
      success: true,
      requests: requests.map((request) => {
        const plain = request.toJSON();
        if (plain.type !== 'ROOM_CHANGE') return plain;
        return {
          ...plain,
          ...parseRoomChangeDescription(plain.description)
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch requests.', error: error.message });
  }
});

router.put('/:id/review', verifyToken, authorizeRoles('WARDEN', 'ADMIN'), async (req, res) => {
  try {
    await ensureRequestSchema();

    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    if (req.user.role === 'WARDEN') {
      const hasAccess = await canWardenAccessStudent(req.user.id, request.StudentId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Access denied for this student request.' });
      }
    }

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
