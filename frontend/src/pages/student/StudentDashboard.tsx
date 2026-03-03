import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studentApi } from '@/lib/api';

const QuickActionButton = ({ icon, label, href }: { icon: string; label: string; href: string }) => (
  <Link to={href} className="group">
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-gray-200 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="font-semibold text-gray-900 text-sm">{label}</p>
    </div>
  </Link>
);

const InfoField = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="font-semibold text-gray-900">{value || 'N/A'}</span>
  </div>
);

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

  const student = dashboard?.student;
  const room = dashboard?.room;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {student?.firstName} {student?.lastName}
        </h1>
        <p className="text-blue-100">
          {student?.department} • Year {student?.year} • ID: {student?.studentId}
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton icon="🏫" label="Apply Hostel" href="/student/apply" />
          <QuickActionButton icon="🏠" label="My Room" href="/student/room" />
          <QuickActionButton icon="📝" label="My Complaints" href="/student/complaints" />
          <QuickActionButton icon="🍽️" label="Meal Menu" href="/student/menu" />
        </div>
      </div>

      {/* Profile and Room Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-4">👤 Profile Information</CardTitle>
          <CardContent>
            <div className="space-y-0">
              <InfoField label="Full Name" value={`${student?.firstName} ${student?.lastName}`} />
              <InfoField label="Email" value={student?.email} />
              <InfoField label="Phone" value={student?.phone} />
              <InfoField label="Gender" value={student?.gender} />
              <InfoField label="Department" value={student?.department} />
              <InfoField label="Year" value={`Year ${student?.year}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">🏠 Room Information</CardTitle>
          <CardContent>
            {room ? (
              <div className="space-y-0">
                <InfoField label="Room Number" value={room.roomNumber} />
                <InfoField label="Block/Building" value={room.blockName} />
                <InfoField label="Room Type" value={room.roomType} />
                <InfoField label="Occupancy" value={`${room.currentOccupancy || 0}/${room.capacity || '-'}`} />
                <InfoField label="Status" value={room.status || 'Allocated'} />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm mb-3">No room allocated yet</p>
                <Link to="/student/apply">
                  <Button size="sm">Apply for Hostel</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
