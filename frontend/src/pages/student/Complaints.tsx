import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studentApi } from '@/lib/api';

interface Complaint {
  id: number;
  message: string;
  category: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: 'MAINTENANCE', label: 'Maintenance', icon: '🔧' },
  { value: 'CLEANLINESS', label: 'Cleanliness', icon: '🧹' },
  { value: 'FOOD', label: 'Food', icon: '🍽️' },
  { value: 'SECURITY', label: 'Security', icon: '🔒' },
  { value: 'OTHER', label: 'Other', icon: '📝' },
];

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    message: '',
    category: 'OTHER'
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await studentApi.getComplaints();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.message.trim()) {
      setError('Please enter a complaint message');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await studentApi.submitComplaint(newComplaint);
      if (response.success) {
        setSuccess('Complaint submitted successfully!');
        setNewComplaint({ message: '', category: 'OTHER' });
        setShowForm(false);
        fetchComplaints();
      } else {
        setError(response.message || 'Failed to submit complaint');
      }
    } catch (err) {
      setError('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📝';
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
          <h1 className="text-2xl font-bold text-slate-800">Complaints</h1>
          <p className="text-slate-600">Raise and track your hostel complaints</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          {showForm ? '✕ Cancel' : '+ New Complaint'}
        </Button>
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

      {/* New Complaint Form */}
      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Submit New Complaint</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNewComplaint({ ...newComplaint, category: cat.value })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        newComplaint.category === cat.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="text-2xl">{cat.icon}</div>
                      <div className="text-xs mt-1">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Describe your complaint
                </label>
                <textarea
                  value={newComplaint.message}
                  onChange={(e) => setNewComplaint({ ...newComplaint, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Please describe your issue in detail..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-xl font-semibold text-slate-700">No Complaints Yet</h2>
                <p className="text-slate-500 mt-2">You haven't raised any complaints.</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600"
                >
                  Raise Your First Complaint
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          complaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getCategoryIcon(complaint.category)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700">{complaint.message}</p>
                      
                      {/* Admin Reply */}
                      {complaint.adminReply && (
                        <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <p className="text-sm font-medium text-blue-700 mb-1">Admin Reply:</p>
                          <p className="text-blue-800">{complaint.adminReply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
