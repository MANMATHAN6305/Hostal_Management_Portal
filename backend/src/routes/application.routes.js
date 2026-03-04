const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { Op } = require('sequelize');

const buildStudentId = () => `STU${Date.now()}${Math.floor(Math.random() * 1000)}`;
const requiredFields = [
  'fullName',
  'registerNumber',
  'department',
  'yearOfStudy',
  'gender',
  'dateOfBirth',
  'studentEmail',
  'mobileNumber',
  'guardianName',
  'relationship',
  'guardianContactNumber',
  'guardianAddress'
];

const getMissingFields = (body) => requiredFields.filter((field) => {
  const value = body[field];
  return value === undefined || value === null || String(value).trim() === '';
});

const getWardenHostels = async (wardenId) => {
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

const getAvailableRoomForApplication = async ({ application, candidateHostelIds }) => {
  if (!['MALE', 'FEMALE'].includes(application.gender)) {
    throw new Error('Student gender must be MALE or FEMALE to auto-assign room.');
  }

  const roomWhere = {
    gender: application.gender,
    status: { [Op.ne]: 'MAINTENANCE' }
  };

  if (candidateHostelIds.length > 0) {
    roomWhere.hostelId = { [Op.in]: candidateHostelIds };
  }

  const rooms = await Room.findAll({
    where: roomWhere,
    order: [['hostelId', 'ASC'], ['roomNumber', 'ASC']]
  });

  for (const room of rooms) {
    const activeOccupancy = await Allocation.count({
      where: {
        RoomId: room.id,
        status: 'ACTIVE'
      }
    });

    if (activeOccupancy < room.capacity) {
      return {
        room,
        activeOccupancy
      };
    }
  }

  return null;
};

router.post('/', verifyToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const missing = getMissingFields(req.body);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    let student = await Student.findOne({ where: { email: req.user.email } });

    const nameParts = String(req.body.fullName).trim().split(/\s+/);
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (!student) {
      student = await Student.create({
        studentId: req.body.registerNumber || buildStudentId(),
        firstName,
        lastName,
        email: req.user.email,
        phone: req.body.mobileNumber || null,
        department: req.body.department || null,
        year: req.body.yearOfStudy ? Number(req.body.yearOfStudy) : null,
        dateOfBirth: req.body.dateOfBirth || null,
        gender: req.body.gender || 'Select Gender',
        guardianName: req.body.guardianName || null,
        guardianPhone: req.body.guardianContactNumber || null,
        address: req.body.guardianAddress || null
      });
    }

    const updatedFirstName = firstName || student.firstName;
    const updatedLastName = lastName || student.lastName;

    await student.update({
      studentId: req.body.registerNumber || student.studentId,
      firstName: updatedFirstName,
      lastName: updatedLastName,
      email: req.user.email,
      phone: req.body.mobileNumber || student.phone,
      department: req.body.department || student.department,
      year: req.body.yearOfStudy ? Number(req.body.yearOfStudy) : student.year,
      dateOfBirth: req.body.dateOfBirth || student.dateOfBirth,
      gender: req.body.gender || student.gender,
      guardianName: req.body.guardianName || student.guardianName,
      guardianPhone: req.body.guardianContactNumber || student.guardianPhone,
      address: req.body.guardianAddress || student.address
    });

    const existingApplication = await Application.findOne({
      where: { StudentId: student.id },
      order: [['createdAt', 'DESC']]
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'Hostel application already submitted. Use edit to update your application.',
        application: existingApplication
      });
    }

    const application = await Application.create({
      StudentId: student.id,
      HostelId: req.body.hostelId || null,
      fullName: req.body.fullName,
      registerNumber: req.body.registerNumber,
      department: req.body.department,
      yearOfStudy: req.body.yearOfStudy,
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      studentEmail: req.body.studentEmail,
      mobileNumber: req.body.mobileNumber,
      roomType: req.body.roomType || null,
      blockName: req.body.blockName || null,
      specialPreferences: req.body.specialPreferences || null,
      guardianName: req.body.guardianName,
      relationship: req.body.relationship,
      guardianContactNumber: req.body.guardianContactNumber,
      guardianAddress: req.body.guardianAddress,
      preferredRoomType: req.body.preferredRoomType || null,
      reason: req.body.reason || null
    });
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit application.', error: error.message });
  }
});

router.put('/:id', verifyToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const missing = getMissingFields(req.body);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    const student = await Student.findOne({ where: { email: req.user.email } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found. Submit Apply Hostel form first.' });
    }

    const application = await Application.findOne({
      where: {
        id: req.params.id,
        StudentId: student.id
      }
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const nameParts = String(req.body.fullName).trim().split(/\s+/);
    const firstName = nameParts[0] || student.firstName;
    const lastName = nameParts.slice(1).join(' ') || student.lastName;

    await student.update({
      studentId: req.body.registerNumber || student.studentId,
      firstName,
      lastName,
      email: req.user.email,
      phone: req.body.mobileNumber || student.phone,
      department: req.body.department || student.department,
      year: req.body.yearOfStudy ? Number(req.body.yearOfStudy) : student.year,
      dateOfBirth: req.body.dateOfBirth || student.dateOfBirth,
      gender: req.body.gender || student.gender,
      guardianName: req.body.guardianName || student.guardianName,
      guardianPhone: req.body.guardianContactNumber || student.guardianPhone,
      address: req.body.guardianAddress || student.address
    });

    await application.update({
      HostelId: req.body.hostelId || application.HostelId,
      fullName: req.body.fullName,
      registerNumber: req.body.registerNumber,
      department: req.body.department,
      yearOfStudy: req.body.yearOfStudy,
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      studentEmail: req.body.studentEmail,
      mobileNumber: req.body.mobileNumber,
      roomType: req.body.roomType || null,
      blockName: req.body.blockName || null,
      specialPreferences: req.body.specialPreferences || null,
      guardianName: req.body.guardianName,
      relationship: req.body.relationship,
      guardianContactNumber: req.body.guardianContactNumber,
      guardianAddress: req.body.guardianAddress,
      preferredRoomType: req.body.preferredRoomType || null,
      reason: req.body.reason || null
    });

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update application.', error: error.message });
  }
});

router.get('/', verifyToken, authorizeRoles('STUDENT', 'WARDEN', 'ADMIN'), async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { email: req.user.email } });
      where.StudentId = student?.id || -1;
    } else if (req.user.role === 'WARDEN') {
      const { hostelIds } = await getWardenHostels(req.user.id);
      if (hostelIds.length === 0) {
        where.HostelId = -1;
      } else {
        where[Op.or] = [
          { HostelId: { [Op.in]: hostelIds } },
          { HostelId: null, status: 'PENDING' }
        ];
      }
    }

    const applications = await Application.findAll({
      where,
      include: [
        { model: Student, attributes: ['id', 'studentId', 'firstName', 'lastName', 'email'] },
        { model: Hostel, attributes: ['id', 'name', 'blockCode', 'gender'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications.', error: error.message });
  }
});

router.put('/:id/review', verifyToken, authorizeRoles('WARDEN', 'ADMIN'), async (req, res) => {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [{ model: Student, attributes: ['id', 'gender'] }]
    });

    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (!['APPROVED', 'REJECTED'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    let wardenHostelIds = [];
    if (req.user.role === 'WARDEN') {
      const { hostelIds } = await getWardenHostels(req.user.id);
      wardenHostelIds = hostelIds;

      if (wardenHostelIds.length === 0) {
        return res.status(403).json({ success: false, message: 'No hostel is assigned to this warden.' });
      }

      if (application.HostelId && !wardenHostelIds.includes(Number(application.HostelId))) {
        return res.status(403).json({ success: false, message: 'You cannot review applications outside your assigned hostels.' });
      }
    }

    application.status = req.body.status;
    application.remarks = req.body.remarks || null;

    let allocation = null;

    if (req.body.status === 'APPROVED') {
      const student = application.Student || await Student.findByPk(application.StudentId);
      if (!student) {
        return res.status(400).json({ success: false, message: 'Student profile missing for this application.' });
      }

      const existingActiveAllocation = await Allocation.findOne({
        where: {
          StudentId: student.id,
          status: 'ACTIVE'
        }
      });

      if (!existingActiveAllocation) {
        let candidateHostelIds = [];
        if (application.HostelId) {
          candidateHostelIds = [Number(application.HostelId)];
        } else if (req.user.role === 'WARDEN') {
          candidateHostelIds = wardenHostelIds;
        }

        const availableRoomResult = await getAvailableRoomForApplication({
          application,
          candidateHostelIds
        });

        if (!availableRoomResult) {
          return res.status(400).json({
            success: false,
            message: 'No available room found for this application in the selected hostel scope.'
          });
        }

        const { room, activeOccupancy } = availableRoomResult;

        allocation = await Allocation.create({
          RoomId: room.id,
          StudentId: student.id,
          academicYear: req.body.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          semester: req.body.semester || '1',
          status: 'ACTIVE',
          allocationDate: req.body.allocationDate || new Date().toISOString().split('T')[0],
          endDate: req.body.endDate || null,
          specialRequests: application.specialPreferences || null
        });

        await room.update({
          occupied: Math.min(room.capacity, Number(activeOccupancy) + 1),
          status: Number(activeOccupancy) + 1 >= room.capacity ? 'OCCUPIED' : 'AVAILABLE'
        });

        if (!application.HostelId && room.hostelId) {
          application.HostelId = room.hostelId;
        }
      }
    }

    await application.save();

    res.json({
      success: true,
      application,
      allocation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to review application.', error: error.message });
  }
});

module.exports = router;
