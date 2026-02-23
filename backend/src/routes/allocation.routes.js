const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const Student = require('../models/Student');

// GET /api/allocations - Get all allocations
router.get('/', async (req, res) => {
  try {
    const allocations = await Allocation.findAll({
      include: [
        { model: Room, as: 'room', attributes: ['roomNumber', 'blockName'] },
        { model: Student, as: 'student', attributes: ['firstName', 'lastName'] }
      ],
      order: [['id', 'DESC']]
    });
    
    res.json(allocations.map(allocation => ({
      id: allocation.id,
      roomId: allocation.roomId,
      studentId: allocation.studentId,
      allocationDate: allocation.allocationDate,
      endDate: allocation.endDate,
      status: allocation.status,
      academicYear: allocation.academicYear,
      semester: allocation.semester,
      specialRequests: allocation.specialRequests,
      roomNumber: allocation.room?.roomNumber,
      studentName: allocation.student ? `${allocation.student.firstName} ${allocation.student.lastName}` : null,
      blockName: allocation.room?.blockName
    })));
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
        { model: Room, as: 'room', attributes: ['roomNumber', 'blockName'] },
        { model: Student, as: 'student', attributes: ['firstName', 'lastName'] }
      ]
    });
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    res.json({
      id: allocation.id,
      roomId: allocation.roomId,
      studentId: allocation.studentId,
      allocationDate: allocation.allocationDate,
      endDate: allocation.endDate,
      status: allocation.status,
      academicYear: allocation.academicYear,
      semester: allocation.semester,
      specialRequests: allocation.specialRequests,
      roomNumber: allocation.room?.roomNumber,
      studentName: allocation.student ? `${allocation.student.firstName} ${allocation.student.lastName}` : null,
      blockName: allocation.room?.blockName
    });
  } catch (error) {
    console.error('Get allocation error:', error);
    res.status(500).json({ message: 'Server error fetching allocation' });
  }
});

// POST /api/allocations - Create new allocation
router.post('/', async (req, res) => {
  try {
    const allocationData = {
      roomId: req.body.roomId,
      studentId: req.body.studentId,
      allocationDate: req.body.allocationDate,
      endDate: req.body.endDate,
      status: req.body.status || 'ACTIVE',
      academicYear: req.body.academicYear,
      semester: req.body.semester,
      specialRequests: req.body.specialRequests
    };
    
    const allocation = await Allocation.create(allocationData);
    
    // Fetch the allocation with related data
    const createdAllocation = await Allocation.findByPk(allocation.id, {
      include: [
        { model: Room, as: 'room', attributes: ['roomNumber', 'blockName'] },
        { model: Student, as: 'student', attributes: ['firstName', 'lastName'] }
      ]
    });
    
    res.json({
      id: createdAllocation.id,
      roomId: createdAllocation.roomId,
      studentId: createdAllocation.studentId,
      allocationDate: createdAllocation.allocationDate,
      endDate: createdAllocation.endDate,
      status: createdAllocation.status,
      academicYear: createdAllocation.academicYear,
      semester: createdAllocation.semester,
      specialRequests: createdAllocation.specialRequests,
      roomNumber: createdAllocation.room?.roomNumber,
      studentName: createdAllocation.student ? `${createdAllocation.student.firstName} ${createdAllocation.student.lastName}` : null,
      blockName: createdAllocation.room?.blockName
    });
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
      roomId: req.body.roomId,
      studentId: req.body.studentId,
      allocationDate: req.body.allocationDate,
      endDate: req.body.endDate,
      status: req.body.status,
      academicYear: req.body.academicYear,
      semester: req.body.semester,
      specialRequests: req.body.specialRequests
    });
    
    // Fetch the updated allocation with related data
    const updatedAllocation = await Allocation.findByPk(allocation.id, {
      include: [
        { model: Room, as: 'room', attributes: ['roomNumber', 'blockName'] },
        { model: Student, as: 'student', attributes: ['firstName', 'lastName'] }
      ]
    });
    
    res.json({
      id: updatedAllocation.id,
      roomId: updatedAllocation.roomId,
      studentId: updatedAllocation.studentId,
      allocationDate: updatedAllocation.allocationDate,
      endDate: updatedAllocation.endDate,
      status: updatedAllocation.status,
      academicYear: updatedAllocation.academicYear,
      semester: updatedAllocation.semester,
      specialRequests: updatedAllocation.specialRequests,
      roomNumber: updatedAllocation.room?.roomNumber,
      studentName: updatedAllocation.student ? `${updatedAllocation.student.firstName} ${updatedAllocation.student.lastName}` : null,
      blockName: updatedAllocation.room?.blockName
    });
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
