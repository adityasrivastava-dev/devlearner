import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './AlgorithmVisualizer.module.css';

// ── Step player hook ──────────────────────────────────────────────────────────
function useStepPlayer(steps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.2);
  const timerRef = useRef(null);

  const clear = () => clearInterval(timerRef.current);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [steps]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setIndex(i => {
          if (i >= steps.length - 1) { setPlaying(false); return i; }
          return i + 1;
        });
      }, 1000 / speed);
    } else {
      clear();
    }
    return clear;
  }, [playing, speed, steps.length]);

  const prev   = useCallback(() => { setPlaying(false); setIndex(i => Math.max(0, i - 1)); }, []);
  const next   = useCallback(() => { setPlaying(false); setIndex(i => Math.min(steps.length - 1, i + 1)); }, [steps.length]);
  const reset  = useCallback(() => { setPlaying(false); setIndex(0); }, []);
  const toggle = useCallback(() => {
    if (index >= steps.length - 1) { setIndex(0); setPlaying(true); }
    else setPlaying(p => !p);
  }, [index, steps.length]);

  return { index, playing, speed, setSpeed, prev, next, reset, toggle, total: steps.length };
}

// ── Shared: array cell ────────────────────────────────────────────────────────
function Cell({ value, colorClass, index: idx, showIndex = true }) {
  return (
    <div className={styles.cellWrap}>
      <div className={`${styles.cell} ${colorClass || styles.cellNormal}`}>{value}</div>
      {showIndex && <span className={styles.cellIndex}>{idx}</span>}
    </div>
  );
}

// ── Shared: pointer row ───────────────────────────────────────────────────────
function PointerRow({ length, pointers }) {
  // pointers: [{index, label, cls}]
  const slots = Array.from({ length }, (_, i) => {
    const pts = pointers.filter(p => p.index === i);
    return (
      <div key={i} className={styles.pointerWrap}>
        {pts.map((p, j) => (
          <span key={j} className={`${styles.pointer} ${p.cls}`}>{p.label}</span>
        ))}
      </div>
    );
  });
  return <div className={styles.pointerRow}>{slots}</div>;
}

// ── Shared: variable chips ────────────────────────────────────────────────────
function Vars({ vars }) {
  return (
    <div className={styles.varsGrid}>
      {vars.map(([k, v]) => (
        <div key={k} className={styles.varChip}>
          <span className={styles.varKey}>{k} =</span>
          <span className={styles.varValue}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Shared: message ───────────────────────────────────────────────────────────
function Message({ text, status }) {
  const cls = status === 'done' || status === 'found' ? styles.messageDone
    : status === 'not_found' ? styles.messageError
    : status === 'swap' ? styles.messageSwap
    : '';
  return <div className={`${styles.messageBox} ${cls}`}>{text}</div>;
}

// ── Shared: controls ──────────────────────────────────────────────────────────
function Controls({ player }) {
  const { index, playing, speed, setSpeed, prev, next, reset, toggle, total } = player;
  return (
    <div className={styles.controls}>
      <button className={styles.ctrlBtn} onClick={reset} disabled={index === 0} title="Reset">⟪</button>
      <button className={styles.ctrlBtn} onClick={prev}  disabled={index === 0} title="Previous">◀</button>
      <button className={styles.playBtn} onClick={toggle}>
        {playing ? '⏸' : (index >= total - 1 ? '↺' : '▶')}
      </button>
      <button className={styles.ctrlBtn} onClick={next}  disabled={index >= total - 1} title="Next">▶</button>
      <span className={styles.stepCount}>Step {index + 1} / {total}</span>
      <div className={styles.speedRow}>
        <span>Speed</span>
        <input type="range" min="0.3" max="4" step="0.1" value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          className={styles.speedSlider} />
      </div>
    </div>
  );
}

// ── Shared: container ─────────────────────────────────────────────────────────
function VizContainer({ title, children }) {
  return (
    <div className={styles.vizContainer}>
      <div className={styles.vizTitle}>{title}</div>
      {children}
    </div>
  );
}

// ── Shared: editable array input ──────────────────────────────────────────────
function ArrayInput({ label, value, onChange, hint }) {
  return (
    <div className={styles.inputGroup}>
      <span className={styles.inputLabel}>{label}</span>
      <input className={styles.inputField} value={value}
        onChange={e => onChange(e.target.value)} placeholder={hint} />
    </div>
  );
}

function parseArr(str, max = 16) {
  return str.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)).slice(0, max);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BINARY SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
function genBinarySteps(arr, target) {
  const steps = [];
  let low = 0, high = arr.length - 1;
  steps.push({ low, high, mid: -1, status: 'init', message: `Array is sorted. Set low=0, high=${high}. Searching for target=${target}.` });
  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    steps.push({ low, high, mid, status: 'compare', message: `mid = ${low} + (${high} − ${low}) / 2 = ${mid}.  arr[${mid}] = ${arr[mid]}` });
    if (arr[mid] === target) {
      steps.push({ low, high, mid, status: 'found', message: `✓ arr[${mid}] = ${arr[mid]} equals target ${target}. Found at index ${mid}!` });
      return steps;
    } else if (arr[mid] < target) {
      steps.push({ low, high, mid, status: 'move_low', message: `arr[${mid}]=${arr[mid]} < target ${target} → discard left half → low = ${mid}+1 = ${mid+1}` });
      low = mid + 1;
    } else {
      steps.push({ low, high, mid, status: 'move_high', message: `arr[${mid}]=${arr[mid]} > target ${target} → discard right half → high = ${mid}−1 = ${mid-1}` });
      high = mid - 1;
    }
  }
  steps.push({ low, high, mid: -1, status: 'not_found', message: `low (${low}) > high (${high}). Target ${target} not in array.` });
  return steps;
}

function BinarySearchViz() {
  const DEFAULT_ARR = '3, 7, 12, 18, 24, 31, 45, 56, 67, 82';
  const DEFAULT_TGT = '31';
  const [arrStr, setArrStr] = useState(DEFAULT_ARR);
  const [tgtStr, setTgtStr] = useState(DEFAULT_TGT);
  const arr    = parseArr(arrStr).sort((a, b) => a - b);
  const target = parseInt(tgtStr, 10) || 31;
  const steps  = genBinarySteps(arr, target);
  const player = useStepPlayer(steps);
  const step   = steps[player.index] || steps[0];

  function cellClass(i) {
    if (step.status === 'found'     && i === step.mid)  return styles.cellFound;
    if (step.status === 'not_found') return (i >= step.low && i <= step.high) ? styles.cellNormal : styles.cellExclude;
    if (i === step.mid)   return styles.cellCompare;
    if (i < step.low || i > step.high) return styles.cellExclude;
    return styles.cellNormal;
  }

  const ptrs = [];
  if (step.low  >= 0 && step.low  < arr.length) ptrs.push({ index: step.low,  label: 'LOW',  cls: styles.pLow  });
  if (step.high >= 0 && step.high < arr.length) ptrs.push({ index: step.high, label: 'HIGH', cls: styles.pHigh });
  if (step.mid  >= 0)                           ptrs.push({ index: step.mid,  label: 'MID',  cls: styles.pMid  });

  const [newArr, setNewArr] = useState(arrStr);
  function applyInput() { setArrStr(newArr); player.reset(); }

  return (
    <VizContainer title="⚡ Binary Search — Interactive Tracer">
      <div className={styles.inputRow}>
        <ArrayInput label="Sorted Array (comma-separated)" value={newArr} onChange={setNewArr} hint="3,7,12,18,24,31…" />
        <div className={styles.inputGroup}>
          <span className={styles.inputLabel}>Target</span>
          <input className={`${styles.inputField} ${styles.targetField}`} value={tgtStr}
            onChange={e => setTgtStr(e.target.value)} />
        </div>
        <button className={styles.applyBtn} onClick={applyInput}>Apply</button>
      </div>
      <div className={styles.vizArea}>
        <div>
          <div className={styles.arrayRow}>
            {arr.map((v, i) => <Cell key={i} value={v} index={i} colorClass={cellClass(i)} />)}
          </div>
          <PointerRow length={arr.length} pointers={ptrs} />
        </div>
      </div>
      <Vars vars={[['low', step.low], ['high', Math.max(step.high, 0)], ['mid', step.mid >= 0 ? step.mid : '—'], ['target', target]]} />
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LINEAR SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
function genLinearSteps(arr, target) {
  const steps = [];
  steps.push({ curr: -1, status: 'init', message: `Linear scan from left to right. Looking for target = ${target}.` });
  for (let i = 0; i < arr.length; i++) {
    steps.push({ curr: i, status: 'compare', message: `Check arr[${i}] = ${arr[i]}  ${arr[i] === target ? '== target ✓' : '≠ target, keep going'}` });
    if (arr[i] === target) {
      steps.push({ curr: i, status: 'found', message: `✓ Found ${target} at index ${i}!` });
      return steps;
    }
  }
  steps.push({ curr: arr.length, status: 'not_found', message: `Scanned entire array. ${target} not found. O(n) worst case.` });
  return steps;
}

function LinearSearchViz() {
  const [arrStr, setArrStr] = useState('9, 3, 7, 1, 5, 12, 4, 8');
  const [tgtStr, setTgtStr] = useState('12');
  const arr    = parseArr(arrStr);
  const target = parseInt(tgtStr, 10) || 12;
  const steps  = genLinearSteps(arr, target);
  const player = useStepPlayer(steps);
  const step   = steps[player.index] || steps[0];
  const [newArr, setNewArr] = useState(arrStr);

  function cellClass(i) {
    if (i === step.curr && step.status === 'found')    return styles.cellFound;
    if (i === step.curr && step.status === 'compare')  return styles.cellCompare;
    if (i < step.curr)  return styles.cellExclude;
    return styles.cellNormal;
  }

  return (
    <VizContainer title="🔎 Linear Search — Interactive Tracer">
      <div className={styles.inputRow}>
        <ArrayInput label="Array" value={newArr} onChange={setNewArr} hint="9,3,7,1,5…" />
        <div className={styles.inputGroup}>
          <span className={styles.inputLabel}>Target</span>
          <input className={`${styles.inputField} ${styles.targetField}`} value={tgtStr} onChange={e => setTgtStr(e.target.value)} />
        </div>
        <button className={styles.applyBtn} onClick={() => { setArrStr(newArr); player.reset(); }}>Apply</button>
      </div>
      <div className={styles.vizArea}>
        <div>
          <div className={styles.arrayRow}>
            {arr.map((v, i) => <Cell key={i} value={v} index={i} colorClass={cellClass(i)} />)}
          </div>
          <PointerRow length={arr.length}
            pointers={step.curr >= 0 && step.curr < arr.length ? [{ index: step.curr, label: 'i', cls: styles.pCurr }] : []} />
        </div>
      </div>
      <Vars vars={[['i', step.curr >= 0 ? step.curr : '—'], ['arr[i]', step.curr >= 0 && step.curr < arr.length ? arr[step.curr] : '—'], ['target', target]]} />
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TWO POINTER
// ═══════════════════════════════════════════════════════════════════════════════
function genTwoPointerSteps(arr, target) {
  const sorted = [...arr].sort((a, b) => a - b);
  const steps = [];
  let left = 0, right = sorted.length - 1;
  steps.push({ left, right, sum: null, status: 'init', message: `Sort array first. Set left=0, right=${right}. Find pair summing to ${target}.` });
  while (left < right) {
    const sum = sorted[left] + sorted[right];
    steps.push({ left, right, sum, status: 'compare', message: `sorted[${left}] + sorted[${right}] = ${sorted[left]} + ${sorted[right]} = ${sum}` });
    if (sum === target) {
      steps.push({ left, right, sum, status: 'found', message: `✓ Sum = ${sum} = target! Pair found: (${sorted[left]}, ${sorted[right]}) at indices (${left}, ${right})` });
      return steps;
    } else if (sum < target) {
      steps.push({ left: left + 1, right, sum, status: 'move_left', message: `Sum ${sum} < target ${target} → need bigger value → move LEFT pointer right` });
      left++;
    } else {
      steps.push({ left, right: right - 1, sum, status: 'move_right', message: `Sum ${sum} > target ${target} → need smaller value → move RIGHT pointer left` });
      right--;
    }
  }
  steps.push({ left, right, sum: null, status: 'not_found', message: `Pointers crossed. No pair sums to ${target}.` });
  return steps;
}

function TwoPointerViz() {
  const [arrStr, setArrStr] = useState('1, 4, 6, 8, 11, 15');
  const [tgtStr, setTgtStr] = useState('15');
  const arr    = parseArr(arrStr).sort((a, b) => a - b);
  const target = parseInt(tgtStr, 10) || 15;
  const steps  = genTwoPointerSteps(arr, target);
  const player = useStepPlayer(steps);
  const step   = steps[player.index] || steps[0];
  const [newArr, setNewArr] = useState(arrStr);

  function cellClass(i) {
    if (step.status === 'found' && (i === step.left || i === step.right)) return styles.cellFound;
    if (i === step.left)  return styles.cellActive;
    if (i === step.right) return styles.cellCompare;
    if (i < step.left || i > step.right) return styles.cellExclude;
    return styles.cellNormal;
  }

  const ptrs = [];
  if (step.left  < arr.length) ptrs.push({ index: step.left,  label: 'L', cls: styles.pLeft  });
  if (step.right >= 0)         ptrs.push({ index: step.right, label: 'R', cls: styles.pRight });

  return (
    <VizContainer title="👆 Two Pointers — Pair Sum Tracer">
      <div className={styles.inputRow}>
        <ArrayInput label="Array (will be sorted)" value={newArr} onChange={setNewArr} hint="1,4,6,8,11,15…" />
        <div className={styles.inputGroup}>
          <span className={styles.inputLabel}>Target Sum</span>
          <input className={`${styles.inputField} ${styles.targetField}`} value={tgtStr} onChange={e => setTgtStr(e.target.value)} />
        </div>
        <button className={styles.applyBtn} onClick={() => { setArrStr(newArr); player.reset(); }}>Apply</button>
      </div>
      <div className={styles.vizArea}>
        <div>
          <div className={styles.arrayRow}>
            {arr.map((v, i) => <Cell key={i} value={v} index={i} colorClass={cellClass(i)} />)}
          </div>
          <PointerRow length={arr.length} pointers={ptrs} />
        </div>
      </div>
      <Vars vars={[
        ['left', step.left], ['right', step.right],
        ['arr[L]+arr[R]', step.sum !== null ? step.sum : '—'],
        ['target', target],
      ]} />
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDING WINDOW (max sum of k elements)
// ═══════════════════════════════════════════════════════════════════════════════
function genSlidingSteps(arr, k) {
  const steps = [];
  if (arr.length < k) return [{ start: 0, end: 0, windowSum: 0, maxSum: 0, maxStart: 0, status: 'error', message: 'k is larger than array length.' }];
  let windowSum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let maxSum = windowSum, maxStart = 0;
  steps.push({ start: 0, end: k - 1, windowSum, maxSum, maxStart, status: 'init', message: `Build initial window [0..${k-1}]. Sum = ${windowSum}` });
  for (let i = k; i < arr.length; i++) {
    const added = arr[i], removed = arr[i - k];
    windowSum = windowSum + added - removed;
    const isNewMax = windowSum > maxSum;
    if (isNewMax) { maxSum = windowSum; maxStart = i - k + 1; }
    steps.push({
      start: i - k + 1, end: i, windowSum, maxSum, maxStart,
      status: isNewMax ? 'new_max' : 'slide',
      message: `Slide: add arr[${i}]=${added}, remove arr[${i-k}]=${removed}. Window sum = ${windowSum}${isNewMax ? ' ← NEW MAX!' : ''}`,
    });
  }
  steps.push({ start: maxStart, end: maxStart + k - 1, windowSum: maxSum, maxSum, maxStart, status: 'done', message: `Done! Max sum = ${maxSum} in window [${maxStart}..${maxStart + k - 1}]` });
  return steps;
}

function SlidingWindowViz() {
  const [arrStr, setArrStr] = useState('2, 1, 5, 1, 3, 2, 4, 1');
  const [kStr,   setKStr]   = useState('3');
  const arr  = parseArr(arrStr);
  const k    = Math.max(1, Math.min(parseInt(kStr, 10) || 3, arr.length));
  const steps  = genSlidingSteps(arr, k);
  const player = useStepPlayer(steps);
  const step   = steps[player.index] || steps[0];
  const [newArr, setNewArr] = useState(arrStr);

  function cellClass(i) {
    if (i >= step.start && i <= step.end) {
      if (step.status === 'done' || step.status === 'new_max') return styles.cellFound;
      return styles.cellWindow;
    }
    return styles.cellNormal;
  }

  return (
    <VizContainer title="🪟 Sliding Window — Max Sum of K Elements">
      <div className={styles.inputRow}>
        <ArrayInput label="Array" value={newArr} onChange={setNewArr} hint="2,1,5,1,3,2…" />
        <div className={styles.inputGroup}>
          <span className={styles.inputLabel}>Window Size (k)</span>
          <input className={`${styles.inputField} ${styles.targetField}`} value={kStr} onChange={e => setKStr(e.target.value)} />
        </div>
        <button className={styles.applyBtn} onClick={() => { setArrStr(newArr); player.reset(); }}>Apply</button>
      </div>
      <div className={styles.vizArea}>
        <div>
          <div className={styles.arrayRow}>
            {arr.map((v, i) => <Cell key={i} value={v} index={i} colorClass={cellClass(i)} />)}
          </div>
          <PointerRow length={arr.length} pointers={[
            { index: step.start, label: 'start', cls: styles.pWindow },
            { index: step.end,   label: 'end',   cls: styles.pWindow },
          ]} />
        </div>
      </div>
      <Vars vars={[['windowSum', step.windowSum], ['maxSum', step.maxSum], ['window', `[${step.start}..${step.end}]`]]} />
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUBBLE SORT
// ═══════════════════════════════════════════════════════════════════════════════
function genBubbleSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  steps.push({ arr: [...a], j: -1, j2: -1, sortedFrom: n, status: 'init', message: 'Bubble Sort: repeatedly swap adjacent elements if out of order. Largest bubbles to end each pass.' });
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({ arr: [...a], j, j2: j + 1, sortedFrom: n - i, status: 'compare', message: `Pass ${i+1}: Compare arr[${j}]=${a[j]} and arr[${j+1}]=${a[j+1]}` });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ arr: [...a], j, j2: j + 1, sortedFrom: n - i, status: 'swap', message: `Swap! ${a[j+1]} > ${a[j]} → now [${a[j]}, ${a[j+1]}]` });
      }
    }
    steps.push({ arr: [...a], j: -1, j2: -1, sortedFrom: n - 1 - i, status: 'pass_done', message: `Pass ${i+1} done. Element ${a[n - 1 - i]} is now in its final position.` });
  }
  steps.push({ arr: [...a], j: -1, j2: -1, sortedFrom: 0, status: 'done', message: '✓ Array fully sorted!' });
  return steps;
}

function BarChartViz({ step }) {
  const { arr, j, j2, sortedFrom, status } = step;
  const max = Math.max(...arr, 1);
  return (
    <div className={styles.barChart}>
      {arr.map((v, i) => {
        let cls = styles.barNormal;
        if (i >= sortedFrom)                      cls = styles.barSorted;
        else if (status === 'swap' && (i === j || i === j2))    cls = styles.barSwap;
        else if (status === 'compare' && (i === j || i === j2)) cls = styles.barCompare;
        return (
          <div key={i} className={`${styles.bar} ${cls}`}
            style={{ height: `${Math.max(8, (v / max) * 110)}px` }}>
            <span className={styles.barLabel}>{v}</span>
          </div>
        );
      })}
    </div>
  );
}

function BubbleSortViz() {
  const [arrStr, setArrStr] = useState('64, 34, 25, 12, 22, 11, 90');
  const arr    = parseArr(arrStr, 12);
  const steps  = genBubbleSteps(arr);
  const player = useStepPlayer(steps);
  const step   = steps[player.index] || steps[0];
  const [newArr, setNewArr] = useState(arrStr);

  return (
    <VizContainer title="📊 Bubble Sort — Bar Chart Tracer">
      <div className={styles.inputRow}>
        <ArrayInput label="Array (max 12 elements)" value={newArr} onChange={setNewArr} hint="64,34,25,12…" />
        <button className={styles.applyBtn} onClick={() => { setArrStr(newArr); player.reset(); }}>Apply</button>
      </div>
      <div className={styles.vizArea}><BarChartViz step={step} /></div>
      <div className={styles.barLegend}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(251,191,36,.5)'}}/>Comparing</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(248,113,113,.5)'}}/>Swapping</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(74,222,128,.3)'}}/>Sorted</span>
      </div>
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSERTION SORT
// ═══════════════════════════════════════════════════════════════════════════════
function genInsertionSteps(arr) {
  const steps = [];
  const a = [...arr];
  steps.push({ arr: [...a], i: -1, insertAt: -1, key: null, sortedEnd: 0, status: 'init', message: 'Insertion Sort: build sorted portion left-to-right, inserting each element in its correct position.' });
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    steps.push({ arr: [...a], i, insertAt: i, key, sortedEnd: i, status: 'pick', message: `Pick key = arr[${i}] = ${key}. Compare backwards through sorted portion [0..${i-1}].` });
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      steps.push({ arr: [...a], i, insertAt: j, key, sortedEnd: i, status: 'shift', message: `arr[${j}]=${a[j]} > key=${key} → shift arr[${j}] right to position ${j+1}` });
      j--;
    }
    a[j + 1] = key;
    steps.push({ arr: [...a], i, insertAt: j + 1, key, sortedEnd: i, status: 'insert', message: `Insert key=${key} at index ${j+1}. Sorted portion is now [0..${i}].` });
  }
  steps.push({ arr: [...a], i: -1, insertAt: -1, key: null, sortedEnd: a.length, status: 'done', message: '✓ Array fully sorted!' });
  return steps;
}

function InsertionSortViz() {
  const [arrStr, setArrStr] = useState('12, 11, 13, 5, 6');
  const arr    = parseArr(arrStr, 10);
  const steps  = genInsertionSteps(arr);
  const player = useStepPlayer(steps);
  const step   = steps[player.index] || steps[0];
  const [newArr, setNewArr] = useState(arrStr);

  function cellClass(i) {
    if (step.status === 'done') return styles.cellFound;
    if (i === step.insertAt && step.status === 'insert') return styles.cellFound;
    if (i === step.i && step.status === 'pick')     return styles.cellCompare;
    if (i < step.sortedEnd)  return styles.cellActive;
    return styles.cellNormal;
  }

  const ptrs = [];
  if (step.i > 0) ptrs.push({ index: step.i, label: 'i', cls: styles.pCurr });
  if (step.insertAt >= 0 && step.status === 'insert') ptrs.push({ index: step.insertAt, label: 'ins', cls: styles.pKey });

  return (
    <VizContainer title="📥 Insertion Sort — Tracer">
      <div className={styles.inputRow}>
        <ArrayInput label="Array" value={newArr} onChange={setNewArr} hint="12,11,13,5,6…" />
        <button className={styles.applyBtn} onClick={() => { setArrStr(newArr); player.reset(); }}>Apply</button>
      </div>
      <div className={styles.vizArea}>
        <div>
          <div className={styles.arrayRow}>
            {step.arr.map((v, i) => <Cell key={i} value={v} index={i} colorClass={cellClass(i)} />)}
          </div>
          <PointerRow length={step.arr.length} pointers={ptrs} />
        </div>
      </div>
      <Vars vars={[['i', step.i >= 0 ? step.i : '—'], ['key', step.key !== null ? step.key : '—'], ['sorted', `[0..${step.sortedEnd > 0 ? step.sortedEnd - 1 : 0}]`]]} />
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK SORT
// ═══════════════════════════════════════════════════════════════════════════════
function genQuickSteps(arr) {
  const steps = [];
  const a = [...arr];

  function partition(low, high) {
    const pivot = a[high];
    let i = low - 1;
    steps.push({ arr: [...a], low, high, pivot: high, i, j: low, status: 'choose_pivot', message: `Partition [${low}..${high}]. Pivot = arr[${high}] = ${pivot}. i starts at ${low - 1}.` });
    for (let j = low; j < high; j++) {
      steps.push({ arr: [...a], low, high, pivot: high, i, j, status: 'compare', message: `Compare arr[${j}]=${a[j]} with pivot=${pivot}` });
      if (a[j] <= pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          steps.push({ arr: [...a], low, high, pivot: high, i, j, status: 'swap', message: `arr[${j}]=${a[j]} ≤ pivot. Swap arr[${i}]↔arr[${j}]` });
        } else {
          steps.push({ arr: [...a], low, high, pivot: high, i, j, status: 'move_i', message: `arr[${j}]=${a[j]} ≤ pivot. Increment i to ${i}.` });
        }
      }
    }
    [a[i + 1], a[high]] = [a[high], a[i + 1]];
    steps.push({ arr: [...a], low, high, pivot: i + 1, i: i + 1, j: -1, status: 'place_pivot', message: `Place pivot ${pivot} at index ${i + 1}. Left side ≤ ${pivot} ≤ right side.` });
    return i + 1;
  }

  function quickSort(low, high) {
    if (low >= high) return;
    const pi = partition(low, high);
    quickSort(low, pi - 1);
    quickSort(pi + 1, high);
  }

  steps.push({ arr: [...a], low: 0, high: a.length - 1, pivot: -1, i: -1, j: -1, status: 'init', message: 'Quick Sort: choose pivot, partition array around it, recurse on sub-arrays.' });
  quickSort(0, a.length - 1);
  steps.push({ arr: [...a], low: -1, high: -1, pivot: -1, i: -1, j: -1, status: 'done', message: '✓ Array fully sorted!' });
  return steps;
}

function QuickSortViz() {
  const [arrStr, setArrStr] = useState('10, 7, 8, 9, 1, 5');
  const arr    = parseArr(arrStr, 10);
  const steps  = genQuickSteps(arr);
  const player = useStepPlayer(steps);
  const step   = steps[player.index] || steps[0];
  const [newArr, setNewArr] = useState(arrStr);

  function cellClass(ci) {
    if (step.status === 'done') return styles.cellFound;
    if (ci === step.pivot && step.status !== 'compare') return styles.cellPivot;
    if (ci === step.j)   return styles.cellCompare;
    if (ci === step.i)   return styles.cellActive;
    if (ci < step.low || ci > step.high) return styles.cellExclude;
    return styles.cellNormal;
  }

  const max = Math.max(...step.arr, 1);
  return (
    <VizContainer title="⚡ Quick Sort — Partition Tracer">
      <div className={styles.inputRow}>
        <ArrayInput label="Array (max 10)" value={newArr} onChange={setNewArr} hint="10,7,8,9,1,5…" />
        <button className={styles.applyBtn} onClick={() => { setArrStr(newArr); player.reset(); }}>Apply</button>
      </div>
      <div className={styles.vizArea}>
        <div>
          <div className={styles.arrayRow}>
            {step.arr.map((v, i) => <Cell key={i} value={v} index={i} colorClass={cellClass(i)} />)}
          </div>
          <PointerRow length={step.arr.length} pointers={[
            ...(step.j >= 0 && step.j < step.arr.length ? [{ index: step.j, label: 'j', cls: styles.pCurr }] : []),
            ...(step.i >= 0 && step.i < step.arr.length ? [{ index: step.i, label: 'i', cls: styles.pLeft  }] : []),
            ...(step.pivot >= 0 ? [{ index: step.pivot, label: 'pivot', cls: styles.pPivot }] : []),
          ]} />
        </div>
      </div>
      <div className={styles.barLegend}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(251,146,60,.5)'}}/>Pivot</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(99,102,241,.2)'}}/>i (boundary)</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(251,191,36,.18)'}}/>j (scanner)</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(30,37,53,.5)'}}/>Out of range</span>
      </div>
      <Vars vars={[
        ['range', `[${step.low >= 0 ? step.low : '?'}..${step.high >= 0 ? step.high : '?'}]`],
        ['pivot', step.pivot >= 0 && step.arr ? step.arr[step.pivot] : '—'],
        ['i', step.i >= 0 ? step.i : '—'],
        ['j', step.j >= 0 ? step.j : '—'],
      ]} />
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MERGE SORT (show array state at each merge)
// ═══════════════════════════════════════════════════════════════════════════════
function genMergeSteps(arr) {
  const steps = [];
  const a = [...arr];

  function merge(arr2, left, mid, right) {
    const L = arr2.slice(left, mid + 1);
    const R = arr2.slice(mid + 1, right + 1);
    steps.push({ arr: [...arr2], left, mid, right, li: 0, ri: 0, status: 'merge_start', message: `Merge [${left}..${mid}] = [${L}] and [${mid+1}..${right}] = [${R}]` });
    let i = 0, j = 0, k = left;
    while (i < L.length && j < R.length) {
      if (L[i] <= R[j]) { arr2[k++] = L[i++]; }
      else               { arr2[k++] = R[j++]; }
      steps.push({ arr: [...arr2], left, mid, right, k: k - 1, status: 'merge_elem', message: `Placed ${arr2[k-1]} at index ${k-1}. Built: [${arr2.slice(left, k)}]` });
    }
    while (i < L.length) { arr2[k++] = L[i++]; }
    while (j < R.length) { arr2[k++] = R[j++]; }
    steps.push({ arr: [...arr2], left, mid, right, status: 'merge_done', message: `Merged segment [${left}..${right}] = [${arr2.slice(left, right+1)}]` });
  }

  function mergeSort(arr2, left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    steps.push({ arr: [...arr2], left, mid, right, status: 'split', message: `Split [${left}..${right}] → [${left}..${mid}] and [${mid+1}..${right}]` });
    mergeSort(arr2, left, mid);
    mergeSort(arr2, mid + 1, right);
    merge(arr2, left, mid, right);
  }

  steps.push({ arr: [...a], left: 0, right: a.length - 1, status: 'init', message: 'Merge Sort: recursively split array in half, then merge sorted halves. O(n log n) guaranteed.' });
  mergeSort(a, 0, a.length - 1);
  steps.push({ arr: [...a], left: -1, right: -1, status: 'done', message: '✓ Array fully sorted!' });
  return steps;
}

function MergeSortViz() {
  const [arrStr, setArrStr] = useState('38, 27, 43, 3, 9, 82, 10');
  const arr    = parseArr(arrStr, 10);
  const steps  = genMergeSteps(arr);
  const player = useStepPlayer(steps);
  const step   = steps[player.index] || steps[0];
  const [newArr, setNewArr] = useState(arrStr);

  function cellClass(i) {
    if (step.status === 'done') return styles.cellFound;
    if (i >= step.left && i <= step.right) {
      if (step.status === 'merge_done') return styles.cellFound;
      if (step.status === 'split')      return styles.cellWindow;
      if (i === step.k)                 return styles.cellCompare;
      return styles.cellActive;
    }
    return styles.cellNormal;
  }

  return (
    <VizContainer title="🔀 Merge Sort — Split & Merge Tracer">
      <div className={styles.inputRow}>
        <ArrayInput label="Array (max 10)" value={newArr} onChange={setNewArr} hint="38,27,43,3,9…" />
        <button className={styles.applyBtn} onClick={() => { setArrStr(newArr); player.reset(); }}>Apply</button>
      </div>
      <div className={styles.vizArea}>
        <div>
          <div className={styles.arrayRow}>
            {step.arr.map((v, i) => <Cell key={i} value={v} index={i} colorClass={cellClass(i)} />)}
          </div>
          <PointerRow length={step.arr.length} pointers={[
            ...(step.left >= 0  ? [{ index: step.left,  label: 'L', cls: styles.pLeft  }] : []),
            ...(step.right >= 0 ? [{ index: step.right, label: 'R', cls: styles.pRight }] : []),
          ]} />
        </div>
      </div>
      <div className={styles.barLegend}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(139,92,246,.15)'}}/>Splitting</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(99,102,241,.2)'}}/>Merging</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'rgba(74,222,128,.18)'}}/>Merged</span>
      </div>
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BFS — Grid-based maze traversal
// ═══════════════════════════════════════════════════════════════════════════════
const BFS_GRID = [
  [0,0,0,0,0],
  [1,1,0,1,0],
  [0,0,0,1,0],
  [0,1,1,1,0],
  [0,0,0,0,0],
];
const ROWS = BFS_GRID.length, COLS = BFS_GRID[0].length;

function genBFSSteps() {
  const steps = [];
  const grid  = BFS_GRID.map(r => [...r]);
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const level   = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  const queue = [[0, 0]];
  visited[0][0] = true;
  level[0][0] = 0;
  steps.push({ visited: visited.map(r=>[...r]), level: level.map(r=>[...r]), curr: null, status: 'init', message: 'BFS: explore level by level from (0,0). Each wave = distance from source.' });

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    steps.push({ visited: visited.map(x=>[...x]), level: level.map(x=>[...x]), curr: [r,c], status: r===4&&c===4?'found':'visit', message: `Visit (${r},${c}) — level ${level[r][c]}${r===4&&c===4?' ← GOAL REACHED!':''}` });
    if (r === 4 && c === 4) break;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc] && grid[nr][nc] === 0) {
        visited[nr][nc] = true;
        level[nr][nc] = level[r][c] + 1;
        queue.push([nr, nc]);
        steps.push({ visited: visited.map(x=>[...x]), level: level.map(x=>[...x]), curr: [nr,nc], status: 'enqueue', message: `Enqueue (${nr},${nc}) — level ${level[nr][nc]}` });
      }
    }
  }
  return steps;
}

const BFS_STEPS = genBFSSteps();
const LEVEL_COLORS = ['#6366f1','#8b5cf6','#3b82f6','#06b6d4','#10b981','#84cc16','#f59e0b','#ef4444'];

function BFSViz() {
  const player = useStepPlayer(BFS_STEPS);
  const step   = BFS_STEPS[player.index] || BFS_STEPS[0];

  function cellStyle(r, c) {
    if (BFS_GRID[r][c] === 1) return { background: '#374151', border: '1px solid #4b5563' };
    if (r === 0 && c === 0)   return { background: 'rgba(99,102,241,.4)', border: '2px solid #818cf8', color: '#fff', fontWeight: 700 };
    if (r === 4 && c === 4)   return { background: 'rgba(74,222,128,.3)', border: '2px solid #4ade80', color: '#fff', fontWeight: 700 };
    if (step.visited[r][c]) {
      const lv = step.level[r][c];
      const col = LEVEL_COLORS[lv % LEVEL_COLORS.length];
      return { background: `${col}26`, border: `2px solid ${col}88`, color: col };
    }
    return { background: 'var(--bg4)', border: '1px solid var(--border2)' };
  }

  function cellLabel(r, c) {
    if (r === 0 && c === 0) return 'S';
    if (r === 4 && c === 4) return 'E';
    if (BFS_GRID[r][c] === 1) return '▓';
    const lv = step.level[r][c];
    return lv >= 0 ? lv : '';
  }

  return (
    <VizContainer title="🌊 BFS — Level-Order Grid Traversal">
      <div className={styles.vizArea}>
        <div>
          <div className={styles.gridLabel}>S = Start (0,0)  ·  E = Goal (4,4)  ·  ▓ = Wall  ·  Numbers = BFS level</div>
          <div className={styles.bfsGrid}>
            {Array.from({ length: ROWS }, (_, r) => (
              <div key={r} className={styles.bfsRow}>
                {Array.from({ length: COLS }, (_, c) => (
                  <div key={c} className={styles.bfsCell} style={cellStyle(r, c)}>
                    {cellLabel(r, c)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Vars vars={step.curr ? [['current', `(${step.curr[0]},${step.curr[1]})`], ['level', step.curr ? step.level[step.curr[0]][step.curr[1]] : '—']] : [['status', 'initializing']]} />
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DFS — Grid-based maze traversal
// ═══════════════════════════════════════════════════════════════════════════════
function genDFSSteps() {
  const steps = [];
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const path    = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  let found = false;

  function dfs(r, c, depth) {
    if (found || r < 0 || r >= ROWS || c < 0 || c >= COLS || BFS_GRID[r][c] === 1 || visited[r][c]) return false;
    visited[r][c] = true;
    path[r][c] = true;
    steps.push({ visited: visited.map(x=>[...x]), path: path.map(x=>[...x]), curr: [r,c], depth, status: r===4&&c===4?'found':'visit', message: `DFS visit (${r},${c}) depth=${depth}${r===4&&c===4?' ← GOAL REACHED!':''}` });
    if (r === 4 && c === 4) { found = true; return true; }
    for (const [dr,dc] of dirs) {
      if (dfs(r + dr, c + dc, depth + 1)) return true;
    }
    path[r][c] = false;
    steps.push({ visited: visited.map(x=>[...x]), path: path.map(x=>[...x]), curr: [r,c], depth, status: 'backtrack', message: `Backtrack from (${r},${c}) — no path found this way` });
    return false;
  }

  steps.push({ visited: Array.from({length:ROWS},()=>Array(COLS).fill(false)), path: Array.from({length:ROWS},()=>Array(COLS).fill(false)), curr: null, depth: 0, status: 'init', message: 'DFS: go as deep as possible down one path, backtrack when stuck.' });
  dfs(0, 0, 0);
  return steps;
}

const DFS_STEPS = genDFSSteps();

function DFSViz() {
  const player = useStepPlayer(DFS_STEPS);
  const step   = DFS_STEPS[player.index] || DFS_STEPS[0];

  function cellStyle(r, c) {
    if (BFS_GRID[r][c] === 1) return { background: '#374151', border: '1px solid #4b5563' };
    if (r === 0 && c === 0)   return { background: 'rgba(99,102,241,.4)', border: '2px solid #818cf8', color: '#fff', fontWeight: 700 };
    if (r === 4 && c === 4)   return { background: 'rgba(74,222,128,.3)', border: '2px solid #4ade80', color: '#fff', fontWeight: 700 };
    if (step.curr && step.curr[0] === r && step.curr[1] === c) return { background: 'rgba(251,191,36,.3)', border: '2px solid #fbbf24', color: '#fbbf24' };
    if (step.path[r][c])    return { background: 'rgba(139,92,246,.25)', border: '2px solid #8b5cf6', color: '#a78bfa' };
    if (step.visited[r][c]) return { background: 'rgba(100,100,100,.12)', border: '1px solid var(--border2)', color: 'var(--text3)' };
    return { background: 'var(--bg4)', border: '1px solid var(--border2)' };
  }

  function cellLabel(r, c) {
    if (r === 0 && c === 0) return 'S';
    if (r === 4 && c === 4) return 'E';
    if (BFS_GRID[r][c] === 1) return '▓';
    return '';
  }

  return (
    <VizContainer title="🌲 DFS — Depth-First Grid Traversal">
      <div className={styles.vizArea}>
        <div>
          <div className={styles.gridLabel}>S = Start  ·  E = Goal  ·  ▓ = Wall  ·  Purple = current path  ·  Yellow = exploring</div>
          <div className={styles.bfsGrid}>
            {Array.from({ length: ROWS }, (_, r) => (
              <div key={r} className={styles.bfsRow}>
                {Array.from({ length: COLS }, (_, c) => (
                  <div key={c} className={styles.bfsCell} style={cellStyle(r, c)}>{cellLabel(r, c)}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Vars vars={step.curr ? [['current', `(${step.curr[0]},${step.curr[1]})`], ['depth', step.depth]] : [['status', 'initializing']]} />
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIBONACCI DP (bottom-up tabulation)
// ═══════════════════════════════════════════════════════════════════════════════
function genFibSteps(n) {
  const steps = [];
  const dp = Array(n + 1).fill(null);
  dp[0] = 0; dp[1] = 1;
  steps.push({ dp: [...dp], curr: 1, status: 'init', message: `Base cases: dp[0]=0, dp[1]=1. Fill table up to dp[${n}].` });
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
    steps.push({ dp: [...dp], curr: i, status: 'fill', message: `dp[${i}] = dp[${i-1}] + dp[${i-2}] = ${dp[i-1]} + ${dp[i-2]} = ${dp[i]}` });
  }
  steps.push({ dp: [...dp], curr: n, status: 'done', message: `✓ fib(${n}) = ${dp[n]}. All values cached — no recomputation.` });
  return steps;
}

function FibonacciViz() {
  const [nStr, setNStr] = useState('10');
  const n = Math.min(Math.max(parseInt(nStr, 10) || 10, 2), 15);
  const steps  = genFibSteps(n);
  const player = useStepPlayer(steps);
  const step   = steps[player.index] || steps[0];

  return (
    <VizContainer title="🧩 Dynamic Programming — Fibonacci Tabulation">
      <div className={styles.inputRow}>
        <div className={styles.inputGroup}>
          <span className={styles.inputLabel}>Compute fib(n) — n max 15</span>
          <input className={`${styles.inputField} ${styles.targetField}`} value={nStr}
            onChange={e => { setNStr(e.target.value); player.reset(); }} />
        </div>
      </div>
      <div className={styles.vizArea}>
        <div className={styles.dpWrap}>
          <div className={styles.dpIndexRow}>
            {step.dp.map((_, i) => (
              <div key={i} className={styles.dpIndex}>n={i}</div>
            ))}
          </div>
          <div className={styles.dpValueRow}>
            {step.dp.map((v, i) => {
              let cls = styles.dpCellEmpty;
              if (v !== null && i < step.curr)  cls = styles.dpCellFilled;
              if (i === step.curr)               cls = styles.dpCellCurrent;
              if (step.status === 'done')        cls = styles.dpCellFilled;
              return (
                <div key={i} className={`${styles.dpCell} ${cls}`}>{v !== null ? v : ''}</div>
              );
            })}
          </div>
          {step.curr >= 2 && step.status !== 'done' && (
            <div className={styles.dpArrowRow}>
              {step.dp.map((_, i) => (
                <div key={i} className={styles.dpArrowCell}>
                  {(i === step.curr - 1 || i === step.curr - 2) && <span className={styles.dpArrow}>↑</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Vars vars={[
        ['dp[' + step.curr + ']', step.dp[step.curr] !== null ? step.dp[step.curr] : '?'],
        ...(step.curr >= 2 ? [['dp[' + (step.curr-1) + ']', step.dp[step.curr-1]], ['dp[' + (step.curr-2) + ']', step.dp[step.curr-2]]] : []),
      ]} />
      <Message text={step.message} status={step.status} />
      <Controls player={player} />
    </VizContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════════
export default function AlgorithmVisualizer({ algoName }) {
  const key = (algoName || '').toLowerCase();
  if (key.includes('binary search'))                          return <BinarySearchViz />;
  if (key.includes('linear search'))                         return <LinearSearchViz />;
  if (key.includes('bubble'))                                return <BubbleSortViz />;
  if (key.includes('insertion'))                             return <InsertionSortViz />;
  if (key.includes('quick'))                                 return <QuickSortViz />;
  if (key.includes('merge'))                                 return <MergeSortViz />;
  if (key.includes('two pointer') || key.includes('two-pointer')) return <TwoPointerViz />;
  if (key.includes('sliding window'))                        return <SlidingWindowViz />;
  if (key.includes('bfs') || key.includes('breadth'))        return <BFSViz />;
  if (key.includes('dfs') || key.includes('depth'))          return <DFSViz />;
  if (key.includes('fibonacci') || key.includes('dynamic'))  return <FibonacciViz />;
  return null;
}
