import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  type DefaultRoomMix,
  defaultCapacityLabel,
  defaultRoomTypeLabel,
  getBlocksByGender,
  getTotalRoomsInBlock
} from '@/data/defaultHostelDetails';

interface HostelForm {
  name: string;
  gender: 'MALE' | 'FEMALE';
  totalRooms: number;
}

interface HostelItem {
  id: number;
  name: string;
  gender: 'MALE' | 'FEMALE';
  totalRooms: number;
  actualRoomCount?: number;
  blockCode?: string;
  blockName?: string;
  code?: string;
  warden?: { fullName?: string } | null;
}

export default function AdminHostels() {
  const [hostels, setHostels] = useState<HostelItem[]>([]);
  const [form, setForm] = useState<HostelForm>({ name: '', gender: 'MALE', totalRooms: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHostel, setEditingHostel] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const maleDefaultBlocks = getBlocksByGender('MALE');
  const femaleDefaultBlocks = getBlocksByGender('FEMALE');

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

  const formatRoomMix = (roomMix: DefaultRoomMix[]) =>
    roomMix
      .map((mix) => `${mix.count} ${defaultRoomTypeLabel[mix.roomType]}`)
      .join(', ');

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
          <CardContent className="py-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Hostels</p>
            <p className="text-3xl font-bold text-gray-900">{hostels.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Boys Hostels</p>
            <p className="text-3xl font-bold text-blue-600">{maleHostels.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Girls Hostels</p>
            <p className="text-3xl font-bold text-pink-600">{femaleHostels.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
            <p className="text-3xl font-bold text-green-600">
              {hostels.reduce((sum, h) => sum + (h.actualRoomCount || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Default Hostel Details (Admin Reference)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Block-wise structure from the provided hostel details.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-base font-semibold text-blue-900">Men&apos;s Hostel Blocks</h3>
                <p className="text-xs text-blue-800 text-right">
                  {defaultCapacityLabel.MALE.blocks} blocks
                  <br />
                  {defaultCapacityLabel.MALE.rooms} rooms | {defaultCapacityLabel.MALE.members} members
                </p>
              </div>
              <div className="space-y-3">
                {maleDefaultBlocks.map((block) => (
                  <div key={`male-default-${block.name}`} className="rounded border border-blue-100 bg-white/80 p-3">
                    <p className="font-semibold text-gray-900">{block.name}</p>
                    <p className="text-sm text-gray-700 mt-1">{formatRoomMix(block.roomMix)}</p>
                    <p className="text-xs text-blue-700 mt-1">Total Rooms: {getTotalRoomsInBlock(block)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-pink-200 bg-pink-50/30 p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-base font-semibold text-pink-900">Women&apos;s Hostel Blocks</h3>
                <p className="text-xs text-pink-800 text-right">
                  {defaultCapacityLabel.FEMALE.blocks} blocks
                  <br />
                  {defaultCapacityLabel.FEMALE.rooms} rooms | {defaultCapacityLabel.FEMALE.members} members
                </p>
              </div>
              <div className="space-y-3">
                {femaleDefaultBlocks.map((block) => (
                  <div key={`female-default-${block.name}`} className="rounded border border-pink-100 bg-white/80 p-3">
                    <p className="font-semibold text-gray-900">{block.name}</p>
                    <p className="text-sm text-gray-700 mt-1">{formatRoomMix(block.roomMix)}</p>
                    <p className="text-xs text-pink-700 mt-1">Total Rooms: {getTotalRoomsInBlock(block)}</p>
                    {block.note && <p className="text-xs text-pink-800 mt-1">{block.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <HostelGridSection
          title="Boys Hostels"
          count={maleHostels.length}
          accentClass="bg-blue-500"
          hostels={maleHostels}
          emptyText="No boys hostels found. Add one to get started."
          loading={loading}
          onEdit={handleEditHostel}
          onDelete={(id) => setDeleteConfirm(id)}
          getGenderDisplay={getGenderDisplay}
        />

        <HostelGridSection
          title="Girls Hostels"
          count={femaleHostels.length}
          accentClass="bg-pink-500"
          hostels={femaleHostels}
          emptyText="No girls hostels found. Add one to get started."
          loading={loading}
          onEdit={handleEditHostel}
          onDelete={(id) => setDeleteConfirm(id)}
          getGenderDisplay={getGenderDisplay}
        />
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

function getHostelBlockLabel(hostel: HostelItem) {
  return hostel.blockCode || hostel.blockName || hostel.code || 'Main Block';
}

interface HostelGridSectionProps {
  title: string;
  count: number;
  accentClass: string;
  hostels: HostelItem[];
  emptyText: string;
  loading: boolean;
  onEdit: (hostel: HostelItem) => void;
  onDelete: (id: number) => void;
  getGenderDisplay: (gender: string) => string;
}

function HostelGridSection({
  title,
  count,
  accentClass,
  hostels,
  emptyText,
  loading,
  onEdit,
  onDelete,
  getGenderDisplay,
}: HostelGridSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
        <span className={`h-3 w-3 rounded-full ${accentClass}`} />
        <span>{title} ({count})</span>
      </h2>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
        {hostels.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
            {emptyText}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,240px))] justify-start gap-4">
            {hostels.map((hostel) => {
              const actualRooms = hostel.actualRoomCount || 0;
              const roomDelta = hostel.totalRooms - actualRooms;

              return (
                <article
                  key={hostel.id}
                  className="flex h-[272px] w-[240px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex min-h-0 flex-1 flex-col gap-2">
                    <div className="space-y-1">
                      <p className="truncate text-[15px] font-bold leading-5 text-[var(--foreground)]" title={hostel.name}>
                        {hostel.name}
                      </p>
                      <p className="truncate text-xs font-semibold text-[var(--foreground-muted)]">
                        {getHostelBlockLabel(hostel)}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">{getGenderDisplay(hostel.gender)}</p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-xs">
                      <p className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--foreground-muted)]">Target</span>
                        <span className="font-semibold text-[var(--foreground)]">{hostel.totalRooms}</span>
                      </p>
                      <p className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--foreground-muted)]">Actual</span>
                        <span className="font-semibold text-[var(--foreground)]">{actualRooms}</span>
                      </p>
                      <p className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--foreground-muted)]">Status</span>
                        <span className={roomDelta > 0 ? 'text-orange-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                          {roomDelta > 0 ? `${roomDelta} short` : 'On target'}
                        </span>
                      </p>
                      <p className="truncate">
                        <span className="font-semibold text-[var(--foreground-muted)]">Warden:</span>{' '}
                        <span className={hostel.warden?.fullName ? 'text-emerald-600 font-semibold' : 'text-orange-600 font-semibold'}>
                          {hostel.warden?.fullName || 'Not assigned'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                    <Button
                      onClick={() => onEdit(hostel)}
                      disabled={loading}
                      className="h-9 rounded-xl bg-blue-600 px-2 text-xs font-semibold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)] hover:bg-blue-700"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => onDelete(hostel.id)}
                      disabled={loading}
                      className="h-9 rounded-xl bg-rose-600 px-2 text-xs font-semibold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)] hover:bg-rose-700"
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
