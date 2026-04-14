import styles from './LinkedListRenderer.module.css';

const NODE_COLORS = {
  default:   { fill: '#1a1a2e', stroke: '#4b5563',  text: '#9ca3af' },
  current:   { fill: '#2d1b69', stroke: '#8b5cf6',  text: '#c4b5fd' },
  slow:      { fill: '#164e63', stroke: '#06b6d4',  text: '#67e8f9' },
  fast:      { fill: '#4c0519', stroke: '#f43f5e',  text: '#fda4af' },
  found:     { fill: '#064e3b', stroke: '#10b981',  text: '#6ee7b7' },
  reversed:  { fill: '#14532d', stroke: '#22c55e',  text: '#bbf7d0' },
  dummy:     { fill: '#0f172a', stroke: '#334155',  text: '#64748b' },
  cycle:     { fill: '#7c2d12', stroke: '#f97316',  text: '#fed7aa' },
  merged:    { fill: '#1e3a5f', stroke: '#3b82f6',  text: '#93c5fd' },
  comparing: { fill: '#78350f', stroke: '#fbbf24',  text: '#fde68a' },
  pivot:     { fill: '#581c87', stroke: '#a855f7',  text: '#e9d5ff' },
  list2:     { fill: '#1e1b4b', stroke: '#6366f1',  text: '#c7d2fe' },
};

const BOX_W = 52, BOX_H = 40, GAP = 34, ARROW_W = 22;
const NODE_STEP = BOX_W + GAP;
const Y_BASE = 80;

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

export default function LinkedListRenderer({ frame }) {
  if (!frame) return null;
  const {
    nodes = [], pointers = [], hasCycle, cycleAt,
    message, variables, phase,
    head2,        // for merge: second list starts here
    resultNodes,  // for merge: result list
  } = frame;

  // Build pointer map: nodeId → [{label, color}]
  const ptrMap = {};
  (pointers || []).forEach(({ nodeId, label, color }) => {
    if (nodeId == null || nodeId >= nodes.length) return;
    if (!ptrMap[nodeId]) ptrMap[nodeId] = [];
    ptrMap[nodeId].push({ label, color });
  });

  const maxNodes = Math.min(nodes.length, 14);
  const svgW = maxNodes * NODE_STEP + 20;
  const svgH = hasCycle ? 180 : 160;

  // Cycle arrow: from last node back to cycleAt node
  const cycleArrowEl = hasCycle && cycleAt != null ? (() => {
    const fromIdx = maxNodes - 1;
    const toIdx   = cycleAt;
    const fx = fromIdx * NODE_STEP + BOX_W / 2 + 10;
    const tx = toIdx  * NODE_STEP + BOX_W / 2 + 10;
    const fy = Y_BASE + BOX_H;
    const cy = fy + 36;
    return (
      <path
        d={`M ${fx} ${fy} Q ${(fx + tx) / 2} ${cy + 10} ${tx} ${fy}`}
        fill="none"
        stroke="#f97316"
        strokeWidth={1.8}
        strokeDasharray="5 3"
        markerEnd="url(#arrowLL)"
      />
    );
  })() : null;

  return (
    <div className={styles.wrap}>
      {phase && <div className={styles.phaseBadge}>{phase}</div>}

      <div className={styles.svgWrap} style={{ maxWidth: Math.min(svgW, 760) }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width={svgW}
          height={svgH}
          className={styles.svg}
        >
          <defs>
            <marker id="arrowLL" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
            </marker>
            <marker id="arrowRev" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
            </marker>
            <marker id="arrowCycle" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
            </marker>
          </defs>

          {/* Cycle arc */}
          {cycleArrowEl}

          {/* Nodes + arrows */}
          {nodes.slice(0, maxNodes).map((node, i) => {
            const c = NODE_COLORS[node.state] || NODE_COLORS.default;
            const x = i * NODE_STEP + 10;
            const y = Y_BASE - BOX_H / 2;

            // Pointer labels above node
            const ptrs = ptrMap[i] || [];

            return (
              <g key={i}>
                {/* Arrow to next */}
                {i < maxNodes - 1 && (
                  <line
                    x1={x + BOX_W}
                    y1={Y_BASE}
                    x2={x + BOX_W + GAP - 4}
                    y2={Y_BASE}
                    stroke="#4b5563"
                    strokeWidth={1.8}
                    markerEnd="url(#arrowLL)"
                  />
                )}
                {/* NULL at end */}
                {i === maxNodes - 1 && !hasCycle && (
                  <text x={x + BOX_W + 6} y={Y_BASE + 5} fill="#4b5563" fontSize={10} fontWeight="600">NULL</text>
                )}

                {/* Node box */}
                <rect
                  x={x} y={y}
                  width={BOX_W} height={BOX_H}
                  rx={6}
                  fill={c.fill}
                  stroke={c.stroke}
                  strokeWidth={2}
                  style={{
                    transition: 'fill 0.25s, stroke 0.25s',
                    filter: node.state !== 'default' ? `drop-shadow(0 0 4px ${c.stroke})` : 'none',
                  }}
                />
                {/* Value */}
                <text
                  x={x + BOX_W / 2}
                  y={Y_BASE + 5}
                  textAnchor="middle"
                  fill={c.text}
                  fontSize={14}
                  fontWeight="700"
                >
                  {node.value}
                </text>

                {/* Pointer labels above */}
                {ptrs.map((p, pi) => (
                  <text
                    key={pi}
                    x={x + BOX_W / 2}
                    y={y - 6 - pi * 14}
                    textAnchor="middle"
                    fill={p.color}
                    fontSize={10}
                    fontWeight="700"
                  >
                    {p.label}
                  </text>
                ))}

                {/* Index below */}
                <text
                  x={x + BOX_W / 2}
                  y={y + BOX_H + 14}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize={9}
                >
                  [{i}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Second list (for merge) */}
      {resultNodes && resultNodes.length > 0 && (
        <div className={styles.resultSection}>
          <div className={styles.resultLabel}>Merged Result:</div>
          <div className={styles.resultItems}>
            {resultNodes.map((n, i) => (
              <span key={i} className={`${styles.resultNode} ${n.state === 'merged' ? styles.resultMerged : ''}`}>
                {n.value}
              </span>
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
        {Object.entries(NODE_COLORS).filter(([s]) =>
          ['default','current','slow','fast','found','reversed','cycle','merged','comparing'].includes(s)
        ).map(([state, c]) => (
          <div key={state} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: c.fill, border: `2px solid ${c.stroke}` }} />
            <span>{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
