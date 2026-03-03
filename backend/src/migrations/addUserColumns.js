/**
 * Migration Script: Patch Users table for new auth/RBAC fields
 * Usage: node src/migrations/addUserColumns.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function hasColumn(table, column) {
  const [rows] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}';`);
  return rows.length > 0;
}

async function migrate() {
  try {
    console.log('Starting Users migration...');
    await sequelize.authenticate();
    console.log('Database connected.');

    const hasStaffRole = await hasColumn('Users', 'staffRole');
    if (!hasStaffRole) {
      await sequelize.query(`
        ALTER TABLE \`Users\`
        ADD COLUMN \`staffRole\` ENUM('ELECTRICIAN', 'CLEANER', 'CARETAKER') NULL AFTER \`role\`;
      `);
      console.log('Added Users.staffRole');
    } else {
      console.log('Users.staffRole already exists');
    }

    const hasPhone = await hasColumn('Users', 'phone');
    if (!hasPhone) {
      await sequelize.query(`
        ALTER TABLE \`Users\`
        ADD COLUMN \`phone\` VARCHAR(20) NULL AFTER \`staffRole\`;
      `);
      console.log('Added Users.phone');
    } else {
      console.log('Users.phone already exists');
    }

    const hasGender = await hasColumn('Users', 'gender');
    if (!hasGender) {
      await sequelize.query(`
        ALTER TABLE \`Users\`
        ADD COLUMN \`gender\` ENUM('MALE', 'FEMALE') NULL AFTER \`phone\`;
      `);
      console.log('Added Users.gender');
    } else {
      console.log('Users.gender already exists');
    }

    const hasGoogleId = await hasColumn('Users', 'googleId');
    if (!hasGoogleId) {
      await sequelize.query(`
        ALTER TABLE \`Users\`
        ADD COLUMN \`googleId\` VARCHAR(100) NULL AFTER \`gender\`;
      `);
      console.log('Added Users.googleId');
    } else {
      console.log('Users.googleId already exists');
    }

    await sequelize.query(`
      ALTER TABLE \`Users\`
      MODIFY COLUMN \`role\` ENUM('ADMIN', 'WARDEN', 'STAFF', 'STUDENT', 'Select Role') DEFAULT 'STUDENT';
    `);
    console.log('Updated Users.role enum');

    await sequelize.query(`
      ALTER TABLE \`Users\`
      MODIFY COLUMN \`password\` VARCHAR(255) NULL;
    `);
    console.log('Updated Users.password to allow NULL');

    console.log('Users migration completed.');
  } catch (error) {
    console.error('Users migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate().then(() => process.exit(0));
