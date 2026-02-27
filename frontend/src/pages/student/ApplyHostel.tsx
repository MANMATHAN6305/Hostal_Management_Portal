import { useEffect, useState } from 'react';
import { studentApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type ApplicationForm = {
  fullName: string;
  registerNumber: string;
  department: string;
  yearOfStudy: '1' | '2' | '3' | '4';
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  studentEmail: string;
  mobileNumber: string;
  guardianName: string;
  relationship: string;
  guardianContactNumber: string;
  guardianAddress: string;
};

const initialForm: ApplicationForm = {
  fullName: '',
  registerNumber: '',
  department: '',
  yearOfStudy: '1',
  gender: 'MALE',
  dateOfBirth: '',
  studentEmail: '',
  mobileNumber: '',
  guardianName: '',
  relationship: '',
  guardianContactNumber: '',
  guardianAddress: ''
};

export default function ApplyHostel() {
  const [applications, setApplications] = useState<any[]>([]);
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [appsRes, profileRes] = await Promise.all([
      studentApi.getApplications(),
      studentApi.getProfile()
    ]);

    setApplications(appsRes.applications || []);

    if (profileRes?.student) {
      const student = profileRes.student;
      setForm((prev) => ({
        ...prev,
        fullName: [student.firstName, student.lastName].filter(Boolean).join(' ').trim() || prev.fullName,
        registerNumber: student.studentId || prev.registerNumber,
        department: student.department || prev.department,
        yearOfStudy: student.year ? String(student.year) as '1' | '2' | '3' | '4' : prev.yearOfStudy,
        gender: student.gender === 'FEMALE' ? 'FEMALE' : student.gender === 'OTHER' ? 'OTHER' : 'MALE',
        dateOfBirth: student.dateOfBirth || prev.dateOfBirth,
        studentEmail: student.email || prev.studentEmail,
        mobileNumber: student.phone || prev.mobileNumber,
        guardianName: student.guardianName || prev.guardianName,
        guardianContactNumber: student.guardianPhone || prev.guardianContactNumber,
        guardianAddress: student.address || prev.guardianAddress
      }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (key: keyof ApplicationForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setError('');
    setMessage('');

    const required: Array<keyof ApplicationForm> = [
      'fullName',
      'registerNumber',
      'department',
      'yearOfStudy',
      'gender',
      'dateOfBirth',
      'studentEmail',
      'mobileNumber',
      'guardianName',
      'relationship',
      'guardianContactNumber',
      'guardianAddress'
    ];

    const missing = required.filter((k) => !String(form[k]).trim());
    if (missing.length > 0) {
      setError(`Please fill all required fields: ${missing.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      await studentApi.submitApplication({
        fullName: form.fullName.trim(),
        registerNumber: form.registerNumber.trim(),
        department: form.department.trim(),
        yearOfStudy: form.yearOfStudy,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        studentEmail: form.studentEmail.trim(),
        mobileNumber: form.mobileNumber.trim(),
        guardianName: form.guardianName.trim(),
        relationship: form.relationship.trim(),
        guardianContactNumber: form.guardianContactNumber.trim(),
        guardianAddress: form.guardianAddress.trim()
      });
      setMessage('Hostel application submitted successfully.');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Apply Hostel</h1>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded px-4 py-3">{error}</div>}
      {message && <div className="bg-green-50 text-green-700 border border-green-200 rounded px-4 py-3">{message}</div>}

      <Card>
        <CardContent className="space-y-6">
          <div>
            <h2 className="font-semibold text-lg mb-3">Basic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2" placeholder="Full Name" value={form.fullName} onChange={(e) => onChange('fullName', e.target.value)} />
              <input className="border rounded px-3 py-2" placeholder="Register Number / Roll Number" value={form.registerNumber} onChange={(e) => onChange('registerNumber', e.target.value)} />
              <input className="border rounded px-3 py-2" placeholder="Department" value={form.department} onChange={(e) => onChange('department', e.target.value)} />
              <select className="border rounded px-3 py-2" value={form.yearOfStudy} onChange={(e) => onChange('yearOfStudy', e.target.value)}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <select className="border rounded px-3 py-2" value={form.gender} onChange={(e) => onChange('gender', e.target.value)}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <input type="date" className="border rounded px-3 py-2" value={form.dateOfBirth} onChange={(e) => onChange('dateOfBirth', e.target.value)} />
              <input type="email" className="border rounded px-3 py-2" placeholder="Student Email ID" value={form.studentEmail} onChange={(e) => onChange('studentEmail', e.target.value)} />
              <input className="border rounded px-3 py-2" placeholder="Mobile Number" value={form.mobileNumber} onChange={(e) => onChange('mobileNumber', e.target.value)} />
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-3">Parent / Guardian Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2" placeholder="Parent / Guardian Name" value={form.guardianName} onChange={(e) => onChange('guardianName', e.target.value)} />
              <input className="border rounded px-3 py-2" placeholder="Relationship" value={form.relationship} onChange={(e) => onChange('relationship', e.target.value)} />
              <input className="border rounded px-3 py-2" placeholder="Contact Number" value={form.guardianContactNumber} onChange={(e) => onChange('guardianContactNumber', e.target.value)} />
              <textarea className="border rounded px-3 py-2" placeholder="Address" value={form.guardianAddress} onChange={(e) => onChange('guardianAddress', e.target.value)} />
            </div>
          </div>

          <Button onClick={submit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-semibold mb-2">My Submitted Applications</h2>
          <div className="space-y-3">
            {applications.map((a) => (
              <div key={a.id} className="border rounded p-3 text-sm">
                <div className="flex justify-between">
                  <span>{a.fullName} - {a.registerNumber}</span>
                  <span className="font-semibold">{a.status}</span>
                </div>
                <p className="text-gray-600">{a.studentEmail} | {a.mobileNumber}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
