import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi, QUIZ_CATEGORIES, DIFFICULTY_META } from './quizApi';
import styles from './QuizPage.module.css';

// ── QUIZ HOME ─────────────────────────────────────────────────────────────────
function QuizHome({ onStartQuiz }) {
  const [sets,     setSets]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [category, setCategory] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    quizApi.getSets(category)
      .then(setSets)
      .catch(() => setError('Could not load quiz sets. Is the backend running?'))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className="btn-back" onClick={() => navigate('/')}>← Home</button>
        <div className={styles.headerCenter}>
          <h1 className={styles.pageTitle}>MCQ Quiz</h1>
          <p className={styles.pageSubtitle}>
            Test your knowledge. Track your weak spots. Ace interviews.
          </p>
        </div>
        <div className={styles.headerRight} />
      </div>

      {/* Category filter */}
      <div className={styles.catBar}>
        {QUIZ_CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`${styles.catBtn} ${category === c.key ? styles.catActive : ''}`}
            onClick={() => setCategory(c.key)}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.body}>
        {loading ? (
          <div className={styles.centerMsg}>
            <div className="spinner" />
            <span>Loading quiz sets…</span>
          </div>
        ) : error ? (
          <div className={styles.centerMsg} style={{ color: 'var(--red)' }}>
            {error}
          </div>
        ) : sets.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <div className={styles.emptyTitle}>No quiz sets yet</div>
            <div className={styles.emptySub}>
              Ask an admin to seed quiz content via the Admin panel.
            </div>
          </div>
        ) : (
          <div className={styles.setGrid}>
            {sets.map((set) => (
              <QuizSetCard key={set.id} set={set} onStart={onStartQuiz} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizSetCard({ set, onStart }) {
  const diff = DIFFICULTY_META[set.difficulty] || DIFFICULTY_META.INTERMEDIATE;
  return (
    <div className={styles.setCard} onClick={() => onStart(set)}>
      <div className={styles.setCardTop}>
        <span className={styles.setIcon}>{set.icon || '📝'}</span>
        <span
          className={styles.diffBadge}
          style={{ color: diff.color, background: diff.bg }}
        >
          {diff.label}
        </span>
      </div>
      <div className={styles.setTitle}>{set.title}</div>
      {set.description && (
        <div className={styles.setDesc}>{set.description}</div>
      )}
      <div className={styles.setFooter}>
        <span className={styles.setMeta}>
          📋 {set.questionCount} question{set.questionCount !== 1 ? 's' : ''}
        </span>
        {set.timeLimitSecs > 0 && (
          <span className={styles.setMeta}>
            ⏱ {Math.floor(set.timeLimitSecs / 60)} min
          </span>
        )}
        <button className={styles.startBtn}>Start →</button>
      </div>
    </div>
  );
}

// ── QUIZ PLAY ─────────────────────────────────────────────────────────────────
function QuizPlay({ set, questions, onFinish, onBack }) {
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState({}); // questionId → { selected, timeSecs }
  const [selected,  setSelected]  = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [elapsed,   setElapsed]   = useState(0);
  const [qElapsed,  setQElapsed]  = useState(0);
  const startRef  = useRef(Date.now());
  const qStartRef = useRef(Date.now());

  // Total timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Per-question timer
  useEffect(() => {
    qStartRef.current = Date.now();
    setQElapsed(0);
    const id = setInterval(() => {
      setQElapsed(Math.floor((Date.now() - qStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [current]);

  const q           = questions[current];
  const progress    = ((current) / questions.length) * 100;
  const isLastQ     = current === questions.length - 1;
  const answeredAll = Object.keys(answers).length === questions.length;

  const options = [
    { key: 'A', text: q.optionA },
    { key: 'B', text: q.optionB },
    q.optionC ? { key: 'C', text: q.optionC } : null,
    q.optionD ? { key: 'D', text: q.optionD } : null,
  ].filter(Boolean);

  function handleSelect(optKey) {
    if (confirmed) return;
    setSelected(optKey);
  }

  function handleConfirm() {
    if (!selected || confirmed) return;
    const timeSecs = Math.floor((Date.now() - qStartRef.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { selected, timeTakenSecs: timeSecs },
    }));
    setConfirmed(true);
  }

  function handleNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    } else {
      handleSubmit();
    }
  }

  function handleSkip() {
    if (confirmed) return;
    const timeSecs = Math.floor((Date.now() - qStartRef.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { selected: null, timeTakenSecs: timeSecs },
    }));
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  }

  function handleSubmit() {
    const totalSecs = Math.floor((Date.now() - startRef.current) / 1000);
    const answerList = questions.map((question) => ({
      questionId:    question.id,
      selectedOption: answers[question.id]?.selected ?? null,
      timeTakenSecs:  answers[question.id]?.timeTakenSecs ?? 0,
    }));
    onFinish(answerList, totalSecs);
  }

  function fmt(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return (
    <div className={styles.playPage}>

      {/* Top bar */}
      <div className={styles.playTopBar}>
        <button className={styles.quitBtn} onClick={onBack}>✕ Quit</button>
        <div className={styles.playMeta}>
          <span className={styles.playSetTitle}>{set.title}</span>
          <span className={styles.playProgress}>
            {current + 1} / {questions.length}
          </span>
        </div>
        <div className={styles.timer}>{fmt(elapsed)}</div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Question card */}
      <div className={styles.playBody}>
        <div className={styles.questionCard}>

          {/* Difficulty chip */}
          <div className={styles.qMeta}>
            <span className={styles.qNum}>Q{current + 1}</span>
            <span
              className={styles.qDiff}
              style={{
                color: (DIFFICULTY_META[q.difficulty] || DIFFICULTY_META.INTERMEDIATE).color,
                background: (DIFFICULTY_META[q.difficulty] || DIFFICULTY_META.INTERMEDIATE).bg,
              }}
            >
              {q.difficulty}
            </span>
            <span className={styles.qTimer}>{fmt(qElapsed)}</span>
          </div>

          {/* Question text */}
          <div className={styles.questionText}>{q.questionText}</div>

          {/* Code snippet */}
          {q.codeSnippet && (
            <pre className={styles.codeSnippet}>{q.codeSnippet}</pre>
          )}

          {/* Options */}
          <div className={styles.options}>
            {options.map((opt) => {
              let cls = styles.option;
              if (selected === opt.key && !confirmed) cls += ` ${styles.optionSelected}`;
              // No feedback before confirming
              return (
                <button
                  key={opt.key}
                  className={cls}
                  onClick={() => handleSelect(opt.key)}
                  disabled={confirmed}
                >
                  <span className={styles.optKey}>{opt.key}</span>
                  <span className={styles.optText}>{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className={styles.qActions}>
            {!confirmed ? (
              <>
                <button
                  className={styles.skipBtn}
                  onClick={handleSkip}
                >
                  Skip
                </button>
                <button
                  className={styles.confirmBtn}
                  onClick={handleConfirm}
                  disabled={!selected}
                >
                  Confirm Answer
                </button>
              </>
            ) : (
              <button
                className={styles.nextBtn}
                onClick={handleNext}
              >
                {isLastQ ? 'See Results →' : 'Next Question →'}
              </button>
            )}
          </div>

        </div>

        {/* Question dots nav */}
        <div className={styles.dotNav}>
          {questions.map((qn, i) => {
            const ans = answers[qn.id];
            let dotCls = styles.dot;
            if (i === current) dotCls += ` ${styles.dotCurrent}`;
            else if (ans?.selected !== undefined) dotCls += ` ${styles.dotAnswered}`;
            return (
              <div key={qn.id} className={dotCls} title={`Q${i + 1}`} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── QUIZ RESULTS ──────────────────────────────────────────────────────────────
function QuizResults({ result, onRetry, onHome }) {
  const [showReview, setShowReview] = useState(false);
  const navigate = useNavigate();

  const pct       = result.percentage ?? 0;
  const score     = result.score ?? 0;
  const total     = result.totalQuestions ?? 0;
  const timeSecs  = result.timeTakenSecs ?? 0;
  const review    = result.review ?? [];

  const grade = pct >= 80 ? { label: 'Excellent!',  emoji: '🏆', color: 'var(--success)' }
              : pct >= 60 ? { label: 'Good Job!',   emoji: '⚡', color: 'var(--accent3)' }
              : pct >= 40 ? { label: 'Keep Going',  emoji: '📚', color: 'var(--yellow)'  }
              :             { label: 'Need Practice',emoji: '💪', color: 'var(--red)'     };

  const wrong  = review.filter((r) => !r.correct);
  const correct = review.filter((r) => r.correct);

  function fmt(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  return (
    <div className={styles.resultsPage}>
      <div className={styles.resultsInner}>

        {/* Score card */}
        <div className={styles.scoreCard}>
          <div className={styles.gradeEmoji}>{grade.emoji}</div>
          <div className={styles.gradeLabel} style={{ color: grade.color }}>{grade.label}</div>
          <div className={styles.scoreBig}>
            <span style={{ color: grade.color }}>{score}</span>
            <span className={styles.scoreSlash}>/</span>
            <span>{total}</span>
          </div>
          <div className={styles.scorePct}>{pct}% correct</div>

          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statNum} style={{ color: 'var(--success)' }}>{correct.length}</span>
              <span className={styles.statLbl}>Correct</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBox}>
              <span className={styles.statNum} style={{ color: 'var(--red)' }}>{wrong.length}</span>
              <span className={styles.statLbl}>Wrong</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBox}>
              <span className={styles.statNum}>{fmt(timeSecs)}</span>
              <span className={styles.statLbl}>Time</span>
            </div>
            {result.isPersonalBest && (
              <>
                <div className={styles.statDivider} />
                <div className={styles.statBox}>
                  <span className={styles.statNum}>🏅</span>
                  <span className={styles.statLbl}>Personal Best</span>
                </div>
              </>
            )}
          </div>

          {/* Score bar */}
          <div className={styles.scoreBarWrap}>
            <div
              className={styles.scoreBar}
              style={{ width: `${pct}%`, background: grade.color }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.resultActions}>
          <button className={`btn btn-ghost`} onClick={onHome}>← All Quizzes</button>
          <button className={`btn btn-primary`} onClick={onRetry}>Retry Quiz</button>
          <button
            className={`btn btn-ghost`}
            onClick={() => setShowReview((v) => !v)}
          >
            {showReview ? 'Hide Review' : `📋 Review Answers (${review.length})`}
          </button>
        </div>

        {/* Review section */}
        {showReview && (
          <div className={styles.reviewList}>
            {review.map((r, i) => (
              <ReviewItem key={r.questionId} item={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ item, index }) {
  const [open, setOpen] = useState(!item.correct); // auto-open wrong answers

  const options = [
    { key: 'A', text: item.optionA },
    { key: 'B', text: item.optionB },
    item.optionC ? { key: 'C', text: item.optionC } : null,
    item.optionD ? { key: 'D', text: item.optionD } : null,
  ].filter(Boolean);

  return (
    <div className={`${styles.reviewItem} ${item.correct ? styles.reviewCorrect : styles.reviewWrong}`}>
      <div className={styles.reviewHeader} onClick={() => setOpen((v) => !v)}>
        <span className={styles.reviewIcon}>{item.correct ? '✅' : '❌'}</span>
        <span className={styles.reviewQNum}>Q{index + 1}</span>
        <span className={styles.reviewQText}>{item.questionText}</span>
        <span className={styles.reviewChevron}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className={styles.reviewBody}>
          {item.codeSnippet && (
            <pre className={styles.codeSnippet}>{item.codeSnippet}</pre>
          )}

          <div className={styles.reviewOptions}>
            {options.map((opt) => {
              const isCorrect  = opt.key === item.correctOption;
              const isSelected = opt.key === item.selectedOption;
              let cls = styles.reviewOption;
              if (isCorrect)          cls += ` ${styles.reviewOptCorrect}`;
              else if (isSelected)    cls += ` ${styles.reviewOptWrong}`;
              return (
                <div key={opt.key} className={cls}>
                  <span className={styles.optKey}>{opt.key}</span>
                  <span className={styles.optText}>{opt.text}</span>
                  {isCorrect  && <span className={styles.reviewTag}>✓ Correct</span>}
                  {isSelected && !isCorrect && <span className={styles.reviewTag}>✗ Your answer</span>}
                </div>
              );
            })}
          </div>

          {item.explanation && (
            <div className={styles.explanation}>
              <span className={styles.explanationIcon}>💡</span>
              <span>{item.explanation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ROOT — view state manager ─────────────────────────────────────────────────
export default function QuizPage() {
  // view: 'home' | 'loading' | 'play' | 'submitting' | 'results'
  const [view,      setView]      = useState('home');
  const [activeSet, setActiveSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);

  async function handleStartQuiz(set) {
    setView('loading');
    setError(null);
    try {
      const data = await quizApi.getSet(set.id);
      setActiveSet(data.set);
      setQuestions(data.questions);
      setView('play');
    } catch {
      setError('Could not load quiz. Please try again.');
      setView('home');
    }
  }

  async function handleFinish(answers, timeTakenSecs) {
    setView('submitting');
    try {
      const res = await quizApi.submit(activeSet.id, answers, timeTakenSecs);
      setResult(res);
      setView('results');
    } catch {
      setError('Could not save results. Please try again.');
      setView('play');
    }
  }

  function handleRetry() {
    handleStartQuiz(activeSet);
  }

  function handleHome() {
    setView('home');
    setActiveSet(null);
    setQuestions([]);
    setResult(null);
  }

  if (view === 'loading' || view === 'submitting') {
    return (
      <div className={styles.fullCenter}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <span style={{ color: 'var(--text3)', fontSize: 14, marginTop: 12 }}>
          {view === 'submitting' ? 'Calculating your score…' : 'Loading quiz…'}
        </span>
      </div>
    );
  }

  if (view === 'play' && activeSet && questions.length > 0) {
    return (
      <QuizPlay
        set={activeSet}
        questions={questions}
        onFinish={handleFinish}
        onBack={handleHome}
      />
    );
  }

  if (view === 'results' && result) {
    return (
      <QuizResults
        result={result}
        onRetry={handleRetry}
        onHome={handleHome}
      />
    );
  }

  return <QuizHome onStartQuiz={handleStartQuiz} />;
}