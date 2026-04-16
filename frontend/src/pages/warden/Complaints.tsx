import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getBackendAssetUrl } from '@/lib/api';

const statusColors: Record<string, string> = {
  'PENDING': 'bg-yellow-100 text-yellow-800',
  'IN_PROGRESS': 'bg-blue-100 text-blue-800',
  'RESOLVED': 'bg-green-100 text-green-800'
};

const categoryIcons: Record<string, string> = {
  'ELECTRICAL': '⚡',
  'CLEANING': '🧹',
  'MAINTENANCE': '🔧',
  'PLUMBING': '💧',
  'FOOD': '🍽️',
  'OTHER': '📞'
};

export default function WardenComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [statusById, setStatusById] = useState<Record<number, string>>({});
  const [replyById, setReplyById] = useState<Record<number, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');

  const load = async () => {
    try {
      setLoading(true);
      const res = await wardenApi.getComplaints();
      const list = res.complaints || [];
      setComplaints(list);
      setStatusById(
        list.reduce((acc: Record<number, string>, complaint: any) => {
          acc[complaint.id] = complaint.status;
          return acc;
        }, {})
      );
      setReplyById(
        list.reduce((acc: Record<number, string>, complaint: any) => {
          acc[complaint.id] = complaint.adminReply || '';
          return acc;
        }, {})
      );
      setError('');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const autoAssign = async (id: number, category: string) => {
    const map: Record<string, string> = {
      ELECTRICAL: 'ELECTRICIAN',
      CLEANING: 'CLEANER',
      MAINTENANCE: 'CARETAKER',
      PLUMBING: 'PLUMBER',
      FOOD: 'CHEF'
    };
    try {
      await wardenApi.assignComplaint(id, map[category] || 'CARETAKER');
      setSuccess('Complaint assigned successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to assign complaint.');
    }
  };

  const saveComplaintUpdate = async (id: number) => {
    setSavingId(id);
    setError('');
    try {
      const status = (statusById[id] || 'PENDING') as 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
      await wardenApi.updateComplaint(id, {
        status,
        adminReply: replyById[id] || ''
      });
      setSuccess('Complaint updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update complaint.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const filteredComplaints = filter
    ? complaints.filter(c => c.status === filter)
    : complaints;

  const pendingCount = complaints.filter(c => c.status === 'PENDING').length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;

  // Get category breakdown
  const categoryBreakdown = complaints.reduce((acc: Record<string, number>, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Complaint Management</h1>
        <p className="text-orange-100 text-lg">Review, assign, and respond to student maintenance complaints</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-6 py-4 shadow-sm flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-xl px-6 py-4 shadow-sm flex items-start gap-3">
          <span className="text-xl">✓</span>
          <div>{success}</div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Complaints</p>
                <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
              </div>
              <span className="text-3xl">📋</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
              <span className="text-3xl">🔄</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
              </div>
              <span className="text-3xl">✓</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Complaints by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(categoryBreakdown).map(([category, count]) => (
            <Card key={category}>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl mb-2">{categoryIcons[category] || '📞'}</p>
                  <p className="text-sm font-medium text-gray-600">{category}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Filter by Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All Complaints ({filteredComplaints.length})</option>
                <option value="PENDING">Pending ({pendingCount})</option>
                <option value="IN_PROGRESS">In Progress ({inProgressCount})</option>
                <option value="RESOLVED">Resolved ({resolvedCount})</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">View Mode</label>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'detailed'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setViewMode('detailed')}
                >
                  📋 Detailed
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'compact'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setViewMode('compact')}
                >
                  📝 Compact
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">� Maintenance Complaints</h2>
        {filteredComplaints.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No complaints found</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'detailed' ? (
          <div className="space-y-4">
            {filteredComplaints.map((c) => (
              <Card key={c.id} className="border-l-4 border-l-orange-500">
                <CardContent>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{categoryIcons[c.category] || '📞'}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{c.category}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          From: <span className="font-semibold text-gray-900">{c.Student?.firstName} {c.Student?.lastName}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[c.status] || 'bg-gray-100 text-gray-800'}`}>
                          {c.status}
                        </span>
                      </div>
                    </div>

                    {/* Complaint Message */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-900 mb-2"><span className="font-semibold">Issue:</span></p>
                      <p className="text-gray-700">{c.message}</p>
                      {c.imageUrl && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Image Evidence</p>
                          <img
                            src={getBackendAssetUrl(c.imageUrl)}
                            alt="Complaint evidence"
                            className="w-full max-w-sm h-44 object-cover rounded-md border border-gray-300"
                          />
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-purple-700 font-semibold mb-1">📞 Student Contact</p>
                        <p className="text-purple-900">{c.Student?.phone || 'N/A'}</p>
                        <p className="text-purple-900 text-xs">{c.Student?.email || 'N/A'}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-blue-700 font-semibold mb-1">📍 Location</p>
                        <p className="text-blue-900">Room {c.Student?.Rooms?.[0]?.roomNumber || 'N/A'}</p>
                        <p className="text-blue-900 text-xs">{c.Student?.Allocations?.[0]?.Hostel?.name || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Assignment Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-green-700 font-semibold mb-1">👤 Assigned To</p>
                        <p className="text-green-900">{c.assignedStaffRole || 'Not assigned'}</p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                        <p className="text-indigo-700 font-semibold mb-1">✍️ Processed By</p>
                        <p className="text-indigo-900">{c.AssignedBy?.fullName || 'Warden'}</p>
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="border-t border-gray-200 pt-4 space-y-4">
                      {/* Status Update */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <label className="text-sm font-semibold text-gray-700 mb-2">Update Status</label>
                          <select
                            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            value={statusById[c.id] || c.status}
                            onChange={(e) => setStatusById((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          >
                            <option value="PENDING">⏳ Pending</option>
                            <option value="IN_PROGRESS">🔄 In Progress</option>
                            <option value="RESOLVED">✓ Resolved</option>
                          </select>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-sm font-semibold text-gray-700 mb-2">Assign Staff</label>
                          <Button
                            size="md"
                            variant="outline"
                            onClick={() => autoAssign(c.id, c.category)}
                            className="hover:bg-orange-50"
                          >
                            🤖 Auto-assign
                          </Button>
                        </div>
                      </div>

                      {/* Response Textarea */}
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-2">Response to Student</label>
                        <textarea
                          className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
                          rows={3}
                          placeholder="Enter your response and resolution status..."
                          value={replyById[c.id] || ''}
                          onChange={(e) => setReplyById((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        />
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end">
                        <Button
                          disabled={savingId === c.id}
                          onClick={() => saveComplaintUpdate(c.id)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {savingId === c.id ? '💾 Saving...' : '💾 Save Update'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Compact View */
          <div className="space-y-3">
            {filteredComplaints.map((c) => (
              <Card key={c.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{categoryIcons[c.category] || '📞'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{c.category}</p>
                      <p className="text-sm text-gray-600 truncate">{c.Student?.firstName} {c.Student?.lastName}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{c.message}</p>
                      {c.imageUrl && (
                        <p className="text-xs text-indigo-600 mt-0.5">📷 Image attached</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[c.status] || 'bg-gray-100 text-gray-800'}`}>
                        {c.status}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => autoAssign(c.id, c.category)}>
                        🤖
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
