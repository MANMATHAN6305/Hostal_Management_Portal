import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { allocationsApi, roomsApi, studentsApi } from '@/lib/api';
import type { Room } from '@/types';

const quickActions = [
  { title: 'New Allocation', href: '/allocations/add', icon: '\uD83D\uDCCB', color: 'from-blue-500 to-blue-600' },
  { title: 'Add Student', href: '/students/add', icon: '\uD83D\uDC65', color: 'from-green-500 to-green-600' },
  { title: 'Add Room', href: '/rooms/add', icon: '\uD83C\uDFE0', color: 'from-purple-500 to-purple-600' },
  { title: 'Manage Wardens', href: '/wardens', icon: '\uD83D\uDC54', color: 'from-orange-500 to-orange-600' }
];

const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
  <Card className="relative overflow-hidden">
    <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-5`} />
    <CardContent className="relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Admin');
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    totalStudents: 0,
    activeAllocations: 0
  });
  const [recentAllocations, setRecentAllocations] = useState<any[]>([]);

  const toArray = (payload: unknown, key?: string) => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      if (key && Array.isArray(record[key])) return record[key];
      if (Array.isArray(record.data)) return record.data;
      if (Array.isArray(record.items)) return record.items;
      if (Array.isArray(record.results)) return record.results;
    }
    return [];
  };

  const load = async () => {
    setLoading(true);
    try {
      const [roomsResult, studentsResult, allocationsResult] = await Promise.allSettled([
        roomsApi.getAll(),
        studentsApi.getAll(),
        allocationsApi.getAll()
      ]);

      const roomsArray =
        roomsResult.status === 'fulfilled'
          ? (toArray(roomsResult.value, 'rooms') as Room[])
          : [];
      const studentsArray =
        studentsResult.status === 'fulfilled'
          ? toArray(studentsResult.value, 'students')
          : [];
      const allocationsArray =
        allocationsResult.status === 'fulfilled'
          ? toArray(allocationsResult.value, 'allocations')
          : [];

      setStats({
        totalRooms: roomsArray.length,
        availableRooms: roomsArray.filter((r: Room) => r.status === 'AVAILABLE').length,
        totalStudents: studentsArray.length,
        activeAllocations: allocationsArray.filter((a: any) => a?.status === 'ACTIVE').length
      });
      setRecentAllocations(allocationsArray.slice(0, 5));
      if (roomsResult.status === 'rejected' || studentsResult.status === 'rejected' || allocationsResult.status === 'rejected') {
        console.error('Dashboard data fetch partially failed:', {
          rooms: roomsResult.status === 'rejected' ? roomsResult.reason : null,
          students: studentsResult.status === 'rejected' ? studentsResult.reason : null,
          allocations: allocationsResult.status === 'rejected' ? allocationsResult.reason : null
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || 'Admin');
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}</h1>
        <p className="text-blue-100">Manage your hostel operations efficiently</p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className={`bg-gradient-to-br ${action.color} text-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-between group`}
            >
              <div>
                <p className="font-semibold text-sm">{action.title}</p>
              </div>
              <span className="text-2xl opacity-80 group-hover:opacity-100 transition-opacity">{action.icon}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Key Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Rooms" value={stats.totalRooms} icon={'\uD83C\uDFE0'} color="from-blue-500 to-blue-600" />
          <StatCard label="Available Rooms" value={stats.availableRooms} icon={'\u2705'} color="from-green-500 to-green-600" />
          <StatCard label="Total Students" value={stats.totalStudents} icon={'\uD83D\uDC65'} color="from-purple-500 to-purple-600" />
          <StatCard label="Active Allocations" value={stats.activeAllocations} icon={'\uD83D\uDCCB'} color="from-orange-500 to-orange-600" />
        </div>
      </div>

      <Card>
        <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-center">
          <CardTitle>Recent Allocations</CardTitle>
          <Link to="/allocations">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <CardContent>
          {recentAllocations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No allocations yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAllocations.map((a) => (
                <div key={a.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">Room {a.roomNumber || a.roomId}</p>
                      <p className="text-sm text-gray-600 mt-1">{a.studentName || `Student ${a.studentId}`}</p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      a.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      a.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      a.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
