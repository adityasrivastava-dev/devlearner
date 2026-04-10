import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemsApi } from '../../api';
import styles from './DrillPage.module.css';

const DRILL_SIZE = 10;

// ── Answer matching ───────────────────────────────────────────────────────────

function normalize(str) {
  return str.toLowerCase().replace(/[-_\s]+/g, ' ').trim();
}

// Groups of equivalent answers — if both user and pattern normalize to anything
// in the same group, it counts as correct.
const ALIASES = [
  ['two pointer', 'two pointers', 'two-pointer', 'two-pointers'],
  ['sliding window', 'sliding-window'],
  ['hash map', 'hashmap', 'hash table', 'hashtable', 'hashing'],
  ['dynamic programming', 'dp', 'memoization', 'tabulation'],
  ['depth first search', 'dfs'],
  ['breadth first search', 'bfs'],
  ['binary search', 'bs'],
  ['prefix sum', 'prefix-sum', 'cumulative sum', 'running sum'],
  ['fast slow pointer', 'slow fast pointer', 'floyd', 'cycle detection'],
  ['merge intervals', 'interval merge'],
  ['top k elements', 'top-k', 'top k', 'heap'],
  ['monotonic stack', 'monotone stack'],
  ['union find', 'union-find', 'disjoint set'],
  ['backtracking', 'back tracking'],
  ['greedy', 'greedy algorithm'],
  ['divide and conquer', 'divide & conquer'],
];

function checkAnswer(userAnswer, pattern) {
  const ua = normalize(userAnswer);
  const pa = normalize(pattern);
  if (ua === pa) return true;
  for (const group of ALIASES) {
    if (group.includes(ua) && group.includes(pa)) return true;
    // Partial: user answer is contained in the correct pattern or vice versa
    // e.g. user types "sliding" for "Sliding Window"
    if (group.includes(pa) && group.some((alias) => alias.startsWith(ua) || ua.startsWith(alias))) return true;
  }
  return false;
}

// ── Utility ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── DrillCard ─────────────────────────────────────────────────────────────────

function DrillCard({ problem, index, total, onAnswer }) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setInput('');
    setSubmitted(false);
    setCorrect(false);
    // Small delay so the transition settles before focusing
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [problem.id]);

  function handleSubmit() {
    if (!input.trim() || submitted) return;
    const result = checkAnswer(input.trim(), problem.pattern);
    setCorrect(result);
    setSubmitted(true);
  }

  function handleKey(e) {
    if (e.key === 'Enter') {
      if (!submitted) handleSubmit();
      else onAnswer(correct);
    }
  }

  const diffColor = { EASY: '#4ade80', MEDIUM: '#fbbf24', HARD: '#f87171' };

  return (
    <div className={styles.card}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((index) / total) * 100}%` }}
        />
      </div>

      <div className={styles.cardMeta}>
        <span className={styles.cardCount}>{index + 1} of {total}</span>
        <span className={styles.diffBadge} style={{ color: diffColor[problem.difficulty] || '#4ade80' }}>
          {problem.difficulty}
        </span>
      </div>

      <h2 className={styles.probTitle}>{problem.title}</h2>

      {problem.description && (
        <p className={styles.probDesc}>
          {problem.description.length > 300
            ? problem.description.slice(0, 300) + '…'
            : problem.description}
        </p>
      )}

      {!submitted ? (
        <div className={styles.answerSection}>
          <p className={styles.question}>What pattern / technique does this problem use?</p>
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={styles.answerInput}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. Sliding Window, Two Pointer, DFS…"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              Submit
            </button>
          </div>
          <p className={styles.enterHint}>↵ Enter to submit</p>
        </div>
      ) : (
        <div className={`${styles.resultSection} ${correct ? styles.resultCorrect : styles.resultWrong}`}>
          <div className={styles.resultLabel}>
            {correct
              ? <span className={styles.correctIcon}>✓ Correct!</span>
              : <span className={styles.wrongIcon}>✗ Not quite</span>
            }
          </div>

          <div className={styles.answerReveal}>
            <div className={styles.revealRow}>
              <span className={styles.revealLabel}>Pattern:</span>
              <span className={styles.revealValue}>{problem.pattern}</span>
            </div>
            {!correct && (
              <div className={styles.revealRow}>
                <span className={styles.revealLabel}>You said:</span>
                <span className={styles.revealYours}>{input}</span>
              </div>
            )}
          </div>

          <button
            className={styles.nextBtn}
            onClick={() => onAnswer(correct)}
          >
            {index + 1 < total ? 'Next →' : 'See Results →'}
          </button>
          <p className={styles.enterHint}>↵ Enter to continue</p>
        </div>
      )}
    </div>
  );
}

// ── ResultsScreen ─────────────────────────────────────────────────────────────

function ResultsScreen({ results, problems, onRetry, onBack }) {
  const score = results.filter(Boolean).length;
  const total = results.length;
  const pct = Math.round((score / total) * 100);

  let grade, gradeColor;
  if (pct >= 90)      { grade = 'Excellent';     gradeColor = '#4ade80'; }
  else if (pct >= 70) { grade = 'Good';           gradeColor = '#a3e635'; }
  else if (pct >= 50) { grade = 'Keep drilling';  gradeColor = '#fbbf24'; }
  else                { grade = 'Needs work';     gradeColor = '#f87171'; }

  const missed = problems.filter((_, i) => !results[i]);

  return (
    <div className={styles.resultsWrap}>
      <div className={styles.scoreBlock} style={{ borderColor: gradeColor }}>
        <span className={styles.scoreNum} style={{ color: gradeColor }}>{score}</span>
        <span className={styles.scoreDivider}>/</span>
        <span className={styles.scoreTotal}>{total}</span>
      </div>

      <h2 className={styles.gradeLabel} style={{ color: gradeColor }}>{grade}</h2>
      <p className={styles.gradeSub}>{pct}% correct</p>

      {missed.length > 0 && (
        <div className={styles.missedSection}>
          <p className={styles.missedTitle}>Patterns to memorize:</p>
          <div className={styles.missedList}>
            {missed.map((p) => (
              <div key={p.id} className={styles.missedItem}>
                <span className={styles.missedPattern}>{p.pattern}</span>
                <span className={styles.missedProblem}>{p.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.resultsActions}>
        <button className={styles.retryBtn} onClick={onRetry}>Drill Again</button>
        <button className={styles.backBtn2} onClick={onBack}>← Dashboard</button>
      </div>
    </div>
  );
}

// ── StartScreen ───────────────────────────────────────────────────────────────

function StartScreen({ count, onStart }) {
  return (
    <div className={styles.startWrap}>
      <div className={styles.startIcon}>🎯</div>
      <h1 className={styles.startTitle}>Pattern Name Drill</h1>
      <p className={styles.startSub}>
        Read the problem. Name the algorithm pattern.<br />
        {count} problems in the pool — you'll get {Math.min(DRILL_SIZE, count)}.
      </p>

      <div className={styles.ruleList}>
        <div className={styles.ruleItem}>
          <span className={styles.ruleNum}>1</span>
          Read the problem title and description
        </div>
        <div className={styles.ruleItem}>
          <span className={styles.ruleNum}>2</span>
          Type the pattern (e.g. "Sliding Window", "BFS", "DP")
        </div>
        <div className={styles.ruleItem}>
          <span className={styles.ruleNum}>3</span>
          Common aliases are accepted — spelling counts, not casing
        </div>
      </div>

      <button className={styles.startBtn} onClick={onStart}>
        Start Drill →
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DrillPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | ready | drilling | done | error
  const [allProblems, setAllProblems] = useState([]);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState([]);

  async function loadProblems() {
    try {
      setStatus('loading');
      const data = await problemsApi.getAll({ size: 500, page: 0 });
      const list = (data.content ?? data ?? []).filter((p) => p.pattern?.trim());
      if (list.length === 0) {
        setStatus('error');
        return;
      }
      setAllProblems(list);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => { loadProblems(); }, []);

  function startDrill() {
    const q = shuffle(allProblems).slice(0, DRILL_SIZE);
    setQueue(q);
    setCurrent(0);
    setResults([]);
    setStatus('drilling');
  }

  function handleAnswer(correct) {
    const updated = [...results, correct];
    setResults(updated);
    if (current + 1 >= queue.length) {
      setStatus('done');
    } else {
      setCurrent(current + 1);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <span className={styles.spinner} />
          Loading problems…
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.topbar}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Dashboard</button>
          <span className={styles.topTitle}>Pattern Drill</span>
          <span />
        </div>
        <div className={styles.errorWrap}>
          <p>No problems with patterns found.</p>
          <p className={styles.errorSub}>Seed some DSA problems from Admin → Seed Files first.</p>
          <button className={styles.backBtn2} onClick={() => navigate('/')}>← Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Dashboard</button>
        <span className={styles.topTitle}>Pattern Drill</span>
        {status === 'drilling' && (
          <span className={styles.topScore}>
            {results.filter(Boolean).length} / {results.length} correct
          </span>
        )}
        {status !== 'drilling' && <span />}
      </div>

      <div className={styles.content}>
        {status === 'ready' && (
          <StartScreen count={allProblems.length} onStart={startDrill} />
        )}

        {status === 'drilling' && queue[current] && (
          <DrillCard
            key={queue[current].id}
            problem={queue[current]}
            index={current}
            total={queue.length}
            onAnswer={handleAnswer}
          />
        )}

        {status === 'done' && (
          <ResultsScreen
            results={results}
            problems={queue}
            onRetry={startDrill}
            onBack={() => navigate('/')}
          />
        )}
      </div>
    </div>
  );
}
