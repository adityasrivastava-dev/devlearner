/**
 * algorithmFlowDiagrams.js
 *
 * Mermaid flowchart definitions for algorithm families.
 * Used in the "Flow Diagram" tab of AlgorithmDetail.
 *
 * getAlgorithmFlowDiagram(name, category) → Mermaid string | null
 */

// ─── Individual diagrams ──────────────────────────────────────────────────────

const DIAGRAMS = {

  binarySearch: `flowchart TD
    A([🎯 Input: Sorted Array + Target]) --> B[lo = 0 · hi = n-1]
    B --> C{lo ≤ hi ?}
    C -- No --> Z([❌ Return -1  Not Found])
    C -- Yes --> D["mid = ⌊(lo + hi) / 2⌋"]
    D --> E{arr[mid] vs target}
    E -- "= target" --> F([✅ Return mid  Found!])
    E -- "< target  search right" --> H[lo = mid + 1]
    E -- "> target  search left" --> I[hi = mid − 1]
    H --> C
    I --> C
    style A fill:#6366f1,color:#fff,stroke:#4f46e5
    style F fill:#4ade80,color:#000,stroke:#16a34a
    style Z fill:#f87171,color:#000,stroke:#dc2626
    style C fill:#fbbf24,color:#000,stroke:#d97706
    style E fill:#fbbf24,color:#000,stroke:#d97706`,

  linearSearch: `flowchart TD
    A([🎯 Input: Array + Target]) --> B[i = 0]
    B --> C{i < array.length ?}
    C -- No --> Z([❌ Return -1  Not Found])
    C -- Yes --> D{arr[i] = target ?}
    D -- Yes --> F([✅ Return i  Found!])
    D -- No --> H[i = i + 1]
    H --> C
    style A fill:#6366f1,color:#fff
    style F fill:#4ade80,color:#000
    style Z fill:#f87171,color:#000
    style C fill:#fbbf24,color:#000
    style D fill:#fbbf24,color:#000`,

  bubbleSort: `flowchart TD
    A([📋 Input: Unsorted Array]) --> B[pass = 0]
    B --> C{pass < n-1 ?}
    C -- No --> Z([✅ Sorted Array])
    C -- Yes --> D[j = 0]
    D --> E{j < n-1-pass ?}
    E -- No --> G[pass = pass + 1]
    G --> C
    E -- Yes --> F{arr[j] > arr[j+1] ?}
    F -- No --> I[j = j + 1]
    F -- Yes --> H["Swap arr[j] ↔ arr[j+1]"]
    H --> I
    I --> E
    style A fill:#6366f1,color:#fff
    style Z fill:#4ade80,color:#000
    style F fill:#fbbf24,color:#000
    style C fill:#fbbf24,color:#000`,

  mergeSort: `flowchart TD
    A([📋 Input Array]) --> B{length ≤ 1 ?}
    B -- Yes --> Z([✅ Already sorted])
    B -- No --> C["Split into Left + Right halves"]
    C --> D[mergeSort Left]
    C --> E[mergeSort Right]
    D --> F[Merge: compare heads\npick smaller → result]
    E --> F
    F --> G{More elements?}
    G -- Yes --> F
    G -- No --> H[Append remaining]
    H --> I([✅ Sorted Merged Array])
    style A fill:#6366f1,color:#fff
    style I fill:#4ade80,color:#000
    style Z fill:#4ade80,color:#000
    style B fill:#fbbf24,color:#000
    style G fill:#fbbf24,color:#000`,

  quickSort: `flowchart TD
    A([📋 Input Array lo..hi]) --> B{lo < hi ?}
    B -- No --> Z([✅ Base case  done])
    B -- Yes --> C[Choose pivot\ne.g. arr[hi]]
    C --> D[i = lo − 1]
    D --> E{j from lo to hi-1}
    E --> F{arr[j] ≤ pivot ?}
    F -- Yes --> G[i++\nswap arr[i] ↔ arr[j]]
    F -- No --> H[next j]
    G --> H
    H --> E
    E -- done --> I[swap arr[i+1] ↔ arr[hi]\npivotIdx = i+1]
    I --> J[quickSort lo..pivotIdx-1]
    I --> K[quickSort pivotIdx+1..hi]
    style A fill:#6366f1,color:#fff
    style Z fill:#4ade80,color:#000
    style B fill:#fbbf24,color:#000
    style F fill:#fbbf24,color:#000`,

  insertionSort: `flowchart TD
    A([📋 Input Array]) --> B[i = 1]
    B --> C{i < n ?}
    C -- No --> Z([✅ Sorted Array])
    C -- Yes --> D[key = arr[i] · j = i-1]
    D --> E{j ≥ 0 AND arr[j] > key ?}
    E -- Yes --> F["arr[j+1] = arr[j]\nj = j − 1"]
    F --> E
    E -- No --> G["arr[j+1] = key"]
    G --> H[i = i + 1]
    H --> C
    style A fill:#6366f1,color:#fff
    style Z fill:#4ade80,color:#000
    style C fill:#fbbf24,color:#000
    style E fill:#fbbf24,color:#000`,

  selectionSort: `flowchart TD
    A([📋 Input Array]) --> B[i = 0]
    B --> C{i < n-1 ?}
    C -- No --> Z([✅ Sorted Array])
    C -- Yes --> D[minIdx = i · j = i+1]
    D --> E{j < n ?}
    E -- No --> G[swap arr[i] ↔ arr[minIdx]]
    G --> H[i = i + 1]
    H --> C
    E -- Yes --> F{arr[j] < arr[minIdx] ?}
    F -- Yes --> I[minIdx = j]
    F -- No --> J[j = j + 1]
    I --> J
    J --> E
    style A fill:#6366f1,color:#fff
    style Z fill:#4ade80,color:#000
    style C fill:#fbbf24,color:#000
    style F fill:#fbbf24,color:#000`,

  bfs: `flowchart TD
    A([🌐 Start Node]) --> B[Enqueue Start\nMark as Visited]
    B --> C{Queue empty?}
    C -- Yes --> Z([❌ Target unreachable])
    C -- No --> D[Dequeue node u]
    D --> E{u = Target?}
    E -- Yes --> F([✅ Found! Return path])
    E -- No --> G[For each neighbor v of u]
    G --> H{v visited?}
    H -- Yes --> I[skip v]
    H -- No --> J[Mark v visited\nEnqueue v\nrecord parent]
    J --> G
    I --> G
    G -- done --> C
    style A fill:#3b82f6,color:#fff
    style F fill:#4ade80,color:#000
    style Z fill:#f87171,color:#000
    style C fill:#fbbf24,color:#000
    style E fill:#fbbf24,color:#000
    style H fill:#fbbf24,color:#000`,

  dfs: `flowchart TD
    A([🌲 Start Node]) --> B[Push Start onto Stack\nor call DFS start]
    B --> C{Stack empty?\nor all explored?}
    C -- Yes --> Z([❌ Target unreachable])
    C -- No --> D[Pop / visit node u]
    D --> E{u = Target?}
    E -- Yes --> F([✅ Found!])
    E -- No --> G{u visited?}
    G -- Yes --> C
    G -- No --> H[Mark u visited]
    H --> I[For each neighbor v of u]
    I --> J[Push v / recurse DFS v]
    J --> C
    style A fill:#8b5cf6,color:#fff
    style F fill:#4ade80,color:#000
    style Z fill:#f87171,color:#000
    style C fill:#fbbf24,color:#000
    style E fill:#fbbf24,color:#000
    style G fill:#fbbf24,color:#000`,

  dijkstra: `flowchart TD
    A([🗺️ Source Node]) --> B["dist[src]=0\ndist[all others]=∞"]
    B --> C[Add src to Min-Heap]
    C --> D{Heap empty?}
    D -- Yes --> Z([✅ Shortest distances found])
    D -- No --> E[Extract min-dist node u]
    E --> F{u already processed?}
    F -- Yes --> D
    F -- No --> G[Mark u processed]
    G --> H[For each neighbor v of u]
    H --> I{"dist[u]+w(u,v) < dist[v] ?"}
    I -- Yes --> J["dist[v] = dist[u]+w(u,v)\nprev[v] = u\nAdd v to heap"]
    I -- No --> K[next neighbor]
    J --> K
    K --> H
    H -- done --> D
    style A fill:#f59e0b,color:#000
    style Z fill:#4ade80,color:#000
    style D fill:#fbbf24,color:#000
    style F fill:#fbbf24,color:#000
    style I fill:#fbbf24,color:#000`,

  dynamicProgramming: `flowchart TD
    A([🧩 Problem with\nOptimal Substructure]) --> B{Overlapping\nSubproblems?}
    B -- No --> X[Use Divide & Conquer\nnot DP]
    B -- Yes --> C[Define state\ne.g. dp[i] or dp[i][j]]
    C --> D[Identify base cases\ndp[0]=... dp[1]=...]
    D --> E[Write recurrence\ndp[i] = f of dp[i-1] etc.]
    E --> F{Top-Down\nor Bottom-Up?}
    F -- "Top-Down\nMemoization" --> G[Recurse + cache result\nin HashMap]
    F -- "Bottom-Up\nTabulation" --> H[Fill table iteratively\nsmall → large]
    G --> I([✅ Return dp[n]])
    H --> I
    style A fill:#6366f1,color:#fff
    style I fill:#4ade80,color:#000
    style B fill:#fbbf24,color:#000
    style F fill:#fbbf24,color:#000
    style X fill:#f87171,color:#000`,

  backtracking: `flowchart TD
    A([🔀 Start State]) --> B[Choose next candidate]
    B --> C{Is choice valid?}
    C -- No --> G[Prune: skip this branch]
    G --> B
    C -- Yes --> D[Place / commit choice]
    D --> E{Solution complete?}
    E -- Yes --> F([✅ Record / return solution])
    F --> H[Continue searching\nmore solutions?]
    H -- Yes --> I[Undo last choice\nBacktrack]
    H -- No --> Z([✅ All solutions found])
    E -- No --> J[Recurse deeper]
    J --> K{Subtree exhausted?}
    K -- Yes --> I
    K -- No --> E
    I --> B
    style A fill:#ec4899,color:#fff
    style F fill:#4ade80,color:#000
    style Z fill:#4ade80,color:#000
    style C fill:#fbbf24,color:#000
    style E fill:#fbbf24,color:#000
    style H fill:#fbbf24,color:#000
    style K fill:#fbbf24,color:#000`,

  twoPointers: `flowchart TD
    A([📋 Input Array]) --> B{Sorted?\nor two-pass OK?}
    B -- No --> X[Sort first if needed]
    X --> C
    B -- Yes --> C[left = 0\nright = n-1]
    C --> D{left < right ?}
    D -- No --> Z([❌ No pair found])
    D -- Yes --> E{Evaluate\nf of arr[left] arr[right]}
    E -- "= target" --> F([✅ Pair found!])
    E -- "< target\nneed bigger sum" --> G[left = left + 1]
    E -- "> target\nneed smaller sum" --> H[right = right - 1]
    G --> D
    H --> D
    style A fill:#6366f1,color:#fff
    style F fill:#4ade80,color:#000
    style Z fill:#f87171,color:#000
    style D fill:#fbbf24,color:#000
    style E fill:#fbbf24,color:#000`,

  slidingWindow: `flowchart TD
    A([📋 Input Array\n+ Window Constraint]) --> B[left = 0 · right = 0\nwindowState = empty]
    B --> C{right < n ?}
    C -- No --> Z([✅ Return best result])
    C -- Yes --> D[Add arr[right] to window]
    D --> E{Window valid?}
    E -- Yes --> F[Update best result]
    F --> G[right = right + 1]
    G --> C
    E -- No --> H[Shrink: remove arr[left]\nleft = left + 1]
    H --> E
    style A fill:#6366f1,color:#fff
    style Z fill:#4ade80,color:#000
    style C fill:#fbbf24,color:#000
    style E fill:#fbbf24,color:#000`,

  greedy: `flowchart TD
    A([💰 Optimization Problem]) --> B[Sort by greedy criterion\ne.g. deadline · weight · ratio]
    B --> C[result = empty]
    C --> D{More candidates?}
    D -- No --> Z([✅ Return greedy solution])
    D -- Yes --> E[Pick next candidate]
    E --> F{Adding it keeps\nsolution feasible?}
    F -- Yes --> G[Add to result]
    G --> H[Update state]
    H --> D
    F -- No --> I[Discard candidate]
    I --> D
    style A fill:#f59e0b,color:#000
    style Z fill:#4ade80,color:#000
    style D fill:#fbbf24,color:#000
    style F fill:#fbbf24,color:#000`,

  treeTraversal: `flowchart LR
    A([🌳 Root Node]) --> B{Node null?}
    B -- Yes --> R([↩ Return])
    B -- No --> T{Traversal type}
    T -- Inorder\nLeft→Root→Right --> IL[Recurse Left]
    IL --> IR[Visit Root\nprint / process]
    IR --> IG[Recurse Right]
    T -- Preorder\nRoot→Left→Right --> PL[Visit Root]
    PL --> PML[Recurse Left]
    PML --> PMR[Recurse Right]
    T -- Postorder\nLeft→Right→Root --> OL[Recurse Left]
    OL --> OR[Recurse Right]
    OR --> OV[Visit Root]
    style A fill:#10b981,color:#fff
    style R fill:#6b7280,color:#fff
    style T fill:#fbbf24,color:#000
    style B fill:#fbbf24,color:#000`,

  bstSearch: `flowchart TD
    A([🌲 BST Root + Target]) --> B{Node null?}
    B -- Yes --> Z([❌ Not Found])
    B -- No --> C{node.val vs target}
    C -- "= target" --> F([✅ Found!])
    C -- "< target\ngo right" --> R[node = node.right]
    C -- "> target\ngo left" --> L[node = node.left]
    R --> B
    L --> B
    style A fill:#10b981,color:#fff
    style F fill:#4ade80,color:#000
    style Z fill:#f87171,color:#000
    style B fill:#fbbf24,color:#000
    style C fill:#fbbf24,color:#000`,

  heapSort: `flowchart TD
    A([📋 Input Array]) --> B[Build Max-Heap\nheapify all non-leaf nodes\nbottom-up]
    B --> C[i = n-1]
    C --> D{i > 0 ?}
    D -- No --> Z([✅ Sorted Array])
    D -- Yes --> E[Swap arr[0] ↔ arr[i]\nmax element → end]
    E --> F[Heapify root of\nreduced heap 0..i-1]
    F --> G[i = i − 1]
    G --> D
    style A fill:#6366f1,color:#fff
    style Z fill:#4ade80,color:#000
    style D fill:#fbbf24,color:#000`,

  unionFind: `flowchart TD
    A([🔗 Union-Find\nDisjoint Sets]) --> B[Initialize: parent[i]=i\nrank[i]=0]
    B --> C{Operation?}
    C -- Find x --> D["follow parent chain\nuntil root == parent[root]"]
    D --> D2[Path compression:\nall nodes → point to root]
    D2 --> D3([Return root])
    C -- Union x y --> E[rx = find x · ry = find y]
    E --> F{rx == ry ?}
    F -- Yes --> G([Already same set  skip])
    F -- No --> H{rank[rx] vs rank[ry]}
    H -- "rx rank bigger" --> I[parent[ry] = rx]
    H -- "ry rank bigger" --> J[parent[rx] = ry]
    H -- Equal --> K[parent[ry] = rx\nrank[rx]++]
    style A fill:#8b5cf6,color:#fff
    style D3 fill:#4ade80,color:#000
    style G fill:#6b7280,color:#fff
    style C fill:#fbbf24,color:#000
    style F fill:#fbbf24,color:#000
    style H fill:#fbbf24,color:#000`,

  heapPriorityQueue: `flowchart TD
    A([⛰️ Heap / Priority Queue]) --> B{Operation?}
    B -- "insert(val)" --> C[Add to end of array]
    C --> D["Bubble Up:\nwhile parent > child swap\n(Min-Heap)"]
    D --> E([Done — O log n])
    B -- "extractMin()" --> F[Swap root ↔ last element]
    F --> G[Remove last]
    G --> H["Bubble Down:\nwhile child < parent swap\nwith smaller child"]
    H --> I([Return old root — O log n])
    B -- "peek()" --> J([Return arr[0] — O 1])
    style A fill:#f59e0b,color:#000
    style E fill:#4ade80,color:#000
    style I fill:#4ade80,color:#000
    style J fill:#4ade80,color:#000
    style B fill:#fbbf24,color:#000`,

  trieInsertSearch: `flowchart TD
    A([🔡 Trie Operations]) --> B{Operation?}
    B -- "insert(word)" --> C[node = root]
    C --> D{More chars?}
    D -- No --> E[Mark node.isEnd = true]
    D -- Yes --> F{node.children[char] exists?}
    F -- No --> G[Create new TrieNode]
    G --> H[node = node.children[char]]
    F -- Yes --> H
    H --> D
    B -- "search(word)" --> I[node = root]
    I --> J{More chars?}
    J -- No --> K{node.isEnd?}
    K -- Yes --> L([✅ Word found])
    K -- No --> M([❌ Not a word])
    J -- Yes --> N{node.children[char] exists?}
    N -- No --> O([❌ Not found])
    N -- Yes --> P[node = node.children[char]]
    P --> J
    style A fill:#14b8a6,color:#fff
    style L fill:#4ade80,color:#000
    style M fill:#f87171,color:#000
    style O fill:#f87171,color:#000
    style B fill:#fbbf24,color:#000
    style F fill:#fbbf24,color:#000
    style K fill:#fbbf24,color:#000
    style N fill:#fbbf24,color:#000`,
};

// ─── Alias / fuzzy lookup ─────────────────────────────────────────────────────

const MATCHERS = [
  // Exact / close name matches
  [/binary.?search/i,           'binarySearch'],
  [/linear.?search|sequential/i,'linearSearch'],
  [/bubble.?sort/i,             'bubbleSort'],
  [/merge.?sort/i,              'mergeSort'],
  [/quick.?sort/i,              'quickSort'],
  [/insertion.?sort/i,          'insertionSort'],
  [/selection.?sort/i,          'selectionSort'],
  [/heap.?sort/i,               'heapSort'],
  [/bfs|breadth.first/i,        'bfs'],
  [/dfs|depth.first/i,          'dfs'],
  [/dijkstra/i,                 'dijkstra'],
  [/dynamic.?prog|tabulation|memoization|knapsack|lcs|longest/i, 'dynamicProgramming'],
  [/backtrack/i,                'backtracking'],
  [/two.?pointer/i,             'twoPointers'],
  [/sliding.?window/i,          'slidingWindow'],
  [/greedy/i,                   'greedy'],
  [/inorder|preorder|postorder|tree.?travers/i, 'treeTraversal'],
  [/bst|binary.?search.?tree/i, 'bstSearch'],
  [/union.?find|disjoint.?set/i,'unionFind'],
  [/heap|priority.?queue/i,     'heapPriorityQueue'],
  [/trie|prefix.?tree/i,        'trieInsertSearch'],
  // Category-level fallbacks
  [/sort/i,                     'mergeSort'],
  [/search/i,                   'binarySearch'],
  [/graph|bfs|dfs|dijkstra|bellman|floyd|topolog/i, 'bfs'],
  [/tree|traversal/i,           'treeTraversal'],
  [/dp|dynamic/i,               'dynamicProgramming'],
];

/**
 * Returns a Mermaid diagram string for the given algorithm.
 * Falls back to null if no match is found.
 *
 * @param {string} algoName      - Algorithm display name, e.g. "Binary Search"
 * @param {string} [category]    - Algorithm category, e.g. "Sorting"
 * @returns {string|null}
 */
export function getAlgorithmFlowDiagram(algoName = '', category = '') {
  const haystack = `${algoName} ${category}`.trim();

  for (const [pattern, key] of MATCHERS) {
    if (pattern.test(haystack)) {
      return DIAGRAMS[key] ?? null;
    }
  }
  return null;
}
