const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define(
  'Feedback',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    student_name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    day: {
      type: DataTypes.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
      allowNull: false
    },
    meal_type: {
      type: DataTypes.ENUM('BREAKFAST', 'LUNCH', 'DINNER'),
      allowNull: false
    },
    food_item: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'feedback',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        name: 'idx_feedback_student_meal_created',
        fields: ['student_id', 'meal_type', 'created_at']
      }
    ]
  }
);

module.exports = Feedback;
