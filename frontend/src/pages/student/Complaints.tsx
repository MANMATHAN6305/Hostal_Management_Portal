import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studentApi } from '@/lib/api';

const categories = ['ELECTRICAL', 'CLEANING', 'MAINTENANCE', 'OTHER'];

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('OTHER');

  const load = async () => {
    const response = await studentApi.getComplaints();
    setComplaints(response.complaints || []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!message.trim()) return;
    await studentApi.submitComplaint({ message, category });
    setMessage('');
    setCategory('OTHER');
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Complaints</h1>

      <Card>
        <CardContent className="space-y-3">
          <select className="w-full border rounded px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Describe issue"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={submit}>Submit Complaint</Button>
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
              <p className="text-xs text-gray-500">Assigned: {c.assignedStaffRole || 'Pending assignment'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
