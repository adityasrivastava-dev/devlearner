import { useEffect, useRef, useState } from 'react';
import styles from './ComplexityChart.module.css';

// N values plotted on the X axis
const N_VALS = [1, 5, 10, 20, 50, 100, 200, 500, 1000];

// Complexity curve definitions
const CURVES = [
  { key: 'O(1)',       fn: ()    => 1,                          color: '#4ade80', label: 'O(1) — Constant'       },
  { key: 'O(log n)',   fn: (n)   => Math.log2(n + 1),           color: '#2dd4bf', label: 'O(log n) — Logarithmic' },
  { key: 'O(n)',       fn: (n)   => n,                          color: '#60a5fa', label: 'O(n) — Linear'          },
  { key: 'O(n log n)', fn: (n)   => n * Math.log2(n + 1),       color: '#fbbf24', label: 'O(n log n) — Linearithmic' },
  { key: 'O(n²)',      fn: (n)   => n * n,                      color: '#fb923c', label: 'O(n²) — Quadratic'      },
  { key: 'O(2ⁿ)',      fn: (n)   => Math.min(Math.pow(2, n), 1e12), color: '#c084fc', label: 'O(2ⁿ) — Exponential' },
];

const W = 480, H = 200;
const PAD_L = 40, PAD_B = 30, PAD_T = 16, PAD_R = 16;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

function buildPath(curve, maxVal) {
  const points = N_VALS.map((n, i) => {
    const val = curve.fn(n);
    const x   = PAD_L + (i / (N_VALS.length - 1)) * PLOT_W;
    // Log scale for Y so all curves are readable
    const logVal = Math.log10(val + 1);
    const logMax = Math.log10(maxVal + 1);
    const y  = PAD_T + PLOT_H - (logVal / logMax) * PLOT_H;
    return `${x.toFixed(1)},${Math.max(PAD_T, y).toFixed(1)}`;
  });
  return 'M ' + points.join(' L ');
}

export default function ComplexityChart({ timeComplexity }) {
  const [visible, setVisible] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [timeComplexity]);

  // Find the active curve
  const activeCurve = CURVES.find(c =>
    c.key === timeComplexity ||
    (timeComplexity?.includes('n²') && c.key === 'O(n²)') ||
    (timeComplexity?.includes('log n') && !timeComplexity?.includes('n log n') && c.key === 'O(log n)') ||
    (timeComplexity?.includes('n log n') && c.key === 'O(n log n)') ||
    (timeComplexity?.includes('2ⁿ') && c.key === 'O(2ⁿ)') ||
    (timeComplexity === 'O(n)' && c.key === 'O(n)') ||
    (timeComplexity === 'O(1)' && c.key === 'O(1)')
  );

  // Max value among all curves at max N
  const maxN   = N_VALS[N_VALS.length - 1];
  const maxVal = Math.max(...CURVES.map(c => c.fn(maxN)));

  // X axis labels
  const xLabels = N_VALS.filter((_, i) => i % 2 === 0); // every other one

  // Bar chart data at N=100 for comparison
  const barN   = 100;
  const barMax = Math.log10(CURVES[CURVES.length - 1].fn(barN) + 1);
  const bars   = CURVES.map(c => ({
    ...c,
    barH: Math.round((Math.log10(c.fn(barN) + 1) / barMax) * 100),
  }));

  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>
        <span className={styles.headingIcon}>📈</span>
        Growth Visualization
        {activeCurve && (
          <span className={styles.headingBadge} style={{ color: activeCurve.color, borderColor: activeCurve.color + '44', background: activeCurve.color + '15' }}>
            Your code: {activeCurve.key}
          </span>
        )}
      </div>
      <p className={styles.subtext}>How each complexity class grows as input size N increases (log scale)</p>

      {/* ── SVG line chart ── */}
      <div className={styles.chartWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map(f => {
            const y = PAD_T + PLOT_H * (1 - f);
            return <line key={f} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
              stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />;
          })}
          {/* X grid */}
          {N_VALS.map((_, i) => {
            const x = PAD_L + (i / (N_VALS.length - 1)) * PLOT_W;
            return <line key={i} x1={x} y1={PAD_T} x2={x} y2={PAD_T + PLOT_H}
              stroke="var(--border)" strokeWidth={0.5} strokeDasharray="2 4" />;
          })}

          {/* Y axis */}
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + PLOT_H} stroke="var(--border2)" strokeWidth={1} />
          {/* X axis */}
          <line x1={PAD_L} y1={PAD_T + PLOT_H} x2={W - PAD_R} y2={PAD_T + PLOT_H} stroke="var(--border2)" strokeWidth={1} />

          {/* X axis labels */}
          {N_VALS.map((n, i) => {
            const x = PAD_L + (i / (N_VALS.length - 1)) * PLOT_W;
            return <text key={n} x={x} y={H - 6} textAnchor="middle" fill="var(--text3)"
              fontSize={9} fontFamily="system-ui">{n >= 1000 ? '1k' : n}</text>;
          })}
          {/* Y axis label */}
          <text x={10} y={PAD_T + PLOT_H / 2} fill="var(--text3)" fontSize={9}
            fontFamily="system-ui" textAnchor="middle"
            transform={`rotate(-90, 10, ${PAD_T + PLOT_H / 2})`}>ops (log)</text>

          {/* Curves (non-active first, then active on top) */}
          {CURVES.filter(c => c.key !== activeCurve?.key).map(curve => {
            const path = buildPath(curve, maxVal);
            const isFaded = hoveredKey && hoveredKey !== curve.key;
            return (
              <path key={curve.key} d={path} fill="none"
                stroke={curve.color} strokeWidth={1.2}
                opacity={isFaded ? 0.15 : 0.4}
                strokeLinecap="round" strokeLinejoin="round"
                className={styles.curvePath}
                onMouseEnter={() => setHoveredKey(curve.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
            );
          })}

          {/* Active curve — glowing, animated */}
          {activeCurve && (() => {
            const path = buildPath(activeCurve, maxVal);
            return (
              <g>
                {/* Glow shadow */}
                <path d={path} fill="none" stroke={activeCurve.color}
                  strokeWidth={8} opacity={0.15} strokeLinecap="round" />
                {/* Main line */}
                <path d={path} fill="none" stroke={activeCurve.color}
                  strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                  className={`${styles.curvePath} ${visible ? styles.curveVisible : ''}`}
                />
                {/* Dots at each N */}
                {N_VALS.map((n, i) => {
                  const val = activeCurve.fn(n);
                  const x   = PAD_L + (i / (N_VALS.length - 1)) * PLOT_W;
                  const logVal = Math.log10(val + 1);
                  const logMax = Math.log10(maxVal + 1);
                  const y  = Math.max(PAD_T, PAD_T + PLOT_H - (logVal / logMax) * PLOT_H);
                  return <circle key={n} cx={x} cy={y} r={3}
                    fill={activeCurve.color} opacity={visible ? 1 : 0}
                    style={{ transition: `opacity .3s ${i * 80}ms` }}
                  />;
                })}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* ── Bar comparison at N=100 ── */}
      <div className={styles.barSection}>
        <div className={styles.barTitle}>Relative operations at N=100</div>
        <div className={styles.bars}>
          {bars.map(b => {
            const isActive = b.key === activeCurve?.key;
            return (
              <div key={b.key} className={`${styles.barItem} ${isActive ? styles.barItemActive : ''}`}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      height: `${b.barH}%`,
                      background: b.color,
                      opacity: isActive ? 1 : 0.35,
                      boxShadow: isActive ? `0 0 10px ${b.color}66` : 'none',
                    }}
                  />
                </div>
                <div className={styles.barLabel} style={{ color: isActive ? b.color : 'var(--text3)' }}>
                  {b.key}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className={styles.legend}>
        {CURVES.map(c => {
          const isActive = c.key === activeCurve?.key;
          return (
            <div
              key={c.key}
              className={`${styles.legendItem} ${isActive ? styles.legendItemActive : ''}`}
              onMouseEnter={() => setHoveredKey(c.key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <div className={styles.legendDot} style={{ background: c.color, boxShadow: isActive ? `0 0 6px ${c.color}` : 'none' }} />
              <span style={{ color: isActive ? c.color : 'var(--text3)' }}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
