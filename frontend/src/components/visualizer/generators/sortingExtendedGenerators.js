function snap(arr, overrides = {}, meta = {}) {
  return {
    type: 'array',
    elements: arr.map((value, i) => ({ value, state: overrides[i] || 'default' })),
    pointers:  meta.pointers  || [],
    message:   meta.message   || '',
    variables: meta.variables || {},
    phase:     meta.phase     || '',
  };
}

// ─── Selection Sort ───────────────────────────────────────────────────────────
export function generateSelectionSortFrames(array) {
  const arr = [...array];
  const frames = [];
  const n = arr.length;

  frames.push(snap(arr, {}, { message: `Selection sort: find minimum in unsorted portion, swap to front.`, phase: 'Initialize' }));

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      const over = {};
      for (let k = 0; k < i; k++) over[k] = 'sorted';
      over[minIdx] = 'pivot';
      over[j]      = 'comparing';
      frames.push(snap(arr, over, {
        pointers: [{ index: minIdx, label: `min=${arr[minIdx]}`, color: '#a855f7' }, { index: j, label: `j=${j}`, color: '#fbbf24' }],
        message:  `Compare arr[${j}]=${arr[j]} with current min arr[${minIdx}]=${arr[minIdx]}.`,
        variables: { i, j, minIdx, min: arr[minIdx] },
        phase:    `Pass ${i + 1}`,
      }));

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        frames.push(snap(arr, { ...over, [minIdx]: 'pivot' }, {
          message: `New minimum found: arr[${minIdx}]=${arr[minIdx]}`,
          phase: `New Min`,
        }));
      }
    }

    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      const swapOver = {};
      for (let k = 0; k < i; k++) swapOver[k] = 'sorted';
      swapOver[i]      = 'swapping';
      swapOver[minIdx] = 'swapping';
      frames.push(snap(arr, swapOver, {
        message: `Swap arr[${i}] ↔ arr[${minIdx}]  →  [${arr.join(', ')}]`,
        phase:   'Swap Min',
      }));
    }

    const doneOver = {};
    for (let k = 0; k <= i; k++) doneOver[k] = 'sorted';
    frames.push(snap(arr, doneOver, { message: `Position ${i} set. [${arr.slice(0,i+1).join(', ')}] sorted.`, phase: 'Position Fixed' }));
  }

  frames.push(snap(arr, Object.fromEntries(arr.map((_,i) => [i,'sorted'])), { message: `Sorted: [${arr.join(', ')}]`, phase: 'Done!' }));
  return frames;
}

// ─── Heap Sort ────────────────────────────────────────────────────────────────
export function generateHeapSortFrames(array) {
  const arr = [...array];
  const frames = [];
  const n = arr.length;

  frames.push(snap(arr, {}, { message: `Heap sort: build a max-heap, then extract max repeatedly.`, phase: 'Initialize' }));

  function heapify(size, root) {
    let largest = root;
    const l = 2 * root + 1;
    const r = 2 * root + 2;
    if (l < size && arr[l] > arr[largest]) largest = l;
    if (r < size && arr[r] > arr[largest]) largest = r;

    if (largest !== root) {
      const over = {};
      for (let k = size; k < n; k++) over[k] = 'sorted';
      over[root]    = 'comparing';
      over[largest] = 'swapping';
      frames.push(snap(arr, over, {
        message: `Heapify: arr[${root}]=${arr[root]} < arr[${largest}]=${arr[largest]}. Swap.`,
        variables: { root, largest },
        phase:   'Heapify',
      }));
      [arr[root], arr[largest]] = [arr[largest], arr[root]];
      heapify(size, largest);
    }
  }

  // Build max-heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }
  frames.push(snap(arr, {}, { message: `Max-heap built: [${arr.join(', ')}]. Root (arr[0]=${arr[0]}) is largest.`, phase: 'Heap Built' }));

  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    const over = {};
    for (let k = i; k < n; k++) over[k] = 'sorted';
    over[0] = 'swapping';
    over[i] = 'swapping';
    frames.push(snap(arr, over, {
      message: `Extract max: swap root arr[0]=${arr[i]} to end. Heap size → ${i}.`,
      variables: { extracted: arr[i], heapSize: i },
      phase:   'Extract Max',
    }));
    heapify(i, 0);
  }

  frames.push(snap(arr, Object.fromEntries(arr.map((_,i) => [i,'sorted'])), { message: `Sorted: [${arr.join(', ')}]`, phase: 'Done!' }));
  return frames;
}

// ─── Counting Sort ────────────────────────────────────────────────────────────
export function generateCountingSortFrames(array) {
  const arr = [...array];
  const frames = [];
  const max = Math.max(...arr);
  const count = Array(max + 1).fill(0);

  frames.push(snap(arr, {}, { message: `Counting sort: count occurrences of each value 0..${max}.`, phase: 'Initialize' }));

  // Count
  for (let i = 0; i < arr.length; i++) {
    count[arr[i]]++;
    const over = {};
    over[i] = 'comparing';
    frames.push(snap(arr, over, {
      message:  `arr[${i}]=${arr[i]} → count[${arr[i]}] = ${count[arr[i]]}`,
      variables: { i, value: arr[i], count: `[${count.join(',')}]` },
      phase:    `Count`,
    }));
  }

  // Prefix sum
  for (let i = 1; i <= max; i++) count[i] += count[i - 1];
  frames.push({
    type: 'array',
    elements: count.map((v, i) => ({ value: v, state: i === 0 ? 'default' : 'in-window' })),
    pointers: [],
    message: `Prefix sum of counts: [${count.join(', ')}]. count[k] = number of elements ≤ k.`,
    variables: { prefixCount: `[${count.join(',')}]` },
    phase: 'Prefix Sum',
  });

  // Place in output
  const output = Array(arr.length).fill(0);
  for (let i = arr.length - 1; i >= 0; i--) {
    output[--count[arr[i]]] = arr[i];
    frames.push({
      type: 'array',
      elements: output.map((v, oi) => ({ value: v === 0 && oi !== count[arr[i]] ? '-' : v, state: v === 0 ? 'default' : 'sorted' })),
      pointers: [],
      message: `Place arr[${i}]=${arr[i]} at output[${count[arr[i]]}].`,
      variables: { i, value: arr[i] },
      phase: 'Place',
    });
  }

  frames.push({
    type: 'array',
    elements: output.map(v => ({ value: v, state: 'sorted' })),
    pointers: [],
    message: `Sorted: [${output.join(', ')}]`,
    phase: 'Done!',
  });
  return frames;
}

// ─── Radix Sort ───────────────────────────────────────────────────────────────
export function generateRadixSortFrames(array) {
  const arr = [...array];
  const frames = [];

  frames.push(snap(arr, {}, { message: `Radix sort: sort by each digit from least significant to most significant.`, phase: 'Initialize' }));

  const max = Math.max(...arr);
  let exp = 1;
  let pass = 1;

  while (Math.floor(max / exp) > 0) {
    const output = Array(arr.length).fill(0);
    const count  = Array(10).fill(0);
    const digitName = exp === 1 ? 'ones' : exp === 10 ? 'tens' : exp === 100 ? 'hundreds' : `${exp}s`;

    // Count digits
    for (let i = 0; i < arr.length; i++) {
      const d = Math.floor(arr[i] / exp) % 10;
      count[d]++;
    }

    // Mark by digit
    const digitOver = {};
    for (let i = 0; i < arr.length; i++) {
      const d = Math.floor(arr[i] / exp) % 10;
      digitOver[i] = ['comparing','swapping','pivot','current','in-window','pointer-left','pointer-right','found','sorted','default'][d % 10];
    }
    frames.push(snap(arr, digitOver, {
      message: `Pass ${pass}: group by ${digitName} digit. Counts: [${count.join(',')}]`,
      variables: { pass, digit: digitName, counts: `[${count.join(',')}]` },
      phase:    `Pass ${pass}: ${digitName}`,
    }));

    // Prefix sum + build output
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];
    for (let i = arr.length - 1; i >= 0; i--) {
      const d = Math.floor(arr[i] / exp) % 10;
      output[--count[d]] = arr[i];
    }

    for (let i = 0; i < arr.length; i++) arr[i] = output[i];

    frames.push(snap(arr, {}, {
      message: `After pass ${pass} (${digitName} digit): [${arr.join(', ')}]`,
      variables: { pass, result: `[${arr.join(',')}]` },
      phase:    `After Pass ${pass}`,
    }));

    exp *= 10;
    pass++;
  }

  frames.push(snap(arr, Object.fromEntries(arr.map((_,i) => [i,'sorted'])), { message: `Sorted: [${arr.join(', ')}]`, phase: 'Done!' }));
  return frames;
}

// ─── Bucket Sort ─────────────────────────────────────────────────────────────
export function generateBucketSortFrames(array) {
  const arr = [...array];
  const frames = [];
  const n = arr.length;
  const max = Math.max(...arr) + 1;
  const bucketCount = Math.ceil(Math.sqrt(n));
  const bucketSize  = Math.ceil(max / bucketCount);

  frames.push(snap(arr, {}, { message: `Bucket sort: distribute elements into ${bucketCount} buckets, sort each, then concatenate.`, phase: 'Initialize' }));

  const buckets = Array.from({ length: bucketCount }, () => []);

  for (let i = 0; i < n; i++) {
    const bi = Math.floor(arr[i] / bucketSize);
    buckets[bi].push(arr[i]);
    const over = {};
    over[i] = 'in-window';
    frames.push(snap(arr, over, {
      message: `arr[${i}]=${arr[i]} → bucket[${bi}] (range [${bi*bucketSize}..${(bi+1)*bucketSize-1}])`,
      variables: { element: arr[i], bucket: bi, buckets: buckets.map(b => `[${b.join(',')}]`).join(' | ') },
      phase: 'Distribute',
    }));
  }

  frames.push(snap(arr, {}, {
    message: `Buckets: ${buckets.map((b,i) => `B${i}:[${b.join(',')}]`).join(' | ')}. Now sort each bucket.`,
    phase: 'Sort Buckets',
  }));

  buckets.forEach(b => b.sort((a, z) => a - z));
  const sorted = [].concat(...buckets);

  frames.push({
    type: 'array',
    elements: sorted.map(v => ({ value: v, state: 'sorted' })),
    pointers: [],
    message: `All buckets sorted and merged: [${sorted.join(', ')}]`,
    phase: 'Done!',
  });
  return frames;
}
