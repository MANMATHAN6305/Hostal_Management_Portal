import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studentApi } from '@/lib/api';

const QuickActionButton = ({ icon, label, href }: { icon: string; label: string; href: string }) => (
  <Link to={href} className="group block">
    <Card className="relative overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-5" />
      <CardContent className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Quick Action</p>
            <p className="text-lg font-bold text-gray-900">{label}</p>
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const InfoField = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="font-semibold text-gray-900">{value || 'N/A'}</span>
  </div>
);

const roomTypeLabelMap: Record<string, string> = {
  SINGLE: 'Single',
  DOUBLE: 'Double',
  TRIPLE: 'Triple',
  FOUR_BED: 'Four Bedded',
  FIVE_BED: 'Five Bedded',
  EIGHT_BED: 'Eight Bedded',
  DORMITORY: 'Dormitory'
};

const formatRoomType = (roomType?: string) => {
  if (!roomType) return 'N/A';
  return roomTypeLabelMap[roomType] || roomType;
};

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
  const warden = dashboard?.warden;
  const occupancyValue =
    room && Number.isFinite(Number(room.capacity))
      ? `${Number(room.currentOccupancy || 0)}/${Number(room.capacity)} beds occupied`
      : 'N/A';
  const roomStatus = room?.status || (dashboard?.allocation?.status === 'ACTIVE' ? 'Allocated' : 'Available');
  const semesterFee = room ? `\u20B9${Number(room.semesterFee || 0).toLocaleString()}` : 'N/A';
  const assignedWardenName = warden?.name || 'Warden not assigned.';
  const assignedWardenPhone = warden?.phone || 'N/A';
  const hasAssignedWarden = Boolean(warden?.name);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {student?.firstName} {student?.lastName}
            </h1>
            <p className="text-blue-100">
              {student?.department} • Year {student?.year} • ID: {student?.studentId}
            </p>
          </div>

          <div className="lg:text-right bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm lg:min-w-[280px]">
            <p className="text-xs uppercase tracking-wide text-blue-100 mb-1">Assigned Warden</p>
            {hasAssignedWarden ? (
              <>
                <p className="text-lg font-semibold text-white">{assignedWardenName}</p>
                <p className="text-sm text-blue-100">{assignedWardenPhone}</p>
              </>
            ) : (
              <p className="text-sm font-medium text-blue-100">Warden not assigned.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionButton icon="🏫" label="Apply Hostel" href="/student/apply" />
          <QuickActionButton icon="🏠" label="My Room" href="/student/room" />
          <QuickActionButton icon="📊" label="Attendance" href="/student/attendance" />
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
                <InfoField label="Block / Hostel Name" value={room.blockName} />
                <InfoField label="Room Type" value={formatRoomType(room.roomType)} />
                <InfoField label="Occupancy" value={occupancyValue} />
                <InfoField label="Status" value={roomStatus} />
                <InfoField label="Semester Fee" value={semesterFee} />
                <InfoField label="Assigned Warden" value={assignedWardenName} />
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
