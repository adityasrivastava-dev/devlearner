// ─── Sample BST ───────────────────────────────────────────────────────────────
//          4
//        /   \
//       2     6
//      / \   / \
//     1   3 5   7
//
export const SAMPLE_TREE = {
  nodes: [
    { id: '4',  value: 4, x: 300, y: 50  },
    { id: '2',  value: 2, x: 160, y: 140 },
    { id: '6',  value: 6, x: 440, y: 140 },
    { id: '1',  value: 1, x: 80,  y: 230 },
    { id: '3',  value: 3, x: 240, y: 230 },
    { id: '5',  value: 5, x: 360, y: 230 },
    { id: '7',  value: 7, x: 520, y: 230 },
  ],
  edges: [
    { source: '4', target: '2' },
    { source: '4', target: '6' },
    { source: '2', target: '1' },
    { source: '2', target: '3' },
    { source: '6', target: '5' },
    { source: '6', target: '7' },
  ],
};

// ─── Snapshot helper ──────────────────────────────────────────────────────────
function treeSnap(tree, nodeStates, meta = {}) {
  return {
    type: 'tree',
    nodes: tree.nodes.map((n) => ({ ...n, state: nodeStates[n.id] || 'unvisited' })),
    edges: tree.edges,
    result:  meta.result  || [],
    message: meta.message || '',
    variables: meta.variables || {},
    phase:   meta.phase   || '',
  };
}

// Logical tree structure for recursive traversal
const TREE_STRUCTURE = {
  '4': { left: '2',  right: '6'  },
  '2': { left: '1',  right: '3'  },
  '6': { left: '5',  right: '7'  },
  '1': { left: null, right: null },
  '3': { left: null, right: null },
  '5': { left: null, right: null },
  '7': { left: null, right: null },
};

// ─── Inorder (Left → Root → Right) ───────────────────────────────────────────
export function generateInorderFrames(tree) {
  const frames = [];
  const result = [];
  const visitedSet = new Set();

  const initStates = Object.fromEntries(tree.nodes.map((n) => [n.id, 'unvisited']));
  frames.push(treeSnap(tree, initStates, {
    result:  [],
    message: 'Inorder traversal: visit Left → Root → Right. Start at root (4).',
    phase:   'Initialize',
  }));

  function inorder(nodeId) {
    if (!nodeId) return;
    const node = TREE_STRUCTURE[nodeId];

    // Going left
    const callStates = Object.fromEntries(
      tree.nodes.map((n) => [n.id, visitedSet.has(n.id) ? 'visited' : 'unvisited'])
    );
    callStates[nodeId] = 'processing';
    frames.push(treeSnap(tree, callStates, {
      result:  [...result],
      message: `At node ${nodeId}. First recurse into LEFT subtree (${node.left || 'null'}).`,
      variables: { current: nodeId, left: node.left || 'null', right: node.right || 'null' },
      phase:   `Visit ${nodeId}`,
    }));

    inorder(node.left);

    // Visit root
    visitedSet.add(nodeId);
    result.push(parseInt(nodeId));

    const visitStates = Object.fromEntries(
      tree.nodes.map((n) => [n.id, visitedSet.has(n.id) ? 'visited' : 'unvisited'])
    );
    visitStates[nodeId] = 'found';
    frames.push(treeSnap(tree, visitStates, {
      result:  [...result],
      message: `Visit node ${nodeId}. Append to result: [${result.join(', ')}]`,
      variables: { visited: nodeId, result: `[${result.join(', ')}]` },
      phase:   `Record ${nodeId}`,
    }));

    inorder(node.right);
  }

  inorder('4');

  const doneStates = Object.fromEntries(tree.nodes.map((n) => [n.id, 'visited']));
  frames.push(treeSnap(tree, doneStates, {
    result:  [...result],
    message: `Inorder traversal complete: [${result.join(', ')}]. This is sorted order for a BST!`,
    phase:   'Done!',
  }));

  return frames;
}

// ─── Preorder (Root → Left → Right) ──────────────────────────────────────────
export function generatePreorderFrames(tree) {
  const frames = [];
  const result = [];
  const visitedSet = new Set();

  const initStates = Object.fromEntries(tree.nodes.map((n) => [n.id, 'unvisited']));
  frames.push(treeSnap(tree, initStates, {
    result:  [],
    message: 'Preorder traversal: visit Root → Left → Right. Start at root (4).',
    phase:   'Initialize',
  }));

  function preorder(nodeId) {
    if (!nodeId) return;
    const node = TREE_STRUCTURE[nodeId];

    visitedSet.add(nodeId);
    result.push(parseInt(nodeId));

    const visitStates = Object.fromEntries(
      tree.nodes.map((n) => [n.id, visitedSet.has(n.id) ? 'visited' : 'unvisited'])
    );
    visitStates[nodeId] = 'found';
    frames.push(treeSnap(tree, visitStates, {
      result:  [...result],
      message: `Visit node ${nodeId} FIRST (preorder). Then recurse left (${node.left || 'null'}), then right (${node.right || 'null'}).`,
      variables: { visited: nodeId, result: `[${result.join(', ')}]` },
      phase:   `Record ${nodeId}`,
    }));

    preorder(node.left);
    preorder(node.right);
  }

  preorder('4');

  const doneStates = Object.fromEntries(tree.nodes.map((n) => [n.id, 'visited']));
  frames.push(treeSnap(tree, doneStates, {
    result:  [...result],
    message: `Preorder complete: [${result.join(', ')}]. Root always comes first in each subtree.`,
    phase:   'Done!',
  }));

  return frames;
}

// ─── Postorder (Left → Right → Root) ─────────────────────────────────────────
export function generatePostorderFrames(tree) {
  const frames = [];
  const result = [];
  const visitedSet = new Set();

  const initStates = Object.fromEntries(tree.nodes.map((n) => [n.id, 'unvisited']));
  frames.push(treeSnap(tree, initStates, {
    result:  [],
    message: 'Postorder traversal: visit Left → Right → Root. Children before parent.',
    phase:   'Initialize',
  }));

  function postorder(nodeId) {
    if (!nodeId) return;
    const node = TREE_STRUCTURE[nodeId];

    const pendingStates = Object.fromEntries(
      tree.nodes.map((n) => [n.id, visitedSet.has(n.id) ? 'visited' : 'unvisited'])
    );
    pendingStates[nodeId] = 'processing';
    frames.push(treeSnap(tree, pendingStates, {
      result:  [...result],
      message: `At node ${nodeId}. Recurse into both children BEFORE visiting this node.`,
      variables: { pending: nodeId },
      phase:   `Pending ${nodeId}`,
    }));

    postorder(node.left);
    postorder(node.right);

    visitedSet.add(nodeId);
    result.push(parseInt(nodeId));

    const visitStates = Object.fromEntries(
      tree.nodes.map((n) => [n.id, visitedSet.has(n.id) ? 'visited' : 'unvisited'])
    );
    visitStates[nodeId] = 'found';
    frames.push(treeSnap(tree, visitStates, {
      result:  [...result],
      message: `Both children done. NOW visit node ${nodeId}. Result: [${result.join(', ')}]`,
      variables: { visited: nodeId, result: `[${result.join(', ')}]` },
      phase:   `Record ${nodeId}`,
    }));
  }

  postorder('4');

  const doneStates = Object.fromEntries(tree.nodes.map((n) => [n.id, 'visited']));
  frames.push(treeSnap(tree, doneStates, {
    result:  [...result],
    message: `Postorder complete: [${result.join(', ')}]. Root always comes last.`,
    phase:   'Done!',
  }));

  return frames;
}

// ─── Level Order (BFS on tree) ────────────────────────────────────────────────
export function generateLevelOrderFrames(tree) {
  const frames = [];
  const result = [];
  const visitedSet = new Set();
  const queue = ['4'];

  const initStates = Object.fromEntries(tree.nodes.map((n) => [n.id, 'unvisited']));
  initStates['4'] = 'in-queue';
  frames.push(treeSnap(tree, initStates, {
    result:  [],
    message: 'Level-order (BFS) traversal. Process nodes level by level using a queue.',
    variables: { queue: '[4]' },
    phase:   'Initialize',
  }));

  while (queue.length > 0) {
    const levelSize = queue.length;
    const levelNodes = [];

    for (let i = 0; i < levelSize; i++) {
      const nodeId = queue.shift();
      levelNodes.push(nodeId);
      visitedSet.add(nodeId);
      result.push(parseInt(nodeId));

      const node = TREE_STRUCTURE[nodeId];
      if (node.left)  queue.push(node.left);
      if (node.right) queue.push(node.right);

      const states = Object.fromEntries(
        tree.nodes.map((n) => {
          if (visitedSet.has(n.id)) return [n.id, 'visited'];
          if (queue.includes(n.id)) return [n.id, 'in-queue'];
          return [n.id, 'unvisited'];
        })
      );
      states[nodeId] = 'found';

      frames.push(treeSnap(tree, states, {
        result:  [...result],
        message: `Dequeue ${nodeId}. Visit it. Enqueue children: [${[node.left, node.right].filter(Boolean).join(', ') || 'none'}]`,
        variables: { current: nodeId, queue: `[${queue.join(', ')}]`, result: `[${result.join(', ')}]` },
        phase:   `Level Node ${nodeId}`,
      }));
    }
  }

  const doneStates = Object.fromEntries(tree.nodes.map((n) => [n.id, 'visited']));
  frames.push(treeSnap(tree, doneStates, {
    result:  [...result],
    message: `Level-order complete: [${result.join(', ')}]. Nodes visited row by row, top to bottom.`,
    phase:   'Done!',
  }));

  return frames;
}
