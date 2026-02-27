import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';

export default function WardenAttendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  useEffect(() => {
    wardenApi.getAttendance().then((res) => setAttendance(res.attendance || []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Biometric Attendance</h1>
      <Card>
        <CardContent className="space-y-2">
          {attendance.map((a) => (
            <div key={a.id} className="border rounded p-3 text-sm">
              <div className="flex justify-between">
                <span>{a.Student?.studentId} - {a.Student?.firstName} {a.Student?.lastName}</span>
                <span>{a.date}</span>
              </div>
              <p>Check-in: {a.checkInTime || '-'}, Check-out: {a.checkOutTime || '-'}, Device: {a.deviceId}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
