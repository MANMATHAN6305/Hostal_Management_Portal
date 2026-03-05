const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  checkInTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  checkOutTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  deviceId: {
    type: DataTypes.STRING(80),
    allowNull: false
  }
});

Student.hasMany(Attendance, { constraints: false });
Attendance.belongsTo(Student, { constraints: false });

module.exports = Attendance;
