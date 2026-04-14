import { SAMPLE_TREE } from './treeGenerators';

const TREE_STRUCTURE = {
  '4': { left: '2',  right: '6',  parent: null },
  '2': { left: '1',  right: '3',  parent: '4'  },
  '6': { left: '5',  right: '7',  parent: '4'  },
  '1': { left: null, right: null, parent: '2'  },
  '3': { left: null, right: null, parent: '2'  },
  '5': { left: null, right: null, parent: '6'  },
  '7': { left: null, right: null, parent: '6'  },
};

function tSnap(tree, nodeStates, meta = {}) {
  return {
    type: 'tree',
    nodes: tree.nodes.map(n => ({ ...n, state: nodeStates[n.id] || 'unvisited' })),
    edges: tree.edges,
    result:    meta.result    || [],
    message:   meta.message   || '',
    variables: meta.variables || {},
    phase:     meta.phase     || '',
  };
}

// ─── Tree Height / Depth ──────────────────────────────────────────────────────
export function generateTreeHeightFrames(tree = SAMPLE_TREE) {
  const frames = [];
  const heights = {};

  const initStates = Object.fromEntries(tree.nodes.map(n => [n.id, 'unvisited']));
  frames.push(tSnap(tree, initStates, {
    message: `Tree Height: height of a node = 1 + max(height(left), height(right)). Leaf = height 1.`,
    phase: 'Initialize',
  }));

  function height(nodeId) {
    if (!nodeId) return 0;
    const node = TREE_STRUCTURE[nodeId];

    const visitStates = Object.fromEntries(tree.nodes.map(n => [
      n.id,
      heights[n.id] != null ? 'visited' : 'unvisited',
    ]));
    visitStates[nodeId] = 'processing';

    frames.push(tSnap(tree, visitStates, {
      message: `Computing height of node ${nodeId}. Recurse into left(${node.left||'null'}) and right(${node.right||'null'}).`,
      variables: { node: nodeId },
      phase: `Height(${nodeId})`,
    }));

    const lh = height(node.left);
    const rh = height(node.right);
    heights[nodeId] = 1 + Math.max(lh, rh);

    const doneStates = Object.fromEntries(tree.nodes.map(n => [
      n.id, heights[n.id] != null ? 'visited' : 'unvisited',
    ]));
    doneStates[nodeId] = 'found';

    frames.push(tSnap(tree, doneStates, {
      message: `height(${nodeId}) = 1 + max(${lh}, ${rh}) = ${heights[nodeId]}.`,
      variables: { node: nodeId, leftHeight: lh, rightHeight: rh, height: heights[nodeId] },
      phase: `height(${nodeId})=${heights[nodeId]}`,
    }));

    return heights[nodeId];
  }

  const totalHeight = height('4');
  frames.push(tSnap(tree, Object.fromEntries(tree.nodes.map(n => [n.id, 'visited'])), {
    message: `Tree height = ${totalHeight}. Root-to-deepest-leaf has ${totalHeight} levels.`,
    variables: { treeHeight: totalHeight },
    phase: 'Done!',
  }));
  return frames;
}

// ─── Diameter of Binary Tree ──────────────────────────────────────────────────
export function generateDiameterFrames(tree = SAMPLE_TREE) {
  const frames = [];
  let diameter = 0;
  const depths = {};

  const initStates = Object.fromEntries(tree.nodes.map(n => [n.id, 'unvisited']));
  frames.push(tSnap(tree, initStates, {
    message: `Diameter = longest path between any two nodes. At each node: diameter candidate = depth(left) + depth(right).`,
    phase: 'Initialize',
  }));

  function dfs(nodeId) {
    if (!nodeId) return 0;
    const node = TREE_STRUCTURE[nodeId];
    const ld = dfs(node.left);
    const rd = dfs(node.right);

    const candidate = ld + rd;
    if (candidate > diameter) diameter = candidate;

    depths[nodeId] = 1 + Math.max(ld, rd);

    const stateMap = Object.fromEntries(tree.nodes.map(n => [
      n.id, depths[n.id] ? 'visited' : 'unvisited',
    ]));
    stateMap[nodeId] = candidate === diameter ? 'found' : 'visited';

    frames.push(tSnap(tree, stateMap, {
      message: `At node ${nodeId}: left depth=${ld}, right depth=${rd}. Diameter through here = ${candidate}. Max diameter so far = ${diameter}.`,
      variables: { node: nodeId, candidate, maxDiameter: diameter },
      phase: `Node ${nodeId} → candidate ${candidate}`,
    }));

    return depths[nodeId];
  }

  dfs('4');
  frames.push(tSnap(tree, Object.fromEntries(tree.nodes.map(n => [n.id, 'visited'])), {
    message: `Diameter of tree = ${diameter} edges (longest path between any two leaves).`,
    variables: { diameter },
    phase: 'Done!',
  }));
  return frames;
}

// ─── Lowest Common Ancestor ───────────────────────────────────────────────────
export function generateLCAFrames(tree = SAMPLE_TREE, pId = '1', qId = '7') {
  const frames = [];

  const initStates = Object.fromEntries(tree.nodes.map(n => [n.id, 'unvisited']));
  frames.push(tSnap(tree, { ...initStates, [pId]: 'found', [qId]: 'found' }, {
    message: `LCA of ${pId} and ${qId}: find deepest node that is ancestor of both. Start DFS from root.`,
    variables: { p: pId, q: qId },
    phase: 'Initialize',
  }));

  let lcaNode = null;

  function dfs(nodeId) {
    if (!nodeId) return false;
    const node = TREE_STRUCTURE[nodeId];

    const stateMap = Object.fromEntries(tree.nodes.map(n => [n.id, 'unvisited']));
    stateMap[nodeId] = 'processing';
    stateMap[pId] = 'found';
    stateMap[qId] = 'found';

    frames.push(tSnap(tree, stateMap, {
      message: `Visit node ${nodeId}. Recurse into left and right. Looking for nodes ${pId} and ${qId}.`,
      variables: { visiting: nodeId },
      phase: `Visit ${nodeId}`,
    }));

    const lFound = dfs(node.left);
    const rFound = dfs(node.right);
    const isTarget = nodeId === pId || nodeId === qId;

    if ((lFound && rFound) || (isTarget && (lFound || rFound))) {
      lcaNode = nodeId;
    }

    return lFound || rFound || isTarget;
  }

  dfs('4');

  const doneStates = Object.fromEntries(tree.nodes.map(n => [n.id, 'visited']));
  doneStates[pId]   = 'found';
  doneStates[qId]   = 'found';
  if (lcaNode) doneStates[lcaNode] = 'processing';

  frames.push(tSnap(tree, doneStates, {
    message: `LCA(${pId}, ${qId}) = node ${lcaNode}. It is the deepest node that is ancestor of both.`,
    variables: { p: pId, q: qId, LCA: lcaNode },
    phase: `LCA = ${lcaNode}`,
  }));
  return frames;
}

// ─── Path Sum ─────────────────────────────────────────────────────────────────
export function generatePathSumFrames(tree = SAMPLE_TREE, target = 10) {
  const frames = [];
  const nodeValues = { '4': 4, '2': 2, '6': 6, '1': 1, '3': 3, '5': 5, '7': 7 };
  let found = false;

  const initStates = Object.fromEntries(tree.nodes.map(n => [n.id, 'unvisited']));
  frames.push(tSnap(tree, initStates, {
    message: `Path Sum: does any root-to-leaf path sum to ${target}? DFS subtracting each node's value.`,
    variables: { target },
    phase: 'Initialize',
  }));

  const path = [];

  function dfs(nodeId, remaining) {
    if (!nodeId) return false;
    const node = TREE_STRUCTURE[nodeId];
    const val  = nodeValues[nodeId];
    path.push(nodeId);

    const stateMap = Object.fromEntries(tree.nodes.map(n => [
      n.id, path.includes(n.id) ? 'processing' : 'unvisited',
    ]));

    frames.push(tSnap(tree, stateMap, {
      message: `Visit ${nodeId} (val=${val}). Remaining sum = ${remaining} - ${val} = ${remaining - val}.`,
      variables: { path: path.join('→'), remaining: remaining - val },
      phase: `Visit ${nodeId}`,
    }));

    const newRemaining = remaining - val;
    const isLeaf = !node.left && !node.right;

    if (isLeaf) {
      const success = newRemaining === 0;
      if (success) found = true;

      const leafMap = Object.fromEntries(tree.nodes.map(n => [
        n.id, path.includes(n.id) ? (success ? 'found' : 'excluded') : 'unvisited',
      ]));

      frames.push(tSnap(tree, leafMap, {
        message: success
          ? `FOUND! Leaf ${nodeId}. Path [${path.join('→')}] sums to ${target}!`
          : `Leaf ${nodeId}. Remaining = ${newRemaining} ≠ 0. This path doesn't work.`,
        variables: { path: path.join('→'), sum: target - newRemaining, target, found: success },
        phase: success ? '✓ Path Found!' : 'Dead End',
      }));
    }

    const result = (isLeaf && newRemaining === 0) || dfs(node.left, newRemaining) || dfs(node.right, newRemaining);
    path.pop();
    return result;
  }

  dfs('4', target);

  frames.push(tSnap(tree, Object.fromEntries(tree.nodes.map(n => [n.id, 'visited'])), {
    message: found ? `Path summing to ${target} exists!` : `No root-to-leaf path sums to ${target}.`,
    variables: { target, found },
    phase: 'Done!',
  }));
  return frames;
}

// ─── BST Search ───────────────────────────────────────────────────────────────
export function generateBSTSearchFrames(tree = SAMPLE_TREE, searchVal = 3) {
  const frames = [];
  const nodeValues = { '4': 4, '2': 2, '6': 6, '1': 1, '3': 3, '5': 5, '7': 7 };

  const initStates = Object.fromEntries(tree.nodes.map(n => [n.id, 'unvisited']));
  frames.push(tSnap(tree, initStates, {
    message: `BST Search for value ${searchVal}. At each node: if target < node, go left; if target > node, go right; else found!`,
    variables: { target: searchVal },
    phase: 'Initialize',
  }));

  const visited = [];

  function search(nodeId) {
    if (!nodeId) {
      frames.push(tSnap(tree, Object.fromEntries(tree.nodes.map(n => [n.id, visited.includes(n.id) ? 'excluded' : 'unvisited'])), {
        message: `Reached null. Value ${searchVal} not in BST.`,
        variables: { result: 'not found' },
        phase: 'Not Found',
      }));
      return;
    }

    const val  = nodeValues[nodeId];
    visited.push(nodeId);
    const node = TREE_STRUCTURE[nodeId];

    const stateMap = Object.fromEntries(tree.nodes.map(n => [
      n.id, visited.includes(n.id) ? 'visited' : 'unvisited',
    ]));
    stateMap[nodeId] = 'processing';

    frames.push(tSnap(tree, stateMap, {
      message: `At node ${nodeId} (val=${val}). Target=${searchVal}. ${searchVal < val ? `${searchVal} < ${val} → go LEFT` : searchVal > val ? `${searchVal} > ${val} → go RIGHT` : `${searchVal} = ${val} → FOUND!`}`,
      variables: { current: nodeId, value: val, target: searchVal },
      phase: `Compare ${val}`,
    }));

    if (searchVal === val) {
      stateMap[nodeId] = 'found';
      frames.push(tSnap(tree, stateMap, {
        message: `Found ${searchVal} at node ${nodeId}!`,
        variables: { found: nodeId },
        phase: '✓ Found!',
      }));
    } else if (searchVal < val) {
      search(node.left);
    } else {
      search(node.right);
    }
  }

  search('4');
  return frames;
}
