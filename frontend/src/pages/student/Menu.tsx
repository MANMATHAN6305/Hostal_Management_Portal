import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { studentApi } from '@/lib/api';
import { Alert, Button, Snackbar } from '@mui/material';
import FoodFeedbackDialog, { MealType } from '@/components/feedback/FoodFeedbackDialog';

interface MenuItem {
  id: number;
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const dayColors: Record<string, string> = {
  MONDAY: 'bg-blue-500',
  TUESDAY: 'bg-purple-500',
  WEDNESDAY: 'bg-green-500',
  THURSDAY: 'bg-orange-500',
  FRIDAY: 'bg-pink-500',
  SATURDAY: 'bg-indigo-500',
  SUNDAY: 'bg-red-500',
};

export default function Menu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: ''
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await studentApi.getMenu();
      if (response.success) {
        // Sort menu by day order
        const sortedMenu = [...response.menu].sort((a, b) => {
          return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        });
        setMenu(sortedMenu);
        setWeekStart(response.weekStart);
      } else {
        setError(response.message || 'Failed to load menu');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDay = () => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[new Date().getDay()];
  };

  const submitFoodFeedback = async (payload: {
    day: string;
    mealType: MealType;
    foodItem: string;
    rating: number;
    comment: string;
    hasFoodComplaint: boolean;
    complaintText: string;
    complaintImageFile: File | null;
  }) => {
    try {
      const response = await studentApi.submitFoodFeedback(payload);
      if (!response.success) {
        const message = response.message || 'Failed to submit feedback';
        setSnackbar({
          open: true,
          severity: 'error',
          message
        });
        return { success: false, message };
      }

      let complaintMessage = '';
      if (payload.hasFoodComplaint) {
        const complaintLines = [
          'Food Complaint from Weekly Menu Feedback',
          `Day: ${payload.day}`,
          `Meal: ${payload.mealType}`,
          `Food Item: ${payload.foodItem}`,
          `Rating: ${payload.rating}/5`,
          `Student Feedback: ${payload.comment || 'No feedback text provided.'}`,
          `Complaint Details: ${payload.complaintText || 'Not provided.'}`
        ];

        try {
          await studentApi.submitComplaint({
            category: 'OTHER',
            message: complaintLines.join('\n'),
            imageFile: payload.complaintImageFile
          });
          complaintMessage = ' Complaint also submitted.';
        } catch (complaintErr: any) {
          complaintMessage = ' Feedback submitted, but complaint upload failed.';
          console.error('Complaint submission failed:', complaintErr);
        }
      }

      setSnackbar({
        open: true,
        severity: 'success',
        message: response.message || `Feedback submitted successfully.${complaintMessage}`
      });
      return { success: true, message: response.message || 'Feedback submitted successfully.' };
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to submit feedback';
      setSnackbar({
        open: true,
        severity: 'error',
        message
      });
      return { success: false, message };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Menu</h1>
          <p className="text-gray-600">View the hostel food menu</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const todayMenu = menu.find(m => m.day === getCurrentDay());

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Menu</h1>
          <p className="text-gray-600 mt-1">
            {weekStart
              ? `Week starting ${new Date(weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
              : 'View the hostel food menu'}
          </p>
        </div>
        <Button
          variant="contained"
          onClick={() => setFeedbackOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
            borderRadius: '12px',
            px: 2.25,
            py: 1,
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: '0 8px 24px rgba(217, 70, 239, 0.32)',
            '&:hover': {
              background: 'linear-gradient(135deg, #db2777 0%, #c026d3 100%)'
            }
          }}
        >
          Add Food Feedback
        </Button>
      </div>

      {/* Today's Menu Highlight */}
      {todayMenu && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-4">🍽️ Today's Menu • {getCurrentDay()}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/15 backdrop-blur rounded-lg p-4">
              <p className="text-blue-100 text-sm font-medium mb-2">Breakfast</p>
              <p className="font-semibold text-lg">{todayMenu.breakfast || 'Not available'}</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-4">
              <p className="text-blue-100 text-sm font-medium mb-2">Lunch</p>
              <p className="font-semibold text-lg">{todayMenu.lunch || 'Not available'}</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-4">
              <p className="text-blue-100 text-sm font-medium mb-2">Dinner</p>
              <p className="font-semibold text-lg">{todayMenu.dinner || 'Not available'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Full Week Menu */}
      {menu.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h2 className="text-xl font-semibold text-gray-900">Menu Not Available</h2>
              <p className="text-gray-600 mt-2">The weekly menu hasn't been updated yet.</p>
              <p className="text-gray-500 text-sm mt-1">Please check back later.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Day</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">🌅 Breakfast</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">☀️ Lunch</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">🌙 Dinner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {menu.map((item) => (
                      <tr 
                        key={item.id} 
                        className={`${item.day === getCurrentDay() ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${dayColors[item.day]}`}></span>
                            <span className={`font-semibold ${item.day === getCurrentDay() ? 'text-blue-700' : 'text-gray-900'}`}>
                              {item.day.charAt(0) + item.day.slice(1).toLowerCase()}
                              {item.day === getCurrentDay() && (
                                <span className="ml-3 text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full">Today</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-700">{item.breakfast || '-'}</td>
                        <td className="px-6 py-3 text-gray-700">{item.lunch || '-'}</td>
                        <td className="px-6 py-3 text-gray-700">{item.dinner || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {menu.map((item) => (
              <Card key={item.id} className={item.day === getCurrentDay() ? 'ring-2 ring-blue-500' : ''}>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-3 h-3 rounded-full ${dayColors[item.day]}`}></span>
                    <span className="font-semibold text-gray-900">
                      {item.day.charAt(0) + item.day.slice(1).toLowerCase()}
                    </span>
                    {item.day === getCurrentDay() && (
                      <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full">Today</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-1">🌅</p>
                      <p className="text-sm font-medium text-gray-900">{item.breakfast || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-1">☀️</p>
                      <p className="text-sm font-medium text-gray-900">{item.lunch || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-1">🌙</p>
                      <p className="text-sm font-medium text-gray-900">{item.dinner || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <FoodFeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        menu={menu}
        defaultDay={getCurrentDay()}
        onSubmit={submitFoodFeedback}
      />

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
