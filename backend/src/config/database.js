const { Sequelize } = require('sequelize');

const enableSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hostel_portal',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    dialectOptions: enableSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : undefined,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true
    }
  }
);

module.exports = { sequelize, Sequelize };