const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');
const Hostel = require('./Hostel');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  // Basic Details
  fullName: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  registerNumber: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  yearOfStudy: {
    type: DataTypes.ENUM('1', '2', '3', '4'),
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  studentEmail: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  mobileNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  // Hostel Preferences
  roomType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  blockName: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  specialPreferences: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Parent / Guardian Details
  guardianName: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  relationship: {
    type: DataTypes.STRING(60),
    allowNull: true
  },
  guardianContactNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  guardianAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING'
  },
  preferredRoomType: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

Student.hasMany(Application);
Application.belongsTo(Student);
Hostel.hasMany(Application);
Application.belongsTo(Hostel);

module.exports = Application;
