import styles from './ArrayRenderer.module.css';

// ─── Colour map: state → CSS class ───────────────────────────────────────────
const STATE_CLASS = {
  default:        styles.stateDefault,
  comparing:      styles.stateComparing,
  swapping:       styles.stateSwapping,
  sorted:         styles.stateSorted,
  pivot:          styles.statePivot,
  found:          styles.stateFound,
  excluded:       styles.stateExcluded,
  'in-window':    styles.stateInWindow,
  'window-start': styles.stateWindowEdge,
  'window-end':   styles.stateWindowEdge,
  'pointer-left': styles.statePointerLeft,
  'pointer-right':styles.statePointerRight,
  current:        styles.stateCurrent,
  inserting:      styles.stateInserting,
  dependency:     styles.stateDependency,
  optimal:        styles.stateOptimal,
};

// ─── Variables pill strip ─────────────────────────────────────────────────────
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
export default function ArrayRenderer({ frame }) {
  if (!frame) return null;
  const { elements = [], pointers = [], message, variables, phase } = frame;

  // Build pointer index map: index → [label, color]
  const ptrMap = {};
  pointers.forEach(({ index, label, color }) => {
    if (index >= 0 && index < elements.length) {
      if (!ptrMap[index]) ptrMap[index] = [];
      ptrMap[index].push({ label, color });
    }
  });

  // Determine cell width — shrink for large arrays
  const cellSize = elements.length > 14 ? 'small' : elements.length > 10 ? 'medium' : 'large';

  return (
    <div className={styles.wrap}>
      {/* Phase badge */}
      {phase && <div className={styles.phaseBadge}>{phase}</div>}

      {/* Pointer labels row */}
      {pointers.length > 0 && (
        <div className={styles.pointerRow} style={{ gridTemplateColumns: `repeat(${elements.length}, 1fr)` }}>
          {elements.map((_, i) => (
            <div key={i} className={styles.pointerCell}>
              {ptrMap[i]?.map((p, pi) => (
                <span
                  key={pi}
                  className={styles.pointerLabel}
                  style={{ color: p.color, borderColor: p.color + '55' }}
                >
                  {p.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Array cells */}
      <div className={styles.arrayRow}>
        {elements.map((el, i) => {
          const cls = STATE_CLASS[el.state] || styles.stateDefault;
          return (
            <div
              key={i}
              className={`${styles.cell} ${cls} ${styles[cellSize]}`}
            >
              <span className={styles.cellValue}>{el.value}</span>
              <span className={styles.cellIndex}>{i}</span>
            </div>
          );
        })}
      </div>

      {/* Index row */}
      <div className={styles.indexRow} style={{ gridTemplateColumns: `repeat(${elements.length}, 1fr)` }}>
        {elements.map((_, i) => (
          <div key={i} className={styles.indexCell}></div>
        ))}
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
          { cls: styles.stateComparing,    label: 'Comparing'    },
          { cls: styles.stateSwapping,     label: 'Swapping'     },
          { cls: styles.stateSorted,       label: 'Sorted'       },
          { cls: styles.statePivot,        label: 'Pivot'        },
          { cls: styles.stateFound,        label: 'Found'        },
          { cls: styles.stateExcluded,     label: 'Excluded'     },
          { cls: styles.stateInWindow,     label: 'In Window'    },
          { cls: styles.statePointerLeft,  label: 'Left Ptr'     },
          { cls: styles.statePointerRight, label: 'Right Ptr'    },
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
