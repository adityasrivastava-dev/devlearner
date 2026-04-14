import styles from './StackRenderer.module.css';

const CELL_COLORS = {
  default:   { bg: '#1a1a2e', border: '#4b5563',  text: '#9ca3af' },
  top:       { bg: '#2d1b69', border: '#8b5cf6',  text: '#c4b5fd' },
  matching:  { bg: '#78350f', border: '#fbbf24',  text: '#fde68a' },
  matched:   { bg: '#14532d', border: '#22c55e',  text: '#bbf7d0' },
  error:     { bg: '#7f1d1d', border: '#ef4444',  text: '#fca5a5' },
  current:   { bg: '#581c87', border: '#a855f7',  text: '#e9d5ff' },
  popped:    { bg: '#0f172a', border: '#1e293b',  text: '#475569' },
  pushed:    { bg: '#1e3a5f', border: '#3b82f6',  text: '#93c5fd' },
  ngResult:  { bg: '#064e3b', border: '#10b981',  text: '#6ee7b7' },
  processed: { bg: '#14532d', border: '#166534',  text: '#86efac' },
};

function VarStrip({ variables = {} }) {
  const entries = Object.entries(variables);
  if (!entries.length) return null;
  return (
    <div className={styles.varStrip}>
      {entries.map(([k, v]) => (
        <div key={k} className={styles.varPill}>
          <span className={styles.varKey}>{k}</span>
          <span className={styles.varVal}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

function StackColumn({ label, items, topLabel = 'TOP' }) {
  const c = CELL_COLORS;
  return (
    <div className={styles.stackCol}>
      <div className={styles.stackLabel}>{label}</div>
      <div className={styles.stackBody}>
        {items.length === 0 && (
          <div className={styles.emptyStack}>empty</div>
        )}
        {[...items].reverse().map((item, i) => {
          const colors = c[item.state] || c.default;
          const isTop = i === 0;
          return (
            <div
              key={i}
              className={`${styles.stackCell} ${isTop ? styles.topCell : ''}`}
              style={{ background: colors.bg, border: `2px solid ${colors.border}`, color: colors.text }}
            >
              {isTop && <span className={styles.topArrow}>← {topLabel}</span>}
              <span className={styles.cellVal}>{item.value}</span>
            </div>
          );
        })}
        <div className={styles.stackBase} />
      </div>
    </div>
  );
}

function ArrayRow({ label, items, currentIndex }) {
  return (
    <div className={styles.arraySection}>
      {label && <div className={styles.arrayLabel}>{label}</div>}
      <div className={styles.arrayRow}>
        {items.map((item, i) => {
          const colors = CELL_COLORS[item.state] || CELL_COLORS.default;
          const isCurrent = i === currentIndex;
          return (
            <div
              key={i}
              className={`${styles.arrayCell} ${isCurrent ? styles.arrayCellCurrent : ''}`}
              style={{ background: colors.bg, border: `2px solid ${colors.border}`, color: colors.text }}
            >
              <span className={styles.arrVal}>{item.value}</span>
              <span className={styles.arrIdx}>{i}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StackRenderer({ frame }) {
  if (!frame) return null;
  const {
    stack = [], stack2,
    inputArray, resultArray,
    currentIndex,
    message, variables, phase,
    stackLabel = 'Stack',
  } = frame;

  return (
    <div className={styles.wrap}>
      {phase && <div className={styles.phaseBadge}>{phase}</div>}

      {/* Input array (top, if present) */}
      {inputArray && (
        <ArrayRow label="Input" items={inputArray} currentIndex={currentIndex} />
      )}

      {/* Stack(s) */}
      <div className={styles.stacksRow}>
        <StackColumn label={stackLabel} items={stack} />
        {stack2 && <StackColumn label="Min Stack" items={stack2} topLabel="MIN" />}
      </div>

      {/* Result array (bottom, if present) */}
      {resultArray && (
        <ArrayRow label="Result" items={resultArray} />
      )}

      <VarStrip variables={variables} />

      {message && (
        <div className={styles.message}>
          <span className={styles.msgIcon}>→</span>
          <span className={styles.msgText}>{message}</span>
        </div>
      )}
    </div>
  );
}
