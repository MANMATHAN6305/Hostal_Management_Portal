import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roomsApi } from '@/lib/api';

// Gender-based hostel names
const maleHostels = [
  { value: 'Emerald', label: 'Emerald' },
  { value: 'Pearl', label: 'Pearl' },
  { value: 'Ruby', label: 'Ruby' },
  { value: 'Diamond', label: 'Diamond' },
  { value: 'Sapphire', label: 'Sapphire' },
  { value: 'Coral (AC)', label: 'Coral (AC Type)' },
];

const femaleHostels = [
  { value: 'Gangai', label: 'Gangai' },
  { value: 'Yamunai', label: 'Yamunai' },
  { value: 'Sindhu', label: 'Sindhu' },
];

export default function AddRoom() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      case 'DORMITORY': return 4;
      default: return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await roomsApi.create({
        ...formData,
        pricePerNight: parseFloat(formData.pricePerNight),
        capacity: getCapacityFromRoomType(formData.roomType),
        floorNumber: parseInt(formData.floorNumber),
      });
      alert('Room added successfully!');
      navigate('/rooms');
    } catch (error: any) {
      alert(error.message || 'Failed to add room. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/rooms" className="text-gray-700 hover:text-gray-900 flex items-center gap-2">
          ← Back to Rooms
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Hostel Room</CardTitle>
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
                  placeholder="e.g., 101"
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
                <Input
                  type="number"
                  name="floorNumber"
                  value={formData.floorNumber}
                  onChange={handleChange}
                  placeholder="1"
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
                  <option value="DORMITORY">Dormitory (4+ beds)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fee per Semester (₹) *</label>
                <Input
                  type="number"
                  name="pricePerNight"
                  value={formData.pricePerNight}
                  onChange={handleChange}
                  placeholder="15000"
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
                  placeholder="WiFi, AC, Attached Bathroom"
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
                placeholder="Room description..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Room'}
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
