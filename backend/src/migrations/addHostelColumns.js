/**
 * Migration Script: Patch Hostels table for warden assignment support
 * Usage: node src/migrations/addHostelColumns.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function hasColumn(table, column) {
  const [rows] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}';`);
  return rows.length > 0;
}

async function migrate() {
  try {
    console.log('Starting Hostels migration...');
    await sequelize.authenticate();
    console.log('Database connected.');

    const hasWardenId = await hasColumn('Hostels', 'wardenId');
    if (!hasWardenId) {
      await sequelize.query(`
        ALTER TABLE \`Hostels\`
        ADD COLUMN \`wardenId\` BIGINT NULL AFTER \`totalRooms\`;
      `);
      console.log('Added Hostels.wardenId');
    } else {
      console.log('Hostels.wardenId already exists');
    }

    console.log('Hostels migration completed.');
  } catch (error) {
    console.error('Hostels migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate().then(() => process.exit(0));
