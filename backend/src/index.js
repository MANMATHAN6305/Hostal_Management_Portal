require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./config/database');

require('./models');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const roomRoutes = require('./routes/room.routes');
const allocationRoutes = require('./routes/allocation.routes');
const studentPortalRoutes = require('./routes/studentPortal.routes');
const adminRoutes = require('./routes/admin.routes');
const complaintRoutes = require('./routes/complaint.routes');
const requestRoutes = require('./routes/request.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const paymentRoutes = require('./routes/payment.routes');
const staffRoutes = require('./routes/staff.routes');
const applicationRoutes = require('./routes/application.routes');
const hostelRoutes = require('./routes/hostel.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const wardenRoutes = require('./routes/warden.routes');
const messageRoutes = require('./routes/message.routes');
const feedbackRoutes = require('./routes/feedback.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DB_CONNECT_RETRY_MS = parseInt(process.env.DB_CONNECT_RETRY_MS || '10000', 10);
const DB_SYNC_ON_STARTUP =
  String(
    process.env.DB_SYNC_ON_STARTUP ??
      (process.env.NODE_ENV === 'production' ? 'false' : 'true')
  ).toLowerCase() === 'true';

let isDatabaseReady = false;

const normalizeOrigin = (origin) => origin.replace(/\/+$/, '').toLowerCase();

const allowedOrigins = new Set(
  [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS || '').split(',')
  ]
    .map((origin) => (origin || '').trim())
    .filter(Boolean)
    .map(normalizeOrigin)
);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server tools and same-origin requests without Origin header.
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 700),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 80),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(passport.initialize());
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: IS_PRODUCTION ? '7d' : 0,
    etag: true
  })
);
app.use('/api', generalRateLimiter);
app.use('/api/auth', authRateLimiter);

app.get('/health', (_req, res) => {
  res.status(isDatabaseReady ? 200 : 503).json({
    status: isDatabaseReady ? 'ok' : 'degraded',
    database: isDatabaseReady ? 'connected' : 'disconnected'
  });
});

app.use('/api', (req, res, next) => {
  if (!isDatabaseReady) {
    return res.status(503).json({
      message: 'Database is temporarily unavailable. Please try again shortly.'
    });
  }

  return next();
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/student', studentPortalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', wardenRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to Hostel Management Portal API' });
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function initializeDatabase() {
  while (!isDatabaseReady) {
    try {
      await sequelize.authenticate();
      console.log('Database connected.');

      if (DB_SYNC_ON_STARTUP) {
        await sequelize.sync({ alter: false });
        console.log('Database schema synchronized.');
      }

      isDatabaseReady = true;
      return;
    } catch (error) {
      isDatabaseReady = false;
      console.error(
        `Database initialization failed. Retrying in ${DB_CONNECT_RETRY_MS}ms...`,
        error.message || error
      );
      await sleep(DB_CONNECT_RETRY_MS);
    }
  }
}

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  initializeDatabase().catch((error) => {
    console.error('Unexpected database initializer error:', error);
  });
});
