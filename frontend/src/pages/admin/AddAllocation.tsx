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
  blockCode?: string | null;
  gender: 'MALE' | 'FEMALE' | 'COED';
  totalRooms?: number;
};

type HostelOption = {
  value: string;
  hostelId: number | null;
  name: string;
  label: string;
  availableRooms: number;
  availableBeds: number;
};

const normalizeText = (value: string | null | undefined) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const stripBlockWord = (value: string | null | undefined) =>
  String(value || '')
    .replace(/\bblock\b/gi, '')
    .trim();

const getFreeBeds = (room: Room) =>
  Math.max(0, Number(room.capacity || 0) - Number(room.occupied || 0));

const semesterOptions = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function AddAllocation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [hostels, setHostels] = useState<ApiHostel[]>([]);
  const [autoResult, setAutoResult] = useState<null | {
    strategy: string;
    allocatedCount: number;
    unallocatedCount: number;
    totalRequested: number;
    message?: string;
    unallocated?: Array<{ studentName?: string; reason?: string }>;
  }>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    gender: '',
    hostelId: '',
    roomId: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    semester: '1',
    status: 'ACTIVE',
    allocationDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
    specialRequests: ''
  });
  const [autoFormData, setAutoFormData] = useState({
    strategy: 'AUTO' as 'AUTO' | 'RANDOM',
    limit: 100,
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    semester: '1',
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

      setRooms(roomsList);
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
        studentId: parseInt(formData.studentId, 10),
        roomId: parseInt(formData.roomId, 10),
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAutoFormData((prev) => ({
      ...prev,
      [name]: name === 'limit' ? Math.max(1, Number(value) || 1) : value
    }));
  };

  const handleAutoAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAutoLoading(true);
    setAutoResult(null);

    try {
      const result = await allocationsApi.autoAllocate({
        strategy: autoFormData.strategy,
        limit: Number(autoFormData.limit),
        academicYear: autoFormData.academicYear,
        semester: autoFormData.semester,
        allocationDate: autoFormData.allocationDate,
        endDate: autoFormData.endDate,
        specialRequests: autoFormData.specialRequests || undefined
      });

      setAutoResult(result);
      await fetchData();
      alert(result?.message || `Allocated ${result?.allocatedCount || 0} students successfully.`);
    } catch (error: any) {
      console.error('Failed to run auto allocation:', error);
      alert(error?.response?.data?.message || error?.message || 'Failed to run auto allocation');
    } finally {
      setAutoLoading(false);
    }
  };

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === parseInt(formData.studentId, 10)),
    [formData.studentId, students]
  );

  const selectedStudentGender = useMemo(() => {
    if (!selectedStudent) return '';
    if (selectedStudent.gender === 'MALE' || selectedStudent.gender === 'FEMALE') {
      return selectedStudent.gender;
    }
    return '';
  }, [selectedStudent]);

  useEffect(() => {
    setFormData((prev) => {
      if (prev.gender === selectedStudentGender) return prev;
      return { ...prev, gender: selectedStudentGender, hostelId: '', roomId: '' };
    });
  }, [selectedStudentGender]);

  const availableRooms = useMemo(
    () =>
      rooms.filter(
        (room) => room.status !== 'MAINTENANCE' && getFreeBeds(room) > 0
      ),
    [rooms]
  );

  const resolveRoomHostel = useMemo(() => {
    const hostelsById = new Map(hostels.map((h) => [String(h.id), h]));
    const hostelsByCode = new Map(
      hostels
        .filter((h) => h.blockCode)
        .map((h) => [normalizeText(h.blockCode), h])
    );
    const hostelsByName = hostels.map((h) => ({
      hostel: h,
      fullNameKey: normalizeText(h.name),
      coreNameKey: normalizeText(stripBlockWord(h.name))
    }));

    return (room: Room) => {
      const roomHostelId = room.hostelId !== undefined && room.hostelId !== null ? String(room.hostelId) : '';
      if (roomHostelId && hostelsById.has(roomHostelId)) {
        const hostel = hostelsById.get(roomHostelId)!;
        return { key: `id:${hostel.id}`, hostelId: hostel.id, name: hostel.name };
      }

      const roomCode = normalizeText((room.roomNumber || '').split('-')[0]);
      if (roomCode && hostelsByCode.has(roomCode)) {
        const hostel = hostelsByCode.get(roomCode)!;
        return { key: `id:${hostel.id}`, hostelId: hostel.id, name: hostel.name };
      }

      const roomBlockKey = normalizeText(room.blockName);
      if (roomBlockKey) {
        const matchedByName = hostelsByName.find(
          ({ fullNameKey, coreNameKey }) =>
            roomBlockKey === fullNameKey ||
            roomBlockKey === coreNameKey ||
            roomBlockKey.includes(coreNameKey) ||
            coreNameKey.includes(roomBlockKey)
        );

        if (matchedByName) {
          return {
            key: `id:${matchedByName.hostel.id}`,
            hostelId: matchedByName.hostel.id,
            name: matchedByName.hostel.name
          };
        }
      }

      const fallbackName = room.blockName || (room.roomNumber || '').split('-')[0] || 'Unknown Hostel';
      const fallbackKey = roomBlockKey ? `block:${roomBlockKey}` : `room:${room.id}`;
      return { key: fallbackKey, hostelId: null, name: fallbackName };
    };
  }, [hostels]);

  const hostelOptions: HostelOption[] = useMemo(() => {
    if (!formData.gender) return [];

    const grouped = new Map<string, HostelOption>();

    for (const room of availableRooms) {
      if (room.gender !== formData.gender) continue;

      const resolved = resolveRoomHostel(room);
      const freeBeds = getFreeBeds(room);

      if (!grouped.has(resolved.key)) {
        grouped.set(resolved.key, {
          value: resolved.key,
          hostelId: resolved.hostelId,
          name: resolved.name,
          label: resolved.name,
          availableRooms: 0,
          availableBeds: 0
        });
      }

      const current = grouped.get(resolved.key)!;
      current.availableRooms += 1;
      current.availableBeds += freeBeds;
    }

    return Array.from(grouped.values())
      .map((option) => ({
        ...option,
        label: `${option.name} (${option.availableRooms} rooms, ${option.availableBeds} beds available)`
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableRooms, formData.gender, resolveRoomHostel]);

  const selectedHostel = useMemo(
    () => hostelOptions.find((h) => h.value === formData.hostelId),
    [formData.hostelId, hostelOptions]
  );

  const filteredRooms = useMemo(() => {
    if (!formData.gender || !formData.hostelId) return [];

    return availableRooms
      .filter((room) => room.gender === formData.gender)
      .filter((room) => resolveRoomHostel(room).key === formData.hostelId);
  }, [availableRooms, formData.gender, formData.hostelId, resolveRoomHostel]);

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
    `${currentYear - 1}-${currentYear}`
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bulk Student Allocation (Auto / Random)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAutoAllocate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allocation Strategy *</label>
                <select
                  name="strategy"
                  value={autoFormData.strategy}
                  onChange={handleAutoChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="AUTO">Auto (Best Fit)</option>
                  <option value="RANDOM">Random</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Limit *</label>
                <input
                  type="number"
                  name="limit"
                  min={1}
                  max={500}
                  value={autoFormData.limit}
                  onChange={handleAutoChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year *</label>
                <select
                  name="academicYear"
                  value={autoFormData.academicYear}
                  onChange={handleAutoChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester *</label>
                <select
                  name="semester"
                  value={autoFormData.semester}
                  onChange={handleAutoChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Allocation Date *</label>
                <input
                  type="date"
                  name="allocationDate"
                  value={autoFormData.allocationDate}
                  onChange={handleAutoChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={autoFormData.endDate}
                  onChange={handleAutoChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Special Requests (applies to all)</label>
              <textarea
                name="specialRequests"
                value={autoFormData.specialRequests}
                onChange={handleAutoChange}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Optional note for all generated allocations"
              />
            </div>

            <div className="flex gap-4 pt-2 items-center">
              <Button type="submit" disabled={autoLoading}>
                {autoLoading ? 'Allocating...' : 'Run Bulk Allocation'}
              </Button>
              <span className="text-xs text-slate-500">
                AUTO = best-fit room assignment, RANDOM = randomized room selection.
              </span>
            </div>
          </form>

          {autoResult && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">{autoResult.message || 'Bulk allocation completed.'}</p>
              <p className="text-sm text-slate-700 mt-1">
                Requested: {autoResult.totalRequested} • Allocated: {autoResult.allocatedCount} • Unallocated: {autoResult.unallocatedCount}
              </p>
              {!!autoResult.unallocated?.length && (
                <div className="mt-2 text-xs text-amber-700">
                  {autoResult.unallocated.slice(0, 5).map((entry, index) => (
                    <p key={index}>• {entry.studentName || 'Student'}: {entry.reason || 'Not allocated'}</p>
                  ))}
                  {autoResult.unallocated.length > 5 && <p>• +{autoResult.unallocated.length - 5} more not allocated</p>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} - {student.studentId} ({student.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hostel *</label>
              <Select
                name="hostelId"
                value={selectedHostel ? { value: selectedHostel.value, label: selectedHostel.label } : null}
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    hostelId: option ? String(option.value) : '',
                    roomId: ''
                  }))
                }
                options={hostelOptions.map((hostel) => ({
                  value: hostel.value,
                  label: hostel.label
                }))}
                isClearable
                isSearchable
                placeholder={formData.studentId ? 'Search hostel...' : 'Select student first'}
                classNamePrefix="react-select"
                isDisabled={!formData.gender}
              />
              {formData.studentId && formData.gender && hostelOptions.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  No hostels with available rooms found for this student's gender.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room *</label>
              <Select
                name="roomId"
                value={
                  filteredRooms
                    .map((room) => ({
                      value: room.id,
                      label: `Room ${room.roomNumber} - ${room.blockName} (${room.roomType}, ${getFreeBeds(room)} of ${room.capacity} beds available)`
                    }))
                    .find((opt) => opt.value === parseInt(formData.roomId, 10)) || null
                }
                onChange={(option) =>
                  setFormData((prev) => ({ ...prev, roomId: option ? option.value.toString() : '' }))
                }
                options={filteredRooms.map((room) => ({
                  value: room.id,
                  label: `Room ${room.roomNumber} - ${room.blockName} (${room.roomType}, ${getFreeBeds(room)} of ${room.capacity} beds available)`
                }))}
                isClearable
                isSearchable
                placeholder={selectedHostel ? 'Search room...' : 'Select hostel first'}
                classNamePrefix="react-select"
                isDisabled={!selectedHostel}
              />
              {selectedHostel && filteredRooms.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  No rooms with available beds found in this hostel.
                </p>
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
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
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
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
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
