import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function WardenComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [statusById, setStatusById] = useState<Record<number, string>>({});
  const [replyById, setReplyById] = useState<Record<number, string>>({});
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await wardenApi.getComplaints();
      const list = res.complaints || [];
      setComplaints(list);
      setStatusById(
        list.reduce((acc: Record<number, string>, complaint: any) => {
          acc[complaint.id] = complaint.status;
          return acc;
        }, {})
      );
      setReplyById(
        list.reduce((acc: Record<number, string>, complaint: any) => {
          acc[complaint.id] = complaint.adminReply || '';
          return acc;
        }, {})
      );
      setError('');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load complaints.');
    }
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
    try {
      await wardenApi.assignComplaint(id, map[category] || 'CARETAKER');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to assign complaint.');
    }
  };

  const saveComplaintUpdate = async (id: number) => {
    setSavingId(id);
    setError('');
    try {
      const status = (statusById[id] || 'PENDING') as 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
      await wardenApi.updateComplaint(id, {
        status,
        adminReply: replyById[id] || ''
      });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update complaint.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Complaint Routing</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Card>
        <CardContent className="space-y-2">
          {complaints.map((c) => (
            <div key={c.id} className="border rounded p-3">
              <div className="flex justify-between">
                <span>{c.category} - {c.Student?.firstName} {c.Student?.lastName}</span>
                <span className="font-semibold">{c.status}</span>
              </div>
              <p className="text-sm text-gray-600">{c.message}</p>
              <p className="text-xs text-gray-500">Assigned Warden: {c.AssignedBy?.fullName || 'Unassigned'}</p>
              <p className="text-xs text-gray-500">Assigned: {c.assignedStaffRole || 'Not assigned'}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={statusById[c.id] || c.status}
                  onChange={(e) => setStatusById((prev) => ({ ...prev, [c.id]: e.target.value }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                <Button size="sm" onClick={() => autoAssign(c.id, c.category)}>Assign by Category</Button>
              </div>
              <textarea
                className="w-full border rounded px-2 py-1 text-sm mt-2"
                rows={2}
                placeholder="Response to student"
                value={replyById[c.id] || ''}
                onChange={(e) => setReplyById((prev) => ({ ...prev, [c.id]: e.target.value }))}
              />
              <Button size="sm" className="mt-2" disabled={savingId === c.id} onClick={() => saveComplaintUpdate(c.id)}>
                {savingId === c.id ? 'Saving...' : 'Save Update'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
