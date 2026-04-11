/**
 * VisualizationPlan — renders the 8-section animation blueprint
 * below the interactive AlgorithmVisualizer in the Visual tab.
 *
 * Sections:
 *  1. Pattern Meta Bar    — pattern name, complexity class, key technique
 *  2. Color Legend        — every cell/node color used in the animation
 *  3. Event Flow          — horizontal sequence of animation event types
 *  4. Annotated Pseudocode — howItWorks steps tagged with hook type badges
 *  5. Pattern Insight     — pattern family + when to use (first line)
 */

import styles from './VisualizationPlan.module.css';

// ─── Color legends ─────────────────────────────────────────────────────────────
// Each entry: { bg, border, label, desc }
const COLOR_LEGENDS = {
  Searching: [
    { bg: 'rgba(99,102,241,.15)',  border: '#6366f1', label: 'Active / Mid',      desc: 'Currently being examined' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Low / High Bound',  desc: 'Active search boundary' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Found ✓',           desc: 'Target element located' },
    { bg: 'rgba(30,41,59,.7)',     border: '#334155', label: 'Excluded',          desc: 'Out of search range' },
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Unsearched', desc: 'Not yet visited' },
  ],
  Sorting: [
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Unsorted',   desc: 'Not yet in final position' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Comparing',        desc: 'Being compared this step' },
    { bg: 'rgba(248,113,113,.2)',  border: '#f87171', label: 'Swapping',         desc: 'Elements being exchanged' },
    { bg: 'rgba(251,146,60,.2)',   border: '#fb923c', label: 'Pivot',            desc: 'Partition reference point' },
    { bg: 'rgba(74,222,128,.1)',   border: '#86efac', label: 'Sorted ✓',         desc: 'In final correct position' },
  ],
  'Two Pointer': [
    { bg: 'rgba(99,102,241,.15)',  border: '#6366f1', label: 'Left Pointer',     desc: 'Left boundary of range' },
    { bg: 'rgba(248,113,113,.2)',  border: '#f87171', label: 'Right Pointer',    desc: 'Right boundary of range' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Active Range',     desc: 'Current two-pointer window' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Match / Done',     desc: 'Condition satisfied' },
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Unprocessed',desc: 'Not yet reached' },
  ],
  'Sliding Window': [
    { bg: 'rgba(139,92,246,.18)',  border: '#8b5cf6', label: 'In Window',        desc: 'Currently inside the window' },
    { bg: 'rgba(99,102,241,.15)',  border: '#6366f1', label: 'Window Start (L)', desc: 'Left edge pointer' },
    { bg: 'rgba(248,113,113,.2)',  border: '#f87171', label: 'Window End (R)',   desc: 'Right edge pointer' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Best Answer',      desc: 'Max/min window found so far' },
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Outside',   desc: 'Excluded from window' },
  ],
  Graph: [
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Unvisited', desc: 'Not yet discovered' },
    { bg: 'rgba(251,191,36,.2)',   border: '#fbbf24', label: 'In Queue / Stack',desc: 'Discovered, waiting to process' },
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'Processing',      desc: 'Currently being expanded' },
    { bg: 'rgba(74,222,128,.18)',  border: '#4ade80', label: 'Visited ✓',       desc: 'Fully explored' },
    { bg: 'rgba(248,113,113,.25)', border: '#f87171', label: 'Wall / Blocked',  desc: 'Cannot traverse' },
  ],
  'Dynamic Programming': [
    { bg: 'var(--bg4)',            border: 'var(--border)', label: 'Empty',      desc: 'Not yet computed' },
    { bg: 'rgba(74,222,128,.12)',  border: '#86efac', label: 'Filled ✓',        desc: 'Value computed & stored' },
    { bg: 'rgba(251,191,36,.18)',  border: '#fbbf24', label: 'Current',         desc: 'Being computed right now' },
    { bg: 'rgba(99,102,241,.15)',  border: '#6366f1', label: 'Dependency',      desc: 'Values used for current cell' },
    { bg: 'rgba(139,92,246,.15)',  border: '#8b5cf6', label: 'Optimal Path',   desc: 'Part of optimal subproblem' },
  ],
  Trees: [
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Unvisited', desc: 'Not yet traversed' },
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'Visiting',        desc: 'Currently being processed' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Visited ✓',       desc: 'Processing complete' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'In Path',         desc: 'Part of current traversal path' },
    { bg: 'rgba(251,146,60,.15)',  border: '#fb923c', label: 'Target / LCA',    desc: 'Special node (target or LCA)' },
  ],
  'Linked List': [
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Normal Node',desc: 'Standard list node' },
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'Current (curr)',  desc: 'Pointer being processed' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Previous (prev)', desc: 'Previous pointer (for reversal)' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Slow Pointer',    desc: "Slow pointer — Floyd's / mid" },
    { bg: 'rgba(248,113,113,.2)',  border: '#f87171', label: 'Fast Pointer',    desc: 'Fast pointer (2x speed)' },
  ],
  Stack: [
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'In Stack',  desc: 'Waiting for its answer' },
    { bg: 'rgba(251,191,36,.18)',  border: '#fbbf24', label: 'Stack Top',       desc: 'Most recently pushed element' },
    { bg: 'rgba(99,102,241,.15)',  border: '#6366f1', label: 'Just Pushed',     desc: 'Element pushed this step' },
    { bg: 'rgba(248,113,113,.2)',  border: '#f87171', label: 'Popped',          desc: 'Removed and answer recorded' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Answer Found',    desc: 'Next greater/smaller located' },
  ],
  Backtracking: [
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Unexplored',desc: 'Not yet tried' },
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'In Current Path', desc: 'Part of active exploration' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Valid Solution',  desc: 'Satisfies all constraints' },
    { bg: 'rgba(248,113,113,.2)',  border: '#f87171', label: 'Pruned',          desc: 'Constraint violated — backtrack' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Backtracking',    desc: 'Undoing last choice' },
  ],
  Greedy: [
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Unprocessed',desc: 'Not yet considered' },
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'Evaluating',      desc: 'Being considered for selection' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Selected ✓',      desc: 'Greedy choice made' },
    { bg: 'rgba(248,113,113,.15)', border: '#f87171', label: 'Rejected',        desc: 'Not the greedy choice' },
    { bg: 'rgba(251,146,60,.15)',  border: '#fb923c', label: 'Global Best',     desc: 'Best accumulated so far' },
  ],
  Hashing: [
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Unchecked', desc: 'Not yet processed' },
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'Current Element', desc: 'Being processed now' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'In HashMap',      desc: 'Stored in hash table' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Complement Hit',  desc: 'Target pair/complement located' },
    { bg: 'rgba(248,113,113,.2)',  border: '#f87171', label: 'Mismatch',        desc: 'Does not satisfy condition' },
  ],
  String: [
    { bg: 'rgba(139,92,246,.18)',  border: '#8b5cf6', label: 'In Window',       desc: 'Currently in sliding window' },
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'Pattern Char',    desc: 'Part of pattern being matched' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Match',           desc: 'Character match confirmed' },
    { bg: 'rgba(248,113,113,.2)',  border: '#f87171', label: 'Mismatch',        desc: 'No match — reset / skip' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Current Pointer', desc: 'Active scan position' },
  ],
  Design: [
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Most Recent (MRU)',desc: 'Accessed most recently' },
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'Cached',   desc: 'Stored in cache' },
    { bg: 'rgba(248,113,113,.2)',  border: '#f87171', label: 'Evicted (LRU)',   desc: 'Least recently used — removed' },
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'Just Accessed',   desc: 'Moved to front this step' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Highlighted',     desc: 'Node of interest' },
  ],
  'Range Query': [
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'Query Range [l,r]',desc: 'The range being queried' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Covered Segment',  desc: 'Fully within query range' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Partial Match',    desc: 'Partially overlaps query' },
    { bg: 'rgba(248,113,113,.15)', border: '#f87171', label: 'Outside Range',    desc: 'No overlap — skip' },
    { bg: 'rgba(139,92,246,.15)',  border: '#8b5cf6', label: 'Leaf / Updated',   desc: 'Individual element position' },
  ],
  Heap: [
    { bg: 'rgba(251,146,60,.2)',   border: '#fb923c', label: 'Root (Min/Max)',   desc: 'Top of heap — min or max' },
    { bg: 'rgba(99,102,241,.18)',  border: '#6366f1', label: 'Being Heapified',  desc: 'Sift up/down in progress' },
    { bg: 'rgba(74,222,128,.15)',  border: '#4ade80', label: 'Extracted',        desc: 'Popped from heap' },
    { bg: 'rgba(251,191,36,.15)',  border: '#fbbf24', label: 'Comparing',        desc: 'Parent vs child comparison' },
    { bg: 'var(--bg4)',            border: 'var(--border2)', label: 'In Heap',   desc: 'Currently stored in heap' },
  ],
};
COLOR_LEGENDS['Stack & Queue'] = COLOR_LEGENDS['Stack'];
COLOR_LEGENDS['Tree']          = COLOR_LEGENDS['Trees'];
COLOR_LEGENDS['default']       = COLOR_LEGENDS['Sorting'];

// ─── Event flows ───────────────────────────────────────────────────────────────
// Each entry: { icon, label, desc, color }
const EVENT_FLOWS = {
  Searching: [
    { icon: '🔵', label: 'Init',    desc: 'Set lo/hi/mid',    color: '#6366f1' },
    { icon: '🟡', label: 'Compute', desc: 'mid=(lo+hi)/2',    color: '#fbbf24' },
    { icon: '🔍', label: 'Compare', desc: 'a[mid] vs target', color: '#818cf8' },
    { icon: '↔️', label: 'Shrink',  desc: 'Eliminate half',   color: '#fb923c' },
    { icon: '✅', label: 'Result',  desc: 'Found or not',     color: '#4ade80' },
  ],
  Sorting: [
    { icon: '🔵', label: 'Init',    desc: 'Reset pass',       color: '#6366f1' },
    { icon: '🟡', label: 'Compare', desc: 'a[i] vs a[j]',    color: '#fbbf24' },
    { icon: '🔴', label: 'Swap',    desc: 'Exchange pair',    color: '#f87171' },
    { icon: '🟢', label: 'Lock',    desc: 'Mark sorted',      color: '#4ade80' },
    { icon: '✅', label: 'Done',    desc: 'Array sorted',     color: '#86efac' },
  ],
  'Two Pointer': [
    { icon: '🔵', label: 'Init',     desc: 'L=0, R=n-1',     color: '#6366f1' },
    { icon: '🟡', label: 'Evaluate', desc: 'Check condition', color: '#fbbf24' },
    { icon: '↩️', label: 'Advance L',desc: 'Move left ptr',   color: '#818cf8' },
    { icon: '↪️', label: 'Retreat R',desc: 'Move right ptr',  color: '#f87171' },
    { icon: '✅', label: 'Done',     desc: 'Pointers meet',   color: '#4ade80' },
  ],
  'Sliding Window': [
    { icon: '🔵', label: 'Init',   desc: 'L=R=0',           color: '#6366f1' },
    { icon: '➡️', label: 'Expand', desc: 'R moves right',   color: '#fbbf24' },
    { icon: '✅', label: 'Check',  desc: 'Valid window?',   color: '#4ade80' },
    { icon: '⬅️', label: 'Shrink', desc: 'L moves right',   color: '#f87171' },
    { icon: '📏', label: 'Record', desc: 'Update best',     color: '#8b5cf6' },
  ],
  Graph: [
    { icon: '🔵', label: 'Init',    desc: 'Source node',    color: '#6366f1' },
    { icon: '📥', label: 'Enqueue', desc: 'Add frontier',   color: '#fbbf24' },
    { icon: '🔍', label: 'Dequeue', desc: 'Next to visit',  color: '#818cf8' },
    { icon: '🔗', label: 'Expand',  desc: 'Visit neighbors',color: '#fb923c' },
    { icon: '✅', label: 'Done',    desc: 'All explored',   color: '#4ade80' },
  ],
  'Dynamic Programming': [
    { icon: '🔵', label: 'Init',       desc: 'Base cases',    color: '#6366f1' },
    { icon: '🔍', label: 'Lookup',     desc: 'Check cache',   color: '#818cf8' },
    { icon: '📐', label: 'Recurrence', desc: 'Apply formula', color: '#fbbf24' },
    { icon: '💾', label: 'Store',      desc: 'Cache result',  color: '#4ade80' },
    { icon: '✅', label: 'Done',       desc: 'Return answer', color: '#86efac' },
  ],
  Trees: [
    { icon: '🔵', label: 'Enter',    desc: 'Visit node',     color: '#6366f1' },
    { icon: '⬅️', label: 'Recurse L',desc: 'Left subtree',   color: '#818cf8' },
    { icon: '➡️', label: 'Recurse R',desc: 'Right subtree',  color: '#fbbf24' },
    { icon: '📊', label: 'Combine',  desc: 'Merge results',  color: '#fb923c' },
    { icon: '✅', label: 'Return',   desc: 'Propagate up',   color: '#4ade80' },
  ],
  'Linked List': [
    { icon: '🔵', label: 'Init',   desc: 'prev=null',       color: '#6366f1' },
    { icon: '💾', label: 'Save',   desc: 'Store next ptr',  color: '#fbbf24' },
    { icon: '🔄', label: 'Modify', desc: 'Change links',    color: '#f87171' },
    { icon: '➡️', label: 'Advance',desc: 'Move pointers',   color: '#818cf8' },
    { icon: '✅', label: 'Done',   desc: 'New head found',  color: '#4ade80' },
  ],
  Stack: [
    { icon: '🔵', label: 'Init',     desc: 'Empty stack',   color: '#6366f1' },
    { icon: '🔍', label: 'Peek Top', desc: 'Check stack',   color: '#fbbf24' },
    { icon: '📥', label: 'Push',     desc: 'Add to stack',  color: '#8b5cf6' },
    { icon: '📤', label: 'Pop',      desc: 'Process & pop', color: '#f87171' },
    { icon: '✅', label: 'Result',   desc: 'Answer found',  color: '#4ade80' },
  ],
  Backtracking: [
    { icon: '🔵', label: 'Start',  desc: 'Begin path',      color: '#6366f1' },
    { icon: '✅', label: 'Choose', desc: 'Pick element',    color: '#4ade80' },
    { icon: '🔁', label: 'Recurse',desc: 'Go deeper',       color: '#8b5cf6' },
    { icon: '❌', label: 'Prune',  desc: 'Violated? Back!', color: '#f87171' },
    { icon: '↩️', label: 'Undo',   desc: 'Remove element',  color: '#fbbf24' },
  ],
  Greedy: [
    { icon: '📊', label: 'Sort',     desc: 'Order by metric',color: '#818cf8' },
    { icon: '🔵', label: 'Evaluate', desc: 'Consider item',  color: '#6366f1' },
    { icon: '✅', label: 'Select',   desc: 'Greedy pick',    color: '#4ade80' },
    { icon: '❌', label: 'Skip',     desc: 'Not optimal',    color: '#f87171' },
    { icon: '🏆', label: 'Optimal',  desc: 'Best so far',    color: '#fb923c' },
  ],
  Hashing: [
    { icon: '🔵', label: 'Init',   desc: 'Empty HashMap',   color: '#6366f1' },
    { icon: '🔍', label: 'Lookup', desc: 'Check if exists', color: '#818cf8' },
    { icon: '🎯', label: 'Hit',    desc: 'Found in map',    color: '#4ade80' },
    { icon: '💾', label: 'Store',  desc: 'Add to map',      color: '#fbbf24' },
    { icon: '✅', label: 'Return', desc: 'Answer found',    color: '#86efac' },
  ],
  String: [
    { icon: '🔵', label: 'Init',  desc: 'Build LPS/need',  color: '#6366f1' },
    { icon: '🔍', label: 'Scan',  desc: 'Check character', color: '#818cf8' },
    { icon: '✅', label: 'Match', desc: 'Char matches',    color: '#4ade80' },
    { icon: '↩️', label: 'Jump',  desc: 'Use LPS / skip',  color: '#fbbf24' },
    { icon: '🏆', label: 'Found', desc: 'Pattern located', color: '#fb923c' },
  ],
  Design: [
    { icon: '🔍', label: 'Get',    desc: 'Lookup in cache',  color: '#818cf8' },
    { icon: '✅', label: 'Hit',    desc: 'Cache hit!',        color: '#4ade80' },
    { icon: '🔼', label: 'Promote',desc: 'Move to front',    color: '#6366f1' },
    { icon: '📥', label: 'Put',    desc: 'Add / update',     color: '#fbbf24' },
    { icon: '🗑️', label: 'Evict',  desc: 'Remove LRU',       color: '#f87171' },
  ],
  'Range Query': [
    { icon: '🏗️', label: 'Build',   desc: 'Build tree O(n)', color: '#818cf8' },
    { icon: '🔍', label: 'Query',   desc: 'Range [l, r]',    color: '#6366f1' },
    { icon: '📐', label: 'Split',   desc: 'Decompose range', color: '#fbbf24' },
    { icon: '📊', label: 'Combine', desc: 'Merge results',   color: '#4ade80' },
    { icon: '✏️', label: 'Update',  desc: 'Point update',    color: '#8b5cf6' },
  ],
  Heap: [
    { icon: '📥', label: 'Insert',   desc: 'Add to heap',    color: '#6366f1' },
    { icon: '⬆️', label: 'Sift Up',  desc: 'Fix heap up',    color: '#fbbf24' },
    { icon: '📤', label: 'Extract',  desc: 'Remove root',    color: '#fb923c' },
    { icon: '⬇️', label: 'Sift Down',desc: 'Fix heap down',  color: '#f87171' },
    { icon: '✅', label: 'Result',   desc: 'Min/Max ready',  color: '#4ade80' },
  ],
};
EVENT_FLOWS['Stack & Queue'] = EVENT_FLOWS['Stack'];
EVENT_FLOWS['Tree']          = EVENT_FLOWS['Trees'];
EVENT_FLOWS['default']       = EVENT_FLOWS['Sorting'];

// ─── Pattern names ─────────────────────────────────────────────────────────────
const PATTERN_NAMES = {
  Searching:           'Divide & Conquer',
  Sorting:             'Comparison / Exchange Sort',
  'Two Pointer':       'Two Pointer Technique',
  'Sliding Window':    'Sliding Window',
  Graph:               'Graph Traversal (BFS / DFS)',
  'Dynamic Programming': 'Memoization / Tabulation',
  Trees:               'Tree Recursion (DFS / BFS)',
  Tree:                'Tree Recursion (DFS / BFS)',
  'Linked List':       'In-Place Pointer Manipulation',
  Stack:               'Monotonic Stack',
  'Stack & Queue':     'Stack / Queue Operations',
  Backtracking:        'Explore & Prune (Backtracking)',
  Greedy:              'Greedy Choice Property',
  Hashing:             'Complement / Frequency HashMap',
  String:              'Pattern Matching / Sliding Window',
  Design:              'Hybrid Data Structure Design',
  'Range Query':       'Segment Tree / Fenwick Tree',
  Heap:                'Priority Queue (Min/Max Heap)',
};

// ─── Hook type definitions ─────────────────────────────────────────────────────
const HOOKS = {
  INIT:    { type: 'INIT',    bg: 'rgba(148,163,184,.15)', color: '#94a3b8', border: 'rgba(148,163,184,.3)' },
  LOOP:    { type: 'LOOP',    bg: 'rgba(99,102,241,.12)',  color: '#818cf8', border: 'rgba(99,102,241,.3)'  },
  COMPARE: { type: 'CMP',     bg: 'rgba(251,191,36,.15)',  color: '#fbbf24', border: 'rgba(251,191,36,.35)' },
  SWAP:    { type: 'SWAP',    bg: 'rgba(248,113,113,.15)', color: '#f87171', border: 'rgba(248,113,113,.35)'},
  PUSH:    { type: 'PUSH',    bg: 'rgba(139,92,246,.15)',  color: '#a78bfa', border: 'rgba(139,92,246,.3)'  },
  POP:     { type: 'POP',     bg: 'rgba(251,146,60,.15)',  color: '#fb923c', border: 'rgba(251,146,60,.3)'  },
  VISIT:   { type: 'VISIT',   bg: 'rgba(99,102,241,.12)',  color: '#818cf8', border: 'rgba(99,102,241,.3)'  },
  UPDATE:  { type: 'SET',     bg: 'rgba(251,191,36,.12)',  color: '#fbbf24', border: 'rgba(251,191,36,.25)' },
  DONE:    { type: 'DONE',    bg: 'rgba(74,222,128,.15)',  color: '#4ade80', border: 'rgba(74,222,128,.3)'  },
  RECURSE: { type: 'RECUR',   bg: 'rgba(139,92,246,.15)',  color: '#a78bfa', border: 'rgba(139,92,246,.3)'  },
  MOVE:    { type: 'MOVE',    bg: 'rgba(99,102,241,.12)',  color: '#818cf8', border: 'rgba(99,102,241,.3)'  },
  STORE:   { type: 'STORE',   bg: 'rgba(74,222,128,.12)',  color: '#86efac', border: 'rgba(74,222,128,.25)' },
  PRUNE:   { type: 'PRUNE',   bg: 'rgba(248,113,113,.12)', color: '#f87171', border: 'rgba(248,113,113,.25)'},
};

function detectHook(line) {
  const l = line.toLowerCase();
  if (l.match(/\breturn\b|output|result|found|done|complete|answer/))  return HOOKS.DONE;
  if (l.match(/recurse|recursive|\bcall\b|backtrack/))                 return HOOKS.RECURSE;
  if (l.match(/push|enqueue|add to|insert|append/))                    return HOOKS.PUSH;
  if (l.match(/pop|dequeue|remove|delete|extract/))                    return HOOKS.POP;
  if (l.match(/swap|exchange|flip|move to front/))                     return HOOKS.SWAP;
  if (l.match(/prune|skip|continue|break|invalid|violat/))             return HOOKS.PRUNE;
  if (l.match(/while |for |loop|iterate|repeat|each/))                 return HOOKS.LOOP;
  if (l.match(/\bif\b|compare|check|test|>|<|==|!=|>=|<=|\?\s/))      return HOOKS.COMPARE;
  if (l.match(/visit|mark|explore|seen|discover/))                     return HOOKS.VISIT;
  if (l.match(/store|memo|cache|dp\[|table|save/))                     return HOOKS.STORE;
  if (l.match(/update|set |assign|accumulate|max\(|min\(/))            return HOOKS.UPDATE;
  if (l.match(/advance|move|next|increment|step|shift|pointer/))       return HOOKS.MOVE;
  if (l.match(/initiali|create|declare|setup|start|begin|empty/))      return HOOKS.INIT;
  return null;
}

function annotateSteps(howItWorks) {
  if (!howItWorks) return [];
  return howItWorks.split('\n')
    .map(line => {
      const stepMatch = line.match(/^(\d+)\.\s*(.*)/);
      const subMatch  = line.match(/^[\s]+([a-z])\.\s*(.*)/);
      if (stepMatch) return { num: stepMatch[1], text: stepMatch[2],  sub: false };
      if (subMatch)  return { num: subMatch[1],  text: subMatch[2],   sub: true  };
      return null;
    })
    .filter(Boolean)
    .map(s => ({ ...s, hook: detectHook(s.text) }));
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionIcon}>{icon}</span>
      <span className={styles.sectionTitle}>{title}</span>
    </div>
  );
}

function MetaBar({ algo, patternName }) {
  const tags = (() => {
    try { return JSON.parse(algo.tags || '[]'); } catch { return []; }
  })();
  const spaceShort = (algo.spaceComplexity || '').split('·')[0].split('/')[0].trim();
  return (
    <div className={styles.metaBar}>
      <div className={styles.metaChip}>
        <span className={styles.metaChipIcon}>🧩</span>
        <span className={styles.metaChipLabel}>Pattern</span>
        <span className={styles.metaChipValue}>{patternName}</span>
      </div>
      <div className={styles.metaChip}>
        <span className={styles.metaChipIcon}>⏱️</span>
        <span className={styles.metaChipLabel}>Average</span>
        <span className={styles.metaChipValue} style={{ color: 'var(--yellow)' }}>
          {algo.timeComplexityAverage || '—'}
        </span>
      </div>
      <div className={styles.metaChip}>
        <span className={styles.metaChipIcon}>📦</span>
        <span className={styles.metaChipLabel}>Space</span>
        <span className={styles.metaChipValue}>{spaceShort || '—'}</span>
      </div>
      {tags[0] && (
        <div className={styles.metaChip}>
          <span className={styles.metaChipIcon}>⚡</span>
          <span className={styles.metaChipLabel}>Technique</span>
          <span className={styles.metaChipValue}>{tags[0]}</span>
        </div>
      )}
    </div>
  );
}

function ColorLegend({ items }) {
  return (
    <div className={styles.legendGrid}>
      {items.map((item, i) => (
        <div key={i} className={styles.legendItem}>
          <div
            className={styles.swatch}
            style={{ background: item.bg, borderColor: item.border }}
          />
          <div className={styles.legendText}>
            <span className={styles.legendLabel}>{item.label}</span>
            <span className={styles.legendDesc}>{item.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventFlow({ events }) {
  return (
    <div className={styles.eventFlow}>
      {events.map((ev, i) => (
        <span key={i} className={styles.eventGroup}>
          <span className={styles.eventNode} style={{ borderColor: ev.color + '55', background: ev.color + '12' }}>
            <span className={styles.eventIcon}>{ev.icon}</span>
            <span className={styles.eventLabel} style={{ color: ev.color }}>{ev.label}</span>
            {ev.desc && <span className={styles.eventDesc}>{ev.desc}</span>}
          </span>
          {i < events.length - 1 && <span className={styles.eventArrow}>›</span>}
        </span>
      ))}
    </div>
  );
}

function AnnotatedPseudocode({ steps }) {
  if (!steps.length) return null;
  return (
    <div className={styles.annoSteps}>
      {steps.map((s, i) => (
        <div key={i} className={`${styles.annoStep} ${s.sub ? styles.annoStepSub : ''}`}>
          <span className={styles.annoNum}>{s.num}</span>
          {s.hook && (
            <span
              className={styles.hookBadge}
              style={{ background: s.hook.bg, color: s.hook.color, borderColor: s.hook.border }}
            >
              {s.hook.type}
            </span>
          )}
          <span className={styles.annoText}>{s.text}</span>
        </div>
      ))}
    </div>
  );
}

function PatternInsight({ algo, patternName }) {
  const firstLine = (algo.whenToUse || '').split('\n').find(l => l.trim()) || '';
  const tags = (() => {
    try { return JSON.parse(algo.tags || '[]'); } catch { return []; }
  })();
  return (
    <div className={styles.insightBox}>
      <div className={styles.insightRow}>
        <span className={styles.insightPatternLabel}>Pattern</span>
        <span className={styles.insightPatternChip}>{patternName}</span>
        {tags.slice(0, 2).map(t => (
          <span key={t} className={styles.insightTagChip}>{t}</span>
        ))}
      </div>
      {firstLine && (
        <div className={styles.insightWhen}>
          <span className={styles.insightWhenLabel}>Use when: </span>
          {firstLine.replace(/^•\s*/, '')}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function VisualizationPlan({ algo }) {
  const category    = algo.category || 'default';
  const colorLegend = COLOR_LEGENDS[category]  || COLOR_LEGENDS['default'];
  const eventFlow   = EVENT_FLOWS[category]    || EVENT_FLOWS['default'];
  const patternName = PATTERN_NAMES[category]  || category;
  const steps       = annotateSteps(algo.howItWorks || '');

  return (
    <div className={styles.plan}>
      {/* ── 1. Divider ── */}
      <div className={styles.planDivider}>
        <span className={styles.planDividerLabel}>Visualization Blueprint</span>
      </div>

      {/* ── 2. Meta bar ── */}
      <MetaBar algo={algo} patternName={patternName} />

      {/* ── 3. Color Legend ── */}
      <div className={styles.card}>
        <SectionHeader icon="🎨" title="Color Legend" />
        <ColorLegend items={colorLegend} />
      </div>

      {/* ── 4. Event Flow ── */}
      <div className={styles.card}>
        <SectionHeader icon="⚡" title="Animation Event Flow" />
        <EventFlow events={eventFlow} />
      </div>

      {/* ── 5. Annotated Pseudocode ── */}
      {steps.length > 0 && (
        <div className={styles.card}>
          <SectionHeader icon="🧩" title="Pseudocode with Animation Hooks" />
          <AnnotatedPseudocode steps={steps} />
        </div>
      )}

      {/* ── 6. Pattern Insight ── */}
      <div className={styles.card}>
        <SectionHeader icon="🧠" title="Pattern Insight" />
        <PatternInsight algo={algo} patternName={patternName} />
      </div>
    </div>
  );
}
