import { useState, useMemo } from 'react';
import styles from './ComplexityVisualizer.module.css';

// ─── Growth function from complexity string ───────────────────────────────────
function parseGrowthFn(complexity = '') {
  const c = complexity.toLowerCase();
  if (c.includes('n!'))             return n => factorial(n);
  if (c.includes('2ⁿ') || c.includes('2^n')) return n => Math.min(Math.pow(2, n), 1e9);
  if (c.includes('n³') || c.includes('n^3')) return n => n * n * n;
  if (c.includes('n²') || c.includes('n^2') || c.includes('n log² n')) return n => n * n;
  if (c.includes('n log n') || c.includes('n·log')) return n => n * Math.log2(Math.max(n, 2));
  if (c.includes('log n') || c.includes('log₂')) return n => Math.log2(Math.max(n, 2));
  if (c.includes('(1)') || c === 'o(1)') return () => 1;
  if (c.includes('(n)') || c.endsWith('n)')) return n => n;
  return n => n; // default O(n)
}

function factorial(n) {
  if (n <= 0) return 1;
  if (n > 12) return 1e9;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ─── Complexity class label and color ─────────────────────────────────────────
function complexityMeta(complexity = '') {
  const c = complexity.toLowerCase();
  if (c.includes('1)'))                       return { label: 'O(1)',       color: '#10b981', grade: 'Excellent' };
  if (c.includes('log n') && !c.includes('n log')) return { label: 'O(log n)', color: '#34d399', grade: 'Very Good' };
  if (c.includes('n)') && !c.includes('n²') && !c.includes('n log')) return { label: 'O(n)', color: '#fbbf24', grade: 'Good' };
  if (c.includes('n log n'))                  return { label: 'O(n log n)', color: '#f59e0b', grade: 'Acceptable' };
  if (c.includes('n²') || c.includes('n^2')) return { label: 'O(n²)',      color: '#f87171', grade: 'Poor' };
  if (c.includes('n³') || c.includes('n^3')) return { label: 'O(n³)',      color: '#ef4444', grade: 'Bad' };
  if (c.includes('2ⁿ') || c.includes('2^n')) return { label: 'O(2ⁿ)',      color: '#dc2626', grade: 'Terrible' };
  if (c.includes('n!'))                       return { label: 'O(n!)',       color: '#991b1b', grade: 'Catastrophic' };
  return { label: complexity, color: '#94a3b8', grade: '' };
}

// ─── Derivation reasoning per category+complexity ────────────────────────────
function getDerivationSteps(algo) {
  const complexity = (algo.timeComplexityAverage || '').toLowerCase();
  const category   = (algo.category || '').toLowerCase();
  const name       = (algo.name || '').toLowerCase();

  // O(1) — constant
  if (complexity.includes('(1)')) return [
    { icon: '🎯', label: 'Constant Work', text: 'This algorithm performs a fixed number of operations regardless of input size.', color: '#10b981' },
    { icon: '📐', label: 'No Loops / Recursion', text: 'No loops that grow with input. No recursion. Just direct computation (hash lookup, array index access).', color: '#10b981' },
    { icon: '🏆', label: 'Result', text: 'Total operations = constant K. Big-O drops constants → O(1). Fastest possible.', color: '#10b981' },
  ];

  // O(log n) — binary search style
  if (complexity.includes('log n') && !complexity.includes('n log')) return [
    { icon: '✂️', label: 'Halving Each Step', text: 'Each operation cuts the remaining input in half. Starting with n elements: n → n/2 → n/4 → n/8 → ... → 1.', color: '#34d399' },
    { icon: '🔢', label: 'Count the Steps', text: 'How many times can you halve n before reaching 1? Answer: log₂(n). For n=1024: 1024→512→256→128→64→32→16→8→4→2→1 = exactly 10 steps = log₂(1024).', color: '#34d399' },
    { icon: '🏆', label: 'Result', text: 'Each step does O(1) work (compare). Total steps = log₂(n) → O(log n). For n=1,000,000 that\'s only 20 steps!', color: '#34d399' },
  ];

  // O(n) — linear
  if (complexity.includes('(n)') && !complexity.includes('n²') && !complexity.includes('n log')) return [
    { icon: '➡️', label: 'Single Pass', text: 'Algorithm touches each element at most once (or a constant number of times).', color: '#fbbf24' },
    { icon: '🔢', label: 'Count the Work', text: 'If input has n elements, the loop runs n times. Each iteration does O(1) work (compare, swap, add). Total = n × 1 = n operations.', color: '#fbbf24' },
    { icon: '📈', label: 'Growth', text: 'Double the input → double the work. This is LINEAR growth. Acceptable for most real-world inputs.', color: '#fbbf24' },
    { icon: '🏆', label: 'Result', text: 'T(n) = c × n → O(n). The constant c drops in Big-O notation.', color: '#fbbf24' },
  ];

  // O(n log n) — divide and conquer
  if (complexity.includes('n log n')) return [
    { icon: '✂️', label: 'Split the Problem', text: 'Divide-and-conquer: recursively split the array in half. The depth of recursion = log₂(n) levels.', color: '#f59e0b' },
    { icon: '🔄', label: 'Work at Each Level', text: 'At EVERY level of recursion, you still process ALL n elements total (just in smaller chunks). That\'s O(n) work per level.', color: '#f59e0b' },
    { icon: '🔢', label: 'Multiply', text: 'log₂(n) levels × n work per level = n log n total operations. For n=1000: 1000 × 10 = 10,000 operations.', color: '#f59e0b' },
    { icon: '🏆', label: 'Result', text: 'T(n) = 2T(n/2) + n (recurrence) → solves to O(n log n) by Master Theorem. Best achievable for comparison-based sorting.', color: '#f59e0b' },
  ];

  // O(n²) — nested loops
  if (complexity.includes('n²') || complexity.includes('n^2')) return [
    { icon: '🔁', label: 'Outer Loop', text: `Outer loop iterates over all n elements. Runs n times.`, color: '#f87171' },
    { icon: '🔁', label: 'Inner Loop (Nested)', text: 'For EACH iteration of the outer loop, the inner loop ALSO runs up to n times. This is the critical insight.', color: '#f87171' },
    { icon: '🔢', label: 'Multiply the Loops', text: 'Outer: n iterations × Inner: n iterations = n × n = n² total operations. For n=100: 10,000 comparisons. For n=1000: 1,000,000.', color: '#f87171' },
    { icon: '⚠️', label: 'The Danger Zone', text: 'n² grows FAST. n=10,000 means 100,000,000 operations. This is why O(n²) algorithms fail on large datasets.', color: '#f87171' },
    { icon: '🏆', label: 'Result', text: 'T(n) = n + (n-1) + (n-2) + ... + 1 = n(n+1)/2 ≈ n²/2 → O(n²). Drop constants and lower-order terms.', color: '#f87171' },
  ];

  // O(2^n) — exponential
  if (complexity.includes('2ⁿ') || complexity.includes('2^n')) return [
    { icon: '🌳', label: 'Exponential Branching', text: 'Each decision point branches into 2 sub-problems. The recursion tree doubles at every level.', color: '#dc2626' },
    { icon: '🔢', label: 'Levels × Nodes', text: 'Depth = n levels. Nodes at level k = 2^k. Total nodes = 2⁰ + 2¹ + ... + 2ⁿ = 2^(n+1) - 1 ≈ 2ⁿ.', color: '#dc2626' },
    { icon: '🚨', label: 'Reality Check', text: 'n=30 → over 1 BILLION operations. n=60 → exceeds atoms in the observable universe. Only feasible for tiny n (≤30).', color: '#dc2626' },
    { icon: '🏆', label: 'Result', text: 'T(n) = 2T(n-1) + 1 → O(2ⁿ). Memoization can reduce to O(n) by caching repeated sub-problems.', color: '#dc2626' },
  ];

  // O(n!) — factorial
  if (complexity.includes('n!')) return [
    { icon: '🔀', label: 'All Permutations', text: 'Algorithm generates/checks all possible orderings. For n items: n × (n-1) × (n-2) × ... × 1 = n! permutations.', color: '#991b1b' },
    { icon: '🔢', label: 'Scale of the Problem', text: 'n=10 → 3,628,800. n=15 → 1.3 trillion. n=20 → 2.4 quintillion. Completely infeasible beyond n≈12.', color: '#991b1b' },
    { icon: '🏆', label: 'Result', text: 'O(n!) is the worst practical complexity. Used in brute-force TSP, permutation generation. Always look for pruning or heuristics.', color: '#991b1b' },
  ];

  return [
    { icon: '📊', label: 'Complexity', text: `This algorithm has ${algo.timeComplexityAverage} time complexity.`, color: '#94a3b8' },
    { icon: '📖', label: 'Tip', text: 'Count the loops and recursive calls — each nested loop multiplies the complexity.', color: '#94a3b8' },
  ];
}

// ─── Complexity scale (all Big-O classes) ─────────────────────────────────────
const COMPLEXITY_SCALE = [
  { label: 'O(1)',      fn: () => 1,                      color: '#10b981', grade: 'Constant'     },
  { label: 'O(log n)', fn: n => Math.log2(Math.max(n,2)), color: '#34d399', grade: 'Logarithmic'  },
  { label: 'O(n)',      fn: n => n,                        color: '#fbbf24', grade: 'Linear'       },
  { label: 'O(n log n)',fn: n => n * Math.log2(Math.max(n,2)), color: '#f59e0b', grade: 'Linearithmic' },
  { label: 'O(n²)',     fn: n => n * n,                    color: '#f87171', grade: 'Quadratic'    },
  { label: 'O(2ⁿ)',     fn: n => Math.min(Math.pow(2, n), 1e9), color: '#dc2626', grade: 'Exponential' },
];

const BENCH_SIZES = [10, 50, 100, 500, 1000, 10000];

function formatOps(n) {
  if (n >= 1e9)  return '> 1B 🚨';
  if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toString();
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ComplexityVisualizer({ algo }) {
  const [n, setN] = useState(10);

  const avgComplexity  = algo.timeComplexityAverage || '';
  const worstComplexity = algo.timeComplexityWorst  || '';
  const growthFn       = useMemo(() => parseGrowthFn(avgComplexity), [avgComplexity]);
  const meta           = useMemo(() => complexityMeta(avgComplexity), [avgComplexity]);
  const derivation     = useMemo(() => getDerivationSteps(algo), [algo]);

  const currentOps = Math.round(growthFn(n));

  // Chart: 50 points
  const maxOps = useMemo(() => {
    let m = 0;
    for (let i = 1; i <= 50; i++) m = Math.max(m, growthFn(i));
    return m || 1;
  }, [growthFn]);

  const chartBars = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => {
      const ni = i + 1;
      const ops = growthFn(ni);
      return { n: ni, ops, pct: Math.min(100, (ops / maxOps) * 100) };
    }), [growthFn, maxOps]);

  return (
    <div className={styles.root}>

      {/* ── Section 1: Complexity badge + grade ─────────────────────────── */}
      <div className={styles.gradeRow}>
        <div className={styles.gradeCard} style={{ borderColor: meta.color + '44', background: meta.color + '0d' }}>
          <span className={styles.gradeLabel}>Average Case</span>
          <span className={styles.gradeValue} style={{ color: meta.color }}>{avgComplexity}</span>
          <span className={styles.gradeTag} style={{ background: meta.color + '22', color: meta.color }}>{meta.grade}</span>
        </div>
        {worstComplexity && worstComplexity !== avgComplexity && (
          <div className={styles.gradeCard} style={{ borderColor: complexityMeta(worstComplexity).color + '44', background: complexityMeta(worstComplexity).color + '0d' }}>
            <span className={styles.gradeLabel}>Worst Case</span>
            <span className={styles.gradeValue} style={{ color: complexityMeta(worstComplexity).color }}>{worstComplexity}</span>
            <span className={styles.gradeTag} style={{ background: complexityMeta(worstComplexity).color + '22', color: complexityMeta(worstComplexity).color }}>{complexityMeta(worstComplexity).grade}</span>
          </div>
        )}
        {algo.spaceComplexity && (
          <div className={styles.gradeCard} style={{ borderColor: '#818cf844', background: '#818cf80d' }}>
            <span className={styles.gradeLabel}>Space</span>
            <span className={styles.gradeValue} style={{ color: '#818cf8' }}>{algo.spaceComplexity.split('·')[0].trim()}</span>
            <span className={styles.gradeTag} style={{ background: '#818cf822', color: '#818cf8' }}>Memory</span>
          </div>
        )}
      </div>

      {/* ── Section 2: Derivation steps ─────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🧮</span>
          <h3 className={styles.sectionTitle}>How to derive {avgComplexity}</h3>
          <span className={styles.sectionSub}>Think through the loops, not memorize the answer</span>
        </div>
        <div className={styles.derivationSteps}>
          {derivation.map((step, i) => (
            <div key={i} className={styles.derivStep} style={{ borderLeftColor: step.color }}>
              <div className={styles.derivStepHeader}>
                <span className={styles.derivIcon}>{step.icon}</span>
                <span className={styles.derivLabel} style={{ color: step.color }}>{step.label}</span>
                {i < derivation.length - 1 && <span className={styles.derivArrow}>↓</span>}
              </div>
              <p className={styles.derivText}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Interactive growth chart ─────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📈</span>
          <h3 className={styles.sectionTitle}>Growth Chart — {avgComplexity}</h3>
          <span className={styles.sectionSub}>Slide to see how operations scale with input size</span>
        </div>

        <div className={styles.sliderRow}>
          <span className={styles.sliderLabel}>n =</span>
          <input
            type="range"
            min={1} max={50} value={n}
            onChange={e => setN(Number(e.target.value))}
            className={styles.slider}
            style={{ accentColor: meta.color }}
          />
          <span className={styles.sliderN} style={{ color: meta.color }}>{n}</span>
          <span className={styles.sliderOps}>
            → <strong style={{ color: meta.color }}>{formatOps(currentOps)}</strong> operations
          </span>
        </div>

        <div className={styles.chart}>
          {chartBars.map(bar => (
            <div
              key={bar.n}
              className={`${styles.chartBar} ${bar.n === n ? styles.chartBarActive : ''}`}
              title={`n=${bar.n}: ${formatOps(bar.ops)} ops`}
            >
              <div
                className={styles.chartFill}
                style={{
                  height: `${Math.max(1, bar.pct)}%`,
                  background: bar.n === n ? meta.color : meta.color + '55',
                }}
              />
              {bar.n % 10 === 0 && (
                <span className={styles.chartTick}>{bar.n}</span>
              )}
            </div>
          ))}
        </div>
        <div className={styles.chartAxisLabel}>Input size (n)</div>
      </div>

      {/* ── Section 4: Benchmark table ──────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📊</span>
          <h3 className={styles.sectionTitle}>Real Numbers — What {avgComplexity} Actually Means</h3>
          <span className={styles.sectionSub}>Assumes 10⁸ operations/second (modern CPU estimate)</span>
        </div>
        <div className={styles.benchTable}>
          <div className={styles.benchHeader}>
            <span>Input Size (n)</span>
            <span>Operations</span>
            <span>Est. Time</span>
            <span>Verdict</span>
          </div>
          {BENCH_SIZES.map(size => {
            const ops = growthFn(size);
            const secs = ops / 1e8;
            const time = secs < 1e-6 ? '< 1 µs' :
                         secs < 1e-3 ? `${(secs * 1e6).toFixed(1)} µs` :
                         secs < 1    ? `${(secs * 1000).toFixed(1)} ms` :
                         secs < 60   ? `${secs.toFixed(1)} sec` :
                         secs < 3600 ? `${(secs / 60).toFixed(1)} min` :
                                       '> 1 hour 🚨';
            const verdict = ops >= 1e9 ? '🔴 Infeasible' :
                            ops >= 1e7 ? '🟡 Slow' :
                            ops >= 1e5 ? '🟠 Acceptable' : '🟢 Fast';
            return (
              <div key={size} className={styles.benchRow}>
                <span className={styles.benchN}>{size.toLocaleString()}</span>
                <span className={styles.benchOps} style={{ color: ops >= 1e9 ? '#ef4444' : ops >= 1e6 ? '#f87171' : 'var(--text2)' }}>
                  {formatOps(ops)}
                </span>
                <span className={styles.benchTime}>{time}</span>
                <span className={styles.benchVerdict}>{verdict}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 5: O-class comparison scale ─────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🏁</span>
          <h3 className={styles.sectionTitle}>Complexity Scale — Where does {avgComplexity} rank?</h3>
          <span className={styles.sectionSub}>Operations for n=100</span>
        </div>
        <div className={styles.scale}>
          {COMPLEXITY_SCALE.map(cls => {
            const ops = cls.fn(100);
            const maxScaleOps = COMPLEXITY_SCALE[COMPLEXITY_SCALE.length - 1].fn(30);
            const pct = Math.min(100, (ops / maxScaleOps) * 100);
            const isThis = avgComplexity.includes(cls.label.replace('O(','').replace(')',''));
            return (
              <div key={cls.label} className={`${styles.scaleRow} ${isThis ? styles.scaleRowActive : ''}`}>
                <span className={styles.scaleLabel} style={{ color: cls.color }}>{cls.label}</span>
                <div className={styles.scaleBar}>
                  <div
                    className={styles.scaleFill}
                    style={{ width: `${Math.max(1, pct)}%`, background: cls.color }}
                  />
                </div>
                <span className={styles.scaleOps} style={{ color: cls.color }}>{formatOps(ops)}</span>
                <span className={styles.scaleGrade}>{cls.grade}</span>
                {isThis && <span className={styles.scaleYou}>← You are here</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 6: Space complexity ─────────────────────────────────── */}
      {algo.spaceComplexity && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>💾</span>
            <h3 className={styles.sectionTitle}>Space Complexity — {algo.spaceComplexity.split('·')[0].trim()}</h3>
            <span className={styles.sectionSub}>Memory used relative to input size</span>
          </div>
          <div className={styles.spaceBox}>
            <div className={styles.spaceRule}>
              {algo.spaceComplexity.includes('(1)') && (
                <p>✅ <strong>In-Place</strong> — uses only a constant amount of extra memory (a few variables). Input array is modified directly. Best possible space efficiency.</p>
              )}
              {algo.spaceComplexity.includes('log') && !algo.spaceComplexity.includes('n log') && (
                <p>⚡ <strong>Logarithmic Space</strong> — recursion stack grows log₂(n) deep. For n=1 million, stack depth ≈ 20 frames. Very efficient.</p>
              )}
              {algo.spaceComplexity.includes('O(n)') && (
                <p>📦 <strong>Linear Space</strong> — needs an auxiliary array or stack proportional to input size. Doubling input doubles memory. Acceptable but be aware.</p>
              )}
              {algo.spaceComplexity.includes('n²') && (
                <p>⚠️ <strong>Quadratic Space</strong> — stores an n×n matrix or similar structure. Only feasible for small inputs (n ≤ 1000).</p>
              )}
              {algo.spaceComplexity.split('·').length > 1 && (
                <p className={styles.spaceNote}>📝 {algo.spaceComplexity.split('·').slice(1).join('·').trim()}</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
