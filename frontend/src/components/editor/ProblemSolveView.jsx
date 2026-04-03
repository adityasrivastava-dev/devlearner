import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { codeApi, topicsApi, QUERY_KEYS } from '../../api';
import { getDiffMeta, PROBLEM_STARTER_CODE } from '../../utils/helpers';
import CodeEditor from './CodeEditor';
import toast from 'react-hot-toast';
import styles from './ProblemSolveView.module.css';

export default function ProblemSolveView({
  problemId,
  topicTitle,
  onBack,
  onStudyTopic,
  theme,
  fontSize,
  onFontChange,
  onThemeToggle,
  currentTheme,
}) {
  const qc = useQueryClient();
  const [javaVersion,    setJavaVersion]    = useState('17');
  const [code,           setCode]           = useState('');
  const [syntaxState,    setSyntaxState]    = useState('ready');
  const [syntaxErrors,   setSyntaxErrors]   = useState([]);
  const [activeDescTab,  setActiveDescTab]  = useState('desc');
  const [activeResultTab,setActiveResultTab]= useState('testcase');
  const [testInput,      setTestInput]      = useState('');
  const [runResult,      setRunResult]      = useState(null);
  const [submitResult,   setSubmitResult]   = useState(null);
  const [isRunning,      setIsRunning]      = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [hintsShown,     setHintsShown]     = useState(0);
  const [approach,       setApproach]       = useState('');
  const [splitPos,       setSplitPos]       = useState(40);
  const splitRef   = useRef(null);
  const isResizing = useRef(false);

  const { data: problem, isLoading } = useQuery({
    queryKey: QUERY_KEYS.problem(problemId),
    queryFn:  () => topicsApi.getProblem(problemId),
    enabled:  !!problemId,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!problem) return;
    const saved = sessionStorage.getItem(`devlearn_code_${problemId}`);
    setCode(saved || problem.starterCode || PROBLEM_STARTER_CODE);
    setTestInput(problem.sampleInput || '');
    setApproach(localStorage.getItem(`devlearn_approach_${problemId}`) || '');
    setHintsShown(0);
    setRunResult(null);
    setSubmitResult(null);
    setSyntaxState('ready');
    setSyntaxErrors([]);
  }, [problem, problemId]);

  useEffect(() => {
    if (code && problemId) sessionStorage.setItem(`devlearn_code_${problemId}`, code);
  }, [code, problemId]);

  async function handleRun() {
    if (!code.trim()) return;
    setIsRunning(true);
    setActiveResultTab('result');
    setRunResult({ loading: true });
    try {
      setRunResult(await codeApi.execute(code, testInput, javaVersion));
    } catch {
      setRunResult({ status: 'ERROR', error: 'Server unreachable' });
    } finally { setIsRunning(false); }
  }

  async function handleSubmit() {
    if (!code.trim()) return;
    setIsSubmitting(true);
    setActiveResultTab('result');
    setSubmitResult({ loading: true });
    try {
      const res = await codeApi.submit(problemId, code, 0, hintsShown >= 3, javaVersion);
      setSubmitResult(res);
      if (res.allPassed) {
        toast.success('✅ Accepted!');
        // Mark as solved in local cache
        const solved = JSON.parse(localStorage.getItem('devlearn_solved') || '[]');
        if (!solved.includes(problemId)) {
          localStorage.setItem('devlearn_solved', JSON.stringify([...solved, problemId]));
        }
        // Refresh solved count
        qc.invalidateQueries({ queryKey: QUERY_KEYS.solvedIds });
      }
    } catch {
      setSubmitResult({ error: 'Submit failed' });
    } finally { setIsSubmitting(false); }
  }

  // Drag-to-resize split panel
  const startResize = useCallback((e) => {
    isResizing.current = true;
    document.body.style.cursor      = 'col-resize';
    document.body.style.userSelect  = 'none';
    e.preventDefault();
  }, []);

  useEffect(() => {
    function onMove(e) {
      if (!isResizing.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      setSplitPos(Math.max(25, Math.min(((e.clientX - rect.left) / rect.width) * 100, 65)));
    }
    function onUp() {
      isResizing.current = false;
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  if (isLoading) return (
    <div className={styles.loading}><span className="spinner" /><span>Loading problem…</span></div>
  );
  if (!problem) return null;

  const diff = getDiffMeta(problem.difficulty);

  return (
    <div className={styles.psView}>

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <div className={styles.topbar}>

        {/* Left: navigation */}
        <div className={styles.topLeft}>
          <button className={styles.backBtn} onClick={onBack}>← Problems</button>
          {topicTitle && (
            <button className={styles.studyBtn} onClick={onStudyTopic}>📖 Study</button>
          )}
          <div className={styles.breadcrumb}>
            {topicTitle && <span className={styles.breadTopic} onClick={onStudyTopic}>{topicTitle}</span>}
            {topicTitle && <span className={styles.breadSep}>/</span>}
            <span className={styles.breadTitle}>{problem.title}</span>
          </div>
          <span className={`badge ${diff.cls}`}>{diff.label}</span>
        </div>

        {/* Right: controls — properly separated */}
        <div className={styles.topRight}>
          {/* Syntax indicator */}
          <div className={styles.syntaxRow}>
            <div className={`${styles.syntaxDot} ${styles[syntaxState]}`} />
            <span className={styles.syntaxLabel}>
              {syntaxState === 'checking' ? 'Checking…'
               : syntaxState === 'error'  ? `${syntaxErrors.length} err`
               : syntaxState === 'ok'     ? 'OK'
               : ''}
            </span>
          </div>

          {/* Font size */}
          {onFontChange && (
            <div className={styles.fontBtns}>
              <button className={styles.fontBtn} onClick={() => onFontChange(-1)} title="Smaller font">A−</button>
              <span className={styles.fontSize}>{fontSize}</span>
              <button className={styles.fontBtn} onClick={() => onFontChange(1)} title="Larger font">A+</button>
            </div>
          )}

          {/* Theme toggle */}
          {onThemeToggle && (
            <button className={styles.themeBtn} onClick={onThemeToggle} title="Toggle theme">
              {currentTheme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          {/* Java version */}
          <select value={javaVersion} onChange={(e) => setJavaVersion(e.target.value)} className={styles.versionSelect}>
            <option value="8">Java 8</option>
            <option value="11">Java 11</option>
            <option value="17">Java 17</option>
            <option value="21">Java 21</option>
          </select>

          {/* Run & Submit */}
          <button className={`btn btn-ghost btn-sm`} onClick={handleRun} disabled={isRunning}>
            {isRunning ? <><span className="spinner" />Running…</> : '▶ Run'}
          </button>
          <button className={`btn btn-primary btn-sm`} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <><span className="spinner" />…</> : '⬆ Submit'}
          </button>
        </div>
      </div>

      {/* ── Split layout ────────────────────────────────────────────────────── */}
      <div className={styles.split} ref={splitRef}>

        {/* LEFT: Problem description */}
        <div className={styles.leftPanel} style={{ width: `${splitPos}%` }}>
          <div className="tab-bar">
            {[
              ['desc',     'Description'],
              ['approach', 'My Approach'],
              ['hints',    `Hints${hintsShown > 0 ? ` (${hintsShown})` : ''}`],
              ['editorial','Editorial'],
            ].map(([t, l]) => (
              <button key={t} className={`tab-btn ${activeDescTab === t ? 'active' : ''}`}
                onClick={() => setActiveDescTab(t)}>{l}</button>
            ))}
          </div>

          <div className={styles.descBody}>
            {activeDescTab === 'desc'      && <DescriptionTab problem={problem} diff={diff} />}
            {activeDescTab === 'approach'  && <ApproachTab problemId={problemId} value={approach} onChange={setApproach} />}
            {activeDescTab === 'hints'     && <HintsTab problem={problem} hintsShown={hintsShown} onShowHint={(n) => setHintsShown(Math.max(hintsShown, n))} />}
            {activeDescTab === 'editorial' && (
              <div className={styles.editorialLocked}>
                <span>🔒</span>
                <p>Solve the problem first to unlock the editorial.</p>
              </div>
            )}
          </div>
        </div>

        {/* Resize handle */}
        <div className={styles.resizeHandle} onMouseDown={startResize} />

        {/* RIGHT: Editor */}
        <div className={styles.rightPanel}>
          <div className={styles.editorTopbar}>
            <span className={styles.fileLabel}>📄 Solution.java</span>
            {submitResult?.allPassed && (
              <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>✅ Accepted</span>
            )}
          </div>

          <div className={styles.editorWrap}>
            <CodeEditor
              value={code}
              onChange={setCode}
              theme={theme}
              fontSize={fontSize}
              javaVersion={javaVersion}
              onSyntaxChange={(state, errors) => { setSyntaxState(state); setSyntaxErrors(errors); }}
            />
          </div>

          {/* Inline error panel */}
          {syntaxErrors.length > 0 && (
            <div className={styles.errorPanel}>
              <div className={styles.errorPanelHeader}>
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>
                  {syntaxErrors.length} error{syntaxErrors.length !== 1 ? 's' : ''}
                </span>
                <button onClick={() => setSyntaxErrors([])}>✕</button>
              </div>
              {syntaxErrors.slice(0, 3).map((e, i) => (
                <div key={i} className={styles.errorRow}>
                  <span className={styles.errorLine}>L{e.line}</span>
                  <span className={styles.errorMsg}>{e.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom panel: testcase / result */}
          <div className={styles.bottomPanel}>
            <div className={styles.bottomBar}>
              <button className={`${styles.bottomTab} ${activeResultTab === 'testcase' ? styles.activeTab : ''}`}
                onClick={() => setActiveResultTab('testcase')}>Testcase</button>
              <button className={`${styles.bottomTab} ${activeResultTab === 'result'   ? styles.activeTab : ''}`}
                onClick={() => setActiveResultTab('result')}>Result</button>
            </div>
            <div className={styles.bottomBody}>
              {activeResultTab === 'testcase' && (
                <div className={styles.testcasePanel}>
                  <div className={styles.tcLabel}>stdin — passed to Run</div>
                  <textarea className={styles.stdinInput} value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter test input…" rows={4} />
                </div>
              )}
              {activeResultTab === 'result' && (
                <ResultPanel runResult={runResult} submitResult={submitResult} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DescriptionTab({ problem, diff }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-code)' }}>#{problem.displayOrder}</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '4px 0 8px', lineHeight: 1.3 }}>{problem.title}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className={`badge ${diff.cls}`}>{diff.label}</span>
          {problem.pattern && (
            <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
              {problem.pattern}
            </span>
          )}
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>{problem.description}</p>
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)' }}>Example</div>
        <div><strong>Input: </strong><code style={{ background: 'var(--bg4)', padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--font-code)', fontSize: 11 }}>{problem.sampleInput}</code></div>
        <div><strong>Output: </strong><code style={{ background: 'var(--bg4)', padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--font-code)', fontSize: 11 }}>{problem.sampleOutput}</code></div>
      </div>
      {(problem.inputFormat || problem.outputFormat) && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
          {problem.inputFormat  && <p><strong>Input Format:</strong> {problem.inputFormat}</p>}
          {problem.outputFormat && <p><strong>Output Format:</strong> {problem.outputFormat}</p>}
        </div>
      )}
    </div>
  );
}

function ApproachTab({ problemId, value, onChange }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>✍️ Write your approach first</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
        Describe your algorithm before coding. This is the most powerful interview habit.
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Example: I'll use a HashMap to store each number and check if complement exists…"
        style={{ width: '100%', minHeight: 150, background: 'var(--bg3)', border: '1px solid var(--border2)',
          borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 12,
          lineHeight: 1.6, padding: 10, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
      <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}
        onClick={() => { localStorage.setItem(`devlearn_approach_${problemId}`, value); toast.success('Approach saved!'); }}>
        💾 Save
      </button>
    </div>
  );
}

function HintsTab({ problem, hintsShown, onShowHint }) {
  const hints = [
    { num: 1, title: 'Hint 1 — Direction',  sub: 'Always free',            text: problem.hint1 || problem.hint },
    { num: 2, title: 'Hint 2 — Approach',   sub: 'Reveals the pattern',    text: problem.hint2 },
    { num: 3, title: 'Hint 3 — Pseudocode', sub: 'Marks as hint-assisted', text: problem.hint3 },
  ].filter((h) => h.text);

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
        Using Hint 3 marks your submission as hint-assisted.
      </p>
      {hints.map((hint) => (
        <div key={hint.num}>
          <button onClick={() => onShowHint(hint.num)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px',
              background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6,
              cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left',
              opacity: hintsShown >= hint.num ? .6 : 1 }}>
            <span>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{hint.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{hint.sub}</div>
            </div>
            <span style={{ color: 'var(--text3)' }}>›</span>
          </button>
          {hintsShown >= hint.num && (
            <div style={{ marginTop: 4, padding: '8px 12px', background: 'var(--bg3)',
              borderLeft: '3px solid var(--accent)', borderRadius: '0 6px 6px 0',
              fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              {hint.text}
            </div>
          )}
        </div>
      ))}
      {hints.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 12 }}>No hints available for this problem.</div>}
    </div>
  );
}

function ResultPanel({ runResult, submitResult }) {
  if (!runResult && !submitResult) return (
    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
      Click Run to test, or Submit to evaluate all test cases.
    </div>
  );

  // Show latest result — submit takes priority over run
  const result = submitResult || runResult;
  if (result.loading) return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 16, color: 'var(--text3)', fontSize: 12 }}>
      <span className="spinner" />{submitResult?.loading ? 'Evaluating all test cases…' : 'Running…'}
    </div>
  );

  // Run result
  if (!submitResult) return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{runResult.status === 'SUCCESS' ? '✅' : '❌'}</span>
        <span style={{ fontWeight: 700, color: runResult.status === 'SUCCESS' ? 'var(--accent)' : 'var(--red)', fontSize: 13 }}>
          {runResult.status === 'SUCCESS' ? 'Success' : runResult.status || 'Error'}
        </span>
        {runResult.executionTimeMs && <span style={{ fontSize: 11, color: 'var(--text3)' }}>⏱ {runResult.executionTimeMs}ms</span>}
      </div>
      {runResult.output && <pre className="code-block" style={{ fontSize: 12 }}>{runResult.output}</pre>}
      {runResult.error  && <pre className="code-block" style={{ fontSize: 12, color: 'var(--red)' }}>{runResult.error}</pre>}
    </div>
  );

  // Submit result
  const pass   = submitResult.allPassed;
  const dots   = submitResult.results || [];
  const failed = dots.filter((r) => !r.passed);
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{pass ? '✅' : '❌'}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: pass ? 'var(--accent)' : 'var(--red)' }}>
            {pass ? 'Accepted' : 'Wrong Answer'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            {submitResult.passedTests}/{submitResult.totalTests} test cases passed
          </div>
        </div>
        {submitResult.percentile > 0 && (
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>
            Faster than {submitResult.percentile}%
          </div>
        )}
      </div>
      {/* Test case dots */}
      {dots.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 10 }}>
          {dots.map((tc, i) => (
            <div key={i} title={`Test ${i + 1}: ${tc.passed ? 'PASS' : 'FAIL'}`}
              style={{ width: 10, height: 10, borderRadius: 2, background: tc.passed ? 'var(--accent)' : 'var(--red)' }} />
          ))}
        </div>
      )}
      {/* Failed cases */}
      {failed.slice(0, 2).map((tc, i) => (
        <div key={i} style={{ marginBottom: 8, padding: '8px 10px', background: 'rgba(248,113,113,.06)',
          border: '1px solid rgba(248,113,113,.15)', borderRadius: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Test {tc.testNumber} — FAILED</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '2px 8px', fontSize: 11 }}>
            <span style={{ color: 'var(--text3)' }}>Input</span>    <code>{String(tc.input    || '')}</code>
            <span style={{ color: 'var(--text3)' }}>Expected</span> <code style={{ color: 'var(--accent)' }}>{String(tc.expected || '')}</code>
            <span style={{ color: 'var(--text3)' }}>Got</span>      <code style={{ color: 'var(--red)'    }}>{String(tc.actual   || '')}</code>
          </div>
        </div>
      ))}
      {submitResult.hint && (
        <div style={{ padding: '6px 10px', background: 'rgba(251,191,36,.06)',
          border: '1px solid rgba(251,191,36,.15)', borderRadius: 6, fontSize: 11, color: 'var(--yellow)' }}>
          💡 {submitResult.hint}
        </div>
      )}
    </div>
  );
}
