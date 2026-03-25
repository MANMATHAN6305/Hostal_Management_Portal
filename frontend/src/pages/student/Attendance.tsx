import { useEffect, useMemo, useState } from 'react';
import { studentApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const formatAttendanceTime = (value?: string | null) => {
  if (!value) return '-';

  const [hourText = '0', minuteText = '00'] = String(value).split(':');
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
};

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await studentApi.getAttendance();
        setAttendance(res.attendance || []);
      } catch (_error) {
        setError('Failed to load attendance records.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((entry) => !dateFilter || entry.date === dateFilter);
  }, [attendance, dateFilter]);

  const presentDays = filteredAttendance.filter((entry) => Boolean(entry.checkInTime)).length;
  const absentDays = filteredAttendance.length - presentDays;

  const latestRecord = filteredAttendance[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 attendance-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-600 mt-1">View your daily check-in and check-out history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Records</p>
            <p className="text-3xl font-bold text-blue-600">{filteredAttendance.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-600 mb-1">Present Days</p>
            <p className="text-3xl font-bold text-green-600">{presentDays}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-gray-600 mb-1">Absent Days</p>
            <p className="text-3xl font-bold text-red-600">{absentDays}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              />
            </div>

            <div>
              <Button size="sm" variant="outline" onClick={() => setDateFilter('')}>
                Clear Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredAttendance.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-10 text-gray-600">
              No attendance records found.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Check-in</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Check-out</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Device</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900">{entry.date}</td>
                      <td className="py-3 px-4 text-gray-700">{formatAttendanceTime(entry.checkInTime)}</td>
                      <td className="py-3 px-4 text-gray-700">{formatAttendanceTime(entry.checkOutTime)}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{entry.deviceId || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        {entry.checkInTime ? (
                          <span className="attendance-status-present inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Present
                          </span>
                        ) : (
                          <span className="attendance-status-absent inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {latestRecord && (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-600">
              Latest record: <span className="font-semibold text-gray-900">{latestRecord.date}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
