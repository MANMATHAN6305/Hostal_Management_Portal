import { useEffect, useState } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studentApi } from '@/lib/api';

const categories = [
  { label: '🔧 Room Maintenance Issue', value: 'MAINTENANCE' },
  { label: '⚡ Electrical Issue', value: 'ELECTRICAL' },
  { label: '💧 Plumbing Issue', value: 'PLUMBING' },
  { label: '🧹 Cleaning Issue', value: 'CLEANING' },
  { label: '📞 Other', value: 'OTHER' }
];

const statusColors: Record<string, string> = {
  'PENDING': 'bg-yellow-100 text-yellow-800',
  'ASSIGNED': 'bg-blue-100 text-blue-800',
  'IN_PROGRESS': 'bg-purple-100 text-purple-800',
  'RESOLVED': 'bg-green-100 text-green-800',
  'CLOSED': 'bg-gray-100 text-gray-800'
};

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('MAINTENANCE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const response = await studentApi.getComplaints();
      setComplaints(response.complaints || []);
      setError('');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load complaints.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!message.trim()) {
      setError('Please describe the issue');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await studentApi.submitComplaint({ message, category });
      setMessage('');
      setCategory('MAINTENANCE');
      setSuccess('Complaint submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Submit Complaint</h1>
        <p className="text-gray-600 mt-1">Report any issues with your room or hostel facilities</p>
      </div>

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

      {/* Complaint Form */}
      <Card>
        <CardTitle className="mb-4">📝 New Complaint</CardTitle>
        <CardContent className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Issue Category *</label>
            <select 
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white"
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={`${c.label}-${c.value}`} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Describe the Issue *</label>
            <textarea
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white resize-none"
              rows={4}
              placeholder="Please provide details about the issue you're experiencing..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
          </div>

          <Button 
            onClick={submit} 
            disabled={submitting || !message.trim()}
            className="w-full sm:w-auto"
          >
            {submitting ? '📤 Submitting...' : '📤 Submit Complaint'}
          </Button>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Your Complaints</h2>
        {complaints.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">No complaints submitted yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Card key={c.id}>
                <CardContent>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{c.category}</p>
                      <p className="text-sm text-gray-600 mt-1">{c.message}</p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                      statusColors[c.status] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Submitted: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</span>
                      <span>Assigned to: <span className="font-semibold text-gray-900">{c.AssignedBy?.fullName || 'Pending'}</span></span>
                    </div>
                    
                    {c.adminReply && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">Warden Response:</p>
                        <p className="text-sm text-green-900">{c.adminReply}</p>
                      </div>
                    )}
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
