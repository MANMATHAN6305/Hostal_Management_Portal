/**
 * Migration Script: Add gender, capacity columns and update roomType ENUM
 * Run this script once to update the database schema
 * 
 * Usage: node src/migrations/addRoomColumns.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Starting migration...\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected.\n');

    // Step 1: Add gender column
    console.log('📝 Adding gender column...');
    try {
      await sequelize.query(`
        ALTER TABLE Rooms 
        ADD COLUMN gender ENUM('MALE', 'FEMALE') DEFAULT 'MALE' AFTER roomType;
      `);
      console.log('   ✅ gender column added');
    } catch (err) {
      if (err.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('   ⚠️ gender column already exists, skipping...');
      } else {
        throw err;
      }
    }

    // Step 2: Add capacity column
    console.log('📝 Adding capacity column...');
    try {
      await sequelize.query(`
        ALTER TABLE Rooms 
        ADD COLUMN capacity INT DEFAULT 1 AFTER gender;
      `);
      console.log('   ✅ capacity column added');
    } catch (err) {
      if (err.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('   ⚠️ capacity column already exists, skipping...');
      } else {
        throw err;
      }
    }

    // Step 3: Update roomType ENUM to include new values
    console.log('📝 Updating roomType ENUM values...');
    try {
      await sequelize.query(`
        ALTER TABLE Rooms 
        MODIFY COLUMN roomType ENUM('SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'FIVE_BED', 'EIGHT_BED', 'DORMITORY', 'Select Room Type') 
        DEFAULT 'Select Room Type';
      `);
      console.log('   ✅ roomType ENUM updated');
    } catch (err) {
      console.log('   ⚠️ roomType update issue:', err.message);
    }

    // Step 4: Update existing rooms with capacity based on roomType
    console.log('📝 Updating existing room capacities...');
    await sequelize.query(`
      UPDATE Rooms SET capacity = CASE 
        WHEN roomType = 'SINGLE' THEN 1
        WHEN roomType = 'DOUBLE' THEN 2
        WHEN roomType = 'TRIPLE' THEN 3
        WHEN roomType = 'FOUR_BED' THEN 4
        WHEN roomType = 'FIVE_BED' THEN 5
        WHEN roomType = 'EIGHT_BED' THEN 8
        WHEN roomType = 'DORMITORY' THEN 10
        ELSE 1
      END
      WHERE capacity IS NULL OR capacity = 0 OR capacity = 1;
    `);
    console.log('   ✅ Existing room capacities updated');

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Migration completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\nYou can now restart your server.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
