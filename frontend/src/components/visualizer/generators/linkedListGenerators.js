function llSnap(nodes, pointers = [], meta = {}) {
  return {
    type: 'linkedlist',
    nodes: nodes.map(n => ({ ...n })),
    pointers,
    message:   meta.message   || '',
    variables: meta.variables || {},
    phase:     meta.phase     || '',
    hasCycle:  meta.hasCycle  || false,
    cycleAt:   meta.cycleAt   != null ? meta.cycleAt : undefined,
    resultNodes: meta.resultNodes || null,
  };
}

// ─── Reverse Linked List ──────────────────────────────────────────────────────
export function generateReverseLinkedListFrames(values = [1, 2, 3, 4, 5]) {
  const frames = [];

  let nodes = values.map((v, i) => ({ id: i, value: v, state: 'default' }));
  frames.push(llSnap(nodes, [{ nodeId: 0, label: 'head', color: '#3b82f6' }], {
    message: `Reverse linked list: [${values.join('→')}]. Use three pointers: prev, curr, next.`,
    variables: { prev: 'null', curr: 0, next: '-' },
    phase: 'Initialize',
  }));

  let prev = null;
  let curr = 0;

  while (curr < nodes.length) {
    const next = curr + 1 < nodes.length ? curr + 1 : null;

    // Show current state
    nodes = nodes.map((n, i) => ({
      ...n,
      state: i < curr ? 'reversed' : i === curr ? 'current' : 'default',
    }));

    const ptrs = [
      { nodeId: curr, label: 'curr', color: '#8b5cf6' },
      ...(prev != null ? [{ nodeId: prev, label: 'prev', color: '#22c55e' }] : []),
      ...(next != null ? [{ nodeId: next, label: 'next', color: '#fbbf24' }] : []),
    ];

    frames.push(llSnap(nodes, ptrs, {
      message: `curr=${curr} (val=${values[curr]}). Save next=${next != null ? next : 'null'}. Reverse pointer: curr.next → prev.`,
      variables: { prev: prev ?? 'null', curr, next: next ?? 'null' },
      phase: `Reverse Node ${curr}`,
    }));

    prev = curr;
    curr = next != null ? next : nodes.length;
  }

  nodes = nodes.map((n, i) => ({ ...n, state: 'reversed' }));
  frames.push(llSnap(nodes, [{ nodeId: nodes.length - 1, label: 'new head', color: '#10b981' }], {
    message: `List reversed! New order: [${[...values].reverse().join('→')}]. Head = last element.`,
    variables: { result: `[${[...values].reverse().join('→')}]` },
    phase: 'Done!',
  }));

  return frames;
}

// ─── Floyd's Cycle Detection ───────────────────────────────────────────────────
export function generateFloydCycleDetectionFrames(values = [3, 1, 2, 4, 5, 2], cycleAt = 2) {
  const frames = [];
  const nodes = values.map((v, i) => ({ id: i, value: v, state: 'default' }));

  frames.push(llSnap(nodes, [
    { nodeId: 0, label: 'slow', color: '#06b6d4' },
    { nodeId: 0, label: 'fast', color: '#f43f5e' },
  ], {
    hasCycle: true, cycleAt,
    message: `Floyd's cycle detection: slow moves 1 step, fast moves 2 steps. Cycle at node ${cycleAt} (val=${values[cycleAt]}).`,
    variables: { slow: 0, fast: 0 },
    phase: 'Initialize',
  }));

  let slow = 0, fast = 0;
  const listLen = values.length;

  // We'll simulate on a virtual circular list
  function next(idx) { return idx + 1 >= listLen ? cycleAt : idx + 1; }

  const maxSteps = listLen * 3;
  for (let step = 0; step < maxSteps; step++) {
    slow = next(slow);
    fast = next(next(fast));

    const ns = nodes.map((n, i) => ({
      ...n,
      state: i === slow && i === fast ? 'found'
        : i === slow ? 'slow'
        : i === fast ? 'fast'
        : 'default',
    }));

    frames.push(llSnap(ns, [
      { nodeId: slow, label: `slow=${slow}`, color: '#06b6d4' },
      { nodeId: fast, label: `fast=${fast}`, color: '#f43f5e' },
    ], {
      hasCycle: true, cycleAt,
      message: slow === fast
        ? `CYCLE DETECTED! slow=fast=${slow}. Both pointers met at node ${slow}.`
        : `Step ${step + 1}: slow → ${slow}, fast → ${fast}.`,
      variables: { slow, fast, 'slow val': values[slow], 'fast val': values[fast] },
      phase: slow === fast ? '⚠ Cycle Found!' : `Step ${step + 1}`,
    }));

    if (slow === fast) break;
  }

  return frames;
}

// ─── Merge Two Sorted Lists ───────────────────────────────────────────────────
export function generateMergeSortedListsFrames(l1 = [1, 3, 5, 7], l2 = [2, 4, 6, 8]) {
  const frames = [];
  const allVals = [...l1, ...l2];
  const nodes = allVals.map((v, i) => ({
    value: v, state: i < l1.length ? 'default' : 'list2',
  }));

  frames.push(llSnap(nodes, [], {
    message: `Merge sorted lists L1=[${l1.join('→')}] and L2=[${l2.join('→')}]. Compare heads, pick smaller.`,
    variables: { L1: `[${l1.join('→')}]`, L2: `[${l2.join('→')}]` },
    phase: 'Initialize',
  }));

  let i = 0, j = 0;
  const result = [];

  while (i < l1.length && j < l2.length) {
    const ns = nodes.map((n, idx) => ({
      ...n,
      state: idx === i ? 'comparing'
        : idx === l1.length + j ? 'comparing'
        : idx < i ? 'merged'
        : idx - l1.length < j ? 'merged'
        : idx < l1.length ? 'default' : 'list2',
    }));

    frames.push(llSnap(ns, [
      { nodeId: i,            label: `p1=${i}`, color: '#3b82f6' },
      { nodeId: l1.length + j, label: `p2=${j}`, color: '#a855f7' },
    ], {
      resultNodes: result.map(v => ({ value: v, state: 'merged' })),
      message: `Compare L1[${i}]=${l1[i]} and L2[${j}]=${l2[j]}. Pick ${l1[i] <= l2[j] ? l1[i] + ' (L1 smaller)' : l2[j] + ' (L2 smaller)'}.`,
      variables: { p1: i, p2: j, 'L1[p1]': l1[i], 'L2[p2]': l2[j] },
      phase: `Compare`,
    }));

    if (l1[i] <= l2[j]) { result.push(l1[i]); i++; }
    else                 { result.push(l2[j]); j++; }
  }

  while (i < l1.length) result.push(l1[i++]);
  while (j < l2.length) result.push(l2[j++]);

  frames.push(llSnap(nodes, [], {
    resultNodes: result.map(v => ({ value: v, state: 'merged' })),
    message: `Merge complete: [${result.join('→')}]`,
    phase: 'Done!',
  }));

  return frames;
}

// ─── Find Middle Node ─────────────────────────────────────────────────────────
export function generateFindMiddleFrames(values = [1, 2, 3, 4, 5, 6]) {
  const frames = [];
  const nodes = values.map((v) => ({ value: v, state: 'default' }));

  frames.push(llSnap(nodes, [
    { nodeId: 0, label: 'slow', color: '#06b6d4' },
    { nodeId: 0, label: 'fast', color: '#f43f5e' },
  ], {
    message: `Find middle: slow moves 1 step, fast moves 2 steps. When fast reaches end, slow is at middle.`,
    variables: { slow: 0, fast: 0 },
    phase: 'Initialize',
  }));

  let slow = 0, fast = 0;

  while (fast < values.length - 1 && fast + 1 < values.length - 1) {
    slow++;
    fast += 2;
    if (fast >= values.length) fast = values.length - 1;

    const ns = nodes.map((n, i) => ({
      ...n,
      state: i === slow && i === fast ? 'found' : i === slow ? 'slow' : i === fast ? 'fast' : 'default',
    }));

    frames.push(llSnap(ns, [
      { nodeId: slow, label: `slow=${slow}`, color: '#06b6d4' },
      { nodeId: fast, label: `fast=${fast}`, color: '#f43f5e' },
    ], {
      message: `slow → ${slow}, fast → ${fast}. Fast ${fast >= values.length - 1 ? 'reached end' : 'still moving'}.`,
      variables: { slow, fast, 'slow val': values[slow] },
      phase: `Step`,
    }));
  }

  const finalNodes = nodes.map((n, i) => ({
    ...n,
    state: i === slow ? 'found' : 'default',
  }));
  frames.push(llSnap(finalNodes, [{ nodeId: slow, label: '★ middle', color: '#10b981' }], {
    message: `Middle found at index ${slow}, value = ${values[slow]}.`,
    variables: { middleIndex: slow, middleValue: values[slow] },
    phase: 'Done!',
  }));

  return frames;
}

// ─── Remove Nth Node from End ──────────────────────────────────────────────────
export function generateRemoveNthFromEndFrames(values = [1, 2, 3, 4, 5], n = 2) {
  const frames = [];
  const nodes = values.map((v) => ({ value: v, state: 'default' }));

  frames.push(llSnap(nodes, [
    { nodeId: 0, label: 'fast', color: '#f43f5e' },
    { nodeId: 0, label: 'slow', color: '#06b6d4' },
  ], {
    message: `Remove ${n}th node from end. Advance fast by ${n} steps first.`,
    variables: { n, fast: 0, slow: 0 },
    phase: 'Initialize',
  }));

  let fast = 0;
  // Advance fast by n steps
  for (let i = 0; i < n; i++) {
    fast++;
    const ns = nodes.map((nd, idx) => ({ ...nd, state: idx === fast ? 'fast' : 'default' }));
    frames.push(llSnap(ns, [
      { nodeId: fast, label: `fast=${fast}`, color: '#f43f5e' },
      { nodeId: 0, label: `slow=0`, color: '#06b6d4' },
    ], {
      message: `Advance fast: step ${i + 1} of ${n}. fast = ${fast}.`,
      variables: { fast, slow: 0, n },
      phase: `Advance Fast`,
    }));
  }

  // Move both until fast reaches end
  let slow = 0;
  while (fast < values.length - 1) {
    slow++;
    fast++;
    const ns = nodes.map((nd, idx) => ({
      ...nd,
      state: idx === slow ? 'slow' : idx === fast ? 'fast' : 'default',
    }));
    frames.push(llSnap(ns, [
      { nodeId: fast, label: `fast=${fast}`, color: '#f43f5e' },
      { nodeId: slow, label: `slow=${slow}`, color: '#06b6d4' },
    ], {
      message: `Both move. slow=${slow}, fast=${fast}.`,
      variables: { slow, fast },
      phase: 'Move Both',
    }));
  }

  // slow+1 is the node to remove
  const targetIdx = slow + 1;
  const afterNodes = nodes.map((nd, idx) => ({
    ...nd,
    state: idx === targetIdx ? 'cycle' : idx === slow ? 'found' : 'default',
  }));
  frames.push(llSnap(afterNodes, [
    { nodeId: slow, label: `prev=${slow}`, color: '#22c55e' },
    { nodeId: targetIdx, label: `★ remove`, color: '#f43f5e' },
  ], {
    message: `slow.next (index ${targetIdx}, val=${values[targetIdx]}) is the ${n}th from end. Remove it by setting slow.next = slow.next.next.`,
    variables: { removeIndex: targetIdx, value: values[targetIdx] },
    phase: 'Remove',
  }));

  const finalValues = values.filter((_, idx) => idx !== targetIdx);
  const finalNodes  = finalValues.map(v => ({ value: v, state: 'reversed' }));
  frames.push(llSnap(finalNodes, [{ nodeId: 0, label: 'head', color: '#3b82f6' }], {
    message: `Node removed. Result: [${finalValues.join('→')}]`,
    phase: 'Done!',
  }));

  return frames;
}
