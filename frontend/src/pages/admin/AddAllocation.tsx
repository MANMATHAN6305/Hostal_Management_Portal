import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { allocationsApi, hostelsApi, roomsApi, studentsApi } from '@/lib/api';
import type { Room, Student } from '@/types';

type ApiHostel = {
  id: number;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'COED';
};

type HostelOption = {
  value: string;
  name: string;
};

export default function AddAllocation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [hostels, setHostels] = useState<ApiHostel[]>([]);
  const [formData, setFormData] = useState({
    studentId: '',
    gender: '',
    hostelId: '',
    roomId: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    semester: 'Fall',
    status: 'ACTIVE',
    allocationDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
    specialRequests: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsData, studentsData, hostelsData] = await Promise.allSettled([
        roomsApi.getAll(),
        studentsApi.getAll(),
        hostelsApi.getAll()
      ]);

      const roomsList =
        roomsData.status === 'fulfilled' && Array.isArray(roomsData.value)
          ? roomsData.value
          : [];
      const studentsList =
        studentsData.status === 'fulfilled' && Array.isArray(studentsData.value)
          ? studentsData.value
          : [];
      const hostelsList =
        hostelsData.status === 'fulfilled' && Array.isArray(hostelsData.value?.hostels)
          ? hostelsData.value.hostels
          : [];

      setRooms(roomsList.filter((r: Room) =>
        r.status !== 'MAINTENANCE' && (r.occupied || 0) < (r.capacity || 1)
      ));
      setStudents(studentsList);
      setHostels(hostelsList);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.gender || !formData.hostelId || !formData.roomId) {
      alert('Please select student, hostel, and room. Student must have gender (MALE/FEMALE).');
      return;
    }
    setLoading(true);
    
    try {
      await allocationsApi.create({
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
    } catch (error: any) {
      console.error('Failed to create allocation:', error);
      alert(error?.response?.data?.message || error?.message || 'Failed to create allocation');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === parseInt(formData.studentId)),
    [formData.studentId, students]
  );

  const selectedStudentGender = useMemo(() => {
    if (!selectedStudent) return '';
    if (selectedStudent.gender === 'MALE' || selectedStudent.gender === 'FEMALE') {
      return selectedStudent.gender;
    }
    return '';
  }, [selectedStudent]);

  // Auto derive gender from selected student
  useEffect(() => {
    setFormData((prev) => {
      if (prev.gender === selectedStudentGender) return prev;
      return { ...prev, gender: selectedStudentGender, hostelId: '', roomId: '' };
    });
  }, [selectedStudentGender]);

  const filteredHostels: HostelOption[] = useMemo(() => {
    if (!formData.gender) return [];

    if (hostels.length > 0) {
      return hostels
        .filter((hostel) => hostel.gender === formData.gender || hostel.gender === 'COED')
        .map((hostel) => ({
          value: `hostel-${hostel.id}`,
          name: hostel.name
        }));
    }

    const names = Array.from(
      new Set(
        rooms
          .filter((room) => room.gender === formData.gender)
          .map((room) => room.blockName)
      )
    );
    return names.map((name) => ({ value: `block-${name}`, name }));
  }, [formData.gender, hostels, rooms]);

  const selectedHostel = filteredHostels.find((hostel) => hostel.value === formData.hostelId);

  const filteredRooms = rooms.filter((room) => {
    const matchesGender = room.gender === formData.gender;
    const matchesHostel = !selectedHostel || room.blockName === selectedHostel.name;
    return matchesGender && matchesHostel;
  });

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
    `${currentYear - 1}-${currentYear}`
  ];


  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Allocation</CardTitle>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Student Gender</label>
              <input
                type="text"
                value={formData.gender || 'Not Set'}
                readOnly
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-gray-100 text-slate-700"
              />
              {formData.studentId && !formData.gender && (
                <p className="text-sm text-amber-600 mt-1">
                  Selected student gender is not set. Please update the student profile first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hostel *</label>
              <Select
                name="hostelId"
                value={selectedHostel ? { value: selectedHostel.value, label: selectedHostel.name } : null}
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    hostelId: option ? option.value : '',
                    roomId: ''
                  }))
                }
                options={filteredHostels.map((hostel) => ({
                  value: hostel.value,
                  label: hostel.name
                }))}
                isClearable
                isSearchable
                placeholder={formData.studentId ? 'Search hostel...' : 'Select student first'}
                classNamePrefix="react-select"
                isDisabled={!formData.gender}
              />
              {formData.studentId && formData.gender && filteredHostels.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">No hostels available for this gender.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room *</label>
              <Select
                name="roomId"
                value={filteredRooms
                  .map((room) => ({
                    value: room.id,
                    label: `Room ${room.roomNumber} - ${room.blockName} (${room.roomType}, ${(room.capacity || 0) - (room.occupied || 0)} of ${room.capacity} beds available)`
                  }))
                  .find((opt) => opt.value === parseInt(formData.roomId)) || null}
                onChange={option => setFormData(prev => ({ ...prev, roomId: option ? option.value.toString() : '' }))}
                options={filteredRooms.map((room) => ({
                  value: room.id,
                  label: `Room ${room.roomNumber} - ${room.blockName} (${room.roomType}, ${(room.capacity || 0) - (room.occupied || 0)} of ${room.capacity} beds available)`
                }))}
                isClearable
                isSearchable
                placeholder={selectedHostel ? 'Search room...' : 'Select hostel first'}
                classNamePrefix="react-select"
                isDisabled={!selectedHostel}
              />
              {selectedHostel && filteredRooms.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">No rooms with available beds found for this gender.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year *</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
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
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
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
                {loading ? 'Creating...' : 'Create Allocation'}
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
