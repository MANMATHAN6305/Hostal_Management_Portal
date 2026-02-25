import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/student/room', label: 'My Room', icon: '🛏️' },
  { href: '/student/complaints', label: 'Complaints', icon: '📢' },
  { href: '/student/menu', label: 'Weekly Menu', icon: '🍽️' },
];

interface StudentSidebarProps {
  onClose?: () => void;
}

export function StudentSidebar({ onClose }: StudentSidebarProps) {
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
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <aside className="w-64 bg-gray-800 text-white h-screen flex flex-col overflow-y-auto">
      <div className="p-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🎓 Student Portal</h1>
            <p className="text-xs text-gray-400 mt-1">Hostel Management</p>
          </div>
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
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-4">Navigation</p>
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
      </div>

      <div className="mt-auto p-4 border-t border-gray-700">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm text-gray-400">Logged in as:</p>
          <p className="text-white font-medium truncate">{localStorage.getItem('userName') || 'Student'}</p>
        </div>
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
