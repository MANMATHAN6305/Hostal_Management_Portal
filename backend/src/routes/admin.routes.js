const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const Menu = require('../models/Menu');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ==================== COMPLAINT MANAGEMENT ====================

// GET /api/admin/complaints - Get all complaints
router.get('/complaints', verifyToken, isAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.findAll({
      include: [{
        model: Student,
        attributes: ['id', 'studentId', 'firstName', 'lastName', 'email', 'department']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      complaints: complaints.map(c => ({
        id: c.id,
        message: c.message,
        category: c.category,
        status: c.status,
        adminReply: c.adminReply,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        student: c.Student ? {
          id: c.Student.id,
          studentId: c.Student.studentId,
          name: `${c.Student.firstName} ${c.Student.lastName}`,
          email: c.Student.email,
          department: c.Student.department
        } : null
      }))
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching complaints' 
    });
  }
});

// GET /api/admin/complaints/:id - Get single complaint
router.get('/complaints/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id, {
      include: [{
        model: Student,
        attributes: ['id', 'studentId', 'firstName', 'lastName', 'email', 'department', 'phone']
      }]
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      complaint: {
        id: complaint.id,
        message: complaint.message,
        category: complaint.category,
        status: complaint.status,
        adminReply: complaint.adminReply,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
        student: complaint.Student ? {
          id: complaint.Student.id,
          studentId: complaint.Student.studentId,
          name: `${complaint.Student.firstName} ${complaint.Student.lastName}`,
          email: complaint.Student.email,
          department: complaint.Student.department,
          phone: complaint.Student.phone
        } : null
      }
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching complaint' 
    });
  }
});

// PUT /api/admin/complaints/:id - Update complaint status & reply
router.put('/complaints/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    
    const complaint = await Complaint.findByPk(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Update fields
    if (status) complaint.status = status;
    if (adminReply !== undefined) complaint.adminReply = adminReply;
    
    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      complaint: {
        id: complaint.id,
        status: complaint.status,
        adminReply: complaint.adminReply,
        updatedAt: complaint.updatedAt
      }
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating complaint' 
    });
  }
});

// DELETE /api/admin/complaints/:id - Delete complaint
router.delete('/complaints/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findByPk(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    await complaint.destroy();

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting complaint' 
    });
  }
});

// ==================== MENU MANAGEMENT ====================

// GET /api/admin/menu - Get menu items for a week (requested or latest)
router.get('/menu', verifyToken, isAdmin, async (req, res) => {
  try {
    const { weekStartDate } = req.query;

    if (weekStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(weekStartDate)) {
      return res.status(400).json({
        success: false,
        message: 'weekStartDate must be in YYYY-MM-DD format'
      });
    }

    let targetWeek = weekStartDate || null;

    if (!targetWeek) {
      const latestWeek = await Menu.findOne({
        attributes: ['weekStartDate'],
        order: [['weekStartDate', 'DESC']]
      });
      targetWeek = latestWeek?.weekStartDate || null;
    }

    if (!targetWeek) {
      return res.json({
        success: true,
        weekStartDate: null,
        menu: []
      });
    }

    const menu = await Menu.findAll({
      where: { weekStartDate: targetWeek },
      order: [['day', 'ASC']]
    });

    res.json({
      success: true,
      weekStartDate: targetWeek,
      menu: menu
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching menu' 
    });
  }
});

// POST /api/admin/menu - Create/Update weekly menu
router.post('/menu', verifyToken, isAdmin, async (req, res) => {
  try {
    const { weekStartDate, menuItems } = req.body;

    if (!weekStartDate || !menuItems || !Array.isArray(menuItems)) {
      return res.status(400).json({
        success: false,
        message: 'weekStartDate and menuItems array are required'
      });
    }

    // Validate date format (should be YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartDate)) {
      return res.status(400).json({
        success: false,
        message: 'weekStartDate must be in YYYY-MM-DD format'
      });
    }

    // Validate menuItems have required fields
    for (const item of menuItems) {
      if (!item.day || !['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].includes(item.day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day value: ${item.day}`
        });
      }
    }

    // Delete existing menu for this week
    await Menu.destroy({
      where: { weekStartDate }
    });

    // Create new menu items
    const createdItems = [];
    for (const item of menuItems) {
      const menuItem = await Menu.create({
        weekStartDate,
        day: item.day,
        breakfast: item.breakfast || '',
        lunch: item.lunch || '',
        dinner: item.dinner || ''
      });
      createdItems.push(menuItem);
    }

    res.json({
      success: true,
      message: 'Menu updated successfully',
      menu: createdItems
    });
  } catch (error) {
    console.error('Create menu error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating menu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/admin/menu/:id - Update single menu item
router.put('/menu/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { breakfast, lunch, dinner } = req.body;
    
    const menuItem = await Menu.findByPk(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (breakfast !== undefined) menuItem.breakfast = breakfast;
    if (lunch !== undefined) menuItem.lunch = lunch;
    if (dinner !== undefined) menuItem.dinner = dinner;
    
    await menuItem.save();

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating menu' 
    });
  }
});

// DELETE /api/admin/menu/:id - Delete menu item
router.delete('/menu/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const menuItem = await Menu.findByPk(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await menuItem.destroy();

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting menu' 
    });
  }
});

// GET /api/admin/stats - Get admin dashboard stats
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalComplaints = await Complaint.count();
    const pendingComplaints = await Complaint.count({ where: { status: 'PENDING' } });
    const inProgressComplaints = await Complaint.count({ where: { status: 'IN_PROGRESS' } });
    const completedComplaints = await Complaint.count({ where: { status: 'RESOLVED' } });

    res.json({
      success: true,
      stats: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        completedComplaints
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching stats' 
    });
  }
});

module.exports = router;
