import { useEffect, useState } from 'react';
import { studentApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';

export default function StaffDirectory() {
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    studentApi.getStaffDirectory().then((res) => setStaff(res.staff || []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Staff Directory</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staff.map((s) => (
          <Card key={s.id}>
            <CardContent>
              <p className="font-semibold">{s.fullName}</p>
              <p className="text-sm text-gray-600">{s.staffRole || s.role}</p>
              <p className="text-sm">{s.email}</p>
              <p className="text-sm">{s.phone || 'N/A'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
