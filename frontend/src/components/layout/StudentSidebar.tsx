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

const iconByLabel: Record<string, string> = {
  Dashboard: 'M3 12.8L12 4l9 8.8v7a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-7z',
  Attendance: 'M5 12l4 4L19 6',
  'Apply Hostel': 'M5 5h14v14H5zM8 9h8M8 13h6',
  'My Room': 'M4 7h16v13H4zM4 12h16M12 7v13',
  Complaints: 'M12 8v5m0 3h.01',
  Requests: 'M5 5h14v14H5zM8 9h8M8 13h6',
  'Weekly Menu': 'M6 4h12M6 10h12M6 16h8'
};

const NavIcon = ({ label }: { label: string }) => {
  const path = iconByLabel[label] || 'M4 12h16';

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
};

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
    <aside className="w-64 bg-[var(--surface)] text-[var(--foreground)] border-r border-[var(--border)] h-screen flex flex-col overflow-y-auto">
      <div className="p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-base font-semibold tracking-tight">Student Portal</h1>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-md hover:bg-[var(--surface-muted)]">
            <span>x</span>
          </button>
        </div>

        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm border ${
                  isActive(item.href)
                    ? 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <NavIcon label={item.label} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto p-4 border-t border-[var(--border)]">
        <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm text-[var(--foreground-muted)] w-full text-left hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">
          Logout
        </button>
      </div>
    </aside>
  );
}
