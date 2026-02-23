import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/rooms', label: 'Rooms', icon: '🛏️' },
  { href: '/students', label: 'Students', icon: '👥' },
  { href: '/allocations', label: 'Allocations', icon: '📅' },
];

const quickActions = [
  { href: '/allocations/add', label: 'New Allocation', icon: '➕' },
  { href: '/rooms/add', label: 'Add Room', icon: '🏠' },
  { href: '/students/add', label: 'Add Student', icon: '👤' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-slate-800 text-white min-h-screen flex flex-col">
      <div className="p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-center">🏫 Hostel Portal</h1>
        </div>
        
        <nav>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 px-4">Main Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 px-4">Quick Actions</p>
          <ul className="space-y-1">
            {quickActions.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors w-full"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
