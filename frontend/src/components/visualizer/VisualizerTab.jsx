import { useState, useEffect } from 'react';
import useVisualizerStore from './useVisualizerStore';
import { getVisualizationFrames, resolveKey, DEFAULT_INPUTS } from './generators/index';
import VisualizerEngine from './VisualizerEngine';
import PlaybackControls from './PlaybackControls';
import styles from './VisualizerTab.module.css';

// ─── Custom-input form per algorithm key ─────────────────────────────────────
function InputForm({ algoKey, onSubmit }) {
  const [vals, setVals] = useState({});

  const def = DEFAULT_INPUTS[algoKey] || {};

  const setV = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = {};
    for (const [k, v] of Object.entries(vals)) {
      if (v === '' || v === undefined) continue;
      // Try to parse arrays
      if (typeof v === 'string' && v.includes(',')) {
        const nums = v.split(',').map((x) => {
          const n = Number(x.trim());
          return isNaN(n) ? x.trim() : n;
        });
        parsed[k] = nums;
      } else {
        const n = Number(v);
        parsed[k] = isNaN(n) ? v : n;
      }
    }
    onSubmit(parsed);
  }

  const fields = [];

  // Array field
  if ('array' in def) {
    fields.push(
      <div key="array" className={styles.field}>
        <label className={styles.fieldLabel}>Array (comma-separated)</label>
        <input
          className={styles.fieldInput}
          defaultValue={(def.array || []).join(', ')}
          onChange={(e) => setV('array', e.target.value)}
          placeholder="e.g. 1, 3, 5, 7, 9"
        />
      </div>
    );
  }

  // Target
  if ('target' in def) {
    fields.push(
      <div key="target" className={styles.field}>
        <label className={styles.fieldLabel}>Target</label>
        <input
          className={`${styles.fieldInput} ${styles.fieldSmall}`}
          defaultValue={def.target}
          onChange={(e) => setV('target', e.target.value)}
          type="number"
        />
      </div>
    );
  }

  // k (sliding window)
  if ('k' in def) {
    fields.push(
      <div key="k" className={styles.field}>
        <label className={styles.fieldLabel}>Window size (k)</label>
        <input
          className={`${styles.fieldInput} ${styles.fieldSmall}`}
          defaultValue={def.k}
          onChange={(e) => setV('k', e.target.value)}
          type="number" min="1"
        />
      </div>
    );
  }

  // n (fibonacci)
  if ('n' in def) {
    fields.push(
      <div key="n" className={styles.field}>
        <label className={styles.fieldLabel}>n (compute up to F(n))</label>
        <input
          className={`${styles.fieldInput} ${styles.fieldSmall}`}
          defaultValue={def.n}
          onChange={(e) => setV('n', e.target.value)}
          type="number" min="2" max="20"
        />
      </div>
    );
  }

  // s1 / s2 (LCS, Edit Distance)
  if ('s1' in def) {
    fields.push(
      <div key="s1" className={styles.field}>
        <label className={styles.fieldLabel}>String 1</label>
        <input
          className={styles.fieldInput}
          defaultValue={def.s1}
          onChange={(e) => setV('s1', e.target.value)}
          placeholder="e.g. ABCBDAB"
        />
      </div>
    );
    fields.push(
      <div key="s2" className={styles.field}>
        <label className={styles.fieldLabel}>String 2</label>
        <input
          className={styles.fieldInput}
          defaultValue={def.s2}
          onChange={(e) => setV('s2', e.target.value)}
          placeholder="e.g. BDCAB"
        />
      </div>
    );
  }

  // s / t (Min Window Substring)
  if ('s' in def) {
    fields.push(
      <div key="s" className={styles.field}>
        <label className={styles.fieldLabel}>String S</label>
        <input className={styles.fieldInput} defaultValue={def.s} onChange={(e) => setV('s', e.target.value)} placeholder="e.g. ADOBECODEBANC" />
      </div>
    );
    fields.push(
      <div key="t" className={styles.field}>
        <label className={styles.fieldLabel}>Pattern T</label>
        <input className={`${styles.fieldInput} ${styles.fieldSmall}`} defaultValue={def.t} onChange={(e) => setV('t', e.target.value)} placeholder="e.g. ABC" />
      </div>
    );
  }

  // text / pattern (KMP)
  if ('text' in def) {
    fields.push(
      <div key="text" className={styles.field}>
        <label className={styles.fieldLabel}>Text</label>
        <input className={styles.fieldInput} defaultValue={def.text} onChange={(e) => setV('text', e.target.value)} placeholder="e.g. AABAACAADAABAABA" />
      </div>
    );
    fields.push(
      <div key="pattern" className={styles.field}>
        <label className={styles.fieldLabel}>Pattern</label>
        <input className={`${styles.fieldInput} ${styles.fieldSmall}`} defaultValue={def.pattern} onChange={(e) => setV('pattern', e.target.value)} placeholder="e.g. AABA" />
      </div>
    );
  }

  // str (Valid Parentheses)
  if ('str' in def) {
    fields.push(
      <div key="str" className={styles.field}>
        <label className={styles.fieldLabel}>Bracket string</label>
        <input className={`${styles.fieldInput} ${styles.fieldSmall}`} defaultValue={def.str} onChange={(e) => setV('str', e.target.value)} placeholder="e.g. ({[]})" />
      </div>
    );
  }

  // words (Group Anagrams)
  if ('words' in def) {
    fields.push(
      <div key="words" className={styles.field}>
        <label className={styles.fieldLabel}>Words (comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.words || []).join(', ')} onChange={(e) => setV('words', e.target.value)} placeholder="e.g. eat, tea, tan, ate" />
      </div>
    );
  }

  // nums (backtracking / jump game / greedy)
  if ('nums' in def) {
    fields.push(
      <div key="nums" className={styles.field}>
        <label className={styles.fieldLabel}>Nums (comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.nums || []).join(', ')} onChange={(e) => setV('nums', e.target.value)} placeholder="e.g. 1, 2, 3" />
      </div>
    );
  }

  // candidates (Combination Sum)
  if ('candidates' in def) {
    fields.push(
      <div key="candidates" className={styles.field}>
        <label className={styles.fieldLabel}>Candidates (comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.candidates || []).join(', ')} onChange={(e) => setV('candidates', e.target.value)} placeholder="e.g. 2, 3, 6, 7" />
      </div>
    );
  }

  // heights (Largest Rectangle / Monotonic Stack)
  if ('heights' in def) {
    fields.push(
      <div key="heights" className={styles.field}>
        <label className={styles.fieldLabel}>Heights (comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.heights || []).join(', ')} onChange={(e) => setV('heights', e.target.value)} placeholder="e.g. 2, 1, 5, 6, 2, 3" />
      </div>
    );
  }

  // values (Linked List)
  if ('values' in def) {
    fields.push(
      <div key="values" className={styles.field}>
        <label className={styles.fieldLabel}>List values (comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.values || []).join(', ')} onChange={(e) => setV('values', e.target.value)} placeholder="e.g. 1, 2, 3, 4, 5" />
      </div>
    );
  }

  // cycleAt (Floyd's Cycle Detection)
  if ('cycleAt' in def) {
    fields.push(
      <div key="cycleAt" className={styles.field}>
        <label className={styles.fieldLabel}>Cycle at index</label>
        <input className={`${styles.fieldInput} ${styles.fieldSmall}`} defaultValue={def.cycleAt} onChange={(e) => setV('cycleAt', e.target.value)} type="number" min="0" />
      </div>
    );
  }

  // l1 / l2 (Merge Two Sorted Lists)
  if ('l1' in def) {
    fields.push(
      <div key="l1" className={styles.field}>
        <label className={styles.fieldLabel}>List 1 (sorted, comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.l1 || []).join(', ')} onChange={(e) => setV('l1', e.target.value)} placeholder="e.g. 1, 3, 5, 7" />
      </div>
    );
    fields.push(
      <div key="l2" className={styles.field}>
        <label className={styles.fieldLabel}>List 2 (sorted, comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.l2 || []).join(', ')} onChange={(e) => setV('l2', e.target.value)} placeholder="e.g. 2, 4, 6, 8" />
      </div>
    );
  }

  // gas / cost (Gas Station)
  if ('gas' in def) {
    fields.push(
      <div key="gas" className={styles.field}>
        <label className={styles.fieldLabel}>Gas (comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.gas || []).join(', ')} onChange={(e) => setV('gas', e.target.value)} placeholder="e.g. 1, 2, 3, 4, 5" />
      </div>
    );
    fields.push(
      <div key="cost" className={styles.field}>
        <label className={styles.fieldLabel}>Cost (comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.cost || []).join(', ')} onChange={(e) => setV('cost', e.target.value)} placeholder="e.g. 3, 4, 5, 1, 2" />
      </div>
    );
  }

  // coins / amount (Coin Change)
  if ('coins' in def) {
    fields.push(
      <div key="coins" className={styles.field}>
        <label className={styles.fieldLabel}>Coins (comma-separated)</label>
        <input className={styles.fieldInput} defaultValue={(def.coins || []).join(', ')} onChange={(e) => setV('coins', e.target.value)} placeholder="e.g. 1, 5, 6, 9" />
      </div>
    );
    fields.push(
      <div key="amount" className={styles.field}>
        <label className={styles.fieldLabel}>Amount</label>
        <input className={`${styles.fieldInput} ${styles.fieldSmall}`} defaultValue={def.amount} onChange={(e) => setV('amount', e.target.value)} type="number" min="1" />
      </div>
    );
  }

  // p / q (LCA)
  if ('p' in def) {
    fields.push(
      <div key="p" className={styles.field}>
        <label className={styles.fieldLabel}>Node P</label>
        <input className={`${styles.fieldInput} ${styles.fieldSmall}`} defaultValue={def.p} onChange={(e) => setV('p', e.target.value)} placeholder="e.g. 1" />
      </div>
    );
    fields.push(
      <div key="q" className={styles.field}>
        <label className={styles.fieldLabel}>Node Q</label>
        <input className={`${styles.fieldInput} ${styles.fieldSmall}`} defaultValue={def.q} onChange={(e) => setV('q', e.target.value)} placeholder="e.g. 7" />
      </div>
    );
  }

  // searchVal (BST Search)
  if ('searchVal' in def) {
    fields.push(
      <div key="searchVal" className={styles.field}>
        <label className={styles.fieldLabel}>Search value</label>
        <input className={`${styles.fieldInput} ${styles.fieldSmall}`} defaultValue={def.searchVal} onChange={(e) => setV('searchVal', e.target.value)} type="number" />
      </div>
    );
  }

  if (fields.length === 0) return null;

  return (
    <form className={styles.inputForm} onSubmit={handleSubmit}>
      <div className={styles.fieldRow}>{fields}</div>
      <button type="submit" className={styles.applyBtn}>
        ↻ Apply & Regenerate
      </button>
    </form>
  );
}

// ─── "No visualizer" placeholder ─────────────────────────────────────────────
function NoVisualizer({ algoName, category }) {
  return (
    <div className={styles.noViz}>
      <div className={styles.noVizIcon}>🔭</div>
      <div className={styles.noVizTitle}>No step-by-step visualizer yet</div>
      <div className={styles.noVizSub}>
        <strong>{algoName}</strong> ({category}) doesn't have a built-in visualizer yet.
        <br />
        Covered: Searching, Sorting, Two Pointer, Sliding Window, Graph (BFS/DFS/Dijkstra/MST/etc.), Tree Traversals, DP (Fibonacci/Knapsack/LCS/Coin Change/Edit Distance/etc.), Linked List, Stack, Backtracking, Greedy, String/Hashing.
      </div>
    </div>
  );
}

// ─── DP row/col label builder ─────────────────────────────────────────────────
function buildDPLabels(algoKey, customInput = {}) {
  const def  = DEFAULT_INPUTS[algoKey] || {};
  const input = { ...def, ...customInput };

  if (algoKey === 'fibonacci') {
    const n = input.n || 9;
    return {
      rowLabels: null,
      colLabels: Array.from({ length: n + 1 }, (_, i) => `F(${i})`),
    };
  }
  if (algoKey === 'knapsack') {
    const { weights = [], values = [], capacity = 8 } = input;
    return {
      rowLabels: ['0', ...weights.map((w, i) => `i${i + 1}(w=${w},v=${values[i]})`).slice(0, 10)],
      colLabels: Array.from({ length: capacity + 1 }, (_, i) => i),
    };
  }
  if (algoKey === 'lcs') {
    const s1 = (input.s1 || 'ABCBDAB').toUpperCase();
    const s2 = (input.s2 || 'BDCAB').toUpperCase();
    return {
      rowLabels: ['', ...s1.split('')],
      colLabels: ['', ...s2.split('')],
    };
  }
  if (algoKey === 'editDistance') {
    const s1 = (input.s1 || 'SUNDAY').toUpperCase();
    const s2 = (input.s2 || 'SATURDAY').toUpperCase();
    return {
      rowLabels: ['', ...s1.split('')],
      colLabels: ['', ...s2.split('')],
    };
  }
  if (algoKey === 'subsetSum') {
    const nums = input.nums || [2, 3, 7, 8, 10];
    const tgt  = input.target || 11;
    return {
      rowLabels: ['0', ...nums.map((v, i) => `i${i + 1}(${v})`)],
      colLabels: Array.from({ length: tgt + 1 }, (_, i) => i),
    };
  }
  return { rowLabels: null, colLabels: null };
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function VisualizerTab({ algo }) {
  const { frames, currentFrame, setFrames } = useVisualizerStore();
  const [customInput, setCustomInput] = useState({});
  const [showInput, setShowInput] = useState(false);

  const algoKey  = resolveKey(algo?.name, algo?.category);
  const hasViz   = algoKey !== null;

  // Build frames whenever the algorithm or custom input changes
  useEffect(() => {
    if (!hasViz) { setFrames([]); return; }
    const f = getVisualizationFrames(algo.name, algo.category, customInput);
    setFrames(f || []);
  }, [algo?.name, algo?.category, customInput, hasViz, setFrames]);

  if (!hasViz) {
    return <NoVisualizer algoName={algo?.name} category={algo?.category} />;
  }

  const currentFrameData = frames[currentFrame] || null;
  const dpFrameType = currentFrameData?.type === 'grid';
  const { rowLabels, colLabels } = dpFrameType
    ? buildDPLabels(algoKey, customInput)
    : { rowLabels: null, colLabels: null };

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.engineBadge}>⚡ Visualization Engine</span>
          <span className={styles.algoLabel}>{algo.name}</span>
        </div>
        <button
          className={`${styles.inputToggle} ${showInput ? styles.inputToggleActive : ''}`}
          onClick={() => setShowInput((v) => !v)}
        >
          {showInput ? '▲ Hide Input' : '▼ Custom Input'}
        </button>
      </div>

      {/* Custom input panel */}
      {showInput && (
        <div className={styles.inputPanel}>
          <InputForm algoKey={algoKey} onSubmit={(parsed) => setCustomInput(parsed)} />
        </div>
      )}

      {/* Visualizer area */}
      <div className={styles.vizArea}>
        <VisualizerEngine
          frame={currentFrameData}
          rowLabels={rowLabels}
          colLabels={colLabels}
        />
      </div>

      {/* Playback controls */}
      <div className={styles.controlsWrap}>
        <PlaybackControls />
      </div>

      {/* What to observe hint */}
      <div className={styles.hint}>
        <strong>How to use:</strong> Press ▶ to auto-play, ◀ ▶ to step, drag the scrubber to jump to any step. Each step explains <em>why</em> — not just <em>what</em>.
      </div>
    </div>
  );
}
