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
  const [isExiting, setIsExiting] = useState(false);
  const [isSwitchEntering, setIsSwitchEntering] = useState(false);

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

  useEffect(() => {
    if (sessionStorage.getItem('auth-page-switch') === '1') {
      setIsSwitchEntering(true);
      sessionStorage.removeItem('auth-page-switch');

      const timer = window.setTimeout(() => {
        setIsSwitchEntering(false);
      }, 450);

      return () => window.clearTimeout(timer);
    }
  }, []);

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

  const handleSwitchPage = (to: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsExiting(true);
    sessionStorage.setItem('auth-page-switch', '1');
    window.setTimeout(() => {
      navigate(to);
    }, 260);
  };

  const renderWelcomeLetters = (text: string) =>
    text.split('').map((char, index) => (
      <span
        key={`${char}-${index}`}
        className="login-welcome-letter"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));

  return (
    <div className="login-cyber-shell min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="login-cyber-vignette" />
      <span className="login-particle login-particle-1" aria-hidden="true" />
      <span className="login-particle login-particle-2" aria-hidden="true" />
      <span className="login-particle login-particle-3" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-center">
        <section className={`auth-flat-card auth-flat-float auth-flat-enter w-full max-w-4xl ${isExiting ? 'auth-flat-switch-exit' : ''} ${isSwitchEntering ? 'auth-flat-switch-enter' : ''}`}>
          <span className="login-neon-line login-neon-line-top" />
          <span className="login-neon-line login-neon-line-right" />
          <span className="login-neon-line login-neon-line-bottom" />
          <span className="login-neon-line login-neon-line-left" />

          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8">
              <h1 className="login-title text-3xl font-semibold">Login</h1>

              {error && (
                <div className="mt-4 rounded-xl border border-red-400/70 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                <label className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="8" r="4" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="login-input"
                    placeholder="Username"
                    required
                  />
                </label>

                <label className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <rect x="4" y="10" width="16" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="login-input"
                    placeholder="Password"
                    required
                  />
                </label>

                <button type="submit" disabled={loading} className="login-submit-btn">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z" />
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    'Login'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="login-google-btn"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-cyan-100/80">
                Don&apos;t have an account?{' '}

                <Link to="/register" onClick={handleSwitchPage('/register')} className="font-medium text-cyan-300 hover:text-cyan-200">
                  Register
                </Link>
              </p>
            </div>

            <aside className="login-welcome-panel">
              <p className="login-kicker">Secure Access</p>
              <h2 className="login-welcome-title">{renderWelcomeLetters('WELCOME BACK!')}</h2>
              <p className="login-welcome-copy">
                Enter your credentials and step into your control hub.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
