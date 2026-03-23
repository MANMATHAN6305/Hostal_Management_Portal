import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { studentsApi } from '@/lib/api';
import { DEPARTMENT_OPTIONS, DEPARTMENT_VALUES } from '@/data/departments';

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    year: '',
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    bloodGroup: '',
    gender: 'MALE',
  });

  useEffect(() => {
    if (id) fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      const student = await studentsApi.getById(Number(id));
      setFormData({
        studentId: student.studentId || '',
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        department: student.department || '',
        year: student.year?.toString() || '',
        dateOfBirth: student.dateOfBirth || '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        bloodGroup: student.bloodGroup || '',
        gender: student.gender || 'MALE',
      });
    } catch (error) {
      console.error('Failed to fetch student:', error);
      alert('Failed to load student data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'phone' || name === 'guardianPhone') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '').slice(0, 10) });
      return;
    }

    if (name === 'department') {
      setFormData({ ...formData, [name]: value.toUpperCase() });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(formData.phone)) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }

    if (formData.guardianPhone && !/^\d{10}$/.test(formData.guardianPhone)) {
      alert('Guardian phone number must be exactly 10 digits.');
      return;
    }

    if (!DEPARTMENT_VALUES.includes(formData.department as any)) {
      alert('Please select a valid department.');
      return;
    }

    setLoading(true);

    try {
      await studentsApi.update(Number(id), {
        ...formData,
        year: parseInt(formData.year),
      });
      alert('Student updated successfully!');
      navigate('/students');
    } catch (error) {
      alert('Failed to update student.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/students" className="text-emerald-600 hover:text-emerald-500 flex items-center gap-2">
          ← Back to Students
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Student</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Student ID *</label>
                <Input type="text" name="studentId" value={formData.studentId} onChange={handleChange} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                <Input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                <Input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
                <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} maxLength={10} pattern="[0-9]{10}" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required>
                  <option value="">Select Department</option>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Year *</label>
                <select name="year" value={formData.year} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required>
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Guardian Name</label>
                <Input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Guardian Phone</label>
                <Input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} maxLength={10} pattern="[0-9]{10}" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
              <Link to="/students"><Button type="button" variant="secondary">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
