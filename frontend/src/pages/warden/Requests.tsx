import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function WardenRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const load = async () => {
    const res = await wardenApi.getRequests();
    setRequests(res.requests || []);
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    await wardenApi.reviewRequest(id, { status });
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Student Requests</h1>
      <Card>
        <CardContent className="space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="border rounded p-3">
              <div className="flex justify-between">
                <span>{r.type} - {r.title}</span>
                <span className="font-semibold">{r.status}</span>
              </div>
              <p className="text-sm text-gray-600">{r.Student?.firstName} {r.Student?.lastName}</p>
              <p className="text-sm text-gray-600">{r.description}</p>
              {r.type === 'LEAVE' && r.fromDate && r.toDate && (
                <p className="text-xs text-gray-500">
                  {new Date(r.fromDate).toLocaleString()} to {new Date(r.toDate).toLocaleString()}
                </p>
              )}
              {r.type === 'ROOM_CHANGE' && (
                <p className="text-xs text-gray-500">
                  {r.studentName || r.Student?.firstName} ({r.rollNumber || r.Student?.studentId}) | {r.currentRoomNumber || 'N/A'} to {r.targetRoomNumber || 'N/A'}
                </p>
              )}
              {r.status === 'PENDING' && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => review(r.id, 'APPROVED')}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => review(r.id, 'REJECTED')}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
