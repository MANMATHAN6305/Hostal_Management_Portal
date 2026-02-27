import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { allocationsApi, roomsApi, studentsApi } from '@/lib/api';
import type { Room } from '@/types';

const quickActions = [
  { title: 'New Allocation', href: '/allocations/add', color: 'bg-blue-500' },
  { title: 'Add Student', href: '/students/add', color: 'bg-green-500' },
  { title: 'Add Room', href: '/rooms/add', color: 'bg-purple-500' },
  { title: 'Staff', href: '/staff', color: 'bg-orange-500' }
];

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

  const load = async () => {
    setLoading(true);
    try {
      const [rooms, students, allocations] = await Promise.all([
        roomsApi.getAll(),
        studentsApi.getAll(),
        allocationsApi.getAll()
      ]);

      const roomsArray = Array.isArray(rooms) ? rooms : [];
      const studentsArray = Array.isArray(students) ? students : [];
      const allocationsArray = Array.isArray(allocations) ? allocations : [];

      setStats({
        totalRooms: roomsArray.length,
        availableRooms: roomsArray.filter((r: Room) => r.status === 'AVAILABLE').length,
        totalStudents: studentsArray.length,
        activeAllocations: allocationsArray.length
      });
      setRecentAllocations(allocationsArray.slice(0, 5));
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-600">Welcome, {userName}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.title} to={action.href} className={`${action.color} text-white rounded-xl p-4`}>
            {action.title}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><CardContent><p className="text-sm text-slate-600">Total Rooms</p><p className="text-2xl font-bold">{stats.totalRooms}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-600">Available Rooms</p><p className="text-2xl font-bold">{stats.availableRooms}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-600">Total Students</p><p className="text-2xl font-bold">{stats.totalStudents}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-slate-600">Active Allocations</p><p className="text-2xl font-bold">{stats.activeAllocations}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Allocations</h2>
            <Link to="/allocations" className="text-sm text-blue-600">View All</Link>
          </div>
          <div className="space-y-2">
            {recentAllocations.length === 0 ? (
              <p className="text-sm text-slate-500">No allocations yet.</p>
            ) : (
              recentAllocations.map((a) => (
                <div key={a.id} className="border rounded p-3 text-sm flex justify-between">
                  <span>Room {a.roomNumber || a.roomId} - {a.studentName || `Student ${a.studentId}`}</span>
                  <span className="font-semibold">{a.status}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
