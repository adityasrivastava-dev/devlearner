import styles from './TreeRenderer.module.css';

const NODE_COLORS = {
  unvisited:  { fill: '#1a1a2e', stroke: '#4b5563', text: '#9ca3af' },
  processing: { fill: '#581c87', stroke: '#a855f7', text: '#e9d5ff' },
  found:      { fill: '#064e3b', stroke: '#10b981', text: '#6ee7b7' },
  visited:    { fill: '#14532d', stroke: '#22c55e', text: '#bbf7d0' },
  'in-queue': { fill: '#1e3a5f', stroke: '#3b82f6', text: '#93c5fd' },
};

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

export default function TreeRenderer({ frame }) {
  if (!frame) return null;
  const { nodes = [], edges = [], result = [], message, variables, phase } = frame;

  const W = 620, H = 310;
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className={styles.wrap}>
      {phase && <div className={styles.phaseBadge}>{phase}</div>}

      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
          {edges.map((e, i) => {
            const s = nodeMap[e.source];
            const t = nodeMap[e.target];
            if (!s || !t) return null;
            const R = 22;
            const dx = t.x - s.x, dy = t.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            return (
              <line
                key={i}
                x1={s.x + (dx / dist) * R} y1={s.y + (dy / dist) * R}
                x2={t.x - (dx / dist) * R} y2={t.y - (dy / dist) * R}
                className={styles.edge}
              />
            );
          })}

          {nodes.map((node) => {
            const c = NODE_COLORS[node.state] || NODE_COLORS.unvisited;
            return (
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                <circle
                  r={22}
                  fill={c.fill}
                  stroke={c.stroke}
                  strokeWidth={2.5}
                  style={{
                    transition: 'fill 0.3s, stroke 0.3s',
                    filter: node.state === 'found' || node.state === 'processing'
                      ? `drop-shadow(0 0 6px ${c.stroke})`
                      : 'none',
                  }}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={c.text}
                  fontSize={15}
                  fontWeight="700"
                >
                  {node.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Result sequence */}
      {result.length > 0 && (
        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>Result:</span>
          <div className={styles.resultItems}>
            {result.map((v, i) => (
              <span key={i} className={styles.resultItem}>{v}</span>
            ))}
          </div>
        </div>
      )}

      <VarStrip variables={variables} />

      {message && (
        <div className={styles.message}>
          <span className={styles.msgIcon}>→</span>
          <span className={styles.msgText}>{message}</span>
        </div>
      )}

      <div className={styles.legend}>
        {[
          { state: 'unvisited',  label: 'Unvisited'   },
          { state: 'processing', label: 'Processing'  },
          { state: 'found',      label: 'Recording'   },
          { state: 'visited',    label: 'Visited'     },
          { state: 'in-queue',   label: 'In Queue'    },
        ].map(({ state, label }) => {
          const c = NODE_COLORS[state];
          return (
            <div key={state} className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: c.fill, border: `2px solid ${c.stroke}` }} />
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
