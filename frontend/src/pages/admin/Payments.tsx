import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: '', amount: '', paymentDate: '', mode: 'UPI' });

  const load = async () => {
    const res = await adminApi.getPayments();
    setPayments(res.payments || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    await adminApi.addPayment({ ...form, studentId: Number(form.studentId), amount: Number(form.amount), status: 'PAID' });
    setForm({ studentId: '', amount: '', paymentDate: '', mode: 'UPI' });
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Payments</h1>
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input type="date" className="border rounded px-2 py-1" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
          <select className="border rounded px-2 py-1" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            <option value="UPI">UPI</option>
            <option value="CARD">CARD</option>
            <option value="CASH">CASH</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
          </select>
          <Button className="md:col-span-4" onClick={add}>Add Payment</Button>
        </CardContent>
      </Card>
      <Card><CardContent className="space-y-2">{payments.map((p) => <div key={p.id} className="border rounded p-3 flex justify-between"><span>{p.Student?.studentId} - {p.paymentDate}</span><span>Rs {p.amount} ({p.status})</span></div>)}</CardContent></Card>
    </div>
  );
}
