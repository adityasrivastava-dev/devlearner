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

// ─── KMP Pattern Matching ────────────────────────────────────────────────────
export function generateKMPFrames(text = 'AABAACAADAABAABA', pattern = 'AABA') {
  const frames = [];
  const n = text.length, m = pattern.length;

  // Build failure function
  const fail = Array(m).fill(0);
  for (let i = 1, j = 0; i < m; ) {
    if (pattern[i] === pattern[j]) { fail[i++] = ++j; }
    else if (j > 0)               { j = fail[j - 1]; }
    else                          { fail[i++] = 0; }
  }

  frames.push(arrSnap(text.split(''), {}, `KMP: searching for pattern "${pattern}" in text (len=${n}). Failure function: [${fail.join(',')}] avoids redundant comparisons.`, 'Initialize', { pattern, failureFunction: `[${fail.join(',')}]` }));

  const found = [];
  let j = 0;

  for (let i = 0; i < n; ) {
    const over = {};
    const winStart = i - j;
    for (let k = winStart; k < i; k++) over[k] = 'in-window';
    over[i] = 'comparing';

    frames.push(arrSnap(text.split(''), over,
      `i=${i}: text[${i}]='${text[i]}' vs pattern[${j}]='${pattern[j]}'. ${text[i] === pattern[j] ? 'Match!' : 'Mismatch.'}`,
      `Compare i=${i},j=${j}`,
      { i, j, 'text[i]': text[i], 'pattern[j]': pattern[j] }));

    if (text[i] === pattern[j]) {
      i++; j++;
      if (j === m) {
        const matchStart = i - m;
        found.push(matchStart);
        for (let k = matchStart; k < i; k++) over[k] = 'found';
        frames.push(arrSnap(text.split(''), over,
          `Pattern found at index ${matchStart}! Total matches: ${found.length}.`,
          `✓ Match at ${matchStart}`,
          { matchAt: matchStart, total: found.length }));
        j = fail[j - 1];
      }
    } else if (j > 0) {
      j = fail[j - 1];
      frames.push(arrSnap(text.split(''), over,
        `Mismatch. Use failure function: j = fail[${j}] = ${fail[j]}. Avoid re-scanning.`,
        `Fallback j→${j}`,
        { j, failureUsed: true }));
    } else {
      i++;
    }
  }

  const finalOver = {};
  found.forEach(start => { for (let k = start; k < start + m; k++) finalOver[k] = 'found'; });
  frames.push(arrSnap(text.split(''), finalOver,
    `KMP complete. Found ${found.length} occurrence${found.length !== 1 ? 's' : ''} at: [${found.join(', ')}]`,
    'Done!',
    { occurrences: found.length, positions: found.join(', ') }));

  return frames;
}

// ─── Two Sum (Hash Table) ────────────────────────────────────────────────────
export function generateTwoSumHashFrames(nums = [2, 7, 11, 15], target = 9) {
  const frames = [];
  const map = {};

  frames.push(arrSnap(nums, {}, `Two Sum: find indices where nums[i]+nums[j]==${target}. Use hash map to store complement lookup. O(n).`, 'Initialize', { target }));

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    const over = {};
    for (let k = 0; k < i; k++) over[k] = 'in-window';
    over[i] = 'comparing';

    frames.push(arrSnap(nums, over,
      `i=${i}, nums[i]=${nums[i]}. Complement = ${target} - ${nums[i]} = ${complement}. Is ${complement} in map? ${map[complement] != null ? 'YES!' : 'No.'}`,
      `Check ${nums[i]}`,
      { i, 'nums[i]': nums[i], complement, map: JSON.stringify(map) }));

    if (map[complement] != null) {
      const j = map[complement];
      const foundOver = {};
      foundOver[j] = 'found';
      foundOver[i] = 'found';
      frames.push(arrSnap(nums, foundOver,
        `FOUND! nums[${j}]=${nums[j]} + nums[${i}]=${nums[i]} = ${target}. Return [${j}, ${i}].`,
        `✓ [${j}, ${i}]`,
        { result: `[${j}, ${i}]`, sum: nums[j] + nums[i] }));
      return frames;
    }

    map[nums[i]] = i;
    frames.push(arrSnap(nums, { ...over, [i]: 'sorted' },
      `Store map[${nums[i]}] = ${i}. Map: ${JSON.stringify(map)}`,
      `Store ${nums[i]}→${i}`,
      { stored: `${nums[i]}→${i}`, map: JSON.stringify(map) }));
  }

  frames.push(arrSnap(nums, Object.fromEntries(nums.map((_,i) => [i,'excluded'])),
    `No pair found. Return [-1, -1].`,
    'Not Found',
    { result: '[-1, -1]' }));

  return frames;
}

// ─── Group Anagrams ───────────────────────────────────────────────────────────
export function generateGroupAnagramsFrames(words = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']) {
  const frames = [];
  const groups = {};

  frames.push(arrSnap(words, {}, `Group Anagrams: words that are anagrams of each other share the same sorted key. E.g., "eat"→"aet".`, 'Initialize'));

  for (let i = 0; i < words.length; i++) {
    const key = words[i].split('').sort().join('');
    const over = {};
    for (let k = 0; k < i; k++) over[k] = Object.values(groups).flat().includes(words[k]) ? 'in-window' : 'default';
    over[i] = 'comparing';

    frames.push(arrSnap(words, over,
      `"${words[i]}" → sorted key = "${key}". Group key "${key}" exists? ${groups[key] ? 'YES' : 'No, create new group.'}`,
      `Key "${key}"`,
      { word: words[i], key, groups: Object.entries(groups).map(([k,v]) => `${k}:[${v.join(',')}]`).join(' | ') }));

    if (!groups[key]) groups[key] = [];
    groups[key].push(words[i]);

    const grouped = Object.values(groups).flat();
    const over2 = {};
    grouped.forEach(w => { const idx = words.indexOf(w); if (idx !== -1) over2[idx] = 'sorted'; });
    over2[i] = 'found';

    frames.push(arrSnap(words, over2,
      `Added "${words[i]}" to group "${key}". Groups: ${Object.entries(groups).map(([k,v]) => `[${v.join(',')}]`).join(' | ')}`,
      `Group updated`,
      { groups: Object.entries(groups).map(([k,v]) => `${k}:[${v.join(',')}]`).join(' | ') }));
  }

  frames.push(arrSnap(words, Object.fromEntries(words.map((_,i) => [i,'sorted'])),
    `Grouped: ${Object.values(groups).map(g => `[${g.join(',')}]`).join(', ')}`,
    'Done!',
    { groups: Object.keys(groups).length }));

  return frames;
}

// ─── Minimum Window Substring ─────────────────────────────────────────────────
export function generateMinWindowSubstringFrames(s = 'ADOBECODEBANC', t = 'ABC') {
  const frames = [];
  const n = s.length;

  const need = {};
  for (const c of t) need[c] = (need[c] || 0) + 1;
  let have = 0, required = Object.keys(need).length;

  const window = {};
  let left = 0, minLen = Infinity, minStart = 0;

  frames.push(arrSnap(s.split(''), {},
    `Min Window Substring: find smallest window in "${s}" containing all chars of "${t}". Use sliding window + freq map.`,
    'Initialize',
    { t, need: JSON.stringify(need) }));

  for (let right = 0; right < n; right++) {
    const c = s[right];
    window[c] = (window[c] || 0) + 1;
    if (need[c] && window[c] === need[c]) have++;

    const over = {};
    for (let k = left; k <= right; k++) over[k] = 'in-window';
    over[right] = 'comparing';

    frames.push(arrSnap(s.split(''), over,
      `Expand right to ${right} ('${c}'). Have ${have}/${required} required chars.`,
      `Expand r=${right}`,
      { left, right, have, required, window: JSON.stringify(window) }));

    while (have === required) {
      const len = right - left + 1;
      if (len < minLen) {
        minLen = len; minStart = left;
      }

      const shrinkOver = {};
      for (let k = left; k <= right; k++) shrinkOver[k] = k >= left && k <= right ? 'found' : 'default';

      frames.push(arrSnap(s.split(''), shrinkOver,
        `Window "${s.slice(left, right+1)}" (len=${len}) contains all chars! Try shrinking from left.`,
        `Valid window len=${len}`,
        { window: s.slice(left, right+1), minSoFar: s.slice(minStart, minStart+minLen) }));

      const lc = s[left];
      window[lc]--;
      if (need[lc] && window[lc] < need[lc]) have--;
      left++;
    }
  }

  const finalOver = {};
  if (minLen !== Infinity) {
    for (let k = minStart; k < minStart + minLen; k++) finalOver[k] = 'found';
  }

  frames.push(arrSnap(s.split(''), finalOver,
    minLen === Infinity
      ? `No window found containing all chars of "${t}".`
      : `Min window = "${s.slice(minStart, minStart + minLen)}" (len=${minLen}) at [${minStart},${minStart+minLen-1}].`,
    'Done!',
    { result: minLen === Infinity ? '' : s.slice(minStart, minStart + minLen) }));

  return frames;
}
