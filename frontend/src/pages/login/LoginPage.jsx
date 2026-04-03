import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './Login.module.css';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleLogin(e) {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      const data = await authApi.login(form.email, form.password);
      saveAuth(data.token, {
        id: data.id, name: data.name, email: data.email,
        role: data.role, roles: data.roles || [], avatar: data.avatarUrl || '',
        streak: data.streakDays || 0, solved: data.problemsSolved || 0,
      });
      toast.success(`Welcome back, ${data.name}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!form.name)              { toast.error('Name required'); return; }
    if (!form.email)             { toast.error('Email required'); return; }
    if (form.password.length < 6){ toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const data = await authApi.register(form.name, form.email, form.password);
      saveAuth(data.token, {
        id: data.id, name: data.name, email: data.email,
        role: data.role, roles: data.roles || [], avatar: data.avatarUrl || '',
        streak: 0, solved: 0,
      });
      toast.success(`Account created! Welcome, ${data.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.shell}>
      {/* Background grid */}
      <div className={styles.grid} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>⟨/⟩</div>
          <div className={styles.logoText}>
            dev<span>learn</span>
          </div>
          <div className={styles.logoSub}>Master Java · DSA · System Design</div>
        </div>

        {/* Stats pills */}
        <div className={styles.pills}>
          {['300+ Topics', '1200+ Problems', 'Live Code Judge', 'Spaced Repetition'].map((p) => (
            <span key={p} className={styles.pill}>{p}</span>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${tab === 'login' ? styles.active : ''}`}
            onClick={() => setTab('login')}
          >Sign In</button>
          <button
            className={`${styles.tabBtn} ${tab === 'register' ? styles.active : ''}`}
            onClick={() => setTab('register')}
          >Create Account</button>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form className={styles.form} onSubmit={handleLogin}>
            {/* Google OAuth */}
            <a href="/oauth2/authorization/google" className={styles.googleBtn}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </a>

            <div className={styles.divider}><span>or sign in with email</span></div>

            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={set('email')}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                autoComplete="email"
              />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input
                type="password" className="input" placeholder="Enter your password"
                value={form.password} onChange={set('password')}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? <><span className="spinner" />Signing in…</> : 'Sign In →'}
            </button>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form className={styles.form} onSubmit={handleRegister}>
            <a href="/oauth2/authorization/google" className={styles.googleBtn}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Sign up with Google
            </a>

            <div className={styles.divider}><span>or create with email</span></div>

            <div className={styles.field}>
              <label>Full Name</label>
              <input
                type="text" className="input" placeholder="Your name"
                value={form.name} onChange={set('name')} autoComplete="name"
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={set('email')} autoComplete="email"
              />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input
                type="password" className="input" placeholder="At least 6 characters"
                value={form.password} onChange={set('password')}
                autoComplete="new-password"
              />
              {form.password && (
                <div className={styles.strength}>
                  <div
                    className={styles.strengthBar}
                    data-level={
                      form.password.length < 6 ? 'weak'
                      : form.password.length >= 8 && /[A-Z]/.test(form.password) && /\d/.test(form.password)
                        ? 'strong' : 'medium'
                    }
                  />
                </div>
              )}
            </div>

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? <><span className="spinner" />Creating account…</> : 'Create Account →'}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <a href="/">← Back to app</a>
          <span>·</span>
          <span>By signing in you agree to learn a lot</span>
        </div>
      </div>
    </div>
  );
}
