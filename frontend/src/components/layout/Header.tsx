import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Admin';
    const email = localStorage.getItem('userEmail') || '';
    const role = localStorage.getItem('userRole') || '';
    setUserName(name);
    setUserEmail(email);
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700';
      case 'WARDEN': return 'bg-blue-100 text-blue-700';
      case 'STAFF': return 'bg-yellow-100 text-yellow-700';
      case 'STUDENT': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-sm md:text-lg font-semibold text-gray-800 truncate">College Hostel Portal</h2>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-800">{userName}</p>
            {userRole && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(userRole)}`}>
                {userRole}
              </span>
            )}
          </div>
          {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
        </div>
        <div className="relative group">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
            <span className="text-sm font-medium text-gray-700">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="py-2">
              <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                🏠 Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
