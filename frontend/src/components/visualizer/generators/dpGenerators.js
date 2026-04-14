// ─── Helpers ──────────────────────────────────────────────────────────────────
function gridSnap(grid, current, meta = {}) {
  return {
    type: 'grid',
    grid: grid.map((row) => row.map((cell) => ({ ...cell }))),
    current,
    message:   meta.message   || '',
    variables: meta.variables || {},
    phase:     meta.phase     || '',
  };
}

// ─── Fibonacci (bottom-up DP) ─────────────────────────────────────────────────
export function generateFibonacciFrames(n = 8) {
  const frames = [];
  const dp = Array(n + 1).fill(null).map(() => ({ value: '?', state: 'empty' }));

  // Single row display
  frames.push(gridSnap([dp], null, {
    message:  `Compute Fibonacci up to F(${n}). dp[i] = dp[i-1] + dp[i-2].`,
    variables: { n },
    phase:    'Initialize',
  }));

  dp[0] = { value: 0, state: 'filled' };
  frames.push(gridSnap([dp], [0, 0], {
    message:  'Base case: F(0) = 0.',
    variables: { 'F(0)': 0 },
    phase:    'Base Case 0',
  }));

  if (n >= 1) {
    dp[1] = { value: 1, state: 'filled' };
    frames.push(gridSnap([dp], [0, 1], {
      message:  'Base case: F(1) = 1.',
      variables: { 'F(1)': 1 },
      phase:    'Base Case 1',
    }));
  }

  for (let i = 2; i <= n; i++) {
    // Highlight dependencies
    const depSnap = dp.map((c) => ({ ...c }));
    depSnap[i - 1] = { ...depSnap[i - 1], state: 'dependency' };
    depSnap[i - 2] = { ...depSnap[i - 2], state: 'dependency' };
    depSnap[i]     = { value: '?', state: 'current' };
    frames.push(gridSnap([depSnap], [0, i], {
      message:  `F(${i}) depends on F(${i-1})=${dp[i-1].value} and F(${i-2})=${dp[i-2].value}.`,
      variables: { [`F(${i-1})`]: dp[i - 1].value, [`F(${i-2})`]: dp[i - 2].value },
      phase:    `Compute F(${i})`,
    }));

    const val = dp[i - 1].value + dp[i - 2].value;
    dp[i] = { value: val, state: 'filled' };

    const fillSnap = dp.map((c) => ({ ...c }));
    fillSnap[i] = { value: val, state: 'optimal' };
    frames.push(gridSnap([fillSnap], [0, i], {
      message:  `F(${i}) = F(${i-1}) + F(${i-2}) = ${dp[i-1].value} + ${dp[i-2].value} = ${val}.`,
      variables: { [`F(${i})`]: val },
      phase:    `F(${i}) = ${val}`,
    }));
  }

  const finalDp = dp.map((c) => ({ ...c, state: 'filled' }));
  frames.push(gridSnap([finalDp], null, {
    message:  `Fibonacci complete! F(${n}) = ${dp[n].value}. Sequence: ${dp.map((c) => c.value).join(', ')}`,
    variables: { [`F(${n})`]: dp[n].value },
    phase:    'Done!',
  }));

  return frames;
}

// ─── 0/1 Knapsack ─────────────────────────────────────────────────────────────
export function generateKnapsackFrames(weights = [2, 3, 4, 5], values = [3, 4, 5, 6], capacity = 8) {
  const n = weights.length;
  const frames = [];

  // dp[i][w] = max value using first i items with capacity w
  const dp = Array(n + 1).fill(null).map(() =>
    Array(capacity + 1).fill(null).map(() => ({ value: 0, state: 'filled' }))
  );

  frames.push(gridSnap(dp.map((row) => row.map((c) => ({ value: '-', state: 'empty' }))), null, {
    message:  `0/1 Knapsack: ${n} items, capacity ${capacity}.\n Items: weights=[${weights.join(',')}], values=[${values.join(',')}]`,
    variables: { items: n, capacity },
    phase:    'Initialize',
  }));

  // Fill base cases (row 0)
  const baseGrid = dp.map((row) => row.map((c) => ({ value: 0, state: 'filled' })));
  frames.push(gridSnap(baseGrid, null, {
    message:  'Base case: dp[0][w] = 0 for all w (no items → no value).',
    variables: { row: 0 },
    phase:    'Base Cases',
  }));

  for (let i = 1; i <= n; i++) {
    const w_i    = weights[i - 1];
    const val_i  = values[i - 1];

    for (let w = 0; w <= capacity; w++) {
      const depGrid = dp.map((row) => row.map((c) => ({ ...c })));

      if (w_i > w) {
        // Can't include item i
        dp[i][w] = { value: dp[i - 1][w].value, state: 'filled' };
        depGrid[i - 1][w] = { ...depGrid[i - 1][w], state: 'dependency' };
        depGrid[i][w]     = { value: dp[i][w].value, state: 'current' };

        frames.push(gridSnap(depGrid, [i, w], {
          message:  `Item ${i} (w=${w_i}) too heavy for capacity ${w}. dp[${i}][${w}] = dp[${i-1}][${w}] = ${dp[i][w].value}`,
          variables: { item: i, weight: w_i, capacity: w, value: dp[i][w].value },
          phase:    `Item ${i}, Cap ${w}`,
        }));
      } else {
        // Choose max: skip or include
        const skip    = dp[i - 1][w].value;
        const include = dp[i - 1][w - w_i].value + val_i;
        dp[i][w] = { value: Math.max(skip, include), state: 'filled' };

        depGrid[i - 1][w]       = { ...depGrid[i - 1][w], state: 'dependency' };
        depGrid[i - 1][w - w_i] = { ...depGrid[i - 1][w - w_i], state: 'dependency' };
        depGrid[i][w]           = { value: dp[i][w].value, state: 'current' };

        frames.push(gridSnap(depGrid, [i, w], {
          message:  `Item ${i} (w=${w_i}, v=${val_i}). Skip=${skip}, Include=${include}. dp[${i}][${w}] = max(${skip},${include}) = ${dp[i][w].value}`,
          variables: { skip, include, chosen: dp[i][w].value, item: i, capacity: w },
          phase:    `Item ${i}, Cap ${w}`,
        }));
      }
    }

    const rowDone = dp.map((row) => row.map((c) => ({ ...c })));
    for (let w = 0; w <= capacity; w++) rowDone[i][w] = { ...rowDone[i][w], state: 'optimal' };
    frames.push(gridSnap(rowDone, null, {
      message:  `Row ${i} complete (item ${i}: weight=${w_i}, value=${val_i}).`,
      phase:    `Row ${i} Done`,
    }));
  }

  frames.push(gridSnap(dp, null, {
    message:  `Maximum value = dp[${n}][${capacity}] = ${dp[n][capacity].value}`,
    variables: { maxValue: dp[n][capacity].value },
    phase:    'Done!',
  }));

  return frames;
}

// ─── Longest Common Subsequence ───────────────────────────────────────────────
export function generateLCSFrames(s1 = 'ABCBDAB', s2 = 'BDCAB') {
  const m = s1.length, n = s2.length;
  const frames = [];

  const dp = Array(m + 1).fill(null).map(() =>
    Array(n + 1).fill(null).map(() => ({ value: 0, state: 'filled' }))
  );

  const emptyGrid = dp.map((row) => row.map((c) => ({ value: 0, state: 'empty' })));
  frames.push(gridSnap(emptyGrid, null, {
    message:  `LCS of "${s1}" and "${s2}". dp[i][j] = LCS length of s1[0..i-1] and s2[0..j-1].`,
    variables: { s1, s2 },
    phase:    'Initialize',
  }));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = { value: dp[i - 1][j - 1].value + 1, state: 'filled' };

        const matchGrid = dp.map((row) => row.map((c) => ({ ...c })));
        matchGrid[i - 1][j - 1] = { ...matchGrid[i - 1][j - 1], state: 'dependency' };
        matchGrid[i][j]         = { value: dp[i][j].value, state: 'optimal' };

        frames.push(gridSnap(matchGrid, [i, j], {
          message:  `s1[${i-1}]='${s1[i-1]}' == s2[${j-1}]='${s2[j-1]}'. Match! dp[${i}][${j}] = dp[${i-1}][${j-1}]+1 = ${dp[i][j].value}`,
          variables: { match: `'${s1[i-1]}'`, 'dp[i][j]': dp[i][j].value },
          phase:    `Match '${s1[i-1]}'`,
        }));
      } else {
        dp[i][j] = { value: Math.max(dp[i - 1][j].value, dp[i][j - 1].value), state: 'filled' };

        const noMatchGrid = dp.map((row) => row.map((c) => ({ ...c })));
        noMatchGrid[i - 1][j] = { ...noMatchGrid[i - 1][j], state: 'dependency' };
        noMatchGrid[i][j - 1] = { ...noMatchGrid[i][j - 1], state: 'dependency' };
        noMatchGrid[i][j]     = { value: dp[i][j].value, state: 'current' };

        frames.push(gridSnap(noMatchGrid, [i, j], {
          message:  `s1[${i-1}]='${s1[i-1]}' != s2[${j-1}]='${s2[j-1]}'. dp[${i}][${j}] = max(${dp[i-1][j].value}, ${dp[i][j-1].value}) = ${dp[i][j].value}`,
          variables: { 'dp[i][j]': dp[i][j].value },
          phase:    `No match`,
        }));
      }
    }
  }

  frames.push(gridSnap(dp, null, {
    message:  `LCS length = dp[${m}][${n}] = ${dp[m][n].value}`,
    variables: { LCS_length: dp[m][n].value, s1, s2 },
    phase:    'Done!',
  }));

  return frames;
}
