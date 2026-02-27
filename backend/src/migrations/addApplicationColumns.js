/**
 * Migration Script: Add detailed hostel application fields to Applications table
 * Usage: node src/migrations/addApplicationColumns.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function hasColumn(table, column) {
  const [rows] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}';`);
  return rows.length > 0;
}

async function addColumnIfMissing(table, column, definitionSql) {
  const exists = await hasColumn(table, column);
  if (exists) {
    console.log(`${table}.${column} already exists, skipping.`);
    return;
  }
  await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definitionSql};`);
  console.log(`Added ${table}.${column}`);
}

async function migrate() {
  try {
    console.log('Starting Applications migration...');
    await sequelize.authenticate();
    console.log('Database connected.');

    const table = 'Applications';

    await addColumnIfMissing(table, 'fullName', 'VARCHAR(120) NULL');
    await addColumnIfMissing(table, 'registerNumber', 'VARCHAR(50) NULL');
    await addColumnIfMissing(table, 'department', 'VARCHAR(100) NULL');
    await addColumnIfMissing(table, 'yearOfStudy', "ENUM('1','2','3','4') NULL");
    await addColumnIfMissing(table, 'gender', "ENUM('MALE','FEMALE','OTHER') NULL");
    await addColumnIfMissing(table, 'dateOfBirth', 'DATE NULL');
    await addColumnIfMissing(table, 'studentEmail', 'VARCHAR(150) NULL');
    await addColumnIfMissing(table, 'mobileNumber', 'VARCHAR(20) NULL');
    await addColumnIfMissing(table, 'roomType', 'VARCHAR(50) NULL');
    await addColumnIfMissing(table, 'blockName', 'VARCHAR(50) NULL');
    await addColumnIfMissing(table, 'specialPreferences', 'TEXT NULL');
    await addColumnIfMissing(table, 'guardianName', 'VARCHAR(120) NULL');
    await addColumnIfMissing(table, 'relationship', 'VARCHAR(60) NULL');
    await addColumnIfMissing(table, 'guardianContactNumber', 'VARCHAR(20) NULL');
    await addColumnIfMissing(table, 'guardianAddress', 'TEXT NULL');

    console.log('Applications migration completed.');
  } catch (error) {
    console.error('Applications migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate().then(() => process.exit(0));
