import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Admin';
    const email = localStorage.getItem('userEmail') || '';
    setUserName(name);
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">College Hostel Management Portal</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{userName}</p>
          {userEmail && <p className="text-xs text-slate-500">{userEmail}</p>}
        </div>
        <div className="relative group">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-200 transition-colors">
            <span className="text-sm font-medium text-emerald-600">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="py-2">
              <Link to="/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
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
