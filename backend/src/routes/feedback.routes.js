const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { verifyToken, isStudent, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const allowedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const allowedMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER'];
const feedbackBaseAttributes = ['id', 'student_id', 'student_name', 'day', 'meal_type', 'food_item', 'rating', 'comment', 'created_at'];

let feedbackSchemaState = {
  initialized: false,
  tableExists: true,
  hasImageUrl: false
};

const normalizeTableName = (name) => String(name).replace(/[`'"]/g, '').toLowerCase();

const ensureFeedbackSchema = async () => {
  if (feedbackSchemaState.initialized) {
    return;
  }

  const qi = sequelize.getQueryInterface();
  const existingTablesRaw = await qi.showAllTables();
  const existingTables = existingTablesRaw.map((table) => normalizeTableName(table));

  if (!existingTables.includes('feedback')) {
    feedbackSchemaState = {
      initialized: true,
      tableExists: false,
      hasImageUrl: false
    };
    return;
  }

  const feedbackTable = await qi.describeTable('feedback');

  feedbackSchemaState = {
    initialized: true,
    tableExists: true,
    hasImageUrl: Boolean(feedbackTable.image_url)
  };
};

const getFeedbackQueryAttributes = () => {
  if (feedbackSchemaState.hasImageUrl) {
    return undefined;
  }

  return feedbackBaseAttributes;
};

const feedbackUploadDir = path.join(__dirname, '..', '..', 'uploads', 'feedback');
if (!fs.existsSync(feedbackUploadDir)) {
  fs.mkdirSync(feedbackUploadDir, { recursive: true });
}

const feedbackStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, feedbackUploadDir);
  },
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `feedback-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const uploadFeedbackImage = multer({
  storage: feedbackStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed for feedback upload.'));
      return;
    }

    cb(null, true);
  }
}).single('image');

const removeUploadedFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
};

const feedbackImageUploadHandler = (req, res, next) => {
  uploadFeedbackImage(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Feedback image must be 10MB or smaller.'
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to upload feedback image.'
    });
  });
};

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
router.post('/', verifyToken, isStudent, feedbackImageUploadHandler, async (req, res) => {
  try {
    await ensureFeedbackSchema();

    if (!feedbackSchemaState.tableExists) {
      removeUploadedFile(req.file?.path);
      return res.status(503).json({
        success: false,
        message: 'Feedback table is not available on this server yet. Please run feedback migration.'
      });
    }

    const day = toUpperTrimmed(req.body.day) || getDayName();
    const mealType = toUpperTrimmed(req.body.mealType);
    const foodItem = String(req.body.foodItem || '').trim();
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();

    if (!allowedDays.includes(day)) {
      removeUploadedFile(req.file?.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid day value'
      });
    }

    if (!allowedMealTypes.includes(mealType)) {
      removeUploadedFile(req.file?.path);
      return res.status(400).json({
        success: false,
        message: 'mealType must be BREAKFAST, LUNCH or DINNER'
      });
    }

    if (!foodItem) {
      removeUploadedFile(req.file?.path);
      return res.status(400).json({
        success: false,
        message: 'foodItem is required'
      });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      removeUploadedFile(req.file?.path);
      return res.status(400).json({
        success: false,
        message: 'rating must be between 1 and 5'
      });
    }

    const { start, end } = getDayWindow();

    const existing = await Feedback.findOne({
      attributes: ['id'],
      where: {
        student_id: req.user.id,
        meal_type: mealType,
        created_at: {
          [Op.between]: [start, end]
        }
      }
    });

    if (existing) {
      removeUploadedFile(req.file?.path);
      return res.status(409).json({
        success: false,
        message: 'Feedback already submitted'
      });
    }

    const dbUser = await User.findByPk(req.user.id, {
      attributes: ['fullName']
    });

    const feedbackPayload = {
      student_id: req.user.id,
      student_name: dbUser?.fullName || req.user.fullName || 'Student',
      day,
      meal_type: mealType,
      food_item: foodItem,
      rating,
      comment: comment || null,
      created_at: new Date()
    };

    if (feedbackSchemaState.hasImageUrl) {
      feedbackPayload.image_url = req.file ? `/uploads/feedback/${req.file.filename}` : null;
    } else {
      removeUploadedFile(req.file?.path);
    }

    const feedback = await Feedback.create(feedbackPayload);

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    removeUploadedFile(req.file?.path);
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
    await ensureFeedbackSchema();

    if (!feedbackSchemaState.tableExists) {
      return res.status(503).json({
        success: false,
        message: 'Feedback table is not available on this server yet. Please run feedback migration.'
      });
    }

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
      attributes: getFeedbackQueryAttributes(),
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
    await ensureFeedbackSchema();

    if (!feedbackSchemaState.tableExists) {
      return res.status(503).json({
        success: false,
        message: 'Feedback table is not available on this server yet. Please run feedback migration.'
      });
    }

    const { start, end } = getDayWindow();

    const feedback = await Feedback.findAll({
      attributes: getFeedbackQueryAttributes(),
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
    await ensureFeedbackSchema();

    if (!feedbackSchemaState.tableExists) {
      return res.status(503).json({
        success: false,
        message: 'Feedback table is not available on this server yet. Please run feedback migration.'
      });
    }

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
