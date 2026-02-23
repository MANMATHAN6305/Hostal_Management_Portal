const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Room = require('./Room');
const Student = require('./Student');

const Allocation = sequelize.define('Allocation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'room_id',
    references: {
      model: Room,
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'student_id',
    references: {
      model: Student,
      key: 'id'
    }
  },
  allocationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'allocation_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'ACTIVE'
  },
  academicYear: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'academic_year'
  },
  semester: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  specialRequests: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'special_requests'
  }
}, {
  tableName: 'allocations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
Allocation.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
Allocation.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Room.hasMany(Allocation, { foreignKey: 'roomId', as: 'allocations' });
Student.hasMany(Allocation, { foreignKey: 'studentId', as: 'allocations' });

module.exports = Allocation;
