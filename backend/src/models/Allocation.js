const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');
const Room = require('./Room');

const Allocation = sequelize.define('Allocation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  academicYear: {
    type: DataTypes.STRING(20)
  },
  semester: {
    type: DataTypes.STRING(20)
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'VACATED', 'PENDING', 'Select Room Status'),
    defaultValue: 'Select Room Status'
  },
  allocationDate: {
    type: DataTypes.DATEONLY
  },
  endDate: {
    type: DataTypes.DATEONLY
  },
  specialRequests: {
    type: DataTypes.TEXT
  }
});

// Associations
Student.hasMany(Allocation);
Allocation.belongsTo(Student);

Room.hasMany(Allocation);
Allocation.belongsTo(Room);

module.exports = Allocation;