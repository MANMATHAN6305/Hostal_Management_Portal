const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');
const User = require('./User');

const Request = sequelize.define('Request', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('LEAVE', 'ROOM_CHANGE'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING'
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fromDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  toDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  targetRoomNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  wardenRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  handledById: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
});

Student.hasMany(Request, { constraints: false });
Request.belongsTo(Student, { constraints: false });
User.hasMany(Request, { foreignKey: 'handledById', as: 'HandledRequests', constraints: false });
Request.belongsTo(User, { foreignKey: 'handledById', as: 'HandledBy', constraints: false });

module.exports = Request;
