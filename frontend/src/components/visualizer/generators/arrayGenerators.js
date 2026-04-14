// ─── Helpers ──────────────────────────────────────────────────────────────────
function snap(arr, overrides = {}, meta = {}) {
  return {
    type: 'array',
    elements: arr.map((value, i) => ({ value, state: overrides[i] || 'default' })),
    pointers: meta.pointers || [],
    message:  meta.message  || '',
    variables: meta.variables || {},
    phase:    meta.phase    || '',
  };
}

// ─── Binary Search ────────────────────────────────────────────────────────────
export function generateBinarySearchFrames(array, target) {
  const arr = [...array];
  const frames = [];

  let low = 0, high = arr.length - 1;

  frames.push(snap(arr, {}, {
    pointers: [
      { index: low,  label: 'low',  color: '#3b82f6' },
      { index: high, label: 'high', color: '#f43f5e' },
    ],
    message:   `Start: low=${low}, high=${high}, target=${target}`,
    variables: { low, high, target },
    phase:     'Initialize',
  }));

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    const overrides = {};
    for (let i = 0; i < arr.length; i++) {
      if (i < low || i > high) overrides[i] = 'excluded';
      else if (i === mid)       overrides[i] = 'comparing';
    }

    frames.push(snap(arr, overrides, {
      pointers: [
        { index: low, label: 'low',  color: '#3b82f6' },
        { index: high, label: 'high', color: '#f43f5e' },
        { index: mid, label: 'mid',  color: '#a855f7' },
      ],
      message:   `mid = ⌊(${low}+${high})/2⌋ = ${mid}  →  arr[${mid}] = ${arr[mid]}`,
      variables: { low, high, mid, target, 'arr[mid]': arr[mid] },
      phase:     'Compute Mid',
    }));

    if (arr[mid] === target) {
      const found = {};
      for (let i = 0; i < arr.length; i++) found[i] = i === mid ? 'found' : 'excluded';
      frames.push(snap(arr, found, {
        pointers: [{ index: mid, label: '✓ found', color: '#10b981' }],
        message:   `arr[${mid}] = ${arr[mid]} equals target ${target}. Found at index ${mid}!`,
        variables: { result: mid },
        phase:     'Found!',
      }));
      return frames;
    } else if (arr[mid] < target) {
      const elim = {};
      for (let i = 0; i <= mid; i++) elim[i] = 'excluded';
      frames.push(snap(arr, elim, {
        pointers: [
          { index: mid + 1, label: 'low→', color: '#3b82f6' },
          { index: high,    label: 'high', color: '#f43f5e' },
        ],
        message:   `arr[${mid}]=${arr[mid]} < ${target} → discard left half. low = ${mid + 1}`,
        variables: { low: mid + 1, high, target },
        phase:     'Eliminate Left',
      }));
      low = mid + 1;
    } else {
      const elim = {};
      for (let i = mid; i < arr.length; i++) elim[i] = 'excluded';
      frames.push(snap(arr, elim, {
        pointers: [
          { index: low,     label: 'low',  color: '#3b82f6' },
          { index: mid - 1, label: '←high', color: '#f43f5e' },
        ],
        message:   `arr[${mid}]=${arr[mid]} > ${target} → discard right half. high = ${mid - 1}`,
        variables: { low, high: mid - 1, target },
        phase:     'Eliminate Right',
      }));
      high = mid - 1;
    }
  }

  frames.push(snap(arr, Object.fromEntries(arr.map((_, i) => [i, 'excluded'])), {
    pointers: [],
    message:   `Target ${target} not found in array. Return -1.`,
    variables: { result: -1 },
    phase:     'Not Found',
  }));

  return frames;
}

// ─── Linear Search ────────────────────────────────────────────────────────────
export function generateLinearSearchFrames(array, target) {
  const arr = [...array];
  const frames = [];

  frames.push(snap(arr, {}, {
    pointers: [{ index: 0, label: 'i', color: '#a855f7' }],
    message:  `Start linear scan. Target = ${target}`,
    variables: { i: 0, target },
    phase:    'Initialize',
  }));

  for (let i = 0; i < arr.length; i++) {
    const overrides = {};
    for (let j = 0; j < i; j++) overrides[j] = 'excluded';
    overrides[i] = 'comparing';

    frames.push(snap(arr, overrides, {
      pointers: [{ index: i, label: `i=${i}`, color: '#a855f7' }],
      message:  `Check arr[${i}] = ${arr[i]}. Is it ${target}?`,
      variables: { i, 'arr[i]': arr[i], target },
      phase:    'Scanning',
    }));

    if (arr[i] === target) {
      const found = { ...overrides };
      found[i] = 'found';
      frames.push(snap(arr, found, {
        pointers: [{ index: i, label: '✓ found', color: '#10b981' }],
        message:  `arr[${i}] = ${arr[i]} matches target! Found at index ${i}.`,
        variables: { result: i },
        phase:    'Found!',
      }));
      return frames;
    }
  }

  frames.push(snap(arr, Object.fromEntries(arr.map((_, i) => [i, 'excluded'])), {
    pointers: [],
    message:  `Reached end of array. Target ${target} not found.`,
    variables: { result: -1 },
    phase:    'Not Found',
  }));

  return frames;
}

// ─── Bubble Sort ──────────────────────────────────────────────────────────────
export function generateBubbleSortFrames(array) {
  const arr = [...array];
  const frames = [];
  const n = arr.length;

  frames.push(snap(arr, {}, {
    message:  `Start bubble sort on [${arr.join(', ')}]`,
    variables: { n },
    phase:    'Initialize',
  }));

  for (let pass = 0; pass < n - 1; pass++) {
    for (let j = 0; j < n - pass - 1; j++) {
      const overrides = {};
      for (let k = n - pass; k < n; k++) overrides[k] = 'sorted';
      overrides[j]     = 'comparing';
      overrides[j + 1] = 'comparing';

      frames.push(snap(arr, overrides, {
        pointers: [
          { index: j,     label: `j=${j}`,   color: '#fbbf24' },
          { index: j + 1, label: `j+1=${j+1}`, color: '#fbbf24' },
        ],
        message:  `Pass ${pass + 1}: Compare arr[${j}]=${arr[j]} and arr[${j+1}]=${arr[j+1]}`,
        variables: { pass: pass + 1, j, 'arr[j]': arr[j], 'arr[j+1]': arr[j + 1] },
        phase:    `Pass ${pass + 1}`,
      }));

      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];

        const swapOver = {};
        for (let k = n - pass; k < n; k++) swapOver[k] = 'sorted';
        swapOver[j]     = 'swapping';
        swapOver[j + 1] = 'swapping';

        frames.push(snap(arr, swapOver, {
          pointers: [
            { index: j,     label: `j=${j}`,   color: '#f97316' },
            { index: j + 1, label: `j+1=${j+1}`, color: '#f97316' },
          ],
          message:  `Swap! arr[${j}] ↔ arr[${j+1}]  →  [${arr.join(', ')}]`,
          variables: { 'arr[j]': arr[j], 'arr[j+1]': arr[j + 1] },
          phase:    'Swap',
        }));
      }
    }

    const sorted = {};
    for (let k = n - pass - 1; k < n; k++) sorted[k] = 'sorted';
    frames.push(snap(arr, sorted, {
      message:  `Pass ${pass + 1} complete. Largest ${pass + 2} elements are in place.`,
      variables: { pass: pass + 1, sorted: pass + 2 },
      phase:    'Pass Complete',
    }));
  }

  frames.push(snap(arr, Object.fromEntries(arr.map((_, i) => [i, 'sorted'])), {
    message:  `Sorted: [${arr.join(', ')}]`,
    variables: { comparisons: 'done' },
    phase:    'Done!',
  }));

  return frames;
}

// ─── Insertion Sort ───────────────────────────────────────────────────────────
export function generateInsertionSortFrames(array) {
  const arr = [...array];
  const frames = [];

  frames.push(snap(arr, { 0: 'sorted' }, {
    message:  `Start. First element ${arr[0]} is trivially sorted.`,
    variables: { sorted: 1 },
    phase:    'Initialize',
  }));

  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;

    const pickOverrides = Object.fromEntries(arr.slice(0, i).map((_, k) => [k, 'sorted']));
    pickOverrides[i] = 'current';
    frames.push(snap(arr, pickOverrides, {
      pointers: [{ index: i, label: `key=${key}`, color: '#8b5cf6' }],
      message:  `Pick arr[${i}] = ${key}. Insert into sorted left portion.`,
      variables: { i, key },
      phase:    `Insert ${key}`,
    }));

    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];

      const shiftOver = Object.fromEntries(arr.slice(0, i + 1).map((_, k) => [k, k <= i ? 'sorted' : 'default']));
      shiftOver[j]     = 'comparing';
      shiftOver[j + 1] = 'swapping';

      frames.push(snap(arr, shiftOver, {
        pointers: [
          { index: j,     label: `j=${j}`, color: '#fbbf24' },
          { index: j + 1, label: '→',      color: '#f97316' },
        ],
        message:  `arr[${j}]=${arr[j]} > ${key}. Shift right.`,
        variables: { j, 'arr[j]': arr[j], key },
        phase:    'Shifting',
      }));

      j--;
    }

    arr[j + 1] = key;
    const doneOver = Object.fromEntries(arr.slice(0, i + 1).map((_, k) => [k, 'sorted']));
    frames.push(snap(arr, doneOver, {
      pointers: [{ index: j + 1, label: `✓ ${key}`, color: '#22c55e' }],
      message:  `Placed ${key} at index ${j + 1}. Left portion sorted: [${arr.slice(0, i + 1).join(', ')}]`,
      variables: { placed: key, at: j + 1 },
      phase:    'Placed',
    }));
  }

  frames.push(snap(arr, Object.fromEntries(arr.map((_, i) => [i, 'sorted'])), {
    message:  `Sorted: [${arr.join(', ')}]`,
    phase:    'Done!',
  }));

  return frames;
}

// ─── Quick Sort ───────────────────────────────────────────────────────────────
export function generateQuickSortFrames(array) {
  const arr = [...array];
  const frames = [];
  const sortedSet = new Set();

  frames.push(snap(arr, {}, {
    message:  `Quick sort on [${arr.join(', ')}]. Using last element as pivot.`,
    phase:    'Initialize',
  }));

  function partition(low, high) {
    const pivot = arr[high];
    let i = low - 1;

    const pivotOver = {};
    for (let k = 0; k < arr.length; k++) {
      if (sortedSet.has(k)) pivotOver[k] = 'sorted';
    }
    pivotOver[high] = 'pivot';
    frames.push(snap(arr, pivotOver, {
      pointers: [{ index: high, label: `pivot=${pivot}`, color: '#a855f7' }],
      message:  `Partition [${low}..${high}]. Pivot = arr[${high}] = ${pivot}`,
      variables: { low, high, pivot, i },
      phase:    'Choose Pivot',
    }));

    for (let j = low; j < high; j++) {
      const cmpOver = { ...pivotOver };
      cmpOver[j] = 'comparing';
      if (i >= low) cmpOver[i] = 'swapping';

      frames.push(snap(arr, cmpOver, {
        pointers: [
          { index: high, label: `pivot=${pivot}`, color: '#a855f7' },
          { index: j,    label: `j=${j}`,          color: '#fbbf24' },
          ...(i >= low ? [{ index: i, label: `i=${i}`, color: '#f97316' }] : []),
        ],
        message:  `arr[${j}]=${arr[j]} ${arr[j] <= pivot ? '<=' : '>'} pivot=${pivot}`,
        variables: { j, 'arr[j]': arr[j], pivot, i },
        phase:    'Compare',
      }));

      if (arr[j] <= pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];

        const swapOver = { ...pivotOver };
        swapOver[i] = 'swapping';
        swapOver[j] = 'swapping';

        frames.push(snap(arr, swapOver, {
          pointers: [
            { index: high, label: `pivot`, color: '#a855f7' },
            { index: i,    label: `i=${i}`, color: '#f97316' },
            { index: j,    label: `j=${j}`, color: '#fbbf24' },
          ],
          message:  `arr[${j}] ≤ pivot. Swap arr[${i}] ↔ arr[${j}]  →  [${arr.join(', ')}]`,
          variables: { i, j, 'arr[i]': arr[i], 'arr[j]': arr[j] },
          phase:    'Swap',
        }));
      }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    sortedSet.add(i + 1);

    const placeOver = {};
    for (let k = 0; k < arr.length; k++) {
      if (sortedSet.has(k)) placeOver[k] = 'sorted';
    }
    placeOver[i + 1] = 'found';

    frames.push(snap(arr, placeOver, {
      pointers: [{ index: i + 1, label: `✓ pivot`, color: '#10b981' }],
      message:  `Pivot ${pivot} placed at final position ${i + 1}. Everything left ≤ pivot, right > pivot.`,
      variables: { 'pivot at': i + 1 },
      phase:    'Pivot Placed',
    }));

    return i + 1;
  }

  function quickSort(low, high) {
    if (low < high) {
      const pi = partition(low, high);
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    } else if (low === high) {
      sortedSet.add(low);
    }
  }

  quickSort(0, arr.length - 1);

  frames.push(snap(arr, Object.fromEntries(arr.map((_, i) => [i, 'sorted'])), {
    message:  `Sorted: [${arr.join(', ')}]`,
    phase:    'Done!',
  }));

  return frames;
}

// ─── Two Pointer ──────────────────────────────────────────────────────────────
export function generateTwoPointerFrames(array, target) {
  const arr = [...array].sort((a, b) => a - b);
  const frames = [];
  let left = 0, right = arr.length - 1;

  frames.push(snap(arr, { [left]: 'pointer-left', [right]: 'pointer-right' }, {
    pointers: [
      { index: left,  label: 'L', color: '#06b6d4' },
      { index: right, label: 'R', color: '#f43f5e' },
    ],
    message:  `Sorted array. left=0, right=${arr.length - 1}. Find pair summing to ${target}.`,
    variables: { left, right, target, sum: arr[left] + arr[right] },
    phase:    'Initialize',
  }));

  while (left < right) {
    const sum = arr[left] + arr[right];

    const overrides = {};
    overrides[left]  = 'pointer-left';
    overrides[right] = 'pointer-right';

    frames.push(snap(arr, overrides, {
      pointers: [
        { index: left,  label: `L=${left}`,  color: '#06b6d4' },
        { index: right, label: `R=${right}`, color: '#f43f5e' },
      ],
      message:  `arr[L]+arr[R] = ${arr[left]} + ${arr[right]} = ${sum}. Target = ${target}.`,
      variables: { left, right, 'arr[L]': arr[left], 'arr[R]': arr[right], sum, target },
      phase:    'Check Sum',
    }));

    if (sum === target) {
      const matchOver = {};
      matchOver[left]  = 'found';
      matchOver[right] = 'found';
      frames.push(snap(arr, matchOver, {
        pointers: [
          { index: left,  label: `✓ L`, color: '#10b981' },
          { index: right, label: `✓ R`, color: '#10b981' },
        ],
        message:  `Sum = ${sum} = target! Pair found: (${arr[left]}, ${arr[right]}) at indices (${left}, ${right}).`,
        variables: { result: `(${left}, ${right})`, pair: `(${arr[left]}, ${arr[right]})` },
        phase:    'Found!',
      }));
      return frames;
    } else if (sum < target) {
      frames.push(snap(arr, overrides, {
        pointers: [
          { index: left + 1, label: 'L→', color: '#06b6d4' },
          { index: right,    label: 'R',  color: '#f43f5e' },
        ],
        message:  `Sum ${sum} < target ${target}. Need larger sum → move left pointer right.`,
        variables: { action: 'left++', reason: 'sum too small' },
        phase:    'Move Left',
      }));
      left++;
    } else {
      frames.push(snap(arr, overrides, {
        pointers: [
          { index: left,     label: 'L',  color: '#06b6d4' },
          { index: right - 1, label: '←R', color: '#f43f5e' },
        ],
        message:  `Sum ${sum} > target ${target}. Need smaller sum → move right pointer left.`,
        variables: { action: 'right--', reason: 'sum too large' },
        phase:    'Move Right',
      }));
      right--;
    }
  }

  frames.push(snap(arr, Object.fromEntries(arr.map((_, i) => [i, 'excluded'])), {
    message:  `Pointers crossed. No pair sums to ${target}.`,
    variables: { result: 'not found' },
    phase:    'Not Found',
  }));

  return frames;
}

// ─── Sliding Window (max sum of k elements) ───────────────────────────────────
export function generateSlidingWindowFrames(array, k) {
  const arr = [...array];
  const n = arr.length;
  const frames = [];
  k = Math.min(k, n);

  let windowSum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let maxSum = windowSum;
  let maxStart = 0;

  const initOver = {};
  for (let i = 0; i < k; i++) initOver[i] = 'in-window';
  initOver[0]     = 'window-start';
  initOver[k - 1] = 'window-end';

  frames.push(snap(arr, initOver, {
    pointers: [
      { index: 0,     label: 'start', color: '#60a5fa' },
      { index: k - 1, label: 'end',   color: '#60a5fa' },
    ],
    message:  `First window [0..${k-1}]: sum = ${windowSum}. Initial max = ${maxSum}.`,
    variables: { windowSum, maxSum, window: `[0..${k-1}]` },
    phase:    'Initialize',
  }));

  for (let end = k; end < n; end++) {
    const start = end - k + 1;
    windowSum = windowSum - arr[end - k] + arr[end];

    const slideOver = {};
    for (let i = start; i <= end; i++) slideOver[i] = 'in-window';
    slideOver[start] = 'window-start';
    slideOver[end]   = 'window-end';
    for (let i = 0; i < start; i++) slideOver[i] = 'excluded';

    frames.push(snap(arr, slideOver, {
      pointers: [
        { index: start, label: 'start', color: '#60a5fa' },
        { index: end,   label: 'end',   color: '#60a5fa' },
      ],
      message:  `Slide: remove arr[${end-k}]=${arr[end-k]}, add arr[${end}]=${arr[end]}. Window sum = ${windowSum}.`,
      variables: { windowSum, maxSum, window: `[${start}..${end}]` },
      phase:    `Window [${start}..${end}]`,
    }));

    if (windowSum > maxSum) {
      maxSum = windowSum;
      maxStart = start;

      const betterOver = { ...slideOver };
      for (let i = start; i <= end; i++) betterOver[i] = 'found';
      betterOver[start] = 'found';
      betterOver[end]   = 'found';

      frames.push(snap(arr, betterOver, {
        pointers: [
          { index: start, label: '★ start', color: '#10b981' },
          { index: end,   label: '★ end',   color: '#10b981' },
        ],
        message:  `New maximum! sum = ${maxSum} for window [${start}..${end}].`,
        variables: { newMax: maxSum, window: `[${start}..${end}]` },
        phase:    'New Max!',
      }));
    }
  }

  const finalOver = {};
  for (let i = maxStart; i < maxStart + k; i++) finalOver[i] = 'found';

  frames.push(snap(arr, finalOver, {
    pointers: [
      { index: maxStart,       label: 'best start', color: '#10b981' },
      { index: maxStart + k - 1, label: 'best end', color: '#10b981' },
    ],
    message:  `Maximum sum = ${maxSum} in window [${maxStart}..${maxStart + k - 1}]: [${arr.slice(maxStart, maxStart + k).join(', ')}]`,
    variables: { maxSum, bestWindow: `[${maxStart}..${maxStart + k - 1}]` },
    phase:    'Done!',
  }));

  return frames;
}

// ─── Merge Sort ───────────────────────────────────────────────────────────────
export function generateMergeSortFrames(array) {
  const arr = [...array];
  const frames = [];

  frames.push(snap(arr, {}, {
    message:  `Merge sort on [${arr.join(', ')}]. Divide and conquer.`,
    phase:    'Initialize',
  }));

  function merge(left, mid, right) {
    const L = arr.slice(left, mid + 1);
    const R = arr.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;

    while (i < L.length && j < R.length) {
      const over = {};
      for (let x = left; x <= right; x++) over[x] = 'comparing';
      over[k] = 'swapping';

      frames.push(snap(arr, over, {
        pointers: [
          { index: left + i, label: 'L',   color: '#3b82f6' },
          { index: mid + 1 + j, label: 'R', color: '#f43f5e' },
        ],
        message:  `Compare L[${i}]=${L[i]} and R[${j}]=${R[j]}. Pick smaller.`,
        variables: { 'L[i]': L[i], 'R[j]': R[j] },
        phase:    `Merge [${left}..${right}]`,
      }));

      if (L[i] <= R[j]) { arr[k++] = L[i++]; }
      else               { arr[k++] = R[j++]; }
    }

    while (i < L.length) arr[k++] = L[i++];
    while (j < R.length) arr[k++] = R[j++];

    const merged = {};
    for (let x = left; x <= right; x++) merged[x] = 'sorted';
    frames.push(snap(arr, merged, {
      message:  `Merged [${left}..${right}]: [${arr.slice(left, right + 1).join(', ')}]`,
      variables: { merged: `[${left}..${right}]` },
      phase:    'Merged',
    }));
  }

  function mergeSort(left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);

    const splitOver = {};
    for (let i = left; i <= mid; i++)   splitOver[i] = 'pointer-left';
    for (let i = mid + 1; i <= right; i++) splitOver[i] = 'pointer-right';

    frames.push(snap(arr, splitOver, {
      message:  `Split [${left}..${right}] → [${left}..${mid}] and [${mid+1}..${right}]`,
      variables: { left, mid, right },
      phase:    'Divide',
    }));

    mergeSort(left, mid);
    mergeSort(mid + 1, right);
    merge(left, mid, right);
  }

  mergeSort(0, arr.length - 1);

  frames.push(snap(arr, Object.fromEntries(arr.map((_, i) => [i, 'sorted'])), {
    message:  `Sorted: [${arr.join(', ')}]`,
    phase:    'Done!',
  }));

  return frames;
}
