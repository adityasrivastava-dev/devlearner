import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { problemsApi, topicsApi, codeApi, QUERY_KEYS } from '../../api';
import CodeEditor, { applyMarkers } from '../../components/editor/CodeEditor';
import { getDiffMeta, PROBLEM_STARTER_CODE } from '../../utils/helpers';
import toast from 'react-hot-toast';
import styles from './InterviewModePage.module.css';

// ── Config ────────────────────────────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
  EASY:   { label: 'Easy',   minutes: 20, color: '#4ade80', desc: 'Warm-up — array / string basics' },
  MEDIUM: { label: 'Medium', minutes: 35, color: '#fbbf24', desc: 'Core interview difficulty' },
  HARD:   { label: 'Hard',   minutes: 45, color: '#f87171', desc: 'Senior / MAANG level' },
};

const MIN_APPROACH_CHARS = 50;

function fmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Setup screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const [difficulty, setDifficulty] = useState('MEDIUM');

  return (
    <div className={styles.setupPage}>
      <div className={styles.setupCard}>
        <div className={styles.setupIcon}>⏱</div>
        <h1 className={styles.setupTitle}>Interview Mode</h1>
        <p className={styles.setupDesc}>
          Simulate a real technical interview. One problem, no hints, timed.
          You must write your approach before touching code.
        </p>

        <div className={styles.difficultyGrid}>
          {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={`${styles.diffCard} ${difficulty === key ? styles.diffCardActive : ''}`}
              style={difficulty === key ? { borderColor: cfg.color } : {}}
              onClick={() => setDifficulty(key)}
            >
              <span className={styles.diffLabel} style={{ color: cfg.color }}>{cfg.label}</span>
              <span className={styles.diffMinutes}>{cfg.minutes} min</span>
              <span className={styles.diffDesc}>{cfg.desc}</span>
            </button>
          ))}
        </div>

        <div className={styles.rulesBox}>
          <div className={styles.ruleRow}><span className={styles.ruleIcon}>📝</span> Write your approach first (50+ chars required)</div>
          <div className={styles.ruleRow}><span className={styles.ruleIcon}>🚫</span> No hints — none available</div>
          <div className={styles.ruleRow}><span className={styles.ruleIcon}>⏰</span> Auto-submits when time runs out</div>
          <div className={styles.ruleRow}><span className={styles.ruleIcon}>📊</span> Scorecard after session</div>
        </div>

        <button className={styles.startBtn} onClick={() => onStart(difficulty)}>
          Start {DIFFICULTY_CONFIG[difficulty].label} Interview →
        </button>
      </div>
    </div>
  );
}

// ── Clock component ───────────────────────────────────────────────────────────
function Clock({ timeLeft, totalSecs, phase }) {
  const pct = (timeLeft / totalSecs) * 100;
  const isUrgent = timeLeft <= 300; // last 5 min
  const isCritical = timeLeft <= 60;

  return (
    <div className={`${styles.clock} ${isUrgent ? styles.clockUrgent : ''} ${isCritical ? styles.clockCritical : ''}`}>
      <div className={styles.clockTime}>{fmtTime(timeLeft)}</div>
      <div className={styles.clockBar}>
        <div
          className={styles.clockFill}
          style={{
            width: `${pct}%`,
            background: isCritical ? '#ef4444' : isUrgent ? '#f59e0b' : '#4ade80',
          }}
        />
      </div>
      <div className={styles.clockPhase}>{phase}</div>
    </div>
  );
}

// ── Problem description panel ─────────────────────────────────────────────────
function ProblemPanel({ problem }) {
  const diff = getDiffMeta(problem.difficulty);
  return (
    <div className={styles.problemPanel}>
      <div className={styles.problemHeader}>
        <h2 className={styles.problemTitle}>{problem.title}</h2>
        <span className={styles.diffBadge} style={{ color: diff.color, borderColor: diff.color }}>
          {diff.label}
        </span>
      </div>
      <div
        className={styles.problemBody}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(problem.description || problem.title) }}
      />
      {problem.sampleInput && (
        <div className={styles.sampleBlock}>
          <div className={styles.sampleLabel}>Sample Input</div>
          <pre className={styles.samplePre}>{problem.sampleInput}</pre>
        </div>
      )}
      {problem.sampleOutput && (
        <div className={styles.sampleBlock}>
          <div className={styles.sampleLabel}>Expected Output</div>
          <pre className={styles.samplePre}>{problem.sampleOutput}</pre>
        </div>
      )}
      {problem.constraints && (
        <div className={styles.sampleBlock}>
          <div className={styles.sampleLabel}>Constraints</div>
          <pre className={styles.samplePre}>{problem.constraints}</pre>
        </div>
      )}
    </div>
  );
}

// ── Approach screen ───────────────────────────────────────────────────────────
function ApproachScreen({ problem, timeLeft, totalSecs, onProceed }) {
  const [approach, setApproach] = useState('');
  const canProceed = approach.trim().length >= MIN_APPROACH_CHARS;

  return (
    <div className={styles.sessionPage}>
      <header className={styles.sessionHeader}>
        <div className={styles.sessionHeaderLeft}>
          <span className={styles.phaseTag}>Phase 1 — Approach</span>
          <span className={styles.headerSep}>·</span>
          <span className={styles.headerHint}>Plan before you code</span>
        </div>
        <Clock timeLeft={timeLeft} totalSecs={totalSecs} phase="Approach" />
      </header>

      <div className={styles.sessionBody}>
        <div className={styles.leftPane}>
          <ProblemPanel problem={problem} />
        </div>

        <div className={styles.rightPane}>
          <div className={styles.approachHeader}>
            <span className={styles.approachTitle}>Your Approach</span>
            <span className={`${styles.charCount} ${canProceed ? styles.charCountOk : ''}`}>
              {approach.trim().length} / {MIN_APPROACH_CHARS} min chars
            </span>
          </div>
          <textarea
            className={styles.approachArea}
            placeholder={`Think out loud before coding.\n\nExamples:\n— "I'll use a HashMap to track frequencies. O(n) time, O(n) space."\n— "Sliding window with two pointers. Expand right, shrink left when invalid."\n— "Sort + two pointer. Start from both ends."\n\nAt least ${MIN_APPROACH_CHARS} characters required.`}
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            autoFocus
          />
          <div className={styles.approachFooter}>
            <div className={styles.approachHint}>
              {!canProceed
                ? `Write ${MIN_APPROACH_CHARS - approach.trim().length} more characters to unlock coding`
                : '✓ Approach written — you can start coding'}
            </div>
            <button
              className={styles.proceedBtn}
              disabled={!canProceed}
              onClick={() => onProceed(approach)}
            >
              Start Coding →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Async poll helper (shared across Run and auto-submit) ────────────────────
async function pollUntilDone(token) {
  const POLL_INTERVAL = 1500;
  const MAX_ATTEMPTS  = 60;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
    const job = await codeApi.pollJob(token);
    if (job.status === 'DONE')  return { ok: true,  data: job.result };
    if (job.status === 'ERROR') return { ok: false, error: job.error || 'Execution failed' };
  }
  return { ok: false, error: 'Timed out — please try again.' };
}

// ── Coding screen ─────────────────────────────────────────────────────────────
function CodingScreen({ problem, approach, timeLeft, totalSecs, onSubmit, isSubmitting }) {
  const [code, setCode] = useState(problem.starterCode || PROBLEM_STARTER_CODE);
  const [runResult, setRunResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runMsg,    setRunMsg]    = useState('');
  const [testInput, setTestInput] = useState(problem.sampleInput || '');
  const [activeTab, setActiveTab] = useState('output');
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [theme] = useState(() => localStorage.getItem('devlearn_theme') || 'dark');

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0) {
      toast('⏰ Time\'s up! Auto-submitting…', { duration: 2000 });
      onSubmit(code, approach, false);
    }
  }, [timeLeft]); // eslint-disable-line

  async function handleRun() {
    if (!code.trim()) return;
    setIsRunning(true);
    setRunResult(null);
    setRunMsg('Running…');
    setActiveTab('output');

    // Method-only detection: same logic as ProblemSolveView
    const hasTestCases = (() => {
      if (!problem?.testCases) return false;
      try { return JSON.parse(problem.testCases).length > 0; }
      catch { return false; }
    })();
    const isMethodOnly = hasTestCases && !code.includes('public static void main');

    try {
      const { token } = isMethodOnly
        ? await codeApi.testRunAsync(problem.id, code, '17')
        : await codeApi.executeAsync(code, testInput, '17', problem.id);
      const { ok, data, error } = await pollUntilDone(token);
      if (!ok) setRunResult({ status: 'ERROR', error });
      else {
        setRunResult(isMethodOnly ? { ...data, isTestRun: true } : data);
        if (data.compileErrors?.length) applyMarkers(editorRef, monacoRef, data.compileErrors);
      }
    } catch {
      setRunResult({ status: 'ERROR', error: 'Execution failed' });
    } finally {
      setIsRunning(false);
      setRunMsg('');
    }
  }

  return (
    <div className={styles.sessionPage}>
      <header className={styles.sessionHeader}>
        <div className={styles.sessionHeaderLeft}>
          <span className={styles.phaseTag}>Phase 2 — Code</span>
          <span className={styles.headerSep}>·</span>
          <span className={styles.problemTitleSmall}>{problem.title}</span>
          <span className={styles.noHintsBadge}>No hints</span>
        </div>
        <div className={styles.sessionHeaderRight}>
          <Clock timeLeft={timeLeft} totalSecs={totalSecs} phase="Coding" />
          <button
            className={styles.submitBtn}
            onClick={() => onSubmit(code, approach, true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Submit ✓'}
          </button>
        </div>
      </header>

      <div className={styles.sessionBody}>
        {/* Left: problem */}
        <div className={styles.leftPane}>
          <ProblemPanel problem={problem} />
          {/* Approach recap */}
          <div className={styles.approachRecap}>
            <div className={styles.approachRecapLabel}>Your approach</div>
            <div className={styles.approachRecapText}>{approach}</div>
          </div>
        </div>

        {/* Right: editor + output */}
        <div className={styles.rightPane}>
          <div className={styles.editorWrap}>
            <CodeEditor
              value={code}
              onChange={setCode}
              language="java"
              theme={theme}
              fontSize={14}
              height="100%"
              editorRefOut={editorRef}
              monacoRefOut={monacoRef}
            />
          </div>

          {/* Mini output panel */}
          <div className={styles.outputPanel}>
            <div className={styles.outputTabs}>
              <button
                className={`${styles.outputTab} ${activeTab === 'stdin' ? styles.outputTabActive : ''}`}
                onClick={() => setActiveTab('stdin')}
              >Stdin</button>
              <button
                className={`${styles.outputTab} ${activeTab === 'output' ? styles.outputTabActive : ''}`}
                onClick={() => setActiveTab('output')}
              >Output</button>
              <button
                className={styles.runBtn}
                onClick={handleRun}
                disabled={isRunning}
              >
                {isRunning ? '⟳ Running…' : '▶ Run'}
              </button>
            </div>

            {activeTab === 'stdin' && (
              <textarea
                className={styles.stdinArea}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Custom stdin…"
              />
            )}
            {activeTab === 'output' && (
              <div className={styles.outputArea}>
                {!runResult && !isRunning && (
                  <span className={styles.outputEmpty}>Run your code to see output</span>
                )}
                {isRunning && <span className={styles.outputEmpty}>{runMsg || 'Running…'}</span>}
                {runResult && !isRunning && (() => {
                  // Test-run: per-case results (method-only problems)
                  if (runResult.isTestRun) {
                    const cases = runResult.results || [];
                    const passedN = runResult.passedTests ?? cases.filter(r => r.passed).length;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: runResult.allPassed ? '#4ade80' : '#f87171' }}>
                          {runResult.allPassed ? '✓ All cases passed' : `${passedN}/${cases.length} cases passed`}
                        </div>
                        {cases.map((tc, i) => (
                          <div key={i} style={{
                            padding: '6px 8px', borderRadius: 5, fontSize: 11,
                            background: tc.passed ? 'rgba(74,222,128,.08)' : 'rgba(248,113,113,.08)',
                            border: `1px solid ${tc.passed ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)'}`,
                          }}>
                            <span style={{ fontWeight: 700, color: tc.passed ? '#4ade80' : '#f87171' }}>
                              Case {i + 1} {tc.passed ? '✓' : '✗'}
                            </span>
                            {!tc.passed && (
                              <>
                                {tc.input    && <div style={{ color: '#94a3b8', marginTop: 2 }}>In: <code>{tc.input}</code></div>}
                                <div style={{ color: '#f87171' }}>Got: <code>{tc.actual ?? '(empty)'}</code></div>
                                <div style={{ color: '#4ade80' }}>Expected: <code>{tc.expected ?? '(empty)'}</code></div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  // Regular run: raw output
                  return (
                    <>
                      {runResult.compileErrors?.length > 0 && (
                        <div className={styles.outputErrors}>
                          {runResult.compileErrors.map((e, i) => (
                            <div key={i} className={styles.outputError}>Line {e.line}: {e.message}</div>
                          ))}
                        </div>
                      )}
                      <pre className={`${styles.outputPre} ${!runResult.success ? styles.outputPreError : ''}`}>
                        {runResult.output || runResult.error || '(no output)'}
                      </pre>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scorecard screen ──────────────────────────────────────────────────────────
function ScorecardScreen({ problem, submitResult, timeUsed, totalSecs, approach, timedOut, onTryAnother, onReview }) {
  const solved   = submitResult?.allPassed ?? false;
  const passed   = submitResult?.results?.filter(t => t.passed).length ?? 0;
  const total    = submitResult?.results?.length ?? 0;
  const timePct  = Math.min(100, Math.round((timeUsed / totalSecs) * 100));
  const hasApproach = approach?.trim().length >= MIN_APPROACH_CHARS;
  const diff     = getDiffMeta(problem.difficulty);

  return (
    <div className={styles.scorecardPage}>
      <div className={styles.scorecardCard}>

        {/* Result banner */}
        <div className={`${styles.resultBanner} ${solved ? styles.resultSolved : styles.resultFailed}`}>
          <span className={styles.resultIcon}>{solved ? '✓' : timedOut ? '⏰' : '✗'}</span>
          <div>
            <div className={styles.resultTitle}>
              {solved ? 'Accepted' : timedOut ? 'Time\'s Up' : 'Not Accepted'}
            </div>
            <div className={styles.resultSub}>{problem.title}</div>
          </div>
          <span className={styles.resultDiff} style={{ color: diff.color }}>{diff.label}</span>
        </div>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statNum}>{fmtTime(timeUsed)}</div>
            <div className={styles.statLbl}>Time used</div>
            <div className={styles.statSub}>of {fmtTime(totalSecs)}</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum} style={{ color: solved ? '#4ade80' : '#f87171' }}>
              {passed}<span className={styles.statTotal}>/{total}</span>
            </div>
            <div className={styles.statLbl}>Tests passed</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum} style={{ color: hasApproach ? '#4ade80' : '#f87171' }}>
              {hasApproach ? '✓' : '✗'}
            </div>
            <div className={styles.statLbl}>Approach written</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum} style={{ color: '#4ade80' }}>✓</div>
            <div className={styles.statLbl}>No hints used</div>
          </div>
        </div>

        {/* Time bar */}
        <div className={styles.timeBarWrap}>
          <div className={styles.timeBarLabel}>Time used</div>
          <div className={styles.timeBar}>
            <div
              className={styles.timeBarFill}
              style={{
                width: `${timePct}%`,
                background: timePct > 90 ? '#ef4444' : timePct > 70 ? '#f59e0b' : '#4ade80',
              }}
            />
          </div>
          <div className={styles.timeBarPct}>{timePct}%</div>
        </div>

        {/* Approach preview */}
        {hasApproach && (
          <div className={styles.approachPreview}>
            <div className={styles.approachPreviewLabel}>Your approach</div>
            <div className={styles.approachPreviewText}>{approach}</div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.scorecardActions}>
          <button className={styles.tryAnotherBtn} onClick={onTryAnother}>
            Try another →
          </button>
          <button className={styles.reviewBtn} onClick={onReview}>
            Review problem
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InterviewModePage() {
  const navigate = useNavigate();

  const [phase,        setPhase]        = useState('setup');   // setup|loading|approach|coding|scored
  const [difficulty,   setDifficulty]   = useState('MEDIUM');
  const [problem,      setProblem]      = useState(null);
  const [approach,     setApproach]     = useState('');
  const [submitResult, setSubmitResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timedOut,     setTimedOut]     = useState(false);
  const [timeUsed,     setTimeUsed]     = useState(0);

  // Countdown timer
  const totalSecs    = (DIFFICULTY_CONFIG[difficulty]?.minutes ?? 35) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSecs);
  const timerRef     = useRef(null);
  const startedAtRef = useRef(null);
  const codeRef      = useRef('');     // hold latest code for auto-submit

  function startTimer() {
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const left = Math.max(0, totalSecs - elapsed);
      setTimeLeft(left);
      if (left === 0) clearInterval(timerRef.current);
    }, 500);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (startedAtRef.current) {
      setTimeUsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }
  }

  // Load a random problem for the chosen difficulty
  const { refetch: fetchProblems } = useQuery({
    queryKey: ['interviewPool', difficulty],
    queryFn: () => problemsApi.getAll({ difficulty, size: 50, page: 0 }),
    enabled: false,
    staleTime: 5 * 60_000,
  });

  const handleStart = useCallback(async (diff) => {
    setDifficulty(diff);
    setPhase('loading');
    setTimeLeft((DIFFICULTY_CONFIG[diff]?.minutes ?? 35) * 60);
    try {
      const result = await fetchProblems();
      const problems = result.data?.content ?? result.data ?? [];
      if (!problems.length) {
        toast.error('No problems found for this difficulty. Try another.');
        setPhase('setup');
        return;
      }
      const picked = problems[Math.floor(Math.random() * problems.length)];
      // Load full problem details
      const full = await topicsApi.getProblem(picked.id);
      setProblem(full);
      setApproach('');
      setSubmitResult(null);
      setTimedOut(false);
      setPhase('approach');
      startTimer();
    } catch (err) {
      toast.error('Failed to load problem. Is the backend running?');
      setPhase('setup');
    }
  }, [fetchProblems]); // eslint-disable-line

  const handleApproachDone = useCallback((approachText) => {
    setApproach(approachText);
    setPhase('coding');
  }, []);

  const handleSubmit = useCallback(async (code, approachText, manual) => {
    if (isSubmitting) return;
    stopTimer();
    if (!manual) setTimedOut(true);
    setIsSubmitting(true);
    try {
      const solveTimeSecs = startedAtRef.current
        ? Math.floor((Date.now() - startedAtRef.current) / 1000)
        : totalSecs;
      const { token } = await codeApi.submitAsync(
        problem.id, code, solveTimeSecs,
        false,   // no hints
        '17',
        approachText
      );
      const { ok, data, error } = await pollUntilDone(token);
      if (!ok) setSubmitResult({ allPassed: false, results: [], error });
      else setSubmitResult(data);
    } catch {
      setSubmitResult({ allPassed: false, results: [] });
    } finally {
      setIsSubmitting(false);
      setPhase('scored');
    }
  }, [isSubmitting, problem, totalSecs]); // eslint-disable-line

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  if (phase === 'setup') {
    return <SetupScreen onStart={handleStart} />;
  }

  if (phase === 'loading') {
    return (
      <div className={styles.loadingPage}>
        <span className={styles.spinner} />
        <span>Finding a {DIFFICULTY_CONFIG[difficulty]?.label} problem…</span>
      </div>
    );
  }

  if (phase === 'approach') {
    return (
      <ApproachScreen
        problem={problem}
        timeLeft={timeLeft}
        totalSecs={totalSecs}
        onProceed={handleApproachDone}
      />
    );
  }

  if (phase === 'coding') {
    return (
      <CodingScreen
        problem={problem}
        approach={approach}
        timeLeft={timeLeft}
        totalSecs={totalSecs}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  // scored
  return (
    <ScorecardScreen
      problem={problem}
      submitResult={submitResult}
      timeUsed={timeUsed || (totalSecs - timeLeft)}
      totalSecs={totalSecs}
      approach={approach}
      timedOut={timedOut}
      onTryAnother={() => { setPhase('setup'); }}
      onReview={() => navigate(`/?openProblem=${problem.id}`)}
    />
  );
}
