import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const staffMap: Record<string, string> = {
  ELECTRICAL: 'ELECTRICIAN',
  CLEANING: 'CLEANER',
  MAINTENANCE: 'CARETAKER'
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);

  const load = async () => {
    const res = await adminApi.getComplaints();
    setComplaints(res.complaints || []);
  };

  useEffect(() => {
    load();
  }, []);

  const assign = async (id: number, category: string) => {
    await adminApi.assignComplaint(id, { assignedStaffRole: staffMap[category] || 'CARETAKER' });
    await load();
  };

  const resolve = async (id: number) => {
    await adminApi.updateComplaint(id, { status: 'RESOLVED' });
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Complaint Management</h1>
      <Card>
        <CardContent className="space-y-2">
          {complaints.map((c) => (
            <div key={c.id} className="border rounded p-3">
              <div className="flex justify-between">
                <span>{c.category} - {c.Student?.firstName} {c.Student?.lastName}</span>
                <span className="font-semibold">{c.status}</span>
              </div>
              <p className="text-sm text-gray-600">{c.message}</p>
              <p className="text-xs text-gray-500">Assigned: {c.assignedStaffRole || 'Not assigned'}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => assign(c.id, c.category)}>Assign</Button>
                {c.status !== 'RESOLVED' && <Button size="sm" variant="secondary" onClick={() => resolve(c.id)}>Mark Resolved</Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
