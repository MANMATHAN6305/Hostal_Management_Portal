require('dotenv').config();
const { sequelize, Sequelize } = require('../config/database');

async function migrate() {
  try {
    console.log('Starting feedback image column migration...');
    await sequelize.authenticate();
    console.log('Database connected.');

    const qi = sequelize.getQueryInterface();
    const table = await qi.describeTable('feedback');

    if (!table.image_url) {
      await qi.addColumn('feedback', 'image_url', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      console.log('image_url column added to feedback.');
    } else {
      console.log('image_url column already exists on feedback, skipping.');
    }

    console.log('Feedback image column migration completed.');
  } catch (error) {
    console.error('Feedback image column migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate().then(() => process.exit(0));
