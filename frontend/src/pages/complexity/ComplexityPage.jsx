import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEditor from '../../components/editor/CodeEditor';
import { codeApi } from '../../api';
import toast from 'react-hot-toast';
import ComplexityChart from '../../components/complexity/ComplexityChart';
import styles from './ComplexityPage.module.css';

const DEFAULT_CODE = `public class Solution {
    // Paste your code here and click Analyze
    // Try modifying this and see how the result changes

    public void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j]     = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
}`;

// Color coding per complexity class
function complexityMeta(notation) {
  if (!notation) return { bg: 'var(--bg3)', border: 'var(--border2)', color: 'var(--text2)', grade: '?' };
  const n = notation;
  if (n === 'O(1)')                                      return { bg: '#052e16', border: '#16a34a', color: '#4ade80',  grade: 'Excellent' };
  if (n.includes('log n') && !n.includes('n log n'))     return { bg: '#042f2e', border: '#0d9488', color: '#2dd4bf',  grade: 'Excellent' };
  if (n === 'O(n)')                                      return { bg: '#0c1a2e', border: '#3b82f6', color: '#60a5fa',  grade: 'Good' };
  if (n.includes('n log n'))                             return { bg: '#1c1408', border: '#d97706', color: '#fbbf24',  grade: 'Fair' };
  if (n.includes('n²') || n.includes('n^2') || n.includes('n²')) return { bg: '#200f04', border: '#ea580c', color: '#fb923c', grade: 'Poor' };
  if (n.includes('n³') || n.includes('n^3'))             return { bg: '#200a04', border: '#dc2626', color: '#f87171',  grade: 'Bad' };
  if (n.includes('2ⁿ') || n.includes('n!') || n.includes('exponential')) return { bg: '#1c0a1c', border: '#9333ea', color: '#c084fc', grade: 'Terrible' };
  return { bg: 'var(--bg3)', border: 'var(--border2)', color: 'var(--text)', grade: '' };
}

function confidenceMeta(conf) {
  if (conf === 'HIGH')   return { color: '#4ade80', label: 'High confidence', pct: 100 };
  if (conf === 'MEDIUM') return { color: '#fbbf24', label: 'Medium confidence — verify manually', pct: 60 };
  return                        { color: '#f87171', label: 'Low confidence — complex pattern, verify manually', pct: 30 };
}

// Scale reference shown at the bottom of results
const SCALE = [
  { n: 'O(1)',       label: 'Constant',     color: '#4ade80' },
  { n: 'O(log n)',   label: 'Logarithmic',  color: '#2dd4bf' },
  { n: 'O(n)',       label: 'Linear',       color: '#60a5fa' },
  { n: 'O(n log n)', label: 'Linearithmic', color: '#fbbf24' },
  { n: 'O(n²)',      label: 'Quadratic',    color: '#fb923c' },
  { n: 'O(n³)',      label: 'Cubic',        color: '#f87171' },
  { n: 'O(2ⁿ)',      label: 'Exponential',  color: '#c084fc' },
];

export default function ComplexityPage() {
  const navigate   = useNavigate();
  const editorRef  = useRef(null);
  const monacoRef  = useRef(null);

  const [code,      setCode]      = useState(DEFAULT_CODE);
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [theme]                   = useState(() => localStorage.getItem('devlearn_theme') || 'dark');

  const handleAnalyze = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) { toast.error('Editor is empty'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await codeApi.analyzeComplexity(trimmed);
      setResult(res);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [code]);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      handleAnalyze();
    }
  }, [handleAnalyze]);

  const timeMeta  = result ? complexityMeta(result.timeComplexity)  : null;
  const spaceMeta = result ? complexityMeta(result.spaceComplexity) : null;
  const confMeta  = result ? confidenceMeta(result.confidence)      : null;

  return (
    <div className={styles.page} onKeyDown={handleKeyDown} tabIndex={-1}>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Home</button>
          <div className={styles.titleWrap}>
            <span className={styles.titleIcon}>∑</span>
            <span className={styles.title}>Complexity Analyzer</span>
            <span className={styles.titleSub}>Paste your Java code — get time &amp; space Big-O</span>
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.clearBtn} onClick={() => { setCode(DEFAULT_CODE); setResult(null); }}>
            Reset
          </button>
          <button
            className={`${styles.analyzeBtn} ${loading ? styles.analyzing : ''}`}
            onClick={handleAnalyze}
            disabled={loading}
            title="Analyze (Ctrl+Shift+A)"
          >
            {loading ? <><span className={styles.spinner} /> Analyzing…</> : '⚡ Analyze'}
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* Editor pane */}
        <div className={styles.editorPane}>
          <CodeEditor
            value={code}
            onChange={setCode}
            language="java"
            theme={theme}
            fontSize={14}
            height="100%"
            editorRefOut={editorRef}
            monacoRefOut={monacoRef}
            onCursorChange={(line, col) => setCursorPos({ line, col })}
          />
          <div className={styles.statusBar}>
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span>{code.split('\n').length} lines</span>
            <span>Java</span>
            <span className={styles.shortcutHint}>Ctrl+Shift+A to analyze</span>
          </div>
        </div>

        {/* Results pane */}
        <div className={styles.resultsPane}>

          {/* Empty state */}
          {!result && !loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>∑</div>
              <p className={styles.emptyTitle}>Paste your Java code and click Analyze</p>
              <p className={styles.emptyDesc}>
                The analyzer detects loop nesting, recursion type, sorting calls,
                divide-and-conquer patterns, memoization, and data structures to
                determine your algorithm's Big-O complexity.
              </p>
              <div className={styles.scalePreview}>
                {SCALE.map((s) => (
                  <div key={s.n} className={styles.scaleRow}>
                    <span className={styles.scaleNotation} style={{ color: s.color }}>{s.n}</span>
                    <span className={styles.scaleLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className={styles.emptyState}>
              <span className={styles.spinnerLg} />
              <p className={styles.emptyTitle}>Analyzing your code…</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className={styles.results}>

              {/* ── Complexity cards ── */}
              <div className={styles.cards}>
                <div
                  className={styles.complexityCard}
                  style={{ background: timeMeta.bg, borderColor: timeMeta.border }}
                >
                  <div className={styles.cardLabel}>Time Complexity</div>
                  <div className={styles.cardNotation} style={{ color: timeMeta.color }}>
                    {result.timeComplexity}
                  </div>
                  {timeMeta.grade && (
                    <div className={styles.cardGrade} style={{ color: timeMeta.color }}>
                      {timeMeta.grade}
                    </div>
                  )}
                </div>
                <div
                  className={styles.complexityCard}
                  style={{ background: spaceMeta.bg, borderColor: spaceMeta.border }}
                >
                  <div className={styles.cardLabel}>Space Complexity</div>
                  <div className={styles.cardNotation} style={{ color: spaceMeta.color }}>
                    {result.spaceComplexity}
                  </div>
                  {spaceMeta.grade && (
                    <div className={styles.cardGrade} style={{ color: spaceMeta.color }}>
                      {spaceMeta.grade}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Confidence ── */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Confidence</div>
                <div className={styles.confBar}>
                  <div
                    className={styles.confFill}
                    style={{ width: `${confMeta.pct}%`, background: confMeta.color }}
                  />
                </div>
                <div className={styles.confLabel} style={{ color: confMeta.color }}>
                  {confMeta.label}
                </div>
                {result.confidence !== 'HIGH' && (
                  <div className={styles.confWarning}>
                    This uses static pattern analysis. For complex algorithms with variable-bound
                    inner loops or indirect recursion, validate manually.
                  </div>
                )}
              </div>

              {/* ── Detected patterns ── */}
              {result.detectedPatterns?.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>What was detected</div>
                  <div className={styles.patternChips}>
                    {result.detectedPatterns.map((p, i) => (
                      <span key={i} className={styles.patternChip}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Time reasoning ── */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <span style={{ color: timeMeta.color }}>Time</span> — why?
                </div>
                <p className={styles.explanation}>{result.timeExplanation}</p>
              </div>

              {/* ── Space reasoning ── */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <span style={{ color: spaceMeta.color }}>Space</span> — why?
                </div>
                <p className={styles.explanation}>{result.spaceExplanation}</p>
              </div>

              {/* ── Complexity scale ── */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Complexity scale</div>
                <div className={styles.scale}>
                  {SCALE.map((s) => (
                    <div
                      key={s.n}
                      className={`${styles.scaleItem} ${
                        s.n === result.timeComplexity ? styles.scaleItemActive : ''
                      }`}
                      style={s.n === result.timeComplexity
                        ? { borderColor: s.color, background: `${s.color}18` }
                        : {}
                      }
                    >
                      <span className={styles.scaleItemN} style={{ color: s.color }}>{s.n}</span>
                      <span className={styles.scaleItemLabel}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Growth visualization ── */}
              <ComplexityChart timeComplexity={result.timeComplexity} />

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
