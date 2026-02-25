const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Menu = sequelize.define('Menu', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  weekStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  day: {
    type: DataTypes.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
    allowNull: false
  },
  breakfast: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  lunch: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  dinner: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Menu;
