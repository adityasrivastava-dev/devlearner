function arrSnap(arr, over, msg, phase, vars = {}, resultList = null) {
  return {
    type: 'array',
    elements: arr.map((v, i) => ({ value: v, state: over[i] || 'default' })),
    pointers: [],
    message: msg,
    variables: vars,
    phase,
    resultList,
  };
}

function gridSnap(grid, current, msg, phase, vars = {}) {
  return { type: 'grid', grid: grid.map(r => r.map(c => ({...c}))), current, message: msg, variables: vars, phase };
}

// ─── Generate All Subsets ─────────────────────────────────────────────────────
export function generateSubsetsFrames(nums = [1, 2, 3]) {
  const frames = [];
  const subsets = [];
  const n = nums.length;

  frames.push(arrSnap(nums, {}, `Generate all subsets of [${nums.join(',')}]. At each index: include or exclude. Total = 2^${n} = ${1<<n} subsets.`, 'Initialize', { total: 1 << n }));

  function backtrack(start, current) {
    subsets.push([...current]);

    const over = {};
    current.forEach(v => {
      const idx = nums.indexOf(v);
      over[idx] = 'found';
    });
    if (start < n) over[start] = 'comparing';

    frames.push(arrSnap(nums, over,
      `Current subset: [${current.join(',')}]. Exploring from index ${start}.`,
      `[${current.join(',')}]`,
      { depth: current.length, subset: `[${current.join(',')}]`, total: subsets.length },
      subsets.map(s => `[${s.join(',')}]`)));

    for (let i = start; i < n; i++) {
      current.push(nums[i]);

      const inclOver = { ...over };
      inclOver[i] = 'sorted';

      frames.push(arrSnap(nums, inclOver,
        `Include nums[${i}]=${nums[i]}. Current path: [${current.join(',')}]`,
        `Include ${nums[i]}`,
        { including: nums[i] },
        subsets.map(s => `[${s.join(',')}]`)));

      backtrack(i + 1, current);
      current.pop();

      const exclOver = { ...over };
      exclOver[i] = 'excluded';

      frames.push(arrSnap(nums, exclOver,
        `Exclude nums[${i}]=${nums[i]}. Backtrack.`,
        `Exclude ${nums[i]}`,
        { excluding: nums[i] },
        subsets.map(s => `[${s.join(',')}]`)));
    }
  }

  backtrack(0, []);

  frames.push(arrSnap(nums, Object.fromEntries(nums.map((_,i) => [i,'sorted'])),
    `All ${subsets.length} subsets generated: ${subsets.map(s => `[${s.join(',')}]`).join(', ')}`,
    'Done!',
    { total: subsets.length },
    subsets.map(s => `[${s.join(',')}]`)));

  return frames;
}

// ─── Permutations ─────────────────────────────────────────────────────────────
export function generatePermutationsFrames(nums = [1, 2, 3]) {
  const frames = [];
  const perms = [];
  const used = Array(nums.length).fill(false);

  frames.push(arrSnap(nums, {}, `Permutations of [${nums.join(',')}]. At each step: pick an unused element. Total = ${nums.length}! = ${nums.reduce((a,_,i) => a*(i+1),1)}.`, 'Initialize'));

  function backtrack(current) {
    if (current.length === nums.length) {
      perms.push([...current]);
      const over = Object.fromEntries(nums.map((_,i) => [i,'found']));
      frames.push(arrSnap(current, over,
        `Complete permutation: [${current.join(',')}]! Record it.`,
        `✓ [${current.join(',')}]`,
        { permutation: `[${current.join(',')}]`, total: perms.length },
        perms.map(p => `[${p.join(',')}]`)));
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      current.push(nums[i]);

      const over = {};
      current.forEach((v, pi) => { over[pi] = 'in-window'; });
      over[current.length - 1] = 'sorted';
      for (let k = 0; k < nums.length; k++) { if (used[k] && !current.includes(nums[k])) over[k] = 'excluded'; }

      frames.push(arrSnap(nums, over,
        `Choose nums[${i}]=${nums[i]}. Current path: [${current.join(',')}]. Positions left: ${nums.length - current.length}.`,
        `Choose ${nums[i]}`,
        { current: `[${current.join(',')}]`, depth: current.length }));

      backtrack(current);

      used[i] = false;
      current.pop();
    }
  }

  backtrack([]);
  frames.push(arrSnap(nums, Object.fromEntries(nums.map((_,i) => [i,'sorted'])),
    `All ${perms.length} permutations: ${perms.map(p=>`[${p.join(',')}]`).join(', ')}`,
    'Done!',
    { total: perms.length },
    perms.map(p => `[${p.join(',')}]`)));

  return frames;
}

// ─── Combination Sum ──────────────────────────────────────────────────────────
export function generateCombinationSumFrames(candidates = [2, 3, 6, 7], target = 7) {
  const frames = [];
  const results = [];
  candidates.sort((a,b) => a-b);

  frames.push(arrSnap(candidates, {}, `Combination Sum: find all combos from [${candidates.join(',')}] that sum to ${target}. Can reuse elements.`, 'Initialize', { target }));

  function backtrack(start, current, remaining) {
    if (remaining === 0) {
      results.push([...current]);
      const over = Object.fromEntries(candidates.map((_,i) => [i,'found']));
      frames.push(arrSnap(candidates, over,
        `Found! [${current.join('+')}] = ${target}.`,
        `✓ [${current.join(',')}]`,
        { combination: `[${current.join(',')}]`, sum: target },
        results.map(r=>`[${r.join(',')}]`)));
      return;
    }

    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remaining) {
        const pruneOver = {};
        for (let k = i; k < candidates.length; k++) pruneOver[k] = 'excluded';
        frames.push(arrSnap(candidates, pruneOver,
          `Prune: candidates[${i}]=${candidates[i]} > remaining=${remaining}. Skip these and beyond.`,
          'Pruned',
          { pruned: candidates[i], remaining }));
        break;
      }

      current.push(candidates[i]);
      const over = {};
      candidates.forEach((c, k) => { if (current.includes(c)) over[k] = 'in-window'; });
      over[i] = 'sorted';

      frames.push(arrSnap(candidates, over,
        `Choose ${candidates[i]}. Path: [${current.join(',')}]. Remaining = ${remaining - candidates[i]}.`,
        `Choose ${candidates[i]}`,
        { current: `[${current.join(',')}]`, remaining: remaining - candidates[i] },
        results.map(r=>`[${r.join(',')}]`)));

      backtrack(i, current, remaining - candidates[i]);
      current.pop();
    }
  }

  backtrack(0, [], target);
  frames.push(arrSnap(candidates, Object.fromEntries(candidates.map((_,i) => [i,'sorted'])),
    `Found ${results.length} combinations: ${results.map(r=>`[${r.join(',')}]`).join(', ')}`,
    'Done!',
    { total: results.length },
    results.map(r=>`[${r.join(',')}]`)));

  return frames;
}

// ─── N-Queens ─────────────────────────────────────────────────────────────────
export function generateNQueensFrames(n = 4) {
  const frames = [];
  const solutions = [];
  const board = Array(n).fill(null).map(() => Array(n).fill('.'));

  function cellState(board, r, c) {
    if (board[r][c] === 'Q') return 'found';
    if (board[r][c] === 'x') return 'excluded';
    return 'empty';
  }

  function boardSnap(board, msg, phase, vars = {}) {
    return gridSnap(
      board.map(row => row.map(cell => ({ value: cell === '.' ? '' : cell, state: cell === 'Q' ? 'optimal' : cell === 'x' ? 'current' : 'empty' }))),
      null, msg, phase, vars
    );
  }

  function isSafe(board, row, col) {
    for (let i = 0; i < row; i++) if (board[i][col] === 'Q') return false;
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) if (board[i][j] === 'Q') return false;
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) if (board[i][j] === 'Q') return false;
    return true;
  }

  frames.push(boardSnap(board, `N-Queens (n=${n}): place ${n} queens on ${n}×${n} board so no two attack each other.`, 'Initialize', { n }));

  function solve(row) {
    if (row === n) {
      solutions.push(board.map(r => [...r]));
      frames.push(boardSnap(board.map(r => [...r]),
        `Solution ${solutions.length} found! All ${n} queens placed safely.`,
        `✓ Solution ${solutions.length}`,
        { solutions: solutions.length }));
      return;
    }

    for (let col = 0; col < n; col++) {
      if (isSafe(board, row, col)) {
        board[row][col] = 'Q';
        frames.push(boardSnap(board.map(r => [...r]),
          `Row ${row}: try column ${col}. Safe! Place queen at (${row},${col}).`,
          `Place Q at (${row},${col})`,
          { row, col }));
        solve(row + 1);
        board[row][col] = '.';

        if (frames.length < 80) { // limit frames for large n
          frames.push(boardSnap(board.map(r => [...r]),
            `Backtrack from (${row},${col}). Remove queen, try next column.`,
            `Backtrack (${row},${col})`));
        }
      } else {
        if (frames.length < 80) {
          board[row][col] = 'x';
          frames.push(boardSnap(board.map(r => [...r]),
            `Row ${row}, col ${col}: UNSAFE (attacked). Skip.`,
            `Skip (${row},${col})`));
          board[row][col] = '.';
        }
      }
    }
  }

  solve(0);
  frames.push(boardSnap(board,
    `N-Queens complete. Found ${solutions.length} solution${solutions.length !== 1 ? 's' : ''} for n=${n}.`,
    'Done!',
    { solutions: solutions.length }));

  return frames;
}
