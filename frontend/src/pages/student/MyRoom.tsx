import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { studentApi } from '@/lib/api';

interface RoomData {
  allocated: boolean;
  room: {
    id: number;
    roomNumber: string;
    roomType: string;
    floorNumber: number;
    blockName: string;
    status: string;
    amenities: string;
    description: string;
  } | null;
  allocation: {
    id: number;
    academicYear: string;
    semester: string;
    status: string;
    allocationDate: string;
    endDate: string;
  } | null;
}

export default function MyRoom() {
  const [data, setData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoomData();
  }, []);

  const fetchRoomData = async () => {
    try {
      const response = await studentApi.getRoom();
      if (response.success) {
        setData(response);
      } else {
        setError(response.message || 'Failed to load room details');
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

  if (!data?.allocated || !data.room) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Room</h1>
          <p className="text-slate-600">View your allocated room details</p>
        </div>
        
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h2 className="text-xl font-semibold text-slate-700">No Room Allocated</h2>
              <p className="text-slate-500 mt-2">You don't have a room allocated yet.</p>
              <p className="text-slate-400 text-sm mt-1">Please contact the hostel administration office.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const amenitiesList = data.room.amenities ? data.room.amenities.split(',').map(a => a.trim()) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Room</h1>
        <p className="text-slate-600">View your allocated room details</p>
      </div>

      {/* Room Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Room Number</p>
            <h2 className="text-3xl font-bold">{data.room.roomNumber}</h2>
            <p className="text-blue-100 mt-2">Block {data.room.blockName} • Floor {data.room.floorNumber}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.allocation?.status === 'ACTIVE' 
                ? 'bg-green-400 text-green-900' 
                : 'bg-yellow-400 text-yellow-900'
            }`}>
              {data.allocation?.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Details */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>🛏️</span> Room Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-500 text-sm">Room Type</p>
                  <p className="font-semibold text-slate-800">{data.room.roomType}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-500 text-sm">Block Name</p>
                  <p className="font-semibold text-slate-800">{data.room.blockName}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-500 text-sm">Floor Number</p>
                  <p className="font-semibold text-slate-800">Floor {data.room.floorNumber}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-500 text-sm">Room Status</p>
                  <p className="font-semibold text-slate-800">{data.room.status}</p>
                </div>
              </div>
              
              {data.room.description && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Description</p>
                  <p className="text-slate-700">{data.room.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Allocation Details */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>📅</span> Allocation Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-emerald-600 text-sm">Academic Year</p>
                  <p className="font-semibold text-emerald-800">{data.allocation?.academicYear || 'N/A'}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-emerald-600 text-sm">Semester</p>
                  <p className="font-semibold text-emerald-800">{data.allocation?.semester || 'N/A'}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-600 text-sm">Allocation Date</p>
                  <p className="font-semibold text-blue-800">
                    {data.allocation?.allocationDate 
                      ? new Date(data.allocation.allocationDate).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-600 text-sm">End Date</p>
                  <p className="font-semibold text-blue-800">
                    {data.allocation?.endDate 
                      ? new Date(data.allocation.endDate).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Amenities */}
      {amenitiesList.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>✨</span> Room Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((amenity, index) => (
                <span 
                  key={index}
                  className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
