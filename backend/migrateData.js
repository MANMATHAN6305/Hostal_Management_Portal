/**
 * Migration script: Local MySQL → Railway MySQL
 * Reads from local DB, writes to Railway DB via Sequelize.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const LOCAL_DB = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Manm@2045',
  database: 'hostel_portal',
};

const RAILWAY_DB = {
  host: 'metro.proxy.rlwy.net',
  port: 50380,
  user: 'root',
  password: 'AXVdBctAncBnULHCqnrxJfPqaVixKyDO',
  database: 'railway',
  connectTimeout: 30000,
};

const TABLES_IN_ORDER = [
  'users',
  'hostels',
  'rooms',
  'students',
  'allocations',
  'menus',
  'complaints',
  'applications',
  'payments',
  'requests',
  'attendances',
  'visitors',
  'wardenmessages',
];

async function migrate() {
  console.log('Connecting to LOCAL DB...');
  const local = await mysql.createConnection(LOCAL_DB);
  console.log('LOCAL DB connected.');

  console.log('Connecting to RAILWAY DB...');
  const remote = await mysql.createConnection(RAILWAY_DB);
  console.log('RAILWAY DB connected.');

  // Disable FK checks on remote
  await remote.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of TABLES_IN_ORDER) {
    try {
      const [rows] = await local.query(`SELECT * FROM \`${table}\``);
      console.log(`\n${table}: ${rows.length} rows`);

      if (rows.length === 0) continue;

      // Truncate remote table first
      await remote.query(`TRUNCATE TABLE \`${table}\``);

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const columns = Object.keys(batch[0]);
        const placeholders = batch
          .map(() => `(${columns.map(() => '?').join(',')})`)
          .join(',');
        const values = batch.flatMap((row) => columns.map((col) => row[col]));

        await remote.query(
          `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(',')}) VALUES ${placeholders}`,
          values
        );
        process.stdout.write(`  Inserted ${Math.min(i + batchSize, rows.length)}/${rows.length}\r`);
      }
      console.log(`  ${table}: Done ✓`);
    } catch (err) {
      console.error(`  ${table}: ERROR - ${err.message}`);
    }
  }

  await remote.query('SET FOREIGN_KEY_CHECKS = 1');
  await local.end();
  await remote.end();
  console.log('\nMigration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
