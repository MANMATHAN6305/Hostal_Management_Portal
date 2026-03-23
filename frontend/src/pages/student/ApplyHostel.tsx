import { useEffect, useMemo, useState } from 'react';
import { studentApi } from '@/lib/api';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DEPARTMENT_OPTIONS, DEPARTMENT_VALUES } from '@/data/departments';

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

const normalizeDepartmentValue = (value: string) => {
  const normalized = String(value || '').trim().toUpperCase();
  return DEPARTMENT_VALUES.includes(normalized as any) ? normalized : '';
};

const FormInput = ({ label, value, onChange, type = 'text', placeholder = '', required = false, pattern, maxLength }: any) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      pattern={pattern}
      maxLength={maxLength}
    />
  </div>
);

const FormSelect = ({ label, value, onChange, options, required = false }: any) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white"
      value={value}
      onChange={onChange}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const FormTextarea = ({ label, value, onChange, placeholder = '', required = false }: any) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white resize-none"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={3}
    />
  </div>
);

export default function ApplyHostel() {
  const [applications, setApplications] = useState<any[]>([]);
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const latestApplication = useMemo(() => applications[0] || null, [applications]);

  const applyStudentToForm = (student: any) => {
    setForm((prev) => ({
      ...prev,
      fullName: [student.firstName, student.lastName].filter(Boolean).join(' ').trim() || prev.fullName,
      registerNumber: student.studentId || prev.registerNumber,
      department: normalizeDepartmentValue(student.department) || prev.department,
      yearOfStudy: student.year ? String(student.year) as '1' | '2' | '3' | '4' : prev.yearOfStudy,
      gender: student.gender === 'FEMALE' ? 'FEMALE' : student.gender === 'OTHER' ? 'OTHER' : 'MALE',
      dateOfBirth: student.dateOfBirth || prev.dateOfBirth,
      studentEmail: student.email || prev.studentEmail,
      mobileNumber: student.phone || prev.mobileNumber,
      guardianName: student.guardianName || prev.guardianName,
      guardianContactNumber: student.guardianPhone || prev.guardianContactNumber,
      guardianAddress: student.address || prev.guardianAddress
    }));
  };

  const applyApplicationToForm = (app: any) => {
    setForm({
      fullName: app.fullName || '',
      registerNumber: app.registerNumber || '',
      department: normalizeDepartmentValue(app.department),
      yearOfStudy: app.yearOfStudy || '1',
      gender: app.gender || 'MALE',
      dateOfBirth: app.dateOfBirth || '',
      studentEmail: app.studentEmail || '',
      mobileNumber: app.mobileNumber || '',
      guardianName: app.guardianName || '',
      relationship: app.relationship || '',
      guardianContactNumber: app.guardianContactNumber || '',
      guardianAddress: app.guardianAddress || ''
    });
  };

  const load = async () => {
    try {
      const [appsRes, profileRes] = await Promise.all([
        studentApi.getApplications(),
        studentApi.getProfile()
      ]);

      const apps = appsRes.applications || [];
      setApplications(apps);

      if (apps.length > 0) {
        applyApplicationToForm(apps[0]);
      } else if (profileRes?.student) {
        applyStudentToForm(profileRes.student);
      }
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load application data.');
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

    if (!DEPARTMENT_VALUES.includes(form.department as any)) {
      setError('Please select a valid department from the dropdown.');
      return;
    }

    if (!/^\d{10}$/.test(form.mobileNumber)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!/^\d{10}$/.test(form.guardianContactNumber)) {
      setError('Guardian contact number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      if (latestApplication && isEditing) {
        await studentApi.updateApplication(latestApplication.id, {
          fullName: form.fullName.trim(),
          registerNumber: form.registerNumber.trim(),
          department: normalizeDepartmentValue(form.department),
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
        setMessage('Hostel application updated successfully.');
      } else {
        await studentApi.submitApplication({
          fullName: form.fullName.trim(),
          registerNumber: form.registerNumber.trim(),
          department: normalizeDepartmentValue(form.department),
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
      }

      setIsEditing(false);
      setShowDetails(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Apply for Hostel</h1>
        <p className="text-gray-600 mt-1">Submit or update your hostel application</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-6 py-4 shadow-sm flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>{error}</div>
        </div>
      )}
      {message && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-xl px-6 py-4 shadow-sm flex items-start gap-3">
          <span className="text-xl">✓</span>
          <div>{message}</div>
        </div>
      )}

      {!latestApplication || isEditing ? (
        <Card>
          <div className="border-b border-gray-200 pb-4 mb-6 flex items-center justify-between">
            <CardTitle className="mb-0">
              {latestApplication ? '✏️ Edit Application' : '📋 Application Form'}
            </CardTitle>
            {latestApplication && (
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>

          <CardContent className="space-y-8">
            {/* Student Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">👤 Student Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput 
                  label="Full Name" 
                  value={form.fullName} 
                  onChange={(e: any) => onChange('fullName', e.target.value)} 
                  placeholder="Enter your full name"
                  required
                />
                <FormInput 
                  label="Register / Roll Number" 
                  value={form.registerNumber} 
                  onChange={(e: any) => onChange('registerNumber', e.target.value)} 
                  placeholder="e.g., 2021B123"
                  required
                />
                <FormSelect
                  label="Department"
                  value={form.department}
                  onChange={(e: any) => onChange('department', e.target.value)}
                  options={[
                    { value: '', label: 'Select Department' },
                    ...DEPARTMENT_OPTIONS
                  ]}
                  required
                />
                <FormSelect 
                  label="Year of Study" 
                  value={form.yearOfStudy} 
                  onChange={(e: any) => onChange('yearOfStudy', e.target.value)}
                  options={[
                    { value: '1', label: '1st Year' },
                    { value: '2', label: '2nd Year' },
                    { value: '3', label: '3rd Year' },
                    { value: '4', label: '4th Year' }
                  ]}
                  required
                />
                <FormSelect 
                  label="Gender" 
                  value={form.gender} 
                  onChange={(e: any) => onChange('gender', e.target.value)}
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other' }
                  ]}
                  required
                />
                <FormInput 
                  label="Date of Birth" 
                  type="date"
                  value={form.dateOfBirth} 
                  onChange={(e: any) => onChange('dateOfBirth', e.target.value)} 
                  required
                />
                <FormInput 
                  label="Email Address" 
                  type="email"
                  value={form.studentEmail} 
                  onChange={(e: any) => onChange('studentEmail', e.target.value)} 
                  placeholder="your.email@example.com"
                  required
                />
                <FormInput 
                  label="Mobile Number" 
                  value={form.mobileNumber} 
                  onChange={(e: any) => onChange('mobileNumber', e.target.value.replace(/\D/g, ''))} 
                  placeholder="e.g., 9876543210"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Guardian Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">👨‍👩‍👧 Guardian Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput 
                  label="Guardian/Parent Name" 
                  value={form.guardianName} 
                  onChange={(e: any) => onChange('guardianName', e.target.value)} 
                  placeholder="Enter guardian's name"
                  required
                />
                <FormSelect 
                  label="Relationship" 
                  value={form.relationship} 
                  onChange={(e: any) => onChange('relationship', e.target.value)}
                  options={[
                    { value: '', label: 'Select Relationship' },
                    { value: 'Father', label: 'Father' },
                    { value: 'Mother', label: 'Mother' },
                    { value: 'Guardian', label: 'Guardian' }
                  ]}
                  required
                />
                <FormInput 
                  label="Contact Number" 
                  value={form.guardianContactNumber} 
                  onChange={(e: any) => onChange('guardianContactNumber', e.target.value.replace(/\D/g, ''))} 
                  placeholder="e.g., 9876543210"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                />
                <FormTextarea 
                  label="Address" 
                  value={form.guardianAddress} 
                  onChange={(e: any) => onChange('guardianAddress', e.target.value)} 
                  placeholder="Enter full residential address"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button 
                onClick={submit} 
                disabled={loading}
                className="flex-grow"
              >
                {loading ? 'Submitting...' : latestApplication ? '💾 Update Application' : '📤 Submit Application'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{latestApplication.fullName}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Reg: {latestApplication.registerNumber} • {latestApplication.department} • Year {latestApplication.yearOfStudy}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowDetails((prev) => !prev)}
              >
                {showDetails ? '👁️‍🗨️ Hide Details' : '👁️ View Details'}
              </Button>
              <Button 
                type="button" 
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Application
              </Button>
            </div>

            {showDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="text-gray-900 font-medium">{latestApplication.studentEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile</p>
                    <p className="text-gray-900 font-medium">{latestApplication.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</p>
                    <p className="text-gray-900 font-medium">{latestApplication.gender}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guardian</p>
                    <p className="text-gray-900 font-medium">{latestApplication.guardianName} ({latestApplication.relationship})</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guardian Contact</p>
                    <p className="text-gray-900 font-medium">{latestApplication.guardianContactNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</p>
                    <p className="text-gray-900 font-medium">{latestApplication.guardianAddress}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
