import { useEffect, useState } from 'react';
import { staffApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function StaffComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);

  const load = async () => {
    const res = await staffApi.getComplaints();
    setComplaints(res.complaints || []);
  };

  useEffect(() => {
    load();
  }, []);

  const mark = async (id: number, status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED') => {
    await staffApi.updateComplaintStatus(id, status);
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Assigned Complaints</h1>
      <Card>
        <CardContent className="space-y-2">
          {complaints.map((c) => (
            <div key={c.id} className="border rounded p-3">
              <div className="flex justify-between">
                <span>{c.category}</span>
                <span className="font-semibold">{c.status}</span>
              </div>
              <p className="text-sm text-gray-600">{c.message}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => mark(c.id, 'IN_PROGRESS')}>In Progress</Button>
                <Button size="sm" variant="secondary" onClick={() => mark(c.id, 'RESOLVED')}>Resolved</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
