const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');

const Visitor = sequelize.define('Visitor', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  relation: {
    type: DataTypes.STRING(80),
    allowNull: true
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
});

Student.hasMany(Visitor, { constraints: false });
Visitor.belongsTo(Student, { constraints: false });

module.exports = Visitor;
