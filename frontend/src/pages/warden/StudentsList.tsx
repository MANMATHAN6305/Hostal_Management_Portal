import { useEffect, useState } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studentsApi, allocationsApi } from '@/lib/api';

interface StudentWithRoom {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  phone?: string;
  email?: string;
  roomNumber?: string;
  hostelName?: string;
  status?: string;
}

const statusColors: Record<string, string> = {
  'ACTIVE': 'bg-green-100 text-green-800',
  'ALLOCATED': 'bg-blue-100 text-blue-800',
  'PENDING': 'bg-yellow-100 text-yellow-800',
  'INACTIVE': 'bg-gray-100 text-gray-800',
  'NOT_ALLOCATED': 'bg-orange-100 text-orange-800'
};

export default function StudentsList() {
  const [students, setStudents] = useState<StudentWithRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const [studentsRes, allocationsRes] = await Promise.all([
          studentsApi.getAll(),
          allocationsApi.getAll()
        ]);

        const studentsList = Array.isArray(studentsRes) ? studentsRes : [];
        const allocationsList = Array.isArray(allocationsRes) ? allocationsRes : [];

        // Create a map of student allocations (prefer active allocation per student)
        const allocationMap = new Map<number, any>();
        allocationsList.forEach((allocation: any) => {
          const studentId = Number(allocation?.studentId || allocation?.StudentId);
          if (!studentId || Number.isNaN(studentId)) {
            return;
          }

          const normalizedAllocation = {
            ...allocation,
            status: String(allocation?.status || '').toUpperCase(),
            roomNumber: allocation?.roomNumber || allocation?.Room?.roomNumber || '',
            blockName:
              allocation?.blockName ||
              allocation?.hostelName ||
              allocation?.Hostel?.name ||
              allocation?.Room?.blockName ||
              ''
          };

          const existing = allocationMap.get(studentId);
          if (!existing) {
            allocationMap.set(studentId, normalizedAllocation);
            return;
          }

          // Prefer ACTIVE allocation if there are multiple rows for the same student
          const existingIsActive = existing.status === 'ACTIVE';
          const currentIsActive = normalizedAllocation.status === 'ACTIVE';
          if (currentIsActive && !existingIsActive) {
            allocationMap.set(studentId, normalizedAllocation);
          }
        });

        // Enhance students with room information
        const enhancedStudents = studentsList.map((student: any) => {
          const allocation = allocationMap.get(student.id);
          const hasActiveAllocation =
            allocation?.status
              ? allocation.status === 'ACTIVE'
              : Boolean(allocation?.roomNumber);

          return {
            id: student.id,
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            studentId: student.studentId || '',
            phone: student.phone,
            email: student.email,
            roomNumber: hasActiveAllocation ? allocation?.roomNumber || 'Not Allocated' : 'Not Allocated',
            hostelName: hasActiveAllocation ? allocation?.blockName || 'N/A' : 'N/A',
            status: hasActiveAllocation ? 'ALLOCATED' : 'NOT_ALLOCATED'
          };
        });

        setStudents(enhancedStudents);
        setError('');
      } catch (e: any) {
        setError(e?.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Filter students based on search term and status
  const filteredStudents = students.filter((student) => {
    const searchMatch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.roomNumber && student.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusMatch = filterStatus === '' || student.status === filterStatus;

    return searchMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const allocatedCount = students.filter(s => s.status === 'ALLOCATED').length;
  const notAllocatedCount = students.filter(s => s.status === 'NOT_ALLOCATED').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Students List</h1>
        <p className="text-gray-600 mt-1">Manage and view all student allocations</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-6 py-4 shadow-sm">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{students.length}</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Allocated</p>
                <p className="text-3xl font-bold text-green-600">{allocatedCount}</p>
              </div>
              <span className="text-3xl">✓</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Allocation</p>
                <p className="text-3xl font-bold text-orange-600">{notAllocatedCount}</p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Search Students</label>
              <input
                type="text"
                placeholder="Search by name, roll number, or room..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Filter by Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="NOT_ALLOCATED">Not Allocated</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table/List */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No students found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Roll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Room Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Hostel</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                        {student.roomNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {student.hostelName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="space-y-0.5">
                          {student.email && <p>{student.email}</p>}
                          {student.phone && <p>{student.phone}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[student.status || ''] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-gray-600">Roll: {student.studentId}</p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        statusColors[student.status || ''] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Room</p>
                        <p className="font-semibold text-gray-900">{student.roomNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Hostel</p>
                        <p className="font-semibold text-gray-900">{student.hostelName}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 mb-1">Contact</p>
                        {student.email && <p className="text-gray-900 text-xs">{student.email}</p>}
                        {student.phone && <p className="text-gray-900 text-xs">{student.phone}</p>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filteredStudents.length}</span> of{' '}
        <span className="font-semibold text-gray-900">{students.length}</span> students
      </div>
    </div>
  );
}
