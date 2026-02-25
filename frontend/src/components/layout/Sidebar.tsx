import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/rooms', label: 'Rooms', icon: '🛏️' },
  { href: '/students', label: 'Students', icon: '👥' },
  { href: '/allocations', label: 'Allocations', icon: '📅' },
  { href: '/complaints', label: 'Complaints', icon: '📢' },
  { href: '/menu', label: 'Weekly Menu', icon: '🍽️' },
];

const quickActions = [
  { href: '/allocations/add', label: 'New Allocation', icon: '➕' },
  { href: '/rooms/add', label: 'Add Room', icon: '🏠' },
  { href: '/students/add', label: 'Add Student', icon: '👤' },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('studentId');
    navigate('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col overflow-y-auto">
      <div className="p-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold">🏫 Hostel Portal</h1>
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-4">Main Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive(item.href)
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300'
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
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-4">Quick Actions</p>
          <ul className="space-y-1">
            {quickActions.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 text-sm"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 w-full"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
