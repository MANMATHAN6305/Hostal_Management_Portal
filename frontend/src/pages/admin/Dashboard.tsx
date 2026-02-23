import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { roomsApi, studentsApi, allocationsApi } from '@/lib/api';
import type { Room, Guest, Booking } from '@/types';

const quickActions = [
  { title: 'New Allocation', icon: '📝', href: '/allocations/add', color: 'bg-blue-500' },
  { title: 'Add Student', icon: '👤', href: '/students/add', color: 'bg-green-500' },
  { title: 'Add Room', icon: '🏠', href: '/rooms/add', color: 'bg-purple-500' },
  { title: 'View Reports', icon: '📊', href: '/allocations', color: 'bg-orange-500' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    totalStudents: 0,
    activeAllocations: 0,
  });
  const [recentAllocations, setRecentAllocations] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || 'User');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [rooms, students, allocations] = await Promise.all([
        roomsApi.getAll(),
        studentsApi.getAll(),
        allocationsApi.getAll(),
      ]);

      const roomsArray = Array.isArray(rooms) ? rooms : [];
      const studentsArray = Array.isArray(students) ? students : [];
      const allocationsArray = Array.isArray(allocations) ? allocations : [];

      const availableRooms = roomsArray.filter((r: Room) => r.status === 'AVAILABLE').length;

      setStats({
        totalRooms: roomsArray.length,
        availableRooms,
        totalStudents: studentsArray.length,
        activeAllocations: allocationsArray.length,
      });

      setRecentAllocations(allocationsArray.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsDisplay = [
    { title: 'Total Rooms', value: stats.totalRooms, icon: '🛏️', href: '/rooms' },
    { title: 'Available Rooms', value: stats.availableRooms, icon: '✅', href: '/rooms' },
    { title: 'Total Allocations', value: stats.activeAllocations, icon: '📅', href: '/allocations' },
    { title: 'Total Students', value: stats.totalStudents, icon: '👥', href: '/students' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600">Welcome to College Hostel Management Portal, {userName}!</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.title} to={action.href}>
            <div className={`${action.color} text-white rounded-xl p-4 hover:opacity-90 transition-opacity cursor-pointer`}>
              <div className="text-2xl mb-2">{action.icon}</div>
              <p className="font-medium">{action.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsDisplay.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4">
                <div className="text-3xl">{stat.icon}</div>
                <div>
                  <p className="text-sm text-slate-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Allocations */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Allocations</h3>
            <Link to="/allocations" className="text-emerald-600 hover:text-emerald-500 text-sm">
              View All →
            </Link>
          </div>
          {recentAllocations.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No allocations yet</p>
          ) : (
            <div className="space-y-3">
              {recentAllocations.map((allocation) => (
                <div key={allocation.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">Room {allocation.roomNumber || allocation.roomId}</p>
                    <p className="text-sm text-slate-500">{allocation.studentName || `Student ID: ${allocation.studentId}`}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    allocation.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    allocation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {allocation.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
