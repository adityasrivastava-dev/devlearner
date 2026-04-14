function gridSnap(grid, current, msg, phase, vars = {}) {
  return { type: 'grid', grid: grid.map(r => r.map(c => ({ ...c }))), current, message: msg, variables: vars, phase };
}

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

// ─── Coin Change (min coins) ──────────────────────────────────────────────────
export function generateCoinChangeFrames(coins = [1, 5, 6, 9], amount = 11) {
  const frames = [];
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  frames.push(arrSnap([...dp].map(v => v === Infinity ? '∞' : v), { 0: 'sorted' },
    `Coin Change: dp[i] = min coins to make amount i. dp[0]=0 (base case). Coins: [${coins.join(',')}].`,
    'Initialize', { coins: `[${coins.join(',')}]`, amount }));

  for (let a = 1; a <= amount; a++) {
    const depOver = {};
    depOver[a] = 'current';

    frames.push(arrSnap([...dp].map(v => v === Infinity ? '∞' : v), depOver,
      `Compute dp[${a}]. Try each coin.`,
      `dp[${a}]`, { amount: a }));

    for (const coin of coins) {
      if (a - coin >= 0 && dp[a - coin] + 1 < dp[a]) {
        dp[a] = dp[a - coin] + 1;

        const over = {};
        for (let k = 0; k < a; k++) if (dp[k] !== Infinity) over[k] = 'dependency';
        over[a - coin] = 'dependency';
        over[a]        = 'optimal';

        frames.push(arrSnap([...dp].map(v => v === Infinity ? '∞' : v), over,
          `Using coin ${coin}: dp[${a-coin}]+1 = ${dp[a]}. Better! dp[${a}] = ${dp[a]}.`,
          `Use coin ${coin}`, { coin, 'dp[a-coin]': dp[a-coin], 'dp[a]': dp[a] }));
      }
    }
  }

  const finalOver = {};
  for (let i = 0; i <= amount; i++) finalOver[i] = dp[i] === Infinity ? 'excluded' : 'sorted';
  frames.push(arrSnap([...dp].map(v => v === Infinity ? '∞' : v), finalOver,
    `Min coins for amount ${amount} = ${dp[amount] === Infinity ? 'impossible' : dp[amount]}.`,
    'Done!', { result: dp[amount] === Infinity ? 'impossible' : dp[amount] }));

  return frames;
}

// ─── Longest Increasing Subsequence ──────────────────────────────────────────
export function generateLISFrames(array = [10, 9, 2, 5, 3, 7, 101, 18]) {
  const frames = [];
  const n = array.length;
  const dp = Array(n).fill(1);

  frames.push(arrSnap([...array], {}, `LIS: dp[i] = length of longest increasing subsequence ending at index i. All start at 1.`, 'Initialize'));

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      const over = {};
      over[j] = 'dependency';
      over[i] = 'current';
      for (let k = 0; k < j; k++) if (dp[k] > 1) over[k] = 'in-window';

      frames.push(arrSnap([...array], over,
        `Compare arr[${j}]=${array[j]} < arr[${i}]=${array[i]}? ${array[j] < array[i] ? 'Yes' : 'No'}. dp[${i}] could become dp[${j}]+1=${dp[j]+1}.`,
        `i=${i},j=${j}`, { 'arr[j]': array[j], 'arr[i]': array[i], 'dp[j]': dp[j] }));

      if (array[j] < array[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        const upOver = {};
        over[i] = 'optimal';
        frames.push(arrSnap([...array], { ...over, [i]: 'optimal' },
          `Update! dp[${i}] = ${dp[i]}. LIS of length ${dp[i]} ends at arr[${i}]=${array[i]}.`,
          `dp[${i}]=${dp[i]}`, { updated: dp[i] }));
      }
    }
  }

  const maxLIS = Math.max(...dp);
  const maxIdx = dp.indexOf(maxLIS);
  const finalOver = Object.fromEntries(dp.map((v, i) => [i, v === maxLIS ? 'found' : v > 1 ? 'sorted' : 'default']));
  frames.push(arrSnap([...array], finalOver,
    `LIS length = ${maxLIS}. Longest increasing subsequence ends at arr[${maxIdx}]=${array[maxIdx]}.`,
    'Done!', { LIS: maxLIS }));

  return frames;
}

// ─── Edit Distance (Levenshtein) ──────────────────────────────────────────────
export function generateEditDistanceFrames(s1 = 'SUNDAY', s2 = 'SATURDAY') {
  const m = s1.length, n = s2.length;
  const frames = [];

  const dp = Array(m + 1).fill(null).map((_, i) =>
    Array(n + 1).fill(null).map((_, j) => ({
      value: i === 0 ? j : j === 0 ? i : 0,
      state: i === 0 || j === 0 ? 'filled' : 'empty',
    }))
  );

  frames.push(gridSnap(dp.map(r => r.map(c => ({ ...c }))), null,
    `Edit Distance: dp[i][j] = min ops to convert "${s1.slice(0,1)}..." to "${s2.slice(0,1)}...". Base cases filled.`,
    'Base Cases', { s1, s2 }));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      let val, opName;
      if (s1[i - 1] === s2[j - 1]) {
        val = dp[i-1][j-1].value;
        opName = 'Match (no op)';
      } else {
        val = 1 + Math.min(dp[i-1][j-1].value, dp[i-1][j].value, dp[i][j-1].value);
        opName = `min(replace=${dp[i-1][j-1].value+1}, delete=${dp[i-1][j].value+1}, insert=${dp[i][j-1].value+1})`;
      }
      dp[i][j] = { value: val, state: 'filled' };

      const snap = dp.map((row, ri) =>
        row.map((cell, ci) => ({
          ...cell,
          state: ri === i && ci === j ? 'optimal'
            : (ri === i-1 && ci === j-1) || (ri === i-1 && ci === j) || (ri === i && ci === j-1) ? 'dependency'
            : cell.state,
        }))
      );

      frames.push(gridSnap(snap, [i, j],
        `dp[${i}][${j}]: s1[${i-1}]='${s1[i-1]}' vs s2[${j-1}]='${s2[j-1]}'. ${s1[i-1]===s2[j-1]?'Match':'No match'}. ${opName} → ${val}.`,
        `[${i}][${j}]=${val}`, { val }));
    }
  }

  frames.push(gridSnap(dp, null,
    `Edit distance between "${s1}" and "${s2}" = dp[${m}][${n}] = ${dp[m][n].value}`,
    'Done!', { result: dp[m][n].value }));

  return frames;
}

// ─── Subset Sum ───────────────────────────────────────────────────────────────
export function generateSubsetSumFrames(nums = [2, 3, 7, 8, 10], target = 11) {
  const n = nums.length;
  const frames = [];

  const dp = Array(n + 1).fill(null).map((_, i) =>
    Array(target + 1).fill(null).map((_, j) => ({
      value: i === 0 ? (j === 0 ? 'T' : 'F') : j === 0 ? 'T' : '-',
      state: i === 0 ? 'filled' : j === 0 ? 'filled' : 'empty',
    }))
  );

  frames.push(gridSnap(dp.map(r => r.map(c => ({...c}))), null,
    `Subset Sum: can we pick numbers from [${nums.join(',')}] that sum to ${target}? dp[i][j] = can we form sum j using first i numbers.`,
    'Initialize', { nums: `[${nums.join(',')}]`, target }));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= target; j++) {
      const exclude = dp[i-1][j].value === 'T';
      const include = j >= nums[i-1] && dp[i-1][j-nums[i-1]].value === 'T';
      dp[i][j] = { value: (exclude || include) ? 'T' : 'F', state: 'filled' };

      const snap = dp.map((row, ri) => row.map((cell, ci) => ({
        ...cell,
        state: ri === i && ci === j ? (dp[i][j].value === 'T' ? 'optimal' : 'current')
          : ri === i-1 && (ci === j || ci === j - nums[i-1]) ? 'dependency'
          : cell.state,
      })));

      if (dp[i][j].value === 'T') {
        frames.push(gridSnap(snap, [i, j],
          `dp[${i}][${j}]: num=${nums[i-1]}. ${exclude ? 'Exclude works' : ''} ${include ? `Include works (dp[${i-1}][${j-nums[i-1]}]=T)` : ''}. → TRUE`,
          `T at [${i}][${j}]`, { num: nums[i-1], sum: j }));
      }
    }
  }

  frames.push(gridSnap(dp, null,
    `dp[${n}][${target}] = ${dp[n][target].value}. Can form sum ${target}: ${dp[n][target].value === 'T' ? 'YES' : 'NO'}.`,
    'Done!', { result: dp[n][target].value }));

  return frames;
}
