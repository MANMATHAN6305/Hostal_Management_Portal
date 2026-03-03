import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const statusColors: Record<string, string> = {
  'PENDING': 'bg-yellow-100 text-yellow-800',
  'APPROVED': 'bg-green-100 text-green-800',
  'REJECTED': 'bg-red-100 text-red-800'
};

const typeIcons: Record<string, string> = {
  'LEAVE': '🏖️',
  'ROOM_CHANGE': '🔄'
};

export default function WardenRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('');
  
  const load = async () => {
    try {
      setLoading(true);
      const res = await wardenApi.getRequests();
      setRequests(res.requests || []);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await wardenApi.reviewRequest(id, { status });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to update request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const filteredRequests = filter
    ? requests.filter(r => r.status === filter)
    : requests;

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Requests</h1>
        <p className="text-gray-600 mt-1">Review and manage student leave and room change requests</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-6 py-4 shadow-sm">
          {error}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Requests</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <span className="text-3xl">✓</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <span className="text-3xl">✗</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All Requests</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 All Requests</h2>
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600">No requests found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((r) => (
              <Card key={r.id}>
                <CardContent>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{typeIcons[r.type] || '📄'}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{r.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          Student: <span className="font-semibold text-gray-900">{r.Student?.firstName} {r.Student?.lastName}</span>
                        </p>
                      </div>
                      <span className={`inline-block px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${
                        statusColors[r.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{r.description}</p>
                    </div>

                    {/* Request Details */}
                    {r.type === 'LEAVE' && r.fromDate && r.toDate && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50 rounded-lg p-4">
                        <div>
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">From</p>
                          <p className="text-sm text-blue-900 font-medium mt-1">
                            {new Date(r.fromDate).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">To</p>
                          <p className="text-sm text-blue-900 font-medium mt-1">
                            {new Date(r.toDate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {r.type === 'ROOM_CHANGE' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-purple-50 rounded-lg p-4">
                        <div>
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Student</p>
                          <p className="text-sm text-purple-900 font-medium mt-1">
                            {r.studentName || r.Student?.firstName} ({r.rollNumber || r.Student?.studentId})
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Current Room</p>
                          <p className="text-sm text-purple-900 font-medium mt-1">
                            {r.currentRoomNumber || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Target Room</p>
                          <p className="text-sm text-purple-900 font-medium mt-1">
                            {r.targetRoomNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {r.status === 'PENDING' && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => review(r.id, 'APPROVED')}
                          className="flex-1 sm:flex-none"
                        >
                          ✓ Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => review(r.id, 'REJECTED')}
                          className="flex-1 sm:flex-none"
                        >
                          ✗ Reject
                        </Button>
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
