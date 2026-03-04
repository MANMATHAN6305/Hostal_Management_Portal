const express = require('express');
const router = express.Router();
const WardenMessage = require('../models/WardenMessage');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ==================== WARDEN TO ADMIN MESSAGES ====================

// POST /api/messages/warden/send - Warden sends message to admin
router.post('/warden/send', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'WARDEN') {
      return res.status(403).json({
        success: false,
        message: 'Only wardens can send messages to admin'
      });
    }

    const { title, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const message = await WardenMessage.create({
      senderId: req.user.id,
      receiverId: null, // To admin (no specific admin)
      title,
      description,
      priority: priority || 'MEDIUM',
      status: 'SENT',
      isToAllWardens: false
    });

    res.json({
      success: true,
      message: 'Message sent to admin successfully',
      data: message
    });
  } catch (error) {
    console.error('Send warden message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error sending message' 
    });
  }
});

// GET /api/messages/warden/sent - Get warden's sent messages
router.get('/warden/sent', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'WARDEN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await WardenMessage.findAll({
      where: { senderId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'fullName', 'email']
      }]
    });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get warden sent messages error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching messages' 
    });
  }
});

// GET /api/messages/warden/received - Get messages received by warden from admin
router.get('/warden/received', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'WARDEN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await WardenMessage.findAll({
      where: { 
        receiverId: req.user.id
      },
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'fullName', 'email', 'role']
      }]
    });

    // Also get broadcast messages
    const broadcastMessages = await WardenMessage.findAll({
      where: { 
        isToAllWardens: true
      },
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'fullName', 'email', 'role']
      }]
    });

    res.json({
      success: true,
      messages: [...messages, ...broadcastMessages]
    });
  } catch (error) {
    console.error('Get warden received messages error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching messages' 
    });
  }
});

// ==================== ADMIN MESSAGES ====================

// GET /api/messages/admin/all - Get all warden messages (admin view)
router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const messages = await WardenMessage.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'role']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fullName', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get all messages error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching messages' 
    });
  }
});

// POST /api/messages/admin/send - Admin sends message to warden(s)
router.post('/admin/send', verifyToken, isAdmin, async (req, res) => {
  try {
    const { wardenId, title, description, priority, isToAllWardens } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    if (!isToAllWardens && !wardenId) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a warden or select all wardens'
      });
    }

    const message = await WardenMessage.create({
      senderId: req.user.id,
      receiverId: wardenId || null,
      title,
      description,
      priority: priority || 'MEDIUM',
      status: 'SENT',
      isToAllWardens: isToAllWardens || false
    });

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Admin send message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error sending message' 
    });
  }
});

// PUT /api/messages/admin/:id/status - Update message status
router.put('/admin/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, adminReply } = req.body;

    const message = await WardenMessage.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const previousReply = typeof message.adminReply === 'string' ? message.adminReply.trim() : '';
    const nextReply = typeof adminReply === 'string' ? adminReply.trim() : '';

    if (status) message.status = status;
    if (adminReply !== undefined) message.adminReply = adminReply;

    await message.save();

    let replyMessage = null;

    // Deliver admin reply as an actual inbox message to the original warden sender.
    if (!previousReply && nextReply) {
      const originalSender = await User.findByPk(message.senderId, {
        attributes: ['id', 'role']
      });

      if (originalSender && originalSender.role === 'WARDEN') {
        replyMessage = await WardenMessage.create({
          senderId: req.user.id,
          receiverId: originalSender.id,
          title: `Reply: ${message.title}`,
          description: nextReply,
          priority: message.priority || 'MEDIUM',
          status: 'SENT',
          isToAllWardens: false
        });
      }
    }

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: message,
      replyMessage
    });
  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating message' 
    });
  }
});

// PUT /api/messages/:id/mark-seen - Mark message as seen
router.put('/:id/mark-seen', verifyToken, async (req, res) => {
  try {
    const message = await WardenMessage.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.status = 'SEEN';
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as seen'
    });
  } catch (error) {
    console.error('Mark message seen error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// DELETE /api/messages/admin/:id - Delete message (admin only)
router.delete('/admin/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const message = await WardenMessage.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.destroy();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting message' 
    });
  }
});

module.exports = router;
