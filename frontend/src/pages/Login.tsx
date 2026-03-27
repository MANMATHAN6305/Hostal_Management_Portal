import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/lib/api';

const getGoogleAuthUrl = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const fallbackApiBase = hostname.endsWith('.onrender.com')
    ? `${protocol}//${hostname.replace('-portal.', '-backend.').replace('-frontend.', '-backend.')}/api`
    : 'https://hostal-management-backend.onrender.com/api';

  const apiBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
    fallbackApiBase;
  const authUrl = new URL(`${apiBase}/auth/google`);
  authUrl.searchParams.set('redirect_origin', window.location.origin);
  return authUrl.toString();
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

  // Handle Google OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const fullName = searchParams.get('fullName');
    const role = searchParams.get('role');
    const studentId = searchParams.get('studentId');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (token && userId) {
      persistSession({
        token,
        userId,
        email,
        fullName,
        role,
        studentId
      });

      if (role === 'STUDENT') navigate('/student/dashboard', { replace: true });
      else if (role === 'WARDEN') navigate('/warden/dashboard', { replace: true });
      else if (role === 'STAFF') navigate('/staff/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(formData.email, formData.password);
      
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
        setError(response.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Start OAuth through backend; it will redirect to Google, then back to /login.
    window.location.assign(getGoogleAuthUrl());
  };

  const fieldClass =
    'w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <section className="hidden lg:block pr-8">
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--foreground-muted)]">BIT Hostel Portal</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Simple and focused hostel management.</h1>
          <p className="mt-4 text-sm text-[var(--foreground-muted)] max-w-md">
            Sign in to continue to your dashboard, manage allocations, and stay updated with hostel operations.
          </p>
        </section>

        <section className="minimal-panel w-full max-w-md mx-auto p-6 sm:p-7">
          <div className="mb-6 text-left">
            <h2 className="text-2xl font-semibold">Sign In</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">Access your hostel portal account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border border-red-300/70 bg-red-50/60 text-red-700 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={fieldClass}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[var(--foreground)]">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={fieldClass}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-[var(--foreground-muted)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
                />
                <span className="ml-2">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md border border-[var(--primary)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--surface)] text-[var(--foreground-muted)]">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
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

          <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline">
              Register here
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
