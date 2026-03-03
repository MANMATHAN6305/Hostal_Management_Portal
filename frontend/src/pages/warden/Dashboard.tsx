import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wardenApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const quickActions = [
  { title: 'Students List', href: '/warden/students', color: 'bg-blue-600', icon: '👥' },
  { title: 'Requests', href: '/warden/requests', color: 'bg-green-600', icon: '📝' },
  { title: 'Complaints', href: '/warden/complaints', color: 'bg-orange-600', icon: '🔧' },
  { title: 'Attendance', href: '/warden/attendance', color: 'bg-purple-600', icon: '📊' },
  { title: 'Messages', href: '/warden/messages', color: 'bg-indigo-600', icon: '✉️' }
];

export default function WardenDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    pendingRequests: 0,
    openComplaints: 0,
    attendanceLogs: 0,
    totalStudents: 0,
    allocatedStudents: 0,
    resolvedComplaints: 0,
    approvedRequests: 0,
    todayAttendance: 0,
    unreadMessages: 0
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await wardenApi.getDashboard();
      if (!res?.success) {
        setError(res?.message || 'Failed to load warden dashboard.');
        return;
      }

      // Fetch unread messages
      let unreadCount = 0;
      try {
        const messagesRes = await wardenApi.getReceivedMessages();
        if (messagesRes?.success && Array.isArray(messagesRes.messages)) {
          unreadCount = messagesRes.messages.filter((msg: any) => msg.status === 'SENT').length;
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }

      setStats({
        pendingRequests: Number(res.stats?.pendingRequests || 0),
        openComplaints: Number(res.stats?.openComplaints || 0),
        attendanceLogs: Number(res.stats?.attendanceLogs || 0),
        totalStudents: Number(res.stats?.totalStudents || 0),
        allocatedStudents: Number(res.stats?.allocatedStudents || 0),
        resolvedComplaints: Number(res.stats?.resolvedComplaints || 0),
        approvedRequests: Number(res.stats?.approvedRequests || 0),
        todayAttendance: Number(res.stats?.todayAttendance || 0),
        unreadMessages: unreadCount
      });
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Failed to load warden dashboard.';
      if (
        typeof message === 'string' &&
        (message.toLowerCase().includes('invalid or expired token') ||
          message.toLowerCase().includes('no token provided'))
      ) {
        localStorage.clear();
        navigate('/login', { replace: true });
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Warden Dashboard</h1>
        <p className="text-blue-100 text-lg">Manage students, requests, complaints, and attendance records</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link 
              key={action.title} 
              to={action.href} 
              className={`${action.color} hover:opacity-90 text-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 relative`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="font-semibold">{action.title}</div>
                {action.title === 'Messages' && stats.unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                    {stats.unreadMessages}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Student Statistics */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Student Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                  <p className="text-xs text-gray-500 mt-1">Under your supervision</p>
                </div>
                <span className="text-3xl">👥</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Allocated Students</p>
                  <p className="text-3xl font-bold text-green-600">{stats.allocatedStudents}</p>
                  <p className="text-xs text-gray-500 mt-1">With room assignments</p>
                </div>
                <span className="text-3xl">✓</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Today's Attendance</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.todayAttendance}</p>
                  <p className="text-xs text-gray-500 mt-1">Present today</p>
                </div>
                <span className="text-3xl">📊</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Requests & Complaints */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Requests, Complaints & Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Student Requests</h3>
                  <Link to="/warden/requests">
                    <Button size="sm" variant="outline">View All →</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-xs text-yellow-700 font-medium mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-green-700 font-medium mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Maintenance Complaints</h3>
                  <Link to="/warden/complaints">
                    <Button size="sm" variant="outline">View All →</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-xs text-orange-700 font-medium mb-1">Open</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.openComplaints}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-green-700 font-medium mb-1">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolvedComplaints}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Admin Messages</h3>
                  <Link to="/warden/messages">
                    <Button size="sm" variant="outline">View All →</Button>
                  </Link>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-700 font-medium mb-1">Unread Messages</p>
                      <p className="text-3xl font-bold text-indigo-600">{stats.unreadMessages}</p>
                    </div>
                    {stats.unreadMessages > 0 && (
                      <span className="text-2xl animate-pulse">✉️</span>
                    )}
                  </div>
                  <p className="text-xs text-indigo-600 mt-2">Click to view and respond</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance Summary */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Attendance Summary</h2>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Attendance Logs</p>
                <p className="text-3xl font-bold text-purple-600">{stats.attendanceLogs}</p>
                <p className="text-xs text-gray-500 mt-1">Biometric check-in records</p>
              </div>
              <Link to="/warden/attendance">
                <Button variant="primary">View Attendance Records →</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Dashboard Tip</h3>
            <p className="text-sm text-blue-700">
              Use the quick actions above to navigate to different sections. Check pending requests and open complaints regularly to ensure timely resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
