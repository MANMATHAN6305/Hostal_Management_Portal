const { Sequelize } = require('sequelize');

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return String(value).toLowerCase() === 'true';
};

const enableSsl = parseBoolean(process.env.DB_SSL, process.env.NODE_ENV === 'production');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hostel_portal',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    dialectOptions: enableSsl
      ? {
          connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000', 10),
          enableKeepAlive: true,
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {
          connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000', 10),
          enableKeepAlive: true
        },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      min: parseInt(process.env.DB_POOL_MIN || '0', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
      evict: parseInt(process.env.DB_POOL_EVICT || '1000', 10)
    },
    retry: {
      max: parseInt(process.env.DB_RETRY_MAX || '3', 10)
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true
    }
  }
);

module.exports = { sequelize, Sequelize };