const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WardenMessage = sequelize.define('WardenMessage', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  receiverId: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    defaultValue: 'MEDIUM'
  },
  status: {
    type: DataTypes.ENUM('SENT', 'SEEN', 'RESOLVED'),
    defaultValue: 'SENT'
  },
  isToAllWardens: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  adminReply: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = WardenMessage;
