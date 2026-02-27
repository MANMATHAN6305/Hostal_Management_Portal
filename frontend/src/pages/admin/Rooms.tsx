import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { roomsApi } from '@/lib/api';
import type { Room } from '@/types';

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'success';
    case 'OCCUPIED': return 'warning';
    case 'MAINTENANCE': return 'danger';
    default: return 'default';
  }
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

// All hostel blocks
const allHostels = [
  // Men's Hostels
  { value: 'Sapphire', label: 'Sapphire', gender: 'MALE' },
  { value: 'Emerald', label: 'Emerald', gender: 'MALE' },
  { value: 'Ruby', label: 'Ruby', gender: 'MALE' },
  { value: 'Diamond', label: 'Diamond', gender: 'MALE' },
  { value: 'Coral', label: 'Coral (AC)', gender: 'MALE' },
  { value: 'Pearl', label: 'Pearl', gender: 'MALE' },
  // Women's Hostels
  { value: 'Ganga', label: 'Ganga', gender: 'FEMALE' },
  { value: 'Yamuna', label: 'Yamuna', gender: 'FEMALE' },
  { value: 'Narmadha', label: 'Narmadha', gender: 'FEMALE' },
  { value: 'Cauvery', label: 'Cauvery', gender: 'FEMALE' },
  { value: 'North Bhavani', label: 'North Bhavani', gender: 'FEMALE' },
  { value: 'South Bhavani', label: 'South Bhavani', gender: 'FEMALE' },
  { value: 'Old Bhavani', label: 'Old Bhavani', gender: 'FEMALE' },
];

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [hostelFilter, setHostelFilter] = useState('ALL');

  // Calculate statistics
  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'AVAILABLE').length,
    occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
    maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
    totalCapacity: rooms.reduce((sum, r) => sum + (r.capacity || 0), 0),
    totalOccupied: rooms.reduce((sum, r) => sum + (r.occupied || 0), 0),
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    let filtered = rooms;
    
    // Apply gender filter
    if (genderFilter !== 'ALL') {
      filtered = filtered.filter(room => room.gender === genderFilter);
    }

    // Apply hostel filter
    if (hostelFilter !== 'ALL') {
      filtered = filtered.filter(room => room.blockName === hostelFilter);
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
    if (genderFilter === 'ALL') return allHostels;
    return allHostels.filter(h => h.gender === genderFilter);
  };

  const fetchRooms = async () => {
    try {
      const data = await roomsApi.getAll();
      const roomData = Array.isArray(data) ? data : [];
      setRooms(roomData);
      setFilteredRooms(roomData);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
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
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            <p className="text-sm text-gray-500">Available</p>
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
                  <option key={hostel.value} value={hostel.value}>{hostel.label}</option>
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
                      {room.occupied || 0} / {room.capacity || 0} beds
                      {room.capacity && room.occupied < room.capacity && (
                        <span className="text-green-600 ml-1">({room.capacity - room.occupied} available)</span>
                      )}
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
