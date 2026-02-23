import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { allocationsApi, roomsApi, studentsApi } from '@/lib/api';
import type { Room, Student } from '@/types';

export default function EditAllocation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({
    studentId: '',
    roomId: '',
    academicYear: '',
    semester: '',
    status: '',
    allocationDate: '',
    endDate: '',
    specialRequests: ''
  });

  useEffect(() => {
    if (id) {
      fetchAllData(parseInt(id));
    }
  }, [id]);

  const fetchAllData = async (allocationId: number) => {
    try {
      const [allocationData, roomsData, studentsData] = await Promise.all([
        allocationsApi.getById(allocationId),
        roomsApi.getAll(),
        studentsApi.getAll()
      ]);
      
      setFormData({
        studentId: allocationData.studentId?.toString() || '',
        roomId: allocationData.roomId?.toString() || '',
        academicYear: allocationData.academicYear || '',
        semester: allocationData.semester || '',
        status: allocationData.status || '',
        allocationDate: allocationData.allocationDate?.split('T')[0] || '',
        endDate: allocationData.endDate?.split('T')[0] || '',
        specialRequests: allocationData.specialRequests || ''
      });

      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Failed to fetch allocation data');
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);
    
    try {
      await allocationsApi.update(parseInt(id), {
        studentId: parseInt(formData.studentId),
        roomId: parseInt(formData.roomId),
        academicYear: formData.academicYear,
        semester: formData.semester,
        status: formData.status,
        allocationDate: formData.allocationDate,
        endDate: formData.endDate,
        specialRequests: formData.specialRequests
      });
      navigate('/allocations');
    } catch (error) {
      console.error('Failed to update allocation:', error);
      alert('Failed to update allocation');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student *</label>
              <select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="">Select a student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} - {student.studentId} ({student.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room *</label>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="">Select a room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} - {room.blockName} ({room.roomType}, {room.capacity} beds)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year *</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">Select year</option>
                  {academicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">Select semester</option>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">Select status</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="VACATED">Vacated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allocation Date *</label>
                <input
                  type="date"
                  name="allocationDate"
                  value={formData.allocationDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Special Requests</label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Any special requests..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/allocations')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
