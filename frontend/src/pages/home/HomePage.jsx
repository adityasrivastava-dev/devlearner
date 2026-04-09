import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/sidebar/Sidebar';
import TopicView from '../../components/editor/TopicView';
import ProblemSolveView from '../../components/editor/ProblemSolveView';
import DashboardPage from '../dashboard/DashboardPage';
import OnboardingFlow from '../onboarding/OnboardingFlow';
import { topicsApi, QUERY_KEYS } from '../../api';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [openProblemId,   setOpenProblemId]   = useState(null);
  const [theme,    setTheme]    = useState(() => localStorage.getItem('devlearn_theme')    || 'dark');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('devlearn_fontsize') || '14'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboarded,   setOnboarded]   = useState(() => !!localStorage.getItem('devlearn_onboarded'));
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Sync state from URL
  const fromParam = searchParams.get('from'); // 'problems' when opened from /problems
  useEffect(() => {
    const t = searchParams.get('topic');
    const p = searchParams.get('openProblem');
    const topicId   = t ? parseInt(t, 10)   : null;
    const problemId = p ? parseInt(p, 10)   : null;
    setSelectedTopicId(!topicId   || isNaN(topicId)   ? null : topicId);
    setOpenProblemId( !problemId  || isNaN(problemId) ? null : problemId);
  }, [searchParams]);

  // Fetch current topic (uses list cache as initialData)
  const { data: currentTopic } = useQuery({
    queryKey: QUERY_KEYS.topic(selectedTopicId),
    queryFn:  () => topicsApi.getById(selectedTopicId),
    enabled:  !!selectedTopicId,
    staleTime: 15 * 60 * 1000,
    initialData: () => {
      const cats = ['ALL','DSA','JAVA','ADVANCED_JAVA','SPRING_BOOT','SPRING',
                    'SPRING_MVC','SPRING_SECURITY','HIBERNATE','SPRING_DATA',
                    'MICROSERVICES','MYSQL','AWS','JAVASCRIPT'];
      for (const cat of cats) {
        const list = queryClient.getQueryData(QUERY_KEYS.topics(cat));
        if (Array.isArray(list)) {
          const found = list.find((t) => t.id === selectedTopicId);
          if (found) return found;
        }
      }
      return undefined;
    },
    initialDataUpdatedAt: () => {
      const state = queryClient.getQueryState(QUERY_KEYS.topics('ALL'));
      return state?.dataUpdatedAt ?? 0;
    },
  });

  // ── Is this a brand-new user? ────────────────────────────────────────────
  const isNewUser = !onboarded && (user?.solved ?? 0) === 0 && (user?.streak ?? 0) === 0;

  // ── Navigation helpers ───────────────────────────────────────────────────
  function selectTopic(id) {
    setSelectedTopicId(id);
    setOpenProblemId(null);
    setSearchParams(id ? { topic: id } : {});
  }
  function openProblem(id) {
    setOpenProblemId(id);
    if (selectedTopicId) setSearchParams({ topic: selectedTopicId, openProblem: id });
    window.history.replaceState({ from: 'topic' }, '');
  }
  function closeProblem() {
    if (fromParam === 'problems') {
      navigate('/problems');
    } else {
      setOpenProblemId(null);
      if (selectedTopicId) setSearchParams({ topic: selectedTopicId });
      else setSearchParams({});
    }
  }

  // ── Theme & font helpers ─────────────────────────────────────────────────
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('devlearn_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }
  function adjustFont(delta) {
    const sizes = [12, 13, 14, 15, 16, 18];
    const idx  = sizes.indexOf(fontSize);
    const next = sizes[Math.max(0, Math.min(sizes.length - 1, idx + delta))];
    setFontSize(next);
    localStorage.setItem('devlearn_fontsize', String(next));
  }

  const inProblemView = !!openProblemId;
  const showTopicView = !inProblemView && !!selectedTopicId;

  // ── Fullscreen problem view — no sidebar, like LeetCode ─────────────────
  if (inProblemView) {
    return (
      <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg)' }} data-theme={theme}>
        <ProblemSolveView
          problemId={openProblemId}
          topicTitle={currentTopic?.title}
          topicId={selectedTopicId}
          theme={theme}
          fontSize={fontSize}
          onBack={closeProblem}
          onStudyTopic={() => setOpenProblemId(null)}
          onFontChange={adjustFont}
          onThemeToggle={toggleTheme}
          currentTheme={theme}
        />
      </div>
    );
  }

  // ── Decide main content ──────────────────────────────────────────────────
  let mainContent;
  if (showTopicView) {
    mainContent = currentTopic ? (
      <TopicView
        topic={currentTopic}
        theme={theme}
        fontSize={fontSize}
        onProblemOpen={openProblem}
        onBack={() => selectTopic(null)}
      />
    ) : <TopicSkeleton />;
  } else if (isNewUser) {
    mainContent = <OnboardingFlow onComplete={() => setOnboarded(true)} />;
  } else {
    mainContent = <DashboardPage />;
  }

  return (
    <div className={styles.layout} data-theme={theme}>

      {/* Mobile top bar */}
      <div className={styles.mobileBar}>
        <button className={styles.hamburger} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          ☰
        </button>
        <span className={styles.mobileLogo}>⟨dev<span>learn</span>⟩</span>
        <button className={styles.themeToggle} onClick={toggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Sidebar — passes mobile props */}
      <Sidebar
        selectedTopicId={selectedTopicId}
        onTopicSelect={selectTopic}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <main className={styles.main}>
        {/* Desktop theme/font controls — only in topic/dashboard view */}
        {!inProblemView && (
          <div className={`${styles.floatingControls} desktop-only`}>
            <button className={styles.ctrlBtn} onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className={styles.ctrlBtn} onClick={() => adjustFont(-1)} title="Decrease font size">A−</button>
            <button className={styles.ctrlBtn} onClick={() => adjustFont(1)}  title="Increase font size">A+</button>
          </div>
        )}

        {mainContent}
      </main>
    </div>
  );
}

function TopicSkeleton() {
  return (
    <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 40, height: 20, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 160, height: 12 }} />
      </div>
      <div className="skeleton" style={{ width: '55%', height: 28, borderRadius: 6 }} />
      <div className="skeleton" style={{ width: '80%', height: 14 }} />
      <div className="skeleton" style={{ width: '70%', height: 14 }} />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ width: 130, height: 30, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 110, height: 30, borderRadius: 6 }} />
      </div>
    </div>
  );
}