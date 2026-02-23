const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  roomNumber: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    field: 'room_number'
  },
  roomType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'room_type'
  },
  pricePerNight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'fee_per_semester'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'AVAILABLE'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  floorNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'floor_number'
  },
  blockName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'block_name'
  },
  amenities: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'rooms',
  timestamps: false
});

module.exports = Room;
