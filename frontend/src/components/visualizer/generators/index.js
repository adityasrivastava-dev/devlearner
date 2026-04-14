// ─── Array / Sorting (original) ───────────────────────────────────────────────
import {
  generateBinarySearchFrames,
  generateLinearSearchFrames,
  generateBubbleSortFrames,
  generateInsertionSortFrames,
  generateQuickSortFrames,
  generateMergeSortFrames,
  generateTwoPointerFrames,
  generateSlidingWindowFrames,
} from './arrayGenerators';

// ─── Sorting extended ─────────────────────────────────────────────────────────
import {
  generateSelectionSortFrames,
  generateHeapSortFrames,
  generateCountingSortFrames,
  generateRadixSortFrames,
  generateBucketSortFrames,
} from './sortingExtendedGenerators';

// ─── Graph basic ──────────────────────────────────────────────────────────────
import {
  generateBFSFrames,
  generateDFSFrames,
  SAMPLE_GRAPH,
} from './graphGenerators';

// ─── Graph advanced ───────────────────────────────────────────────────────────
import {
  generateDijkstraFrames,
  generateTopologicalSortFrames,
  generateBellmanFordFrames,
  generateFloydWarshallFrames,
  generateKruskalFrames,
  generatePrimFrames,
  generateCycleDetectionFrames,
  generateUnionFindFrames,
  WEIGHTED_GRAPH,
  DAG,
} from './graphAdvancedGenerators';

// ─── Tree basic ───────────────────────────────────────────────────────────────
import {
  generateInorderFrames,
  generatePreorderFrames,
  generatePostorderFrames,
  generateLevelOrderFrames,
  SAMPLE_TREE,
} from './treeGenerators';

// ─── Tree advanced ────────────────────────────────────────────────────────────
import {
  generateTreeHeightFrames,
  generateDiameterFrames,
  generateLCAFrames,
  generatePathSumFrames,
  generateBSTSearchFrames,
} from './treeAdvancedGenerators';

// ─── DP basic ─────────────────────────────────────────────────────────────────
import {
  generateFibonacciFrames,
  generateKnapsackFrames,
  generateLCSFrames,
} from './dpGenerators';

// ─── DP advanced ─────────────────────────────────────────────────────────────
import {
  generateCoinChangeFrames,
  generateLISFrames,
  generateEditDistanceFrames,
  generateSubsetSumFrames,
} from './dpAdvancedGenerators';

// ─── Linked list ──────────────────────────────────────────────────────────────
import {
  generateReverseLinkedListFrames,
  generateFloydCycleDetectionFrames,
  generateMergeSortedListsFrames,
  generateFindMiddleFrames,
  generateRemoveNthFromEndFrames,
} from './linkedListGenerators';

// ─── Stack / Queue ────────────────────────────────────────────────────────────
import {
  generateNextGreaterElementFrames,
  generateValidParenthesesFrames,
  generateMinStackFrames,
  generateLargestRectangleFrames,
} from './stackGenerators';

// ─── Backtracking ────────────────────────────────────────────────────────────
import {
  generateSubsetsFrames,
  generatePermutationsFrames,
  generateCombinationSumFrames,
  generateNQueensFrames,
} from './backtrackingGenerators';

// ─── Greedy ───────────────────────────────────────────────────────────────────
import {
  generateActivitySelectionFrames,
  generateJumpGameFrames,
  generateGasStationFrames,
  generateFractionalKnapsackFrames,
} from './greedyGenerators';

// ─── String / Hashing ────────────────────────────────────────────────────────
import {
  generateKMPFrames,
  generateTwoSumHashFrames,
  generateGroupAnagramsFrames,
  generateMinWindowSubstringFrames,
} from './stringGenerators';

// ─── Default inputs ───────────────────────────────────────────────────────────
export const DEFAULT_INPUTS = {
  // searching
  binarySearch:         { array: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], target: 13 },
  linearSearch:         { array: [4, 2, 7, 1, 9, 3, 6], target: 9 },
  // sorting
  bubbleSort:           { array: [64, 34, 25, 12, 22, 11, 90] },
  insertionSort:        { array: [12, 11, 13, 5, 6] },
  quickSort:            { array: [10, 7, 8, 9, 1, 5] },
  mergeSort:            { array: [38, 27, 43, 3, 9, 82, 10] },
  selectionSort:        { array: [64, 25, 12, 22, 11] },
  heapSort:             { array: [12, 11, 13, 5, 6, 7] },
  countingSort:         { array: [4, 2, 2, 8, 3, 3, 1] },
  radixSort:            { array: [170, 45, 75, 90, 802, 24, 2, 66] },
  bucketSort:           { array: [64, 25, 12, 22, 11] },
  // two pointer / sliding window
  twoPointer:           { array: [1, 2, 3, 4, 5, 6, 7, 8], target: 9 },
  slidingWindow:        { array: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 },
  slidingWindowVariable:{ array: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 },
  // graph basic
  bfs:                  { startNode: 'A' },
  dfs:                  { startNode: 'A' },
  // graph advanced
  dijkstra:             { startNode: 'A' },
  topologicalSort:      {},
  bellmanFord:          { startNode: 'A' },
  floydWarshall:        {},
  kruskal:              {},
  prim:                 { startNode: 'A' },
  cycleDetection:       {},
  unionFind:            {},
  // tree basic
  inorder:              {},
  preorder:             {},
  postorder:            {},
  levelOrder:           {},
  // tree advanced
  treeHeight:           {},
  diameter:             {},
  lca:                  { p: '1', q: '7' },
  pathSum:              { target: 10 },
  bstSearch:            { searchVal: 3 },
  bstOperations:        { searchVal: 3 },
  // DP basic
  fibonacci:            { n: 9 },
  knapsack:             { weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 8 },
  lcs:                  { s1: 'ABCBDAB', s2: 'BDCAB' },
  // DP advanced
  coinChange:           { coins: [1, 5, 6, 9], amount: 11 },
  lis:                  { array: [10, 9, 2, 5, 3, 7, 101, 18] },
  editDistance:         { s1: 'SUNDAY', s2: 'SATURDAY' },
  subsetSum:            { nums: [2, 3, 7, 8, 10], target: 11 },
  // DP memoization / tabulation: map to fibonacci
  memoization:          { n: 9 },
  tabulation:           { n: 9 },
  // linked list
  reverseLinkedList:    { values: [1, 2, 3, 4, 5] },
  floydCycleDetection:  { values: [3, 1, 2, 4, 5, 2], cycleAt: 2 },
  mergeSortedLists:     { l1: [1, 3, 5, 7], l2: [2, 4, 6, 8] },
  findMiddle:           { values: [1, 2, 3, 4, 5, 6] },
  removeNthFromEnd:     { values: [1, 2, 3, 4, 5], n: 2 },
  linkedListRunner:     { values: [1, 2, 3, 4, 5, 6] },
  // stack / queue
  nextGreaterElement:   { array: [4, 5, 2, 10, 8] },
  validParentheses:     { str: '({[]})' },
  minStack:             {},
  monotonicStack:       { heights: [2, 1, 5, 6, 2, 3] },
  largestRectangle:     { heights: [2, 1, 5, 6, 2, 3] },
  heapPriorityQueue:    { array: [12, 11, 13, 5, 6, 7] },
  // backtracking
  generateSubsets:      { nums: [1, 2, 3] },
  permutations:         { nums: [1, 2, 3] },
  combinationSum:       { candidates: [2, 3, 6, 7], target: 7 },
  nQueens:              { n: 4 },
  backtracking:         { nums: [1, 2, 3] },
  // greedy
  activitySelection:    {},
  jumpGame:             { nums: [2, 3, 1, 1, 4] },
  gasStation:           { gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] },
  fractionalKnapsack:   {},
  greedy:               { nums: [2, 3, 1, 1, 4] },
  // string / hashing
  kmp:                  { text: 'AABAACAADAABAABA', pattern: 'AABA' },
  twoSumHash:           { nums: [2, 7, 11, 15], target: 9 },
  groupAnagrams:        { words: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'] },
  minWindowSubstring:   { s: 'ADOBECODEBANC', t: 'ABC' },
};

// ─── Algorithm name → generator key ──────────────────────────────────────────
export function resolveKey(algoName = '', category = '') {
  const name = algoName.toLowerCase();
  const cat  = category.toLowerCase();

  // ── Specific multi-word names FIRST (before any generic single-word checks) ──

  // Tree traversals & tree-specific names (must come before generic 'bfs'/'dfs' checks)
  if (name.includes('level order') || name.includes('level-order'))   return 'levelOrder';
  if (name.includes('binary tree dfs') || (name.includes('dfs') && name.includes('traversal'))) return 'inorder';
  if (name.includes('inorder') || name.includes('in-order'))          return 'inorder';
  if (name.includes('preorder') || name.includes('pre-order'))        return 'preorder';
  if (name.includes('postorder') || name.includes('post-order'))      return 'postorder';

  // Tree advanced (must come before generic 'binary search' check)
  // Use word-boundary-safe check: avoid matching 'substring' for 'bst'
  if (name.includes('binary search tree') || /\bbst\b/.test(name))    return 'bstSearch';
  if (name.includes('lowest common ancestor') || name.includes('lca')) return 'lca';
  if (name.includes('path sum'))                                       return 'pathSum';
  if (name.includes('diameter'))                                       return 'diameter';
  if (name.includes('tree height') || name.includes('height and depth')) return 'treeHeight';

  // Searching (after BST check above)
  if (name.includes('binary search'))           return 'binarySearch';
  if (name.includes('linear search'))           return 'linearSearch';

  // Sorting
  if (name.includes('bubble'))                  return 'bubbleSort';
  if (name.includes('insertion'))               return 'insertionSort';
  if (name.includes('quick'))                   return 'quickSort';
  if (name.includes('merge sort'))              return 'mergeSort';
  if (name.includes('selection sort'))          return 'selectionSort';
  if (name.includes('heap sort'))               return 'heapSort';
  if (name.includes('counting sort'))           return 'countingSort';
  if (name.includes('radix'))                   return 'radixSort';
  if (name.includes('bucket'))                  return 'bucketSort';

  // Two pointer / Sliding window
  if (name.includes('two pointer') || name.includes('two-pointer') || name.includes('opposite')) return 'twoPointer';
  if (name.includes('sliding window') || name.includes('sliding-window')) return 'slidingWindow';

  // Graph basic (after level-order/tree-DFS checks above)
  if (name.includes('bfs') || name.includes('breadth-first') || name.includes('breadth first')) return 'bfs';
  if (name.includes('dfs') || name.includes('depth-first') || name.includes('depth first'))     return 'dfs';

  // Graph advanced
  if (name.includes('dijkstra'))                return 'dijkstra';
  if (name.includes('topological'))             return 'topologicalSort';
  if (name.includes('bellman'))                 return 'bellmanFord';
  if (name.includes('floyd-warshall') || name.includes('floyd warshall')) return 'floydWarshall';
  if (name.includes('kruskal'))                 return 'kruskal';
  if (name.includes('prim'))                    return 'prim';
  if (name.includes("floyd's cycle"))                                  return 'floydCycleDetection';
  if (name.includes('cycle detection'))         return 'cycleDetection';
  if (name.includes('union-find') || name.includes('union find') || name.includes('disjoint')) return 'unionFind';

  // Tree height fallback (catches "tree height and depth" if not caught above)
  if (name.includes('height') || name.includes('depth'))              return 'treeHeight';

  // Linked list specific names BEFORE DP (avoid 'lis' matching 'linked list', 'lists')
  if (name.includes('reverse linked list') || name.includes('reverse list')) return 'reverseLinkedList';
  if (name.includes('merge two sorted') || name.includes('merge sorted')) return 'mergeSortedLists';
  if (name.includes('find middle') || name.includes('middle node'))    return 'findMiddle';
  if (name.includes('remove nth') || name.includes('nth from end'))   return 'removeNthFromEnd';
  if (name.includes('runner') || name.includes('linked list runner')) return 'findMiddle';

  // DP (after linked-list checks to avoid 'lis' matching 'linked list'/'lists')
  if (name.includes('fibonacci') || name.includes('fib'))             return 'fibonacci';
  if (name.includes('memoization') || name.includes('top-down'))      return 'memoization';
  if (name.includes('tabulation') || name.includes('bottom-up'))      return 'tabulation';
  if (name.includes('0/1 knapsack') || name.includes('01 knapsack'))  return 'knapsack';
  if (name.includes('coin change'))                                    return 'coinChange';
  // Word-boundary-safe LIS check: avoid matching 'list', 'lists', 'analysis'
  if (name.includes('longest increasing') || /\blis\b/.test(name))    return 'lis';
  if (name.includes('lcs') || name.includes('longest common subsequence')) return 'lcs';
  if (name.includes('edit distance') || name.includes('levenshtein')) return 'editDistance';
  if (name.includes('subset sum'))                                     return 'subsetSum';

  // Linked List fallback (cycle detection with category guard, catches e.g. "Cycle Detection" in a linked-list section)
  if (name.includes('cycle detection') && cat.includes('linked'))     return 'floydCycleDetection';

  // Stack / Queue
  if (name.includes('next greater'))                                  return 'nextGreaterElement';
  if (name.includes('valid paren') || name.includes('valid bracket')) return 'validParentheses';
  if (name.includes('min stack'))                                      return 'minStack';
  if (name.includes('monotonic stack'))                                return 'monotonicStack';
  if (name.includes('largest rectangle') || name.includes('histogram')) return 'largestRectangle';
  if (name.includes('heap') || name.includes('priority queue'))        return 'heapSort';

  // Backtracking
  if (name.includes('subsets') || name.includes('generate all subsets')) return 'generateSubsets';
  if (name.includes('permutation'))                                    return 'permutations';
  if (name.includes('combination sum'))                                return 'combinationSum';
  if (name.includes('n-queen') || name.includes('n queen'))           return 'nQueens';
  if (name.includes('backtrack'))                                      return 'backtracking';

  // Greedy
  if (name.includes('activity selection'))                             return 'activitySelection';
  if (name.includes('jump game'))                                      return 'jumpGame';
  if (name.includes('gas station'))                                    return 'gasStation';
  if (name.includes('fractional knapsack'))                            return 'fractionalKnapsack';

  // String / Hashing
  if (name.includes('kmp') || name.includes('knuth') || (name.includes('pattern') && name.includes('match'))) return 'kmp';
  if (name.includes('two sum') || name.includes('2sum'))               return 'twoSumHash';
  if (name.includes('group anagram'))                                  return 'groupAnagrams';
  if (name.includes('minimum window') || name.includes('min window')) return 'minWindowSubstring';

  // ─── Category fallbacks ───────────────────────────────────────────────────
  if (cat.includes('sorting'))                  return 'bubbleSort';
  if (cat.includes('searching'))                return 'binarySearch';
  if (cat.includes('two pointer'))              return 'twoPointer';
  if (cat.includes('sliding window'))           return 'slidingWindow';
  if (cat.includes('graph'))                    return 'bfs';
  if (cat.includes('tree') || cat.includes('trees')) return 'inorder';
  if (cat.includes('dynamic') || cat.includes(' dp')) return 'fibonacci';
  if (cat.includes('linked list') || cat.includes('linked_list')) return 'reverseLinkedList';
  if (cat.includes('stack'))                    return 'nextGreaterElement';
  if (cat.includes('backtracking'))             return 'backtracking';
  if (cat.includes('greedy'))                   return 'jumpGame';
  if (cat.includes('string'))                   return 'kmp';
  if (cat.includes('hash'))                     return 'twoSumHash';
  if (cat.includes('heap'))                     return 'heapSort';

  return null;
}

// ─── Main entry: get frames for an algorithm ──────────────────────────────────
export function getVisualizationFrames(algoName, category, customInput = {}) {
  const key = resolveKey(algoName, category);
  if (!key) return null;

  const defaults = DEFAULT_INPUTS[key] || {};
  const inp      = { ...defaults, ...customInput };

  switch (key) {
    // Searching
    case 'binarySearch':         return generateBinarySearchFrames(inp.array, inp.target);
    case 'linearSearch':         return generateLinearSearchFrames(inp.array, inp.target);
    // Sorting
    case 'bubbleSort':           return generateBubbleSortFrames(inp.array);
    case 'insertionSort':        return generateInsertionSortFrames(inp.array);
    case 'quickSort':            return generateQuickSortFrames(inp.array);
    case 'mergeSort':            return generateMergeSortFrames(inp.array);
    case 'selectionSort':        return generateSelectionSortFrames(inp.array);
    case 'heapSort':             return generateHeapSortFrames(inp.array);
    case 'countingSort':         return generateCountingSortFrames(inp.array);
    case 'radixSort':            return generateRadixSortFrames(inp.array);
    case 'bucketSort':           return generateBucketSortFrames(inp.array);
    // Two pointer / SW
    case 'twoPointer':           return generateTwoPointerFrames(inp.array, inp.target);
    case 'slidingWindow':
    case 'slidingWindowVariable':return generateSlidingWindowFrames(inp.array, inp.k);
    // Graph basic
    case 'bfs':                  return generateBFSFrames(SAMPLE_GRAPH, inp.startNode);
    case 'dfs':                  return generateDFSFrames(SAMPLE_GRAPH, inp.startNode);
    // Graph advanced
    case 'dijkstra':             return generateDijkstraFrames(WEIGHTED_GRAPH, inp.startNode);
    case 'topologicalSort':      return generateTopologicalSortFrames(DAG);
    case 'bellmanFord':          return generateBellmanFordFrames(WEIGHTED_GRAPH, inp.startNode);
    case 'floydWarshall':        return generateFloydWarshallFrames();
    case 'kruskal':              return generateKruskalFrames(WEIGHTED_GRAPH);
    case 'prim':                 return generatePrimFrames(WEIGHTED_GRAPH, inp.startNode);
    case 'cycleDetection':       return generateCycleDetectionFrames();
    case 'unionFind':            return generateUnionFindFrames();
    // Tree basic
    case 'inorder':              return generateInorderFrames(SAMPLE_TREE);
    case 'preorder':             return generatePreorderFrames(SAMPLE_TREE);
    case 'postorder':            return generatePostorderFrames(SAMPLE_TREE);
    case 'levelOrder':           return generateLevelOrderFrames(SAMPLE_TREE);
    // Tree advanced
    case 'treeHeight':           return generateTreeHeightFrames(SAMPLE_TREE);
    case 'diameter':             return generateDiameterFrames(SAMPLE_TREE);
    case 'lca':                  return generateLCAFrames(SAMPLE_TREE, inp.p, inp.q);
    case 'pathSum':              return generatePathSumFrames(SAMPLE_TREE, inp.target);
    case 'bstSearch':
    case 'bstOperations':        return generateBSTSearchFrames(SAMPLE_TREE, inp.searchVal);
    // DP basic
    case 'fibonacci':
    case 'memoization':
    case 'tabulation':           return generateFibonacciFrames(inp.n);
    case 'knapsack':             return generateKnapsackFrames(inp.weights, inp.values, inp.capacity);
    case 'lcs':                  return generateLCSFrames(inp.s1, inp.s2);
    // DP advanced
    case 'coinChange':           return generateCoinChangeFrames(inp.coins, inp.amount);
    case 'lis':                  return generateLISFrames(inp.array);
    case 'editDistance':         return generateEditDistanceFrames(inp.s1, inp.s2);
    case 'subsetSum':            return generateSubsetSumFrames(inp.nums, inp.target);
    // Linked list
    case 'reverseLinkedList':    return generateReverseLinkedListFrames(inp.values);
    case 'floydCycleDetection':  return generateFloydCycleDetectionFrames(inp.values, inp.cycleAt);
    case 'mergeSortedLists':     return generateMergeSortedListsFrames(inp.l1, inp.l2);
    case 'findMiddle':
    case 'linkedListRunner':     return generateFindMiddleFrames(inp.values);
    case 'removeNthFromEnd':     return generateRemoveNthFromEndFrames(inp.values, inp.n);
    // Stack / Queue
    case 'nextGreaterElement':   return generateNextGreaterElementFrames(inp.array);
    case 'validParentheses':     return generateValidParenthesesFrames(inp.str);
    case 'minStack':             return generateMinStackFrames();
    case 'monotonicStack':
    case 'largestRectangle':     return generateLargestRectangleFrames(inp.heights);
    case 'heapPriorityQueue':    return generateHeapSortFrames(inp.array);
    // Backtracking
    case 'generateSubsets':      return generateSubsetsFrames(inp.nums);
    case 'permutations':         return generatePermutationsFrames(inp.nums);
    case 'combinationSum':       return generateCombinationSumFrames(inp.candidates, inp.target);
    case 'nQueens':              return generateNQueensFrames(inp.n);
    case 'backtracking':         return generateSubsetsFrames(inp.nums);
    // Greedy
    case 'activitySelection':    return generateActivitySelectionFrames();
    case 'jumpGame':             return generateJumpGameFrames(inp.nums);
    case 'gasStation':           return generateGasStationFrames(inp.gas, inp.cost);
    case 'fractionalKnapsack':   return generateFractionalKnapsackFrames();
    case 'greedy':               return generateJumpGameFrames(inp.nums);
    // String / Hashing
    case 'kmp':                  return generateKMPFrames(inp.text, inp.pattern);
    case 'twoSumHash':           return generateTwoSumHashFrames(inp.nums, inp.target);
    case 'groupAnagrams':        return generateGroupAnagramsFrames(inp.words);
    case 'minWindowSubstring':   return generateMinWindowSubstringFrames(inp.s, inp.t);
    default:                     return null;
  }
}

export { SAMPLE_GRAPH, SAMPLE_TREE, WEIGHTED_GRAPH, DAG };
