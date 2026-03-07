export type DefaultRoomType =
  | 'SINGLE'
  | 'DOUBLE'
  | 'FOUR_BED'
  | 'FIVE_BED'
  | 'EIGHT_BED'
  | 'GUEST_ROOM';

export interface DefaultRoomMix {
  roomType: DefaultRoomType;
  count: number;
}

export interface DefaultHostelBlock {
  name: string;
  gender: 'MALE' | 'FEMALE';
  roomMix: DefaultRoomMix[];
  note?: string;
}

export const defaultRoomTypeOrder: DefaultRoomType[] = [
  'EIGHT_BED',
  'FIVE_BED',
  'FOUR_BED',
  'DOUBLE',
  'SINGLE',
  'GUEST_ROOM'
];

export const defaultRoomTypeLabel: Record<DefaultRoomType, string> = {
  EIGHT_BED: '8 Bed',
  FIVE_BED: '5 Bed',
  FOUR_BED: '4 Bed',
  DOUBLE: 'Double',
  SINGLE: 'Single',
  GUEST_ROOM: 'Guest'
};

export const defaultCapacityLabel: Record<'MALE' | 'FEMALE', { members: number; rooms: number; blocks: number }> = {
  MALE: { members: 3727, rooms: 1173, blocks: 6 },
  FEMALE: { members: 2171, rooms: 636, blocks: 7 }
};

export const defaultHostelBlocks: DefaultHostelBlock[] = [
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
    ],
    note: 'Included exactly as provided in source details.'
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

export const getBlocksByGender = (gender: 'MALE' | 'FEMALE') =>
  defaultHostelBlocks.filter((block) => block.gender === gender);

export const getRoomCountForType = (block: DefaultHostelBlock, roomType: DefaultRoomType) =>
  block.roomMix
    .filter((mix) => mix.roomType === roomType)
    .reduce((sum, mix) => sum + mix.count, 0);

export const getTotalRoomsInBlock = (block: DefaultHostelBlock) =>
  block.roomMix.reduce((sum, mix) => sum + mix.count, 0);

