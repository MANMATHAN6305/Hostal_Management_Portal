import { useEffect, useState } from 'react';
import { studentApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function StudentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [type, setType] = useState('LEAVE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    const res = await studentApi.getRequests();
    setRequests(res.requests || []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!title || !description) return;
    await studentApi.submitRequest({ type, title, description });
    setTitle('');
    setDescription('');
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leave and Room Change Requests</h1>
      <Card>
        <CardContent className="space-y-3">
          <select className="w-full border rounded px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="LEAVE">Leave Request</option>
            <option value="ROOM_CHANGE">Room Change</option>
          </select>
          <input className="w-full border rounded px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={submit}>Submit Request</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-semibold mb-2">My Requests</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="border rounded p-3 text-sm">
                <div className="flex justify-between">
                  <span>{r.type} - {r.title}</span>
                  <span className="font-semibold">{r.status}</span>
                </div>
                <p className="text-gray-600">{r.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
