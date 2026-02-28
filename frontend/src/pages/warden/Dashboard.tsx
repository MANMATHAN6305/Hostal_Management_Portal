import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wardenApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';

const quickActions = [
  { title: 'Applications', href: '/warden/applications', color: 'bg-blue-500' },
  { title: 'Requests', href: '/warden/requests', color: 'bg-green-500' },
  { title: 'Complaints', href: '/warden/complaints', color: 'bg-orange-500' },
  { title: 'Attendance', href: '/warden/attendance', color: 'bg-purple-500' }
];

export default function WardenDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    pendingRequests: 0,
    openComplaints: 0,
    attendanceLogs: 0
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

      setStats({
        pendingRequests: Number(res.stats?.pendingRequests || 0),
        openComplaints: Number(res.stats?.openComplaints || 0),
        attendanceLogs: Number(res.stats?.attendanceLogs || 0)
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load warden dashboard.');
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Warden Dashboard</h1>
        <p className="text-slate-600">Overview of approvals, complaints, and attendance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.title} to={action.href} className={`${action.color} text-white rounded-xl p-4`}>
            {action.title}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">Pending Requests</p>
            <p className="text-2xl font-bold">{stats.pendingRequests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">Open Complaints</p>
            <p className="text-2xl font-bold">{stats.openComplaints}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">Attendance Logs</p>
            <p className="text-2xl font-bold">{stats.attendanceLogs}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
