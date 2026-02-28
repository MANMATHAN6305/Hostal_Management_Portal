import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studentApi } from '@/lib/api';

const categories = [
  { label: 'Room Issue', value: 'MAINTENANCE' },
  { label: 'Electrical Issue', value: 'ELECTRICAL' },
  { label: 'Plumbing Issue', value: 'MAINTENANCE' },
  { label: 'Cleaning Issue', value: 'CLEANING' },
  { label: 'Other', value: 'OTHER' }
];

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('MAINTENANCE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    if (!message.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      await studentApi.submitComplaint({ message, category });
      setMessage('');
      setCategory('MAINTENANCE');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Complaints</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardContent className="space-y-3">
          <select className="w-full border rounded px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={`${c.label}-${c.value}`} value={c.value}>{c.label}</option>)}
          </select>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Describe issue"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          {complaints.map((c) => (
            <div key={c.id} className="border rounded p-3">
              <div className="flex justify-between">
                <span>{c.category}</span>
                <span className="font-semibold">{c.status}</span>
              </div>
              <p className="text-sm text-gray-600">{c.message}</p>
              <p className="text-xs text-gray-500">Assigned Warden: {c.AssignedBy?.fullName || 'Pending assignment'}</p>
              {c.adminReply && <p className="text-xs text-emerald-700">Warden Response: {c.adminReply}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
