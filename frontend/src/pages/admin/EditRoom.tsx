import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roomsApi } from '@/lib/api';

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
    capacity: '',
    floorNumber: '',
    blockName: '',
    amenities: '',
  });

  useEffect(() => {
    if (id) {
      fetchRoom();
    }
  }, [id]);

  const fetchRoom = async () => {
    try {
      const room = await roomsApi.getById(Number(id));
      setFormData({
        roomNumber: room.roomNumber || '',
        roomType: room.roomType || 'SINGLE',
        pricePerNight: room.pricePerNight?.toString() || '',
        status: room.status || 'AVAILABLE',
        description: room.description || '',
        capacity: room.capacity?.toString() || '',
        floorNumber: room.floorNumber?.toString() || '',
        blockName: room.blockName || '',
        amenities: room.amenities || '',
      });
    } catch (error) {
      console.error('Failed to fetch room:', error);
      alert('Failed to load room data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await roomsApi.update(Number(id), {
        ...formData,
        pricePerNight: parseFloat(formData.pricePerNight),
        capacity: parseInt(formData.capacity),
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/rooms" className="text-emerald-600 hover:text-emerald-500 flex items-center gap-2">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Room Number *</label>
                <Input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
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
                <Input type="number" name="floorNumber" value={formData.floorNumber} onChange={handleChange} min="0" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Room Type *</label>
                <select name="roomType" value={formData.roomType} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required>
                  <option value="SINGLE">Single</option>
                  <option value="DOUBLE">Double</option>
                  <option value="TRIPLE">Triple</option>
                  <option value="DORMITORY">Dormitory</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fee per Semester (₹) *</label>
                <Input type="number" name="pricePerNight" value={formData.pricePerNight} onChange={handleChange} step="0.01" min="0" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Capacity *</label>
                <Input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required>
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amenities</label>
                <Input type="text" name="amenities" value={formData.amenities} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
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
