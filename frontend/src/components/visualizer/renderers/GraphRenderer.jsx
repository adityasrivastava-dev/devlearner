import styles from './GraphRenderer.module.css';

// ─── Node state → colour ──────────────────────────────────────────────────────
const NODE_COLORS = {
  unvisited:  { fill: '#1a1a2e', stroke: '#4b5563', text: '#9ca3af' },
  'in-queue': { fill: '#1e3a5f', stroke: '#3b82f6', text: '#93c5fd' },
  processing: { fill: '#581c87', stroke: '#a855f7', text: '#e9d5ff' },
  visited:    { fill: '#14532d', stroke: '#22c55e', text: '#bbf7d0' },
  found:      { fill: '#064e3b', stroke: '#10b981', text: '#6ee7b7' },
};

// ─── Queue / Stack display ─────────────────────────────────────────────────────
function QueueDisplay({ items, label }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={styles.queueBox}>
      <span className={styles.queueLabel}>{label}:</span>
      <div className={styles.queueItems}>
        {items.map((item, i) => (
          <span key={i} className={styles.queueItem}>{item}</span>
        ))}
        {items.length === 0 && <span className={styles.queueEmpty}>empty</span>}
      </div>
    </div>
  );
}

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
export default function GraphRenderer({ frame }) {
  if (!frame) return null;
  const { nodes = [], edges = [], queue = [], visited = [], message, variables, phase } = frame;

  const isDFS = frame.type === 'dfs' ||
    (message && (message.toLowerCase().includes('pop') || message.toLowerCase().includes('stack')));

  // Build a map for quick node lookup
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  // SVG canvas dimensions
  const W = 600, H = 320;

  return (
    <div className={styles.wrap}>
      {phase && <div className={styles.phaseBadge}>{phase}</div>}

      {/* Graph SVG */}
      <div className={styles.svgWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label="Graph visualization">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10" markerHeight="7"
              refX="10" refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((e, i) => {
            const s = nodeMap[e.source];
            const t = nodeMap[e.target];
            if (!s || !t) return null;

            const R = 22;
            const dx = t.x - s.x, dy = t.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const ex = t.x - (dx / dist) * R;
            const ey = t.y - (dy / dist) * R;
            const sx = s.x + (dx / dist) * R;
            const sy = s.y + (dy / dist) * R;

            // Edge weight label midpoint
            const mx = (sx + ex) / 2;
            const my = (sy + ey) / 2;

            // Color the edge if it's part of MST/shortest path
            const edgeColor = e.inMST ? '#22c55e' : e.inPath ? '#a855f7' : '#4b5563';
            const edgeWidth = e.inMST || e.inPath ? 2.5 : 1.8;

            return (
              <g key={i}>
                <line
                  x1={sx} y1={sy} x2={ex} y2={ey}
                  stroke={edgeColor}
                  strokeWidth={edgeWidth}
                  markerEnd="url(#arrowhead)"
                />
                {e.weight != null && (
                  <>
                    <rect x={mx - 10} y={my - 9} width={20} height={16} rx={4} fill="var(--bg, #0d0d1a)" opacity={0.85} />
                    <text x={mx} y={my + 3} textAnchor="middle" fill="#fbbf24" fontSize={10} fontWeight="700">{e.weight}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const colors = NODE_COLORS[node.state] || NODE_COLORS.unvisited;
            const distLabel = node.distance != null
              ? (node.distance === Infinity ? '∞' : node.distance)
              : null;
            return (
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                <circle
                  r={22}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={2.5}
                  className={styles.nodeCircle}
                  style={{ filter: node.state === 'processing' ? 'drop-shadow(0 0 6px #a855f7)' : node.state === 'visited' ? 'drop-shadow(0 0 4px #22c55e)' : 'none' }}
                />
                <text
                  textAnchor="middle"
                  y={distLabel ? -4 : 5}
                  fill={colors.text}
                  fontSize={13}
                  fontWeight="700"
                  className={styles.nodeLabel}
                >
                  {node.label}
                </text>
                {distLabel != null && (
                  <text textAnchor="middle" y={10} fill="#fbbf24" fontSize={9} fontWeight="600">
                    {distLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Queue / Stack display */}
      <QueueDisplay items={queue} label={isDFS ? 'Stack' : 'Queue'} />

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
          { state: 'unvisited',  label: 'Unvisited'   },
          { state: 'in-queue',   label: isDFS ? 'In Stack' : 'In Queue' },
          { state: 'processing', label: 'Processing'  },
          { state: 'visited',    label: 'Visited'     },
        ].map(({ state, label }) => {
          const c = NODE_COLORS[state];
          return (
            <div key={state} className={styles.legendItem}>
              <div
                className={styles.legendDot}
                style={{ background: c.fill, border: `2px solid ${c.stroke}` }}
              />
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
