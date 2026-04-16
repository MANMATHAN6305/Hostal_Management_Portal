import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi, getBackendAssetUrl } from '@/lib/api';
import { Alert, Snackbar } from '@mui/material';
import FoodFeedbackTable, { FeedbackRow, MealStat } from '@/components/feedback/FoodFeedbackTable';

interface FoodComplaintRow {
  id: number;
  message: string;
  status: string;
  category: string;
  imageUrl?: string | null;
  createdAt: string;
  Student?: {
    studentId?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface MenuItem {
  id?: number;
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const buildEmptyMenu = (): MenuItem[] => days.map(day => ({
  day,
  breakfast: '',
  lunch: '',
  dinner: ''
}));

const getCurrentMonday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export default function AdminMenu() {
  const [menu, setMenu] = useState<MenuItem[]>(buildEmptyMenu());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(getCurrentMonday);
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<MealStat[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [foodComplaints, setFoodComplaints] = useState<FoodComplaintRow[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [statusByComplaintId, setStatusByComplaintId] = useState<Record<number, string>>({});
  const [savingComplaintId, setSavingComplaintId] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [feedbackFilters, setFeedbackFilters] = useState({
    day: '',
    mealType: '',
    rating: ''
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: ''
  });

  useEffect(() => {
    fetchMenu(weekStartDate);
  }, [weekStartDate]);

  useEffect(() => {
    if (!showFeedback) {
      return;
    }
    fetchFeedback(feedbackFilters);
    fetchFeedbackStats(feedbackFilters.day);
  }, [showFeedback, feedbackFilters]);

  useEffect(() => {
    if (!showFeedback) {
      return;
    }
    fetchFoodComplaints();
  }, [showFeedback]);

  const fetchMenu = async (targetWeek: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getMenu(targetWeek);
      if (!response?.success) {
        setMenu(buildEmptyMenu());
        setError(response?.message || 'Failed to load menu');
        return;
      }

      const menuMap = new Map((response.menu || []).map((m: MenuItem) => [m.day, m]));
      const mappedMenu = days.map(day => ({
        day,
        breakfast: (menuMap.get(day) as MenuItem)?.breakfast || '',
        lunch: (menuMap.get(day) as MenuItem)?.lunch || '',
        dinner: (menuMap.get(day) as MenuItem)?.dinner || '',
      }));
      setMenu(mappedMenu);
    } catch (err) {
      setMenu(buildEmptyMenu());
      console.error('Failed to fetch menu:', err);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuChange = (day: string, field: keyof MenuItem, value: string) => {
    setMenu(prev => prev.map(item => 
      item.day === day ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminApi.updateMenu({
        weekStartDate,
        menuItems: menu
      });

      if (response.success) {
        setSuccess('Menu updated successfully!');
        await fetchMenu(weekStartDate);
      } else {
        setError(response.message || 'Failed to update menu');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const fetchFeedback = async (filters: { day?: string; mealType?: string; rating?: string }) => {
    try {
      setFeedbackLoading(true);
      const response = await adminApi.getFoodFeedback({
        day: filters.day || undefined,
        mealType: filters.mealType || undefined,
        rating: filters.rating || undefined
      });
      setFeedbackRows(response?.feedback || []);
    } catch (err: any) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: err?.response?.data?.message || 'Failed to fetch food feedback'
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchFeedbackStats = async (day?: string) => {
    try {
      const response = await adminApi.getFoodFeedbackStats({ day: day || undefined });
      setFeedbackStats(response?.stats || []);
    } catch (err) {
      setFeedbackStats([]);
    }
  };

  const toggleFeedbackView = () => {
    setShowFeedback((prev) => !prev);
  };

  const fetchFoodComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const response = await adminApi.getComplaints();
      const allComplaints: FoodComplaintRow[] = response?.complaints || [];
      const foodOnly = allComplaints.filter((complaint) => {
        const message = String(complaint.message || '');
        return complaint.category === 'FOOD' || message.startsWith('Food Complaint from Weekly Menu Feedback');
      });
      setFoodComplaints(foodOnly);
      setStatusByComplaintId(
        foodOnly.reduce((acc: Record<number, string>, complaint) => {
          acc[complaint.id] = complaint.status || 'PENDING';
          return acc;
        }, {})
      );
    } catch {
      setFoodComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId: number) => {
    try {
      setSavingComplaintId(complaintId);
      const nextStatus = statusByComplaintId[complaintId] || 'PENDING';
      await adminApi.updateComplaint(complaintId, { status: nextStatus });
      setSnackbar({
        open: true,
        severity: 'success',
        message: 'Complaint status updated successfully.'
      });
      await fetchFoodComplaints();
    } catch (err: any) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: err?.response?.data?.message || 'Failed to update complaint status.'
      });
    } finally {
      setSavingComplaintId(null);
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
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Weekly Menu Management</h1>
          <p className="text-slate-600">Update the hostel food menu for students</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={toggleFeedbackView}
            className="px-4 py-2 rounded-xl font-semibold text-white bg-lime-500 hover:bg-lime-600 shadow"
          >
            {showFeedback ? 'Hide Students Food Feedback' : 'View Students Food Feedback'}
          </button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {saving ? 'Saving...' : '💾 Save Menu'}
          </Button>
        </div>
      </div>

      {/* Week Selector */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="font-medium text-slate-700">Week Starting:</label>
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-32">Day</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">🌅 Breakfast</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">☀️ Lunch</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">🌙 Dinner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {menu.map((item) => (
                  <tr key={item.day} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">
                        {item.day.charAt(0) + item.day.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={item.breakfast}
                        onChange={(e) => handleMenuChange(item.day, 'breakfast', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="Enter breakfast items..."
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={item.lunch}
                        onChange={(e) => handleMenuChange(item.day, 'lunch', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="Enter lunch items..."
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={item.dinner}
                        onChange={(e) => handleMenuChange(item.day, 'dinner', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="Enter dinner items..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {menu.map((item) => (
          <Card key={item.day}>
            <CardContent>
              <h3 className="font-semibold text-slate-800 mb-4">
                {item.day.charAt(0) + item.day.slice(1).toLowerCase()}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">🌅 Breakfast</label>
                  <input
                    type="text"
                    value={item.breakfast}
                    onChange={(e) => handleMenuChange(item.day, 'breakfast', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Enter breakfast items..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">☀️ Lunch</label>
                  <input
                    type="text"
                    value={item.lunch}
                    onChange={(e) => handleMenuChange(item.day, 'lunch', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Enter lunch items..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">🌙 Dinner</label>
                  <input
                    type="text"
                    value={item.dinner}
                    onChange={(e) => handleMenuChange(item.day, 'dinner', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Enter dinner items..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          {saving ? 'Saving...' : '💾 Save Menu'}
        </Button>
      </div>

      {showFeedback && (
        <Card>
          <CardContent>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Students Food Feedback</h2>
                <p className="text-sm text-slate-600">Filter by day, meal type, rating and monitor average meal scores.</p>
              </div>
              <button
                onClick={() => {
                  fetchFeedback(feedbackFilters);
                  fetchFeedbackStats(feedbackFilters.day);
                  fetchFoodComplaints();
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>

            {feedbackLoading ? (
              <div className="py-8 text-center text-slate-500">Loading feedback...</div>
            ) : (
              <FoodFeedbackTable
                feedback={feedbackRows}
                stats={feedbackStats}
                filters={feedbackFilters}
                onFilterChange={setFeedbackFilters}
              />
            )}

            <div className="mt-8 border-t border-slate-200 pt-5">
              <h3 className="text-lg font-bold text-slate-800">Food Complaints</h3>
              <p className="text-sm text-slate-600 mb-3">Complaints submitted from the student food feedback form.</p>

              {complaintsLoading ? (
                <div className="py-6 text-center text-slate-500">Loading complaints...</div>
              ) : foodComplaints.filter((complaint) => !!complaint.imageUrl).length === 0 ? (
                <div className="py-6 text-sm text-slate-500">No food complaints with images found.</div>
              ) : (
                <div className="space-y-3">
                  {foodComplaints
                    .filter((complaint) => !!complaint.imageUrl)
                    .map((complaint) => (
                      <div key={complaint.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="flex justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {complaint.Student?.firstName || 'Student'} {complaint.Student?.lastName || ''}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Roll No: {complaint.Student?.studentId || 'N/A'} | Phone: {complaint.Student?.phone || 'N/A'}
                            </p>
                          </div>
                          <p className="text-xs text-slate-600">{new Date(complaint.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap mt-2">{complaint.message}</p>
                        <p className="text-xs font-medium text-slate-600 mt-1">Current Status: {complaint.status}</p>
                        <img
                          src={getBackendAssetUrl(complaint.imageUrl)}
                          alt="Food complaint evidence"
                          className="mt-3 w-full max-w-sm h-44 object-cover rounded-md border border-slate-300 cursor-zoom-in"
                          onClick={() => setPreviewImageUrl(getBackendAssetUrl(complaint.imageUrl))}
                        />
                        <div className="mt-3 flex gap-2 items-center flex-wrap">
                          <select
                            value={statusByComplaintId[complaint.id] || complaint.status}
                            onChange={(event) =>
                              setStatusByComplaintId((prev) => ({
                                ...prev,
                                [complaint.id]: event.target.value
                              }))
                            }
                            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                          </select>
                          <Button
                            size="sm"
                            disabled={savingComplaintId === complaint.id}
                            onClick={() => updateComplaintStatus(complaint.id)}
                          >
                            {savingComplaintId === complaint.id ? 'Updating...' : 'Update Status'}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 px-3 py-1.5 rounded-md bg-white text-slate-900 text-sm font-semibold"
            >
              Close
            </button>
            <img
              src={previewImageUrl}
              alt="Complaint evidence preview"
              className="w-full max-h-[85vh] object-contain rounded-lg border border-slate-200 bg-white"
            />
          </div>
        </div>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
