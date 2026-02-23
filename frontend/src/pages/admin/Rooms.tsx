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

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    let filtered = rooms;
    
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
    
    setFilteredRooms(filtered);
  }, [searchQuery, statusFilter, rooms]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hostel Rooms</h1>
          <p className="text-slate-600">Manage hostel rooms and their availability</p>
        </div>
        <Link to="/rooms/add">
          <Button>+ Add Room</Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Input
                type="text"
                placeholder="Search by Room Number, Block, Type, or Amenities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
              {(searchQuery || statusFilter !== 'ALL') && (
                <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}>
                  Clear
                </Button>
              )}
            </div>
          </div>
          {(searchQuery || statusFilter !== 'ALL') && (
            <p className="text-sm text-slate-500 mt-2">
              Showing {filteredRooms.length} of {rooms.length} rooms
            </p>
          )}
        </CardContent>
      </Card>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No rooms found. Add your first room to get started.</p>
          </CardContent>
        </Card>
      ) : filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No rooms match your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card key={room.id}>
              <CardContent>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Room {room.roomNumber}</h3>
                    <p className="text-sm text-slate-600">{room.blockName} - Floor {room.floorNumber}</p>
                  </div>
                  <Badge variant={statusBadgeVariant(room.status)}>{room.status}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">{room.description || 'No description'}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-medium text-slate-800">{room.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fee/Semester:</span>
                    <span className="font-medium text-slate-800">₹{room.pricePerNight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capacity:</span>
                    <span className="font-medium text-slate-800">{room.capacity} students</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amenities:</span>
                    <span className="font-medium text-slate-800 text-right">{room.amenities || 'N/A'}</span>
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
