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
  getTotalRoomsInBlock,
  roomTypeToBackend,
  roomTypeCapacity,
  roomTypeFee
} = require('./defaultHostelStructure');

const CHUNK_SIZE = 400;

const floorFromSequence = (sequence) => Math.max(1, Math.ceil(sequence / 50));

const toRoomRowsForBlock = (block, hostelId, blockCode) => {
  let sequence = 1;
  const rows = [];

  for (const mix of block.roomMix) {
    const sourceType = mix.roomType;
    const roomType = roomTypeToBackend[sourceType] || 'SINGLE';
    const capacity = roomTypeCapacity[sourceType] || 1;
    const fee = roomTypeFee[sourceType] || 0;

    for (let i = 0; i < mix.count; i += 1) {
      const roomNumber = `${blockCode}-${String(sequence).padStart(3, '0')}`;
      const description = sourceType === 'GUEST_ROOM' ? 'Guest room mapped to SINGLE type in backend.' : '';

      rows.push({
        roomNumber,
        roomType,
        gender: block.gender,
        capacity,
        occupied: 0,
        floorNumber: floorFromSequence(sequence),
        blockName: block.name,
        status: 'AVAILABLE',
        pricePerNight: fee,
        description,
        amenities: '',
        hostelId
      });

      sequence += 1;
    }
  }

  return rows;
};

async function seedHostelsAndRooms() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();

    // Ensures Room and Hostel tables exist before seeding.
    await sequelize.sync();

    console.log('Resetting dependent tables...');
    await Allocation.destroy({ where: {}, force: true });
    await Application.destroy({ where: {}, force: true });
    await Room.destroy({ where: {}, force: true });
    await Hostel.destroy({ where: {}, force: true });

    const seededBlocks = buildUniqueBlockCodes(defaultHostelBlocks);

    const hostelRows = seededBlocks.map((block) => ({
      name: block.name,
      blockCode: block.blockCode,
      gender: block.gender,
      totalRooms: getTotalRoomsInBlock(block),
      wardenId: null
    }));

    const createdHostels = await Hostel.bulkCreate(hostelRows);
    const hostelByName = new Map(createdHostels.map((hostel) => [hostel.name, hostel]));

    const roomRows = [];
    for (const block of seededBlocks) {
      const hostel = hostelByName.get(block.name);
      if (!hostel) continue;
      roomRows.push(...toRoomRowsForBlock(block, hostel.id, block.blockCode));
    }

    for (let i = 0; i < roomRows.length; i += CHUNK_SIZE) {
      const chunk = roomRows.slice(i, i + CHUNK_SIZE);
      await Room.bulkCreate(chunk);
    }

    const maleBlocks = createdHostels.filter((h) => h.gender === 'MALE').length;
    const femaleBlocks = createdHostels.filter((h) => h.gender === 'FEMALE').length;

    console.log(`Hostels seeded: ${createdHostels.length}`);
    console.log(`Rooms seeded: ${roomRows.length}`);
    console.log(`Male blocks: ${maleBlocks}, Female blocks: ${femaleBlocks}`);
    console.log('Hostels and rooms seeding complete.');

    process.exit(0);
  } catch (error) {
    console.error('Hostels/Rooms seeding failed:', error);
    process.exit(1);
  }
}

seedHostelsAndRooms();
