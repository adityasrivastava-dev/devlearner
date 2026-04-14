function arrSnap(arr, over = {}, msg, phase, vars = {}) {
  return {
    type: 'array',
    elements: arr.map((v, i) => ({ value: v, state: over[i] || 'default' })),
    pointers: [],
    message: msg,
    variables: vars,
    phase,
  };
}

// ─── Activity Selection ───────────────────────────────────────────────────────
export function generateActivitySelectionFrames(activities = [
  { start: 1, end: 4 }, { start: 3, end: 5 }, { start: 0, end: 6 },
  { start: 5, end: 7 }, { start: 3, end: 9 }, { start: 5, end: 9 },
  { start: 6, end: 10 }, { start: 8, end: 11 }, { start: 8, end: 12 }, { start: 2, end: 14 },
]) {
  const frames = [];
  const sorted = [...activities]
    .map((a, i) => ({ ...a, origIdx: i }))
    .sort((a, b) => a.end - b.end);

  const labels = sorted.map(a => `[${a.start},${a.end}]`);

  frames.push(arrSnap(labels, {}, `Activity Selection: greedily pick non-overlapping activities. Sort by end time, always pick earliest-ending compatible activity.`, 'Sort by End Time'));

  const selected = [];
  let lastEnd = -1;

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const over = {};
    for (let k = 0; k < i; k++) over[k] = selected.includes(k) ? 'sorted' : 'excluded';
    over[i] = 'comparing';

    frames.push(arrSnap(labels, over,
      `Activity ${i}: [${a.start},${a.end}]. Last selected ends at ${lastEnd}. Compatible? ${a.start >= lastEnd ? 'YES' : 'NO'}.`,
      `Check [${a.start},${a.end}]`,
      { activity: `[${a.start},${a.end}]`, lastEnd, compatible: a.start >= lastEnd }));

    if (a.start >= lastEnd) {
      selected.push(i);
      lastEnd = a.end;
      over[i] = 'found';

      frames.push(arrSnap(labels, over,
        `SELECT activity [${a.start},${a.end}]. It starts at ${a.start} ≥ lastEnd ${lastEnd - (a.end - lastEnd)}. Now lastEnd = ${lastEnd}.`,
        `✓ Select`,
        { selected: selected.map(k => labels[k]).join(', '), count: selected.length }));
    } else {
      over[i] = 'excluded';
      frames.push(arrSnap(labels, over,
        `SKIP activity [${a.start},${a.end}]. Starts at ${a.start} < lastEnd ${lastEnd}. Overlaps!`,
        `✗ Skip`,
        { skipped: `[${a.start},${a.end}]` }));
    }
  }

  const finalOver = Object.fromEntries(labels.map((_, i) => [i, selected.includes(i) ? 'sorted' : 'excluded']));
  frames.push(arrSnap(labels, finalOver,
    `Selected ${selected.length} activities: ${selected.map(i => labels[i]).join(', ')}`,
    'Done!',
    { selected: selected.length }));

  return frames;
}

// ─── Jump Game ────────────────────────────────────────────────────────────────
export function generateJumpGameFrames(nums = [2, 3, 1, 1, 4]) {
  const frames = [];
  const n = nums.length;
  let maxReach = 0;

  frames.push(arrSnap(nums, {}, `Jump Game: can you reach the last index? nums[i] = max jump from i. Track maxReach greedily.`, 'Initialize', { maxReach: 0 }));

  for (let i = 0; i < n; i++) {
    const over = {};
    for (let k = 0; k < i; k++) over[k] = 'sorted';
    over[i] = 'current';
    for (let k = i + 1; k <= Math.min(maxReach, n - 1); k++) over[k] = 'in-window';

    frames.push(arrSnap(nums, over, `i=${i}: nums[i]=${nums[i]}. Can reach here? ${i <= maxReach ? 'YES' : 'BLOCKED'}. maxReach = ${maxReach}.`, `i=${i}`, { i, 'nums[i]': nums[i], maxReach }));

    if (i > maxReach) {
      frames.push(arrSnap(nums, { ...over, [i]: 'excluded' },
        `BLOCKED at i=${i}. Cannot reach it (maxReach=${maxReach} < ${i}). Return FALSE.`,
        'Cannot Reach!',
        { result: false }));
      return frames;
    }

    if (i + nums[i] > maxReach) {
      maxReach = i + nums[i];
      const updOver = { ...over };
      for (let k = i; k <= Math.min(maxReach, n - 1); k++) updOver[k] = 'in-window';
      updOver[i] = 'found';

      frames.push(arrSnap(nums, updOver,
        `Update maxReach = i+nums[i] = ${i}+${nums[i]} = ${maxReach}. Can now reach up to index ${maxReach}.`,
        `Reach extended to ${maxReach}`,
        { newMaxReach: maxReach }));
    }

    if (maxReach >= n - 1) {
      const doneOver = {};
      for (let k = 0; k <= i; k++) doneOver[k] = 'sorted';
      for (let k = i + 1; k < n; k++) doneOver[k] = 'found';
      frames.push(arrSnap(nums, doneOver,
        `maxReach=${maxReach} ≥ last index ${n-1}. Can reach the end! Return TRUE.`,
        '✓ Can Reach!',
        { result: true }));
      return frames;
    }
  }

  frames.push(arrSnap(nums, Object.fromEntries(nums.map((_,i) => [i,'sorted'])),
    `Traversed all. maxReach=${maxReach} ≥ last index ${n-1}. TRUE.`,
    'Done!',
    { result: true }));
  return frames;
}

// ─── Gas Station ─────────────────────────────────────────────────────────────
export function generateGasStationFrames(gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]) {
  const frames = [];
  const n = gas.length;
  let totalGas = 0, tank = 0, start = 0;

  const net = gas.map((g, i) => g - cost[i]);
  frames.push(arrSnap(net, {}, `Gas Station: net[i]=gas[i]-cost[i]=[${net.join(',')}]. If totalSum≥0, solution exists. Find starting point.`, 'Net Gain', { net: `[${net.join(',')}]` }));

  for (let i = 0; i < n; i++) {
    totalGas += net[i];
    tank      += net[i];

    const over = {};
    for (let k = 0; k < start; k++) over[k] = 'excluded';
    for (let k = start; k <= i; k++) over[k] = 'in-window';
    over[i] = 'comparing';

    frames.push(arrSnap(net, over,
      `Station ${i}: net=${net[i]}. Tank = ${tank}. Start candidate = ${start}.`,
      `Station ${i}`,
      { station: i, net: net[i], tank, start, totalGas }));

    if (tank < 0) {
      frames.push(arrSnap(net, { ...over, [i]: 'excluded' },
        `Tank < 0 (${tank}). Cannot reach station ${i+1} from start=${start}. Reset start to ${i+1}.`,
        `Reset start → ${i+1}`,
        { oldStart: start, newStart: i + 1 }));
      start = i + 1;
      tank  = 0;
    }
  }

  const result = totalGas >= 0 ? start : -1;
  const finalOver = Object.fromEntries(net.map((_,i) => [i, i === result ? 'found' : totalGas < 0 ? 'excluded' : 'sorted']));

  frames.push(arrSnap(net, finalOver,
    result === -1
      ? `Total gas < total cost. No solution exists (-1).`
      : `Start at station ${result}. Total net gain = ${totalGas} ≥ 0.`,
    'Done!',
    { result, totalGas }));

  return frames;
}

// ─── Fractional Knapsack ──────────────────────────────────────────────────────
export function generateFractionalKnapsackFrames(items = [
  { w: 10, v: 60 }, { w: 20, v: 100 }, { w: 30, v: 120 },
], capacity = 50) {
  const frames = [];

  const sorted = items.map((item, i) => ({ ...item, ratio: item.v / item.w, origIdx: i }))
    .sort((a, b) => b.ratio - a.ratio);

  const ratioArr = sorted.map(it => parseFloat(it.ratio.toFixed(2)));
  frames.push(arrSnap(ratioArr, {}, `Fractional Knapsack: sort by value/weight ratio. Greedily take items with highest ratio first.`, 'Sort by Ratio', { capacity, items: items.map(it=>`w=${it.w},v=${it.v}`).join(' | ') }));

  let totalValue = 0, remaining = capacity;

  for (let i = 0; i < sorted.length; i++) {
    const { w, v, ratio } = sorted[i];
    const over = {};
    for (let k = 0; k < i; k++) over[k] = 'sorted';
    over[i] = 'comparing';

    frames.push(arrSnap(ratioArr, over,
      `Item ${i}: w=${w}, v=${v}, ratio=${ratio.toFixed(2)}. Remaining capacity=${remaining}.`,
      `Item ${i}`,
      { weight: w, value: v, ratio: ratio.toFixed(2), remaining }));

    if (w <= remaining) {
      remaining   -= w;
      totalValue  += v;
      over[i] = 'found';
      frames.push(arrSnap(ratioArr, over,
        `Take FULL item ${i} (w=${w}). Value += ${v}. Capacity left = ${remaining}. Total = ${totalValue.toFixed(2)}.`,
        `✓ Full item`,
        { totalValue: totalValue.toFixed(2), remaining }));
    } else {
      const fraction = remaining / w;
      totalValue += v * fraction;
      over[i] = 'in-window';
      frames.push(arrSnap(ratioArr, over,
        `Take ${(fraction * 100).toFixed(0)}% of item ${i}. Value += ${(v * fraction).toFixed(2)}. Capacity full.`,
        `✓ Fraction ${(fraction*100).toFixed(0)}%`,
        { fraction: (fraction * 100).toFixed(0) + '%', addedValue: (v * fraction).toFixed(2), totalValue: totalValue.toFixed(2) }));
      remaining = 0;
      break;
    }
    if (remaining === 0) break;
  }

  frames.push(arrSnap(ratioArr, Object.fromEntries(ratioArr.map((_,i) => [i,'sorted'])),
    `Fractional Knapsack complete. Max value = ${totalValue.toFixed(2)} for capacity ${capacity}.`,
    'Done!',
    { maxValue: totalValue.toFixed(2) }));

  return frames;
}
