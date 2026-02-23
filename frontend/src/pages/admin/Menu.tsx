import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/api';

interface MenuItem {
  id?: number;
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const emptyMenu: MenuItem[] = days.map(day => ({
  day,
  breakfast: '',
  lunch: '',
  snacks: '',
  dinner: ''
}));

export default function AdminMenu() {
  const [menu, setMenu] = useState<MenuItem[]>(emptyMenu);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(() => {
    // Get this Monday's date
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await adminApi.getMenu();
      if (response.success && response.menu?.length > 0) {
        // Map the menu data to our format, filling in missing days
        const menuMap = new Map(response.menu.map((m: MenuItem) => [m.day, m]));
        const mappedMenu = days.map(day => ({
          day,
          breakfast: (menuMap.get(day) as MenuItem)?.breakfast || '',
          lunch: (menuMap.get(day) as MenuItem)?.lunch || '',
          snacks: (menuMap.get(day) as MenuItem)?.snacks || '',
          dinner: (menuMap.get(day) as MenuItem)?.dinner || '',
        }));
        setMenu(mappedMenu);
        if (response.menu[0]?.weekStartDate) {
          setWeekStartDate(response.menu[0].weekStartDate);
        }
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
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
      } else {
        setError(response.message || 'Failed to update menu');
      }
    } catch (err) {
      setError('Failed to save menu');
    } finally {
      setSaving(false);
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Weekly Menu Management</h1>
          <p className="text-slate-600">Update the hostel food menu for students</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          {saving ? 'Saving...' : '💾 Save Menu'}
        </Button>
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">🍵 Snacks</th>
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
                        value={item.snacks}
                        onChange={(e) => handleMenuChange(item.day, 'snacks', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="Enter snacks..."
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
                  <label className="block text-xs text-slate-500 mb-1">🍵 Snacks</label>
                  <input
                    type="text"
                    value={item.snacks}
                    onChange={(e) => handleMenuChange(item.day, 'snacks', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Enter snacks..."
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
    </div>
  );
}
