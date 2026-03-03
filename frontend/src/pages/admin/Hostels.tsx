import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface HostelForm {
  name: string;
  gender: 'MALE' | 'FEMALE';
  totalRooms: number;
}

export default function AdminHostels() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [form, setForm] = useState<HostelForm>({ name: '', gender: 'MALE', totalRooms: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHostel, setEditingHostel] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Separate hostels by gender
  const maleHostels = hostels.filter(h => h.gender === 'MALE');
  const femaleHostels = hostels.filter(h => h.gender === 'FEMALE');

  // Load hostels
  const loadHostels = async () => {
    try {
      const res = await adminApi.getHostels();
      setHostels(res.hostels || []);
    } catch (error) {
      showMessage('error', 'Failed to load hostels');
    }
  };

  useEffect(() => {
    loadHostels();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const validateForm = (data: HostelForm): boolean => {
    const newErrors: Record<string, string> = {};
    if (!data.name.trim()) newErrors.name = 'Hostel name is required';
    if (!data.gender) newErrors.gender = 'Hostel type is required';
    if (data.totalRooms <= 0) newErrors.totalRooms = 'Total rooms must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddHostel = async () => {
    if (!validateForm(form)) return;
    
    setLoading(true);
    try {
      await adminApi.addHostel(form);
      showMessage('success', 'Hostel added successfully');
      setForm({ name: '', gender: 'MALE', totalRooms: 0 });
      setErrors({});
      await loadHostels();
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to add hostel');
    } finally {
      setLoading(false);
    }
  };

  const handleEditHostel = (hostel: any) => {
    setEditingHostel({
      id: hostel.id,
      name: hostel.name,
      gender: hostel.gender,
      totalRooms: hostel.totalRooms
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!validateForm(editingHostel)) return;
    
    setLoading(true);
    try {
      await adminApi.updateHostel(editingHostel.id, {
        name: editingHostel.name,
        gender: editingHostel.gender,
        totalRooms: editingHostel.totalRooms
      });
      showMessage('success', 'Hostel updated successfully');
      setShowEditModal(false);
      setEditingHostel(null);
      await loadHostels();
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update hostel');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHostel = async (id: number) => {
    setLoading(true);
    try {
      await adminApi.deleteHostel(id);
      showMessage('success', 'Hostel deleted successfully');
      setDeleteConfirm(null);
      await loadHostels();
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to delete hostel');
    } finally {
      setLoading(false);
    }
  };

  const getGenderDisplay = (gender: string) => {
    return gender === 'MALE' ? 'Boys Hostel' : 'Girls Hostel';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hostels Management</h1>

      {message.text && (
        <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 mb-1">Total Hostels</p>
            <p className="text-3xl font-bold text-gray-900">{hostels.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 mb-1">Boys Hostels</p>
            <p className="text-3xl font-bold text-blue-600">{maleHostels.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 mb-1">Girls Hostels</p>
            <p className="text-3xl font-bold text-pink-600">{femaleHostels.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
            <p className="text-3xl font-bold text-green-600">
              {hostels.reduce((sum, h) => sum + (h.actualRoomCount || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Hostel Form */}
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-bold">Add New Hostel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hostel Name *</label>
              <input
                type="text"
                placeholder="Enter hostel name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full border rounded px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hostel Type *</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'MALE' | 'FEMALE' })}
                className={`w-full border rounded px-3 py-2 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="MALE">Boys Hostel</option>
                <option value="FEMALE">Girls Hostel</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Total Number of Rooms *</label>
              <input
                type="number"
                placeholder="Enter total rooms"
                value={form.totalRooms}
                onChange={(e) => setForm({ ...form, totalRooms: Math.max(0, parseInt(e.target.value) || 0) })}
                className={`w-full border rounded px-3 py-2 ${errors.totalRooms ? 'border-red-500' : 'border-gray-300'}`}
                min="1"
              />
              {errors.totalRooms && <p className="text-red-500 text-sm mt-1">{errors.totalRooms}</p>}
            </div>
          </div>

          <Button onClick={handleAddHostel} disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? 'Adding...' : '➕ Add Hostel'}
          </Button>
        </CardContent>
      </Card>

      {/* Hostels List */}
      <div className="space-y-8">
        {/* Male Hostels */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2">
            <span>🏢</span> Boys Hostels ({maleHostels.length})
          </h2>
          {maleHostels.length === 0 ? (
            <Card>
              <CardContent className="text-center text-gray-500 py-8">
                No boys hostels found. Add one to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {maleHostels.map((hostel) => (
                <Card key={hostel.id} className="hover:shadow-lg transition border-l-4 border-l-blue-500">
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-blue-600">{hostel.name}</h3>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Type:</span> {getGenderDisplay(hostel.gender)}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Target Capacity:</span> {hostel.totalRooms} rooms
                        </p>
                        <p className="text-sm text-gray-700 font-semibold">
                          <span className="font-medium">Actual Rooms:</span> {hostel.actualRoomCount || 0} rooms
                        </p>
                        {hostel.actualRoomCount < hostel.totalRooms && (
                          <p className="text-xs text-orange-600">
                            ⚠️ {hostel.totalRooms - (hostel.actualRoomCount || 0)} rooms short of target
                          </p>
                        )}
                      </div>
                      {hostel.warden ? (
                        <p className="text-sm text-green-600 mt-2">
                          ✅ Warden: {hostel.warden.fullName}
                        </p>
                      ) : (
                        <p className="text-sm text-orange-600 mt-2">
                          ⚠️ No Warden Assigned
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        onClick={() => handleEditHostel(hostel)}
                        disabled={loading}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirm(hostel.id)}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Female Hostels */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-pink-700 flex items-center gap-2">
            <span>🏢</span> Girls Hostels ({femaleHostels.length})
          </h2>
          {femaleHostels.length === 0 ? (
            <Card>
              <CardContent className="text-center text-gray-500 py-8">
                No girls hostels found. Add one to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {femaleHostels.map((hostel) => (
                <Card key={hostel.id} className="hover:shadow-lg transition border-l-4 border-l-pink-500">
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-pink-600">{hostel.name}</h3>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Type:</span> {getGenderDisplay(hostel.gender)}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Target Capacity:</span> {hostel.totalRooms} rooms
                        </p>
                        <p className="text-sm text-gray-700 font-semibold">
                          <span className="font-medium">Actual Rooms:</span> {hostel.actualRoomCount || 0} rooms
                        </p>
                        {hostel.actualRoomCount < hostel.totalRooms && (
                          <p className="text-xs text-orange-600">
                            ⚠️ {hostel.totalRooms - (hostel.actualRoomCount || 0)} rooms short of target
                          </p>
                        )}
                      </div>
                      {hostel.warden ? (
                        <p className="text-sm text-green-600 mt-2">
                          ✅ Warden: {hostel.warden.fullName}
                        </p>
                      ) : (
                        <p className="text-sm text-orange-600 mt-2">
                          ⚠️ No Warden Assigned
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        onClick={() => handleEditHostel(hostel)}
                        disabled={loading}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirm(hostel.id)}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingHostel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4">
              <h2 className="text-xl font-bold">Edit Hostel</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Hostel Name *</label>
                <input
                  type="text"
                  value={editingHostel.name}
                  onChange={(e) => setEditingHostel({ ...editingHostel, name: e.target.value })}
                  className={`w-full border rounded px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hostel Type *</label>
                <select
                  value={editingHostel.gender}
                  onChange={(e) => setEditingHostel({ ...editingHostel, gender: e.target.value })}
                  className={`w-full border rounded px-3 py-2 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="MALE">Boys Hostel</option>
                  <option value="FEMALE">Girls Hostel</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Number of Rooms *</label>
                <input
                  type="number"
                  value={editingHostel.totalRooms}
                  onChange={(e) => setEditingHostel({ ...editingHostel, totalRooms: Math.max(0, parseInt(e.target.value) || 0) })}
                  className={`w-full border rounded px-3 py-2 ${errors.totalRooms ? 'border-red-500' : 'border-gray-300'}`}
                  min="1"
                />
                {errors.totalRooms && <p className="text-red-500 text-sm mt-1">{errors.totalRooms}</p>}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? 'Saving...' : '💾 Save'}
                </Button>
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingHostel(null);
                    setErrors({});
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                >
                  ❌ Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm">
            <CardContent className="space-y-4">
              <h2 className="text-xl font-bold text-red-600">Delete Hostel</h2>
              <p className="text-gray-700">
                Are you sure you want to delete this hostel? This action cannot be undone.
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDeleteHostel(deleteConfirm)}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Deleting...' : '🗑️ Delete'}
                </Button>
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={loading}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                >
                  ❌ Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
