require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const { sequelize } = require('./config/database');

// 🔥 Load all models BEFORE sync
require('./models');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const roomRoutes = require('./routes/room.routes');
const allocationRoutes = require('./routes/allocation.routes');
const studentPortalRoutes = require('./routes/studentPortal.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Existing admin routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/allocations', allocationRoutes);

// New routes for student portal and admin management
app.use('/api/student', studentPortalRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Hostel Management Portal API'
  });
});

//server start function
async function startServer() {
  try {
    console.log("🚀 Starting server...");

    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Do NOT auto-sync
    console.log('ℹ️ Using existing database schema.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

async function startServer() {
  try {
    console.log("🚀 Starting server...");

    await sequelize.authenticate();
    console.log('✅ Database connected.');

    // Do NOT auto-sync
    console.log('ℹ️ Using existing database schema.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

startServer();