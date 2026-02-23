import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { studentApi } from '@/lib/api';

interface MenuItem {
  id: number;
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Weekly Menu</h1>
          <p className="text-slate-600">View the hostel food menu</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const todayMenu = menu.find(m => m.day === getCurrentDay());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Weekly Menu</h1>
        <p className="text-slate-600">
          {weekStart 
            ? `Week starting ${new Date(weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` 
            : 'View the hostel food menu'}
        </p>
      </div>

      {/* Today's Menu Highlight */}
      {todayMenu && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">🍽️ Today's Menu ({getCurrentDay()})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-emerald-100 text-sm">Breakfast</p>
              <p className="font-medium">{todayMenu.breakfast || 'Not available'}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-emerald-100 text-sm">Lunch</p>
              <p className="font-medium">{todayMenu.lunch || 'Not available'}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-emerald-100 text-sm">Snacks</p>
              <p className="font-medium">{todayMenu.snacks || 'Not available'}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-emerald-100 text-sm">Dinner</p>
              <p className="font-medium">{todayMenu.dinner || 'Not available'}</p>
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
              <h2 className="text-xl font-semibold text-slate-700">Menu Not Available</h2>
              <p className="text-slate-500 mt-2">The weekly menu hasn't been updated yet.</p>
              <p className="text-slate-400 text-sm mt-1">Please check back later.</p>
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
                    <tr className="bg-slate-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Day</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">🌅 Breakfast</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">☀️ Lunch</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">🍵 Snacks</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">🌙 Dinner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {menu.map((item) => (
                      <tr 
                        key={item.id} 
                        className={`${item.day === getCurrentDay() ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${dayColors[item.day]}`}></span>
                            <span className={`font-medium ${item.day === getCurrentDay() ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {item.day.charAt(0) + item.day.slice(1).toLowerCase()}
                              {item.day === getCurrentDay() && (
                                <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">Today</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.breakfast || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{item.lunch || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{item.snacks || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{item.dinner || '-'}</td>
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
              <Card key={item.id} className={item.day === getCurrentDay() ? 'ring-2 ring-emerald-500' : ''}>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-3 h-3 rounded-full ${dayColors[item.day]}`}></span>
                    <span className="font-semibold text-slate-800">
                      {item.day.charAt(0) + item.day.slice(1).toLowerCase()}
                    </span>
                    {item.day === getCurrentDay() && (
                      <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">Today</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">🌅 Breakfast</p>
                      <p className="text-sm font-medium text-slate-700">{item.breakfast || '-'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">☀️ Lunch</p>
                      <p className="text-sm font-medium text-slate-700">{item.lunch || '-'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">🍵 Snacks</p>
                      <p className="text-sm font-medium text-slate-700">{item.snacks || '-'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500">🌙 Dinner</p>
                      <p className="text-sm font-medium text-slate-700">{item.dinner || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
