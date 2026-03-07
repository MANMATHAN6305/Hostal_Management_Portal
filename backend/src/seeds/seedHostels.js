require('dotenv').config();
const { sequelize } = require('../config/database');
require('../models');

const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const Application = require('../models/Application');
const {
  defaultHostelBlocks,
  buildUniqueBlockCodes,
  getTotalRoomsInBlock
} = require('./defaultHostelStructure');

async function seedHostels() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync();

    console.log('Resetting dependent tables for fresh hostel master data...');
    await Allocation.destroy({ where: {}, force: true });
    await Application.destroy({ where: {}, force: true });
    await Room.destroy({ where: {}, force: true });
    await Hostel.destroy({ where: {}, force: true });

    const seededBlocks = buildUniqueBlockCodes(defaultHostelBlocks);
    const hostels = seededBlocks.map((block) => ({
      name: block.name,
      blockCode: block.blockCode,
      gender: block.gender,
      totalRooms: getTotalRoomsInBlock(block),
      wardenId: null
    }));

    const createdHostels = await Hostel.bulkCreate(hostels);

    const maleCount = createdHostels.filter((h) => h.gender === 'MALE').length;
    const femaleCount = createdHostels.filter((h) => h.gender === 'FEMALE').length;
    const totalRooms = createdHostels.reduce((sum, h) => sum + Number(h.totalRooms || 0), 0);

    console.log(`Hostels created: ${createdHostels.length}`);
    console.log(`Male hostels: ${maleCount}`);
    console.log(`Female hostels: ${femaleCount}`);
    console.log(`Total rooms (target): ${totalRooms}`);
    console.log('Hostel seed completed.');

    process.exit(0);
  } catch (error) {
    console.error('Hostel seed failed:', error);
    process.exit(1);
  }
}

seedHostels();
