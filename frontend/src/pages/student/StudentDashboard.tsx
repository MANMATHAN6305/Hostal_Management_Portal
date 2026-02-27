import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { studentApi } from '@/lib/api';

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardRes, applicationsRes] = await Promise.all([
        studentApi.getDashboard(),
        studentApi.getApplications()
      ]);

      if (!dashboardRes?.success) {
        setError(dashboardRes?.message || 'Failed to load dashboard.');
      } else {
        setDashboard(dashboardRes);
      }

      if (applicationsRes?.success) {
        setApplications(applicationsRes.applications || []);
      }
    } catch (e) {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const student = dashboard?.student;
  const room = dashboard?.room;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 text-white rounded-xl p-6">
        <h1 className="text-2xl font-bold">
          Welcome, {student?.firstName} {student?.lastName}
        </h1>
        <p className="text-gray-300 mt-1">{student?.department} - Year {student?.year}</p>
        <p className="text-gray-400 text-sm mt-1">Student ID: {student?.studentId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/student/apply" className="bg-gray-700 text-white rounded-xl p-4">Apply Hostel</Link>
        <Link to="/student/room" className="bg-gray-700 text-white rounded-xl p-4">My Room</Link>
        <Link to="/student/complaints" className="bg-gray-700 text-white rounded-xl p-4">Complaints</Link>
        <Link to="/student/menu" className="bg-gray-700 text-white rounded-xl p-4">Weekly Menu</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Profile</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span>{student?.firstName} {student?.lastName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{student?.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{student?.phone || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Gender</span><span>{student?.gender}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Room</h2>
            {room ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Room Number</span><span>{room.roomNumber}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Block</span><span>{room.blockName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span>{room.roomType}</span></div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No room allocated yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Submitted Hostel Applications</h2>
            <Link to="/student/apply" className="bg-gray-800 text-white px-3 py-2 rounded text-sm">Apply / Update</Link>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">No hostel application submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="border rounded p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{app.fullName} ({app.registerNumber})</span>
                    <span className="font-semibold">{app.status}</span>
                  </div>
                  <p className="text-gray-600">
                    {app.Hostel?.name || 'Hostel'} | {app.roomType || app.preferredRoomType || 'N/A'} {app.blockName ? `| ${app.blockName}` : ''}
                  </p>
                  <p className="text-gray-600">
                    {app.department} | Year {app.yearOfStudy} | {app.gender}
                  </p>
                  <p className="text-gray-600">
                    Guardian: {app.guardianName} ({app.relationship}) - {app.guardianContactNumber}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
