import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/attendance', label: 'Attendance' },
  { href: '/student/apply', label: 'Apply Hostel' },
  { href: '/student/room', label: 'My Room' },
  { href: '/student/complaints', label: 'Complaints' },
  { href: '/student/requests', label: 'Requests' },
  { href: '/student/menu', label: 'Weekly Menu' }
];

interface StudentSidebarProps {
  onClose?: () => void;
}

export function StudentSidebar({ onClose }: StudentSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`);

  return (
    <aside className="w-64 bg-gray-800 text-white h-screen flex flex-col overflow-y-auto">
      <div className="p-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold">Student Portal</h1>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-700">
            <span>x</span>
          </button>
        </div>

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
