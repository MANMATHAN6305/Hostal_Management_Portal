const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  mode: {
    type: DataTypes.ENUM('CASH', 'UPI', 'CARD', 'BANK_TRANSFER'),
    defaultValue: 'UPI'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'),
    defaultValue: 'PENDING'
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
});

Student.hasMany(Payment);
Payment.belongsTo(Student);

module.exports = Payment;
