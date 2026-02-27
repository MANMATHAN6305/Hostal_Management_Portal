import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roomsApi } from '@/lib/api';

// Gender-based hostel names
const maleHostels = [
  { value: 'Sapphire', label: 'Sapphire (282 four-bedded rooms)' },
  { value: 'Emerald', label: 'Emerald (284 four-bedded rooms)' },
  { value: 'Ruby', label: 'Ruby (237 rooms - mixed)' },
  { value: 'Diamond', label: 'Diamond (180 rooms - mixed)' },
  { value: 'Coral', label: 'Coral (52 rooms - AC)' },
  { value: 'Pearl', label: 'Pearl (138 four-bedded rooms)' },
];

const femaleHostels = [
  { value: 'Ganga', label: 'Ganga (132 rooms - mixed)' },
  { value: 'Yamuna', label: 'Yamuna (99 rooms - mixed)' },
  { value: 'Narmadha', label: 'Narmadha (128 rooms - mixed)' },
  { value: 'Cauvery', label: 'Cauvery (126 rooms - mixed)' },
  { value: 'North Bhavani', label: 'North Bhavani (72 rooms - mixed)' },
  { value: 'South Bhavani', label: 'South Bhavani (72 rooms - mixed)' },
  { value: 'Old Bhavani', label: 'Old Bhavani (9 rooms - special)' },
];

export default function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
  });

  useEffect(() => {
    if (id) {
      fetchRoom();
    }
  }, [id]);

  const fetchRoom = async () => {
    try {
      const room = await roomsApi.getById(Number(id));
      // Determine gender based on hostel name
      const isFemaleHostel = femaleHostels.some(h => h.value === room.blockName);
      setFormData({
        roomNumber: room.roomNumber || '',
        roomType: room.roomType || 'SINGLE',
        pricePerNight: room.pricePerNight?.toString() || '',
        status: room.status || 'AVAILABLE',
        description: room.description || '',
        floorNumber: room.floorNumber?.toString() || '',
        blockName: room.blockName || '',
        amenities: room.amenities || '',
        gender: isFemaleHostel ? 'FEMALE' : 'MALE',
      });
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
        return { ...prev, [name]: value, blockName: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  // Get hostel options based on selected gender
  const getHostelOptions = () => {
    return formData.gender === 'MALE' ? maleHostels : femaleHostels;
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
    <div className="max-w-2xl mx-auto">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hostel Name *</label>
                <select
                  name="blockName"
                  value={formData.blockName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="">Select Hostel Name</option>
                  {getHostelOptions().map(hostel => (
                    <option key={hostel.value} value={hostel.value}>{hostel.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Floor Number *</label>
                <Input type="number" name="floorNumber" value={formData.floorNumber} onChange={handleChange} min="0" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Type *</label>
                <select name="roomType" value={formData.roomType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500" required>
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
                <Input type="number" name="pricePerNight" value={formData.pricePerNight} onChange={handleChange} step="0.01" min="0" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500" required>
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <Input type="text" name="amenities" value={formData.amenities} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500" />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
              <Link to="/rooms"><Button type="button" variant="secondary">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
