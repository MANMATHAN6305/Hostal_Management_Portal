/**
 * Import local data into the connected database.
 * Run once on the server: node src/seeds/importLocalData.js
 */
require('dotenv').config();
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const TABLES_IN_ORDER = [
  'users', 'hostels', 'rooms', 'students', 'allocations',
  'menus', 'complaints', 'applications', 'payments',
  'requests', 'attendances', 'visitors', 'wardenmessages',
];

async function importData() {
  const dataPath = path.join(__dirname, 'localData.json');
  if (!fs.existsSync(dataPath)) {
    console.error('localData.json not found');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

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

  // Check if data already exists — skip if users table has rows
  const [existing] = await conn.query('SELECT COUNT(*) as cnt FROM `users`').catch(() => [[{ cnt: 0 }]]);
  if (existing[0].cnt > 0) {
    console.log(`Database already has ${existing[0].cnt} users — skipping import.`);
    await conn.end();
    return;
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of TABLES_IN_ORDER) {
    const rows = data[table];
    if (!rows || rows.length === 0) {
      console.log(`${table}: 0 rows — skipped`);
      continue;
    }

    await conn.query(`TRUNCATE TABLE \`${table}\``);

    const columns = Object.keys(rows[0]);
    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const placeholders = batch
        .map(() => `(${columns.map(() => '?').join(',')})`)
        .join(',');
      const values = batch.flatMap((row) => columns.map((col) => row[col] ?? null));

      await conn.query(
        `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(',')}) VALUES ${placeholders}`,
        values
      );
    }
    console.log(`${table}: ${rows.length} rows ✓`);
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  await conn.end();
  console.log('\nImport complete!');
}

importData().catch((err) => {
  console.error('Import skipped:', err.message);
  // Don't crash — let the server start anyway
  process.exit(0);
});
