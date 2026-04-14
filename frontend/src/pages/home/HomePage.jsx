import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/sidebar/Sidebar';
import TopicView from '../../components/editor/TopicView';
import TopicBrowser from './TopicBrowser';
import ProblemSolveView from '../../components/editor/ProblemSolveView';
import DashboardPage from '../dashboard/DashboardPage';
import OnboardingFlow from '../onboarding/OnboardingFlow';
import { topicsApi, QUERY_KEYS } from '../../api';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [theme,    setTheme]    = useState(() => localStorage.getItem('devlearn_theme')    || 'dark');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('devlearn_fontsize') || '14'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboarded,   setOnboarded]   = useState(() => !!localStorage.getItem('devlearn_onboarded'));
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Read state from URL params
  const selectedTopicId  = (() => { const v = searchParams.get('topic');    const n = parseInt(v, 10); return v && !isNaN(n) ? n : null; })();
  const selectedCategory = searchParams.get('category') || null;
  const openProblemId    = (() => { const v = searchParams.get('openProblem'); const n = parseInt(v, 10); return v && !isNaN(n) ? n : null; })();
  const fromParam        = searchParams.get('from');

  // Roadmap context (set when navigating from a roadmap's "Open →" button)
  const rmId         = searchParams.get('rmId') ? parseInt(searchParams.get('rmId'), 10) : null;
  const rmName       = searchParams.get('rmName') ? decodeURIComponent(searchParams.get('rmName')) : null;
  const rmTopicsRaw  = searchParams.get('rmTopics') || null;
  const rmTopics     = rmTopicsRaw ? rmTopicsRaw.split(',').map(Number).filter(Boolean) : null;

  // Fetch topic list for the current category (used for prev/next nav when NOT in roadmap mode)
  const { data: topicList = [] } = useQuery({
    queryKey: QUERY_KEYS.topics(selectedCategory || 'ALL'),
    queryFn:  () => topicsApi.getAll(selectedCategory || 'ALL'),
    staleTime: 5 * 60 * 1000,
    enabled:  !!selectedTopicId && !rmTopics,
  });

  // Compute adjacent topic IDs — prefer roadmap order when available
  const currentTopicIndex = topicList.findIndex((t) => t.id === selectedTopicId);
  const prevTopicId = (() => {
    if (rmTopics && selectedTopicId) {
      const idx = rmTopics.indexOf(selectedTopicId);
      return idx > 0 ? rmTopics[idx - 1] : null;
    }
    return currentTopicIndex > 0 ? topicList[currentTopicIndex - 1].id : null;
  })();
  const nextTopicId = (() => {
    if (rmTopics && selectedTopicId) {
      const idx = rmTopics.indexOf(selectedTopicId);
      return idx >= 0 && idx < rmTopics.length - 1 ? rmTopics[idx + 1] : null;
    }
    return currentTopicIndex >= 0 && currentTopicIndex < topicList.length - 1
      ? topicList[currentTopicIndex + 1].id : null;
  })();

  // Fetch full topic when a topic is selected
  const { data: currentTopic } = useQuery({
    queryKey: QUERY_KEYS.topic(selectedTopicId),
    queryFn:  () => topicsApi.getById(selectedTopicId),
    enabled:  !!selectedTopicId,
    staleTime: 15 * 60 * 1000,
    initialData: () => {
      const cats = ['ALL', 'DSA', 'JAVA', 'ADVANCED_JAVA', 'SPRING_BOOT', 'SPRING',
                    'SPRING_MVC', 'SPRING_SECURITY', 'HIBERNATE', 'SPRING_DATA',
                    'MICROSERVICES', 'MYSQL', 'AWS', 'JAVASCRIPT',
                    'SYSTEM_DESIGN', 'TESTING'];
      for (const cat of cats) {
        const list = queryClient.getQueryData(QUERY_KEYS.topics(cat));
        if (Array.isArray(list)) {
          const found = list.find((t) => t.id === selectedTopicId);
          if (found) return found;
        }
      }
      return undefined;
    },
    // Always treat list-cache data as stale so getById always fires for full content
    initialDataUpdatedAt: () => 0,
  });

  // ── Is this a brand-new user? ────────────────────────────────────────────
  const isNewUser = !onboarded && (user?.solved ?? 0) === 0 && (user?.streak ?? 0) === 0;

  // ── Navigation helpers ───────────────────────────────────────────────────
  function selectTopic(id) {
    const params = { topic: id };
    if (selectedCategory) params.category = selectedCategory;
    // Preserve roadmap context when navigating prev/next within a roadmap
    if (rmId) {
      params.rmId = String(rmId);
      if (rmTopicsRaw) params.rmTopics = rmTopicsRaw;
      if (rmName) params.rmName = encodeURIComponent(rmName);
    }
    setSearchParams(params);
  }

  function openProblem(id) {
    const params = { openProblem: id };
    if (selectedTopicId) params.topic = selectedTopicId;
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params);
    window.history.replaceState({ from: 'topic' }, '');
  }

  function closeProblem() {
    if (fromParam === 'problems') {
      navigate('/problems');
    } else {
      const params = {};
      if (selectedTopicId) params.topic = selectedTopicId;
      if (selectedCategory) params.category = selectedCategory;
      setSearchParams(params);
    }
  }

  function goBackFromTopic() {
    // If we came from a roadmap, navigate back to it
    if (rmId) {
      navigate(`/roadmap?rmId=${rmId}`);
      return;
    }
    if (selectedCategory) {
      setSearchParams({ category: selectedCategory });
    } else {
      setSearchParams({});
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

  // ── Fullscreen problem view ──────────────────────────────────────────────
  if (openProblemId) {
    return (
      <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg)' }} data-theme={theme}>
        <ProblemSolveView
          problemId={openProblemId}
          topicTitle={currentTopic?.title}
          topicId={selectedTopicId}
          theme={theme}
          fontSize={fontSize}
          onBack={closeProblem}
          onStudyTopic={() => setSearchParams(selectedTopicId ? { topic: selectedTopicId } : {})}
          onFontChange={adjustFont}
          onThemeToggle={toggleTheme}
          currentTheme={theme}
        />
      </div>
    );
  }

  // ── Decide main content ──────────────────────────────────────────────────
  let mainContent;
  if (selectedTopicId) {
    mainContent = currentTopic ? (
      <TopicView
        topic={currentTopic}
        theme={theme}
        fontSize={fontSize}
        onProblemOpen={openProblem}
        onBack={goBackFromTopic}
        backLabel={rmName ? `← ${rmName}` : '← Home'}
        onPrev={prevTopicId ? () => selectTopic(prevTopicId) : null}
        onNext={nextTopicId ? () => selectTopic(nextTopicId) : null}
      />
    ) : <TopicSkeleton />;
  } else if (selectedCategory) {
    mainContent = (
      <TopicBrowser
        category={selectedCategory}
        onTopicSelect={selectTopic}
      />
    );
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

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <main className={styles.main}>
        {/* Desktop theme/font controls */}
        <div className={`${styles.floatingControls} desktop-only`}>
          <button className={styles.ctrlBtn} onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className={styles.ctrlBtn} onClick={() => adjustFont(-1)} title="Decrease font size">A−</button>
          <button className={styles.ctrlBtn} onClick={() => adjustFont(1)}  title="Increase font size">A+</button>
        </div>

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
