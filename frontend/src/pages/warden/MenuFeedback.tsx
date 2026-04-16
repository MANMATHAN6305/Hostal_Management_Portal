import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert, Snackbar } from '@mui/material';
import FoodFeedbackTable, { FeedbackRow, MealStat } from '@/components/feedback/FoodFeedbackTable';
import { getBackendAssetUrl, wardenApi } from '@/lib/api';

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

export default function MenuFeedback() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<MealStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [foodComplaints, setFoodComplaints] = useState<FoodComplaintRow[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [statusByComplaintId, setStatusByComplaintId] = useState<Record<number, string>>({});
  const [savingComplaintId, setSavingComplaintId] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState({ day: '', mealType: '', rating: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: ''
  });

  useEffect(() => {
    if (!showFeedback) {
      return;
    }

    fetchFeedback(filters);
    fetchStats(filters.day);
  }, [showFeedback, filters]);

  useEffect(() => {
    if (!showFeedback) {
      return;
    }

    fetchFoodComplaints();
  }, [showFeedback]);

  const fetchFeedback = async (activeFilters: { day?: string; mealType?: string; rating?: string }) => {
    try {
      setLoading(true);
      const response = await wardenApi.getFoodFeedback({
        day: activeFilters.day || undefined,
        mealType: activeFilters.mealType || undefined,
        rating: activeFilters.rating || undefined
      });
      setFeedbackRows(response?.feedback || []);
    } catch (err: any) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: err?.response?.data?.message || 'Failed to fetch food feedback'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (day?: string) => {
    try {
      const response = await wardenApi.getFoodFeedbackStats({ day: day || undefined });
      setFeedbackStats(response?.stats || []);
    } catch (err) {
      setFeedbackStats([]);
    }
  };

  const handleToggle = () => {
    setShowFeedback((prev) => !prev);
  };

  const fetchFoodComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const response = await wardenApi.getComplaints();
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
      const nextStatus = (statusByComplaintId[complaintId] || 'PENDING') as 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
      await wardenApi.updateComplaint(complaintId, { status: nextStatus });
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Weekly Menu Feedback</h1>
          <p className="text-slate-600">Monitor student food experience with filters and meal-wise averages.</p>
        </div>
        <button
          onClick={handleToggle}
          className="px-4 py-2 rounded-xl font-semibold text-white bg-lime-500 hover:bg-lime-600 shadow"
        >
          {showFeedback ? 'Hide Students Food Feedback' : 'View Students Food Feedback'}
        </button>
      </div>

      {showFeedback && (
        <Card>
          <CardContent>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  fetchFeedback(filters);
                  fetchStats(filters.day);
                  fetchFoodComplaints();
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500">Loading feedback...</div>
            ) : (
              <FoodFeedbackTable
                feedback={feedbackRows}
                stats={feedbackStats}
                filters={filters}
                onFilterChange={setFilters}
              />
            )}

            <div className="mt-8 border-t border-slate-200 pt-5">
              <h3 className="text-lg font-bold text-slate-800">Food Complaints (with Image)</h3>
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
                          <button
                            disabled={savingComplaintId === complaint.id}
                            onClick={() => updateComplaintStatus(complaint.id)}
                            className="px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 text-white text-sm disabled:opacity-60"
                          >
                            {savingComplaintId === complaint.id ? 'Updating...' : 'Update Status'}
                          </button>
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
