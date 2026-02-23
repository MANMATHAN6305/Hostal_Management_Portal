import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roomsApi } from '@/lib/api';

export default function AddRoom() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: 'SINGLE',
    pricePerNight: '',
    status: 'AVAILABLE',
    description: '',
    capacity: '',
    floorNumber: '',
    blockName: '',
    amenities: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await roomsApi.create({
        ...formData,
        pricePerNight: parseFloat(formData.pricePerNight),
        capacity: parseInt(formData.capacity),
        floorNumber: parseInt(formData.floorNumber),
      });
      alert('Room added successfully!');
      navigate('/rooms');
    } catch (error) {
      alert('Failed to add room. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/rooms" className="text-emerald-600 hover:text-emerald-500 flex items-center gap-2">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Room Number *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Block Name *</label>
                <select
                  name="blockName"
                  value={formData.blockName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Select Block</option>
                  <option value="Boys Hostel A">Boys Hostel A</option>
                  <option value="Boys Hostel B">Boys Hostel B</option>
                  <option value="Girls Hostel A">Girls Hostel A</option>
                  <option value="Girls Hostel B">Girls Hostel B</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Floor Number *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Room Type *</label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="SINGLE">Single (1 bed)</option>
                  <option value="DOUBLE">Double (2 beds)</option>
                  <option value="TRIPLE">Triple (3 beds)</option>
                  <option value="DORMITORY">Dormitory (4+ beds)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fee per Semester (₹) *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Capacity *</label>
                <Input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="2"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amenities</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
