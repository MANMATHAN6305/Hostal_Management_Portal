const { DataTypes } = require('sequelize');

module.exports = {
  up: async (sequelize) => {
    await sequelize.queryInterface.addColumn('Users', 'gender', {
      type: DataTypes.ENUM('MALE', 'FEMALE'),
      allowNull: true
    });
  },

  down: async (sequelize) => {
    await sequelize.queryInterface.removeColumn('Users', 'gender');
  }
};
