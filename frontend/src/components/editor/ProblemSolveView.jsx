import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { codeApi, topicsApi, problemsApi, submissionsApi, similarApi, QUERY_KEYS } from '../../api';
import { getDiffMeta, PROBLEM_STARTER_CODE } from '../../utils/helpers';
import CodeEditor, { applyMarkers } from './CodeEditor';
import RecallDrillModal from './RecallDrillModal';
import toast from 'react-hot-toast';
import styles from './ProblemSolveView.module.css';

export default function ProblemSolveView({
  problemId, topicId, topicTitle, onBack, onStudyTopic,
  theme, fontSize, onFontChange, onThemeToggle, currentTheme,
}) {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [javaVersion,     setJavaVersion]     = useState('17');
  const [code,            setCode]            = useState('');
  const [syntaxState,     setSyntaxState]     = useState('ready');
  const [syntaxErrors,    setSyntaxErrors]    = useState([]);
  const [activeDescTab,   setActiveDescTab]   = useState('desc');
  const [activeResultTab, setActiveResultTab] = useState('testcase');
  const [testInput,       setTestInput]       = useState('');
  const [runResult,       setRunResult]       = useState(null);
  const [submitResult,    setSubmitResult]    = useState(null);
  const [isRunning,       setIsRunning]       = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [hintsShown,      setHintsShown]      = useState(0);
  const [approach,        setApproach]        = useState('');
  const [splitPos,        setSplitPos]        = useState(40);
  const [cursorPos,       setCursorPos]       = useState({ line: 1, col: 1 });
  const [lineCount,       setLineCount]       = useState(0);
  const [savedAt,         setSavedAt]         = useState(null);
  // ── Recall drill ─────────────────────────────────────────────────────────
  const [recallOpen,      setRecallOpen]      = useState(false);
  // ── Reflect answers (saved to localStorage) ──────────────────────────────
  const [reflectAnswers,  setReflectAnswers]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(`devlearn_reflect_${problemId}`) || 'null') || {}; }
    catch { return {}; }
  });
  // ── Solve timer ──────────────────────────────────────────────────────────
  const [timerSec,        setTimerSec]        = useState(0);
  const solveStartRef = useRef(Date.now());

  const splitRef    = useRef(null);
  const isResizing  = useRef(false);
  const editorRef   = useRef(null);
  const monacoRef   = useRef(null);

  // ── Problem data ──────────────────────────────────────────────────────────
  const { data: problem, isLoading } = useQuery({
    queryKey: QUERY_KEYS.problem(problemId),
    queryFn:  () => topicsApi.getProblem(problemId),
    enabled:  !!problemId,
    staleTime: 10 * 60 * 1000,
  });

  // Similar problems — fetched once after accepted submit
  const { data: similarProblems = [] } = useQuery({
    queryKey: QUERY_KEYS.similarProblems(problemId),
    queryFn:  () => similarApi.getSimilar(problemId),
    enabled:  !!submitResult?.allPassed && !!problemId,
    staleTime: 10 * 60 * 1000,
  });

  // Editorial — fetched lazily; re-fetched after accepted submit
  const { data: editorial, refetch: refetchEditorial } = useQuery({
    queryKey: QUERY_KEYS.editorial(problemId),
    queryFn:  () => problemsApi.getEditorial(problemId),
    enabled:  false,
    retry:    false,
  });

  // ── Submission history — loaded when user opens Submissions tab ───────────
  const { data: submissionHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['submissionHistory', problemId],
    queryFn:  () => submissionsApi.getHistory(problemId),
    enabled:  false,
    staleTime: 30 * 1000,
  });

  // ── Initialize on problem change ──────────────────────────────────────────
  useEffect(() => {
    if (!problem) return;
    const saved = sessionStorage.getItem(`devlearn_code_${problemId}`);
    const initial = saved || problem.starterCode || PROBLEM_STARTER_CODE;
    setCode(initial);
    setLineCount(initial.split('\n').length);
    setTestInput(problem.sampleInput || '');
    const savedApproach = localStorage.getItem(`devlearn_approach_${problemId}`) || '';
    setApproach(savedApproach);
    setHintsShown(0);
    setRunResult(null);
    setSubmitResult(null);
    setSyntaxState('ready');
    setSyntaxErrors([]);
    // Reset solve timer
    solveStartRef.current = Date.now();
    setTimerSec(0);
  }, [problem, problemId]);

  // ── Auto-save code to sessionStorage ─────────────────────────────────────
  useEffect(() => {
    if (!code || !problemId) return;
    sessionStorage.setItem(`devlearn_code_${problemId}`, code);
    setLineCount(code.split('\n').length);
    setSavedAt(Date.now());
  }, [code, problemId]);

  // ── Solve timer tick ──────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTimerSec(Math.floor((Date.now() - solveStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Derived: is this problem already solved? ──────────────────────────────
  // BUG FIX: problemId prop may arrive as string (URL param) or number (API).
  // localStorage stores numbers via JSON.stringify. Normalise both sides to
  // Number so .includes() never silently misses and locks the editorial.
  const _pid = Number(problemId);
  const isSolved = submitResult?.allPassed ||
    JSON.parse(localStorage.getItem('devlearn_solved') || '[]')
      .map(Number).includes(_pid);

  // ── Retry helper — auto-retries on 429 with exponential backoff ─────────────
  // When the server is at capacity (semaphore full), retries up to 4 times
  // before giving up. User sees "Queued… retrying (1/4)" instead of an error.
  async function withRetry(fn, { maxAttempts = 4, baseDelayMs = 3000 } = {}) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const isCapacity = err.response?.status === 429 && err.isServerBusy;
        if (isCapacity && attempt < maxAttempts) {
          const delay = baseDelayMs * attempt; // 3s, 6s, 9s, 12s
          setRunResult?.({ loading: true, retryMsg: `Server busy — retrying (${attempt}/${maxAttempts - 1}) in ${delay / 1000}s…` });
          setSubmitResult?.({ loading: true, retryMsg: `Server busy — retrying (${attempt}/${maxAttempts - 1}) in ${delay / 1000}s…` });
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err; // rate limit or non-retryable error — surface to user
      }
    }
  }

  // ── Run ───────────────────────────────────────────────────────────────────
  async function handleRun() {
    if (!code.trim()) return;
    setSubmitResult(null);
    setIsRunning(true);
    setActiveResultTab('result');
    setRunResult({ loading: true });
    try {
      const res = await withRetry(() => codeApi.execute(code, testInput, javaVersion));
      setRunResult(res);
      if (res.compileErrors?.length) {
        applyMarkers(editorRef, monacoRef, res.compileErrors);
      }
    } catch (err) {
      if (err.isRateLimit) {
        setRunResult({ status: 'RATE_LIMITED', error: err.userMessage });
      } else if (err.isServerBusy || err.response?.status === 429) {
        setRunResult({ status: 'SERVER_BUSY', error: 'Server is at capacity. Please try again in a moment.' });
      } else {
        setRunResult({ status: 'ERROR', error: 'Server unreachable — is Spring Boot running?' });
      }
    } finally { setIsRunning(false); }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!code.trim()) return;
    setIsSubmitting(true);
    setActiveResultTab('result');
    setSubmitResult({ loading: true });
    // BUG FIX: pass actual elapsed solve time instead of always 0
    const solveTimeSecs = Math.floor((Date.now() - solveStartRef.current) / 1000);
    try {
      const res = await withRetry(() => codeApi.submit(problemId, code, solveTimeSecs, hintsShown >= 3, javaVersion, approach));
      setSubmitResult(res);
      if (res.compileErrors?.length) {
        applyMarkers(editorRef, monacoRef, res.compileErrors);
      }
      if (res.allPassed) {
        const solved = JSON.parse(localStorage.getItem('devlearn_solved') || '[]').map(Number);
        const isFirstSolve = !solved.includes(_pid);
        toast.success('✅ Accepted! Editorial unlocked.');
        if (isFirstSolve) {
          localStorage.setItem('devlearn_solved', JSON.stringify([...solved, _pid]));
        }
        qc.invalidateQueries({ queryKey: QUERY_KEYS.solvedIds });
        refetchEditorial();
        // Fire recall drill only on the very first AC for this problem
        if (isFirstSolve) {
          setTimeout(() => setRecallOpen(true), 600);
        }
      }
    } catch (err) {
      if (err.isRateLimit) {
        setSubmitResult({ status: 'RATE_LIMITED', error: err.userMessage });
      } else if (err.isServerBusy || err.response?.status === 429) {
        setSubmitResult({ status: 'SERVER_BUSY', error: 'Server is busy — please retry in a few seconds.' });
      } else {
        setSubmitResult({ error: 'Submission failed — server error' });
      }
    } finally { setIsSubmitting(false); }
  }

  // ── Keyboard shortcuts: Ctrl+Enter = Run, Ctrl+Shift+Enter = Submit ───────
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) handleSubmit();
        else            handleRun();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, testInput, javaVersion]);

  // ── Smart back button ─────────────────────────────────────────────────────
  function handleBack() {
    const from = location.state?.from || window.history.state?.from;
    if (from === '/problems') navigate('/problems');
    else onBack();
  }

  // ── Resizable split ───────────────────────────────────────────────────────
  const startResize = useCallback((e) => {
    isResizing.current = true;
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, []);

  useEffect(() => {
    function onMove(e) {
      if (!isResizing.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      setSplitPos(Math.max(25, Math.min(((e.clientX - rect.left) / rect.width) * 100, 68)));
    }
    function onUp() {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  // ── Click on error → jump to line in Monaco ───────────────────────────────
  // BUG FIX: previously just set desc tab, never actually jumped to the line.
  function jumpToError(error) {
    if (editorRef.current && error.line) {
      editorRef.current.revealLineInCenter(error.line);
      editorRef.current.setPosition({ lineNumber: error.line, column: error.column || 1 });
      editorRef.current.focus();
    }
  }

  // ── Submissions tab open → fetch history; Editorial tab → fetch if solved ──
  function handleDescTabChange(tab) {
    setActiveDescTab(tab);
    if (tab === 'submissions') refetchHistory();
    // BUG FIX: editorial query has enabled:false so it never runs automatically.
    // When user clicks the editorial tab (on a previously-solved problem, or after
    // solving this session), manually trigger the fetch.
    if (tab === 'editorial' && isSolved) refetchEditorial();
  }

  if (isLoading) return (
    <div className={styles.loading}><span className="spinner" /><span>Loading problem…</span></div>
  );
  if (!problem) return null;

  const diff      = getDiffMeta(problem.difficulty);
  const errCount  = syntaxErrors.length;
  const warnCount = syntaxErrors.filter(e => e.severity === 'warning').length;
  const realErrs  = errCount - warnCount;

  return (
    <div className={styles.psView}>

      {/* ══ TOPBAR ══════════════════════════════════════════════════════════ */}
      <div className={styles.topbar}>
        <div className={styles.topLeft}>
          <button className={styles.backBtn} onClick={handleBack}>← Back</button>
          <span className={styles.probName}>{problem.title}</span>
          <span className={`badge ${diff.cls}`}>{diff.label}</span>
          {isSolved && <span className={styles.solvedBadge}>✓ Solved</span>}
        </div>

        <div className={styles.topRight}>
          <span className={styles.timer} title="Time spent on this problem">
            ⏱ {formatTimer(timerSec)}
          </span>

          <div className={`${styles.syntaxPill} ${styles[syntaxState]}`}>
            <div className={styles.syntaxDot} />
            <span>
              {syntaxState === 'checking' ? 'Checking…'
               : realErrs > 0  ? `${realErrs} error${realErrs !== 1 ? 's' : ''}`
               : warnCount > 0 ? `${warnCount} warning${warnCount !== 1 ? 's' : ''}`
               : syntaxState === 'ok' ? 'No errors'
               : ''}
            </span>
          </div>

          {onFontChange && (
            <div className={styles.fontGroup}>
              <button className={styles.fontBtn} onClick={() => onFontChange(-1)}>A−</button>
              <span className={styles.fontVal}>{fontSize}</span>
              <button className={styles.fontBtn} onClick={() => onFontChange(1)}>A+</button>
            </div>
          )}

          {onThemeToggle && (
            <button className={styles.iconBtn} onClick={onThemeToggle} title="Toggle theme">
              {currentTheme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          <select value={javaVersion} onChange={(e) => setJavaVersion(e.target.value)} className={styles.versionSelect}>
            <option value="8">Java 8</option>
            <option value="11">Java 11</option>
            <option value="17">Java 17</option>
            <option value="21">Java 21</option>
          </select>

          <button className={styles.runBtn} onClick={handleRun} disabled={isRunning}
            title="Run (Ctrl+Enter)">
            {isRunning ? <><span className="spinner" style={{width:12,height:12}} />Running…</> : '▶ Run'}
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}
            title="Submit (Ctrl+Shift+Enter)">
            {isSubmitting ? <><span className="spinner" style={{width:12,height:12}} />…</> : '⬆ Submit'}
          </button>
        </div>
      </div>

      {/* ══ SPLIT LAYOUT ════════════════════════════════════════════════════ */}
      <div className={styles.split} ref={splitRef}>

        {/* ── LEFT: Problem panel ─────────────────────────────────────────── */}
        <div className={styles.leftPanel} style={{ width: `${splitPos}%` }}>
          <div className="tab-bar">
            {[
              ['desc',        'Description'],
              ['approach',    'My Approach'],
              ['hints',       `Hints${hintsShown > 0 ? ` (${hintsShown})` : ''}`],
              ['submissions', 'Submissions'],
              ['editorial',   'Editorial'],
              ...(isSolved ? [['reflect', '✍️ Reflect']] : []),
            ].map(([t, l]) => (
              <button key={t} className={`tab-btn ${activeDescTab === t ? 'active' : ''}`}
                onClick={() => handleDescTabChange(t)}>{l}</button>
            ))}
          </div>
          <div className={styles.descBody}>
            {activeDescTab === 'desc'        && <DescriptionTab problem={problem} diff={diff} />}
            {activeDescTab === 'approach'    && <ApproachTab problemId={problemId} value={approach} onChange={setApproach} />}
            {activeDescTab === 'hints'       && <HintsTab problem={problem} hintsShown={hintsShown} onShowHint={(n) => setHintsShown(Math.max(hintsShown, n))} />}
            {activeDescTab === 'submissions' && <SubmissionsTab history={submissionHistory} />}
            {activeDescTab === 'editorial'   && (
              isSolved ? (
                <EditorialTab problem={problem} editorial={editorial} />
              ) : (
                <div className={styles.editorialLocked}>
                  <span>🔒</span>
                  <p>Solve the problem to unlock the editorial.</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    Submit a correct solution to see the approach and solution code.
                  </p>
                </div>
              )
            )}
            {activeDescTab === 'reflect' && isSolved && (
              <ReflectTab
                problemId={problemId}
                answers={reflectAnswers}
                onChange={(updated) => {
                  setReflectAnswers(updated);
                  localStorage.setItem(`devlearn_reflect_${problemId}`, JSON.stringify(updated));
                }}
              />
            )}
          </div>
        </div>

        {/* Resize handle */}
        <div className={styles.resizeHandle} onMouseDown={startResize} />

        {/* ── RIGHT: IDE panel ────────────────────────────────────────────── */}
        <div className={styles.rightPanel}>
          {/* File tab bar */}
          <div className={styles.fileTabBar}>
            <div className={styles.fileTab}>
              <span className={styles.fileTabIcon}>☕</span>
              <span>Solution.java</span>
              {savedAt && <span className={styles.savedDot} title="Auto-saved" />}
            </div>
            <div className={styles.fileTabActions}>
              <span className={styles.shortcutHint} title="Run: Ctrl+Enter  Submit: Ctrl+Shift+Enter">
                ⌨ Ctrl+↵ Run · Ctrl+⇧+↵ Submit
              </span>
            </div>
          </div>

          {/* Monaco editor */}
          <div className={styles.editorWrap}>
            <CodeEditor
              value={code}
              onChange={setCode}
              theme={theme}
              fontSize={fontSize}
              javaVersion={javaVersion}
              onSyntaxChange={(state, errors) => { setSyntaxState(state); setSyntaxErrors(errors); }}
              onCursorChange={(line, col) => setCursorPos({ line, col })}
              editorRefOut={editorRef}
              monacoRefOut={monacoRef}
            />
          </div>

          {/* ── Error list (clickable → jump to line) ────────────────────── */}
          {syntaxErrors.length > 0 && (
            <div className={styles.errorList}>
              <div className={styles.errorListHeader}>
                <span>⚠ Problems</span>
                <span style={{ color: 'var(--text3)', fontWeight: 400 }}>
                  {realErrs > 0 && <span style={{ color: 'var(--red)', marginRight: 8 }}>● {realErrs} error{realErrs !== 1 ? 's' : ''}</span>}
                  {warnCount > 0 && <span style={{ color: 'var(--yellow)' }}>● {warnCount} warning{warnCount !== 1 ? 's' : ''}</span>}
                </span>
                <button className={styles.errorClose} onClick={() => setSyntaxErrors([])}>✕</button>
              </div>
              {syntaxErrors.slice(0, 5).map((e, i) => (
                <div key={i} className={`${styles.errorRow} ${e.severity === 'warning' ? styles.warnRow : ''}`}
                  onClick={() => jumpToError(e)} title="Click to jump to line in editor">
                  <span className={styles.errorSev}>{e.severity === 'warning' ? '⚠' : '✕'}</span>
                  <span className={styles.errorLoc}>Ln {e.line}{e.column ? `, Col ${e.column}` : ''}</span>
                  <span className={styles.errorMsg}>{e.message}</span>
                </div>
              ))}
              {syntaxErrors.length > 5 && (
                <div className={styles.errorMore}>+{syntaxErrors.length - 5} more errors</div>
              )}
            </div>
          )}

          {/* ── IDE Status bar ───────────────────────────────────────────── */}
          <div className={styles.statusBar}>
            <div className={styles.statusLeft}>
              <span className={`${styles.statusItem} ${styles.statusSyntax} ${styles[syntaxState]}`}>
                {syntaxState === 'checking' ? '⟳' : errCount > 0 ? `✕ ${errCount}` : '✓'}
              </span>
              <span className={styles.statusItem}>
                {errCount === 0 ? '✓ No problems' : `${errCount} problem${errCount !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className={styles.statusRight}>
              <span className={styles.statusItem} title="Lines of code">
                {lineCount} line{lineCount !== 1 ? 's' : ''}
              </span>
              <span className={styles.statusDivider}>│</span>
              <span className={styles.statusItem} title="Cursor position">
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
              <span className={styles.statusDivider}>│</span>
              <span className={styles.statusItem} title="Language">☕ Java {javaVersion}</span>
              <span className={styles.statusDivider}>│</span>
              <span className={styles.statusItem} title="Encoding">UTF-8</span>
              {isSolved && (
                <>
                  <span className={styles.statusDivider}>│</span>
                  <span className={styles.statusItem} style={{ color: 'var(--success)' }}>✅ Accepted</span>
                </>
              )}
            </div>
          </div>

          {/* ── Bottom: test / result ────────────────────────────────────── */}
          <div className={styles.bottomPanel}>
            <div className={styles.bottomBar}>
              <button className={`${styles.bottomTab} ${activeResultTab === 'testcase' ? styles.activeTab : ''}`}
                onClick={() => setActiveResultTab('testcase')}>
                📋 Testcase
              </button>
              <button className={`${styles.bottomTab} ${activeResultTab === 'result' ? styles.activeTab : ''}`}
                onClick={() => setActiveResultTab('result')}>
                {(isRunning || isSubmitting) && <span className="spinner" style={{ width: 10, height: 10 }} />}
                {' '}Output
              </button>
              <div style={{ flex: 1 }} />
              {isRunning   && <span className={styles.runningBadge}>▶ Running…</span>}
              {isSubmitting && <span className={styles.runningBadge} style={{ background: 'rgba(74,222,128,.1)', color: 'var(--accent)' }}>⬆ Evaluating…</span>}
            </div>
            <div className={styles.bottomBody}>
              {activeResultTab === 'testcase' && (
                <TestcasePanel
                  testInput={testInput}
                  setTestInput={setTestInput}
                  sampleInput={problem.sampleInput}
                  sampleOutput={problem.sampleOutput}
                />
              )}
              {activeResultTab === 'result' && (
                <ResultPanel runResult={runResult} submitResult={submitResult} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Similar Problems — shown after ACCEPTED ───────────────────── */}
      {submitResult?.allPassed && similarProblems.length > 0 && (
        <SimilarProblemsBar problems={similarProblems} onOpen={(p) => navigate(`/?openProblem=${p.id}&from=problems`)} />
      )}

      {/* ── Recall Drill Modal — fires once on first AC ──────────────── */}
      <RecallDrillModal
        isOpen={recallOpen}
        onClose={() => setRecallOpen(false)}
        topicId={topicId ?? null}
        topicTitle={topicTitle || ''}
        problemTitle={problem?.title || ''}
      />
    </div>
  );
}

// ── Lightweight markdown renderer (no extra dependency) ───────────────────────
// Handles: **bold**, `code`, newlines → paragraphs, **Example:** headers
function MDText({ text }) {
  if (!text) return null;

  // Split on double newlines to get paragraphs; single newlines preserved within
  const paragraphs = text.split(/\n{2,}/);

  return (
    <>
      {paragraphs.map((para, pi) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Render inline: **bold**, `code`
        const renderInline = (str) => {
          const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          return parts.map((p, i) => {
            if (p.startsWith('**') && p.endsWith('**'))
              return <strong key={i}>{p.slice(2, -2)}</strong>;
            if (p.startsWith('`') && p.endsWith('`'))
              return <code key={i} style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3, fontFamily: 'var(--font-code)', fontSize: '0.85em' }}>{p.slice(1, -1)}</code>;
            // Preserve single newlines within a paragraph as line breaks
            return p.split('\n').flatMap((line, li, arr) =>
              li < arr.length - 1 ? [line, <br key={`br-${i}-${li}`} />] : [line]
            );
          });
        };

        return (
          <p key={pi} style={{ margin: '0 0 10px', lineHeight: 1.65 }}>
            {renderInline(trimmed)}
          </p>
        );
      })}
    </>
  );
}

// ── Timer formatter ────────────────────────────────────────────────────────────
function formatTimer(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Description tab ───────────────────────────────────────────────────────────
function DescriptionTab({ problem, diff }) {
  return (
    <div className={styles.descContent}>
      <div className={styles.probMeta}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-code)' }}>#{problem.displayOrder}</span>
        <h2 className={styles.probTitle}>{problem.title}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <span className={`badge ${diff.cls}`}>{diff.label}</span>
          {problem.pattern && (
            <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border2)', fontSize: 10 }}>
              🏷 {problem.pattern}
            </span>
          )}
        </div>
      </div>
      <div className={styles.probDesc}><MDText text={problem.description} /></div>
      {(problem.inputFormat || problem.outputFormat) && (
        <div className={styles.formatBlock}>
          {problem.inputFormat  && <p><strong>Input:</strong> {problem.inputFormat}</p>}
          {problem.outputFormat && <p><strong>Output:</strong> {problem.outputFormat}</p>}
        </div>
      )}
      <div className={styles.exampleBlock}>
        <div className={styles.exLabel}>Example</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Input</div>
            <pre className={styles.exPre}>{problem.sampleInput || 'N/A'}</pre>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Output</div>
            <pre className={styles.exPre}>{problem.sampleOutput || 'N/A'}</pre>
          </div>
        </div>
      </div>
      {/* Constraints section */}
      {problem.constraints && (
        <div className={styles.constraintsBlock}>
          <div className={styles.exLabel}>Constraints</div>
          <pre className={styles.exPre} style={{ whiteSpace: 'pre-wrap' }}>{problem.constraints}</pre>
        </div>
      )}
    </div>
  );
}

// ── Approach tab — BUG FIX: auto-saves on change (debounced) ─────────────────
function ApproachTab({ problemId, value, onChange }) {
  // Auto-save with 800ms debounce — user no longer loses work on navigate
  useEffect(() => {
    if (!value || !problemId) return;
    const t = setTimeout(() => {
      localStorage.setItem(`devlearn_approach_${problemId}`, value);
    }, 800);
    return () => clearTimeout(t);
  }, [value, problemId]);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>✍️ Write your approach first</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
        Describe your algorithm before coding — the single most impactful interview habit.
        <span style={{ color: 'var(--accent)', marginLeft: 6 }}>Auto-saved.</span>
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={10}
        placeholder="Example: I'll use a HashMap to store each number as I scan. For each element, check if the complement (target - x) exists in the map…"
        style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
          borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 12,
          lineHeight: 1.6, padding: '10px 12px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

// ── Hints tab ─────────────────────────────────────────────────────────────────
function HintsTab({ problem, hintsShown, onShowHint }) {
  const hints = [
    { num: 1, title: 'Hint 1 — Direction',  sub: 'Always free',             text: problem.hint1 || problem.hint },
    { num: 2, title: 'Hint 2 — Approach',   sub: 'Reveals the pattern',     text: problem.hint2 },
    { num: 3, title: 'Hint 3 — Pseudocode', sub: '⚑ Marks hint-assisted',   text: problem.hint3 },
  ].filter((h) => h.text);

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {hints.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 12 }}>No hints for this problem.</div>}
      {hints.map((hint) => (
        <div key={hint.num}>
          <button onClick={() => onShowHint(hint.num)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left',
            transition: '.15s', opacity: hintsShown >= hint.num ? .6 : 1,
          }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{hint.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{hint.sub}</div>
            </div>
            <span style={{ color: 'var(--text3)', fontWeight: 700 }}>{hintsShown >= hint.num ? '▼' : '›'}</span>
          </button>
          {hintsShown >= hint.num && (
            <div style={{ margin: '4px 0 0 4px', padding: '10px 14px', background: 'var(--bg3)',
              borderLeft: '3px solid var(--accent)', borderRadius: '0 6px 6px 0',
              fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
              {hint.text}
            </div>
          )}
        </div>
      ))}
      {hintsShown >= 3 && (
        <div style={{ padding: '6px 10px', background: 'rgba(248,113,113,.08)',
          border: '1px solid rgba(248,113,113,.2)', borderRadius: 5,
          fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
          ⚑ This submission will be marked as hint-assisted
        </div>
      )}
    </div>
  );
}

// ── Submissions History tab ────────────────────────────────────────────────────
const STATUS_META = {
  ACCEPTED:      { color: 'var(--accent)',  label: 'Accepted',           icon: '✅' },
  WRONG_ANSWER:  { color: 'var(--red)',     label: 'Wrong Answer',        icon: '❌' },
  COMPILE_ERROR: { color: 'var(--red)',     label: 'Compile Error',       icon: '🔴' },
  RUNTIME_ERROR: { color: 'var(--red)',     label: 'Runtime Error',       icon: '🔴' },
  TLE:           { color: 'var(--yellow)',  label: 'Time Limit',          icon: '⏰' },
  BLOCKED:       { color: 'var(--yellow)',  label: 'Not Permitted',       icon: '🚫' },
  RATE_LIMITED:  { color: 'var(--yellow)',  label: 'Rate Limit Reached',  icon: '⏳' },
  SERVER_BUSY:   { color: 'var(--yellow)',  label: 'Server Busy',         icon: '🔄' },
};

function SubmissionsTab({ history }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
        No submissions yet. Hit ⬆ Submit to evaluate your solution.
      </div>
    );
  }

  return (
    <div className={styles.submissionsTab}>
      {history.map((sub) => {
        const meta = STATUS_META[sub.status] || { color: 'var(--text3)', label: sub.status, icon: '·' };
        const date = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        return (
          <div key={sub.id} className={styles.subRow}>
            <div className={styles.subStatus} style={{ color: meta.color }}>
              {meta.icon} {meta.label}
            </div>
            <div className={styles.subMeta}>
              {sub.passedTests != null && (
                <span className={styles.subChip}>{sub.passedTests}/{sub.totalTests} tests</span>
              )}
              {sub.executionTimeMs > 0 && (
                <span className={styles.subChip}>⏱ {sub.executionTimeMs}ms</span>
              )}
              {sub.hintAssisted && (
                <span className={styles.subChip} style={{ color: 'var(--yellow)' }}>💡 hint</span>
              )}
            </div>
            <div className={styles.subDate}>{date}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Editorial tab ─────────────────────────────────────────────────────────────
function EditorialTab({ problem, editorial }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--accent)' }}>Editorial Unlocked</div>
      </div>
      {problem.bruteForce && (
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)', marginBottom: 6 }}>🐌 Brute Force</div>
          <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>{problem.bruteForce}</p>
        </div>
      )}
      {problem.optimizedApproach && (
        <div style={{ background: 'rgba(74,222,128,.04)', border: '1px solid rgba(74,222,128,.15)', borderLeft: '3px solid var(--accent)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--accent)', marginBottom: 6 }}>⚡ Optimal Approach</div>
          <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7 }}>{problem.optimizedApproach}</p>
        </div>
      )}
      {editorial?.solutionCode && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)', marginBottom: 8 }}>💻 Solution Code</div>
          <pre className="code-block" style={{ fontSize: 12 }}>{editorial.solutionCode}</pre>
        </div>
      )}
      {(editorial?.editorial) && (
        <div style={{ background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)', borderLeft: '3px solid #6366f1', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: '#6366f1', marginBottom: 6 }}>💡 Key Insight</div>
          <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8, margin: 0 }}>{editorial.editorial}</p>
        </div>
      )}
      {(editorial?.hint3 || problem.hint3) && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)', marginBottom: 8 }}>📝 Key Steps</div>
          <pre className="code-block" style={{ fontSize: 12 }}>{editorial?.hint3 || problem.hint3}</pre>
        </div>
      )}
      {!editorial?.solutionCode && !editorial?.editorial && !problem.bruteForce && !problem.hint3 && (
        <div style={{ color: 'var(--text3)', fontSize: 12 }}>Editorial content not yet added for this problem.</div>
      )}
    </div>
  );
}

// ── Testcase panel ────────────────────────────────────────────────────────────
function TestcasePanel({ testInput, setTestInput, sampleInput, sampleOutput }) {
  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)' }}>
          stdin — passed to ▶ Run
        </div>
        {sampleInput && (
          <button onClick={() => setTestInput(sampleInput)} style={{
            background: 'none', border: '1px solid var(--border2)', borderRadius: 4,
            color: 'var(--text3)', fontSize: 10, padding: '2px 8px', cursor: 'pointer',
            fontFamily: 'var(--font-ui)', fontWeight: 600,
          }}>↺ Reset to sample</button>
        )}
      </div>
      <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} rows={4}
        style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
          borderRadius: 5, color: 'var(--text)', fontFamily: 'var(--font-code)',
          fontSize: 12, padding: 8, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
      {sampleOutput && (
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
          Expected: <code style={{ background: 'var(--bg4)', padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--font-code)', color: 'var(--accent)' }}>{sampleOutput}</code>
        </div>
      )}
    </div>
  );
}

// ── Similar Problems bar — shown below the split layout after ACCEPTED ────────
function SimilarProblemsBar({ problems, onOpen }) {
  const DIFF = { EASY: { color: '#4ade80', label: 'Easy' }, MEDIUM: { color: '#f59e0b', label: 'Medium' }, HARD: { color: '#f87171', label: 'Hard' } };
  return (
    <div style={{
      margin: '0 0 0',
      padding: '12px 20px',
      background: 'var(--bg2)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
        Try next →
      </span>
      {problems.map((p) => {
        const d = DIFF[p.difficulty] || { color: 'var(--text3)', label: p.difficulty };
        return (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              color: 'var(--text)',
              transition: 'border-color .15s',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            {p.title}
          </button>
        );
      })}
    </div>
  );
}

// ── Reflect tab — explain-it-back after solving ───────────────────────────────
const REFLECT_FIELDS = [
  {
    key: 'approach',
    label: '✍️ Explain your approach in one sentence',
    placeholder: 'e.g. "I stored each number in a HashMap and checked if the complement existed on each iteration."',
  },
  {
    key: 'complexity',
    label: '⏱ What is the time & space complexity? Why?',
    placeholder: 'e.g. "O(n) time because we scan the array once. O(n) space for the HashMap in the worst case."',
  },
  {
    key: 'edgeCase',
    label: '⚠️ What edge case almost caught you?',
    placeholder: 'e.g. "I forgot to handle the case where the same element is used twice — needed to check i ≠ j."',
  },
];

function ReflectTab({ problemId, answers, onChange }) {
  const allFilled = REFLECT_FIELDS.every((f) => (answers[f.key] || '').trim());
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
          Explain it back
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
          The best way to cement a solution: explain it to yourself before moving on.
          Answers are saved locally.
        </div>
      </div>

      {REFLECT_FIELDS.map((field) => (
        <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{field.label}</label>
          <textarea
            rows={3}
            value={answers[field.key] || ''}
            onChange={(e) => onChange({ ...answers, [field.key]: e.target.value })}
            placeholder={field.placeholder}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-ui)',
              fontSize: 12, lineHeight: 1.6, padding: '8px 10px',
              resize: 'vertical', outline: 'none',
            }}
          />
        </div>
      ))}

      {allFilled && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(74,222,128,.06)',
          border: '1px solid rgba(74,222,128,.2)',
          borderRadius: 8,
          fontSize: 12, color: 'var(--accent)',
          fontWeight: 600,
        }}>
          ✅ Great job! You've reflected on all three dimensions of this problem.
        </div>
      )}
    </div>
  );
}

// ── Result panel ──────────────────────────────────────────────────────────────
function ResultPanel({ runResult, submitResult }) {
  if (!runResult && !submitResult) return (
    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
      Press ▶ Run (Ctrl+Enter) to test with your input,<br />
      or ⬆ Submit (Ctrl+⇧+Enter) to evaluate all test cases.
    </div>
  );

  const active = submitResult || runResult;
  if (active.loading) {
    const retryMsg = active.retryMsg;
    const msg = retryMsg
      ? retryMsg
      : submitResult?.loading ? 'Evaluating all test cases…' : 'Running code…';
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 16, color: retryMsg ? 'var(--yellow)' : 'var(--text3)', fontSize: 12 }}>
        <span className="spinner" />{msg}
      </div>
    );
  }

  // ── Run result ────────────────────────────────────────────────────────────
  if (!submitResult) {
    const ok = runResult.status === 'SUCCESS';
    return (
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{ok ? '✅' : '❌'}</span>
          <span style={{ fontWeight: 700, color: ok ? 'var(--success)' : 'var(--red)', fontSize: 14 }}>
            {ok ? 'Compiled & Ran Successfully' : runResult.status || 'Runtime Error'}
          </span>
          {runResult.executionTimeMs != null && (
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
              ⏱ {runResult.executionTimeMs}ms
            </span>
          )}
        </div>
        {runResult.output && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)', marginBottom: 4 }}>Output</div>
            <pre className="code-block" style={{ fontSize: 12 }}>{runResult.output}</pre>
          </div>
        )}
        {runResult.error && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--red)', marginBottom: 4 }}>Error</div>
            <pre className="code-block" style={{ fontSize: 12, color: 'var(--red)', borderColor: 'rgba(248,113,113,.2)' }}>{runResult.error}</pre>
          </div>
        )}
      </div>
    );
  }

  // ── Submit result ─────────────────────────────────────────────────────────
  const pass    = submitResult.allPassed;
  const dots    = submitResult.results || [];
  const failed  = dots.filter((r) => !r.passed);
  const passedN = submitResult.passedTests ?? dots.filter(r => r.passed).length;
  const totalN  = submitResult.totalTests  ?? dots.length;

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>{pass ? '✅' : '❌'}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: pass ? 'var(--success)' : 'var(--red)' }}>
            {pass ? 'Accepted' : submitResult.status || 'Wrong Answer'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {passedN}/{totalN} test cases passed
            {submitResult.runtimeMs > 0 && ` · ⏱ ${submitResult.runtimeMs}ms`}
          </div>
        </div>
        {submitResult.percentile > 0 && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent3)' }}>Top {100 - submitResult.percentile}%</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Faster than {submitResult.percentile}% of submissions</div>
          </div>
        )}
      </div>

      {/* Test case dots */}
      {dots.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 5 }}>Test Cases</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {dots.map((tc, i) => (
              <div key={i} title={`Test ${i + 1}: ${tc.passed ? 'PASS' : 'FAIL'}`}
                style={{ width: 12, height: 12, borderRadius: 3, cursor: 'default',
                  background: tc.passed ? 'var(--success)' : 'var(--red)' }} />
            ))}
          </div>
        </div>
      )}

      {/* Failed case detail */}
      {failed.slice(0, 2).map((tc, i) => (
        <div key={i} style={{ padding: '10px 12px', background: 'rgba(248,113,113,.05)',
          border: '1px solid rgba(248,113,113,.15)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>
            Test Case {tc.testNumber || i + 1} — {tc.status === 'COMPILE_ERROR' ? 'Compile Error' : tc.status === 'RUNTIME_ERROR' ? 'Runtime Error' : tc.status === 'TIMEOUT' ? 'Time Limit Exceeded' : 'Wrong Answer'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '3px 10px', fontSize: 11 }}>
            {tc.input && <><span style={{ color: 'var(--text3)' }}>Input</span>
            <code style={{ fontFamily: 'var(--font-code)', color: 'var(--text)' }}>{String(tc.input)}</code></>}
            {tc.expected && <><span style={{ color: 'var(--text3)' }}>Expected</span>
            <code style={{ fontFamily: 'var(--font-code)', color: 'var(--success)' }}>{String(tc.expected)}</code></>}
            <span style={{ color: 'var(--text3)' }}>Got</span>
            <code style={{ fontFamily: 'var(--font-code)', color: 'var(--red)' }}>{String(tc.actual || '')}</code>
          </div>
        </div>
      ))}

      {/* Smart feedback card — algorithm detection */}
      {submitResult.detectedPattern && submitResult.detectedPattern !== 'UNKNOWN' && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--adim2)',
          border: '1px solid rgba(99,102,241,.2)',
          borderRadius: 8,
          display: 'flex', flexDirection: 'column', gap: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13 }}>🔍</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent3)' }}>
              Pattern detected: {submitResult.detectedPattern.replace(/_/g, ' ')}
            </span>
          </div>
          {submitResult.methodologyExplanation && (
            <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, paddingLeft: 21 }}>
              {submitResult.methodologyExplanation}
            </div>
          )}
          {submitResult.optimizationNote && (
            <div style={{
              fontSize: 11, color: 'var(--yellow)', paddingLeft: 21,
              display: 'flex', gap: 5, alignItems: 'flex-start'
            }}>
              <span>💡</span>
              <span>{submitResult.optimizationNote}</span>
            </div>
          )}
        </div>
      )}

      {/* Hint on wrong answer */}
      {!pass && submitResult.hint && (
        <div style={{ padding: '8px 12px', background: 'rgba(251,191,36,.06)',
          border: '1px solid rgba(251,191,36,.15)', borderRadius: 6, fontSize: 12, color: 'var(--yellow)' }}>
          💡 {submitResult.hint}
        </div>
      )}

      {/* Error output (compile/runtime) */}
      {submitResult.error && (
        <pre className="code-block" style={{ fontSize: 12, color: 'var(--red)' }}>{submitResult.error}</pre>
      )}
    </div>
  );
}