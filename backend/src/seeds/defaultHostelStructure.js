const defaultHostelBlocks = [
  {
    name: 'Sapphire',
    gender: 'MALE',
    roomMix: [{ roomType: 'FOUR_BED', count: 282 }]
  },
  {
    name: 'Emerald',
    gender: 'MALE',
    roomMix: [{ roomType: 'FOUR_BED', count: 284 }]
  },
  {
    name: 'Ruby',
    gender: 'MALE',
    roomMix: [
      { roomType: 'FOUR_BED', count: 68 },
      { roomType: 'DOUBLE', count: 145 },
      { roomType: 'SINGLE', count: 24 }
    ]
  },
  {
    name: 'Diamond',
    gender: 'MALE',
    roomMix: [
      { roomType: 'DOUBLE', count: 146 },
      { roomType: 'SINGLE', count: 34 }
    ]
  },
  {
    name: 'Coral',
    gender: 'MALE',
    roomMix: [
      { roomType: 'DOUBLE', count: 51 },
      { roomType: 'SINGLE', count: 1 }
    ]
  },
  {
    name: 'Pearl',
    gender: 'MALE',
    roomMix: [{ roomType: 'FOUR_BED', count: 138 }]
  },
  {
    name: 'Ganga',
    gender: 'FEMALE',
    roomMix: [
      { roomType: 'FOUR_BED', count: 124 },
      { roomType: 'DOUBLE', count: 8 }
    ]
  },
  {
    name: 'Ganga (Additional Entry)',
    gender: 'FEMALE',
    roomMix: [
      { roomType: 'FOUR_BED', count: 116 },
      { roomType: 'DOUBLE', count: 5 },
      { roomType: 'GUEST_ROOM', count: 9 }
    ]
  },
  {
    name: 'Yamuna',
    gender: 'FEMALE',
    roomMix: [
      { roomType: 'FOUR_BED', count: 93 },
      { roomType: 'DOUBLE', count: 6 }
    ]
  },
  {
    name: 'Narmadha',
    gender: 'FEMALE',
    roomMix: [
      { roomType: 'FIVE_BED', count: 8 },
      { roomType: 'FOUR_BED', count: 96 },
      { roomType: 'DOUBLE', count: 16 },
      { roomType: 'SINGLE', count: 8 }
    ]
  },
  {
    name: 'Cauvery',
    gender: 'FEMALE',
    roomMix: [
      { roomType: 'DOUBLE', count: 111 },
      { roomType: 'SINGLE', count: 15 }
    ]
  },
  {
    name: 'North Bhavani',
    gender: 'FEMALE',
    roomMix: [
      { roomType: 'FOUR_BED', count: 64 },
      { roomType: 'DOUBLE', count: 4 },
      { roomType: 'SINGLE', count: 4 }
    ]
  },
  {
    name: 'South Bhavani',
    gender: 'FEMALE',
    roomMix: [
      { roomType: 'FOUR_BED', count: 64 },
      { roomType: 'DOUBLE', count: 4 },
      { roomType: 'SINGLE', count: 4 }
    ]
  },
  {
    name: 'Old Bhavani',
    gender: 'FEMALE',
    roomMix: [
      { roomType: 'EIGHT_BED', count: 7 },
      { roomType: 'SINGLE', count: 2 }
    ]
  }
];

const roomTypeToBackend = {
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
  TRIPLE: 'TRIPLE',
  FOUR_BED: 'FOUR_BED',
  FIVE_BED: 'FIVE_BED',
  EIGHT_BED: 'EIGHT_BED',
  DORMITORY: 'DORMITORY',
  GUEST_ROOM: 'SINGLE'
};

const roomTypeCapacity = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  FOUR_BED: 4,
  FIVE_BED: 5,
  EIGHT_BED: 8,
  DORMITORY: 10,
  GUEST_ROOM: 1
};

const roomTypeFee = {
  SINGLE: 24000,
  DOUBLE: 18000,
  TRIPLE: 15000,
  FOUR_BED: 12000,
  FIVE_BED: 10000,
  EIGHT_BED: 8000,
  DORMITORY: 7000,
  GUEST_ROOM: 25000
};

const getTotalRoomsInBlock = (block) =>
  block.roomMix.reduce((sum, mix) => sum + Number(mix.count || 0), 0);

const sanitizeBlockCodeBase = (name) =>
  String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-zA-Z]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'HST';

const buildUniqueBlockCodes = (blocks) => {
  const usedCodes = new Set();

  return blocks.map((block) => {
    const base = sanitizeBlockCodeBase(block.name).slice(0, 3) || 'HST';
    let suffix = 0;
    let code = base;

    while (usedCodes.has(code)) {
      suffix += 1;
      const suffixText = String(suffix);
      code = `${base.slice(0, Math.max(1, 3 - suffixText.length))}${suffixText}`;
    }

    usedCodes.add(code);
    return { ...block, blockCode: code };
  });
};

module.exports = {
  defaultHostelBlocks,
  roomTypeToBackend,
  roomTypeCapacity,
  roomTypeFee,
  getTotalRoomsInBlock,
  buildUniqueBlockCodes
};
