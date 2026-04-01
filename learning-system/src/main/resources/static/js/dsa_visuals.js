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

    // Decide which visual to show based on topic
    if (key.includes('binary search')) {
      renderLog2Explainer(container);
    } else if (key.includes('hash') || key.includes('two sum')) {
      renderHashmapVisual(container);
    } else if (key.includes('sort')) {
      renderSortingComparison(container);
    } else if (key.includes('two pointer') || key.includes('sliding')) {
      renderWindowVisual(container, key);
    } else if (key.includes('stack')) {
      renderStackVisual(container);
    } else if (key.includes('queue')) {
      renderQueueVisual(container);
    } else if (key.includes('linked list')) {
      renderLinkedListVisual(container);
    } else {
      renderComplexityChart(container);
    }
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

  // ── Init ────────────────────────────────────────────────────────────────────
  injectStyles();

  return { render };

})();