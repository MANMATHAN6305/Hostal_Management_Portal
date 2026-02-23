import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';

interface Complaint {
  id: number;
  message: string;
  category: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: number;
    studentId: string;
    name: string;
    email: string;
    department: string;
  } | null;
}

const categories = [
  { value: 'MAINTENANCE', label: 'Maintenance', icon: '🔧' },
  { value: 'CLEANLINESS', label: 'Cleanliness', icon: '🧹' },
  { value: 'FOOD', label: 'Food', icon: '🍽️' },
  { value: 'SECURITY', label: 'Security', icon: '🔒' },
  { value: 'OTHER', label: 'Other', icon: '📝' },
];

const statusOptions = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-700' },
];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await adminApi.getComplaints();
      if (response.success) {
        setComplaints(response.complaints);
      } else {
        setError(response.message || 'Failed to load complaints');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedComplaint) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const updateData: { status?: string; adminReply?: string } = {};
      if (newStatus) updateData.status = newStatus;
      if (replyText.trim()) updateData.adminReply = replyText.trim();

      const response = await adminApi.updateComplaint(selectedComplaint.id, updateData);
      if (response.success) {
        setSuccess('Complaint updated successfully!');
        setSelectedComplaint(null);
        setReplyText('');
        setNewStatus('');
        fetchComplaints();
      } else {
        setError(response.message || 'Failed to update complaint');
      }
    } catch (err) {
      setError('Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📝';
  };

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find(s => s.value === status);
    return opt?.color || 'bg-gray-100 text-gray-700';
  };

  const filteredComplaints = filter === 'ALL' 
    ? complaints 
    : complaints.filter(c => c.status === filter);

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'PENDING').length,
    inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    completed: complaints.filter(c => c.status === 'COMPLETED').length,
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Complaint Management</h1>
        <p className="text-slate-600">View and respond to student complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer" onClick={() => setFilter('ALL')}>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
            <p className="text-sm text-slate-500">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('PENDING')}>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-slate-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('IN_PROGRESS')}>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-sm text-slate-500">In Progress</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('COMPLETED')}>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-slate-500">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Reply Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardContent>
              <h3 className="text-lg font-semibold mb-4">Respond to Complaint</h3>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">
                    From: {selectedComplaint.student?.name} ({selectedComplaint.student?.studentId})
                  </p>
                  <p className="text-slate-700">{selectedComplaint.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Update Status</label>
                  <select
                    value={newStatus || selectedComplaint.status}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Admin Reply</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your response to the student..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedComplaint(null);
                      setReplyText('');
                      setNewStatus('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    {updating ? 'Updating...' : 'Update Complaint'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'ALL' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-xl font-semibold text-slate-700">No Complaints</h2>
                <p className="text-slate-500 mt-2">
                  {filter === 'ALL' ? 'No complaints have been submitted yet.' : `No ${filter.toLowerCase().replace('_', ' ')} complaints.`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredComplaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-3xl">{getCategoryIcon(complaint.category)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {complaint.category}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm text-slate-500">
                          <strong>{complaint.student?.name}</strong> ({complaint.student?.studentId}) - {complaint.student?.department}
                        </p>
                      </div>
                      
                      <p className="text-slate-700">{complaint.message}</p>
                      
                      {complaint.adminReply && (
                        <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                          <p className="text-sm font-medium text-blue-700 mb-1">Your Reply:</p>
                          <p className="text-blue-800 text-sm">{complaint.adminReply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedComplaint(complaint);
                      setReplyText(complaint.adminReply || '');
                      setNewStatus(complaint.status);
                    }}
                  >
                    Respond
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
