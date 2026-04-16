const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { verifyToken, isStudent, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const allowedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const allowedMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER'];

const toUpperTrimmed = (value) => String(value || '').trim().toUpperCase();

const getDayName = (date = new Date()) => {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
};

const getDayWindow = (date = new Date()) => {
  const start = new Date(date);
  const end = new Date(date);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// POST /api/feedback - Student submits meal feedback
router.post('/', verifyToken, isStudent, async (req, res) => {
  try {
    const day = toUpperTrimmed(req.body.day) || getDayName();
    const mealType = toUpperTrimmed(req.body.mealType);
    const foodItem = String(req.body.foodItem || '').trim();
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();

    if (!allowedDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day value'
      });
    }

    if (!allowedMealTypes.includes(mealType)) {
      return res.status(400).json({
        success: false,
        message: 'mealType must be BREAKFAST, LUNCH or DINNER'
      });
    }

    if (!foodItem) {
      return res.status(400).json({
        success: false,
        message: 'foodItem is required'
      });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'rating must be between 1 and 5'
      });
    }

    const { start, end } = getDayWindow();

    const existing = await Feedback.findOne({
      where: {
        student_id: req.user.id,
        meal_type: mealType,
        created_at: {
          [Op.between]: [start, end]
        }
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Feedback already submitted'
      });
    }

    const dbUser = await User.findByPk(req.user.id, {
      attributes: ['fullName']
    });

    const feedback = await Feedback.create({
      student_id: req.user.id,
      student_name: dbUser?.fullName || req.user.fullName || 'Student',
      day,
      meal_type: mealType,
      food_item: foodItem,
      rating,
      comment: comment || null,
      created_at: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error submitting feedback'
    });
  }
});

// GET /api/feedback - Admin/Warden feedback list with filters
router.get('/', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    const day = toUpperTrimmed(req.query.day);
    const mealType = toUpperTrimmed(req.query.mealType);
    const rating = Number(req.query.rating);

    const where = {};

    if (day && allowedDays.includes(day)) {
      where.day = day;
    }

    if (mealType && allowedMealTypes.includes(mealType)) {
      where.meal_type = mealType;
    }

    if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
      where.rating = rating;
    }

    const feedback = await Feedback.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Get feedback list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching feedback'
    });
  }
});

// GET /api/feedback/today - Admin/Warden today's feedback
router.get('/today', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (_req, res) => {
  try {
    const { start, end } = getDayWindow();

    const feedback = await Feedback.findAll({
      where: {
        created_at: {
          [Op.between]: [start, end]
        }
      },
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Get today feedback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching today feedback'
    });
  }
});

// GET /api/feedback/stats - Admin/Warden average ratings per meal type
router.get('/stats', verifyToken, authorizeRoles('ADMIN', 'WARDEN'), async (req, res) => {
  try {
    const day = toUpperTrimmed(req.query.day);

    const where = {};
    if (day && allowedDays.includes(day)) {
      where.day = day;
    }

    const stats = await Feedback.findAll({
      where,
      attributes: [
        'meal_type',
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalFeedback']
      ],
      group: ['meal_type'],
      order: [['meal_type', 'ASC']]
    });

    const defaultStats = {
      BREAKFAST: { mealType: 'BREAKFAST', averageRating: 0, totalFeedback: 0 },
      LUNCH: { mealType: 'LUNCH', averageRating: 0, totalFeedback: 0 },
      DINNER: { mealType: 'DINNER', averageRating: 0, totalFeedback: 0 }
    };

    for (const row of stats) {
      const meal = row.get('meal_type');
      const avgRaw = Number(row.get('averageRating'));
      const countRaw = Number(row.get('totalFeedback'));

      defaultStats[meal] = {
        mealType: meal,
        averageRating: Number.isFinite(avgRaw) ? Number(avgRaw.toFixed(2)) : 0,
        totalFeedback: Number.isFinite(countRaw) ? countRaw : 0
      };
    }

    return res.json({
      success: true,
      stats: Object.values(defaultStats)
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching feedback stats'
    });
  }
});

module.exports = router;
