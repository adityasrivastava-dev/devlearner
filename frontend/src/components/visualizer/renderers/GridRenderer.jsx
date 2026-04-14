import styles from './GridRenderer.module.css';

// ─── Cell state → CSS class ───────────────────────────────────────────────────
const STATE_CLASS = {
  empty:      styles.stateEmpty,
  filled:     styles.stateFilled,
  current:    styles.stateCurrent,
  dependency: styles.stateDependency,
  optimal:    styles.stateOptimal,
};

// ─── Variable strip ───────────────────────────────────────────────────────────
function VarStrip({ variables = {} }) {
  const entries = Object.entries(variables);
  if (entries.length === 0) return null;
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

// ─── Main renderer ────────────────────────────────────────────────────────────
export default function GridRenderer({ frame, rowLabels, colLabels }) {
  if (!frame) return null;
  const { grid = [], current, message, variables, phase } = frame;

  if (grid.length === 0) return null;

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Single-row mode (fibonacci)
  const isSingleRow = rows === 1;

  return (
    <div className={styles.wrap}>
      {phase && <div className={styles.phaseBadge}>{phase}</div>}

      <div className={styles.gridScroll}>
        <table className={`${styles.table} ${isSingleRow ? styles.singleRow : ''}`}>
          {/* Column header */}
          {colLabels && (
            <thead>
              <tr>
                <th className={styles.headerCorner}></th>
                {colLabels.map((l, i) => (
                  <th key={i} className={styles.colHeader}>{l}</th>
                ))}
              </tr>
            </thead>
          )}

          <tbody>
            {!colLabels && isSingleRow && (
              <tr>
                {Array.from({ length: cols }, (_, i) => (
                  <td key={i} className={styles.indexCell}>{i}</td>
                ))}
              </tr>
            )}

            {grid.map((row, ri) => (
              <tr key={ri}>
                {rowLabels && (
                  <td className={styles.rowHeader}>{rowLabels[ri]}</td>
                )}
                {row.map((cell, ci) => {
                  const isCurrent = current && current[0] === ri && current[1] === ci;
                  const cls = STATE_CLASS[cell.state] || styles.stateEmpty;
                  return (
                    <td
                      key={ci}
                      className={`${styles.cell} ${cls} ${isCurrent ? styles.activeCurrent : ''}`}
                    >
                      {cell.value !== undefined && cell.value !== null ? cell.value : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Variables */}
      <VarStrip variables={variables} />

      {/* Message */}
      {message && (
        <div className={styles.message}>
          <span className={styles.msgIcon}>→</span>
          <span className={styles.msgText}>{message}</span>
        </div>
      )}

      {/* Legend */}
      <div className={styles.legend}>
        {[
          { cls: styles.stateEmpty,      label: 'Empty'      },
          { cls: styles.stateFilled,     label: 'Computed'   },
          { cls: styles.stateCurrent,    label: 'Computing'  },
          { cls: styles.stateDependency, label: 'Dependency' },
          { cls: styles.stateOptimal,    label: 'Optimal'    },
        ].map(({ cls, label }) => (
          <div key={label} className={styles.legendItem}>
            <div className={`${styles.legendDot} ${cls}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
