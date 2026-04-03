import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../../components/sidebar/Sidebar';
import TopicView from '../../components/editor/TopicView';
import ProblemSolveView from '../../components/editor/ProblemSolveView';
import { topicsApi, QUERY_KEYS } from '../../api';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [openProblemId,   setOpenProblemId]   = useState(null);
  const [theme,    setTheme]    = useState(() => localStorage.getItem('devlearn_theme')    || 'dark');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('devlearn_fontsize') || '14'));
  const queryClient = useQueryClient();

  // ── BUG 3 FIX: Sync state on every URL change, not just mount ───────────
  // OLD: useEffect(fn, []) ran once on mount only.
  //      Browser back/forward changed the URL but React state stayed stale —
  //      old problem view stayed open, wrong topic was shown.
  // NEW: depend on searchParams so the effect re-runs whenever the URL changes,
  //      including back/forward navigation. Also guard parseInt against 'null'.
  useEffect(() => {
    const t = searchParams.get('topic');
    const p = searchParams.get('openProblem');
    const topicId   = t ? parseInt(t, 10) : null;
    const problemId = p ? parseInt(p, 10) : null;
    setSelectedTopicId(!topicId   || isNaN(topicId)   ? null : topicId);
    setOpenProblemId( !problemId  || isNaN(problemId)  ? null : problemId);
  }, [searchParams]); // ← run on every URL change, including browser back/forward

  // ── KEY FIX: use topic from list cache as initialData ─────────────────────
  // The topics list already contains ALL topic fields (story, analogy, etc.)
  // So we never need a separate /api/topics/:id call if the list is cached.
  // React Query will still run the query in background to refresh, but the
  // UI renders INSTANTLY from list cache — zero perceived latency.
  const { data: currentTopic, isLoading: topicLoading } = useQuery({
    queryKey: QUERY_KEYS.topic(selectedTopicId),
    queryFn:  () => topicsApi.getById(selectedTopicId),
    enabled:  !!selectedTopicId,
    staleTime: 15 * 60 * 1000, // 15 min cache — topics don't change often

    // Pull from the already-cached topic list instead of hitting the server
    initialData: () => {
      // Check all category caches — one of them will have this topic
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
    // Treat list data as fresh for 5 min — avoids background refetch on every click
    initialDataUpdatedAt: () => {
      const state = queryClient.getQueryState(QUERY_KEYS.topics('ALL'));
      return state?.dataUpdatedAt ?? 0;
    },
  });

  // ── Navigation helpers ────────────────────────────────────────────────────
  function selectTopic(id) {
    setSelectedTopicId(id);
    setOpenProblemId(null);
    setSearchParams(id ? { topic: id } : {});
  }

  function openProblem(id) {
    // Opening from topic view — no special back-navigation needed
    setOpenProblemId(id);
    if (selectedTopicId) setSearchParams({ topic: selectedTopicId, openProblem: id });
    // Clear 'from' state since we opened from topic view, not /problems
    window.history.replaceState({ from: 'topic' }, '');
  }

  function closeProblem() {
    setOpenProblemId(null);
    if (selectedTopicId) setSearchParams({ topic: selectedTopicId });
  }

  // ── Theme & font helpers ──────────────────────────────────────────────────
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('devlearn_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  function adjustFont(delta) {
    const sizes = [12, 13, 14, 15, 16, 18];
    const idx = sizes.indexOf(fontSize);
    const next = sizes[Math.max(0, Math.min(sizes.length - 1, idx + delta))];
    setFontSize(next);
    localStorage.setItem('devlearn_fontsize', String(next));
  }

  const inProblemView = !!openProblemId;

  return (
    <div className={styles.layout} data-theme={theme}>
      {/* Sidebar — always visible */}
      <Sidebar selectedTopicId={selectedTopicId} onTopicSelect={selectTopic} />

      {/* Main area */}
      <main className={styles.main}>

        {/* Theme + font controls — shown inside topicView only, not in PS view
            In PS view these live in the topbar's A-/A+ buttons already */}
        {!inProblemView && (
          <div className={styles.floatingControls}>
            <button className={styles.ctrlBtn} onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className={styles.ctrlBtn} onClick={() => adjustFont(-1)} title="Decrease font size">A−</button>
            <button className={styles.ctrlBtn} onClick={() => adjustFont(1)}  title="Increase font size">A+</button>
          </div>
        )}

        {inProblemView ? (
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
        ) : selectedTopicId ? (
          // Show topic immediately if we have data from cache,
          // or a skeleton while the first fetch completes
          currentTopic ? (
            <TopicView
              topic={currentTopic}
              theme={theme}
              fontSize={fontSize}
              onProblemOpen={openProblem}
            />
          ) : (
            <TopicSkeleton />
          )
        ) : (
          <WelcomeScreen />
        )}
      </main>
    </div>
  );
}

// ── Skeleton shown only on very first load before cache is warm ──────────────
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

// ── Welcome screen ────────────────────────────────────────────────────────────
function WelcomeScreen() {
  const tags = [
    'Binary Search','Dynamic Programming','Two Pointer','HashMap',
    'Java Streams','Multithreading','Spring Boot','System Design',
    'BFS / DFS','Graphs','Segment Tree','Microservices',
  ];
  return (
    <div className={styles.welcome}>
      <div className={styles.welcomeInner}>
        <div className={styles.welcomeLogo}>⟨devlearn⟩</div>
        <h2 className={styles.welcomeHead}>Your personal coding learning system</h2>
        <p className={styles.welcomeSub}>
          Pick a topic from the sidebar to start learning with stories, examples, and problems.
        </p>
        <div className={styles.welcomeTags}>
          {tags.map((t) => <span key={t} className={styles.welcomeTag}>{t}</span>)}
        </div>
        <div className={styles.welcomeStats}>
          {[
            ['📚','300+','Topics'],
            ['🎯','1200+','Problems'],
            ['⚡','Live','Code Judge'],
            ['🧠','SRS','Spaced Repetition'],
          ].map(([e, n, l]) => (
            <div key={l} className={styles.statItem}>
              <span style={{ fontSize: 22 }}>{e}</span>
              <strong>{n}</strong>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}