require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
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

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
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

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

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
