import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
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

export default function WardenAttendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    wardenApi.getAttendance().then((res) => setAttendance(res.attendance || []));
  }, []);

  // Filter attendance
  const filteredAttendance = attendance.filter((a) => {
    const matchesSearch = 
      !search || 
      a.Student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      `${a.Student?.firstName} ${a.Student?.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateFilter || a.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  // Statistics
  const todayDate = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayDate);
  const presentToday = todayAttendance.filter(a => a.checkInTime).length;
  const absentToday = todayAttendance.filter(a => !a.checkInTime).length;
  const totalStudents = attendance.length;

  return (
    <div className="space-y-8 attendance-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Biometric Attendance</h1>
        <p className="text-gray-600 mt-1">Track and monitor student check-in/check-out records</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{presentToday}</p>
              </div>
              <span className="text-3xl">✓</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Absent Today</p>
                <p className="text-3xl font-bold text-red-600">{absentToday}</p>
              </div>
              <span className="text-3xl">✗</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Search Student</label>
              <input
                type="text"
                placeholder="Search by name or student ID..."
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
          {(search || dateFilter) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => { setSearch(''); setDateFilter(''); }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Attendance Records
          <span className="text-sm font-normal text-gray-600 ml-2">
            ({filteredAttendance.length} record{filteredAttendance.length !== 1 ? 's' : ''})
          </span>
        </h2>

        {filteredAttendance.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600">No attendance records found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Student ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Check-in</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Check-out</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Device</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttendance.map((a) => (
                          <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-gray-900 font-medium">{a.Student?.studentId || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-900">
                              {a.Student?.firstName} {a.Student?.lastName}
                            </td>
                            <td className="py-3 px-4 text-gray-700">{a.date}</td>
                            <td className="py-3 px-4 text-gray-700">{formatAttendanceTime(a.checkInTime)}</td>
                            <td className="py-3 px-4 text-gray-700">{formatAttendanceTime(a.checkOutTime)}</td>
                            <td className="py-3 px-4 text-gray-600 text-sm">{a.deviceId || 'N/A'}</td>
                            <td className="py-3 px-4 text-center">
                              {a.checkInTime ? (
                                <span className="attendance-status-present inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                  ✓ Present
                                </span>
                              ) : (
                                <span className="attendance-status-absent inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                  ✗ Absent
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
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {filteredAttendance.map((a) => (
                <Card key={a.id}>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {a.Student?.firstName} {a.Student?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{a.Student?.studentId || 'N/A'}</p>
                        </div>
                        {a.checkInTime ? (
                          <span className="attendance-status-present inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            ✓ Present
                          </span>
                        ) : (
                          <span className="attendance-status-absent inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            ✗ Absent
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-blue-700 font-medium mb-0.5">Date</p>
                          <p className="text-blue-900">{a.date}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <p className="text-purple-700 font-medium mb-0.5">Device</p>
                          <p className="text-purple-900">{a.deviceId || 'N/A'}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-green-700 font-medium mb-0.5">Check-in</p>
                          <p className="text-green-900">{formatAttendanceTime(a.checkInTime)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2">
                          <p className="text-orange-700 font-medium mb-0.5">Check-out</p>
                          <p className="text-orange-900">{formatAttendanceTime(a.checkOutTime)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}