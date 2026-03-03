import { Link, useLocation, useNavigate } from 'react-router-dom';

type NavItem = { href: string; label: string };

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/students', label: 'Students' },
    { href: '/wardens', label: 'Wardens' },
    { href: '/hostels', label: 'Hostels' },
    { href: '/rooms', label: 'Rooms' },
    { href: '/allocations', label: 'Allocations' },
    { href: '/attendance', label: 'Attendance' },
    { href: '/menu', label: 'Update Weekly Menu' },
    { href: '/admin-messages', label: 'Messages' }
  ],
  WARDEN: [
    { href: '/warden/dashboard', label: 'Dashboard' },
    { href: '/warden/students', label: 'Students List' },
    { href: '/warden/requests', label: 'Requests' },
    { href: '/warden/complaints', label: 'Complaints' },
    { href: '/warden/attendance', label: 'Attendance' },
    { href: '/warden/messages', label: 'Messages' }
  ],
  STAFF: [
    { href: '/staff/dashboard', label: 'Dashboard' },
    { href: '/staff/complaints', label: 'Assigned Complaints' }
  ]
};

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole') || '';
  const navItems = navByRole[role] || navByRole.ADMIN;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`);

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col overflow-y-auto">
      <div className="p-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold">Hostel Portal</h1>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-700">
            <span>x</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">{role || 'USER'}</p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onClose}
                className={`block px-3 py-2 rounded-lg ${isActive(item.href) ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto p-4 border-t border-gray-700">
        <button onClick={handleLogout} className="px-3 py-2 rounded-lg text-gray-300 w-full text-left hover:bg-gray-700">
          Logout
        </button>
      </div>
    </aside>
  );
}
