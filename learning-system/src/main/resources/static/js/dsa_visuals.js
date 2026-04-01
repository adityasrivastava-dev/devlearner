/* ═══════════════════════════════════════════════════════════════════════════
   dsa_visuals.js — Interactive DSA Visual Learning Tools
   Features:
     · Complexity growth chart (O(1) through O(n²))
     · Log₂ visual explainer (how binary search halves the space)
     · Array vs Linked List memory model
     · Renders inside the Visual tab for DSA topics
═══════════════════════════════════════════════════════════════════════════ */

const DSAVisuals = (() => {

  // ── Theme colors matching the app ──────────────────────────────────────────
  const C = {
    bg:      '#1a1a1a',
    bg2:     '#282828',
    border:  '#3e3e3e',
    text:    '#eff1f6',
    text2:   '#a8afbf',
    text3:   '#666c7c',
    accent:  '#00b8a3',
    blue:    '#5b8af5',
    yellow:  '#ffb800',
    red:     '#ef4743',
    purple:  '#a78bfa',
    green:   '#22c55e',
  };

  // ── Complexity functions ────────────────────────────────────────────────────
  const COMPLEXITIES = [
    { label: 'O(1)',       fn: () => 1,                      color: C.accent,  desc: 'Constant — HashMap get, array access' },
    { label: 'O(log n)',   fn: n => Math.log2(n),            color: C.blue,    desc: 'Logarithmic — Binary Search' },
    { label: 'O(n)',       fn: n => n,                        color: C.yellow,  desc: 'Linear — single loop, linear search' },
    { label: 'O(n log n)', fn: n => n * Math.log2(n),        color: C.purple,  desc: 'Linearithmic — Merge Sort, Quick Sort' },
    { label: 'O(n²)',      fn: n => n * n,                    color: C.red,     desc: 'Quadratic — nested loops, Bubble Sort' },
  ];

  // ── Main render function ────────────────────────────────────────────────────
  function render(container, topicTitle) {
    if (!container) return;
    const key = (topicTitle || '').toLowerCase();
    if (key.includes('binary search'))                               renderLog2Explainer(container);
    else if (key.includes('hash') || key.includes('two sum'))        renderHashmapVisual(container);
    else if (key.includes('sort'))                                   renderSortingComparison(container);
    else if (key.includes('two pointer'))                            renderWindowVisual(container, key);
    else if (key.includes('sliding window'))                         renderWindowVisual(container, key);
    else if (key.includes('stack'))                                  renderStackVisual(container);
    else if (key.includes('queue') || key.includes('bfs'))           renderQueueVisual(container);
    else if (key.includes('linked list'))                            renderLinkedListVisual(container);
    else if (key.includes('recursion') || key.includes('fibonacci')) renderRecursionVisual(container);
    else if (key.includes('prefix sum'))                             renderPrefixSumVisual(container);
    else if (key.includes('tree') || key.includes('bst'))            renderTreeVisual(container);
    else if (key.includes('graph') || key.includes('dfs'))           renderGraphVisual(container);
    else if (key.includes('dynamic') || key.includes(' dp'))         renderDPVisual(container);
    else if (key.includes('heap') || key.includes('priority'))       renderHeapVisual(container);
    else if (key.includes('greedy'))                                 renderGreedyVisual(container);
    else if (key.includes('backtrack'))                              renderBacktrackVisual(container);
    else if (key.includes('trie'))                                   renderTrieVisual(container);
    else if (key.includes('union find') || key.includes('disjoint')) renderUnionFindVisual(container);
    else if (key.includes('monotonic'))                              renderMonotonicVisual(container);
    else if (key.includes('bit'))                                    renderBitVisual(container);
    else if (key.includes('array'))                                  renderArrayVisual(container);
    else                                                             renderComplexityChart(container);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  COMPLEXITY GROWTH CHART
  // ══════════════════════════════════════════════════════════════════════════
  function renderComplexityChart(container) {
    const W = Math.min(container.clientWidth - 32, 720);
    const H = 320;
    const PAD = { top: 20, right: 20, bottom: 50, left: 60 };

    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">📈 Algorithm Complexity Growth</div>
        <div class="dv-subtitle">How operations scale as input size n grows</div>
      </div>
      <div class="dv-controls">
        <label class="dv-label">n = <span id="dvN">50</span></label>
        <input type="range" id="dvSlider" min="4" max="100" value="50" class="dv-slider"/>
      </div>
      <canvas id="dvCanvas" width="${W}" height="${H}" style="display:block;max-width:100%"></canvas>
      <div id="dvLegend" class="dv-legend"></div>
      <div id="dvInsight" class="dv-insight"></div>`;

    const slider = container.querySelector('#dvSlider');
    slider.addEventListener('input', () => drawChart(parseInt(slider.value)));
    drawChart(50);
  }

  function drawChart(nMax) {
    const canvas = document.getElementById('dvCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const PAD = { top: 20, right: 20, bottom: 50, left: 60 };
    const CW = W - PAD.left - PAD.right;
    const CH = H - PAD.top - PAD.bottom;

    document.getElementById('dvN').textContent = nMax;

    // Compute max y (cap O(n²) for visibility)
    const maxY = Math.min(nMax * nMax, nMax * nMax);
    const scaleY = CH / (nMax * 1.1);
    const scaleX = CW / nMax;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = C.bg2;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 0.5;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD.top + CH - (i / gridLines) * CH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + CW, y);
      ctx.stroke();
      // Y labels
      const val = Math.round((i / gridLines) * nMax);
      ctx.fillStyle = C.text3;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val, PAD.left - 6, y + 3);
    }

    // X axis labels
    for (let x = 0; x <= nMax; x += Math.ceil(nMax / 5)) {
      const px = PAD.left + x * scaleX;
      ctx.fillStyle = C.text3;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(x, px, H - PAD.bottom + 18);
    }

    // Axis labels
    ctx.fillStyle = C.text2;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('n (input size)', PAD.left + CW / 2, H - 8);
    ctx.save();
    ctx.translate(14, PAD.top + CH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('operations', 0, 0);
    ctx.restore();

    // Plot each complexity line
    const capY = nMax * 1.05; // visual cap
    COMPLEXITIES.forEach(({ label, fn, color }) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      let first = true;
      for (let n = 1; n <= nMax; n++) {
        const rawY = fn(n);
        const y = Math.min(rawY, capY);
        const px = PAD.left + n * scaleX;
        const py = PAD.top + CH - y * scaleY;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // End label
      const lastN = nMax;
      const lastY = Math.min(fn(lastN), capY);
      const lastPx = PAD.left + lastN * scaleX - 4;
      const lastPy = PAD.top + CH - lastY * scaleY;
      if (lastPy > PAD.top + 5 && lastPy < PAD.top + CH - 5) {
        ctx.fillStyle = color;
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(label, lastPx, lastPy - 4);
      }
    });

    // Axes
    ctx.strokeStyle = C.text3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + CH);
    ctx.lineTo(PAD.left + CW, PAD.top + CH);
    ctx.stroke();

    // Update legend
    const legend = document.getElementById('dvLegend');
    if (legend) {
      legend.innerHTML = COMPLEXITIES.map(({ label, fn, color, desc }) => {
        const val = fn(nMax);
        const displayVal = val > 9999 ? '>' + (9999).toLocaleString() : Math.round(val).toLocaleString();
        return `<div class="dv-legend-item">
          <span class="dv-dot" style="background:${color}"></span>
          <span class="dv-l-label" style="color:${color}">${label}</span>
          <span class="dv-l-val">at n=${nMax}: <strong>${displayVal}</strong></span>
          <span class="dv-l-desc">${desc}</span>
        </div>`;
      }).join('');
    }

    // Key insight
    const insight = document.getElementById('dvInsight');
    if (insight) {
      const logVal = Math.round(Math.log2(nMax));
      insight.innerHTML = `
        <span class="dv-insight-icon">💡</span>
        <strong>Key insight at n=${nMax}:</strong>
        O(log n) only needs <strong style="color:${C.blue}">${logVal} steps</strong> vs
        O(n) needing <strong style="color:${C.yellow}">${nMax} steps</strong> vs
        O(n²) needing <strong style="color:${C.red}">${(nMax*nMax).toLocaleString()} steps</strong>.
        This is why Binary Search dominates Linear Search.`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  LOG₂ BINARY SEARCH EXPLAINER
  // ══════════════════════════════════════════════════════════════════════════
  function renderLog2Explainer(container) {
    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🔢 Why Binary Search is O(log₂ n)</div>
        <div class="dv-subtitle">Each step throws out HALF the remaining elements</div>
      </div>
      <div class="dv-controls" style="gap:12px">
        <label class="dv-label">Array size n = <span id="bsN">64</span></label>
        <input type="range" id="bsSlider" min="2" max="1024" value="64" class="dv-slider"/>
      </div>
      <div id="bsViz" class="bs-viz"></div>
      <div id="bsChart" style="margin-top:16px"></div>`;

    const slider = container.querySelector('#bsSlider');
    slider.addEventListener('input', () => drawLog2(parseInt(slider.value)));
    drawLog2(64);
  }

  function drawLog2(n) {
    const nEl = document.getElementById('bsN');
    const viz = document.getElementById('bsViz');
    const chart = document.getElementById('bsChart');
    if (!nEl || !viz) return;
    nEl.textContent = n;

    const steps = Math.ceil(Math.log2(n));

    // Step-halving visualization
    let current = n;
    let rows = [];
    for (let s = 0; s <= steps; s++) {
      rows.push({ step: s, size: current, width: Math.max(1, Math.round(current)) });
      current = Math.ceil(current / 2);
    }

    viz.innerHTML = `
      <div class="bs-table">
        <div class="bs-row bs-header">
          <div class="bs-cell-step">Step</div>
          <div class="bs-cell-size">Elements left</div>
          <div class="bs-cell-bar">Search space</div>
          <div class="bs-cell-formula">Formula</div>
        </div>
        ${rows.map(r => `
          <div class="bs-row ${r.step === steps ? 'bs-last' : ''}">
            <div class="bs-cell-step" style="color:${r.step === 0 ? C.yellow : r.step === steps ? C.accent : C.text2}">${r.step}</div>
            <div class="bs-cell-size"><strong style="color:${C.accent}">${r.size}</strong></div>
            <div class="bs-cell-bar">
              <div class="bs-bar-bg">
                <div class="bs-bar-fill" style="width:${Math.max(1,(r.size/n)*100)}%;background:${
                  r.step === steps ? C.accent : `hsl(${200 - r.step * 15},70%,50%)`
                }"></div>
              </div>
            </div>
            <div class="bs-cell-formula" style="color:${C.text3}">
              ${r.step === 0 ? `n = ${n}` : `${n} / 2<sup>${r.step}</sup> = ${r.size}`}
            </div>
          </div>`).join('')}
      </div>
      <div class="bs-conclusion">
        <span style="color:${C.accent};font-weight:800;font-size:15px">
          🎯 ${n} elements found in at most <strong>${steps}</strong> comparisons
        </span>
        <span style="color:${C.text3};font-size:12px;margin-left:12px">
          because log₂(${n}) = ${steps}
        </span>
      </div>`;

    // Mini complexity comparison for this n
    chart.innerHTML = `
      <div class="dv-header" style="margin-top:0">
        <div class="dv-subtitle">Comparison at n = ${n}</div>
      </div>
      <div class="bs-compare-grid">
        ${[
          { algo: 'Linear Search', ops: n, color: C.yellow, note: 'O(n)' },
          { algo: 'Binary Search', ops: steps, color: C.accent, note: `O(log₂ n) = ${steps}` },
          { algo: 'HashMap Lookup', ops: 1, color: C.blue, note: 'O(1) avg' },
        ].map(item => `
          <div class="bs-compare-card" style="border-color:${item.color}22">
            <div class="bs-compare-algo">${item.algo}</div>
            <div class="bs-compare-ops" style="color:${item.color}">${item.ops.toLocaleString()}</div>
            <div class="bs-compare-note">${item.note}</div>
            <div class="bs-compare-bar">
              <div style="height:4px;border-radius:2px;background:${item.color};width:${Math.min(100, (item.ops / n) * 100)}%"></div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  HASHMAP VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderHashmapVisual(container) {
    const buckets = 8;
    const data = [
      { key: 'apple',  hash: 3, val: 42 },
      { key: 'banana', hash: 6, val: 17 },
      { key: 'cherry', hash: 1, val: 99 },
      { key: 'date',   hash: 3, val: 55 }, // collision with apple
      { key: 'elderberry', hash: 5, val: 7 },
    ];

    const bucketContents = Array.from({ length: buckets }, () => []);
    data.forEach(item => bucketContents[item.hash].push(item));

    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🗺 HashMap: How O(1) lookup works</div>
        <div class="dv-subtitle">hash(key) % capacity → direct bucket access</div>
      </div>
      <div class="hm-layout">
        <div class="hm-keys">
          <div class="hm-section-label">Keys</div>
          ${data.map(item => `
            <div class="hm-key-item">
              <span class="hm-key">"${item.key}"</span>
              <span class="hm-arrow">→ hash % ${buckets} = <strong style="color:${C.accent}">${item.hash}</strong></span>
            </div>`).join('')}
        </div>
        <div class="hm-buckets">
          <div class="hm-section-label">Buckets [0..${buckets-1}]</div>
          ${bucketContents.map((b, i) => `
            <div class="hm-bucket ${b.length > 1 ? 'hm-collision' : b.length === 1 ? 'hm-filled' : ''}">
              <span class="hm-bucket-idx">[${i}]</span>
              <div class="hm-bucket-chain">
                ${b.length === 0 ? '<span class="hm-empty">null</span>' :
                  b.map(item => `<span class="hm-entry">${item.key}→${item.val}</span>`).join(' → ')}
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="hm-insight">
        <div class="dv-insight">
          <span class="dv-insight-icon">💡</span>
          <strong>O(1) lookup:</strong> To find "banana" → compute hash(banana) % 8 = 6 → go directly to bucket[6] → found in 1 step.
          <strong style="color:${C.yellow}"> Collision</strong> at bucket[3]: "apple" and "date" both hash to 3 — stored as a linked list.
          Worst case degrades to O(n) if all keys hash to same bucket.
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SORTING COMPARISON VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderSortingComparison(container) {
    const data = [
      { algo: 'Bubble Sort',    time: 'O(n²)',      space: 'O(1)',      stable: true,  color: C.red,    when: 'Never in production' },
      { algo: 'Selection Sort', time: 'O(n²)',      space: 'O(1)',      stable: false, color: C.red,    when: 'Only for educational use' },
      { algo: 'Insertion Sort', time: 'O(n²)',      space: 'O(1)',      stable: true,  color: C.yellow, when: 'Small arrays (n < 20)' },
      { algo: 'Merge Sort',     time: 'O(n log n)', space: 'O(n)',      stable: true,  color: C.accent, when: 'Stable sort, linked lists' },
      { algo: 'Quick Sort',     time: 'O(n log n)', space: 'O(log n)', stable: false, color: C.blue,   when: 'General purpose (Arrays.sort)' },
      { algo: 'Heap Sort',      time: 'O(n log n)', space: 'O(1)',      stable: false, color: C.purple, when: 'Memory constrained, O(1) space' },
      { algo: 'Counting Sort',  time: 'O(n + k)',   space: 'O(k)',      stable: true,  color: C.green,  when: 'Integers in known range' },
    ];

    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">📊 Sorting Algorithm Comparison</div>
        <div class="dv-subtitle">Time complexity, stability, and when to use each</div>
      </div>
      <div class="sort-table">
        <div class="sort-header">
          <div>Algorithm</div><div>Time</div><div>Space</div><div>Stable?</div><div>Use When</div>
        </div>
        ${data.map(row => `
          <div class="sort-row">
            <div class="sort-algo" style="color:${row.color};font-weight:700">${row.algo}</div>
            <div class="sort-time">
              <span class="sort-badge" style="background:${row.color}18;color:${row.color};border:1px solid ${row.color}33">
                ${row.time}
              </span>
            </div>
            <div style="font-size:11px;font-family:var(--font-code,monospace);color:${C.text2}">${row.space}</div>
            <div style="font-size:12px">${row.stable ? `<span style="color:${C.accent}">✓ Yes</span>` : `<span style="color:${C.text3}">✗ No</span>`}</div>
            <div style="font-size:11px;color:${C.text2}">${row.when}</div>
          </div>`).join('')}
      </div>
      <div class="dv-insight" style="margin-top:12px">
        <span class="dv-insight-icon">💡</span>
        <strong>In Java:</strong> <code>Arrays.sort(int[])</code> uses Dual-Pivot QuickSort (O(n log n) avg).
        <code>Collections.sort(List)</code> uses TimSort — a hybrid of Merge + Insertion Sort (stable, O(n log n)).
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SLIDING WINDOW / TWO POINTER VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderWindowVisual(container, key) {
    const arr = [2, 1, 5, 1, 3, 2, 7, 4, 1];
    const k = 3;
    const title = key.includes('sliding') ? 'Sliding Window' : 'Two Pointer';
    const icon = key.includes('sliding') ? '🪟' : '↔';

    let steps = [];
    if (key.includes('two pointer')) {
      // Sorted array pair sum
      const sorted = [1, 2, 3, 5, 7, 9, 11];
      const target = 12;
      let l = 0, r = sorted.length - 1;
      while (l < r) {
        const sum = sorted[l] + sorted[r];
        steps.push({ arr: sorted, l, r, sum, target, note: `${sorted[l]}+${sorted[r]}=${sum} ${sum===target?'✓ Found!':sum<target?'< target, l++':'> target, r--'}`, done: sum === target });
        if (sum === target) break;
        if (sum < target) l++; else r--;
      }
    } else {
      // Sliding window max sum
      let windowSum = arr.slice(0, k).reduce((a, b) => a + b, 0);
      let maxSum = windowSum;
      steps.push({ arr, l: 0, r: k-1, sum: windowSum, maxSum, note: `Initial window sum = ${windowSum}` });
      for (let i = k; i < arr.length; i++) {
        windowSum = windowSum - arr[i - k] + arr[i];
        if (windowSum > maxSum) maxSum = windowSum;
        steps.push({ arr, l: i-k+1, r: i, sum: windowSum, maxSum, note: `+${arr[i]} -${arr[i-k]} = ${windowSum}${windowSum===maxSum?' ← new max':''}` });
      }
    }

    let step = 0;
    const renderStep = () => {
      const s = steps[step];
      const arrDisplay = s.arr.map((v, i) => {
        const inWindow = i >= s.l && i <= s.r;
        const isLeft   = i === s.l;
        const isRight  = i === s.r;
        return `<div class="win-cell ${inWindow ? 'win-active' : ''}" style="${
          isLeft  ? 'border-left: 2px solid ' + C.accent + ';' :
          isRight ? 'border-right: 2px solid ' + C.accent + ';' : ''
        }">
          <div class="win-val">${v}</div>
          <div class="win-idx">${i}</div>
          ${isLeft  ? `<div class="win-ptr" style="color:${C.accent}">L</div>` : ''}
          ${isRight ? `<div class="win-ptr" style="color:${C.blue}">R</div>` : ''}
        </div>`;
      }).join('');

      const viz = document.getElementById('winViz');
      const note = document.getElementById('winNote');
      const counter = document.getElementById('winCounter');
      if (viz)  viz.innerHTML = `<div class="win-array">${arrDisplay}</div>`;
      if (note) note.textContent = s.note;
      if (counter) counter.textContent = `Step ${step + 1} / ${steps.length}`;

      const prevBtn = document.getElementById('winPrev');
      const nextBtn = document.getElementById('winNext');
      if (prevBtn) prevBtn.disabled = step === 0;
      if (nextBtn) nextBtn.disabled = step === steps.length - 1;
    };

    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">${icon} ${title} — Step-by-Step</div>
        <div class="dv-subtitle">Watch how the window slides through the array in O(n)</div>
      </div>
      <div id="winViz" class="win-viz"></div>
      <div style="display:flex;align-items:center;gap:10px;margin:10px 0">
        <button id="winPrev" class="dv-btn" disabled>‹ Prev</button>
        <button id="winNext" class="dv-btn">Next ›</button>
        <span id="winCounter" style="font-size:12px;color:${C.text3}"></span>
        <span id="winNote" style="font-size:12px;color:${C.text2};flex:1"></span>
      </div>
      <div class="dv-insight">
        <span class="dv-insight-icon">💡</span>
        Each element enters the window <strong>once</strong> and exits <strong>once</strong>.
        Total operations = 2n → <strong style="color:${C.accent}">O(n)</strong> instead of O(n×k).
      </div>`;

    renderStep();
    document.getElementById('winPrev')?.addEventListener('click', () => { step = Math.max(0, step-1); renderStep(); });
    document.getElementById('winNext')?.addEventListener('click', () => { step = Math.min(steps.length-1, step+1); renderStep(); });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STACK VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderStackVisual(container) {
    const ops = [
      { op: 'push(3)',  state: [3],       note: 'Push 3 onto stack' },
      { op: 'push(7)',  state: [3, 7],    note: 'Push 7 — now on top' },
      { op: 'push(1)',  state: [3, 7, 1], note: 'Push 1 — LIFO: 1 is newest' },
      { op: 'peek()',   state: [3, 7, 1], note: 'peek() → 1 (top, not removed)' },
      { op: 'pop()',    state: [3, 7],    note: 'pop() → 1 removed (last in, first out)' },
      { op: 'pop()',    state: [3],       note: 'pop() → 7 removed' },
      { op: 'isEmpty()',state: [3],       note: 'isEmpty() → false' },
      { op: 'pop()',    state: [],        note: 'pop() → 3 removed — stack empty!' },
    ];

    let step = 0;
    const renderStep = () => {
      const s = ops[step];
      const viz = document.getElementById('stackViz');
      const opEl = document.getElementById('stackOp');
      const noteEl = document.getElementById('stackNote');
      const ctr = document.getElementById('stackCtr');
      if (!viz) return;

      viz.innerHTML = `
        <div class="stack-tower">
          <div class="stack-label">TOP</div>
          ${s.state.length === 0 ? '<div class="stack-empty">empty</div>' :
            [...s.state].reverse().map((v, i) => `
              <div class="stack-item ${i === 0 ? 'stack-top' : ''}" style="animation:${i===0?'stackPop .2s ease':'none'}">
                ${v}
              </div>`).join('')}
          <div class="stack-base">───</div>
          <div class="stack-label">BOTTOM</div>
        </div>`;

      if (opEl)   opEl.textContent   = s.op;
      if (noteEl) noteEl.textContent = s.note;
      if (ctr)    ctr.textContent    = `${step+1}/${ops.length}`;

      const p = document.getElementById('stackPrev');
      const n = document.getElementById('stackNext');
      if (p) p.disabled = step === 0;
      if (n) n.disabled = step === ops.length - 1;
    };

    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">📦 Stack — LIFO Visual</div>
        <div class="dv-subtitle">Last In, First Out — like a pile of plates</div>
      </div>
      <div style="display:grid;grid-template-columns:200px 1fr;gap:16px;align-items:start">
        <div id="stackViz"></div>
        <div>
          <div style="font-size:11px;font-weight:700;color:${C.text3};text-transform:uppercase;margin-bottom:6px">Operations</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            ${ops.map((o, i) => `<div class="stack-op-row" id="sop-${i}" onclick="document.getElementById('stackCtr'); step=${i}"
              style="padding:5px 10px;border-radius:4px;font-family:monospace;font-size:12px;cursor:pointer;border:1px solid transparent">
              <span style="color:${C.text3};font-size:10px">${i+1}.</span>
              <span style="color:${C.accent}">${o.op}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
        <button id="stackPrev" class="dv-btn" disabled>‹ Prev</button>
        <button id="stackNext" class="dv-btn">Next ›</button>
        <span id="stackCtr" style="color:${C.text3};font-size:12px"></span>
        <span id="stackNote" style="color:${C.text2};font-size:12px;flex:1"></span>
      </div>
      <div id="stackOp" style="font-family:monospace;font-size:16px;font-weight:800;color:${C.accent};margin-top:8px"></div>
      <style>@keyframes stackPop{from{transform:scale(1.1);opacity:.7}to{transform:scale(1);opacity:1}}</style>`;

    renderStep();
    document.getElementById('stackPrev')?.addEventListener('click', () => { step = Math.max(0,step-1); renderStep(); });
    document.getElementById('stackNext')?.addEventListener('click', () => { step = Math.min(ops.length-1,step+1); renderStep(); });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  QUEUE VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderQueueVisual(container) {
    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🚶 Queue — FIFO Visual</div>
        <div class="dv-subtitle">First In, First Out — like a cinema line</div>
      </div>
      <div class="queue-scene">
        <div class="queue-label">ENQUEUE →</div>
        <div class="queue-track">
          <div class="queue-slot">A <div class="queue-tag">1st in</div></div>
          <div class="queue-slot">B</div>
          <div class="queue-slot">C</div>
          <div class="queue-slot q-head">D <div class="queue-tag">HEAD</div></div>
        </div>
        <div class="queue-label">← DEQUEUE</div>
      </div>
      <div class="dv-insight" style="margin-top:16px">
        <span class="dv-insight-icon">💡</span>
        Queue is the heart of <strong>BFS traversal</strong>.
        The FIFO property ensures nodes are processed level-by-level —
        all nodes at distance k before any at distance k+1.
        This is why BFS finds the <strong style="color:${C.accent}">shortest path</strong> in unweighted graphs.
      </div>
      <div class="queue-bfs">
        <div class="dv-subtitle" style="margin-bottom:10px">BFS uses Queue for level-order traversal:</div>
        <div class="queue-bfs-row">
          <div class="qbfs-item" style="background:rgba(0,184,163,.15);border-color:${C.accent}">Queue: [A]</div>
          <div class="qbfs-arrow">→</div>
          <div class="qbfs-item">Dequeue A → add neighbors B, C</div>
        </div>
        <div class="queue-bfs-row">
          <div class="qbfs-item" style="background:rgba(91,138,245,.15);border-color:${C.blue}">Queue: [B, C]</div>
          <div class="qbfs-arrow">→</div>
          <div class="qbfs-item">Level 1 complete — process B, C</div>
        </div>
        <div class="queue-bfs-row">
          <div class="qbfs-item" style="background:rgba(167,139,250,.15);border-color:${C.purple}">Queue: [D, E]</div>
          <div class="qbfs-arrow">→</div>
          <div class="qbfs-item">Level 2 — neighbors of B and C</div>
        </div>
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  LINKED LIST VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderLinkedListVisual(container) {
    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🔗 Linked List vs Array — Memory Layout</div>
        <div class="dv-subtitle">Why O(1) insert but O(n) access</div>
      </div>
      <div class="mem-layout">
        <div class="mem-section">
          <div class="mem-title" style="color:${C.blue}">📦 Array — Contiguous Memory</div>
          <div class="mem-array">
            ${[10,20,30,40,50].map((v, i) =>
              `<div class="mem-cell"><div class="mem-val">${v}</div><div class="mem-addr">0x${(100+i*4).toString(16)}</div></div>`
            ).join('<div class="mem-arrow-small">→</div>')}
          </div>
          <div class="mem-note" style="color:${C.blue}">
            ✓ O(1) access: address = base + i×4<br>
            ✗ O(n) insert: must shift all right-side elements
          </div>
        </div>
        <div class="mem-section">
          <div class="mem-title" style="color:${C.accent}">🔗 Linked List — Scattered Memory</div>
          <div class="mem-llist">
            ${[{v:10,addr:'0x100',next:'0x240'},{v:20,addr:'0x240',next:'0x380'},{v:30,addr:'0x380',next:'0x1c0'},{v:40,addr:'0x1c0',next:'null'}].map(n =>
              `<div class="mem-node"><div class="mem-node-top">${n.v}</div><div class="mem-node-bot">${n.next}</div></div><div class="mem-arrow">→</div>`
            ).join('')}
            <div style="font-size:10px;color:${C.text3};align-self:center">NULL</div>
          </div>
          <div class="mem-note" style="color:${C.accent}">
            ✓ O(1) insert at known position: update 2 pointers<br>
            ✗ O(n) access: must traverse from head
          </div>
        </div>
      </div>
      <div class="dv-insight">
        <span class="dv-insight-icon">💡</span>
        Array access is O(1) because elements are at <strong>base_address + i × element_size</strong> —
        pure arithmetic. Linked list must <strong>follow pointers</strong> from head to node i — up to n steps.
      </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CSS STYLES (injected once)
  // ══════════════════════════════════════════════════════════════════════════
  function injectStyles() {
    if (document.getElementById('dsaVisualsCSS')) return;
    const style = document.createElement('style');
    style.id = 'dsaVisualsCSS';
    style.textContent = `
      /* ── DSA Visuals shared ── */
      .dv-header { margin-bottom: 12px; }
      .dv-title  { font-size: 15px; font-weight: 800; color: #eff1f6; margin-bottom: 3px; }
      .dv-subtitle { font-size: 12px; color: #a8afbf; }
      .dv-controls { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
      .dv-label  { font-size:12px; color:#a8afbf; font-family:monospace; white-space:nowrap; }
      .dv-slider { flex:1; max-width:260px; accent-color:#00b8a3; cursor:pointer; }
      .dv-legend { display:flex; flex-direction:column; gap:5px; margin-top:12px; }
      .dv-legend-item { display:flex; align-items:center; gap:8px; font-size:11px; flex-wrap:wrap; }
      .dv-dot    { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
      .dv-l-label{ font-family:monospace; font-weight:700; min-width:80px; }
      .dv-l-val  { color:#a8afbf; min-width:100px; }
      .dv-l-desc { color:#666c7c; font-size:10px; }
      .dv-insight{ background:rgba(0,184,163,.06); border:1px solid rgba(0,184,163,.2);
                   border-left:3px solid #00b8a3; border-radius:6px; padding:10px 14px;
                   font-size:12px; color:#a8afbf; line-height:1.7; margin-top:10px; }
      .dv-insight-icon { font-size:14px; margin-right:6px; }
      .dv-btn { padding:5px 12px; background:#333; border:1px solid #4a4a4a; border-radius:5px;
                color:#a8afbf; font-family:inherit; font-size:12px; font-weight:700; cursor:pointer; }
      .dv-btn:hover:not(:disabled) { border-color:#00b8a3; color:#00b8a3; }
      .dv-btn:disabled { opacity:.4; cursor:not-allowed; }

      /* ── Log2 / Binary Search ── */
      .bs-viz   { margin: 10px 0; }
      .bs-table { display:flex; flex-direction:column; gap:3px; font-size:12px; }
      .bs-row   { display:grid; grid-template-columns:50px 100px 1fr 150px; gap:8px;
                  align-items:center; padding:5px 8px; border-radius:5px; background:#282828; }
      .bs-header{ background:#333; font-weight:700; font-size:11px; color:#a8afbf;
                  text-transform:uppercase; letter-spacing:.5px; }
      .bs-last  { border:1px solid rgba(0,184,163,.3); background:rgba(0,184,163,.06); }
      .bs-cell-step  { font-family:monospace; text-align:center; }
      .bs-cell-size  { font-family:monospace; text-align:center; }
      .bs-cell-bar   { }
      .bs-cell-formula { font-family:monospace; color:#666c7c; font-size:11px; }
      .bs-bar-bg   { background:#3e3e3e; border-radius:3px; height:8px; }
      .bs-bar-fill { height:100%; border-radius:3px; transition:width .3s; }
      .bs-conclusion { margin-top:10px; padding:10px 14px; background:rgba(0,184,163,.08);
                       border:1px solid rgba(0,184,163,.25); border-radius:6px; display:flex;
                       align-items:center; gap:12px; flex-wrap:wrap; }
      .bs-compare-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:10px; }
      .bs-compare-card { background:#282828; border:1px solid; border-radius:7px;
                         padding:12px; text-align:center; }
      .bs-compare-algo { font-size:11px; font-weight:700; color:#eff1f6; margin-bottom:5px; }
      .bs-compare-ops  { font-size:22px; font-weight:900; font-family:monospace; margin-bottom:3px; }
      .bs-compare-note { font-size:10px; color:#666c7c; margin-bottom:8px; font-family:monospace; }
      .bs-compare-bar  { background:#3e3e3e; border-radius:2px; height:4px; }

      /* ── HashMap ── */
      .hm-layout { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:12px 0; }
      .hm-section-label { font-size:11px; font-weight:700; color:#a8afbf; text-transform:uppercase;
                          letter-spacing:.5px; margin-bottom:8px; }
      .hm-key-item { display:flex; align-items:center; gap:8px; margin-bottom:5px; font-size:12px; }
      .hm-key      { font-family:monospace; background:#282828; padding:2px 7px;
                     border-radius:4px; color:#eff1f6; }
      .hm-arrow    { font-size:11px; color:#666c7c; }
      .hm-bucket   { display:flex; align-items:center; gap:8px; padding:5px 8px;
                     border-radius:5px; background:#282828; border:1px solid #3e3e3e;
                     margin-bottom:3px; font-size:12px; min-height:30px; }
      .hm-filled   { border-color:rgba(0,184,163,.3); }
      .hm-collision{ border-color:rgba(255,184,0,.3); background:rgba(255,184,0,.04); }
      .hm-bucket-idx{ font-family:monospace; color:#666c7c; min-width:24px; }
      .hm-entry    { background:rgba(0,184,163,.12); color:#00b8a3; padding:1px 7px;
                     border-radius:3px; font-family:monospace; font-size:11px; }
      .hm-empty    { color:#3e3e3e; font-size:11px; font-style:italic; }

      /* ── Sorting table ── */
      .sort-table  { display:flex; flex-direction:column; gap:3px; }
      .sort-header { display:grid; grid-template-columns:140px 120px 80px 70px 1fr; gap:8px;
                     padding:6px 10px; font-size:11px; font-weight:700; color:#a8afbf;
                     text-transform:uppercase; letter-spacing:.5px; }
      .sort-row    { display:grid; grid-template-columns:140px 120px 80px 70px 1fr; gap:8px;
                     align-items:center; padding:7px 10px; background:#282828;
                     border-radius:5px; border:1px solid #3e3e3e; font-size:12px; }
      .sort-row:hover { border-color:#4a4a4a; }
      .sort-badge  { padding:2px 8px; border-radius:10px; font-family:monospace;
                     font-size:11px; font-weight:700; white-space:nowrap; }

      /* ── Window / Two Pointer ── */
      .win-array { display:flex; gap:4px; flex-wrap:nowrap; overflow-x:auto; padding:10px 4px; }
      .win-cell  { display:flex; flex-direction:column; align-items:center; min-width:36px;
                   border-radius:5px; background:#282828; border:1px solid #3e3e3e; padding:4px; }
      .win-cell.win-active { background:rgba(0,184,163,.1); border-color:rgba(0,184,163,.4); }
      .win-val   { font-family:monospace; font-weight:700; font-size:14px; }
      .win-idx   { font-size:9px; color:#666c7c; margin-top:2px; }
      .win-ptr   { font-size:9px; font-weight:800; margin-top:2px; }

      /* ── Stack visual ── */
      .stack-tower { display:flex; flex-direction:column; align-items:center; gap:2px; min-width:80px; }
      .stack-label { font-size:10px; color:#666c7c; text-transform:uppercase; letter-spacing:.5px; }
      .stack-item  { width:72px; padding:8px; background:#282828; border:1px solid #4a4a4a;
                     border-radius:5px; text-align:center; font-family:monospace; font-weight:700;
                     font-size:14px; transition:.2s; }
      .stack-top   { background:rgba(0,184,163,.12); border-color:#00b8a3; color:#00b8a3; }
      .stack-empty { width:72px; padding:8px; text-align:center; color:#3e3e3e; font-size:11px;
                     border:1px dashed #3e3e3e; border-radius:5px; }
      .stack-base  { width:80px; text-align:center; color:#3e3e3e; font-family:monospace; }

      /* ── Queue ── */
      .queue-scene { display:flex; align-items:center; gap:8px; margin:12px 0; }
      .queue-label { font-size:11px; font-weight:700; color:#666c7c; white-space:nowrap; }
      .queue-track { display:flex; gap:4px; }
      .queue-slot  { width:50px; height:50px; background:#282828; border:1px solid #4a4a4a;
                     border-radius:5px; display:flex; align-items:center; justify-content:center;
                     font-family:monospace; font-weight:700; font-size:14px; position:relative; }
      .q-head { background:rgba(0,184,163,.1); border-color:#00b8a3; color:#00b8a3; }
      .queue-tag { position:absolute; bottom:-16px; font-size:9px; color:#666c7c;
                   white-space:nowrap; font-weight:600; }
      .queue-bfs  { margin-top:16px; }
      .queue-bfs-row { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
      .qbfs-item  { padding:6px 12px; border-radius:5px; border:1px solid; font-size:12px; }
      .qbfs-arrow { color:#666c7c; font-size:14px; }

      /* ── Memory layout ── */
      .mem-layout  { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:12px 0; }
      .mem-section { background:#282828; border:1px solid #3e3e3e; border-radius:7px; padding:14px; }
      .mem-title   { font-size:13px; font-weight:700; margin-bottom:10px; }
      .mem-array   { display:flex; align-items:center; gap:2px; flex-wrap:wrap; margin-bottom:10px; }
      .mem-cell    { width:48px; background:#1a1a1a; border:1px solid #4a4a4a; border-radius:4px;
                     padding:4px; text-align:center; }
      .mem-val     { font-family:monospace; font-weight:700; font-size:13px; }
      .mem-addr    { font-size:9px; color:#666c7c; font-family:monospace; }
      .mem-arrow-small { color:#666c7c; font-size:12px; }
      .mem-llist   { display:flex; align-items:center; gap:2px; flex-wrap:wrap; margin-bottom:10px; }
      .mem-node    { background:#1a1a1a; border:1px solid #4a4a4a; border-radius:4px;
                     min-width:50px; }
      .mem-node-top{ padding:5px 8px; font-family:monospace; font-weight:700; font-size:13px;
                     text-align:center; border-bottom:1px solid #3e3e3e; }
      .mem-node-bot{ padding:3px 6px; font-family:monospace; font-size:9px; color:#666c7c;
                     text-align:center; }
      .mem-arrow   { color:#666c7c; font-size:14px; }
      .mem-note    { font-size:11px; line-height:1.7; }

      /* ── Complexity chart ── */
      #dvCanvas { border-radius:6px; background:#282828; }
    `;
    document.head.appendChild(style);
  }


  // ══════════════════════════════════════════════════════════════════════════
  //  ARRAY VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderArrayVisual(container) {
    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">📦 Array — Memory Model</div>
        <div class="dv-subtitle">Contiguous memory. O(1) access by index. O(n) insert/delete.</div>
      </div>
      <div class="dv-controls">
        <label class="dv-label">n = <span id="arrN">8</span></label>
        <input type="range" id="arrSlider" min="3" max="15" value="8" class="dv-slider"/>
        <select id="arrOp" class="dv-slider" style="flex:none;width:160px;padding:4px 8px;background:#282828;border:1px solid #3e3e3e;border-radius:4px;color:#eff1f6;font-size:12px">
          <option value="access">O(1) Access</option>
          <option value="search">O(n) Search</option>
          <option value="insert">O(n) Insert</option>
        </select>
        <button class="dv-btn" onclick="runArrayViz()">▶ Run</button>
      </div>
      <div id="arrViz" style="overflow-x:auto;padding:8px 0"></div>
      <div id="arrDesc" class="dv-insight" style="margin-top:10px">Select an operation and press Run.</div>`;

    const slider = container.querySelector('#arrSlider');
    slider.addEventListener('input', () => {
      document.getElementById('arrN').textContent = slider.value;
    });
    window.runArrayViz = () => {
      const n = parseInt(document.getElementById('arrSlider').value);
      const op = document.getElementById('arrOp').value;
      const arr = Array.from({length:n}, (_,i) => Math.floor(Math.random()*90)+10);
      const target = op === 'search' ? arr[Math.floor(Math.random()*n)] : null;
      const insertAt = op === 'insert' ? Math.floor(n/2) : null;
      const accessAt = op === 'access' ? Math.floor(Math.random()*n) : null;
      const viz = document.getElementById('arrViz');
      const desc = document.getElementById('arrDesc');

      let html = '<div style="display:flex;gap:3px;align-items:flex-end;flex-wrap:nowrap">';
      arr.forEach((v,i) => {
        let bg='#282828', border='#4a4a4a', color='#eff1f6', label='';
        if (op==='access' && i===accessAt) { bg='rgba(0,184,163,.15)'; border='#00b8a3'; color='#00b8a3'; label='← access'; }
        if (op==='search') { bg='rgba(255,184,0,.06)'; border='rgba(255,184,0,.3)'; }
        if (op==='insert' && i===insertAt) { bg='rgba(239,71,67,.1)'; border='#ef4743'; color='#ef4743'; label='← insert here'; }
        if (op==='insert' && i>insertAt) { bg='rgba(255,184,0,.06)'; border='rgba(255,184,0,.25)'; }
        html += `<div style="display:flex;flex-direction:column;align-items:center;min-width:44px">
          <div style="background:${bg};border:1px solid ${border};border-radius:4px;padding:8px 6px;text-align:center;font-family:monospace;font-weight:700;font-size:13px;color:${color};width:44px">${v}</div>
          <div style="font-size:9px;color:#666c7c;margin-top:3px">[${i}]</div>
          ${label?`<div style="font-size:9px;color:${color};white-space:nowrap">${label}</div>`:''}
        </div>`;
      });
      html += '</div>';
      viz.innerHTML = html;

      const descs = {
        access: `✅ <strong>O(1) access:</strong> arr[${accessAt}] = ${arr[accessAt]}. Address = base + ${accessAt}×4. Constant time regardless of array size.`,
        search: `🔍 <strong>O(n) search:</strong> Finding ${target} requires scanning up to all ${n} elements in the worst case. Must check every index.`,
        insert: `⚠️ <strong>O(n) insert</strong> at index ${insertAt}: Elements at positions [${insertAt}..${n-1}] must shift right by 1. That's ${n-insertAt} moves. Worst case = insert at index 0 → ${n} shifts.`
      };
      desc.innerHTML = `<span class="dv-insight-icon">💡</span>${descs[op]}`;
    };
    window.runArrayViz();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RECURSION VISUAL — Call stack with Fibonacci
  // ══════════════════════════════════════════════════════════════════════════
  function renderRecursionVisual(container) {
    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🌀 Recursion — Call Stack Visualizer</div>
        <div class="dv-subtitle">How fib(n) expands and how memoization collapses it from O(2ⁿ) to O(n)</div>
      </div>
      <div class="dv-controls">
        <label class="dv-label">fib(<span id="fibN">5</span>)</label>
        <input type="range" id="fibSlider" min="1" max="8" value="5" class="dv-slider"/>
        <label class="dv-label" style="margin-left:8px">
          <input type="checkbox" id="fibMemo" style="accent-color:#00b8a3"> Memoization
        </label>
      </div>
      <div id="fibViz" style="margin:10px 0;overflow-x:auto"></div>
      <div id="fibStats" class="dv-insight"></div>`;

    const draw = () => {
      const n = parseInt(document.getElementById('fibSlider').value);
      const memo = document.getElementById('fibMemo').checked;
      document.getElementById('fibN').textContent = n;
      const cache = {};
      let calls = 0;
      const build = (x, depth) => {
        calls++;
        if (x <= 1) return { n: x, val: x, calls: 1, children: [], cached: false };
        if (memo && cache[x]) return { n: x, val: cache[x].val, calls: 1, children: [], cached: true };
        const l = build(x-1, depth+1);
        const r = build(x-2, depth+1);
        const v = l.val + r.val;
        if (memo) cache[x] = { val: v };
        return { n: x, val: v, calls: 1, children: [l, r], cached: false };
      };
      const tree = build(n, 0);
      const totalCalls = calls;
      const renderNode = (node) => {
        if (node.cached) return `<div style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:32px;background:rgba(91,138,245,.12);border:1px solid rgba(91,138,245,.3);border-radius:4px;font-size:11px;font-family:monospace;color:#5b8af5" title="cached">${node.n}✓</div>`;
        const bg = node.children.length === 0 ? 'rgba(0,184,163,.12)' : '#282828';
        const border = node.children.length === 0 ? '#00b8a3' : '#4a4a4a';
        const color  = node.children.length === 0 ? '#00b8a3' : '#eff1f6';
        let html = `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="background:${bg};border:1px solid ${border};border-radius:4px;padding:5px 8px;text-align:center;font-family:monospace;font-size:12px;color:${color};min-width:44px">fib(${node.n})</div>`;
        if (node.children.length) {
          html += `<div style="display:flex;gap:12px;align-items:flex-start">`;
          node.children.forEach(c => { html += renderNode(c); });
          html += '</div>';
        }
        html += '</div>';
        return html;
      };
      document.getElementById('fibViz').innerHTML = `<div style="overflow-x:auto;padding:8px">${renderNode(tree)}</div>`;
      const naive = Math.pow(2, n) - 1;
      document.getElementById('fibStats').innerHTML = `<span class="dv-insight-icon">💡</span>
        fib(${n}) = <strong style="color:#00b8a3">${tree.val}</strong>.
        ${memo
          ? `With memoization: <strong style="color:#00b8a3">${totalCalls} calls</strong> (O(n)). Each unique value computed once.`
          : `Without memoization: <strong style="color:#ef4743">${totalCalls} calls</strong> (close to O(2ⁿ)=${naive}). Many repeated sub-trees.`}`;
    };
    document.getElementById('fibSlider').addEventListener('input', draw);
    document.getElementById('fibMemo').addEventListener('change', draw);
    draw();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PREFIX SUM VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderPrefixSumVisual(container) {
    const arr = [3, 1, 4, 1, 5, 9, 2, 6];
    let pre = [0];
    arr.forEach((v,i) => pre.push(pre[i]+v));
    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">➕ Prefix Sum — O(n) build, O(1) query</div>
        <div class="dv-subtitle">Build once, answer unlimited range sum queries instantly</div>
      </div>
      <div class="dv-controls" style="gap:12px">
        <label class="dv-label">L = <span id="psL">2</span></label>
        <input type="range" id="psLSlider" min="0" max="${arr.length-1}" value="2" class="dv-slider"/>
        <label class="dv-label">R = <span id="psR">5</span></label>
        <input type="range" id="psRSlider" min="0" max="${arr.length-1}" value="5" class="dv-slider"/>
      </div>
      <div id="psViz"></div>
      <div id="psResult" class="dv-insight" style="margin-top:10px"></div>`;

    const draw = () => {
      let L = parseInt(document.getElementById('psLSlider').value);
      let R = parseInt(document.getElementById('psRSlider').value);
      if (L > R) { R = L; document.getElementById('psRSlider').value = R; }
      document.getElementById('psL').textContent = L;
      document.getElementById('psR').textContent = R;
      const rangeSum = pre[R+1] - pre[L];

      let arrRow = '<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;color:#666c7c;text-transform:uppercase;margin-bottom:5px">Original array arr[]</div><div style="display:flex;gap:3px">';
      arr.forEach((v,i) => {
        const inRange = i>=L && i<=R;
        arrRow += `<div style="width:44px;text-align:center;border-radius:4px;padding:8px 4px;background:${inRange?'rgba(0,184,163,.15)':'#282828'};border:1px solid ${inRange?'#00b8a3':'#4a4a4a'};font-family:monospace;font-weight:700;font-size:13px;color:${inRange?'#00b8a3':'#eff1f6'}">
          <div>${v}</div><div style="font-size:9px;color:#666c7c;margin-top:3px">[${i}]</div>
        </div>`;
      });
      arrRow += '</div></div>';

      let preRow = '<div><div style="font-size:10px;font-weight:700;color:#666c7c;text-transform:uppercase;margin-bottom:5px">Prefix sum pre[] (pre[i] = sum of arr[0..i-1])</div><div style="display:flex;gap:3px">';
      pre.forEach((v,i) => {
        const isL = i===L, isR = i===R+1;
        preRow += `<div style="width:44px;text-align:center;border-radius:4px;padding:8px 4px;background:${isL||isR?'rgba(255,184,0,.12)':'#1e1e1e'};border:1px solid ${isL||isR?'#ffb800':'#3e3e3e'};font-family:monospace;font-size:12px;color:${isL||isR?'#ffb800':'#666c7c'}">
          <div style="font-weight:700">${v}</div><div style="font-size:9px;margin-top:3px">[${i}]</div>
        </div>`;
      });
      preRow += '</div></div>';

      document.getElementById('psViz').innerHTML = arrRow + preRow;
      document.getElementById('psResult').innerHTML = `<span class="dv-insight-icon">💡</span>
        sum(arr[${L}..${R}]) = pre[${R+1}] - pre[${L}] = <strong style="color:#ffb800">${pre[R+1]}</strong> - <strong style="color:#ffb800">${pre[L]}</strong> = <strong style="color:#00b8a3;font-size:15px">${rangeSum}</strong>
        — computed in <strong>O(1)</strong>, no loop needed.`;
    };
    document.getElementById('psLSlider').addEventListener('input', draw);
    document.getElementById('psRSlider').addEventListener('input', draw);
    draw();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  TREE VISUAL — BST insert/search
  // ══════════════════════════════════════════════════════════════════════════
  function renderTreeVisual(container) {
    const values = [8, 3, 10, 1, 6, 14, 4, 7];
    class Node { constructor(v){this.v=v;this.l=null;this.r=null;} }
    const insert = (root, v) => {
      if(!root) return new Node(v);
      if(v<root.v) root.l=insert(root.l,v);
      else root.r=insert(root.r,v);
      return root;
    };
    let root = null;
    values.forEach(v => { root = insert(root, v); });

    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🌳 Binary Search Tree — O(log n) search</div>
        <div class="dv-subtitle">Every left child &lt; parent &lt; right child</div>
      </div>
      <div class="dv-controls">
        <input id="treeSearch" type="number" placeholder="Search value…" class="dv-slider" style="flex:none;width:120px;padding:6px 10px;background:#282828;border:1px solid #3e3e3e;border-radius:5px;color:#eff1f6;font-family:monospace;font-size:13px"/>
        <button class="dv-btn" onclick="doTreeSearch()">🔍 Search</button>
        <button class="dv-btn" onclick="clearTreeSearch()">Clear</button>
      </div>
      <div id="treeViz" style="overflow:auto;padding:8px 0"></div>
      <div id="treeDesc" class="dv-insight" style="margin-top:10px">Enter a value and press Search to see the path taken.</div>`;

    let highlighted = new Set();
    const getPath = (node, target, path=[]) => {
      if(!node) return null;
      path.push(node.v);
      if(node.v===target) return path;
      if(target<node.v) return getPath(node.l, target, path);
      return getPath(node.r, target, path);
    };

    const renderTree = () => {
      const nodeEl = (node, depth=0) => {
        if(!node) return '';
        const inPath = highlighted.has(node.v);
        const isTarget = highlighted.size > 0 && node.v === [...highlighted].at(-1);
        const bg = isTarget ? 'rgba(0,184,163,.2)' : inPath ? 'rgba(255,184,0,.12)' : '#282828';
        const border = isTarget ? '#00b8a3' : inPath ? '#ffb800' : '#4a4a4a';
        const color  = isTarget ? '#00b8a3' : inPath ? '#ffb800' : '#eff1f6';
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="background:${bg};border:1px solid ${border};border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-weight:700;font-size:13px;color:${color}">${node.v}</div>
          ${(node.l||node.r)?`<div style="display:flex;gap:16px;align-items:flex-start">${nodeEl(node.l)}${!node.l?'<div style="width:38px"></div>':''}${!node.r?'<div style="width:38px"></div>':''}${nodeEl(node.r)}</div>`:''}
        </div>`;
      };
      document.getElementById('treeViz').innerHTML = nodeEl(root);
    };

    window.doTreeSearch = () => {
      const target = parseInt(document.getElementById('treeSearch').value);
      if(isNaN(target)){return;}
      const path = getPath(root, target);
      highlighted = path ? new Set(path) : new Set();
      renderTree();
      const desc = document.getElementById('treeDesc');
      if(path) {
        desc.innerHTML = `<span class="dv-insight-icon">✅</span> Found <strong style="color:#00b8a3">${target}</strong> in <strong>${path.length} steps</strong>: ${path.map((v,i)=>i===path.length-1?`<strong style="color:#00b8a3">${v}</strong>`:v).join(' → ')}. O(log n) — each step eliminates half the tree.`;
      } else {
        desc.innerHTML = `<span class="dv-insight-icon">❌</span> <strong>${target}</strong> not found. Path explored: ${getPath(root, target, [])?.join(' → ') || 'empty'}`;
        highlighted = new Set();
      }
    };
    window.clearTreeSearch = () => { highlighted = new Set(); renderTree(); document.getElementById('treeSearch').value=''; document.getElementById('treeDesc').innerHTML='Enter a value to search.'; };
    renderTree();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  GRAPH VISUAL — BFS + DFS
  // ══════════════════════════════════════════════════════════════════════════
  function renderGraphVisual(container) {
    const nodes = ['A','B','C','D','E','F'];
    const edges = [['A','B'],['A','C'],['B','D'],['B','E'],['C','F'],['D','E']];
    const adj = {};
    nodes.forEach(n => adj[n]=[]);
    edges.forEach(([a,b]) => { adj[a].push(b); adj[b].push(a); });

    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🕸 Graph — BFS vs DFS Traversal</div>
        <div class="dv-subtitle">Same graph, different traversal order. BFS = levels. DFS = deep first.</div>
      </div>
      <div class="dv-controls">
        <button class="dv-btn" onclick="runBFS()">▶ Run BFS</button>
        <button class="dv-btn" onclick="runDFS()">▶ Run DFS</button>
        <button class="dv-btn" onclick="resetGraph()">↺ Reset</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0">
        <div>
          <div style="font-size:11px;font-weight:700;color:#666c7c;text-transform:uppercase;margin-bottom:6px">Graph</div>
          <div id="graphViz" style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:7px;padding:14px;min-height:160px"></div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#666c7c;text-transform:uppercase;margin-bottom:6px">Traversal Order</div>
          <div id="graphOrder" style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:7px;padding:14px;min-height:160px;display:flex;flex-direction:column;gap:5px"></div>
        </div>
      </div>
      <div id="graphDesc" class="dv-insight"></div>`;

    let highlighted = {};
    const drawGraph = () => {
      const pos = {A:[100,40],B:[40,110],C:[160,110],D:[20,180],E:[80,180],F:[160,180]};
      let svg = `<svg width="200" height="210" xmlns="http://www.w3.org/2000/svg">`;
      edges.forEach(([a,b]) => {
        svg += `<line x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[b][0]}" y2="${pos[b][1]}" stroke="#4a4a4a" stroke-width="1.5"/>`;
      });
      nodes.forEach(n => {
        const order = highlighted[n];
        const visited = order !== undefined;
        const bg = visited ? '#00b8a3' : '#282828';
        const tc = visited ? '#031a17' : '#eff1f6';
        svg += `<circle cx="${pos[n][0]}" cy="${pos[n][1]}" r="16" fill="${bg}" stroke="${visited?'#00b8a3':'#4a4a4a'}" stroke-width="1.5"/>`;
        svg += `<text x="${pos[n][0]}" y="${pos[n][1]+1}" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="12" font-weight="700" fill="${tc}">${n}${visited?'('+order+')':''}</text>`;
      });
      svg += '</svg>';
      document.getElementById('graphViz').innerHTML = svg;
    };

    window.runBFS = () => {
      const queue = ['A'], visited = new Set(['A']), order = [];
      highlighted = {};
      while(queue.length) {
        const cur = queue.shift();
        order.push(cur);
        highlighted[cur] = order.length;
        adj[cur].sort().forEach(n => { if(!visited.has(n)){visited.add(n);queue.push(n);} });
      }
      drawGraph();
      document.getElementById('graphOrder').innerHTML = order.map((n,i)=>`<div style="display:flex;align-items:center;gap:8px;font-size:13px"><span style="background:rgba(0,184,163,.15);color:#00b8a3;border-radius:4px;padding:2px 8px;font-family:monospace;font-weight:700;min-width:28px;text-align:center">${n}</span><span style="color:#666c7c;font-size:11px">step ${i+1} — level ${Math.floor(Math.log2(i+2))}</span></div>`).join('');
      document.getElementById('graphDesc').innerHTML = `<span class="dv-insight-icon">💡</span><strong>BFS:</strong> Uses a <strong>Queue (FIFO)</strong>. Visits all neighbors of A before going deeper. Guarantees <strong>shortest path</strong> in unweighted graphs. Order: ${order.join(' → ')}`;
    };

    window.runDFS = () => {
      const visited = new Set(), order = [];
      highlighted = {};
      const dfs = (n) => {
        visited.add(n); order.push(n); highlighted[n] = order.length;
        adj[n].sort().forEach(nb => { if(!visited.has(nb)) dfs(nb); });
      };
      dfs('A');
      drawGraph();
      document.getElementById('graphOrder').innerHTML = order.map((n,i)=>`<div style="display:flex;align-items:center;gap:8px;font-size:13px"><span style="background:rgba(167,139,250,.15);color:#a78bfa;border-radius:4px;padding:2px 8px;font-family:monospace;font-weight:700;min-width:28px;text-align:center">${n}</span><span style="color:#666c7c;font-size:11px">step ${i+1}</span></div>`).join('');
      document.getElementById('graphDesc').innerHTML = `<span class="dv-insight-icon">💡</span><strong>DFS:</strong> Uses a <strong>Stack (recursion)</strong>. Goes as deep as possible before backtracking. Used for cycle detection, topological sort, connected components. Order: ${order.join(' → ')}`;
    };

    window.resetGraph = () => { highlighted={}; drawGraph(); document.getElementById('graphOrder').innerHTML=''; document.getElementById('graphDesc').innerHTML=''; };
    drawGraph();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DYNAMIC PROGRAMMING VISUAL — Fibonacci DP table
  // ══════════════════════════════════════════════════════════════════════════
  function renderDPVisual(container) {
    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">📊 Dynamic Programming — Bottom-Up Table</div>
        <div class="dv-subtitle">Build the answer from subproblems. Each cell computed once.</div>
      </div>
      <div class="dv-controls">
        <label class="dv-label">n = <span id="dpN">10</span></label>
        <input type="range" id="dpSlider" min="3" max="15" value="10" class="dv-slider"/>
        <select id="dpType" class="dv-slider" style="flex:none;padding:5px 8px;background:#282828;border:1px solid #3e3e3e;border-radius:4px;color:#eff1f6;font-size:12px">
          <option value="fib">Fibonacci</option>
          <option value="climb">Climbing Stairs</option>
        </select>
      </div>
      <div id="dpViz" style="overflow-x:auto;padding:8px 0"></div>
      <div id="dpInsight" class="dv-insight"></div>`;

    const drawDP = () => {
      const n = parseInt(document.getElementById('dpSlider').value);
      const type = document.getElementById('dpType').value;
      document.getElementById('dpN').textContent = n;
      const dp = new Array(n+1).fill(0);
      if(type==='fib'){dp[0]=0;dp[1]=1;for(let i=2;i<=n;i++)dp[i]=dp[i-1]+dp[i-2];}
      else {dp[0]=1;dp[1]=1;for(let i=2;i<=n;i++)dp[i]=dp[i-1]+dp[i-2];}
      const maxV = Math.max(...dp.slice(0,n+1)) || 1;
      let html = '<div style="display:flex;gap:3px;align-items:flex-end">';
      for(let i=0;i<=n;i++){
        const h = Math.max(20, Math.round((dp[i]/maxV)*80));
        const isLast = i===n;
        html += `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;min-width:${Math.max(34,Math.min(52,580/(n+1)))}px">
          <div style="font-size:10px;font-family:monospace;color:${isLast?'#00b8a3':'#666c7c'};font-weight:${isLast?700:400}">${dp[i]}</div>
          <div style="width:100%;height:${h}px;background:${isLast?'rgba(0,184,163,.3)':'#282828'};border:1px solid ${isLast?'#00b8a3':'#4a4a4a'};border-radius:3px;transition:.3s"></div>
          <div style="font-size:9px;color:#666c7c">dp[${i}]</div>
        </div>`;
      }
      html += '</div>';
      document.getElementById('dpViz').innerHTML = html;
      const formula = type==='fib' ? 'dp[i] = dp[i-1] + dp[i-2], dp[0]=0, dp[1]=1'
                                   : 'dp[i] = dp[i-1] + dp[i-2], dp[0]=dp[1]=1';
      document.getElementById('dpInsight').innerHTML = `<span class="dv-insight-icon">💡</span>
        <strong>Recurrence:</strong> ${formula}. Answer = <strong style="color:#00b8a3">dp[${n}] = ${dp[n]}</strong>.
        Each cell computed <strong>once</strong> → O(n) time, O(n) space (optimizable to O(1) with two variables).`;
    };
    document.getElementById('dpSlider').addEventListener('input', drawDP);
    document.getElementById('dpType').addEventListener('change', drawDP);
    drawDP();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  HEAP VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderHeapVisual(container) {
    const minHeap = [1,3,5,7,9,11,13,17,19,21];
    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🏔 Heap (Min-Heap) — O(log n) insert, O(1) peek</div>
        <div class="dv-subtitle">Parent ≤ both children. Root is always the minimum.</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:10px 0">
        <div>
          <div style="font-size:11px;font-weight:700;color:#666c7c;text-transform:uppercase;margin-bottom:6px">Tree View</div>
          <div id="heapTree" style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:7px;padding:12px"></div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#666c7c;text-transform:uppercase;margin-bottom:6px">Array View (how Java stores it)</div>
          <div id="heapArray" style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:7px;padding:12px"></div>
          <div class="dv-insight" style="margin-top:8px;font-size:11px">
            <strong>Index math:</strong> parent(i) = (i-1)/2 · left(i) = 2i+1 · right(i) = 2i+2
          </div>
        </div>
      </div>
      <div class="dv-insight">
        <span class="dv-insight-icon">💡</span>
        <strong>Key insight:</strong> Heap is stored in an array — no pointers needed. Parent-child relationships are computed from indices. peek() = arr[0] in O(1). insert() bubbles up in O(log n). poll() swaps root with last, then sifts down in O(log n).
      </div>`;

    // Render tree
    const n = minHeap.length;
    const nodeDiv = (i, depth=0) => {
      if(i>=n) return '';
      const isRoot = i===0;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="background:${isRoot?'rgba(0,184,163,.2)':'#282828'};border:1px solid ${isRoot?'#00b8a3':'#4a4a4a'};border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-weight:700;font-size:12px;color:${isRoot?'#00b8a3':'#eff1f6'}">${minHeap[i]}</div>
        ${(2*i+1<n||2*i+2<n)?`<div style="display:flex;gap:12px">${nodeDiv(2*i+1,depth+1)}${2*i+2<n?nodeDiv(2*i+2,depth+1):'<div style="width:36px"></div>'}</div>`:''}</div>`;
    };
    document.getElementById('heapTree').innerHTML = nodeDiv(0);

    // Render array
    document.getElementById('heapArray').innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:3px">${minHeap.map((v,i)=>`<div style="background:${i===0?'rgba(0,184,163,.15)':'#282828'};border:1px solid ${i===0?'#00b8a3':'#4a4a4a'};border-radius:4px;width:38px;padding:6px 4px;text-align:center;font-family:monospace;font-weight:700;font-size:12px;color:${i===0?'#00b8a3':'#eff1f6'}"><div>${v}</div><div style="font-size:9px;color:#666c7c;margin-top:2px">[${i}]</div></div>`).join('')}</div>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  GREEDY VISUAL — Interval scheduling
  // ══════════════════════════════════════════════════════════════════════════
  function renderGreedyVisual(container) {
    const intervals = [{s:1,e:4,id:'A'},{s:3,e:5,id:'B'},{s:0,e:6,id:'C'},{s:5,e:7,id:'D'},{s:3,e:9,id:'E'},{s:5,e:9,id:'F'},{s:6,e:10,id:'G'},{s:8,e:11,id:'H'},{s:8,e:12,id:'I'},{s:2,e:14,id:'J'}];
    const sorted = [...intervals].sort((a,b)=>a.e-b.e);
    const selected = [];
    let lastEnd = -Infinity;
    sorted.forEach(iv => { if(iv.s>=lastEnd){selected.push(iv.id);lastEnd=iv.e;} });
    const selectedSet = new Set(selected);
    const colors = ['#5b8af5','#a78bfa','#ffb800','#22c55e','#ef4743','#00b8a3','#f59e0b','#e879a0','#60a5fa','#fb923c'];
    const W = 380, scale = W/14;

    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🎯 Greedy — Interval Scheduling</div>
        <div class="dv-subtitle">Greedy choice: always pick the interval that ends earliest. Select ${selected.length} non-overlapping intervals.</div>
      </div>
      <div id="greedyViz" style="overflow-x:auto;padding:8px 0"></div>
      <div class="dv-insight" style="margin-top:10px">
        <span class="dv-insight-icon">💡</span>
        <strong>Greedy strategy:</strong> Sort by end time. Greedily pick the earliest-ending interval that doesn't conflict with the last selected. This local greedy choice leads to a globally optimal solution.
        Selected: <strong style="color:#00b8a3">${selected.join(', ')}</strong> (${selected.length} intervals).
      </div>`;

    let svg = `<svg width="${W+60}" height="${intervals.length*28+30}" xmlns="http://www.w3.org/2000/svg">`;
    // Timeline
    for(let t=0;t<=14;t+=2){
      svg+=`<text x="${30+t*scale}" y="16" text-anchor="middle" font-family="monospace" font-size="10" fill="#666c7c">${t}</text>`;
      svg+=`<line x1="${30+t*scale}" y1="20" x2="${30+t*scale}" y2="${intervals.length*28+20}" stroke="#2e2e2e" stroke-width="0.5"/>`;
    }
    intervals.sort((a,b)=>a.e-b.e).forEach((iv,i) => {
      const sel = selectedSet.has(iv.id);
      const y = 24+i*28;
      const x1 = 30+iv.s*scale, x2 = 30+iv.e*scale;
      svg+=`<rect x="${x1}" y="${y}" width="${x2-x1}" height="20" rx="4" fill="${sel?'rgba(0,184,163,.2)':'rgba(239,71,67,.08)'}" stroke="${sel?'#00b8a3':'#ef4743'}" stroke-width="${sel?1.5:1}"/>`;
      svg+=`<text x="${(x1+x2)/2}" y="${y+13}" text-anchor="middle" font-family="monospace" font-size="11" font-weight="700" fill="${sel?'#00b8a3':'#666c7c'}">${iv.id}</text>`;
      if(sel) svg+=`<text x="${x2+4}" y="${y+13}" font-family="monospace" font-size="9" fill="#00b8a3">✓</text>`;
    });
    svg+='</svg>';
    document.getElementById('greedyViz').innerHTML = svg;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BACKTRACKING VISUAL — N-Queens miniature
  // ══════════════════════════════════════════════════════════════════════════
  function renderBacktrackVisual(container) {
    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">♛ Backtracking — N-Queens (n=4)</div>
        <div class="dv-subtitle">Try → check → backtrack if invalid. Explore all valid configurations.</div>
      </div>
      <div class="dv-controls">
        <button class="dv-btn" onclick="nextQueensStep()">Next Step ›</button>
        <button class="dv-btn" onclick="resetQueens()">↺ Reset</button>
        <span id="queensStepLbl" style="font-size:12px;color:#666c7c;margin-left:8px"></span>
      </div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start;margin:10px 0">
        <div id="queensBoard"></div>
        <div id="queensLog" style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:7px;padding:10px;max-height:240px;overflow-y:auto;font-family:monospace;font-size:11px;display:flex;flex-direction:column;gap:3px"></div>
      </div>
      <div id="queensDesc" class="dv-insight"></div>`;

    const n=4;
    const steps=[];
    const board=Array.from({length:n},()=>Array(n).fill(0));
    const isValid=(r,c,b)=>{for(let i=0;i<r;i++){if(b[i][c])return false;if(c-r+i>=0&&b[i][c-r+i])return false;if(c+r-i<n&&b[i][c+r-i])return false;}return true;};
    const solve=(r,b)=>{
      if(r===n){steps.push({board:b.map(r=>[...r]),type:'solution',msg:`✅ Solution found!`});return;}
      for(let c=0;c<n;c++){
        steps.push({board:b.map(r=>[...r]),type:'try',msg:`Try queen at (${r},${c})`});
        if(isValid(r,c,b)){
          b[r][c]=1;steps.push({board:b.map(r=>[...r]),type:'place',msg:`✓ Place queen at (${r},${c})`});
          solve(r+1,b);
          b[r][c]=0;steps.push({board:b.map(r=>[...r]),type:'backtrack',msg:`↩ Backtrack from (${r},${c})`});
        } else {
          steps.push({board:b.map(r=>[...r]),type:'invalid',msg:`✗ Invalid at (${r},${c})`});
        }
      }
    };
    solve(0,board);
    let stepIdx=0;
    const drawBoard=(step)=>{
      const bd=step.board;
      let html='<div style="display:grid;grid-template-columns:repeat(4,36px);gap:2px">';
      for(let r=0;r<n;r++)for(let c=0;c<n;c++){
        const q=bd[r][c];
        const light=(r+c)%2===0;
        html+=`<div style="width:36px;height:36px;background:${q?'rgba(0,184,163,.3)':light?'#282828':'#1e1e1e'};border:1px solid ${q?'#00b8a3':'#3e3e3e'};border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:18px">${q?'♛':''}</div>`;
      }
      html+='</div>';
      document.getElementById('queensBoard').innerHTML=html;
    };
    const addLog=(step)=>{
      const log=document.getElementById('queensLog');
      const colors={try:'#666c7c',place:'#00b8a3',backtrack:'#ffb800',invalid:'#ef4743',solution:'#22c55e'};
      const div=document.createElement('div');
      div.style.color=colors[step.type]||'#a8afbf';
      div.textContent=step.msg;
      log.appendChild(div);
      log.scrollTop=log.scrollHeight;
    };
    const draw=()=>{
      const step=steps[stepIdx];
      drawBoard(step);
      addLog(step);
      document.getElementById('queensStepLbl').textContent=`Step ${stepIdx+1}/${steps.length}`;
      const descs={try:'Trying a position — not yet confirmed valid.',place:'Valid! Queen placed. Moving to next row.',backtrack:'All columns exhausted — backtracking to previous row.',invalid:'Conflicts detected — skip this position.',solution:'All 4 queens placed without conflicts!'};
      document.getElementById('queensDesc').innerHTML=`<span class="dv-insight-icon">${{try:'🔍',place:'✅',backtrack:'↩',invalid:'❌',solution:'🏆'}[step.type]}</span>${descs[step.type]}`;
    };
    window.nextQueensStep=()=>{if(stepIdx<steps.length-1){stepIdx++;draw();}};
    window.resetQueens=()=>{stepIdx=0;document.getElementById('queensLog').innerHTML='';draw();};
    draw();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  TRIE VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderTrieVisual(container) {
    const words = ['app','apple','application','apt','bat','ball'];
    class TrieNode{constructor(){this.children={};this.isEnd=false;this.word=null;}}
    const root=new TrieNode();
    words.forEach(w=>{let n=root;for(const c of w){if(!n.children[c])n.children[c]=new TrieNode();n=n.children[c];}n.isEnd=true;n.word=w;});

    container.innerHTML = `
      <div class="dv-header">
        <div class="dv-title">🌲 Trie (Prefix Tree) — O(m) insert/search</div>
        <div class="dv-subtitle">m = word length. Each edge is one character. Shared prefixes share paths.</div>
      </div>
      <div class="dv-controls">
        <input id="trieInput" type="text" placeholder="Search prefix…" class="dv-slider" style="flex:none;width:160px;padding:6px 10px;background:#282828;border:1px solid #3e3e3e;border-radius:5px;color:#eff1f6;font-family:monospace;font-size:13px"/>
        <button class="dv-btn" onclick="searchTrie()">Search</button>
        <button class="dv-btn" onclick="clearTrie()">Clear</button>
      </div>
      <div id="trieViz" style="overflow:auto;padding:8px 0;background:#1e1e1e;border:1px solid #3e3e3e;border-radius:7px;margin:10px 0;padding:12px"></div>
      <div id="trieDesc" class="dv-insight"></div>`;

    let highlightPath='';
    const renderNode=(node,char='',depth=0)=>{
      const inPath=highlightPath&&highlightPath.startsWith((char+'').slice(-depth));
      const onPath=highlightPath&&highlightPath.length>depth-1&&highlightPath[depth-1]===char;
      const matched=onPath||depth===0;
      const children=Object.entries(node.children);
      const bg=node.isEnd?'rgba(0,184,163,.2)':matched&&highlightPath?'rgba(255,184,0,.1)':'#282828';
      const border=node.isEnd?'#00b8a3':matched&&highlightPath?'#ffb800':'#4a4a4a';
      const charColor=matched&&highlightPath&&depth>0?'#ffb800':'#eff1f6';
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="background:${bg};border:1px solid ${border};border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-weight:700;font-size:12px;color:${charColor}">${depth===0?'*':char}${node.isEnd?'$':''}</div>
        ${children.length?`<div style="display:flex;gap:8px;align-items:flex-start">${children.map(([c,cn])=>renderNode(cn,c,depth+1)).join('')}</div>`:''}
      </div>`;
    };
    const draw=()=>{ document.getElementById('trieViz').innerHTML=renderNode(root); };
    window.searchTrie=()=>{
      const q=document.getElementById('trieInput').value.toLowerCase().trim();
      if(!q){clearTrie();return;}
      highlightPath=q;draw();
      let node=root;let found=true;
      for(const c of q){if(!node.children[c]){found=false;break;}node=node.children[c];}
      const suggestions=[];
      const collect=(n,prefix)=>{if(n.isEnd)suggestions.push(prefix);Object.entries(n.children).forEach(([c,cn])=>collect(cn,prefix+c));};
      if(found)collect(node,q);
      document.getElementById('trieDesc').innerHTML=`<span class="dv-insight-icon">${found?'✅':'❌'}</span>
        ${found?`Prefix "<strong style="color:#ffb800">${q}</strong>" found in ${q.length} steps. Words: <strong style="color:#00b8a3">${suggestions.join(', ')||'(none)'}</strong>.`:`Prefix "<strong>${q}</strong>" not in trie.`}
        O(${q.length}) — one step per character.`;
    };
    window.clearTrie=()=>{highlightPath='';draw();document.getElementById('trieInput').value='';document.getElementById('trieDesc').innerHTML='';};
    draw();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  UNION FIND VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderUnionFindVisual(container) {
    const n=7;
    let parent=Array.from({length:n},(_,i)=>i);
    let rank=new Array(n).fill(0);
    const find=(x)=>{if(parent[x]!==x)parent[x]=find(parent[x]);return parent[x];};
    const union=(x,y)=>{const px=find(x),py=find(y);if(px===py)return false;if(rank[px]<rank[py])parent[px]=py;else if(rank[px]>rank[py])parent[py]=px;else{parent[py]=px;rank[px]++;}return true;};
    const ops=[['union',0,1],['union',2,3],['union',4,5],['union',1,2],['union',3,6]];
    let opIdx=0;

    container.innerHTML=`
      <div class="dv-header">
        <div class="dv-title">🔗 Union-Find (Disjoint Set) — O(α n) ≈ O(1)</div>
        <div class="dv-subtitle">Path compression + union by rank. Nearly constant time per operation.</div>
      </div>
      <div class="dv-controls">
        <button class="dv-btn" onclick="nextUFOp()">Next Union ›</button>
        <button class="dv-btn" onclick="resetUF()">↺ Reset</button>
        <span id="ufStep" style="font-size:12px;color:#666c7c;margin-left:8px"></span>
      </div>
      <div id="ufViz" style="margin:10px 0"></div>
      <div id="ufDesc" class="dv-insight"></div>`;

    const colors=['#5b8af5','#a78bfa','#ffb800','#00b8a3','#ef4743','#22c55e','#f59e0b'];
    const draw=()=>{
      const roots={};
      for(let i=0;i<n;i++){const r=find(i);if(!roots[r])roots[r]=[];roots[r].push(i);}
      const groups=Object.values(roots);
      let html='<div style="display:flex;gap:16px;flex-wrap:wrap">';
      groups.forEach((g,gi)=>{
        const c=colors[gi%colors.length];
        html+=`<div style="background:${c}18;border:1px solid ${c}44;border-radius:8px;padding:10px 14px;min-width:80px">
          <div style="font-size:10px;font-weight:700;color:${c};text-transform:uppercase;margin-bottom:7px">Component ${gi+1}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${g.map(v=>`<div style="background:${parent[v]===v?c+'33':'#282828'};border:1px solid ${parent[v]===v?c:'#4a4a4a'};border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-weight:700;font-size:13px;color:${parent[v]===v?c:'#eff1f6'}" title="${parent[v]===v?'root':''}">${v}</div>`).join('')}</div>
        </div>`;
      });
      html+='</div>';
      // Parent array
      html+=`<div style="margin-top:10px"><div style="font-size:10px;font-weight:700;color:#666c7c;text-transform:uppercase;margin-bottom:5px">parent[] array</div><div style="display:flex;gap:3px">${parent.map((p,i)=>`<div style="width:38px;text-align:center;border-radius:4px;padding:6px 4px;background:#1e1e1e;border:1px solid #3e3e3e;font-family:monospace;font-size:11px"><div style="color:#666c7c;font-size:9px">[${i}]</div><div style="font-weight:700;color:${p===i?'#00b8a3':'#eff1f6'}">${p}</div></div>`).join('')}</div></div>`;
      document.getElementById('ufViz').innerHTML=html;
      document.getElementById('ufStep').textContent=`${opIdx}/${ops.length} unions`;
    };
    window.nextUFOp=()=>{
      if(opIdx>=ops.length)return;
      const [,x,y]=ops[opIdx];
      const wasConnected=find(x)===find(y);
      union(x,y);opIdx++;draw();
      document.getElementById('ufDesc').innerHTML=`<span class="dv-insight-icon">💡</span>
        union(${x},${y}): ${wasConnected?`Already in same component — no change.`:`Merged components. find(${x})=find(${y})=${find(x)} now.`} path compression ensures future lookups are O(1).`;
    };
    window.resetUF=()=>{opIdx=0;parent=Array.from({length:n},(_,i)=>i);rank=new Array(n).fill(0);draw();document.getElementById('ufDesc').innerHTML='';};
    draw();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MONOTONIC STACK VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderMonotonicVisual(container) {
    const arr=[2,1,5,3,6,4,8,5];
    const stack=[], result=new Array(arr.length).fill(-1);
    const steps=[];
    for(let i=0;i<arr.length;i++){
      while(stack.length&&arr[stack[stack.length-1]]<arr[i]){
        const popped=stack.pop();result[popped]=arr[i];
        steps.push({i,stack:[...stack],popped,nge:arr[i],result:[...result],action:'pop'});
      }
      stack.push(i);
      steps.push({i,stack:[...stack],popped:null,nge:null,result:[...result],action:'push'});
    }
    let si=0;
    container.innerHTML=`
      <div class="dv-header">
        <div class="dv-title">📉 Monotonic Stack — Next Greater Element</div>
        <div class="dv-subtitle">Maintain a decreasing stack. When a larger element arrives, it's the NGE for all smaller elements waiting.</div>
      </div>
      <div class="dv-controls">
        <button class="dv-btn" onclick="nextMonoStep()">Next ›</button>
        <button class="dv-btn" onclick="resetMono()">↺ Reset</button>
        <span id="monoLbl" style="font-size:12px;color:#666c7c;margin-left:8px"></span>
      </div>
      <div id="monoViz"></div>
      <div id="monoDesc" class="dv-insight" style="margin-top:10px"></div>`;

    const draw=()=>{
      const step=steps[si];
      const arrRow=arr.map((v,i)=>{
        const isI=i===step.i,wasPopped=i===step.popped,inStack=step.stack.includes(i);
        const bg=isI?'rgba(255,184,0,.15)':wasPopped?'rgba(0,184,163,.15)':inStack?'rgba(91,138,245,.1)':'#282828';
        const border=isI?'#ffb800':wasPopped?'#00b8a3':inStack?'#5b8af5':'#4a4a4a';
        const color=isI?'#ffb800':wasPopped?'#00b8a3':inStack?'#5b8af5':'#eff1f6';
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;min-width:42px"><div style="width:42px;height:38px;background:${bg};border:1px solid ${border};border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-weight:700;font-size:14px;color:${color}">${v}</div><div style="font-size:9px;color:#666c7c">[${i}]</div></div>`;
      }).join('');
      const resRow=step.result.map((v,i)=>`<div style="min-width:42px;text-align:center;font-family:monospace;font-size:12px;color:${v!==-1?'#00b8a3':'#3e3e3e'};font-weight:700">${v!==-1?v:'?'}</div>`).join('');
      const stackRow=step.stack.map(i=>`<div style="background:rgba(91,138,245,.12);border:1px solid #5b8af5;border-radius:4px;padding:5px 10px;font-family:monospace;font-weight:700;font-size:12px;color:#5b8af5">${arr[i]}</div>`).join('');
      document.getElementById('monoViz').innerHTML=`
        <div style="margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:#666c7c;text-transform:uppercase;margin-bottom:4px">Array (current index highlighted)</div><div style="display:flex;gap:3px">${arrRow}</div></div>
        <div style="margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:#5b8af5;text-transform:uppercase;margin-bottom:4px">Stack (bottom → top)</div><div style="display:flex;gap:4px;align-items:center;min-height:34px">${stackRow||'<span style="color:#3e3e3e;font-size:11px">empty</span>'}</div></div>
        <div><div style="font-size:10px;font-weight:700;color:#00b8a3;text-transform:uppercase;margin-bottom:4px">Result (NGE for each index)</div><div style="display:flex;gap:3px">${resRow}</div></div>`;
      document.getElementById('monoLbl').textContent=`Step ${si+1}/${steps.length}`;
      const actions={push:`→ Push ${arr[step.i]} at index ${step.i} onto stack.`,pop:`← arr[${step.popped}]=${arr[step.popped]} popped. NGE = ${step.nge}.`};
      document.getElementById('monoDesc').innerHTML=`<span class="dv-insight-icon">💡</span>${actions[step.action]} Stack size=${step.stack.length}.`;
    };
    window.nextMonoStep=()=>{if(si<steps.length-1){si++;draw();}};
    window.resetMono=()=>{si=0;draw();};
    draw();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BIT MANIPULATION VISUAL
  // ══════════════════════════════════════════════════════════════════════════
  function renderBitVisual(container) {
    container.innerHTML=`
      <div class="dv-header">
        <div class="dv-title">🔢 Bit Manipulation — Visual Guide</div>
        <div class="dv-subtitle">Common bit tricks used in competitive programming and interviews</div>
      </div>
      <div class="dv-controls">
        <input id="bitN" type="number" value="42" min="0" max="255" style="width:80px;padding:6px 10px;background:#282828;border:1px solid #3e3e3e;border-radius:5px;color:#eff1f6;font-family:monospace;font-size:13px;outline:none"/>
        <button class="dv-btn" onclick="drawBits()">▶ Visualize</button>
      </div>
      <div id="bitsViz" style="margin:10px 0"></div>`;

    window.drawBits=()=>{
      const n=parseInt(document.getElementById('bitN').value)||0;
      const bits=n.toString(2).padStart(8,'0').split('');
      const ops=[
        {label:'n & 1',desc:'Check if odd',val:(n&1)?'1 (odd)':'0 (even)',color:'#5b8af5'},
        {label:'n >> 1',desc:'Divide by 2',val:n>>1,color:'#a78bfa'},
        {label:'n << 1',desc:'Multiply by 2',val:n<<1,color:'#ffb800'},
        {label:'n & (n-1)',desc:'Clear lowest set bit',val:n&(n-1),color:'#ef4743'},
        {label:'n | (1<<k)',desc:'Set bit k=3',val:n|(1<<3),color:'#00b8a3'},
        {label:'n ^ n',desc:'XOR with itself',val:n^n,color:'#22c55e'},
      ];
      let html=`<div style="margin-bottom:14px">
        <div style="font-size:10px;font-weight:700;color:#666c7c;text-transform:uppercase;margin-bottom:6px">Binary representation of ${n}</div>
        <div style="display:flex;gap:3px;align-items:flex-end">
          ${bits.map((b,i)=>`<div style="width:38px;text-align:center"><div style="font-size:18px;font-family:monospace;font-weight:700;color:${b==='1'?'#00b8a3':'#3e3e3e'}">${b}</div><div style="font-size:9px;color:#666c7c">2^${7-i}</div></div>`).join('')}
          <div style="margin-left:12px;font-size:12px;color:#a8afbf">= ${n}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
        ${ops.map(op=>`<div style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:6px;padding:10px 12px">
          <div style="font-family:monospace;font-size:12px;font-weight:700;color:${op.color}">${op.label}</div>
          <div style="font-size:10px;color:#666c7c;margin:2px 0 6px">${op.desc}</div>
          <div style="font-family:monospace;font-size:13px;font-weight:700;color:#eff1f6">= ${op.val}</div>
        </div>`).join('')}
      </div>`;
      document.getElementById('bitsViz').innerHTML=html;
    };
    window.drawBits();
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  injectStyles();

  // ── Init ────────────────────────────────────────────────────────────────────
  injectStyles();

  return { render };

})();