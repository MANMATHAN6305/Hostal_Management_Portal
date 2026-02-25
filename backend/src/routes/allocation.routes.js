const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const Student = require('../models/Student');

// Helper function to format allocation response
const formatAllocation = (allocation) => ({
  id: allocation.id,
  roomId: allocation.RoomId,
  studentId: allocation.StudentId,
  academicYear: allocation.academicYear,
  semester: allocation.semester,
  status: allocation.status,
  allocationDate: allocation.allocationDate,
  endDate: allocation.endDate,
  specialRequests: allocation.specialRequests,
  roomNumber: allocation.Room?.roomNumber,
  studentName: allocation.Student ? `${allocation.Student.firstName} ${allocation.Student.lastName}` : null,
  blockName: allocation.Room?.blockName
});

// GET /api/allocations - Get all allocations
router.get('/', async (req, res) => {
  try {
    const allocations = await Allocation.findAll({
      include: [
        { model: Room, attributes: ['roomNumber', 'blockName'] },
        { model: Student, attributes: ['firstName', 'lastName'] }
      ],
      order: [['id', 'DESC']]
    });
    
    res.json(allocations.map(formatAllocation));
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ message: 'Server error fetching allocations' });
  }
});

// GET /api/allocations/:id - Get allocation by ID
router.get('/:id', async (req, res) => {
  try {
    const allocation = await Allocation.findByPk(req.params.id, {
      include: [
        { model: Room, attributes: ['roomNumber', 'blockName'] },
        { model: Student, attributes: ['firstName', 'lastName'] }
      ]
    });
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    res.json(formatAllocation(allocation));
  } catch (error) {
    console.error('Get allocation error:', error);
    res.status(500).json({ message: 'Server error fetching allocation' });
  }
});

// POST /api/allocations - Create new allocation
router.post('/', async (req, res) => {
  try {
    const allocationData = {
      RoomId: req.body.roomId,
      StudentId: req.body.studentId,
      academicYear: req.body.academicYear,
      semester: req.body.semester,
      status: req.body.status || 'ACTIVE',
      allocationDate: req.body.allocationDate,
      endDate: req.body.endDate,
      specialRequests: req.body.specialRequests
    };
    
    const allocation = await Allocation.create(allocationData);
    
    // Fetch the allocation with related data
    const createdAllocation = await Allocation.findByPk(allocation.id, {
      include: [
        { model: Room, attributes: ['roomNumber', 'blockName'] },
        { model: Student, attributes: ['firstName', 'lastName'] }
      ]
    });
    
    res.json(formatAllocation(createdAllocation));
  } catch (error) {
    console.error('Create allocation error:', error);
    res.status(500).json({ message: 'Server error creating allocation' });
  }
});

// PUT /api/allocations/:id - Update allocation
router.put('/:id', async (req, res) => {
  try {
    const allocation = await Allocation.findByPk(req.params.id);
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    await allocation.update({
      RoomId: req.body.roomId,
      StudentId: req.body.studentId,
      academicYear: req.body.academicYear,
      semester: req.body.semester,
      status: req.body.status,
      allocationDate: req.body.allocationDate,
      endDate: req.body.endDate,
      specialRequests: req.body.specialRequests
    });
    
    // Fetch the updated allocation with related data
    const updatedAllocation = await Allocation.findByPk(allocation.id, {
      include: [
        { model: Room, attributes: ['roomNumber', 'blockName'] },
        { model: Student, attributes: ['firstName', 'lastName'] }
      ]
    });
    
    res.json(formatAllocation(updatedAllocation));
  } catch (error) {
    console.error('Update allocation error:', error);
    res.status(500).json({ message: 'Server error updating allocation' });
  }
});

// DELETE /api/allocations/:id - Delete allocation
router.delete('/:id', async (req, res) => {
  try {
    const allocation = await Allocation.findByPk(req.params.id);
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    await allocation.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete allocation error:', error);
    res.status(500).json({ message: 'Server error deleting allocation' });
  }
});

module.exports = router;

module.exports = router;
