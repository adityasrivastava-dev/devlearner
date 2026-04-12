import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './Login.module.css';

const GOOGLE_OAUTH_URL = `${import.meta.env.VITE_API_URL || ''}/oauth2/authorization/google`;

// ── Feature flashcard data ────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '⟨/⟩',
    accent: '#6366f1',
    tag: 'What is this?',
    title: 'Interview Prep OS for Backend Engineers',
    body: 'Not another LeetCode clone. DevLearner is a structured system built for developers with production experience who want to recall patterns, drill code under pressure, and walk into MAANG interviews with confidence.',
    stat: ['Java · DSA · Spring · System Design', null],
  },
  {
    icon: '🎯',
    accent: '#4ade80',
    tag: 'Learning System',
    title: 'Gate-Based Topic Mastery',
    body: 'Every topic has five stages: Theory → Easy → Medium → Hard → Mastered. You can\'t skip stages. Write a theory note to unlock Easy problems. Solve 3 Easy to unlock Medium. Progress is locked-in, not self-reported.',
    stat: ['300+ topics across 8 categories', null],
  },
  {
    icon: '⏱',
    accent: '#f59e0b',
    tag: 'Interview Mode',
    title: 'Simulate a Real Technical Interview',
    body: 'Pick a difficulty (20 / 35 / 45 min). Write your approach first — coding is locked until you explain your plan. No hints. Clock turns red in the last minute. Auto-submits on timeout. Scorecard shows exactly where you lost time.',
    stat: ['Approach-first', 'No hints available'],
  },
  {
    icon: '🧠',
    accent: '#a78bfa',
    tag: 'Memory Science',
    title: 'Spaced Repetition Built In',
    body: 'The SM-2 algorithm schedules topics and problems for review at the exact moment you\'re about to forget them. Rate each card: Forgot / Hard / Got it / Easy. The harder you found it, the sooner it comes back.',
    stat: ['Based on SM-2 algorithm', 'Proven in 50 years of research'],
  },
  {
    icon: '📊',
    accent: '#fb923c',
    tag: 'Performance Analytics',
    title: 'Know Exactly Where You Are Weak',
    body: 'Confidence scores per topic derived from your actual submissions — not self-assessment. Weak areas, strong areas, error breakdown (Wrong Answer / Compile Error / TLE), and a mistake journal of every wrong submission you\'ve ever made.',
    stat: ['Real data from your submissions', null],
  },
  {
    icon: '∑',
    accent: '#38bdf8',
    tag: 'Algorithm Library',
    title: '70+ Algorithms with Story-Driven Theory',
    body: 'Every algorithm has: a one-sentence analogy, a narrative story with a character, step-by-step walkthrough, Java code, complexity analysis, real-world use cases, common pitfalls, and a visualization blueprint. No dry definitions.',
    stat: ['18 categories', 'A01–A18 seed files'],
  },
  {
    icon: '⚡',
    accent: '#f472b6',
    tag: 'Complexity Analyzer',
    title: 'Paste Java Code → Get Big-O Instantly',
    body: 'Static analysis (not AI guessing) reads your code\'s loop structure, recursion depth, and sorting calls to give you time and space complexity with a confidence score. Green O(1) to red O(2ⁿ) — see which part of your code is the bottleneck.',
    stat: ['Real static analysis', 'HIGH / MEDIUM / LOW confidence'],
  },
  {
    icon: '🔥',
    accent: '#f87171',
    tag: 'Habit Engine',
    title: 'Streak, XP, and Levels that Mean Something',
    body: 'Daily streak tracks actual learning activity, not just logins. Earn pause days from long streaks to protect your count. XP flows from submissions and reviews. Level up from Beginner to Architect. GitHub-style heatmap shows your consistency.',
    stat: ['Pause days protect your streak', 'Beginner → Architect levels'],
  },
  {
    icon: '📋',
    accent: '#34d399',
    tag: 'Interview Q&A',
    title: 'Curated Q&A Bank + Timed Revision',
    body: 'Filter 500+ questions by category (Java, DSA, Spring, SQL, AWS) and difficulty. Each answer has key points and code examples. Revision Mode: pick categories, set a timer (10/20/30 min), reveal-and-rate each answer, get a scored report.',
    stat: ['Java · DSA · Spring · SQL · AWS', 'Reveal-and-rate format'],
  },
  {
    icon: '◉',
    accent: '#818cf8',
    tag: 'Mastery Map',
    title: 'See Your Entire Knowledge at a Glance',
    body: 'A visual grid of every topic coloured by your gate stage. Grey = untouched, blue → amber → orange → green as you progress. Grouped by category with mastered/in-progress/not-started counts. One click to go directly to any topic.',
    stat: ['All topics in one view', null],
  },
];

// ── Flashcard panel ───────────────────────────────────────────────────────────
function FeaturePanel() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next'); // 'next' | 'prev'

  const goTo = useCallback((idx, dir = 'next') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setAnimating(false);
    }, 280);
  }, [animating]);

  const next = useCallback(() => goTo((active + 1) % FEATURES.length, 'next'), [active, goTo]);
  const prev = useCallback(() => goTo((active - 1 + FEATURES.length) % FEATURES.length, 'prev'), [active, goTo]);

  // Auto-advance every 5 s, pause on hover
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
  }, [active, paused, next]);

  const f = FEATURES[active];

  return (
    <div
      className={styles.featurePanel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top brand line */}
      <div className={styles.fpBrand}>
        <span className={styles.fpBrandIcon}>⟨/⟩</span>
        <span className={styles.fpBrandName}>devlearn</span>
      </div>

      {/* Card */}
      <div
        className={`${styles.fpCard} ${animating ? (direction === 'next' ? styles.exitLeft : styles.exitRight) : styles.enterActive}`}
        style={{ '--card-accent': f.accent }}
      >
        <div className={styles.fpTag} style={{ color: f.accent, borderColor: f.accent + '44', background: f.accent + '12' }}>
          {f.tag}
        </div>
        <div className={styles.fpIcon} style={{ color: f.accent }}>{f.icon}</div>
        <h2 className={styles.fpTitle}>{f.title}</h2>
        <p className={styles.fpBody}>{f.body}</p>
        {(f.stat[0] || f.stat[1]) && (
          <div className={styles.fpStats}>
            {f.stat.filter(Boolean).map((s) => (
              <span key={s} className={styles.fpStat} style={{ borderColor: f.accent + '33', color: f.accent }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={styles.fpControls}>
        <button className={styles.fpArrow} onClick={prev} aria-label="previous">‹</button>
        <div className={styles.fpDots}>
          {FEATURES.map((_, i) => (
            <button
              key={i}
              className={`${styles.fpDot} ${i === active ? styles.fpDotActive : ''}`}
              style={i === active ? { background: f.accent } : {}}
              onClick={() => goTo(i, i > active ? 'next' : 'prev')}
              aria-label={`Go to feature ${i + 1}`}
            />
          ))}
        </div>
        <button className={styles.fpArrow} onClick={next} aria-label="next">›</button>
      </div>

      {/* Progress bar */}
      {!paused && (
        <div className={styles.fpProgress}>
          <div
            key={active}
            className={styles.fpProgressFill}
            style={{ '--fill-color': f.accent }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const oauthToken = searchParams.get('token');
    const oauthError = searchParams.get('error');
    if (oauthError) { toast.error('Google login failed. Please try again.'); return; }
    if (!oauthToken) return;

    const prevToken = localStorage.getItem('devlearn_token');
    localStorage.setItem('devlearn_token', oauthToken);

    authApi.check()
      .then((data) => {
        saveAuth(oauthToken, {
          id: data.id, name: data.name, email: data.email,
          role: data.role, roles: data.roles || [],
          avatar: data.avatarUrl || data.avatar || '',
          streak: data.streakDays ?? 0, solved: data.problemsSolved ?? 0,
        });
        toast.success(`Welcome, ${data.name}!`);
        navigate('/', { replace: true });
      })
      .catch(() => {
        if (prevToken) localStorage.setItem('devlearn_token', prevToken);
        else localStorage.removeItem('devlearn_token');
        toast.error('Google login failed — please try again.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!form.name)               { toast.error('Name required'); return; }
    if (!form.email)              { toast.error('Email required'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
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

  const GoogleSVG = () => (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );

  return (
    <div className={styles.shell}>
      <div className={styles.grid} />

      <div className={styles.layout}>
        {/* ── Left: feature flashcards ── */}
        <FeaturePanel />

        {/* ── Right: auth form ── */}
        <div className={styles.authPanel}>
          <div className={styles.card}>
            {/* Logo — visible only on mobile (left panel hidden) */}
            <div className={styles.mobileLogoWrap}>
              <div className={styles.logoIcon}>⟨/⟩</div>
              <div className={styles.logoText}>dev<span>learn</span></div>
              <div className={styles.logoSub}>Master Java · DSA · System Design</div>
            </div>

            {/* Stats pills */}
            <div className={styles.pills}>
              {['300+ Topics', '1200+ Problems', 'Live Code Judge', 'SM-2 Reviews'].map((p) => (
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
                <a href={GOOGLE_OAUTH_URL} className={styles.googleBtn}>
                  <GoogleSVG />
                  Continue with Google
                </a>
                <div className={styles.divider}><span>or sign in with email</span></div>
                <div className={styles.field}>
                  <label>Email</label>
                  <input type="email" className="input" placeholder="you@example.com"
                    value={form.email} onChange={set('email')}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                    autoComplete="email" />
                </div>
                <div className={styles.field}>
                  <label>Password</label>
                  <input type="password" className="input" placeholder="Enter your password"
                    value={form.password} onChange={set('password')}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                    autoComplete="current-password" />
                </div>
                <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
                  {loading ? <><span className="spinner" />Signing in…</> : 'Sign In →'}
                </button>
              </form>
            )}

            {/* Register form */}
            {tab === 'register' && (
              <form className={styles.form} onSubmit={handleRegister}>
                <a href={GOOGLE_OAUTH_URL} className={styles.googleBtn}>
                  <GoogleSVG />
                  Sign up with Google
                </a>
                <div className={styles.divider}><span>or create with email</span></div>
                <div className={styles.field}>
                  <label>Full Name</label>
                  <input type="text" className="input" placeholder="Your name"
                    value={form.name} onChange={set('name')} autoComplete="name" />
                </div>
                <div className={styles.field}>
                  <label>Email</label>
                  <input type="email" className="input" placeholder="you@example.com"
                    value={form.email} onChange={set('email')} autoComplete="email" />
                </div>
                <div className={styles.field}>
                  <label>Password</label>
                  <input type="password" className="input" placeholder="At least 6 characters"
                    value={form.password} onChange={set('password')}
                    autoComplete="new-password" />
                  {form.password && (
                    <div className={styles.strength}>
                      <div className={styles.strengthBar} data-level={
                        form.password.length < 6 ? 'weak'
                        : form.password.length >= 8 && /[A-Z]/.test(form.password) && /\d/.test(form.password)
                          ? 'strong' : 'medium'
                      } />
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
      </div>
    </div>
  );
}
