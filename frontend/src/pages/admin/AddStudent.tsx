import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { studentsApi } from '@/lib/api';

export default function AddStudent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await studentsApi.create({
        ...formData,
        year: parseInt(formData.year),
      });
      alert('Student added successfully!');
      navigate('/students');
    } catch (error: any) {
      alert(error.message || 'Failed to add student. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/students" className="text-emerald-600 hover:text-emerald-500 flex items-center gap-2">
          ← Back to Students
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Student ID *</label>
                <Input type="text" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="e.g., 2024CSE001" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" required>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                <Input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                <Input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="student@college.edu" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
                <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" required>
                  <option value="">Select Department</option>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="MECH">Mechanical (MECH)</option>
                  <option value="CIVIL">Civil (CIVIL)</option>
                  <option value="EEE">Electrical (EEE)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Year *</label>
                <select name="year" value={formData.year} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" required>
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
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
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
                <Input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} placeholder="Parent/Guardian name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Guardian Phone</label>
                <Input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} placeholder="Guardian phone number" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Full address" />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Student'}</Button>
              <Link to="/students"><Button type="button" variant="secondary">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
