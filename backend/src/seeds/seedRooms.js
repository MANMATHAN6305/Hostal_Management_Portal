require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
require('../models');

const User = require('../models/User');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const Application = require('../models/Application');
const Complaint = require('../models/Complaint');
const Request = require('../models/Request');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');

async function seedDemoData() {
  await sequelize.authenticate();

  await Promise.all([
    Payment.destroy({ where: {}, truncate: true, force: true }),
    Attendance.destroy({ where: {}, truncate: true, force: true }),
    Request.destroy({ where: {}, truncate: true, force: true }),
    Complaint.destroy({ where: {}, truncate: true, force: true }),
    Application.destroy({ where: {}, truncate: true, force: true }),
    Allocation.destroy({ where: {}, truncate: true, force: true }),
    Room.destroy({ where: {}, truncate: true, force: true }),
    Hostel.destroy({ where: {}, truncate: true, force: true }),
    Student.destroy({ where: {}, truncate: true, force: true }),
    User.destroy({ where: {}, truncate: true, force: true })
  ]);

  const password = await bcrypt.hash('password123', 10);
  const [admin, warden, electrician, cleaner, caretaker] = await Promise.all([
    User.create({ fullName: 'Admin User', email: 'admin@hostel.com', password, role: 'ADMIN', isActive: true }),
    User.create({ fullName: 'Warden User', email: 'warden@hostel.com', password, role: 'WARDEN', isActive: true }),
    User.create({ fullName: 'Electrical Staff', email: 'electrician@hostel.com', password, role: 'STAFF', staffRole: 'ELECTRICIAN', isActive: true }),
    User.create({ fullName: 'Cleaning Staff', email: 'cleaner@hostel.com', password, role: 'STAFF', staffRole: 'CLEANER', isActive: true }),
    User.create({ fullName: 'Caretaker Staff', email: 'caretaker@hostel.com', password, role: 'STAFF', staffRole: 'CARETAKER', isActive: true })
  ]);

  await Promise.all([
    User.create({ fullName: 'Student One', email: 'student1@hostel.com', password, role: 'STUDENT', isActive: true }),
    User.create({ fullName: 'Student Two', email: 'student2@hostel.com', password, role: 'STUDENT', isActive: true })
  ]);

  const [studentOne, studentTwo] = await Promise.all([
    Student.create({ studentId: 'STU1001', firstName: 'Student', lastName: 'One', email: 'student1@hostel.com', department: 'CSE', year: 2, gender: 'MALE' }),
    Student.create({ studentId: 'STU1002', firstName: 'Student', lastName: 'Two', email: 'student2@hostel.com', department: 'ECE', year: 3, gender: 'FEMALE' })
  ]);

  const [sapphire, ganga] = await Promise.all([
    Hostel.create({ name: 'Sapphire', blockCode: 'SAP', gender: 'MALE', totalRooms: 2 }),
    Hostel.create({ name: 'Ganga', blockCode: 'GAN', gender: 'FEMALE', totalRooms: 2 })
  ]);

  const [r1, r2, r3, r4] = await Promise.all([
    Room.create({ roomNumber: 'SAP-101', roomType: 'DOUBLE', gender: 'MALE', capacity: 2, occupied: 1, floorNumber: 1, blockName: sapphire.name, status: 'AVAILABLE', pricePerNight: 15000 }),
    Room.create({ roomNumber: 'SAP-102', roomType: 'FOUR_BED', gender: 'MALE', capacity: 4, occupied: 0, floorNumber: 1, blockName: sapphire.name, status: 'AVAILABLE', pricePerNight: 12000 }),
    Room.create({ roomNumber: 'GAN-201', roomType: 'DOUBLE', gender: 'FEMALE', capacity: 2, occupied: 1, floorNumber: 2, blockName: ganga.name, status: 'AVAILABLE', pricePerNight: 15000 }),
    Room.create({ roomNumber: 'GAN-202', roomType: 'FOUR_BED', gender: 'FEMALE', capacity: 4, occupied: 0, floorNumber: 2, blockName: ganga.name, status: 'MAINTENANCE', pricePerNight: 12000 })
  ]);

  await Promise.all([
    Allocation.create({ StudentId: studentOne.id, RoomId: r1.id, academicYear: '2025-2026', semester: 'ODD', status: 'ACTIVE', allocationDate: '2025-07-01' }),
    Allocation.create({ StudentId: studentTwo.id, RoomId: r3.id, academicYear: '2025-2026', semester: 'ODD', status: 'ACTIVE', allocationDate: '2025-07-01' })
  ]);

  await Promise.all([
    Application.create({ StudentId: studentOne.id, HostelId: sapphire.id, status: 'APPROVED', preferredRoomType: 'DOUBLE', reason: 'Close to department' }),
    Application.create({ StudentId: studentTwo.id, HostelId: ganga.id, status: 'PENDING', preferredRoomType: 'DOUBLE', reason: 'Requested by guardian' })
  ]);

  await Promise.all([
    Complaint.create({
      StudentId: studentOne.id,
      message: 'Fan is not working.',
      category: 'ELECTRICAL',
      assignedStaffRole: 'ELECTRICIAN',
      assignedById: warden.id,
      status: 'IN_PROGRESS'
    }),
    Complaint.create({
      StudentId: studentTwo.id,
      message: 'Room cleaning not done.',
      category: 'CLEANING',
      assignedStaffRole: 'CLEANER',
      assignedById: warden.id,
      status: 'PENDING'
    }),
    Complaint.create({
      StudentId: studentTwo.id,
      message: 'Bathroom tap leakage.',
      category: 'MAINTENANCE',
      assignedStaffRole: 'CARETAKER',
      assignedById: admin.id,
      status: 'RESOLVED',
      resolvedAt: new Date()
    })
  ]);

  await Promise.all([
    Request.create({
      StudentId: studentOne.id,
      type: 'LEAVE',
      status: 'PENDING',
      title: 'Weekend leave',
      description: 'Going home for family function',
      fromDate: '2026-02-28',
      toDate: '2026-03-02'
    }),
    Request.create({
      StudentId: studentTwo.id,
      type: 'ROOM_CHANGE',
      status: 'APPROVED',
      title: 'Room change request',
      description: 'Need a quieter room',
      targetRoomNumber: r4.roomNumber,
      handledById: warden.id
    })
  ]);

  await Promise.all([
    Attendance.create({ StudentId: studentOne.id, date: '2026-02-25', checkInTime: '08:45:00', checkOutTime: '18:30:00', deviceId: 'BIO-ENTRANCE-1' }),
    Attendance.create({ StudentId: studentTwo.id, date: '2026-02-25', checkInTime: '09:10:00', checkOutTime: '17:50:00', deviceId: 'BIO-ENTRANCE-2' })
  ]);

  await Promise.all([
    Payment.create({ StudentId: studentOne.id, amount: 15000, paymentDate: '2026-01-10', mode: 'UPI', status: 'PAID', transactionId: 'UPI-TXN-1001' }),
    Payment.create({ StudentId: studentTwo.id, amount: 15000, paymentDate: '2026-01-12', mode: 'CARD', status: 'PAID', transactionId: 'CARD-TXN-1002' })
  ]);

  console.log('Seed complete.');
  console.log('Users: admin@hostel.com, warden@hostel.com, electrician@hostel.com, cleaner@hostel.com, caretaker@hostel.com, student1@hostel.com, student2@hostel.com');
  console.log('Password: password123');
  console.log(`Staff IDs: ${electrician.id}, ${cleaner.id}, ${caretaker.id}`);
}

seedDemoData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
