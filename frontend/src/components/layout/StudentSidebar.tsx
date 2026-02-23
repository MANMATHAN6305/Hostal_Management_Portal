import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/student/room', label: 'My Room', icon: '🛏️' },
  { href: '/student/complaints', label: 'Complaints', icon: '📢' },
  { href: '/student/menu', label: 'Weekly Menu', icon: '🍽️' },
];

export function StudentSidebar() {
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
    <aside className="w-64 bg-emerald-800 text-white min-h-screen flex flex-col">
      <div className="p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-center">🎓 Student Portal</h1>
          <p className="text-xs text-emerald-200 text-center mt-1">Hostel Management</p>
        </div>
        
        <nav>
          <p className="text-xs text-emerald-300 uppercase tracking-wider mb-2 px-4">Navigation</p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
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

      <div className="mt-auto p-4 border-t border-emerald-700">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm text-emerald-200">Logged in as:</p>
          <p className="text-white font-medium truncate">{localStorage.getItem('userName') || 'Student'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-red-600 hover:text-white transition-colors w-full"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
