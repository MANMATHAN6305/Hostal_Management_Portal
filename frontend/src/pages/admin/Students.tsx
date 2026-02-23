import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { studentsApi } from '@/lib/api';
import type { Student } from '@/types';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(students.filter(student => 
        student.studentId?.toLowerCase().includes(query) ||
        student.firstName?.toLowerCase().includes(query) ||
        student.lastName?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.department?.toLowerCase().includes(query) ||
        student.phone?.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      const data = await studentsApi.getAll();
      const studentData = Array.isArray(data) ? data : [];
      setStudents(studentData);
      setFilteredStudents(studentData);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await studentsApi.delete(id);
        setStudents(students.filter(student => student.id !== id));
      } catch (error) {
        console.error('Failed to delete student:', error);
        alert('Failed to delete student');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-slate-600">Manage hostel students</p>
        </div>
        <Link to="/students/add">
          <Button>+ Add Student</Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by Student ID, Name, Email, Department, or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-slate-500 mt-2">
              Found {filteredStudents.length} of {students.length} students
            </p>
          )}
        </CardContent>
      </Card>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No students found. Add your first student to get started.</p>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No students match your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Student ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Year</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Gender</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{student.studentId}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800">{student.department}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{student.year}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{student.phone}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{student.gender}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link to={`/students/edit/${student.id}`}>
                            <Button variant="secondary" size="sm">Edit</Button>
                          </Link>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(student.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
