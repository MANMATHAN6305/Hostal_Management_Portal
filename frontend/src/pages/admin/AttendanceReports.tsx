import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';

export default function AdminAttendanceReports() {
  const [attendance, setAttendance] = useState<any[]>([]);
  useEffect(() => {
    adminApi.getAttendance().then((res) => setAttendance(res.attendance || []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Attendance Reports</h1>
      <Card>
        <CardContent className="space-y-2">
          {attendance.map((a) => (
            <div key={a.id} className="border rounded p-3 flex justify-between text-sm">
              <span>{a.Student?.studentId} - {a.Student?.firstName} {a.Student?.lastName}</span>
              <span>{a.date} ({a.deviceId})</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
