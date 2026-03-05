const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');
const User = require('./User');

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
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED'),
    defaultValue: 'PENDING'
  },
  adminReply: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('ELECTRICAL', 'CLEANING', 'MAINTENANCE', 'OTHER'),
    defaultValue: 'OTHER'
  },
  assignedStaffRole: {
    type: DataTypes.ENUM('ELECTRICIAN', 'CLEANER', 'CARETAKER'),
    allowNull: true
  },
  assignedById: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

// Association
Student.hasMany(Complaint, { constraints: false });
Complaint.belongsTo(Student, { constraints: false });
User.hasMany(Complaint, { foreignKey: 'assignedById', as: 'AssignedComplaints', constraints: false });
Complaint.belongsTo(User, { foreignKey: 'assignedById', as: 'AssignedBy', constraints: false });

module.exports = Complaint;
