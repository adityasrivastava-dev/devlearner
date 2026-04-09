import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemsApi } from '../../api';
import { quizApi } from '../quiz/quizApi';
import styles from './QuickWinPage.module.css';

// ── helpers ───────────────────────────────────────────────────────────────────
function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Step components ───────────────────────────────────────────────────────────
function StepProblem({ problem, onContinue }) {
  const diffColor = { EASY: '#4ade80', MEDIUM: '#fbbf24', HARD: '#f87171' };
  return (
    <div className={styles.stepCard}>
      <div className={styles.stepHeader}>
        <span className={styles.stepNum}>1 of 2</span>
        <h2 className={styles.stepTitle}>Quick Problem</h2>
        <p className={styles.stepSub}>Read, think, then solve in the editor. You've got this.</p>
      </div>

      <div className={styles.problemCard}>
        <div className={styles.probMeta}>
          <span className={styles.probDiff} style={{ color: diffColor[problem.difficulty] || '#4ade80' }}>
            {problem.difficulty}
          </span>
          {problem.pattern && (
            <span className={styles.probPattern}>{problem.pattern}</span>
          )}
        </div>
        <h3 className={styles.probTitle}>{problem.title}</h3>
        {problem.description && (
          <p className={styles.probDesc}>{problem.description}</p>
        )}
      </div>

      <div className={styles.actionRow}>
        <a
          className={styles.openBtn}
          href={`/?openProblem=${problem.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Editor ↗
        </a>
        <button className={styles.continueBtn} onClick={onContinue}>
          Continue to Quiz →
        </button>
      </div>
    </div>
  );
}

function StepQuiz({ question, options, onDone }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
  }

  const isCorrect = submitted && selected === question.correctIndex;

  return (
    <div className={styles.stepCard}>
      <div className={styles.stepHeader}>
        <span className={styles.stepNum}>2 of 2</span>
        <h2 className={styles.stepTitle}>Quick Quiz</h2>
        <p className={styles.stepSub}>One question to reinforce the concept.</p>
      </div>

      <div className={styles.quizCard}>
        <p className={styles.quizQ}>{question.questionText}</p>
        <div className={styles.optionList}>
          {options.map((opt, i) => {
            let cls = styles.optionBtn;
            if (submitted) {
              if (i === question.correctIndex) cls = `${styles.optionBtn} ${styles.correct}`;
              else if (i === selected) cls = `${styles.optionBtn} ${styles.wrong}`;
            } else if (i === selected) {
              cls = `${styles.optionBtn} ${styles.selected}`;
            }
            return (
              <button
                key={i}
                className={cls}
                disabled={submitted}
                onClick={() => setSelected(i)}
              >
                <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>
        {submitted && (
          <div className={`${styles.feedback} ${isCorrect ? styles.feedbackOk : styles.feedbackWrong}`}>
            {isCorrect ? '✓ Correct!' : `✗ Correct answer: ${options[question.correctIndex]}`}
          </div>
        )}
      </div>

      <div className={styles.actionRow}>
        {!submitted ? (
          <button className={styles.continueBtn} onClick={handleSubmit} disabled={selected === null}>
            Submit Answer
          </button>
        ) : (
          <button className={styles.continueBtn} onClick={onDone}>
            Finish →
          </button>
        )}
      </div>
    </div>
  );
}

function StepDone({ onBack }) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.doneWrap}>
        <div className={styles.doneEmoji}>⚡</div>
        <h2 className={styles.doneTitle}>Quick Win!</h2>
        <p className={styles.doneSub}>You kept your streak alive. Great work.</p>
        <button className={styles.continueBtn} onClick={onBack}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function QuickWinPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('loading'); // loading | problem | quiz | done | error
  const [problem, setProblem] = useState(null);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Pick a random EASY problem
        const probData = await problemsApi.getAll({ difficulty: 'EASY', size: 20, page: 0 });
        const problems = probData.content ?? probData ?? [];
        const picked = pickRandom(problems);
        if (!picked) throw new Error('No easy problems found');

        // Pick a random quiz question
        const sets = await quizApi.getSets();
        const setsArr = Array.isArray(sets) ? sets : [];
        let pickedQ = null;
        let pickedOpts = [];

        if (setsArr.length > 0) {
          const set = pickRandom(setsArr);
          try {
            const setDetail = await quizApi.getSet(set.id);
            const questions = setDetail.questions ?? [];
            if (questions.length > 0) {
              const q = pickRandom(questions);
              // Normalize options — QuizPage shows options as array of strings
              const opts = q.options ?? [];
              pickedQ = {
                questionText: q.questionText ?? q.text ?? q.question,
                correctIndex: typeof q.correctOption === 'number'
                  ? q.correctOption
                  : opts.indexOf(q.correctAnswer ?? ''),
              };
              pickedOpts = opts;
            }
          } catch (_) { /* quiz unavailable — skip */ }
        }

        if (cancelled) return;
        setProblem(picked);
        if (pickedQ && pickedOpts.length > 0) {
          setQuestion(pickedQ);
          setOptions(pickedOpts);
        }
        setStep('problem');
      } catch (e) {
        if (!cancelled) setStep('error');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  function goQuiz() {
    if (question) setStep('quiz');
    else setStep('done'); // no quiz available — skip straight to done
  }

  if (step === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <span className={styles.spinner} />
          Loading your quick win…
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.errorWrap}>
          <p>Could not load content. Please try again.</p>
          <button className={styles.continueBtn} onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Dashboard
        </button>
        <span className={styles.topTitle}>⚡ 5-Minute Mode</span>
        <span className={styles.topMeta}>Keep your streak alive</span>
      </div>

      <div className={styles.content}>
        {step === 'problem' && (
          <StepProblem problem={problem} onContinue={goQuiz} />
        )}
        {step === 'quiz' && (
          <StepQuiz question={question} options={options} onDone={() => setStep('done')} />
        )}
        {step === 'done' && (
          <StepDone onBack={() => navigate('/')} />
        )}
      </div>
    </div>
  );
}
