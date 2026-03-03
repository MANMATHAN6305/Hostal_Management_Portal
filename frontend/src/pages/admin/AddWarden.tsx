import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, hostelsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type GenderSelection = '' | 'male' | 'female';

interface HostelItem {
  id: number;
  name: string;
  blockCode?: string | null;
  gender?: string | null;
}

const normalizeHostelGender = (value: string | null | undefined): 'MALE' | 'FEMALE' | 'COED' | '' => {
  const gender = String(value || '').trim().toUpperCase();
  if (['MALE', 'MEN', "MEN'S", 'BOYS'].includes(gender)) return 'MALE';
  if (['FEMALE', 'WOMEN', "WOMEN'S", 'GIRLS'].includes(gender)) return 'FEMALE';
  if (gender === 'COED') return 'COED';
  return '';
};

export default function AddWarden() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hostelsLoading, setHostelsLoading] = useState(true);
  const [hostelsError, setHostelsError] = useState('');
  const [hostels, setHostels] = useState<HostelItem[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    gender: '' as GenderSelection,
    hostelId: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadHostels();
  }, []);

  const loadHostels = async () => {
    try {
      setHostelsLoading(true);
      setHostelsError('');
      const response = await hostelsApi.getAll();

      if (response && response.success === false) {
        // API returned error
        setHostelsError(response.message || 'Failed to load hostels');
        setHostels([]);
        return;
      }

      if (response && response.hostels && Array.isArray(response.hostels)) {
        setHostels(response.hostels);
      } else if (Array.isArray(response)) {
        setHostels(response);
      } else {
        setHostels([]);
        setHostelsError('Unexpected hostel data format');
      }
    } catch (err: any) {
      console.error('Failed to load hostels:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load hostels';
      
      // Check specific error types
      if (err?.response?.status === 401) {
        setHostelsError('Authentication failed. Please login again.');
      } else if (err?.response?.status === 403) {
        setHostelsError('Access denied. Admin privileges required.');
      } else if (err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK') {
        setHostelsError('Cannot connect to server. Make sure backend is running on port 5000.');
      } else {
        setHostelsError(errorMessage);
      }
    } finally {
      setHostelsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const nextData = { ...formData, [e.target.name]: e.target.value };

    if (e.target.name === 'gender') {
      nextData.hostelId = '';
    }

    setFormData(nextData);
  };

  const selectedGender = formData.gender ? formData.gender.toUpperCase() : '';
  const filteredHostels = selectedGender
    ? hostels.filter((hostel) => normalizeHostelGender(hostel.gender) === selectedGender)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.password || !formData.gender) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await adminApi.createWarden({
        ...formData,
        gender: formData.gender.toUpperCase(),
        hostelId: formData.hostelId ? parseInt(formData.hostelId, 10) : null
      });
      navigate('/wardens');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.details || 'Failed to create warden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Warden</h1>
        <p className="text-gray-600 mt-1">Create a new warden and assign to a hostel</p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="warden@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hostel options are filtered by selected gender.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Hostel</label>

                {hostelsLoading ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                    <span className="text-gray-600">Loading hostels...</span>
                  </div>
                ) : hostelsError ? (
                  <div className="w-full px-4 py-3 border-2 border-red-300 rounded-lg bg-red-50">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 text-lg">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-700">{hostelsError}</p>
                        <button
                          type="button"
                          onClick={loadHostels}
                          className="mt-2 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                        >
                          🔄 Retry Loading Hostels
                        </button>
                      </div>
                    </div>
                  </div>
                ) : hostels.length === 0 ? (
                  <div className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg bg-yellow-50">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-700 text-lg">ℹ️</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-700">No hostels available in the system.</p>
                        <p className="text-xs text-yellow-600 mt-1">Please create hostels from the Hostels page first.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    name="hostelId"
                    value={formData.hostelId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    disabled={!formData.gender}
                  >
                    <option value="">
                      {!formData.gender
                        ? 'Select gender first'
                        : `Select ${formData.gender === 'male' ? "Men's" : "Women's"} Hostel (Optional)`}
                    </option>
                    {filteredHostels.map((hostel) => (
                      <option key={hostel.id} value={hostel.id}>
                        {hostel.name} ({hostel.blockCode || 'No Block'}) - {hostel.gender || 'N/A'}
                      </option>
                    ))}
                  </select>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  {formData.gender
                    ? `Showing ${formData.gender === 'male' ? "Men's" : "Women's"} hostels only.`
                    : 'Please select gender to see matching hostels.'}
                </p>

                {!!formData.gender && !hostelsLoading && !hostelsError && hostels.length > 0 && filteredHostels.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No {formData.gender === 'male' ? "Men's" : "Women's"} hostels are currently available.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? 'Creating...' : 'Create Warden'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/wardens')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
