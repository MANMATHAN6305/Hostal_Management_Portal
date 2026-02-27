require('dotenv').config();
const { sequelize } = require('../config/database');
require('../models');

async function syncSchema() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Schema synced with alter=true');
    process.exit(0);
  } catch (error) {
    console.error('Schema sync failed:', error);
    process.exit(1);
  }
}

syncSchema();
