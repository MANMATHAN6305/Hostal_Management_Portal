const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  roomNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  roomType: {
    type: DataTypes.ENUM('SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY', 'Select Room Type'),
    defaultValue: 'Select Room Type'
  },
  occupied: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  floorNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  blockName: {
    type: DataTypes.STRING(50),
    defaultValue: 'A'
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'Select Room Status'),
    defaultValue: 'Select Room Status'
  },
  pricePerNight: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT
  },
  amenities: {
    type: DataTypes.STRING(255)
  }
});

module.exports = Room;