const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
    defaultValue: 'PENDING'
  },
  adminReply: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('MAINTENANCE', 'CLEANLINESS', 'FOOD', 'SECURITY', 'OTHER'),
    defaultValue: 'OTHER'
  }
}, {
  timestamps: true
});

// Association
Student.hasMany(Complaint);
Complaint.belongsTo(Student);

module.exports = Complaint;
