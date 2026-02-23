import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { StudentSidebar } from './StudentSidebar';
import { Header } from './Header';

export default function StudentDashboardLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    
    if (isLoggedIn !== 'true') {
      navigate('/login');
      return;
    }

    // Redirect non-students to admin dashboard
    if (userRole !== 'STUDENT') {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
