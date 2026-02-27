import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminStaff() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'STAFF', staffRole: 'ELECTRICIAN' });

  const load = async () => {
    const res = await adminApi.getStaff();
    setUsers(res.users || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await adminApi.createStaff(form);
    setForm({ fullName: '', email: '', password: '', role: 'STAFF', staffRole: 'ELECTRICIAN' });
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Staff and Wardens</h1>
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="border rounded px-2 py-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="STAFF">STAFF</option>
            <option value="WARDEN">WARDEN</option>
          </select>
          <select className="border rounded px-2 py-1" value={form.staffRole} onChange={(e) => setForm({ ...form, staffRole: e.target.value })}>
            <option value="ELECTRICIAN">ELECTRICIAN</option>
            <option value="CLEANER">CLEANER</option>
            <option value="CARETAKER">CARETAKER</option>
          </select>
          <Button className="md:col-span-5" onClick={create}>Add User</Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="border rounded p-3 flex justify-between">
              <span>{u.fullName} ({u.role}{u.staffRole ? `/${u.staffRole}` : ''})</span>
              <span>{u.email}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
