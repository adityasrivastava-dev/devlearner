import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor, { applyMarkers } from '../../components/editor/CodeEditor';
import { codeApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './PlaygroundPage.module.css';

const STORAGE_KEY = 'devlearn_playground_code';
const STORAGE_STDIN = 'devlearn_playground_stdin';

const DEFAULT_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Playground!");
    }
}`;

const JAVA_VERSIONS = ['8', '11', '17', '21'];

export default function PlaygroundPage() {
  const navigate  = useNavigate();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const [code,        setCode]        = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_CODE);
  const [stdin,       setStdin]       = useState(() => localStorage.getItem(STORAGE_STDIN) || '');
  const [javaVersion, setJavaVersion] = useState('17');
  const [isRunning,   setIsRunning]   = useState(false);
  const [result,      setResult]      = useState(null);   // ExecuteResponse
  const [activeTab,   setActiveTab]   = useState('output'); // 'stdin' | 'output'
  const [cursorPos,   setCursorPos]   = useState({ line: 1, col: 1 });
  const [lineCount,   setLineCount]   = useState(0);
  const [theme,       setTheme]       = useState(
    () => localStorage.getItem('devlearn_theme') || 'dark'
  );

  // Persist code & stdin to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEY, code); }, [code]);
  useEffect(() => { localStorage.setItem(STORAGE_STDIN, stdin); }, [stdin]);

  const handleRun = useCallback(async () => {
    if (!code.trim()) { toast.error('Editor is empty'); return; }
    setIsRunning(true);
    setResult(null);
    setActiveTab('output');

    // Clear old markers
    if (editorRef.current && monacoRef.current) {
      applyMarkers(editorRef.current, monacoRef.current, []);
    }

    try {
      const res = await codeApi.execute(code, stdin, javaVersion);
      setResult(res);

      // Apply compile-error markers to Monaco
      if (res.compileErrors?.length && editorRef.current && monacoRef.current) {
        applyMarkers(editorRef.current, monacoRef.current, res.compileErrors);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  }, [code, stdin, javaVersion]);

  const handleClear = useCallback(() => {
    setCode(DEFAULT_CODE);
    setStdin('');
    setResult(null);
    if (editorRef.current && monacoRef.current) {
      applyMarkers(editorRef.current, monacoRef.current, []);
    }
  }, []);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  }, [handleRun]);

  // Status badge
  const statusBadge = () => {
    if (!result) return null;
    if (result.compileErrors?.length) return <span className={`${styles.badge} ${styles.badgeRed}`}>Compile Error</span>;
    if (result.status === 'TLE')      return <span className={`${styles.badge} ${styles.badgeYellow}`}>Time Limit Exceeded</span>;
    if (!result.success)              return <span className={`${styles.badge} ${styles.badgeRed}`}>Runtime Error</span>;
    return <span className={`${styles.badge} ${styles.badgeGreen}`}>Success</span>;
  };

  return (
    <div className={styles.page} onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')} title="Back to Home">
            ← Home
          </button>
          <div className={styles.titleWrap}>
            <span className={styles.titleIcon}>{'</>'}</span>
            <span className={styles.title}>Playground</span>
            <span className={styles.titleSub}>Write &amp; run any Java code</span>
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <label className={styles.label}>Java</label>
          <select
            className={styles.versionSelect}
            value={javaVersion}
            onChange={(e) => setJavaVersion(e.target.value)}
          >
            {JAVA_VERSIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <button className={styles.clearBtn} onClick={handleClear} title="Reset to default">
            Reset
          </button>

          <button
            className={`${styles.runBtn} ${isRunning ? styles.running : ''}`}
            onClick={handleRun}
            disabled={isRunning}
            title="Run (Ctrl+Enter)"
          >
            {isRunning ? (
              <><span className={styles.spinner} /> Running…</>
            ) : (
              '▶ Run'
            )}
          </button>
        </div>
      </header>

      {/* ── Main split ──────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* Editor */}
        <div className={styles.editorPane}>
          <CodeEditor
            value={code}
            onChange={setCode}
            language="java"
            theme={theme}
            fontSize={14}
            javaVersion={javaVersion}
            height="100%"
            editorRefOut={editorRef}
            monacoRefOut={monacoRef}
            onCursorChange={({ line, col, lineCount: lc }) => {
              setCursorPos({ line, col });
              setLineCount(lc);
            }}
          />
          {/* Status bar */}
          <div className={styles.statusBar}>
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span>{lineCount} lines</span>
            <span>Java {javaVersion}</span>
            <span>UTF-8</span>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.rightPane}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'stdin' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('stdin')}
            >
              Stdin
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'output' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('output')}
            >
              Output {result && statusBadge()}
            </button>
          </div>

          {/* Stdin panel */}
          {activeTab === 'stdin' && (
            <div className={styles.stdinPanel}>
              <textarea
                className={styles.stdinArea}
                placeholder="Custom input (stdin)…"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {/* Output panel */}
          {activeTab === 'output' && (
            <div className={styles.outputPanel}>
              {!result && !isRunning && (
                <div className={styles.outputEmpty}>
                  <div className={styles.emptyIcon}>▶</div>
                  <p>Press <kbd>Run</kbd> or <kbd>Ctrl+Enter</kbd> to execute</p>
                </div>
              )}

              {isRunning && (
                <div className={styles.outputEmpty}>
                  <span className={styles.spinnerLg} />
                  <p>Compiling &amp; running…</p>
                </div>
              )}

              {result && !isRunning && (
                <>
                  {/* Compile errors */}
                  {result.compileErrors?.length > 0 && (
                    <section className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={`${styles.dot} ${styles.dotRed}`} />
                        Compile Errors ({result.compileErrors.length})
                      </div>
                      <div className={styles.errorList}>
                        {result.compileErrors.map((e, i) => (
                          <div key={i} className={`${styles.errorItem} ${e.severity === 'WARNING' ? styles.errorWarning : styles.errorError}`}>
                            <span className={styles.errorLoc}>Line {e.line}, Col {e.column}</span>
                            <span className={styles.errorMsg}>{e.message}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Stdout */}
                  {result.output != null && (
                    <section className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={`${styles.dot} ${result.success ? styles.dotGreen : styles.dotRed}`} />
                        Output
                        {result.executionTimeMs != null && (
                          <span className={styles.execTime}>{result.executionTimeMs} ms</span>
                        )}
                      </div>
                      <pre className={styles.outputPre}>
                        {result.output || <span className={styles.noOutput}>(no output)</span>}
                      </pre>
                    </section>
                  )}

                  {/* Runtime error / stderr */}
                  {result.error && (
                    <section className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <span className={`${styles.dot} ${styles.dotRed}`} />
                        {result.status === 'TLE' ? 'Time Limit Exceeded' : 'Runtime Error'}
                      </div>
                      <pre className={`${styles.outputPre} ${styles.outputPreError}`}>
                        {result.error}
                      </pre>
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
