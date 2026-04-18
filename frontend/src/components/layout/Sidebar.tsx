import { Link, useLocation, useNavigate } from 'react-router-dom';

type NavItem = { href: string; label: string };

const iconByLabel: Record<string, string> = {
  Dashboard: 'M3 12.8L12 4l9 8.8v7a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-7z',
  Students: 'M16 19a4 4 0 10-8 0M12 13a3.5 3.5 0 100-7 3.5 3.5 0 000 7',
  Wardens: 'M12 4l7 3v4c0 4.5-2.9 8.3-7 9.6C7.9 19.3 5 15.5 5 11V7l7-3z',
  Hostels: 'M4 20V7a1 1 0 011-1h14a1 1 0 011 1v13M8 20v-5h8v5M8 10h.01M12 10h.01M16 10h.01',
  Rooms: 'M4 7h16v13H4zM4 12h16M12 7v13',
  Allocations: 'M4 7h8v6H4zM12 11l3 3 5-6',
  Attendance: 'M5 12l4 4L19 6',
  'Update Weekly Menu': 'M6 4h12M6 10h12M6 16h8',
  Messages: 'M4 6h16v12H4zM4 8l8 5 8-5',
  'Students List': 'M3 6h18M3 12h18M3 18h12',
  Requests: 'M5 5h14v14H5zM8 9h8M8 13h6',
  Complaints: 'M12 8v5m0 3h.01',
  'Assigned Complaints': 'M12 8v5m0 3h.01',
  'Menu Feedback': 'M6 4h12M6 10h12M6 16h8'
};

const NavIcon = ({ label }: { label: string }) => {
  const path = iconByLabel[label] || 'M4 12h16';

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
};

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
    { href: '/warden/attendance', label: 'Attendance' },
    { href: '/warden/menu', label: 'Menu Feedback' },
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
    sessionStorage.clear();
    navigate('/login');
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`);

  return (
    <aside className="w-64 h-full min-h-screen bg-[var(--surface)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-base font-semibold tracking-tight">Hostel Portal</h1>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-md hover:bg-[var(--surface-muted)]">
            <span>x</span>
          </button>
        </div>
        <p className="text-[11px] text-[var(--foreground-muted)] uppercase tracking-[0.12em] mb-2 px-2">{role || 'USER'}</p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onClose}
                className={`sidebar-nav-link flex items-center gap-2.5 px-3 py-2 rounded-md text-sm ${
                  isActive(item.href)
                    ? 'sidebar-nav-link-active'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                <NavIcon label={item.label} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 p-4 border-t border-[var(--border)] bg-[var(--surface)]">
        <button onClick={handleLogout} className="px-3 py-2 rounded-md w-full text-left text-sm text-red-800 hover:bg-[var(--surface-muted)] hover:text-red-600">
          Logout
        </button>
      </div>
    </aside>
  );
}
