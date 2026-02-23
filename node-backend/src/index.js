require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const roomRoutes = require('./routes/room.routes');
const allocationRoutes = require('./routes/allocation.routes');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/allocations', allocationRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Hostel Management Portal API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      rooms: '/api/rooms',
      allocations: '/api/allocations'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database sync and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized.');
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║     HOSTEL MANAGEMENT PORTAL - Node.js Backend        ║
╠═══════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}          ║
║  Environment: ${process.env.NODE_ENV || 'development'}║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
