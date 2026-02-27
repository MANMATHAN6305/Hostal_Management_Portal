/**
 * Migration Script: Create extension tables required for full Smart Hostel modules
 * Tables: Hostels, Applications, Requests, Attendance, Payments, Visitors
 *
 * Usage:
 *   node src/migrations/addExtensionTables.js
 *   npm run migrate:extensions
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

const Hostel = require('../models/Hostel');
const Application = require('../models/Application');
const Request = require('../models/Request');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Visitor = require('../models/Visitor');

function normalizeTableName(name) {
  return String(name).replace(/[`'"]/g, '').toLowerCase();
}

async function migrate() {
  try {
    console.log('Starting extension tables migration...');
    await sequelize.authenticate();
    console.log('Database connected.');

    const qi = sequelize.getQueryInterface();
    const currentTablesRaw = await qi.showAllTables();
    const currentTables = currentTablesRaw.map((t) => normalizeTableName(t));

    const targets = [
      { label: 'Hostels', model: Hostel },
      { label: 'Applications', model: Application },
      { label: 'Requests', model: Request },
      { label: 'Attendance', model: Attendance },
      { label: 'Payments', model: Payment },
      { label: 'Visitors', model: Visitor }
    ];

    for (const target of targets) {
      const modelTableName = normalizeTableName(target.model.getTableName());
      const exists = currentTables.includes(modelTableName);
      if (exists) {
        console.log(`${target.label} already exists, skipping.`);
      } else {
        await target.model.sync();
        console.log(`${target.label} created.`);
      }
    }

    const updatedTablesRaw = await qi.showAllTables();
    const updatedTables = updatedTablesRaw.map((t) => normalizeTableName(t)).sort();
    console.log('Current tables:', updatedTables.join(', '));
    console.log('Extension tables migration completed.');
  } catch (error) {
    console.error('Extension tables migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate().then(() => process.exit(0));
