const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(100)
  },
  email: {
    type: DataTypes.STRING(150),
    unique: true
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  address: {
    type: DataTypes.TEXT
  },
  department: {
    type: DataTypes.STRING(100)
  },
  year: {
    type: DataTypes.INTEGER
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY
  },
  guardianName: {
    type: DataTypes.STRING(100)
  },
  guardianPhone: {
    type: DataTypes.STRING(20)
  },
  bloodGroup: {
    type: DataTypes.STRING(10)
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE', 'Select Gender'),
    defaultValue: 'Select Gender'
  }
});

module.exports = Student;