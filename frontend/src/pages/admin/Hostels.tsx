import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminHostels() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', blockCode: '', gender: 'COED', totalRooms: 0 });

  const load = async () => {
    const res = await adminApi.getHostels();
    setHostels(res.hostels || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await adminApi.addHostel(form);
    setForm({ name: '', blockCode: '', gender: 'COED', totalRooms: 0 });
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hostels</h1>
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Block Code" value={form.blockCode} onChange={(e) => setForm({ ...form, blockCode: e.target.value })} />
          <select className="border rounded px-2 py-1" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="COED">COED</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
          <input className="border rounded px-2 py-1" placeholder="Total Rooms" value={form.totalRooms} onChange={(e) => setForm({ ...form, totalRooms: Number(e.target.value) || 0 })} />
          <Button className="md:col-span-4" onClick={create}>Add Hostel</Button>
        </CardContent>
      </Card>
      <Card><CardContent className="space-y-2">{hostels.map((h) => <div key={h.id} className="border rounded p-3 flex justify-between"><span>{h.name}</span><span>{h.gender} | {h.totalRooms}</span></div>)}</CardContent></Card>
    </div>
  );
}
