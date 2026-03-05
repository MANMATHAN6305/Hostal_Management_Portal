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
const SHOULD_SYNC_SCHEMA = process.env.DB_SYNC
  ? process.env.DB_SYNC === 'true'
  : process.env.NODE_ENV !== 'production';

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
app.use(passport.initialize());

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

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    if (SHOULD_SYNC_SCHEMA) {
      await sequelize.sync({ alter: false });
      console.log('Database schema synchronized.');
    } else {
      console.log('Database schema sync skipped (DB_SYNC=false).');
    }
    
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Database error:', error);
  }
}

startServer();
