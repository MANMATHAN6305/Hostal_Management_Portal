import { useEffect, useState } from 'react';
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

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'STUDENT',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isSwitchEntering, setIsSwitchEntering] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<'login' | 'register' | null>(null);

  const persistSession = (session: {
    token?: string | null;
    userId?: string | number | null;
    email?: string | null;
    fullName?: string | null;
    role?: string | null;
    studentId?: string | number | null;
  }) => {
    const authKeys = ['isLoggedIn', 'token', 'authToken', 'accessToken', 'userId', 'userEmail', 'userName', 'userRole', 'studentId'];
    authKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', session.role || '');
    if (session.studentId) {
      localStorage.setItem('studentId', String(session.studentId));
    } else {
      localStorage.removeItem('studentId');
    }

    sessionStorage.setItem('token', session.token || '');
    sessionStorage.setItem('userId', session.userId ? String(session.userId) : '');
    sessionStorage.setItem('userName', session.fullName || '');
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
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
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

  useEffect(() => {
    if (sessionStorage.getItem('auth-page-switch') === '1') {
      const target = sessionStorage.getItem('auth-page-target');

      if (target === 'login' || target === 'register') {
        setTransitionTarget(target);
      }

      setIsSwitchEntering(true);
      sessionStorage.removeItem('auth-page-switch');
      sessionStorage.removeItem('auth-page-target');

      const timer = window.setTimeout(() => {
        setIsSwitchEntering(false);
      }, 450);

      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const fullName = searchParams.get('fullName');
    const role = searchParams.get('role');
    const studentId = searchParams.get('studentId');
    const error = searchParams.get('error');

    if (error) {
      const errorMessage =
        error === 'google_oauth_not_configured'
          ? 'Google Sign-in is not configured on the server'
          : error === 'google_auth_failed'
          ? 'Google authentication failed. Please try again or use email/password'
          : `Authentication error: ${decodeURIComponent(error)}`;
      setError(errorMessage);
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

      if (role === 'STUDENT') navigate('/student/dashboard');
      else if (role === 'WARDEN') navigate('/warden/dashboard');
      else if (role === 'STAFF') navigate('/staff/dashboard');
      else navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  const handleGoogleSignIn = () => {
    try {
      const url = getGoogleAuthUrl();
      console.log('Redirecting to Google OAuth:', url);
      window.location.assign(url);
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setError('Failed to initiate Google Sign-in. Please try again.');
    }
  };

  const handleSwitchPage = (to: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsExiting(true);
    setTransitionTarget(to === '/register' ? 'register' : 'login');
    sessionStorage.setItem('auth-page-switch', '1');
    sessionStorage.setItem('auth-page-target', to === '/register' ? 'register' : 'login');
    window.setTimeout(() => {
      navigate(to);
    }, 260);
  };

  return (
    <>
      <style>{`
        @keyframes oceanShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes curveFloat {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(18px, -18px, 0) rotate(8deg); }
        }
        .auth-ocean {
          background: linear-gradient(120deg, #042d63, #0a4d95, #0f63bb, #0a4d95);
          background-size: 260% 260%;
          animation: oceanShift 10s ease-in-out infinite;
        }
        .curve {
          position: absolute;
          border-radius: 999px;
          border: 10px solid rgba(150, 213, 255, 0.22);
          filter: blur(0.2px);
          animation: curveFloat 8s ease-in-out infinite;
        }
        .curve-a { width: 170px; height: 120px; top: 10%; left: 10%; animation-delay: -0.5s; }
        .curve-b { width: 230px; height: 150px; top: 18%; right: 12%; animation-delay: -2s; border-color: rgba(32, 163, 255, 0.22); }
        .curve-c { width: 180px; height: 120px; bottom: 18%; left: 20%; animation-delay: -1.2s; }
        .curve-d { width: 260px; height: 170px; bottom: 10%; right: 7%; animation-delay: -2.8s; border-color: rgba(144, 228, 255, 0.26); }
        .curve-e { width: 110px; height: 80px; top: 7%; left: 40%; animation-delay: -1.8s; }
        .curve-f { width: 120px; height: 90px; bottom: 28%; right: 30%; animation-delay: -3.2s; border-color: rgba(32, 163, 255, 0.18); }
        .glass-card {
          background: linear-gradient(145deg, rgba(10, 58, 117, 0.86), rgba(6, 37, 82, 0.86));
          border: 1px solid rgba(173, 223, 255, 0.25);
          box-shadow: 0 24px 55px rgba(2, 18, 42, 0.55);
          backdrop-filter: blur(8px);
        }
        .left-glass {
          background: linear-gradient(170deg, rgba(38, 133, 250, 0.58), rgba(9, 55, 125, 0.62));
        }
        .input-glass {
          background: rgba(5, 28, 62, 0.55);
          border: 1px solid rgba(151, 207, 255, 0.26);
          color: #eef7ff;
        }
        .input-glass::placeholder { color: rgba(211, 233, 255, 0.7); }
        .auth-title-3d {
          background: linear-gradient(180deg, #ffffff 0%, #d9eeff 55%, #8fd0ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 2px 0 rgba(17, 56, 103, 0.7), 0 6px 14px rgba(3, 18, 45, 0.45);
        }
        .auth-sub-3d {
          color: #d6ebff;
          text-shadow: 0 1px 0 rgba(19, 66, 120, 0.75), 0 4px 10px rgba(4, 20, 47, 0.35);
        }
      `}</style>
      <div className="auth-ocean relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6">
        <div className="pointer-events-none absolute inset-0">
          <span className="curve curve-a" />
          <span className="curve curve-b" />
          <span className="curve curve-c" />
          <span className="curve curve-d" />
          <span className="curve curve-e" />
          <span className="curve curve-f" />
        </div>

        <div className="relative z-10 w-full max-w-4xl">
          <section
            className={`glass-card auth-card-fade-in flex overflow-hidden rounded-[26px] ${
              isExiting
                ? transitionTarget === 'login'
                  ? 'auth-card-exit-left'
                  : 'auth-card-exit-right'
                : ''
            } ${
              isSwitchEntering
                ? transitionTarget === 'login'
                  ? 'auth-card-enter-from-right'
                  : 'auth-card-enter-from-left'
                : ''
            }`}
          >
            <div className="left-glass hidden min-h-[560px] md:flex md:w-[38%] flex-col items-center justify-center p-8 text-center text-white">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#071d3a]">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="#f5fbff" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="auth-title-3d mb-3 text-5xl font-black leading-[0.95]">Join Us!</h2>
              <p className="auth-sub-3d mb-2 text-2xl font-semibold">Create your account now</p>
              <p className="auth-sub-3d text-lg">And start managing your hostel operations</p>
            </div>

            <div className="w-full bg-[#071a34]/85 p-8 text-[#f3fbff] md:w-[62%] md:max-h-[calc(100vh-3rem)] md:overflow-y-auto md:p-12">
              <h1 className="mb-2 text-5xl font-bold">Create Account</h1>
              <p className="mb-6 text-2xl text-[#b9d4ef]">Register a new account to get started</p>

            {error && (
              <div className="mb-6 rounded-lg border border-red-300/70 bg-red-200/10 p-4 text-sm text-red-100" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#e7f4ff]" htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-glass w-full rounded-lg px-4 py-3 text-base outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#e7f4ff]" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-glass w-full rounded-lg px-4 py-3 text-base outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="username@gmail.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#e7f4ff]" htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input-glass w-full rounded-lg px-4 py-3 text-base outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-400/20"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="WARDEN">Warden</option>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#e7f4ff]" htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-glass w-full rounded-lg px-4 py-3 text-base outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-400/20"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#e7f4ff]" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-glass w-full rounded-lg px-4 py-3 text-base outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#053f80] px-4 py-3 font-semibold text-white transition-all hover:bg-[#0754a8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Get Started'
                )}
              </button>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#5d83ae]/35" />
                <span className="text-xs font-medium text-[#aacced]">or continue with</span>
                <span className="h-px flex-1 bg-[#5d83ae]/35" />
              </div>

              <button type="button" onClick={handleGoogleSignIn} className="input-glass flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 font-semibold text-[#e9f6ff] transition-all hover:bg-[#0b2a53]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#b6d3ef]">
              Already have an account?{' '}
              <Link to="/login" onClick={handleSwitchPage('/login')} className="font-semibold text-[#8fd2ff] hover:text-[#c2e6ff]">
                Sign in
              </Link>
            </p>
          </div>
          </section>
        </div>
      </div>
    </>
  );
}
