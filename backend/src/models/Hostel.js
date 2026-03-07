const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Hostel = sequelize.define('Hostel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  blockCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE', 'COED'),
    defaultValue: 'COED'
  },
  totalRooms: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  wardenId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

module.exports = Hostel;
