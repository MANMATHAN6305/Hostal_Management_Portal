import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { roomsApi, adminApi } from '@/lib/api';
import type { Room } from '@/types';
import {
  defaultCapacityLabel,
  defaultRoomTypeLabel,
  defaultRoomTypeOrder,
  getBlocksByGender,
  getRoomCountForType,
  getTotalRoomsInBlock
} from '@/data/defaultHostelDetails';

interface Hostel {
  id: number;
  name: string;
  blockCode?: string | null;
  gender: 'MALE' | 'FEMALE' | 'COED';
}

interface HostelOption extends Hostel {
  roomCount: number;
}

const normalize = (value: string | null | undefined) =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const stripBlockWord = (value: string | null | undefined) =>
  String(value || '').replace(/\bblock\b/gi, '').trim();

const getRoomPrefix = (roomNumber: string | null | undefined) =>
  normalize(String(roomNumber || '').split('-')[0]);

const roomMatchesHostel = (room: Room, hostel: Hostel) => {
  const roomHostelId = (room as any).hostelId;
  if (roomHostelId !== undefined && roomHostelId !== null && Number(roomHostelId) === hostel.id) {
    return true;
  }

  const roomBlock = normalize(stripBlockWord(room.blockName));
  const hostelName = normalize(stripBlockWord(hostel.name));
  const hostelCode = normalize(hostel.blockCode || '');
  const roomPrefix = getRoomPrefix(room.roomNumber);

  if (roomBlock && hostelName && (roomBlock === hostelName || roomBlock.includes(hostelName) || hostelName.includes(roomBlock))) {
    return true;
  }

  if (hostelCode && roomPrefix && hostelCode === roomPrefix) {
    return true;
  }

  return false;
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'success';
    case 'OCCUPIED': return 'warning';
    case 'MAINTENANCE': return 'danger';
    default: return 'default';
  }
};

const roomTypeCapacityMap: Record<string, number> = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  FOUR_BED: 4,
  FIVE_BED: 5,
  EIGHT_BED: 8,
  DORMITORY: 10
};

const getCapacityFromRoom = (room: Room) => {
  const mappedCapacity = roomTypeCapacityMap[room.roomType];
  if (mappedCapacity) return mappedCapacity;

  const fallbackCapacity = Number(room.capacity || 0);
  if (Number.isFinite(fallbackCapacity) && fallbackCapacity > 0) return fallbackCapacity;

  return 1;
};

// Format room type for display
const formatRoomType = (type: string) => {
  switch (type) {
    case 'SINGLE': return 'Single (1 bed)';
    case 'DOUBLE': return 'Double (2 beds)';
    case 'TRIPLE': return 'Triple (3 beds)';
    case 'FOUR_BED': return 'Four Bedded (4 beds)';
    case 'FIVE_BED': return 'Five Bedded (5 beds)';
    case 'EIGHT_BED': return 'Eight Bedded (8 beds)';
    case 'DORMITORY': return 'Dormitory (10+ beds)';
    default: return type;
  }
};

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [hostelFilter, setHostelFilter] = useState('ALL');
  const defaultMaleBlocks = useMemo(() => getBlocksByGender('MALE'), []);
  const defaultFemaleBlocks = useMemo(() => getBlocksByGender('FEMALE'), []);

  const hostelOptions = useMemo(() => {
    return hostels
      .filter((hostel) => genderFilter === 'ALL' || hostel.gender === genderFilter || hostel.gender === 'COED')
      .map((hostel) => {
        const roomCount = rooms.filter((room) => {
          if (genderFilter !== 'ALL' && room.gender !== genderFilter) return false;
          return roomMatchesHostel(room, hostel);
        }).length;
        return { ...hostel, roomCount };
      })
      .filter((hostel) => hostel.roomCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hostels, rooms, genderFilter]);

  // Calculate statistics
  const roomOccupancy = rooms.map((room) => {
    const totalBeds = getCapacityFromRoom(room);
    const occupiedBeds = Math.max(0, Math.min(totalBeds, Number(room.occupied || 0)));

    return {
      totalBeds,
      occupiedBeds,
      availableBeds: Math.max(0, totalBeds - occupiedBeds)
    };
  });

  const stats = {
    total: rooms.length,
    availableBeds: roomOccupancy.reduce((sum, current) => sum + current.availableBeds, 0),
    occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
    maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
    totalCapacity: roomOccupancy.reduce((sum, current) => sum + current.totalBeds, 0),
    totalOccupied: roomOccupancy.reduce((sum, current) => sum + current.occupiedBeds, 0),
  };

  useEffect(() => {
    fetchRoomsAndHostels();
  }, []);

  useEffect(() => {
    let filtered = rooms;
    
    // Apply gender filter
    if (genderFilter !== 'ALL') {
      filtered = filtered.filter(room => room.gender === genderFilter);
    }

    // Apply hostel filter
    if (hostelFilter !== 'ALL') {
      const selectedHostel = hostels.find((h) => String(h.id) === hostelFilter);
      filtered = selectedHostel ? filtered.filter((room) => roomMatchesHostel(room, selectedHostel)) : [];
    }
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(room => room.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.roomNumber?.toLowerCase().includes(query) ||
        room.blockName?.toLowerCase().includes(query) ||
        room.roomType?.toLowerCase().includes(query) ||
        room.amenities?.toLowerCase().includes(query)
      );
    }

    // Sort by block name first, then by room number
    filtered = [...filtered].sort((a, b) => {
      // First sort by block name
      const blockCompare = (a.blockName || '').localeCompare(b.blockName || '');
      if (blockCompare !== 0) return blockCompare;
      
      // Then sort by room number (extract numeric part for proper sorting)
      const aNum = parseInt(a.roomNumber?.replace(/\D/g, '') || '0');
      const bNum = parseInt(b.roomNumber?.replace(/\D/g, '') || '0');
      return aNum - bNum;
    });
    
    setFilteredRooms(filtered);
  }, [searchQuery, statusFilter, genderFilter, hostelFilter, rooms]);

  // Get hostels based on gender filter
  const getHostelOptions = () => {
    return hostelOptions;
  };

  const fetchRoomsAndHostels = async () => {
    try {
      const [roomsData, hostelsData] = await Promise.all([
        roomsApi.getAll(),
        adminApi.getHostels()
      ]);
      const roomArray = Array.isArray(roomsData) ? roomsData : [];
      const hostelArray = hostelsData.hostels || [];
      setRooms(roomArray);
      setFilteredRooms(roomArray);
      setHostels(hostelArray);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this room?')) {
      try {
        await roomsApi.delete(id);
        setRooms(rooms.filter(room => room.id !== id));
      } catch (error) {
        console.error('Failed to delete room:', error);
        alert('Failed to delete room');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hostel Rooms</h1>
          <p className="text-gray-600">Manage hostel rooms and their availability</p>
        </div>
        <Link to="/rooms/add">
          <Button>+ Add Room</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="py-5 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Default Room Structure</h2>
            <p className="text-sm text-gray-600 mt-1">
              Reference block-wise room distribution from the provided hostel master details.
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                <h3 className="text-sm md:text-base font-semibold text-blue-900">Men&apos;s Hostel Blocks</h3>
                <p className="text-xs md:text-sm text-blue-800">
                  {defaultCapacityLabel.MALE.blocks} blocks | {defaultCapacityLabel.MALE.rooms} rooms | {defaultCapacityLabel.MALE.members} members
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-blue-900 border-b border-blue-200">
                      <th className="py-2 pr-4 font-semibold">Block</th>
                      {defaultRoomTypeOrder.map((roomType) => (
                        <th key={`male-header-${roomType}`} className="py-2 px-2 font-semibold text-right">
                          {defaultRoomTypeLabel[roomType]}
                        </th>
                      ))}
                      <th className="py-2 pl-3 font-semibold text-right">Total Rooms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultMaleBlocks.map((block) => (
                      <tr key={`male-${block.name}`} className="border-b border-blue-100 last:border-b-0">
                        <td className="py-2 pr-4 font-medium text-gray-800">{block.name}</td>
                        {defaultRoomTypeOrder.map((roomType) => {
                          const count = getRoomCountForType(block, roomType);
                          return (
                            <td key={`male-${block.name}-${roomType}`} className="py-2 px-2 text-right text-gray-700">
                              {count > 0 ? count : '-'}
                            </td>
                          );
                        })}
                        <td className="py-2 pl-3 text-right font-semibold text-gray-900">{getTotalRoomsInBlock(block)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-pink-200 bg-pink-50/30 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                <h3 className="text-sm md:text-base font-semibold text-pink-900">Women&apos;s Hostel Blocks</h3>
                <p className="text-xs md:text-sm text-pink-800">
                  {defaultCapacityLabel.FEMALE.blocks} blocks | {defaultCapacityLabel.FEMALE.rooms} rooms | {defaultCapacityLabel.FEMALE.members} members
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-pink-900 border-b border-pink-200">
                      <th className="py-2 pr-4 font-semibold">Block</th>
                      {defaultRoomTypeOrder.map((roomType) => (
                        <th key={`female-header-${roomType}`} className="py-2 px-2 font-semibold text-right">
                          {defaultRoomTypeLabel[roomType]}
                        </th>
                      ))}
                      <th className="py-2 pl-3 font-semibold text-right">Total Rooms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultFemaleBlocks.map((block) => (
                      <tr key={`female-${block.name}`} className="border-b border-pink-100 last:border-b-0">
                        <td className="py-2 pr-4 font-medium text-gray-800">{block.name}</td>
                        {defaultRoomTypeOrder.map((roomType) => {
                          const count = getRoomCountForType(block, roomType);
                          return (
                            <td key={`female-${block.name}-${roomType}`} className="py-2 px-2 text-right text-gray-700">
                              {count > 0 ? count : '-'}
                            </td>
                          );
                        })}
                        <td className="py-2 pl-3 text-right font-semibold text-gray-900">{getTotalRoomsInBlock(block)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {defaultFemaleBlocks.some((block) => block.note) && (
                <div className="mt-3 space-y-1">
                  {defaultFemaleBlocks
                    .filter((block) => block.note)
                    .map((block) => (
                      <p key={`female-note-${block.name}`} className="text-xs text-pink-800">
                        <span className="font-semibold">{block.name}:</span> {block.note}
                      </p>
                    ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Rooms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.availableBeds}</p>
            <p className="text-sm text-gray-500">Available Beds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.occupied}</p>
            <p className="text-sm text-gray-500">Fully Occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.maintenance}</p>
            <p className="text-sm text-gray-500">Maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalCapacity}</p>
            <p className="text-sm text-gray-500">Total Beds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalOccupied}</p>
            <p className="text-sm text-gray-500">Beds Occupied</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <Input
                  type="text"
                  placeholder="Search by Room Number, Hostel Name, Type, or Amenities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={genderFilter}
                onChange={(e) => { setGenderFilter(e.target.value); setHostelFilter('ALL'); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
              >
                <option value="ALL">All Hostels</option>
                <option value="MALE">Men's Hostel</option>
                <option value="FEMALE">Women's Hostel</option>
              </select>
              <select
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
              >
                <option value="ALL">All Blocks</option>
                {getHostelOptions().map(hostel => (
                  <option key={hostel.id} value={String(hostel.id)}>
                    {hostel.name} ({hostel.roomCount} rooms)
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
              {(searchQuery || statusFilter !== 'ALL' || genderFilter !== 'ALL' || hostelFilter !== 'ALL') && (
                <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setGenderFilter('ALL'); setHostelFilter('ALL'); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
          {(searchQuery || statusFilter !== 'ALL' || genderFilter !== 'ALL' || hostelFilter !== 'ALL') && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredRooms.length} of {rooms.length} rooms
            </p>
          )}
        </CardContent>
      </Card>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No rooms found. Add your first room to get started.</p>
          </CardContent>
        </Card>
      ) : filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No rooms match your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card key={room.id}>
              <CardContent>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Room {room.roomNumber}</h3>
                    <p className="text-sm text-gray-600">{room.blockName} - Floor {room.floorNumber}</p>
                    <p className="text-xs text-gray-500">{room.gender === 'FEMALE' ? "Women's Hostel" : "Men's Hostel"}</p>
                  </div>
                  <Badge variant={statusBadgeVariant(room.status)}>{room.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{room.description || 'No description'}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium text-gray-800">{formatRoomType(room.roomType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Occupancy:</span>
                    <span className="font-medium text-gray-800">
                      {Math.max(0, Math.min(getCapacityFromRoom(room), Number(room.occupied || 0)))}/{getCapacityFromRoom(room)} beds occupied
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Available Beds:</span>
                    <span className="font-medium text-gray-800">
                      {Math.max(0, getCapacityFromRoom(room) - Math.max(0, Math.min(getCapacityFromRoom(room), Number(room.occupied || 0))))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fee/Semester:</span>
                    <span className="font-medium text-gray-800">₹{room.pricePerNight?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amenities:</span>
                    <span className="font-medium text-gray-800 text-right max-w-[60%] truncate" title={room.amenities || 'N/A'}>{room.amenities || 'N/A'}</span>
                  </div>
                  {(room as any).hostel && (
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 font-medium">Hostel Details</p>
                        <p className="text-xs text-gray-700 font-semibold">{(room as any).hostel.name}</p>
                      </div>
                      {(room as any).hostel.warden ? (
                        <p className="text-xs text-green-600">
                          ✅ Warden: {(room as any).hostel.warden.fullName}
                        </p>
                      ) : (
                        <p className="text-xs text-orange-600">
                          ⚠️ No Warden Assigned
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Link to={`/rooms/edit/${room.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">Edit</Button>
                  </Link>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDelete(room.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
