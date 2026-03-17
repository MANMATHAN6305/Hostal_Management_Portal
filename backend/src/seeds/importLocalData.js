/**
 * Import local data into the connected database.
 * Run once on the server: node src/seeds/importLocalData.js
 */
console.log('=== IMPORT SCRIPT STARTED ===');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);

require('dotenv').config();
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// JSON keys (lowercase) → actual MySQL table names (Sequelize default: capitalized + pluralized)
const TABLE_MAP = {
  users: 'Users',
  hostels: 'Hostels',
  rooms: 'Rooms',
  students: 'Students',
  allocations: 'Allocations',
  menus: 'Menus',
  complaints: 'Complaints',
  applications: 'Applications',
  payments: 'Payments',
  requests: 'Requests',
  attendances: 'Attendances',
  visitors: 'Visitors',
  wardenmessages: 'WardenMessages',
};

const TABLES_IN_ORDER = Object.keys(TABLE_MAP);

const isIsoDateTime = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/.test(value);

const normalizeSqlValue = (value) => {
  if (!isIsoDateTime(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
};

async function importData() {
  const dataPath = path.join(__dirname, 'localData.json');
  if (!fs.existsSync(dataPath)) {
    console.error('localData.json not found');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Ensure tables exist first
  require('../models');
  await sequelize.authenticate();
  console.log('DB authenticated.');
  await sequelize.sync({ alter: false });
  console.log('Tables synced.');

  // Use raw mysql2 connection from sequelize config
  const config = sequelize.config;
  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: config.dialectOptions?.ssl ? { rejectUnauthorized: false } : undefined,
    connectTimeout: 30000,
  });

  console.log('Connected to database.');

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const jsonKey of TABLES_IN_ORDER) {
    const rows = data[jsonKey];
    const mysqlTable = TABLE_MAP[jsonKey];
    if (!rows || rows.length === 0) {
      console.log(`${mysqlTable}: 0 rows — skipped`);
      continue;
    }

    await conn.query(`TRUNCATE TABLE \`${mysqlTable}\``);

    const columns = Object.keys(rows[0]);
    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const placeholders = batch
        .map(() => `(${columns.map(() => '?').join(',')})`)
        .join(',');
      const values = batch.flatMap((row) => columns.map((col) => normalizeSqlValue(row[col] ?? null)));

      await conn.query(
        `INSERT INTO \`${mysqlTable}\` (${columns.map((c) => `\`${c}\``).join(',')}) VALUES ${placeholders}`,
        values
      );
    }
    console.log(`${mysqlTable}: ${rows.length} rows ✓`);
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  await conn.end();
  console.log('\nImport complete!');
}

importData().catch((err) => {
  console.error('=== IMPORT FAILED ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  // Don't crash — let the server start anyway
  process.exit(0);
});
