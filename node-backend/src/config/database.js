const { Sequelize } = require('sequelize');

// Handle empty password properly for XAMPP
const dbPassword = process.env.DB_PASSWORD || '';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hostel_portal',
  process.env.DB_USER || 'root',
  dbPassword,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

module.exports = { sequelize, Sequelize };