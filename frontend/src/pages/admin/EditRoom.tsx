import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roomsApi, adminApi } from '@/lib/api';

interface Hostel {
  id: number;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'COED';
  totalRooms: number;
  warden?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
}

export default function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: 'SINGLE',
    pricePerNight: '',
    status: 'AVAILABLE',
    description: '',
    floorNumber: '',
    blockName: '',
    amenities: '',
    gender: 'MALE',
    hostelId: '',
  });

  useEffect(() => {
    const initializeData = async () => {
      await fetchHostels();
      if (id) {
        await fetchRoom();
      }
    };
    initializeData();
  }, [id]);

  const fetchHostels = async () => {
    try {
      const data = await adminApi.getHostels();
      const hostelsWithData = (data.hostels || []).map((hostel: any) => ({
        ...hostel,
        warden: hostel.warden || null
      }));
      setHostels(hostelsWithData);
    } catch (error) {
      console.error('Failed to fetch hostels:', error);
    }
  };

  const fetchRoom = async () => {
    try {
      const room = await roomsApi.getById(Number(id));
      const hostel = (room as any).hostel;
      
      setFormData({
        roomNumber: room.roomNumber || '',
        roomType: room.roomType || 'SINGLE',
        pricePerNight: room.pricePerNight?.toString() || '',
        status: room.status || 'AVAILABLE',
        description: room.description || '',
        floorNumber: room.floorNumber?.toString() || '',
        blockName: room.blockName || '',
        amenities: room.amenities || '',
        gender: room.gender || 'MALE',
        hostelId: room.hostelId?.toString() || '',
      });

      if (hostel) {
        const selected = hostels.find(h => h.id === hostel.id);
        setSelectedHostel(selected || hostel);
      }
    } catch (error) {
      console.error('Failed to fetch room:', error);
      alert('Failed to load room data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Reset hostel name when gender changes
      if (name === 'gender') {
        return { ...prev, [name]: value, blockName: '', hostelId: '' };
      }
      return { ...prev, [name]: value };
    });

    // Update selected hostel when hostel is selected
    if (name === 'hostelId') {
      const selected = hostels.find(h => String(h.id) === value);
      setSelectedHostel(selected || null);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          blockName: selected.name,
          hostelId: String(selected.id),
          gender: selected.gender === 'COED' ? prev.gender : selected.gender
        }));
      }
    }
  };

  // Get hostel options based on selected gender
  const getHostelOptions = () => {
    return hostels.filter(h => h.gender === formData.gender || h.gender === 'COED');
  };

  // Auto-calculate capacity based on room type
  const getCapacityFromRoomType = (roomType: string) => {
    switch (roomType) {
      case 'SINGLE': return 1;
      case 'DOUBLE': return 2;
      case 'TRIPLE': return 3;
      case 'FOUR_BED': return 4;
      case 'FIVE_BED': return 5;
      case 'EIGHT_BED': return 8;
      case 'DORMITORY': return 10;
      default: return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await roomsApi.update(Number(id), {
        ...formData,
        pricePerNight: parseFloat(formData.pricePerNight),
        capacity: getCapacityFromRoomType(formData.roomType),
        floorNumber: parseInt(formData.floorNumber),
        hostelId: formData.hostelId ? parseInt(formData.hostelId) : null,
      });
      alert('Room updated successfully!');
      navigate('/rooms');
    } catch (error) {
      alert('Failed to update room.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/rooms" className="text-gray-700 hover:text-gray-900 flex items-center gap-2">
          ← Back to Rooms
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Room</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Number *</label>
                <Input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hostel Name *</label>
                <select
                  name="hostelId"
                  value={formData.hostelId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="">Select Hostel Name</option>
                  {getHostelOptions().map(hostel => (
                    <option key={hostel.id} value={String(hostel.id)}>{hostel.name}</option>
                  ))}
                </select>
              </div>

              {/* Hostel Details Card */}
              {selectedHostel && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Hostel Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hostel Name:</span>
                      <span className="font-medium text-gray-900">{selectedHostel.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900">
                        {selectedHostel.gender === 'MALE' ? "Boys Hostel" : selectedHostel.gender === 'FEMALE' ? "Girls Hostel" : "Co-ed Hostel"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Capacity:</span>
                      <span className="font-medium text-gray-900">{selectedHostel.totalRooms} rooms</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      {selectedHostel.warden ? (
                        <>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">Assigned Warden:</span>
                            <span className="font-medium text-green-700">✅ {selectedHostel.warden.fullName}</span>
                          </div>
                          <p className="text-xs text-gray-500">{selectedHostel.warden.email}</p>
                        </>
                      ) : (
                        <p className="text-sm text-orange-600">⚠️ No Warden Assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Floor Number *</label>
                <Input 
                  type="number" 
                  name="floorNumber" 
                  value={formData.floorNumber} 
                  onChange={handleChange} 
                  min="0" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Type *</label>
                <select 
                  name="roomType" 
                  value={formData.roomType} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
                  required
                >
                  <option value="SINGLE">Single (1 bed)</option>
                  <option value="DOUBLE">Double (2 beds)</option>
                  <option value="TRIPLE">Triple (3 beds)</option>
                  <option value="FOUR_BED">Four Bedded (4 beds)</option>
                  <option value="FIVE_BED">Five Bedded (5 beds)</option>
                  <option value="EIGHT_BED">Eight Bedded (8 beds)</option>
                  <option value="DORMITORY">Dormitory (10+ beds)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fee per Semester (₹) *</label>
                <Input 
                  type="number" 
                  name="pricePerNight" 
                  value={formData.pricePerNight} 
                  onChange={handleChange} 
                  step="0.01" 
                  min="0" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
                  required
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <Input 
                  type="text" 
                  name="amenities" 
                  value={formData.amenities} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows={3} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link to="/rooms">
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
