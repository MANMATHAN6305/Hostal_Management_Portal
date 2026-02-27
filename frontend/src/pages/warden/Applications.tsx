import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function WardenApplications() {
  const [applications, setApplications] = useState<any[]>([]);

  const load = async () => {
    const res = await wardenApi.getApplications();
    setApplications(res.applications || []);
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    await wardenApi.reviewApplication(id, { status });
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Applications</h1>
      <Card>
        <CardContent className="space-y-2">
          {applications.map((a) => (
            <div key={a.id} className="border rounded p-3">
              <div className="flex justify-between">
                <span>{a.Student?.firstName} {a.Student?.lastName} - {a.Hostel?.name}</span>
                <span className="font-semibold">{a.status}</span>
              </div>
              <p className="text-sm text-gray-600">{a.reason || 'No reason'}</p>
              {a.status === 'PENDING' && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => review(a.id, 'APPROVED')}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => review(a.id, 'REJECTED')}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
