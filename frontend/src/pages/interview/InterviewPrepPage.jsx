import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { interviewApi, QUERY_KEYS } from '../../api';
import { QUESTIONS as STATIC_QUESTIONS, CATEGORY_META } from './interviewData';
import styles from './InterviewPrepPage.module.css';

function normalise(q) {
  let kp = q.keyPoints;
  if (typeof kp === 'string') {
    try { kp = JSON.parse(kp); } catch { kp = kp ? [kp] : []; }
  }
  return { ...q, id: q.id ?? q.id, keyPoints: kp || [] };
}

export default function InterviewPrepPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [difficulty,     setDifficulty]     = useState('ALL');
  const [search,         setSearch]         = useState('');
  const [openId,         setOpenId]         = useState(null);

  const { data: dbQuestions = [] } = useQuery({
    queryKey: QUERY_KEYS.interviewQuestions,
    queryFn:  () => interviewApi.getAll(),
    staleTime: 5 * 60_000,
  });

  const QUESTIONS = useMemo(
    () => dbQuestions.length > 0 ? dbQuestions.map(normalise) : STATIC_QUESTIONS,
    [dbQuestions]
  );

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const q of QUESTIONS) {
      counts[q.category] = (counts[q.category] || 0) + 1;
    }
    return counts;
  }, [QUESTIONS]);

  const filtered = useMemo(() => {
    return QUESTIONS.filter((q) => {
      if (activeCategory !== 'ALL' && q.category !== activeCategory) return false;
      if (difficulty !== 'ALL' && q.difficulty !== difficulty) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (!q.question.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [QUESTIONS, activeCategory, difficulty, search]);

  // Group by category for display when ALL is selected
  const grouped = useMemo(() => {
    if (activeCategory !== 'ALL') return { [activeCategory]: filtered };
    const map = {};
    for (const q of filtered) {
      if (!map[q.category]) map[q.category] = [];
      map[q.category].push(q);
    }
    return map;
  }, [activeCategory, filtered]);

  const categoryOrder = activeCategory === 'ALL'
    ? Object.keys(CATEGORY_META)
    : [activeCategory];

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.heading}>Interview Prep</h1>
          <span className={styles.count}>{filtered.length} questions</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.revisionLink} onClick={() => navigate('/revision')}>
            ⏱ 30-Min Revision →
          </button>
        </div>
      </div>

      {/* ── Category tabs ────────────────────────────────────────────────── */}
      <div className={styles.catBar}>
        <button
          className={`${styles.catBtn} ${activeCategory === 'ALL' ? styles.catActive : ''}`}
          onClick={() => setActiveCategory('ALL')}
        >
          All
          <span className={styles.catCount}>{QUESTIONS.length}</span>
        </button>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <button
            key={key}
            className={`${styles.catBtn} ${activeCategory === key ? styles.catActive : ''}`}
            style={activeCategory === key ? { borderBottomColor: meta.color, color: meta.color } : {}}
            onClick={() => setActiveCategory(key)}
          >
            <span>{meta.icon}</span>
            {meta.label}
            <span className={styles.catCount}>{categoryCounts[key] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className={styles.diffPills}>
          {['ALL', 'HIGH', 'MEDIUM'].map((d) => (
            <button
              key={d}
              className={`${styles.diffPill} ${difficulty === d ? styles.diffActive : ''} ${d !== 'ALL' ? styles[`diff${d}`] : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d === 'ALL' ? 'All' : d === 'HIGH' ? 'High Priority' : 'Good to Know'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Questions ────────────────────────────────────────────────────── */}
      <div className={styles.body}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span>🔍</span>
            <p>No questions match your filters.</p>
          </div>
        ) : (
          categoryOrder.map((cat) => {
            const qs = grouped[cat];
            if (!qs || qs.length === 0) return null;
            const meta = CATEGORY_META[cat];
            return (
              <div key={cat} className={styles.section}>
                {activeCategory === 'ALL' && (
                  <div className={styles.sectionHeader} style={{ borderLeftColor: meta.color }}>
                    <span className={styles.sectionIcon}>{meta.icon}</span>
                    <span className={styles.sectionLabel}>{meta.label}</span>
                    <span className={styles.sectionCount}>{qs.length}</span>
                  </div>
                )}
                <div className={styles.questionList}>
                  {qs.map((q) => (
                    <QuestionCard
                      key={q.id}
                      q={q}
                      isOpen={openId === q.id}
                      onToggle={() => toggle(q.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ q, isOpen, onToggle }) {
  return (
    <div className={`${styles.card} ${isOpen ? styles.cardOpen : ''}`}>
      <button className={styles.cardHeader} onClick={onToggle}>
        <span className={`${styles.priority} ${q.difficulty === 'HIGH' ? styles.priorityHigh : styles.priorityMed}`}>
          {q.difficulty === 'HIGH' ? '🔴 High' : '🟡 Medium'}
        </span>
        <span className={styles.question}>{q.question}</span>
        <span className={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.cardBody}>
          <div className={styles.quickAnswer}>{q.quickAnswer}</div>

          {q.keyPoints?.length > 0 && (
            <div className={styles.keyPoints}>
              <div className={styles.keyPointsLabel}>Key Points</div>
              <ul className={styles.keyPointsList}>
                {q.keyPoints.map((pt, i) => (
                  <li key={i} className={styles.keyPoint}>{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {q.codeExample && (
            <div className={styles.codeBlock}>
              <div className={styles.codeLabel}>Code</div>
              <pre className={styles.codePre}>{q.codeExample}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
