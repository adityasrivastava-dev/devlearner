import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { interviewApi, QUERY_KEYS } from '../../api';
import { QUESTIONS as STATIC_QUESTIONS, CATEGORY_META } from './interviewData';
import EmptyState from '../../components/shared/EmptyState';
import styles from './RevisionPage.module.css';

// Normalise a DB question (keyPoints is JSON string) to the same shape as static data
function normalise(q) {
  let kp = q.keyPoints;
  if (typeof kp === 'string') {
    try { kp = JSON.parse(kp); } catch { kp = kp ? [kp] : []; }
  }
  return { ...q, keyPoints: kp || [] };
}

const DURATIONS = [
  { label: '10 min', seconds: 600  },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RevisionPage() {
  const [phase,      setPhase]      = useState('setup');
  const [categories, setCategories] = useState(new Set(Object.keys(CATEGORY_META)));
  const [difficulty, setDifficulty] = useState('ALL');
  const [duration,   setDuration]   = useState(1800);
  const [questions,  setQuestions]  = useState([]);
  const [results,    setResults]    = useState([]);

  const { data: dbQuestions = [] } = useQuery({
    queryKey: QUERY_KEYS.interviewQuestions,
    queryFn:  () => interviewApi.getAll(),
    staleTime: 5 * 60_000,
  });

  // Use DB questions if available, fall back to static data
  const allQuestions = dbQuestions.length > 0
    ? dbQuestions.map(normalise)
    : STATIC_QUESTIONS;

  function startSession() {
    const pool = allQuestions.filter((q) => {
      if (!categories.has(q.category)) return false;
      if (difficulty !== 'ALL' && q.difficulty !== difficulty) return false;
      return true;
    });
    setQuestions([...pool].sort(() => Math.random() - 0.5));
    setResults([]);
    setPhase('session');
  }

  if (phase === 'setup')   return <SetupScreen allQuestions={allQuestions} categories={categories} setCategories={setCategories} difficulty={difficulty} setDifficulty={setDifficulty} duration={duration} setDuration={setDuration} onStart={startSession} />;
  if (phase === 'session') return <SessionScreen questions={questions} duration={duration} onFinish={(r) => { setResults(r); setPhase('results'); }} />;
  return <ResultsScreen results={results} onRestart={() => setPhase('setup')} />;
}

// ── Setup Screen ──────────────────────────────────────────────────────────────
function SetupScreen({ allQuestions, categories, setCategories, difficulty, setDifficulty, duration, setDuration, onStart }) {
  function toggleCategory(key) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  }
  const pool = allQuestions.filter((q) => categories.has(q.category) && (difficulty === 'ALL' || q.difficulty === difficulty));

  return (
    <div className={styles.setupPage}>
      <div className={styles.setupCard}>
        <div className={styles.setupTitle}>Revision Session</div>
        <p className={styles.setupSub}>Pick topics, set a timer, then recall each answer before revealing. Simulates real interview pressure.</p>

        <div className={styles.setupBlock}>
          <div className={styles.setupLabel}>Categories</div>
          <div className={styles.catGrid}>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button key={key}
                className={`${styles.catChip} ${categories.has(key) ? styles.catChipOn : ''}`}
                style={categories.has(key) ? { borderColor: meta.color, color: meta.color, background: `${meta.color}14` } : {}}
                onClick={() => toggleCategory(key)}>
                {meta.icon} {meta.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.setupBlock}>
          <div className={styles.setupLabel}>Priority</div>
          <div className={styles.segmented}>
            {[['ALL','All'],['HIGH','High Priority'],['MEDIUM','Good to Know']].map(([k,l]) => (
              <button key={k} className={`${styles.seg} ${difficulty===k ? styles.segOn : ''}`} onClick={() => setDifficulty(k)}>{l}</button>
            ))}
          </div>
        </div>

        <div className={styles.setupBlock}>
          <div className={styles.setupLabel}>Session Length</div>
          <div className={styles.segmented}>
            {DURATIONS.map(({ label, seconds }) => (
              <button key={seconds} className={`${styles.seg} ${duration===seconds ? styles.segOn : ''}`} onClick={() => setDuration(seconds)}>{label}</button>
            ))}
          </div>
        </div>

        <div className={styles.setupFooter}>
          <span className={styles.poolCount}><strong>{pool.length}</strong> questions</span>
          <button className={styles.startBtn} disabled={pool.length === 0} onClick={onStart}>
            Start →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session Screen ────────────────────────────────────────────────────────────
function SessionScreen({ questions, duration, onFinish }) {
  const [index,    setIndex]    = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [results,  setResults]  = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); onFinish(results); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line

  const rate = useCallback((rating) => {
    const newResults = [...results, { q: questions[index], rating }];
    setResults(newResults);
    if (index + 1 >= questions.length) { clearInterval(timerRef.current); onFinish(newResults); }
    else { setIndex(index + 1); setRevealed(false); }
  }, [index, questions, results, onFinish]);

  function skip() {
    if (index + 1 >= questions.length) { clearInterval(timerRef.current); onFinish(results); }
    else { setIndex(index + 1); setRevealed(false); }
  }

  if (questions.length === 0) return (
    <div className={styles.sessionPage}>
      <EmptyState icon="😕" title="No questions in the pool." hint="Select a category or lower the minimum difficulty to find questions." action={() => onFinish([])} actionLabel="← Back" />
    </div>
  );

  const q    = questions[index];
  const meta = CATEGORY_META[q.category];
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const pct  = Math.round((index / questions.length) * 100);
  const isWarn = timeLeft < 60;

  return (
    <div className={styles.sessionPage}>

      {/* ── Progress strip + topbar ──────────────────────────────────── */}
      <div className={styles.topbar}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.topbarInner}>
          <span className={styles.qCount}>{index + 1} <span className={styles.qCountOf}>/ {questions.length}</span></span>
          <div className={`${styles.timerPill} ${isWarn ? styles.timerWarn : ''}`}>
            ⏱ {mins}:{secs}
          </div>
          <button className={styles.endBtn} onClick={() => { clearInterval(timerRef.current); onFinish(results); }}>End</button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      {!revealed ? (
        /* QUESTION VIEW — full height, question dominates */
        <div className={styles.questionView}>
          <div className={styles.questionInner}>
            <div className={styles.qMeta}>
              <span className={styles.qCatBadge} style={{ color: meta.color, borderColor: `${meta.color}50`, background: `${meta.color}14` }}>
                {meta.icon} {meta.label}
              </span>
              <span className={`${styles.qDiffBadge} ${q.difficulty === 'HIGH' ? styles.diffHigh : styles.diffMed}`}>
                {q.difficulty === 'HIGH' ? '🔴 High' : '🟡 Medium'}
              </span>
            </div>

            <div className={styles.questionText}>{q.question}</div>

            <div className={styles.recallHint}>Think about it before revealing…</div>

            <div className={styles.questionActions}>
              <button className={styles.revealBtn} onClick={() => setRevealed(true)}>
                Reveal Answer
              </button>
              <button className={styles.skipBtn} onClick={skip}>Skip →</button>
            </div>
          </div>
        </div>
      ) : (
        /* ANSWER VIEW — scrollable, rating buttons inline right below answer */
        <div className={styles.answerView}>
          <div className={styles.answerInner}>

            {/* Question repeated small at top */}
            <div className={styles.answerQRepeat}>{q.question}</div>

            {/* Quick answer — the headline */}
            <div className={styles.answerHeadline}>{q.quickAnswer}</div>

            {/* ── Rating buttons — right below the answer, always visible ── */}
            <div className={styles.ratingBar}>
              <button className={`${styles.rateBtn} ${styles.rateMissed}`} onClick={() => rate('missed')}>
                <span className={styles.rateBtnIcon}>✗</span>
                <span>Missed</span>
              </button>
              <button className={`${styles.rateBtn} ${styles.ratePartial}`} onClick={() => rate('partial')}>
                <span className={styles.rateBtnIcon}>~</span>
                <span>Partial</span>
              </button>
              <button className={`${styles.rateBtn} ${styles.rateGot}`} onClick={() => rate('got')}>
                <span className={styles.rateBtnIcon}>✓</span>
                <span>Got It</span>
              </button>
            </div>

            {/* Key points — below rating, scroll to see */}
            {q.keyPoints?.length > 0 && (
              <div className={styles.kpGrid}>
                {q.keyPoints.map((pt, i) => (
                  <div key={i} className={styles.kpItem}>
                    <span className={styles.kpBullet}>›</span>
                    <span className={styles.kpText}>{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Code */}
            {q.codeExample && (
              <pre className={styles.codeBlock}>{q.codeExample}</pre>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────────────────────
function ResultsScreen({ results, onRestart }) {
  const navigate = useNavigate();
  const got     = results.filter((r) => r.rating === 'got').length;
  const partial = results.filter((r) => r.rating === 'partial').length;
  const missed  = results.filter((r) => r.rating === 'missed').length;
  const total   = results.length;
  const score   = total === 0 ? 0 : Math.round(((got + partial * 0.5) / total) * 100);
  const missedItems = results.filter((r) => r.rating !== 'got');

  return (
    <div className={styles.resultsPage}>
      <div className={styles.resultsWrap}>

        <div className={styles.scoreRow}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNum}>{score}%</span>
            <span className={styles.scoreLabel}>score</span>
          </div>
          <div>
            <div className={styles.resultsTitle}>Session Complete</div>
            <div className={styles.resultsSub}>{total} questions reviewed</div>
            <div className={styles.scoreBreakdown}>
              <span className={styles.bdGot}>✓ {got} got it</span>
              <span className={styles.bdPartial}>~ {partial} partial</span>
              <span className={styles.bdMissed}>✗ {missed} missed</span>
            </div>
          </div>
        </div>

        {missedItems.length > 0 && (
          <div className={styles.reviewSection}>
            <div className={styles.reviewTitle}>Review These ({missedItems.length})</div>
            <div className={styles.reviewList}>
              {missedItems.map(({ q, rating }) => (
                <div key={q.id} className={`${styles.reviewItem} ${rating === 'missed' ? styles.reviewRed : styles.reviewYellow}`}>
                  <span className={styles.reviewRating}>{rating === 'missed' ? '✗' : '~'}</span>
                  <div>
                    <div className={styles.reviewQ}>{q.question}</div>
                    <div className={styles.reviewA}>{q.quickAnswer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.resultsActions}>
          <button className={styles.ghostBtn} onClick={() => navigate('/interview-prep')}>Browse Q&A</button>
          <button className={styles.startBtn} onClick={onRestart}>Start Another →</button>
        </div>

      </div>
    </div>
  );
}
