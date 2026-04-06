// Graphe des relations (suivi/amis) + BFS/DFS pour réseau social
function buildAdjacency(followsRows) {
  const adj = new Map(); // userId -> Set(userId)
  for (const r of followsRows) {
    if (!adj.has(r.follower_id)) adj.set(r.follower_id, new Set());
    adj.get(r.follower_id).add(r.followee_id);
  }
  return adj;
}

function bfsReachable(adj, startId, maxDepth = 2) {
  const visited = new Set([startId]);
  const queue = [{ id: startId, depth: 0 }];
  const reachable = new Map(); // id -> depth

  while (queue.length) {
    const { id, depth } = queue.shift();
    if (depth >= maxDepth) continue;
    const neighbors = adj.get(id);
    if (!neighbors) continue;
    for (const nb of neighbors) {
      if (visited.has(nb)) continue;
      visited.add(nb);
      reachable.set(nb, depth + 1);
      queue.push({ id: nb, depth: depth + 1 });
    }
  }
  return reachable;
}

function dfsComponent(adj, startId, limit = 200) {
  const visited = new Set();
  const stack = [startId];
  while (stack.length && visited.size < limit) {
    const id = stack.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    const neighbors = adj.get(id);
    if (!neighbors) continue;
    for (const nb of neighbors) {
      if (!visited.has(nb)) stack.push(nb);
    }
  }
  return visited;
}

module.exports = { buildAdjacency, bfsReachable, dfsComponent };

