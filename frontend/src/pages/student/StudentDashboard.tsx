import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { studentApi } from '@/lib/api';

interface DashboardData {
  student: {
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    year: number;
    gender: string;
  } | null;
  room: {
    roomNumber: string;
    roomType: string;
    floorNumber: number;
    blockName: string;
    amenities: string;
  } | null;
  allocation: {
    academicYear: string;
    semester: string;
    status: string;
    allocationDate: string;
  } | null;
  stats: {
    pendingComplaints: number;
    totalComplaints: number;
  };
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await studentApi.getDashboard();
      if (response.success) {
        setData(response);
      } else {
        setError(response.message || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg">
        <h3 className="font-semibold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  const quickLinks = [
    { title: 'View Room Details', icon: '🛏️', href: '/student/room', color: 'bg-blue-500' },
    { title: 'Raise Complaint', icon: '📢', href: '/student/complaints', color: 'bg-orange-500' },
    { title: 'Weekly Menu', icon: '🍽️', href: '/student/menu', color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome, {data?.student?.firstName} {data?.student?.lastName}! 👋
        </h1>
        <p className="text-emerald-100 mt-1">
          {data?.student?.department} - Year {data?.student?.year}
        </p>
        <p className="text-emerald-200 text-sm mt-2">
          Student ID: {data?.student?.studentId}
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.title} to={link.href}>
            <div className={`${link.color} text-white rounded-xl p-4 hover:opacity-90 transition-opacity cursor-pointer`}>
              <div className="text-2xl mb-2">{link.icon}</div>
              <p className="font-medium">{link.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>👤</span> Profile Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Full Name</span>
                <span className="font-medium">{data?.student?.firstName} {data?.student?.lastName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Email</span>
                <span className="font-medium">{data?.student?.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Phone</span>
                <span className="font-medium">{data?.student?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Department</span>
                <span className="font-medium">{data?.student?.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Year</span>
                <span className="font-medium">Year {data?.student?.year}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Details Card */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>🏠</span> Room Details
            </h2>
            {data?.room ? (
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Room Number</span>
                  <span className="font-medium text-emerald-600 text-lg">{data.room.roomNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Block</span>
                  <span className="font-medium">{data.room.blockName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Floor</span>
                  <span className="font-medium">Floor {data.room.floorNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Room Type</span>
                  <span className="font-medium">{data.room.roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    data.allocation?.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {data.allocation?.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🏠</div>
                <p className="text-slate-500">No room allocated yet</p>
                <p className="text-sm text-slate-400 mt-1">Please contact the hostel office</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complaints Summary */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span>📋</span> Complaints Summary
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {data?.stats?.pendingComplaints || 0} pending out of {data?.stats?.totalComplaints || 0} total complaints
              </p>
            </div>
            <Link 
              to="/student/complaints"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              View All
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
