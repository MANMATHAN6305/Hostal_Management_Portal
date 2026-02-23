const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'student_id'
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'study_year'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth'
  },
  guardianName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'guardian_name'
  },
  guardianPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'guardian_phone'
  },
  bloodGroup: {
    type: DataTypes.STRING(5),
    allowNull: true,
    field: 'blood_group'
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: false
  }
}, {
  tableName: 'students',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Student;
