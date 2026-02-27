import { useEffect, useState } from 'react';
import { studentApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';

export default function StudentPayments() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    studentApi.getPayments().then((res) => setPayments(res.payments || []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Payment History</h1>
      <Card>
        <CardContent>
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="border rounded p-3 flex justify-between">
                <span>{p.paymentDate} - {p.mode}</span>
                <span className="font-semibold">Rs {p.amount} ({p.status})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
