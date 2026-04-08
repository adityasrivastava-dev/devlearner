import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './TracerPlayer.module.css';
import ReadOnlyCodeViewer from './ReadOnlyCodeViewer';

export default function TracerPlayer({ code = '', tracerSteps = '[]' }) {
  const [steps, setSteps]     = useState([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed]     = useState(1200);
  const intervalRef           = useRef(null);
  const tracerRef             = useRef(null);   // scroll tracer into view on play

  useEffect(() => {
    try {
      const parsed = typeof tracerSteps === 'string'
        ? JSON.parse(tracerSteps) : tracerSteps;
      setSteps(Array.isArray(parsed) ? parsed : []);
    } catch { setSteps([]); }
    setCurrent(0);
    setPlaying(false);
  }, [tracerSteps]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrent((c) => {
          if (c >= steps.length - 1) { setPlaying(false); return c; }
          return c + 1;
        });
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, steps.length]);

  const prev       = useCallback(() => { setPlaying(false); setCurrent((c) => Math.max(0, c - 1)); }, []);
  const next       = useCallback(() => { setPlaying(false); setCurrent((c) => Math.min(steps.length - 1, c + 1)); }, [steps.length]);
  const first      = useCallback(() => { setPlaying(false); setCurrent(0); }, []);
  const last       = useCallback(() => { setPlaying(false); setCurrent(steps.length - 1); }, [steps.length]);
  const togglePlay = useCallback(() => {
    if (current >= steps.length - 1) setCurrent(0);
    setPlaying((p) => !p);
  }, [current, steps.length]);

  // Scroll tracer panel into view when play starts or user steps manually
  // MUST be before early return (Rules of Hooks)
  useEffect(() => {
    if (!tracerRef.current) return;
    const rect = tracerRef.current.getBoundingClientRect();
    // Only scroll if significantly out of view
    if (rect.top < -100 || rect.bottom > window.innerHeight + 100) {
      tracerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [current]);

  if (!steps.length) return null;

  const step       = steps[current];
  const activeLine = step?.line;
  const progress   = ((current) / Math.max(steps.length - 1, 1)) * 100;

  const PHASE_META = {
    DECLARE:         { color: '#60a5fa', bg: 'rgba(96,165,250,.12)',  label: 'DECLARE'   },
    ASSIGN:          { color: '#4ade80', bg: 'rgba(74,222,128,.12)',  label: 'ASSIGN'    },
    LOOP_START:      { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', label: 'LOOP'      },
    LOOP_ITER:       { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', label: 'LOOP ITER' },
    CONDITION_TRUE:  { color: '#4ade80', bg: 'rgba(74,222,128,.12)',  label: '✓ TRUE'    },
    CONDITION_FALSE: { color: '#f87171', bg: 'rgba(248,113,113,.12)', label: '✗ FALSE'   },
    CALL:            { color: '#60a5fa', bg: 'rgba(96,165,250,.12)',  label: 'CALL'      },
    RETURN:          { color: '#4ade80', bg: 'rgba(74,222,128,.12)',  label: 'RETURN'    },
    THROW:           { color: '#f87171', bg: 'rgba(248,113,113,.12)', label: 'THROW'     },
    OPEN:            { color: '#fbbf24', bg: 'rgba(251,191,36,.12)',  label: 'OPEN'      },
    TERMINAL:        { color: '#fb923c', bg: 'rgba(251,146,60,.12)',  label: 'TERMINAL'  },
    MAP:             { color: '#4ade80', bg: 'rgba(74,222,128,.12)',  label: 'MAP'       },
    DISPATCH:        { color: '#60a5fa', bg: 'rgba(96,165,250,.12)',  label: 'DISPATCH'  },
    INSPECT:         { color: '#fbbf24', bg: 'rgba(251,191,36,.12)',  label: 'INSPECT'   },
    RETHROW:         { color: '#f87171', bg: 'rgba(248,113,113,.12)', label: 'RETHROW'   },
    DEFINE:          { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', label: 'DEFINE'    },
    PERF:            { color: '#fb923c', bg: 'rgba(251,146,60,.12)',  label: 'PERF'      },
  };

  const meta = PHASE_META[step?.phase] || { color: 'var(--text3)', bg: 'rgba(255,255,255,.05)', label: step?.phase || '' };

  return (
    <div ref={tracerRef} className={styles.tracer}>

      {/* ── Code panel ─────────────────────────────────────────────────── */}
      <div className={styles.codePanel}>
        <ReadOnlyCodeViewer
          code={code}
          theme="dark"
          highlightLine={activeLine}
          maxLines={30}
        />
      </div>

      {/* ── Step info panel ────────────────────────────────────────────── */}
      <div className={styles.stepPanel}>

        {/* Currently executing line */}
        {step?.lineCode && (
          <div className={styles.execLine}>
            <span className={styles.execLineArrow}>▶</span>
            <code className={styles.execLineCode}>{step.lineCode.trim()}</code>
            <span className={styles.execLineNum}>line {step.line}</span>
          </div>
        )}

        {/* Variables */}
        {step && Object.keys(step.variables || {}).length > 0 && (
          <div className={styles.variablesRow}>
            {Object.entries(step.variables).map(([k, v]) => (
              <span key={k} className={styles.varChip}>
                <span className={styles.varName}>{k}</span>
                <span className={styles.varEq}>=</span>
                <span className={styles.varVal}>{String(v)}</span>
              </span>
            ))}
          </div>
        )}

        {/* Phase + annotation */}
        {step && (
          <div className={styles.annotationRow}>
            <span
              className={styles.phaseBadge}
              style={{ background: meta.bg, color: meta.color, borderColor: `${meta.color}55` }}
            >
              {meta.label}
            </span>
            <span className={styles.annotation}>{step.annotation}</span>
          </div>
        )}

        {/* Controls + progress */}
        <div className={styles.controlsRow}>
          <div className={styles.controls}>
            <button className={styles.ctrlBtn} onClick={first}  title="First">⏮</button>
            <button className={styles.ctrlBtn} onClick={prev}   title="Previous">◀</button>
            <button
              className={`${styles.ctrlBtn} ${styles.playBtn} ${playing ? styles.pauseBtn : ''}`}
              onClick={togglePlay}
            >
              {playing ? '⏸' : '▶'}
            </button>
            <button className={styles.ctrlBtn} onClick={next}   title="Next">▶</button>
            <button className={styles.ctrlBtn} onClick={last}   title="Last">⏭</button>
            <span className={styles.stepCount}>{current + 1} / {steps.length}</span>
          </div>
          <select
            className={styles.speedSelect}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={2000}>0.5×</option>
            <option value={1200}>1×</option>
            <option value={700}>1.5×</option>
            <option value={400}>2×</option>
          </select>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

      </div>
    </div>
  );
}