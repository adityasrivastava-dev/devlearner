import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './TracerPlayer.module.css';

/**
 * TracerPlayer — step-by-step code execution visualiser.
 *
 * Props:
 *   code        : string  — full source code of the example
 *   tracerSteps : string  — JSON string: [{line, lineCode, variables, phase, annotation}]
 *
 * Each step shape:
 *   { line: number, lineCode: string, variables: {name: value},
 *     phase: 'ASSIGN'|'LOOP_START'|'LOOP_ITER'|'CONDITION_TRUE'|'CONDITION_FALSE'
 *            |'DECLARE'|'CALL'|'RETURN'|'THROW',
 *     annotation: string }
 */
export default function TracerPlayer({ code = '', tracerSteps = '[]' }) {
  const [steps, setSteps]       = useState([]);
  const [current, setCurrent]   = useState(0);
  const [playing, setPlaying]   = useState(false);
  const [speed, setSpeed]       = useState(1200); // ms per step
  const intervalRef             = useRef(null);
  const lineRefs                = useRef({});

  // Parse steps once
  useEffect(() => {
    try {
      const parsed = typeof tracerSteps === 'string'
        ? JSON.parse(tracerSteps)
        : tracerSteps;
      setSteps(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSteps([]);
    }
    setCurrent(0);
    setPlaying(false);
  }, [tracerSteps]);

  // Auto-play interval
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrent((c) => {
          if (c >= steps.length - 1) {
            setPlaying(false);
            return c;
          }
          return c + 1;
        });
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, steps.length]);

  // Scroll current line into view in the code panel
  useEffect(() => {
    const step = steps[current];
    if (!step) return;
    const el = lineRefs.current[step.line];
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current, steps]);

  const step     = steps[current];
  const codeLines = code.split('\n');

  const prev  = useCallback(() => { setPlaying(false); setCurrent((c) => Math.max(0, c - 1)); }, []);
  const next  = useCallback(() => { setPlaying(false); setCurrent((c) => Math.min(steps.length - 1, c + 1)); }, [steps.length]);
  const first = useCallback(() => { setPlaying(false); setCurrent(0); }, []);
  const last  = useCallback(() => { setPlaying(false); setCurrent(steps.length - 1); }, [steps.length]);
  const togglePlay = useCallback(() => {
    if (current >= steps.length - 1) setCurrent(0);
    setPlaying((p) => !p);
  }, [current, steps.length]);

  if (!steps.length) return null;

  const phaseColor = {
    DECLARE:        'var(--blue)',
    ASSIGN:         'var(--accent)',
    LOOP_START:     'var(--purple, #9b59b6)',
    LOOP_ITER:      'var(--purple, #9b59b6)',
    CONDITION_TRUE: 'var(--green)',
    CONDITION_FALSE:'var(--red, #e74c3c)',
    CALL:           'var(--blue)',
    RETURN:         'var(--green)',
    THROW:          'var(--red, #e74c3c)',
  };
  const activeLine = step?.line;

  return (
    <div className={styles.tracer}>
      {/* Code panel */}
      <div className={styles.codePanel}>
        <div className={styles.codePanelLabel}>Tracer</div>
        <div className={styles.codeScroll}>
          {codeLines.map((line, idx) => {
            const lineNum = idx + 1;
            const isActive = lineNum === activeLine;
            return (
              <div
                key={lineNum}
                ref={(el) => { lineRefs.current[lineNum] = el; }}
                className={`${styles.codeLine} ${isActive ? styles.activeLine : ''}`}
              >
                <span className={styles.lineNum}>{lineNum}</span>
                <span className={styles.lineText}>{line || ' '}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Variables panel */}
      <div className={styles.statePanel}>
        <div className={styles.variablesRow}>
          {step && Object.entries(step.variables || {}).map(([k, v]) => (
            <span key={k} className={styles.varChip}>
              <span className={styles.varName}>{k}</span>
              <span className={styles.varEq}>=</span>
              <span className={styles.varVal}>{String(v)}</span>
            </span>
          ))}
          {step && Object.keys(step.variables || {}).length === 0 && (
            <span className={styles.noVars}>—</span>
          )}
        </div>

        {/* Phase badge + annotation */}
        {step && (
          <div className={styles.annotationRow}>
            <span
              className={styles.phaseBadge}
              style={{ background: `${phaseColor[step.phase] || 'var(--text3)'}22`,
                       color: phaseColor[step.phase] || 'var(--text3)',
                       borderColor: `${phaseColor[step.phase] || 'var(--text3)'}55` }}
            >
              {step.phase}
            </span>
            <span className={styles.annotation}>{step.annotation}</span>
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          <button className={styles.ctrlBtn} onClick={first}  title="First step">⏮</button>
          <button className={styles.ctrlBtn} onClick={prev}   title="Previous">◀</button>
          <button
            className={`${styles.ctrlBtn} ${styles.playBtn}`}
            onClick={togglePlay}
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button className={styles.ctrlBtn} onClick={next}   title="Next">▶</button>
          <button className={styles.ctrlBtn} onClick={last}   title="Last step">⏭</button>

          <span className={styles.stepCount}>
            {current + 1} / {steps.length}
          </span>

          <select
            className={styles.speedSelect}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            title="Playback speed"
          >
            <option value={2000}>0.5×</option>
            <option value={1200}>1×</option>
            <option value={700}>1.5×</option>
            <option value={400}>2×</option>
          </select>
        </div>
      </div>
    </div>
  );
}
