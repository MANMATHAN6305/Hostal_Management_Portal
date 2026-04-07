import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { roomsApi, adminApi } from '@/lib/api';
import type { Room, RoomStatus } from '@/types';
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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [hostelFilter, setHostelFilter] = useState('ALL');
  const [bedsFilter, setBedsFilter] = useState('ALL');
  const [occupiedBedsFilter, setOccupiedBedsFilter] = useState('ALL');
  const defaultMaleBlocks = useMemo(() => getBlocksByGender('MALE'), []);
  const defaultFemaleBlocks = useMemo(() => getBlocksByGender('FEMALE'), []);

  const bedOptions = useMemo(() => {
    const values = new Set<number>();
    rooms.forEach((room) => values.add(getCapacityFromRoom(room)));
    return Array.from(values).sort((a, b) => a - b);
  }, [rooms]);

  const occupiedBedOptions = useMemo(() => {
    const values = new Set<number>();
    rooms.forEach((room) => {
      const capacity = getCapacityFromRoom(room);
      const occupiedBeds = Math.max(0, Math.min(capacity, Number(room.occupied || 0)));
      values.add(occupiedBeds);
    });
    return Array.from(values).sort((a, b) => a - b);
  }, [rooms]);

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

    // Apply total beds filter
    if (bedsFilter !== 'ALL') {
      filtered = filtered.filter((room) => getCapacityFromRoom(room) === Number(bedsFilter));
    }

    // Apply occupied beds filter
    if (occupiedBedsFilter !== 'ALL') {
      filtered = filtered.filter((room) => {
        const capacity = getCapacityFromRoom(room);
        const occupiedBeds = Math.max(0, Math.min(capacity, Number(room.occupied || 0)));
        return occupiedBeds === Number(occupiedBedsFilter);
      });
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
  }, [searchQuery, statusFilter, genderFilter, hostelFilter, bedsFilter, occupiedBedsFilter, rooms]);

  // Get hostels based on gender filter
  const getHostelOptions = () => {
    return hostelOptions;
  };

  const fetchRoomsAndHostels = async () => {
    try {
      const [roomsResult, hostelsResult] = await Promise.allSettled([
        roomsApi.getAll(),
        adminApi.getHostels()
      ]);

      const roomPayload = roomsResult.status === 'fulfilled' ? roomsResult.value : null;
      const hostelsPayload = hostelsResult.status === 'fulfilled' ? hostelsResult.value : null;

      const roomArray = Array.isArray(roomPayload)
        ? roomPayload
        : Array.isArray((roomPayload as any)?.rooms)
          ? (roomPayload as any).rooms
          : [];

      const hostelArray = Array.isArray((hostelsPayload as any)?.hostels)
        ? (hostelsPayload as any).hostels
        : Array.isArray(hostelsPayload)
          ? hostelsPayload
          : [];

      setRooms(roomArray);
      setFilteredRooms(roomArray);
      setHostels(hostelArray);

      if (roomsResult.status === 'rejected' || hostelsResult.status === 'rejected') {
        console.error('Rooms/hostels fetch partially failed:', {
          rooms: roomsResult.status === 'rejected' ? roomsResult.reason : null,
          hostels: hostelsResult.status === 'rejected' ? hostelsResult.reason : null
        });
      }
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

  const roomTooltip = (room: Room) => {
    const capacity = getCapacityFromRoom(room);
    const occupiedBeds = Math.max(0, Math.min(capacity, Number(room.occupied || 0)));
    return [
      `Room ${room.roomNumber}`,
      `${room.blockName} | Floor ${room.floorNumber}`,
      `${formatRoomType(room.roomType)}`,
      `Beds: ${occupiedBeds}/${capacity}`,
      `Status: ${room.status}`
    ].join(' | ');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hostel Rooms</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage hostel rooms and their availability</p>
        </div>
        <Link to="/rooms/add">
          <Button>+ Add Room</Button>
        </Link>
      </div>

      {/* Statistics Cards - Keeping these as is for now, assuming the focus is on the room grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[220px] flex-1">
              <Input
                type="text"
                placeholder="Search by Room Number, Hostel Name, Type, or Amenities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setHostelFilter('ALL'); }}
              className="w-auto min-w-[160px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
            >
              <option value="ALL">All Hostels</option>
              <option value="MALE">Men's Hostel</option>
              <option value="FEMALE">Women's Hostel</option>
            </select>
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              className="w-auto min-w-[170px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
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
              className="w-auto min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
            <select
              value={bedsFilter}
              onChange={(e) => setBedsFilter(e.target.value)}
              className="w-auto min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
            >
              <option value="ALL">All Beds</option>
              {bedOptions.map((beds) => (
                <option key={`beds-${beds}`} value={String(beds)}>
                  {beds} Beds
                </option>
              ))}
            </select>
            <select
              value={occupiedBedsFilter}
              onChange={(e) => setOccupiedBedsFilter(e.target.value)}
              className="w-auto min-w-[160px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
            >
              <option value="ALL">Occupied Beds</option>
              {occupiedBedOptions.map((occupiedBeds) => (
                <option key={`occupied-beds-${occupiedBeds}`} value={String(occupiedBeds)}>
                  {occupiedBeds} Occupied
                </option>
              ))}
            </select>
            {(searchQuery || statusFilter !== 'ALL' || genderFilter !== 'ALL' || hostelFilter !== 'ALL' || bedsFilter !== 'ALL' || occupiedBedsFilter !== 'ALL') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setGenderFilter('ALL');
                  setHostelFilter('ALL');
                  setBedsFilter('ALL');
                  setOccupiedBedsFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
          {(searchQuery || statusFilter !== 'ALL' || genderFilter !== 'ALL' || hostelFilter !== 'ALL' || bedsFilter !== 'ALL' || occupiedBedsFilter !== 'ALL') && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredRooms.length} of {rooms.length} rooms
            </p>
          )}
        </CardContent>
      </Card>

      {rooms.length === 0 ? (
        <Card className="bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]">
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
      ) : ( // Main Room Grid Card
        <Card className="bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Room Seat Grid</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--foreground-muted)]">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-white" style={{ backgroundColor: '#93c5fd' }} />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-white" style={{ backgroundColor: '#4ade80' }} />
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-white" style={{ backgroundColor: '#fb7185' }} />
                  <span>Maintenance</span>
                </div>
              </div>
            </div>
            <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-[var(--foreground)]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12"> {/* Responsive density for mobile and desktop */}
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onClick={() => setSelectedRoom(room)}
                  />
                ))}
              </div>
            </div>

            <div className="pt-1" />
          </CardContent>
        </Card>
      )}

      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSelectedRoom(null)}>
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--foreground)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">Room {selectedRoom.roomNumber}</h3>
                <p className="text-xs text-[var(--foreground-muted)]">{selectedRoom.blockName} | Floor {selectedRoom.floorNumber}</p>
              </div>
              <Badge variant={statusBadgeVariant(selectedRoom.status)}>{selectedRoom.status}</Badge>
            </div>

            <div className="space-y-1 text-xs text-[var(--foreground)]">
              <p><span className="text-[var(--foreground-muted)]">Type:</span> {formatRoomType(selectedRoom.roomType)}</p>
              <p><span className="text-[var(--foreground-muted)]">Beds:</span> {Math.max(0, Math.min(getCapacityFromRoom(selectedRoom), Number(selectedRoom.occupied || 0)))}/{getCapacityFromRoom(selectedRoom)}</p>
              <p><span className="text-[var(--foreground-muted)]">Fee:</span> ₹{selectedRoom.pricePerNight?.toLocaleString()}</p>
              <p><span className="text-[var(--foreground-muted)]">Amenities:</span> {selectedRoom.amenities || 'N/A'}</p>
              <p><span className="text-[var(--foreground-muted)]">Description:</span> {selectedRoom.description || 'N/A'}</p>
            </div>

            <div className="mt-3 flex gap-2">
              <Link to={`/rooms/edit/${selectedRoom.id}`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">Edit</Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => {
                  handleDelete(selectedRoom.id);
                  setSelectedRoom(null);
                }}
              >
                Delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedRoom(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const RoomCard = ({ room, onClick }: { room: Room; onClick: () => void }) => {
  const capacity = getCapacityFromRoom(room);
  const isHighCapacity = capacity === 5 || capacity >= 8;

  const getVisualSlotCount = (bedCount: number) => {
    if (bedCount <= 1) return 1;
    if (bedCount === 2) return 2;
    if (bedCount === 3) return 3;
    if (bedCount === 5) return 5;
    if (bedCount >= 8) return 8;
    return 4;
  };

  const getOccupiedVisualCount = (bedCount: number) => {
    const slotCount = getVisualSlotCount(bedCount);

    if (room.status === 'MAINTENANCE') return 0;

    const occupiedBeds = Math.max(0, Math.min(capacity, Number(room.occupied || 0)));
    if (occupiedBeds === 0) return 0;
    if (occupiedBeds >= capacity) return slotCount;

    return Math.max(1, Math.round((occupiedBeds / Math.max(1, capacity)) * slotCount));
  };

  const getBedToneClass = (slotIndex: number, bedCount: number) => {
    if (room.status === 'MAINTENANCE') {
      return 'bg-[#fb7185]';
    }

    const occupiedVisual = getOccupiedVisualCount(bedCount);
    return slotIndex < occupiedVisual ? 'bg-[#4ade80]' : 'bg-[#93c5fd]';
  };
  
  const renderBedLayout = (bedCount: number) => {
    const bedBaseClass = 'rounded-md min-h-0 min-w-0 border-[3px] border-[var(--surface)] shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)]';
    const dividerClass = 'bg-[var(--surface)] p-2';
    const bedClass = (slotIndex: number) => `${bedBaseClass} ${getBedToneClass(slotIndex, bedCount)}`;

    if (bedCount <= 1) {
      return (
        <div className={`grid h-full w-full place-items-center ${dividerClass}`}>
          <div className={`h-full w-1/2 min-w-[4.5rem] ${bedClass(0)}`} />
        </div>
      );
    }

    if (bedCount === 2) {
      return (
        <div className={`grid h-full w-full grid-cols-2 gap-2 ${dividerClass}`}>
          <div className={`h-full w-full ${bedClass(0)}`} />
          <div className={`h-full w-full ${bedClass(1)}`} />
        </div>
      );
    }

    if (bedCount === 3) {
      return (
        <div className={`grid h-full w-full grid-cols-2 grid-rows-2 gap-2 ${dividerClass}`}>
          <div className={`row-span-2 h-full w-full ${bedClass(0)}`} />
          <div className={`h-full w-full ${bedClass(1)}`} />
          <div className={`h-full w-full ${bedClass(2)}`} />
        </div>
      );
    }

    if (bedCount === 5) {
      return (
        <div className={`grid h-full w-full grid-cols-2 grid-rows-3 gap-2 ${dividerClass}`}>
          <div className={`h-full w-full ${bedClass(0)}`} />
          <div className={`h-full w-full ${bedClass(1)}`} />
          <div className={`h-full w-full ${bedClass(2)}`} />
          <div className={`h-full w-full ${bedClass(3)}`} />
          <div className={`col-span-2 h-full w-full ${bedClass(4)}`} />
        </div>
      );
    }

    if (bedCount >= 8) {
      return (
        <div className={`grid h-full w-full grid-cols-2 grid-rows-4 gap-2 ${dividerClass}`}>
          <div className={`h-full w-full ${bedClass(0)}`} />
          <div className={`h-full w-full ${bedClass(1)}`} />
          <div className={`h-full w-full ${bedClass(2)}`} />
          <div className={`h-full w-full ${bedClass(3)}`} />
          <div className={`h-full w-full ${bedClass(4)}`} />
          <div className={`h-full w-full ${bedClass(5)}`} />
          <div className={`h-full w-full ${bedClass(6)}`} />
          <div className={`h-full w-full ${bedClass(7)}`} />
        </div>
      );
    }

    return (
      <div className={`grid h-full w-full grid-cols-2 grid-rows-2 gap-2 ${dividerClass}`}>
        <div className={`h-full w-full ${bedClass(0)}`} />
        <div className={`h-full w-full ${bedClass(1)}`} />
        <div className={`h-full w-full ${bedClass(2)}`} />
        <div className={`h-full w-full ${bedClass(3)}`} />
      </div>
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative z-0 w-full mx-auto flex flex-col justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-md transition-all duration-300 ease-in-out transform-gpu origin-center hover:z-20 hover:-translate-y-1 hover:scale-[1.08] hover:shadow-[0_14px_28px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] overflow-hidden ${isHighCapacity ? 'aspect-[1.15/1] sm:col-span-2' : 'aspect-square'}`}
      aria-label={`Open room ${room.roomNumber}, status ${room.status}`}
    >
      <div className="px-2 pt-2 flex w-full justify-between items-center">
        <div className="text-xs font-bold text-[var(--foreground)]">{room.roomNumber}</div>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: room.status === 'AVAILABLE' ? '#06b6d4' : room.status === 'OCCUPIED' ? '#22c55e' : '#ef4444' }} />
      </div>
      
      <div className="flex-grow flex items-center justify-center w-full">
        {renderBedLayout(capacity)}
      </div>
      
      <div className="px-2 pb-1.5 text-[10px] font-semibold text-[var(--foreground-muted)] text-right w-full truncate">
        {formatRoomType(room.roomType)}
      </div>
    </button>
  );
};
