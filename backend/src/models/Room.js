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
    type: DataTypes.ENUM('SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'FIVE_BED', 'EIGHT_BED', 'DORMITORY', 'Select Room Type'),
    defaultValue: 'Select Room Type'
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE'),
    defaultValue: 'MALE'
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
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
  },
  hostelId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'Hostels',
      key: 'id'
    }
  }
});

module.exports = Room;