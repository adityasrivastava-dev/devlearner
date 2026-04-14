// ─── Weighted graph for Dijkstra / Bellman-Ford / MST ────────────────────────
//   A(80,80) ──4── B(280,80) ──2── C(500,80)
//   |              |               |
//   8              1               3
//   |              |               |
//   D(80,240) ──7── E(280,240) ──5── F(500,240)
export const WEIGHTED_GRAPH = {
  nodes: [
    { id: 'A', label: 'A', x: 80,  y: 80  },
    { id: 'B', label: 'B', x: 280, y: 80  },
    { id: 'C', label: 'C', x: 500, y: 80  },
    { id: 'D', label: 'D', x: 80,  y: 240 },
    { id: 'E', label: 'E', x: 280, y: 240 },
    { id: 'F', label: 'F', x: 500, y: 240 },
  ],
  edges: [
    { source: 'A', target: 'B', weight: 4 },
    { source: 'B', target: 'C', weight: 2 },
    { source: 'A', target: 'D', weight: 8 },
    { source: 'B', target: 'E', weight: 1 },
    { source: 'C', target: 'F', weight: 3 },
    { source: 'D', target: 'E', weight: 7 },
    { source: 'E', target: 'F', weight: 5 },
    // Undirected: add reverses
    { source: 'B', target: 'A', weight: 4 },
    { source: 'C', target: 'B', weight: 2 },
    { source: 'D', target: 'A', weight: 8 },
    { source: 'E', target: 'B', weight: 1 },
    { source: 'F', target: 'C', weight: 3 },
    { source: 'E', target: 'D', weight: 7 },
    { source: 'F', target: 'E', weight: 5 },
  ],
  adjacency: {
    A: [{ to: 'B', w: 4 }, { to: 'D', w: 8 }],
    B: [{ to: 'A', w: 4 }, { to: 'C', w: 2 }, { to: 'E', w: 1 }],
    C: [{ to: 'B', w: 2 }, { to: 'F', w: 3 }],
    D: [{ to: 'A', w: 8 }, { to: 'E', w: 7 }],
    E: [{ to: 'B', w: 1 }, { to: 'D', w: 7 }, { to: 'F', w: 5 }],
    F: [{ to: 'C', w: 3 }, { to: 'E', w: 5 }],
  },
};

// DAG for Topological Sort
export const DAG = {
  nodes: [
    { id: 'A', label: 'A', x: 80,  y: 160 },
    { id: 'B', label: 'B', x: 240, y: 80  },
    { id: 'C', label: 'C', x: 240, y: 240 },
    { id: 'D', label: 'D', x: 400, y: 80  },
    { id: 'E', label: 'E', x: 400, y: 240 },
    { id: 'F', label: 'F', x: 540, y: 160 },
  ],
  edges: [
    { source: 'A', target: 'B' }, { source: 'A', target: 'C' },
    { source: 'B', target: 'D' }, { source: 'C', target: 'E' },
    { source: 'B', target: 'E' }, { source: 'D', target: 'F' },
    { source: 'E', target: 'F' },
  ],
  adjacency: { A: ['B','C'], B: ['D','E'], C: ['E'], D: ['F'], E: ['F'], F: [] },
  inDegree:   { A: 0, B: 1, C: 1, D: 1, E: 2, F: 2 },
};

// Graph WITH cycle for cycle detection
export const CYCLE_GRAPH = {
  nodes: [
    { id: '0', label: '0', x: 150, y: 80  },
    { id: '1', label: '1', x: 320, y: 80  },
    { id: '2', label: '2', x: 440, y: 200 },
    { id: '3', label: '3', x: 320, y: 280 },
    { id: '4', label: '4', x: 80,  y: 200 },
  ],
  edges: [
    { source: '0', target: '1' }, { source: '1', target: '2' },
    { source: '2', target: '3' }, { source: '3', target: '1' }, // cycle!
    { source: '0', target: '4' },
  ],
  adjacency: { '0': ['1','4'], '1': ['2'], '2': ['3'], '3': ['1'], '4': [] },
};

// ─── Snapshot helpers ─────────────────────────────────────────────────────────
function gSnap(graph, nodeStates, edgeFlags = {}, meta = {}) {
  return {
    type: 'graph',
    nodes: graph.nodes.map(n => ({
      ...n,
      state:    nodeStates[n.id]       || 'unvisited',
      distance: meta.distances?.[n.id] != null ? meta.distances[n.id] : undefined,
    })),
    edges: graph.edges.map(e => ({
      ...e,
      inMST:  edgeFlags[`${e.source}-${e.target}`] || false,
      inPath: edgeFlags[`path-${e.source}-${e.target}`] || false,
    })),
    queue:     meta.queue     || [],
    visited:   meta.visited   || [],
    message:   meta.message   || '',
    variables: meta.variables || {},
    phase:     meta.phase     || '',
  };
}

// ─── Dijkstra's Shortest Path ─────────────────────────────────────────────────
export function generateDijkstraFrames(graph = WEIGHTED_GRAPH, startId = 'A') {
  const frames = [];
  const dist = {};
  graph.nodes.forEach(n => { dist[n.id] = Infinity; });
  dist[startId] = 0;
  const visited = new Set();
  const pq = [startId]; // simplified priority queue

  const initStates = Object.fromEntries(graph.nodes.map(n => [n.id, 'unvisited']));
  initStates[startId] = 'in-queue';

  frames.push(gSnap(graph, initStates, {}, {
    distances: { ...dist },
    queue: [startId],
    message: `Initialize: dist[${startId}]=0, all others=∞. Add ${startId} to priority queue.`,
    variables: { start: startId },
    phase: 'Initialize',
  }));

  while (pq.length > 0) {
    // Pick node with min distance (simplified)
    pq.sort((a, b) => dist[a] - dist[b]);
    const u = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);

    const stateMap = Object.fromEntries(graph.nodes.map(n => [
      n.id,
      visited.has(n.id) ? 'visited' : pq.includes(n.id) ? 'in-queue' : 'unvisited',
    ]));
    stateMap[u] = 'processing';

    frames.push(gSnap(graph, stateMap, {}, {
      distances: { ...dist },
      queue: [...pq],
      message: `Process ${u} (dist=${dist[u]}). Explore its neighbors.`,
      variables: { current: u, dist: dist[u] },
      phase: `Process ${u}`,
    }));

    const neighbors = graph.adjacency[u] || [];
    for (const { to, w } of neighbors) {
      if (visited.has(to)) continue;
      const newDist = dist[u] + w;

      if (newDist < dist[to]) {
        dist[to] = newDist;
        if (!pq.includes(to)) pq.push(to);

        const relaxStates = Object.fromEntries(graph.nodes.map(n => [
          n.id,
          visited.has(n.id) ? 'visited' : pq.includes(n.id) ? 'in-queue' : 'unvisited',
        ]));
        relaxStates[u]  = 'processing';
        relaxStates[to] = 'found';

        frames.push(gSnap(graph, relaxStates, {}, {
          distances: { ...dist },
          queue: [...pq],
          message: `Relax edge ${u}→${to}: dist[${u}]+${w}=${newDist} < dist[${to}] (old). Update dist[${to}]=${newDist}.`,
          variables: { relaxed: to, newDist, via: u },
          phase: `Relax ${u}→${to}`,
        }));
      }
    }
  }

  const finalStates = Object.fromEntries(graph.nodes.map(n => [n.id, 'visited']));
  frames.push(gSnap(graph, finalStates, {}, {
    distances: { ...dist },
    message: `Dijkstra complete! Shortest distances from ${startId}: ${Object.entries(dist).map(([k,v]) => `${k}=${v}`).join(', ')}`,
    phase: 'Done!',
  }));
  return frames;
}

// ─── Topological Sort (Kahn's BFS-based) ──────────────────────────────────────
export function generateTopologicalSortFrames(graph = DAG) {
  const frames = [];
  const inDegree = { ...graph.inDegree };
  const result = [];
  const queue = Object.entries(inDegree).filter(([,d]) => d === 0).map(([id]) => id);

  const initStates = Object.fromEntries(graph.nodes.map(n => [n.id, inDegree[n.id] === 0 ? 'in-queue' : 'unvisited']));
  frames.push(gSnap(graph, initStates, {}, {
    queue: [...queue],
    message: `Topological Sort: start with all nodes that have in-degree 0: [${queue.join(', ')}]`,
    variables: { inDegree: JSON.stringify(inDegree) },
    phase: 'Initialize',
  }));

  const visitedArr = [];
  while (queue.length > 0) {
    const u = queue.shift();
    visitedArr.push(u);
    result.push(u);

    const stateMap = Object.fromEntries(graph.nodes.map(n => [
      n.id,
      visitedArr.includes(n.id) ? 'visited' : queue.includes(n.id) ? 'in-queue' : 'unvisited',
    ]));
    stateMap[u] = 'processing';

    frames.push(gSnap(graph, stateMap, {}, {
      queue: [...queue],
      visited: [...visitedArr],
      message: `Process ${u}. Reduce in-degree of its neighbors.`,
      variables: { current: u, result: `[${result.join('→')}]` },
      phase: `Process ${u}`,
    }));

    for (const neighbor of (graph.adjacency[u] || [])) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  const doneStates = Object.fromEntries(graph.nodes.map(n => [n.id, 'visited']));
  frames.push(gSnap(graph, doneStates, {}, {
    message: `Topological order: ${result.join(' → ')}`,
    phase: 'Done!',
  }));
  return frames;
}

// ─── Bellman-Ford ──────────────────────────────────────────────────────────────
export function generateBellmanFordFrames(graph = WEIGHTED_GRAPH, startId = 'A') {
  const frames = [];
  const dist = {};
  graph.nodes.forEach(n => { dist[n.id] = n.id === startId ? 0 : Infinity; });

  const initStates = Object.fromEntries(graph.nodes.map(n => [n.id, 'unvisited']));
  initStates[startId] = 'processing';
  frames.push(gSnap(graph, initStates, {}, {
    distances: { ...dist },
    message: `Bellman-Ford from ${startId}. Relax ALL edges |V|-1 = ${graph.nodes.length - 1} times.`,
    phase: 'Initialize',
  }));

  const uniqueEdges = graph.edges.filter(e => e.source < e.target); // undirected dedup

  for (let pass = 1; pass <= graph.nodes.length - 1; pass++) {
    let changed = false;
    for (const e of uniqueEdges) {
      for (const [u, v] of [[e.source, e.target], [e.target, e.source]]) {
        if (dist[u] !== Infinity && dist[u] + e.weight < dist[v]) {
          dist[v] = dist[u] + e.weight;
          changed = true;

          const stateMap = Object.fromEntries(graph.nodes.map(n => [n.id, 'unvisited']));
          stateMap[u] = 'processing';
          stateMap[v] = 'found';

          frames.push(gSnap(graph, stateMap, {}, {
            distances: { ...dist },
            message: `Pass ${pass}: Relax ${u}→${v} (w=${e.weight}). dist[${v}] = ${dist[v]}.`,
            variables: { pass, edge: `${u}→${v}`, newDist: dist[v] },
            phase: `Pass ${pass}`,
          }));
        }
      }
    }
    if (!changed) {
      frames.push(gSnap(graph, Object.fromEntries(graph.nodes.map(n => [n.id, 'visited'])), {}, {
        distances: { ...dist },
        message: `No changes in pass ${pass}. Early termination.`,
        phase: 'Early Exit',
      }));
      break;
    }
  }

  const doneStates = Object.fromEntries(graph.nodes.map(n => [n.id, 'visited']));
  frames.push(gSnap(graph, doneStates, {}, {
    distances: { ...dist },
    message: `Bellman-Ford complete: ${Object.entries(dist).map(([k,v]) => `${k}=${v}`).join(', ')}`,
    phase: 'Done!',
  }));
  return frames;
}

// ─── Floyd-Warshall (grid renderer) ───────────────────────────────────────────
export function generateFloydWarshallFrames() {
  const nodes = ['A','B','C','D'];
  // 4-node graph: A-B:3, A-C:8, B-D:2, C-D:4, B-C:1
  const W = [
    [0,    3,    8,    Infinity],
    [3,    0,    1,    2       ],
    [8,    1,    0,    4       ],
    [Infinity, 2, 4,  0       ],
  ];
  const n = nodes.length;
  const frames = [];

  const gridSnap = (matrix, current, msg, phase) => ({
    type: 'grid',
    grid: matrix.map(row =>
      row.map(v => ({ value: v === Infinity ? '∞' : v, state: 'filled' }))
    ),
    current,
    message: msg,
    variables: {},
    phase,
  });

  frames.push(gridSnap(W.map(r => [...r]), null, `Floyd-Warshall: all-pairs shortest paths. Matrix[i][j] = direct distance (∞ = no direct edge).`, 'Initialize'));

  const dist = W.map(r => [...r]);

  for (let k = 0; k < n; k++) {
    frames.push(gridSnap(dist.map(r => [...r]), null,
      `Intermediate vertex k=${nodes[k]}. For every pair (i,j), check if going through ${nodes[k]} is shorter.`,
      `k = ${nodes[k]}`,
    ));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          const old = dist[i][j];
          dist[i][j] = dist[i][k] + dist[k][j];
          const snap = {
            type: 'grid',
            grid: dist.map((row, ri) =>
              row.map((v, ci) => ({
                value: v === Infinity ? '∞' : v,
                state: ri === i && ci === j ? 'optimal'
                  : ri === i && ci === k ? 'dependency'
                  : ri === k && ci === j ? 'dependency'
                  : 'filled',
              }))
            ),
            current: [i, j],
            message: `dist[${nodes[i]}][${nodes[j]}]: via ${nodes[k]}: ${dist[i][k]}+${dist[k][j]}=${dist[i][j]} < old ${old}. Update!`,
            variables: { i: nodes[i], j: nodes[j], k: nodes[k], newDist: dist[i][j] },
            phase: `Update [${nodes[i]}][${nodes[j]}]`,
          };
          frames.push(snap);
        }
      }
    }
  }

  frames.push(gridSnap(dist.map(r => [...r]), null,
    `Floyd-Warshall complete! Matrix now shows shortest path between every pair.`,
    'Done!',
  ));
  return frames;
}

// ─── Kruskal's MST ────────────────────────────────────────────────────────────
export function generateKruskalFrames(graph = WEIGHTED_GRAPH) {
  const frames = [];
  const uniqueEdges = [];
  const seen = new Set();
  for (const e of graph.edges) {
    const key = [e.source, e.target].sort().join('-');
    if (!seen.has(key)) { seen.add(key); uniqueEdges.push(e); }
  }
  uniqueEdges.sort((a, b) => a.weight - b.weight);

  const parent = Object.fromEntries(graph.nodes.map(n => [n.id, n.id]));
  const rank   = Object.fromEntries(graph.nodes.map(n => [n.id, 0]));

  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  function union(x, y) {
    const px = find(x), py = find(y);
    if (px === py) return false;
    if (rank[px] < rank[py]) parent[px] = py;
    else if (rank[px] > rank[py]) parent[py] = px;
    else { parent[py] = px; rank[px]++; }
    return true;
  }

  const mstEdges = new Set();
  const stateMap = Object.fromEntries(graph.nodes.map(n => [n.id, 'unvisited']));

  frames.push(gSnap(graph, { ...stateMap }, {}, {
    message: `Kruskal's MST: sort all edges by weight: [${uniqueEdges.map(e => `${e.source}-${e.target}(${e.weight})`).join(', ')}]`,
    phase: 'Sort Edges',
  }));

  for (const e of uniqueEdges) {
    if (union(e.source, e.target)) {
      mstEdges.add([e.source,e.target].sort().join('-'));
      stateMap[e.source] = 'visited';
      stateMap[e.target] = 'visited';

      const edgeFlags = {};
      mstEdges.forEach(key => {
        const [u,v] = key.split('-');
        edgeFlags[`${u}-${v}`] = true;
        edgeFlags[`${v}-${u}`] = true;
      });

      frames.push(gSnap(graph, { ...stateMap }, edgeFlags, {
        message: `Add edge ${e.source}-${e.target} (w=${e.weight}). No cycle. MST edges: ${mstEdges.size}/${graph.nodes.length-1}`,
        variables: { edge: `${e.source}-${e.target}`, weight: e.weight, mstEdges: mstEdges.size },
        phase: `Add ${e.source}-${e.target}`,
      }));
    } else {
      const skipMap = { ...stateMap };
      skipMap[e.source] = 'processing';
      skipMap[e.target] = 'processing';

      const edgeFlags = {};
      mstEdges.forEach(key => { const [u,v] = key.split('-'); edgeFlags[`${u}-${v}`] = true; edgeFlags[`${v}-${u}`] = true; });

      frames.push(gSnap(graph, skipMap, edgeFlags, {
        message: `Skip edge ${e.source}-${e.target} (w=${e.weight}). Would create a cycle!`,
        variables: { skipped: `${e.source}-${e.target}`, reason: 'cycle' },
        phase: `Skip ${e.source}-${e.target}`,
      }));
    }
    if (mstEdges.size === graph.nodes.length - 1) break;
  }

  const doneFlags = {};
  mstEdges.forEach(key => { const [u,v] = key.split('-'); doneFlags[`${u}-${v}`] = true; doneFlags[`${v}-${u}`] = true; });
  frames.push(gSnap(graph, Object.fromEntries(graph.nodes.map(n => [n.id, 'visited'])), doneFlags, {
    message: `MST complete with ${mstEdges.size} edges (highlighted in green).`,
    phase: 'Done!',
  }));
  return frames;
}

// ─── Prim's MST ───────────────────────────────────────────────────────────────
export function generatePrimFrames(graph = WEIGHTED_GRAPH, startId = 'A') {
  const frames = [];
  const inMST = new Set([startId]);
  const mstEdgeSet = new Set();
  const stateMap = Object.fromEntries(graph.nodes.map(n => [n.id, 'unvisited']));
  stateMap[startId] = 'visited';

  frames.push(gSnap(graph, { ...stateMap }, {}, {
    message: `Prim's MST: start from ${startId}. Repeatedly add cheapest edge connecting MST to a new vertex.`,
    phase: 'Initialize',
  }));

  while (inMST.size < graph.nodes.length) {
    let minWeight = Infinity, minEdge = null;
    for (const u of inMST) {
      for (const { to, w } of (graph.adjacency[u] || [])) {
        if (!inMST.has(to) && w < minWeight) {
          minWeight = w;
          minEdge = { u, v: to, w };
        }
      }
    }
    if (!minEdge) break;

    inMST.add(minEdge.v);
    mstEdgeSet.add([minEdge.u, minEdge.v].sort().join('-'));
    stateMap[minEdge.v] = 'visited';

    const edgeFlags = {};
    mstEdgeSet.forEach(key => { const [a,b] = key.split('-'); edgeFlags[`${a}-${b}`] = true; edgeFlags[`${b}-${a}`] = true; });

    frames.push(gSnap(graph, { ...stateMap }, edgeFlags, {
      message: `Add cheapest crossing edge: ${minEdge.u}→${minEdge.v} (w=${minEdge.w}). MST now has ${inMST.size} nodes.`,
      variables: { addedEdge: `${minEdge.u}-${minEdge.v}`, weight: minEdge.w, mstSize: inMST.size },
      phase: `Add ${minEdge.u}-${minEdge.v}`,
    }));
  }

  const edgeFlags = {};
  mstEdgeSet.forEach(key => { const [a,b] = key.split('-'); edgeFlags[`${a}-${b}`] = true; edgeFlags[`${b}-${a}`] = true; });
  frames.push(gSnap(graph, Object.fromEntries(graph.nodes.map(n => [n.id, 'visited'])), edgeFlags, {
    message: `Prim's MST complete. All ${graph.nodes.length} nodes connected via ${mstEdgeSet.size} edges (green).`,
    phase: 'Done!',
  }));
  return frames;
}

// ─── Cycle Detection (DFS-based for directed graph) ───────────────────────────
export function generateCycleDetectionFrames(graph = CYCLE_GRAPH) {
  const frames = [];
  const visited = new Set();
  const inStack = new Set();
  let cycleFound = false;
  let cycleEdge  = null;

  const initStates = Object.fromEntries(graph.nodes.map(n => [n.id, 'unvisited']));
  frames.push(gSnap(graph, initStates, {}, {
    message: `Cycle detection using DFS. Track two sets: visited (grey) and inStack (purple = current DFS path).`,
    phase: 'Initialize',
  }));

  function dfs(nodeId) {
    if (cycleFound) return;
    visited.add(nodeId);
    inStack.add(nodeId);

    const stateMap = Object.fromEntries(graph.nodes.map(n => [
      n.id,
      inStack.has(n.id) ? 'processing' : visited.has(n.id) ? 'visited' : 'unvisited',
    ]));

    frames.push(gSnap(graph, stateMap, {}, {
      message: `Visit ${nodeId}. Add to DFS stack. Stack: [${[...inStack].join('→')}]`,
      variables: { visiting: nodeId, stack: `[${[...inStack].join('→')}]` },
      phase: `DFS ${nodeId}`,
    }));

    for (const neighbor of (graph.adjacency[nodeId] || [])) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (inStack.has(neighbor)) {
        cycleFound = true;
        cycleEdge  = { u: nodeId, v: neighbor };

        const cycleMap = Object.fromEntries(graph.nodes.map(n => [
          n.id,
          inStack.has(n.id) ? 'cycle' : visited.has(n.id) ? 'visited' : 'unvisited',
        ]));

        frames.push(gSnap(graph, cycleMap, {}, {
          message: `CYCLE DETECTED! Edge ${nodeId}→${neighbor}. Node ${neighbor} is already in the current DFS stack!`,
          variables: { cycle: `${nodeId}→${neighbor}`, back_edge: true },
          phase: '⚠ Cycle Found!',
        }));
        return;
      }
    }

    inStack.delete(nodeId);
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id) && !cycleFound) dfs(node.id);
  }

  if (!cycleFound) {
    frames.push(gSnap(graph, Object.fromEntries(graph.nodes.map(n => [n.id, 'visited'])), {}, {
      message: `No cycle detected. This is a DAG (Directed Acyclic Graph).`,
      phase: 'No Cycle',
    }));
  }

  return frames;
}

// ─── Union-Find (array renderer) ─────────────────────────────────────────────
export function generateUnionFindFrames() {
  const n = 7;
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank   = Array(n).fill(0);
  const frames = [];

  const arrSnap = (parent, over, msg, phase, vars = {}) => ({
    type: 'array',
    elements: parent.map((v, i) => ({ value: v, state: over[i] || 'default' })),
    pointers: [],
    message: msg,
    variables: vars,
    phase,
  });

  frames.push(arrSnap(parent, {}, `Union-Find: parent[i]=i means node i is its own root. ${n} nodes, each is their own component.`, 'Initialize'));

  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // path compression
      x = parent[x];
    }
    return x;
  }

  function union(x, y) {
    const rx = find(x), ry = find(y);
    if (rx === ry) return false;
    if (rank[rx] < rank[ry]) parent[rx] = ry;
    else if (rank[rx] > rank[ry]) parent[ry] = rx;
    else { parent[ry] = rx; rank[rx]++; }
    return true;
  }

  const operations = [[0,1],[2,3],[4,5],[1,2],[3,4],[5,6]];

  for (const [a, b] of operations) {
    const before = [...parent];
    const merged = union(a, b);
    const after  = [...parent];

    const over = {};
    over[a] = 'comparing';
    over[b] = 'comparing';

    frames.push(arrSnap(before, over, `Union(${a}, ${b}): find roots of ${a} and ${b}.`, `Union(${a},${b})`));

    if (merged) {
      const over2 = {};
      for (let i = 0; i < n; i++) { if (after[i] !== i) over2[i] = 'in-window'; }
      over2[a] = 'found';
      over2[b] = 'found';
      frames.push(arrSnap(after, over2, `Merged! parent[${a}] or parent[${b}] updated. Components reduced.`, `Merged`, { parent: `[${after.join(',')}]` }));
    } else {
      frames.push(arrSnap(before, { [a]: 'sorted', [b]: 'sorted' }, `${a} and ${b} already in same component. Skip.`, `Already Same`));
    }
  }

  frames.push(arrSnap(parent, Object.fromEntries(parent.map((v,i) => [i, v===i ? 'sorted' : 'in-window'])), `Final parent array: ${n} nodes merged into components.`, 'Done!', { parent: `[${parent.join(',')}]` }));
  return frames;
}
