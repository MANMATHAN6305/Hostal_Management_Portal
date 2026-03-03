import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Warden {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  assignedHostel: {
    id: number;
    name: string;
    blockCode: string;
  } | null;
}

export default function Wardens() {
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchWardens();
  }, []);

  const fetchWardens = async () => {
    try {
      const response = await adminApi.getWardens();
      console.log('Wardens response:', response);
      if (response && response.wardens) {
        // Ensure each warden has a display name
        const wardensWithNames = response.wardens.map((w: any) => ({
          ...w,
          fullName: w.fullName || w.email || `User ${w.id}`
        }));
        setWardens(wardensWithNames);
      } else {
        console.warn('No wardens in response:', response);
        setWardens([]);
      }
    } catch (error) {
      console.error('Failed to fetch wardens:', error);
      setWardens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this warden?')) return;

    try {
      await adminApi.deleteWarden(id);
      setWardens(wardens.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete warden:', error);
      alert('Failed to delete warden');
    }
  };

  const filteredWardens = wardens.filter(w =>
    (w.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.assignedHostel?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warden Management</h1>
          <p className="text-gray-600 mt-1">Manage hostel wardens and their assignments</p>
        </div>
        <Link to="/wardens/add">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            ➕ Add Warden
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent>
          <input
            type="text"
            placeholder="Search by name, email, or hostel..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Wardens</p>
                <p className="text-3xl font-bold text-blue-600">{wardens.length}</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Assigned</p>
                <p className="text-3xl font-bold text-green-600">
                  {wardens.filter(w => w.assignedHostel).length}
                </p>
              </div>
              <span className="text-3xl">✓</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Unassigned</p>
                <p className="text-3xl font-bold text-orange-600">
                  {wardens.filter(w => !w.assignedHostel).length}
                </p>
              </div>
              <span className="text-3xl">⚠</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wardens List */}
      {filteredWardens.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-600">No wardens found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Hostel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredWardens.map((warden) => (
                      <tr key={warden.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{warden.fullName}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{warden.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{warden.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {warden.assignedHostel ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {warden.assignedHostel.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {warden.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-right space-x-2">
                          <Link to={`/wardens/${warden.id}`}>
                            <Button size="sm" variant="outline">
                              👁 View
                            </Button>
                          </Link>
                          <Link to={`/wardens/edit/${warden.id}`}>
                            <Button size="sm" variant="outline">
                              ✏️ Edit
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(warden.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            🗑️ Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {filteredWardens.map((warden) => (
              <Card key={warden.id}>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{warden.fullName}</h3>
                        <p className="text-sm text-gray-600">{warden.email}</p>
                      </div>
                      {warden.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      <p><strong>Phone:</strong> {warden.phone || '-'}</p>
                      <p><strong>Hostel:</strong> {warden.assignedHostel?.name || 'Not Assigned'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/wardens/${warden.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          👁 View
                        </Button>
                      </Link>
                      <Link to={`/wardens/edit/${warden.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          ✏️ Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(warden.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
