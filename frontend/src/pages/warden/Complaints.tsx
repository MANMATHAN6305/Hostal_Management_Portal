import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function WardenComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);

  const load = async () => {
    const res = await wardenApi.getComplaints();
    setComplaints(res.complaints || []);
  };

  useEffect(() => {
    load();
  }, []);

  const autoAssign = async (id: number, category: string) => {
    const map: Record<string, string> = {
      ELECTRICAL: 'ELECTRICIAN',
      CLEANING: 'CLEANER',
      MAINTENANCE: 'CARETAKER'
    };
    await wardenApi.assignComplaint(id, map[category] || 'CARETAKER');
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Complaint Routing</h1>
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
              <Button size="sm" className="mt-2" onClick={() => autoAssign(c.id, c.category)}>Assign by Category</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
