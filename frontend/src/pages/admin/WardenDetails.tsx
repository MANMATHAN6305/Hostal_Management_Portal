import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function WardenDetails() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWardenDetails();
  }, [id]);

  const fetchWardenDetails = async () => {
    try {
      const response = await adminApi.getWardenById(parseInt(id!));
      setData(response);
    } catch (error) {
      console.error('Failed to fetch warden details:', error);
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

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Warden not found</p>
        <Link to="/wardens">
          <Button className="mt-4" variant="outline">Back to Wardens</Button>
        </Link>
      </div>
    );
  }

  const { warden, hostelStats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{warden.fullName}</h1>
          <p className="text-gray-600 mt-1">Warden Profile & Hostel Management</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/wardens/edit/${warden.id}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              ✏️ Edit Warden
            </Button>
          </Link>
          <Link to="/wardens">
            <Button variant="outline">← Back</Button>
          </Link>
        </div>
      </div>

      {/* Warden Information */}
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">👤 Warden Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="text-lg font-medium text-gray-900">{warden.fullName}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-lg font-medium text-gray-900">{warden.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="text-lg font-medium text-gray-900">{warden.phone || 'Not provided'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              {warden.isActive ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  ✓ Active
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                  ✗ Inactive
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hostel Assignment */}
      {hostelStats ? (
        <>
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🏨 Assigned Hostel</h2>
              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-emerald-900">{hostelStats.hostel.name}</h3>
                <p className="text-emerald-700 mt-1">Block: {hostelStats.hostel.blockCode || 'N/A'} | Gender: {hostelStats.hostel.gender}</p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Rooms</p>
                  <p className="text-4xl font-bold text-blue-600">{hostelStats.totalRooms}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Occupied Rooms</p>
                  <p className="text-4xl font-bold text-green-600">{hostelStats.occupiedRooms}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Available Rooms</p>
                  <p className="text-4xl font-bold text-orange-600">{hostelStats.availableRooms}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Students</p>
                  <p className="text-4xl font-bold text-purple-600">{hostelStats.totalStudents}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Room Details */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Room Details</h2>
              
              {hostelStats.rooms.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No rooms in this hostel</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {hostelStats.rooms.map((room: any) => (
                        <tr key={room.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{room.roomNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{room.capacity}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{room.currentOccupancy}</td>
                          <td className="px-4 py-3 text-sm">
                            {room.status === 'Full' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Full
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Available
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {room.students.length > 0 ? (
                              <div className="space-y-1">
                                {room.students.map((student: any, idx: number) => (
                                  <div key={idx} className="text-xs">
                                    {student.studentId} - {student.firstName} {student.lastName}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No students</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-2">🏢 No Hostel Assigned</p>
              <p className="text-gray-500 text-sm">This warden is not currently assigned to any hostel.</p>
              <Link to={`/wardens/edit/${warden.id}`}>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  Assign Hostel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
