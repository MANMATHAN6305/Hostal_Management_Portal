import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';

const getGoogleAuthUrl = () => {
  const apiBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
    'https://hostel-portal-backend.onrender.com/api';
  return `${apiBase.replace(/\/+$/, '')}/auth/google`;
};

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    staffRole: 'ELECTRICIAN',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const persistSession = (session: {
    token?: string | null;
    userId?: string | number | null;
    email?: string | null;
    fullName?: string | null;
    role?: string | null;
    studentId?: string | number | null;
  }) => {
    localStorage.clear();
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('token', session.token || '');
    localStorage.setItem('userId', session.userId ? String(session.userId) : '');
    localStorage.setItem('userEmail', session.email || '');
    localStorage.setItem('userName', session.fullName || '');
    localStorage.setItem('userRole', session.role || '');
    if (session.studentId) {
      localStorage.setItem('studentId', String(session.studentId));
    } else {
      localStorage.removeItem('studentId');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.register({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        staffRole: formData.role === 'STAFF' ? formData.staffRole : undefined,
      });

      if (response.success) {
        persistSession({
          token: response.token,
          userId: response.userId,
          email: response.email,
          fullName: response.fullName,
          role: response.role,
          studentId: response.studentId
        });
        
        if (response.role === 'STUDENT') navigate('/student/dashboard');
        else if (response.role === 'WARDEN') navigate('/warden/dashboard');
        else if (response.role === 'STAFF') navigate('/staff/dashboard');
        else navigate('/dashboard');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Start OAuth through backend; it will redirect to Google, then back to /login.
    window.location.assign(getGoogleAuthUrl());
  };

  const fieldClass =
    'w-full h-14 rounded-lg border border-white/75 bg-white/92 px-4 text-base text-gray-900 placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/80 appearance-none';

  const selectClass =
    'w-full h-14 rounded-lg border border-white/75 bg-white/92 px-4 pr-10 text-base text-gray-900 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/80 appearance-none cursor-pointer';

  return (
    <div className="min-h-screen flex items-center">
      <div
        className="relative mx-auto w-screen min-h-screen overflow-y-auto border-2 border-white/80 shadow-[0_18px_48px_rgba(0,0,0,0.5)]"
        style={{
          backgroundImage: 'url(/bit-login-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/15"/>

        <div className="relative min-h-screen">
          <div className="px-7 pt-16 sm:px-12 md:pt-20 lg:pt-0 lg:absolute lg:left-[7%] lg:top-1/2 lg:-translate-y-1/2">
            <h1
              className="text-white text-7xl sm:text-8xl leading-tight"
              style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
            >
              Welcome to Our
            </h1>
            <h2
              className="mt-2 text-white text-7xl sm:text-8xl leading-none"
              style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
            >
              BIT Hostels
            </h2>
          </div>

          <div className="mx-4 mt-10 rounded-[20px] border-2 border-white/70 bg-white/34 p-6 font-sans backdrop-blur-[3px] sm:mx-8 sm:p-8 lg:absolute lg:bottom-8 lg:right-8 lg:top-8 lg:mt-0 lg:w-[38%] lg:min-w-[360px] lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:p-9">
            <div className="mb-3 text-center">
              <h3 className="text-3xl font-semibold text-white drop-shadow">Create Account</h3>
              <p className="mt-2 text-sm text-white/95">Join our hostel community</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={fieldClass}
                style={{ lineHeight: '3.5rem' }}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={fieldClass}
                style={{ lineHeight: '3.5rem' }}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-white mb-2">
                Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={selectClass}
                style={{ lineHeight: '3.5rem' }}
              >
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
                <option value="WARDEN">Warden</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {formData.role === 'STAFF' && (
              <div>
                <label htmlFor="staffRole" className="block text-sm font-semibold text-white mb-2">
                  Staff Type
                </label>
                <select
                  id="staffRole"
                  name="staffRole"
                  value={formData.staffRole}
                  onChange={handleChange}
                  className={selectClass}
                  style={{ lineHeight: '3.5rem' }}
                >
                  <option value="ELECTRICIAN">Electrician</option>
                  <option value="CLEANER">Room Cleaner</option>
                  <option value="CARETAKER">Caretaker</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={fieldClass}
                style={{ lineHeight: '3.5rem' }}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={fieldClass}
                style={{ lineHeight: '3.5rem' }}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1f2f3a] px-4 py-3 font-semibold text-white transition-all hover:bg-[#16232c] focus:outline-none focus:ring-2 focus:ring-white/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/65"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-white">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-white/70 bg-white/92 px-4 py-3 font-medium text-gray-800 transition-colors hover:bg-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </form>

          <p className="mt-6 text-center text-white">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#152532] underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
