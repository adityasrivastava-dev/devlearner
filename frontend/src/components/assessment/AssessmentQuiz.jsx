import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { assessmentApi } from '../../api';
import styles from './AssessmentQuiz.module.css';

const CAT_LABEL = {
  JAVA:        { label: 'Java Core',    icon: '☕', color: '#fbbf24' },
  DSA:         { label: 'DSA',          icon: '🎯', color: '#60a5fa' },
  SPRING_BOOT: { label: 'Spring Boot',  icon: '🍃', color: '#4ade80' },
  MYSQL:       { label: 'MySQL',        icon: '🗄',  color: '#f59e0b' },
  AWS:         { label: 'AWS',          icon: '☁',  color: '#fb923c' },
};

const OPTIONS = ['A', 'B', 'C', 'D'];

/**
 * Self-contained quiz component.
 * Props:
 *   onComplete(results) — called when user finishes (results = API response)
 *   onSkip()            — called when user skips the assessment
 */
export default function AssessmentQuiz({ onComplete, onSkip }) {
  const [current,  setCurrent]  = useState(0);
  const [answers,  setAnswers]  = useState({});   // { questionId: "A" }
  const [selected, setSelected] = useState(null); // current selection before advancing
  const [phase,    setPhase]    = useState('quiz'); // 'quiz' | 'results'
  const [results,  setResults]  = useState(null);

  const { data: questions = [], isLoading, isError } = useQuery({
    queryKey: ['assessmentQuestions'],
    queryFn:  assessmentApi.getQuestions,
    staleTime: Infinity,
  });

  const submitMutation = useMutation({
    mutationFn: assessmentApi.submit,
    onSuccess: (data) => {
      setResults(data);
      setPhase('results');
    },
  });

  if (isLoading) return (
    <div className={styles.center}>
      <div className={styles.spinner} />
      <p>Loading questions…</p>
    </div>
  );

  if (isError) return (
    <div className={styles.center}>
      <p>Could not load questions.</p>
      <button className={styles.skipBtn} onClick={onSkip}>Skip Assessment →</button>
    </div>
  );

  const q = questions[current];
  const total = questions.length;
  const progress = ((current) / total) * 100;

  function selectOption(opt) {
    setSelected(opt);
  }

  function advance() {
    if (!selected) return;
    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);

    if (current + 1 < total) {
      setCurrent(current + 1);
    } else {
      submitMutation.mutate(newAnswers);
    }
  }

  const optionText = (q, opt) => {
    return { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt];
  };

  // ── Results screen ────────────────────────────────────────────────────────
  if (phase === 'results' && results) {
    const cats = results.categoryResults || {};
    const totalAdvanced = results.topicsAdvanced || 0;

    return (
      <div className={styles.results}>
        <div className={styles.resultsHeader}>
          <span className={styles.resultsIcon}>{totalAdvanced > 0 ? '🎉' : '💪'}</span>
          <h2 className={styles.resultsTitle}>
            {totalAdvanced > 0 ? 'Great job! Gates unlocked.' : 'Assessment complete!'}
          </h2>
          <p className={styles.resultsSub}>
            {totalAdvanced > 0
              ? `${totalAdvanced} topics advanced to EASY stage — you can jump straight to practice.`
              : 'No worries — start from Theory and build your foundation.'}
          </p>
        </div>

        <div className={styles.catGrid}>
          {Object.entries(cats).map(([cat, data]) => {
            const meta = CAT_LABEL[cat] || { label: cat, icon: '📘', color: '#888' };
            return (
              <div key={cat} className={`${styles.catCard} ${data.passed ? styles.catPass : styles.catFail}`}>
                <div className={styles.catTop}>
                  <span className={styles.catIcon}>{meta.icon}</span>
                  <span className={styles.catLabel}>{meta.label}</span>
                  <span className={`${styles.catBadge} ${data.passed ? styles.passBadge : styles.failBadge}`}>
                    {data.passed ? '✓ Passed' : '✗ Review needed'}
                  </span>
                </div>
                <div className={styles.catScore}>
                  {data.correct}/{data.total} correct
                  {data.passed && data.topicsAdvanced > 0 && (
                    <span className={styles.advanced}> · {data.topicsAdvanced} topics → EASY</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.reviewSection}>
          <h3 className={styles.reviewTitle}>Review</h3>
          {(results.review || []).map((r) => (
            <div key={r.id} className={`${styles.reviewItem} ${r.correct ? styles.reviewCorrect : styles.reviewWrong}`}>
              <div className={styles.reviewQ}>{r.questionText}</div>
              <div className={styles.reviewAnswer}>
                {r.correct
                  ? `✓ Your answer: ${r.userAnswer} — Correct!`
                  : `✗ Your answer: ${r.userAnswer || '—'} · Correct: ${r.correctOption}`}
              </div>
              {!r.correct && <div className={styles.reviewExp}>{r.explanation}</div>}
            </div>
          ))}
        </div>

        <button className={styles.doneBtn} onClick={() => onComplete?.(results)}>
          Start Learning →
        </button>
      </div>
    );
  }

  // ── Submitting ─────────────────────────────────────────────────────────────
  if (submitMutation.isPending) return (
    <div className={styles.center}>
      <div className={styles.spinner} />
      <p>Scoring your answers…</p>
    </div>
  );

  // ── Quiz screen ────────────────────────────────────────────────────────────
  const catMeta = CAT_LABEL[q?.category] || { label: q?.category, icon: '📘', color: '#888' };

  return (
    <div className={styles.quiz}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.meta}>
        <span className={styles.qCounter}>{current + 1} / {total}</span>
        <span className={styles.catTag} style={{ borderColor: catMeta.color, color: catMeta.color }}>
          {catMeta.icon} {catMeta.label}
        </span>
        <button className={styles.skipBtn} onClick={onSkip}>Skip</button>
      </div>

      <h2 className={styles.questionText}>{q?.questionText}</h2>

      <div className={styles.options}>
        {OPTIONS.filter(opt => optionText(q, opt)).map((opt) => (
          <button
            key={opt}
            className={`${styles.option} ${selected === opt ? styles.optionSelected : ''}`}
            onClick={() => selectOption(opt)}
          >
            <span className={styles.optLetter}>{opt}</span>
            <span className={styles.optText}>{optionText(q, opt)}</span>
          </button>
        ))}
      </div>

      <button
        className={styles.nextBtn}
        disabled={!selected}
        onClick={advance}
      >
        {current + 1 === total ? 'Submit →' : 'Next →'}
      </button>
    </div>
  );
}
