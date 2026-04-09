/**
 * ALGORITHMS DATA
 * ─────────────────────────────────────────────────────────────────
 * To add a new algorithm: copy any entry below and fill in the fields.
 * No backend, no DB — just add to this array and it appears on the page.
 *
 * Fields:
 *   id          — unique slug (used in URL hash)
 *   name        — display name
 *   category    — "Searching" | "Sorting" | "Graph" | "Tree" | "Dynamic Programming"
 *                 | "Two Pointer" | "Sliding Window" | "Greedy" | "Backtracking" | "Math"
 *   tags        — array of string tags shown as chips
 *   emoji       — icon shown on the card
 *   timeComplexity  — { best, average, worst }
 *   spaceComplexity — string
 *   stability   — "Stable" | "Unstable" | "N/A"
 *   whenToUse   — short bullet-list string (use \n for newlines)
 *   analogy     — the memorable one-liner that makes it click
 *   story       — 2-4 sentence narrative (the 'aha' moment)
 *   howItWorks  — step-by-step description (use \n between steps)
 *   code        — Java implementation string
 *   useCases    — array of { title, desc } real-world use cases
 *   pitfalls    — array of strings (common mistakes)
 *   mermaid     — optional Mermaid diagram string
 */

export const ALGORITHM_CATEGORIES = [
  { key: 'ALL',               label: 'All',                icon: '🎯' },
  { key: 'Searching',         label: 'Searching',          icon: '🔍' },
  { key: 'Sorting',           label: 'Sorting',            icon: '📊' },
  { key: 'Two Pointer',       label: 'Two Pointer',        icon: '👆' },
  { key: 'Sliding Window',    label: 'Sliding Window',     icon: '🪟' },
  { key: 'Dynamic Programming', label: 'Dynamic Prog.',   icon: '🧩' },
  { key: 'Graph',             label: 'Graph',              icon: '🕸️'  },
  { key: 'Tree',              label: 'Tree',               icon: '🌲' },
  { key: 'Greedy',            label: 'Greedy',             icon: '💰' },
  { key: 'Backtracking',      label: 'Backtracking',       icon: '↩️'  },
  { key: 'Math',              label: 'Math',               icon: '🔢' },
];

export const ALGORITHMS = [

  // ── SEARCHING ────────────────────────────────────────────────────────────
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'Searching',
    tags: ['O(log n)', 'Sorted array', 'Divide & Conquer'],
    emoji: '🔍',
    timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
    spaceComplexity: 'O(1) iterative · O(log n) recursive',
    stability: 'N/A',
    analogy: 'Opening a dictionary in the middle — throw out half the book every time.',
    story: 'Priya is playing a number guessing game. The host says "higher" or "lower" after each guess. Instead of guessing 1, 2, 3... she goes to the middle every time. After 20 guesses she can find any number out of a million. That\'s binary search — eliminate half the problem with every step.',
    whenToUse: '• Array is sorted (or can be sorted)\n• Need O(log n) search speed\n• Finding a boundary / first/last occurrence\n• Searching in monotonic answer space',
    howItWorks: '1. Set low = 0, high = n-1\n2. Find mid = (low + high) / 2\n3. If arr[mid] == target → found!\n4. If arr[mid] < target → search right half (low = mid + 1)\n5. If arr[mid] > target → search left half (high = mid - 1)\n6. Repeat until low > high (not found)',
    code: `public int binarySearch(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2; // avoids integer overflow
        if (arr[mid] == target)  return mid;
        if (arr[mid] < target)   low  = mid + 1;
        else                     high = mid - 1;
    }
    return -1; // not found
}`,
    useCases: [
      { title: 'Dictionary lookup', desc: 'Finding a word by eliminating half the alphabet each step' },
      { title: 'Database indexes', desc: 'B-trees use binary search to find rows in O(log n)' },
      { title: 'Git bisect', desc: 'Finds which commit introduced a bug by binary searching commits' },
      { title: 'Answer space search', desc: '"Find minimum days to ship packages" — binary search on the answer' },
    ],
    pitfalls: [
      'Using (low + high) / 2 — can overflow for large indices. Always use low + (high - low) / 2',
      'Off-by-one: use low <= high (not <) for iterative version',
      'Only works on sorted arrays — forgetting to sort first',
      'Returning mid vs returning the element — know what you need',
    ],
    mermaid: `flowchart TD
    A[low=0, high=n-1] --> B{low <= high?}
    B -->|No| F[return -1]
    B -->|Yes| C[mid = low + high / 2]
    C --> D{arr mid == target?}
    D -->|Yes| E[return mid]
    D -->|arr mid < target| G[low = mid + 1]
    D -->|arr mid > target| H[high = mid - 1]
    G --> B
    H --> B`,
  },

  {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'Searching',
    tags: ['O(n)', 'Unsorted', 'Simple'],
    emoji: '🔦',
    timeComplexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
    spaceComplexity: 'O(1)',
    stability: 'N/A',
    analogy: 'Checking every seat in a cinema row until you find your friend.',
    story: 'The simplest search — go through every element one by one until you find what you\'re looking for. No sorting needed. Best when the array is small, unsorted, or you\'re only searching once.',
    whenToUse: '• Array is unsorted and sorting is too expensive\n• Array is small (< 100 elements)\n• Searching only once (sorting overhead not worth it)\n• Need to find all occurrences, not just one',
    howItWorks: '1. Start at index 0\n2. Compare current element to target\n3. If match → return index\n4. Move to next element\n5. If end reached → return -1',
    code: `public int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}`,
    useCases: [
      { title: 'Finding in unsorted list', desc: 'Searching a list of recent files — no guaranteed order' },
      { title: 'Small collections', desc: 'Config lookup with 5-10 items — O(n) is fine' },
      { title: 'Find all matches', desc: 'Collecting all indices where a condition is true' },
    ],
    pitfalls: [
      'Using linear search on sorted arrays — binary search is O(log n) vs O(n)',
      'Using in nested loops — O(n²) total, consider a HashSet instead',
    ],
  },

  // ── SORTING ──────────────────────────────────────────────────────────────
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    tags: ['O(n²)', 'Stable', 'In-place', 'Simple'],
    emoji: '🫧',
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stability: 'Stable',
    analogy: 'Heavier bubbles sink to the bottom — the largest element bubbles to the end each pass.',
    story: 'The teacher asks students to sort themselves by height. They compare neighbours: if left is taller, swap. After one full pass, the tallest is at the right end. Repeat for the rest. Simple, but slow — O(n²) for n students.',
    whenToUse: '• Teaching/learning sorting concepts\n• Nearly sorted data (best case O(n))\n• Very small arrays where simplicity matters\n• Almost never in production',
    howItWorks: '1. Outer loop: n-1 passes\n2. Inner loop: compare adjacent pairs\n3. Swap if left > right\n4. After each pass, largest unsorted element is in place\n5. Optimisation: stop if no swaps in a pass (already sorted)',
    code: `public void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j]   = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) break; // already sorted — O(n) best case
    }
}`,
    useCases: [
      { title: 'Education', desc: 'Easiest sorting algorithm to visualise and explain' },
      { title: 'Nearly sorted data', desc: 'With the early-exit optimisation, detects sorted arrays in O(n)' },
    ],
    pitfalls: [
      'Using on large arrays — O(n²) is disastrous at scale',
      'Forgetting the early-exit optimisation (the swapped flag)',
    ],
  },

  {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'Sorting',
    tags: ['O(n log n)', 'Stable', 'Divide & Conquer', 'Recursive'],
    emoji: '🔀',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    stability: 'Stable',
    analogy: 'Split a pile of papers into single sheets, then merge them in order — two sorted piles merge into one in O(n).',
    story: 'A librarian needs to sort 1000 books. She splits them in half, gives each half to an assistant, and the assistants split their halves again — all the way down to single books (already "sorted"). Then they merge pairs back together. Merging two sorted piles is trivial: just take the smaller front card each time.',
    whenToUse: '• Need guaranteed O(n log n) in all cases\n• Stable sort required (equal elements keep original order)\n• Sorting linked lists (no random access needed)\n• External sorting (data too large to fit in memory)',
    howItWorks: '1. Base case: array of 1 element is sorted\n2. Split array in half\n3. Recursively sort left half\n4. Recursively sort right half\n5. Merge two sorted halves into one sorted array\n6. Merge: compare front of each half, take smaller',
    code: `public void mergeSort(int[] arr, int left, int right) {
    if (left >= right) return; // base case
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}

private void merge(int[] arr, int left, int mid, int right) {
    int[] temp = new int[right - left + 1];
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) temp[k++] = arr[i++];
        else                   temp[k++] = arr[j++];
    }
    while (i <= mid)   temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    System.arraycopy(temp, 0, arr, left, temp.length);
}`,
    useCases: [
      { title: 'Java Arrays.sort() for objects', desc: 'Java uses TimSort (merge sort hybrid) for object arrays' },
      { title: 'External sorting', desc: 'Sorting files larger than RAM — split, sort chunks, merge' },
      { title: 'Inversion count', desc: 'Count how many swaps are needed to sort — classic merge sort variant' },
      { title: 'Linked list sorting', desc: 'Merge sort works without random access, perfect for linked lists' },
    ],
    pitfalls: [
      'O(n) extra space — not suitable when memory is the constraint (use quicksort)',
      'Recursive stack depth: O(log n) — can cause stack overflow for very large arrays',
      'Not in-place — the merge step requires a temporary array',
    ],
  },

  {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: 'Sorting',
    tags: ['O(n log n) avg', 'Unstable', 'In-place', 'Pivot'],
    emoji: '⚡',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
    spaceComplexity: 'O(log n) stack',
    stability: 'Unstable',
    analogy: 'Pick a captain, put everyone shorter to the left and taller to the right — then do the same for each group.',
    story: 'Imagine sorting a class photo. Pick one student as the "pivot". Everyone shorter stands left, everyone taller stands right. Now repeat for each side. The pivot is always in its final position after partitioning — each step eliminates at least one element\'s uncertainty.',
    whenToUse: '• General-purpose sorting (cache-friendly, fast in practice)\n• In-place sorting required\n• Don\'t need stable sort\n• Average case performance is priority (O(n log n) with small constants)',
    howItWorks: '1. Choose a pivot (last, first, or random element)\n2. Partition: move elements < pivot to left, > pivot to right\n3. Pivot is now in its final sorted position\n4. Recursively sort left partition\n5. Recursively sort right partition',
    code: `public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pivotIdx = partition(arr, low, high);
        quickSort(arr, low, pivotIdx - 1);
        quickSort(arr, pivotIdx + 1, high);
    }
}

private int partition(int[] arr, int low, int high) {
    int pivot = arr[high]; // last element as pivot
    int i = low - 1;       // index of smaller element
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
        }
    }
    // Place pivot in correct position
    int temp = arr[i+1]; arr[i+1] = arr[high]; arr[high] = temp;
    return i + 1;
}`,
    useCases: [
      { title: 'Java Arrays.sort() for primitives', desc: 'Java uses dual-pivot quicksort for primitive arrays (int[], long[])' },
      { title: 'Cache-efficient sorting', desc: 'Sequential memory access makes quicksort CPU-cache friendly' },
      { title: 'Kth largest element', desc: 'QuickSelect (partition only on one side) finds kth element in O(n) avg' },
    ],
    pitfalls: [
      'Worst case O(n²) on already-sorted arrays with naive pivot — use random pivot',
      'Not stable — equal elements may change relative order',
      'Deep recursion on skewed partitions can cause stack overflow',
    ],
  },

  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'Sorting',
    tags: ['O(n²)', 'Stable', 'Adaptive', 'In-place'],
    emoji: '🃏',
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stability: 'Stable',
    analogy: 'Sorting playing cards in your hand — pick each new card and slide it into the right position among the already-sorted cards.',
    story: 'You\'re dealt cards one by one. Each new card you receive, you slide it left past cards that are bigger until it\'s in the right spot. Your left hand is always sorted. This is exactly insertion sort — maintain a sorted region and insert each new element into the right position.',
    whenToUse: '• Small arrays (< 20 elements) — faster than merge/quick due to low overhead\n• Nearly sorted data — O(n) best case\n• Online sorting — sort as data arrives\n• Used as base case in hybrid sorts (TimSort)',
    howItWorks: '1. Start with first element (considered sorted)\n2. For each remaining element: pick it up\n3. Shift sorted elements right until correct position found\n4. Insert the element\n5. Repeat for all elements',
    code: `public void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i];
        int j = i - 1;
        // Shift elements greater than key one position to the right
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
    useCases: [
      { title: 'TimSort base case', desc: 'Java and Python\'s sort uses insertion sort for small subarrays' },
      { title: 'Real-time sorting', desc: 'Sorting a leaderboard as scores come in — insert each score in position' },
      { title: 'Small embedded systems', desc: 'Simple, low-memory sorting when code size matters' },
    ],
    pitfalls: [
      'O(n²) on large arrays — always prefer merge/quick sort for n > 50',
      'Forgetting it\'s the best choice for nearly-sorted data',
    ],
  },

  // ── TWO POINTER ──────────────────────────────────────────────────────────
  {
    id: 'two-pointer',
    name: 'Two Pointer',
    category: 'Two Pointer',
    tags: ['O(n)', 'Sorted array', 'In-place', 'Squeeze'],
    emoji: '👆',
    timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
    spaceComplexity: 'O(1)',
    stability: 'N/A',
    analogy: 'Two detectives starting at opposite ends of a suspect list — they walk toward each other until they find the pair.',
    story: 'You need to find two numbers in a sorted array that add up to a target. Brute force: check every pair — O(n²). Two pointer: start one pointer at the left (smallest), one at the right (largest). If their sum is too small, move left pointer right. If too large, move right pointer left. They converge in O(n).',
    whenToUse: '• Finding pairs/triplets with a property in sorted arrays\n• Removing duplicates in-place\n• Palindrome checking\n• Merging two sorted arrays\n• Partitioning problems',
    howItWorks: '1. Place left pointer at start, right at end\n2. Compute sum/comparison of arr[left] and arr[right]\n3. If too small → left++ (increase sum)\n4. If too large → right-- (decrease sum)\n5. If match → record and move both\n6. Stop when left >= right',
    code: `// Example: Two Sum in sorted array
public int[] twoSum(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if      (sum == target) return new int[]{left, right};
        else if (sum < target)  left++;
        else                    right--;
    }
    return new int[]{-1, -1}; // not found
}

// Example: Remove duplicates in-place
public int removeDuplicates(int[] arr) {
    int slow = 0;
    for (int fast = 1; fast < arr.length; fast++) {
        if (arr[fast] != arr[slow]) {
            arr[++slow] = arr[fast];
        }
    }
    return slow + 1; // new length
}`,
    useCases: [
      { title: 'Two Sum (sorted)', desc: 'Find pair summing to target in O(n) instead of O(n²)' },
      { title: 'Valid palindrome', desc: 'Check if string reads same forwards/backwards' },
      { title: 'Container with most water', desc: 'Maximize area between two heights — classic two pointer' },
      { title: 'Three Sum', desc: 'Fix one element, use two pointer for the remaining pair' },
    ],
    pitfalls: [
      'Only works reliably on sorted arrays for sum/difference problems',
      'Confusing fast/slow pointers (cycle detection) with left/right pointers',
      'Off-by-one: use left < right (not <=) to avoid same element comparison',
    ],
  },

  // ── SLIDING WINDOW ────────────────────────────────────────────────────────
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    category: 'Sliding Window',
    tags: ['O(n)', 'Subarray', 'Substring', 'Running state'],
    emoji: '🪟',
    timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
    spaceComplexity: 'O(1) fixed · O(k) variable',
    stability: 'N/A',
    analogy: 'A camera panning across a scene — slide forward, don\'t restart. Subtract what leaves, add what arrives.',
    story: 'Priya needs the maximum sum of any 7 consecutive days of sales data in a year. Brute force: compute every window from scratch — O(n·k). Sliding window: compute the first window, then for each next window subtract the leftmost day and add the new rightmost day. O(n) total, regardless of window size.',
    whenToUse: '• Maximum/minimum sum subarray of size k\n• Longest substring with at most k distinct characters\n• Minimum window containing all characters\n• Any problem asking for a contiguous subarray/substring with a constraint',
    howItWorks: 'Fixed window:\n1. Compute sum of first k elements\n2. Slide: sum += arr[right] - arr[left-1], update max\n\nVariable window:\n1. Expand right pointer until constraint violated\n2. Shrink left pointer until constraint satisfied again\n3. Track max/min window size',
    code: `// Fixed window: max sum subarray of size k
public int maxSumFixed(int[] arr, int k) {
    int windowSum = 0;
    for (int i = 0; i < k; i++) windowSum += arr[i];
    int maxSum = windowSum;
    for (int i = k; i < arr.length; i++) {
        windowSum += arr[i] - arr[i - k]; // slide
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}

// Variable window: longest substring with at most k distinct chars
public int longestKDistinct(String s, int k) {
    Map<Character, Integer> freq = new HashMap<>();
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.length(); right++) {
        freq.merge(s.charAt(right), 1, Integer::sum);
        while (freq.size() > k) {           // shrink
            char c = s.charAt(left++);
            freq.merge(c, -1, Integer::sum);
            if (freq.get(c) == 0) freq.remove(c);
        }
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}`,
    useCases: [
      { title: 'Rate limiting', desc: 'Count requests in a rolling time window' },
      { title: 'Moving average', desc: 'Finance: compute average price over last N days in O(1) per step' },
      { title: 'Network packet analysis', desc: 'Detect patterns in a stream of packets' },
      { title: 'Minimum window substring', desc: 'Find shortest substring containing all required characters' },
    ],
    pitfalls: [
      'Using O(k) recomputation instead of O(1) slide — the whole point is avoid recompute',
      'Confusing fixed vs variable window — read the problem carefully',
      'Variable window: forgetting to shrink the left pointer when constraint is violated',
    ],
  },

  // ── DYNAMIC PROGRAMMING ──────────────────────────────────────────────────
  {
    id: 'fibonacci-dp',
    name: 'Dynamic Programming (Fibonacci)',
    category: 'Dynamic Programming',
    tags: ['Memoization', 'Tabulation', 'Overlapping subproblems', 'Optimal substructure'],
    emoji: '🧩',
    timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
    spaceComplexity: 'O(n) memo · O(1) optimised',
    stability: 'N/A',
    analogy: 'Write answers on sticky notes — never solve the same sub-problem twice.',
    story: 'The naive recursive Fibonacci calls fib(5) → fib(4) + fib(3) → fib(3) + fib(2) + fib(2) + fib(1)... It recalculates fib(3) twice, fib(2) four times. For fib(50) it makes 2⁵⁰ calls. DP says: calculate each value once, store it, reuse it. O(2ⁿ) becomes O(n).',
    whenToUse: '• Problem has overlapping subproblems (same sub-problem computed multiple times)\n• Problem has optimal substructure (optimal solution built from optimal sub-solutions)\n• Classic signals: "minimum/maximum number of ways", "count paths", "longest/shortest sequence"',
    howItWorks: 'Approach 1 — Top-down (Memoization):\n1. Write recursive solution\n2. Add a cache (memo array or HashMap)\n3. Before computing, check cache\n4. After computing, store in cache\n\nApproach 2 — Bottom-up (Tabulation):\n1. Identify base cases\n2. Fill a table from smallest to largest\n3. Each cell uses previously computed cells',
    code: `// Top-down (memoization)
public int fibMemo(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != 0) return memo[n]; // cache hit
    memo[n] = fibMemo(n-1, memo) + fibMemo(n-2, memo);
    return memo[n];
}

// Bottom-up (tabulation)
public int fibTab(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n + 1];
    dp[0] = 0; dp[1] = 1;
    for (int i = 2; i <= n; i++)
        dp[i] = dp[i-1] + dp[i-2];
    return dp[n];
}

// Space-optimised bottom-up: O(1) space
public int fibOptimised(int n) {
    if (n <= 1) return n;
    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}`,
    useCases: [
      { title: 'Coin change', desc: 'Minimum coins to make a sum — classic DP' },
      { title: 'Longest Common Subsequence', desc: 'Used in diff tools, DNA sequence alignment' },
      { title: 'Knapsack problem', desc: 'Maximise value within a weight limit' },
      { title: 'Edit distance', desc: 'Spell checkers, auto-correct — minimum edits between strings' },
    ],
    pitfalls: [
      'Trying to apply DP without verifying overlapping subproblems — not every recursive problem benefits',
      'Memoization with wrong key — ensure the cache key captures all state',
      'Bottom-up: filling the table in wrong order (future cell depends on cells not yet computed)',
    ],
  },

  // ── GRAPH ────────────────────────────────────────────────────────────────
  {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    category: 'Graph',
    tags: ['O(V+E)', 'Queue', 'Shortest path', 'Level order'],
    emoji: '🌊',
    timeComplexity: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
    spaceComplexity: 'O(V)',
    stability: 'N/A',
    analogy: 'Ripples spreading outward from a stone dropped in water — visit all nodes at distance 1 before distance 2.',
    story: 'You\'re lost in a maze and want the shortest exit route. BFS explores all paths of length 1 first, then length 2, then length 3. The first time it reaches the exit is guaranteed to be the shortest path. DFS might take a long winding path; BFS guarantees the shortest.',
    whenToUse: '• Shortest path in unweighted graph\n• Level-order traversal of trees\n• Finding all nodes at distance k\n• Checking if graph is bipartite\n• Word ladder problems',
    howItWorks: '1. Add start node to Queue, mark visited\n2. While queue is not empty:\n3.   Dequeue node u\n4.   Process u\n5.   For each unvisited neighbour v of u:\n6.     Mark v visited\n7.     Enqueue v',
    code: `public void bfs(Map<Integer, List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);
    visited.add(start);

    while (!queue.isEmpty()) {
        int node = queue.poll();
        System.out.print(node + " ");

        for (int neighbor : graph.getOrDefault(node, List.of())) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.offer(neighbor);
            }
        }
    }
}

// BFS shortest path distance
public int shortestPath(Map<Integer,List<Integer>> g, int src, int dst) {
    if (src == dst) return 0;
    Set<Integer> visited = new HashSet<>();
    Queue<int[]> queue = new LinkedList<>(); // {node, distance}
    queue.offer(new int[]{src, 0});
    visited.add(src);
    while (!queue.isEmpty()) {
        int[] curr = queue.poll();
        for (int nb : g.getOrDefault(curr[0], List.of())) {
            if (nb == dst) return curr[1] + 1;
            if (visited.add(nb)) queue.offer(new int[]{nb, curr[1]+1});
        }
    }
    return -1; // unreachable
}`,
    useCases: [
      { title: 'Social networks', desc: '"People you may know" — find users within 2 connections' },
      { title: 'GPS/Maps shortest route', desc: 'Unweighted shortest path in street graph' },
      { title: 'Web crawlers', desc: 'Crawl pages layer by layer from a seed URL' },
      { title: 'Rotten oranges', desc: 'Multi-source BFS — infect all oranges level by level' },
    ],
    pitfalls: [
      'Forgetting to mark nodes visited BEFORE enqueuing (not after dequeuing) — causes duplicates',
      'Using BFS for weighted graphs — use Dijkstra\'s algorithm instead',
      'Not handling disconnected graphs — run BFS from every unvisited node',
    ],
  },

  {
    id: 'dfs',
    name: 'Depth-First Search (DFS)',
    category: 'Graph',
    tags: ['O(V+E)', 'Stack/Recursion', 'Backtracking', 'Cycle detection'],
    emoji: '🌲',
    timeComplexity: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
    spaceComplexity: 'O(V) stack',
    stability: 'N/A',
    analogy: 'Exploring a cave system — go as deep as possible down one tunnel before backtracking to try another.',
    story: 'DFS commits fully to one path. It goes deeper and deeper until it hits a dead end, then backtracks and tries the next option. Unlike BFS which explores all neighbours first, DFS explores one branch completely. This makes it perfect for detecting cycles, finding connected components, and topological sorting.',
    whenToUse: '• Cycle detection in graphs\n• Topological sort\n• Finding connected components\n• Path existence (not shortest path)\n• Generating permutations/combinations (backtracking)\n• Solving mazes',
    howItWorks: 'Recursive:\n1. Mark current node as visited\n2. Process current node\n3. For each unvisited neighbour: recurse\n\nIterative:\n1. Push start node on stack\n2. Pop node, mark visited, process\n3. Push all unvisited neighbours',
    code: `// Recursive DFS
public void dfsRecursive(Map<Integer,List<Integer>> graph,
                         int node, Set<Integer> visited) {
    visited.add(node);
    System.out.print(node + " ");
    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor))
            dfsRecursive(graph, neighbor, visited);
    }
}

// Cycle detection (directed graph)
public boolean hasCycle(Map<Integer,List<Integer>> graph, int nodes) {
    Set<Integer> visited = new HashSet<>();
    Set<Integer> inStack = new HashSet<>(); // current DFS path
    for (int i = 0; i < nodes; i++)
        if (!visited.contains(i) && dfsHasCycle(graph, i, visited, inStack))
            return true;
    return false;
}

private boolean dfsHasCycle(Map<Integer,List<Integer>> g,
        int node, Set<Integer> visited, Set<Integer> inStack) {
    visited.add(node); inStack.add(node);
    for (int nb : g.getOrDefault(node, List.of())) {
        if (!visited.contains(nb) && dfsHasCycle(g, nb, visited, inStack)) return true;
        if (inStack.contains(nb)) return true; // back edge = cycle
    }
    inStack.remove(node);
    return false;
}`,
    useCases: [
      { title: 'Dependency resolution', desc: 'Topological sort of build tasks or package dependencies' },
      { title: 'Maze solving', desc: 'Explore paths depth-first, backtrack on dead ends' },
      { title: 'Connected components', desc: 'Find all islands in a grid (flood fill)' },
      { title: 'Number of islands', desc: 'DFS from each unvisited land cell, mark all connected land' },
    ],
    pitfalls: [
      'Stack overflow on deep graphs — use iterative DFS with explicit stack for production',
      'Cycle detection: directed vs undirected graphs need different approaches',
      'For shortest path, BFS is correct — DFS finds A path, not the shortest path',
    ],
  },

];