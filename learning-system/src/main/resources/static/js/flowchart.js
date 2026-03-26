/* ══════════════════════════════════════════════════════════════════════════════
   flowchart.js  —  Pre-built Mermaid.js flowcharts keyed by topic title
══════════════════════════════════════════════════════════════════════════════ */

const Flowchart = (() => {

  // ── Flowchart definitions ─────────────────────────────────────────────────
  const CHARTS = {

    'binary search': `
flowchart TD
    A([🟢 Start]) --> B["low = 0\nhigh = arr.length - 1"]
    B --> C{"low ≤ high ?"}
    C -- No --> D(["🔴 return -1\n(not found)"])
    C -- Yes --> E["mid = low + (high - low) / 2"]
    E --> F{"arr[mid] == target ?"}
    F -- Yes --> G(["✅ return mid\n(found!)"])
    F -- No --> H{"arr[mid] < target ?"}
    H -- Yes --> I["low = mid + 1\n(search right half)"]
    H -- No  --> J["high = mid - 1\n(search left half)"]
    I --> C
    J --> C

    style A fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style G fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style D fill:#2e1a1a,stroke:#f87171,color:#f87171
    style F fill:#1e1e2e,stroke:#a78bfa,color:#a78bfa
    style H fill:#1e1e2e,stroke:#fbbf24,color:#fbbf24
    style C fill:#1a1e2e,stroke:#60a5fa,color:#60a5fa
    style I fill:#1a2825,stroke:#34d399,color:#34d399
    style J fill:#2e1a26,stroke:#f472b6,color:#f472b6`,

    'sliding window': `
flowchart TD
    A([🟢 Start]) --> B["Compute initial window\nsum of first k elements"]
    B --> C["maxSum = windowSum"]
    C --> D{"i = k → arr.length - 1\nLoop condition: i < arr.length"}
    D -- Done --> K(["✅ return maxSum"])
    D -- Continue --> E["windowSum += arr[i]\nwindowSum -= arr[i - k]"]
    E --> F{"windowSum > maxSum ?"}
    F -- Yes --> G["maxSum = windowSum\n(new maximum found!)"]
    F -- No  --> H["No update\n(keep current maxSum)"]
    G --> I["i++"]
    H --> I
    I --> D

    style A fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style K fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style F fill:#1a1e2e,stroke:#60a5fa,color:#60a5fa
    style G fill:#1a2825,stroke:#34d399,color:#34d399
    style E fill:#1e1e2e,stroke:#fbbf24,color:#fbbf24`,

    'two pointer': `
flowchart TD
    A([🟢 Start]) --> B["Sort array\nleft = 0, right = n - 1"]
    B --> C{"left < right ?"}
    C -- No --> D(["🔴 return [-1, -1]\n(not found)"])
    C -- Yes --> E["sum = arr[left] + arr[right]"]
    E --> F{"sum == target ?"}
    F -- Yes --> G(["✅ return [left, right]\n(pair found!)"])
    F -- No  --> H{"sum < target ?"}
    H -- Yes --> I["left++\n(need bigger sum)"]
    H -- No  --> J["right--\n(need smaller sum)"]
    I --> C
    J --> C

    style A fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style G fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style D fill:#2e1a1a,stroke:#f87171,color:#f87171
    style F fill:#1e1e2e,stroke:#a78bfa,color:#a78bfa
    style H fill:#1e1e2e,stroke:#fbbf24,color:#fbbf24
    style C fill:#1a1e2e,stroke:#60a5fa,color:#60a5fa
    style I fill:#1a2825,stroke:#34d399,color:#34d399
    style J fill:#2e1a26,stroke:#f472b6,color:#f472b6`,

    'hashmap': `
flowchart TD
    A([🟢 Start]) --> B["Create HashMap\nmap = new HashMap()"]
    B --> C["Iterate over input\nfor each element e"]
    C --> D{"map.containsKey(e) ?"}
    D -- Yes --> E["map.put(e, map.get(e) + 1)\n(increment count)"]
    D -- No  --> F["map.put(e, 1)\n(first occurrence)"]
    E --> G{"More elements ?"}
    F --> G
    G -- Yes --> C
    G -- No  --> H(["✅ Return result\nfrom map"])

    style A fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style H fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style D fill:#1e1e2e,stroke:#fbbf24,color:#fbbf24
    style E fill:#1a2825,stroke:#34d399,color:#34d399`,

    'lru cache': `
flowchart TD
    A([🟢 Start]) --> B["LRU Cache\nHashMap + Doubly Linked List"]
    B --> C{Operation?}
    C -- GET key --> D{"key in map ?"}
    D -- No  --> E(["return -1"])
    D -- Yes --> F["Move node to HEAD\n(most recently used)"]
    F --> G(["return value"])
    C -- PUT key,val --> H{"key in map ?"}
    H -- Yes --> I["Update value\nMove to HEAD"]
    H -- No  --> J{"Cache full ?\n(size == capacity)"}
    J -- Yes --> K["Remove TAIL node\n(least recently used)\nDelete from map"]
    J -- No  --> L["Create new node"]
    K --> L
    I --> M(["Done"])
    L --> N["Add to HEAD\nPut in map"]
    N --> M

    style A fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style G fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style E fill:#2e1a1a,stroke:#f87171,color:#f87171
    style D fill:#1e1e2e,stroke:#60a5fa,color:#60a5fa
    style H fill:#1e1e2e,stroke:#a78bfa,color:#a78bfa
    style J fill:#1e1e2e,stroke:#fbbf24,color:#fbbf24
    style K fill:#2e1a1a,stroke:#fb923c,color:#fb923c`,

    'default': `
flowchart TD
    A([🟢 Start]) --> B["Read input / Initialize variables"]
    B --> C{"Main condition\nmet ?"}
    C -- No  --> D(["🔴 Return / Exit"])
    C -- Yes --> E["Core logic\n(process / compute)"]
    E --> F{"Goal\nachieved ?"}
    F -- Yes --> G(["✅ Return result"])
    F -- No  --> H["Update state\n(adjust pointers / indices)"]
    H --> C

    style A fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style G fill:#1a2e1a,stroke:#4ade80,color:#4ade80
    style D fill:#2e1a1a,stroke:#f87171,color:#f87171
    style C fill:#1a1e2e,stroke:#60a5fa,color:#60a5fa
    style F fill:#1e1e2e,stroke:#a78bfa,color:#a78bfa`
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  function render(topicTitle) {
    const container = document.getElementById('flowchartContainer');
    if (!container) return;

    const key    = (topicTitle || '').toLowerCase().trim();
    const chart  = findChart(key);
    const id     = 'mermaid-' + Date.now();

    container.innerHTML = `
      <div class="flowchart-wrap">
        <div class="flowchart-label">
          <span class="fc-topic-name">${escHtml(topicTitle || 'Algorithm')}</span>
          <span class="fc-algo-tag">${getAlgoLabel(key)}</span>
        </div>
        <div id="${id}" class="mermaid-target"></div>
      </div>
    `;

    if (typeof mermaid === 'undefined') {
      document.getElementById(id).innerHTML =
        '<p style="color:var(--text3);padding:20px">Mermaid.js not loaded — check your internet connection.</p>';
      return;
    }

    mermaid.render('svg-' + id, chart.trim()).then(({ svg }) => {
      document.getElementById(id).innerHTML = svg;
    }).catch(err => {
      document.getElementById(id).innerHTML =
        `<p style="color:var(--red);padding:20px">Render error: ${err.message}</p>`;
    });
  }

  function findChart(key) {
    // Exact match first
    if (CHARTS[key]) return CHARTS[key];
    // Partial match
    for (const k of Object.keys(CHARTS)) {
      if (k !== 'default' && (key.includes(k) || k.includes(key))) return CHARTS[k];
    }
    return CHARTS['default'];
  }

  function getAlgoLabel(key) {
    const labels = {
      'binary search':  'O(log n) — Divide & Conquer',
      'sliding window': 'O(n) — Window Technique',
      'two pointer':    'O(n) — Pointer Technique',
      'hashmap':        'O(n) — Hash Table',
      'lru cache':      'O(1) — HashMap + DLL',
    };
    for (const k of Object.keys(labels)) {
      if (key.includes(k) || k.includes(key)) return labels[k];
    }
    return 'Algorithm Flowchart';
  }

  function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render };
})();
