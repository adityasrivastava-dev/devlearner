// ─── Sample graph for BFS / DFS ───────────────────────────────────────────────
//  Layout (visual positions in a 600×400 canvas):
//
//          A(300,60)
//         / \
//       B(150,160)   C(450,160)
//      / \              \
//   D(70,260) E(230,260)  F(450,260)
//                          \
//                          G(530,360)
//
export const SAMPLE_GRAPH = {
  nodes: [
    { id: 'A', label: 'A', x: 300, y: 60  },
    { id: 'B', label: 'B', x: 150, y: 160 },
    { id: 'C', label: 'C', x: 450, y: 160 },
    { id: 'D', label: 'D', x: 70,  y: 260 },
    { id: 'E', label: 'E', x: 230, y: 260 },
    { id: 'F', label: 'F', x: 450, y: 260 },
    { id: 'G', label: 'G', x: 530, y: 360 },
  ],
  edges: [
    { source: 'A', target: 'B' },
    { source: 'A', target: 'C' },
    { source: 'B', target: 'D' },
    { source: 'B', target: 'E' },
    { source: 'C', target: 'F' },
    { source: 'F', target: 'G' },
  ],
  adjacency: {
    A: ['B', 'C'],
    B: ['D', 'E'],
    C: ['F'],
    D: [],
    E: [],
    F: ['G'],
    G: [],
  },
};

// ─── Snapshot helper ──────────────────────────────────────────────────────────
function graphSnap(graph, nodeStates, meta = {}) {
  return {
    type: 'graph',
    nodes: graph.nodes.map((n) => ({ ...n, state: nodeStates[n.id] || 'unvisited' })),
    edges: graph.edges,
    queue:   meta.queue   || [],
    visited: meta.visited || [],
    message: meta.message || '',
    variables: meta.variables || {},
    phase:   meta.phase   || '',
  };
}

// ─── BFS ──────────────────────────────────────────────────────────────────────
export function generateBFSFrames(graph, startId = 'A') {
  const { adjacency } = graph;
  const frames = [];

  const visited = new Set();
  const queue   = [startId];
  visited.add(startId);

  const initStates = {};
  graph.nodes.forEach((n) => { initStates[n.id] = 'unvisited'; });
  initStates[startId] = 'in-queue';

  frames.push(graphSnap(graph, initStates, {
    queue:   [startId],
    visited: [],
    message: `BFS from node ${startId}. Enqueue start node.`,
    variables: { start: startId, queue: `[${startId}]` },
    phase:   'Initialize',
  }));

  const visitedArr = [];

  while (queue.length > 0) {
    const current = queue.shift();
    visitedArr.push(current);

    const processStates = {};
    graph.nodes.forEach((n) => {
      if (visitedArr.includes(n.id)) processStates[n.id] = 'visited';
      else if (queue.includes(n.id)) processStates[n.id] = 'in-queue';
      else                           processStates[n.id] = 'unvisited';
    });
    processStates[current] = 'processing';

    frames.push(graphSnap(graph, processStates, {
      queue:   [...queue],
      visited: [...visitedArr],
      message: `Dequeue ${current}. Process it. Explore neighbors: [${adjacency[current].join(', ') || 'none'}]`,
      variables: { current, queue: `[${queue.join(', ')}]`, visited: `[${visitedArr.join(', ')}]` },
      phase:   `Process ${current}`,
    }));

    for (const neighbor of adjacency[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);

        const enqueueStates = {};
        graph.nodes.forEach((n) => {
          if (visitedArr.includes(n.id))  enqueueStates[n.id] = 'visited';
          else if (queue.includes(n.id))  enqueueStates[n.id] = 'in-queue';
          else                            enqueueStates[n.id] = 'unvisited';
        });
        enqueueStates[current]  = 'processing';
        enqueueStates[neighbor] = 'in-queue';

        frames.push(graphSnap(graph, enqueueStates, {
          queue:   [...queue],
          visited: [...visitedArr],
          message: `Enqueue unvisited neighbor ${neighbor}.`,
          variables: { current, neighbor, queue: `[${queue.join(', ')}]` },
          phase:   `Enqueue ${neighbor}`,
        }));
      }
    }

    const afterStates = {};
    graph.nodes.forEach((n) => {
      if (visitedArr.includes(n.id)) afterStates[n.id] = 'visited';
      else if (queue.includes(n.id)) afterStates[n.id] = 'in-queue';
      else                           afterStates[n.id] = 'unvisited';
    });

    frames.push(graphSnap(graph, afterStates, {
      queue:   [...queue],
      visited: [...visitedArr],
      message: `Mark ${current} visited. Queue: [${queue.join(', ')}]`,
      variables: { visited: `[${visitedArr.join(', ')}]`, remaining: queue.length },
      phase:   `Visited ${current}`,
    }));
  }

  const doneStates = Object.fromEntries(graph.nodes.map((n) => [n.id, 'visited']));
  frames.push(graphSnap(graph, doneStates, {
    queue:   [],
    visited: [...visitedArr],
    message: `BFS complete. Visit order: ${visitedArr.join(' → ')}`,
    variables: { order: visitedArr.join(' → ') },
    phase:   'Done!',
  }));

  return frames;
}

// ─── DFS ──────────────────────────────────────────────────────────────────────
export function generateDFSFrames(graph, startId = 'A') {
  const { adjacency } = graph;
  const frames = [];
  const visitedArr = [];
  const stack = [startId];

  const initStates = {};
  graph.nodes.forEach((n) => { initStates[n.id] = 'unvisited'; });
  initStates[startId] = 'in-queue';

  frames.push(graphSnap(graph, initStates, {
    queue:   [startId],
    visited: [],
    message: `DFS from node ${startId}. Push onto stack.`,
    variables: { start: startId, stack: `[${startId}]` },
    phase:   'Initialize',
  }));

  const visited = new Set();

  while (stack.length > 0) {
    const current = stack.pop();

    if (visited.has(current)) continue;
    visited.add(current);
    visitedArr.push(current);

    const processStates = {};
    graph.nodes.forEach((n) => {
      if (visitedArr.includes(n.id)) processStates[n.id] = 'visited';
      else if (stack.includes(n.id)) processStates[n.id] = 'in-queue';
      else                           processStates[n.id] = 'unvisited';
    });
    processStates[current] = 'processing';

    frames.push(graphSnap(graph, processStates, {
      queue:   [...stack],
      visited: [...visitedArr],
      message: `Pop ${current}. Visit it. Push unvisited neighbors: [${adjacency[current].filter(n => !visited.has(n)).join(', ') || 'none'}]`,
      variables: { current, stack: `[${stack.join(', ')}]`, visited: `[${visitedArr.join(', ')}]` },
      phase:   `Visit ${current}`,
    }));

    const neighbors = [...adjacency[current]].reverse();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);

        const pushStates = {};
        graph.nodes.forEach((n) => {
          if (visitedArr.includes(n.id)) pushStates[n.id] = 'visited';
          else if (stack.includes(n.id)) pushStates[n.id] = 'in-queue';
          else                           pushStates[n.id] = 'unvisited';
        });
        pushStates[current]  = 'processing';
        pushStates[neighbor] = 'in-queue';

        frames.push(graphSnap(graph, pushStates, {
          queue:   [...stack],
          visited: [...visitedArr],
          message: `Push neighbor ${neighbor} onto stack.`,
          variables: { current, neighbor, stack: `[${stack.join(', ')}]` },
          phase:   `Push ${neighbor}`,
        }));
      }
    }
  }

  const doneStates = Object.fromEntries(graph.nodes.map((n) => [n.id, 'visited']));
  frames.push(graphSnap(graph, doneStates, {
    queue:   [],
    visited: [...visitedArr],
    message: `DFS complete. Visit order: ${visitedArr.join(' → ')}`,
    variables: { order: visitedArr.join(' → ') },
    phase:   'Done!',
  }));

  return frames;
}
