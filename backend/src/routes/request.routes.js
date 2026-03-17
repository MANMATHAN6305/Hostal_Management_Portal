const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Request = require('../models/Request');
const Student = require('../models/Student');
const Application = require('../models/Application');
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
  // Avoid runtime ALTER in production (some managed DB users don't have ALTER privileges).
  await Request.sync();
  requestSchemaReady = true;
};

const getStudentForRequest = async (reqUser) => {
  let student = await Student.findOne({ where: { email: reqUser.email } });
  if (student) return student;

  // Fallback for legacy data where student email differs from login email.
  const application = await Application.findOne({
    where: { studentEmail: reqUser.email },
    include: [{ model: Student }],
    order: [['createdAt', 'DESC']]
  });

  if (application?.Student) return application.Student;

  return null;
};

const parseDateInput = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getWardenHostelScope = async (wardenId) => {
  const hostels = await Hostel.findAll({
    where: { wardenId },
    attributes: ['id', 'name'],
    raw: true
  });

  return {
    hostelIds: hostels
      .map((hostel) => Number(hostel.id))
      .filter((hostelId) => Number.isFinite(hostelId) && hostelId > 0),
    hostelNames: hostels
      .map((hostel) => String(hostel.name || '').trim())
      .filter(Boolean)
  };
};

const getWardenRoomWhere = (hostelScope) => {
  const scopeConditions = [];

  if (hostelScope.hostelIds.length > 0) {
    scopeConditions.push({
      hostelId: {
        [Op.in]: hostelScope.hostelIds
      }
    });
  }

  if (hostelScope.hostelNames.length > 0) {
    scopeConditions.push({
      blockName: {
        [Op.in]: hostelScope.hostelNames
      }
    });
  }

  if (scopeConditions.length === 0) {
    return null;
  }

  if (scopeConditions.length === 1) {
    return scopeConditions[0];
  }

  return { [Op.or]: scopeConditions };
};

const getWardenStudentIds = async (wardenId) => {
  const hostelScope = await getWardenHostelScope(wardenId);
  const roomWhere = getWardenRoomWhere(hostelScope);
  if (!roomWhere) return [];

  const allocations = await Allocation.findAll({
    where: { status: 'ACTIVE' },
    include: [{
      model: Room,
      where: roomWhere,
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

    const student = await getStudentForRequest(req.user);
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
      const student = await getStudentForRequest(req.user);
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
