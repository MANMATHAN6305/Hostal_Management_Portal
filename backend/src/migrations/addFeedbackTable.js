require('dotenv').config();
const { sequelize, Sequelize } = require('../config/database');

function normalizeTableName(name) {
  return String(name).replace(/[`'"]/g, '').toLowerCase();
}

async function migrate() {
  try {
    console.log('Starting feedback table migration...');
    await sequelize.authenticate();
    console.log('Database connected.');

    const qi = sequelize.getQueryInterface();
    const existingTablesRaw = await qi.showAllTables();
    const existingTables = existingTablesRaw.map((table) => normalizeTableName(table));

    if (existingTables.includes('feedback')) {
      console.log('feedback table already exists, skipping table creation.');
    } else {
      await qi.createTable('feedback', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        student_id: {
          type: Sequelize.BIGINT,
          allowNull: false
        },
        student_name: {
          type: Sequelize.STRING(120),
          allowNull: false
        },
        day: {
          type: Sequelize.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
          allowNull: false
        },
        meal_type: {
          type: Sequelize.ENUM('BREAKFAST', 'LUNCH', 'DINNER'),
          allowNull: false
        },
        food_item: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        rating: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        image_url: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      await qi.addIndex('feedback', ['student_id', 'meal_type', 'created_at'], {
        name: 'idx_feedback_student_meal_created'
      });

      console.log('feedback table created.');
    }

    console.log('Feedback table migration completed.');
  } catch (error) {
    console.error('Feedback table migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate().then(() => process.exit(0));
