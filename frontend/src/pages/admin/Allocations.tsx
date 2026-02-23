import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { allocationsApi } from '@/lib/api';
import type { Allocation } from '@/types';

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'PENDING': return 'warning';
    case 'VACATED': return 'default';
    default: return 'default';
  }
};

export default function Allocations() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [filteredAllocations, setFilteredAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchAllocations();
  }, []);

  useEffect(() => {
    let filtered = allocations;
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.studentName?.toLowerCase().includes(query) ||
        a.roomNumber?.toLowerCase().includes(query) ||
        a.blockName?.toLowerCase().includes(query) ||
        a.academicYear?.toLowerCase().includes(query) ||
        a.semester?.toLowerCase().includes(query)
      );
    }
    
    setFilteredAllocations(filtered);
  }, [searchQuery, statusFilter, allocations]);

  const fetchAllocations = async () => {
    try {
      const data = await allocationsApi.getAll();
      const allocationData = Array.isArray(data) ? data : [];
      setAllocations(allocationData);
      setFilteredAllocations(allocationData);
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      try {
        await allocationsApi.delete(id);
        setAllocations(allocations.filter(a => a.id !== id));
      } catch (error) {
        console.error('Failed to delete allocation:', error);
        alert('Failed to delete allocation');
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
          <h1 className="text-2xl font-bold text-slate-800">Room Allocations</h1>
          <p className="text-slate-600">Manage student room allocations</p>
        </div>
        <Link to="/allocations/add">
          <Button>+ New Allocation</Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Input
                type="text"
                placeholder="Search by Student Name, Room, Block, Academic Year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="VACATED">Vacated</option>
              </select>
              {(searchQuery || statusFilter !== 'ALL') && (
                <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}>
                  Clear
                </Button>
              )}
            </div>
          </div>
          {(searchQuery || statusFilter !== 'ALL') && (
            <p className="text-sm text-slate-500 mt-2">
              Showing {filteredAllocations.length} of {allocations.length} allocations
            </p>
          )}
        </CardContent>
      </Card>

      {allocations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No allocations found. Create your first room allocation.</p>
          </CardContent>
        </Card>
      ) : filteredAllocations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No allocations match your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Room</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Block</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Academic Year</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Semester</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.map((allocation) => (
                    <tr key={allocation.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-slate-800">{allocation.studentName || `Student #${allocation.studentId}`}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800">{allocation.roomNumber || `Room #${allocation.roomId}`}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{allocation.blockName || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{allocation.academicYear}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{allocation.semester}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusBadgeVariant(allocation.status)}>{allocation.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link to={`/allocations/edit/${allocation.id}`}>
                            <Button variant="secondary" size="sm">Edit</Button>
                          </Link>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(allocation.id)}>
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
