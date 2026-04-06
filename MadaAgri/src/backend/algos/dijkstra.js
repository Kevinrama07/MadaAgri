function haversineKm(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Graphe complet entre régions (prototype). Retourne chemin + distance totale.
function dijkstra(nodes, startId, endId) {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();

  for (const n of nodes) dist.set(n.id, Infinity);
  dist.set(startId, 0);

  function extractMin() {
    let bestId = null;
    let best = Infinity;
    for (const [id, d] of dist.entries()) {
      if (!visited.has(id) && d < best) {
        best = d;
        bestId = id;
      }
    }
    return bestId;
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));

  while (true) {
    const u = extractMin();
    if (!u) break;
    if (u === endId) break;
    visited.add(u);

    const uNode = byId.get(u);
    for (const vNode of nodes) {
      if (visited.has(vNode.id) || vNode.id === u) continue;
      const alt = dist.get(u) + haversineKm(uNode, vNode);
      if (alt < dist.get(vNode.id)) {
        dist.set(vNode.id, alt);
        prev.set(vNode.id, u);
      }
    }
  }

  const path = [];
  let cur = endId;
  if (dist.get(cur) === Infinity) {
    return { path: [], distance_km: null };
  }
  while (cur) {
    path.push(cur);
    if (cur === startId) break;
    cur = prev.get(cur);
  }
  path.reverse();

  return { path, distance_km: dist.get(endId) };
}

module.exports = { dijkstra };

