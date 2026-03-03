import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function EditWarden() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [hostelsLoading, setHostelsLoading] = useState(true);
  const [hostelsError, setHostelsError] = useState('');
  const [hostels, setHostels] = useState<HostelItem[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    gender: '' as GenderSelection,
    hostelId: '',
    isActive: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const loadHostels = async () => {
    try {
      setHostelsLoading(true);
      setHostelsError('');
      const response = await hostelsApi.getAll();

      if (response && response.hostels && Array.isArray(response.hostels)) {
        setHostels(response.hostels);
      } else if (Array.isArray(response)) {
        setHostels(response);
      } else {
        setHostels([]);
        setHostelsError('Unexpected hostel data format');
      }
    } catch (err: any) {
      setHostelsError(err?.response?.data?.message || err?.message || 'Failed to load hostels');
    } finally {
      setHostelsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const wardenRes = await adminApi.getWardenById(parseInt(id!, 10));
      setFormData((prev) => ({
        ...prev,
        fullName: wardenRes.warden.fullName,
        email: wardenRes.warden.email,
        password: '',
        phone: wardenRes.warden.phone || '',
        gender: (wardenRes.warden.gender || '').toLowerCase(),
        hostelId: wardenRes.hostelStats?.hostel?.id?.toString() || '',
        isActive: Boolean(wardenRes.warden.isActive)
      }));

      await loadHostels();
    } catch (err) {
      setError('Failed to load warden data');
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    const nextData = { ...formData, [e.target.name]: value };

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

    if (!formData.fullName || !formData.email || !formData.gender) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender.toUpperCase(),
        hostelId: formData.hostelId ? parseInt(formData.hostelId, 10) : null,
        isActive: formData.isActive
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await adminApi.updateWarden(parseInt(id!, 10), updateData);
      navigate('/wardens');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.details || 'Failed to update warden');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Warden</h1>
        <p className="text-gray-600 mt-1">Update warden information and hostel assignment</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave empty to keep current password"
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
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Loading hostels...
                  </div>
                ) : hostelsError ? (
                  <div className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm">
                    {hostelsError}
                    <button
                      type="button"
                      onClick={loadHostels}
                      className="ml-2 underline hover:font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                ) : hostels.length === 0 ? (
                  <div className="w-full px-4 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                    No hostels found in database. Create hostels first from the Hostels page.
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Active Status</label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? 'Updating...' : 'Update Warden'}
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
