// Dijkstra Algorithm for route optimization
export const dijkstra = (graph, start) => {
  const distances = {};
  const visited = new Set();
  const queue = [];

  // Initialize distances
  Object.keys(graph).forEach((node) => {
    distances[node] = node === start ? 0 : Infinity;
  });

  queue.push(start);

  while (queue.length > 0) {
    let current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    graph[current].forEach(({ node: neighbor, weight }) => {
      const newDistance = distances[current] + weight;
      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance;
        queue.push(neighbor);
      }
    });
  }

  return distances;
};

// A* Algorithm for path finding
export const aStar = (graph, start, end, heuristic) => {
  const openSet = [start];
  const cameFrom = {};
  const gScore = {};
  const fScore = {};

  Object.keys(graph).forEach((node) => {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
  });

  gScore[start] = 0;
  fScore[start] = heuristic(start, end);

  while (openSet.length > 0) {
    let current = openSet[0];
    let currentIndex = 0;

    for (let i = 1; i < openSet.length; i++) {
      if (fScore[openSet[i]] < fScore[current]) {
        current = openSet[i];
        currentIndex = i;
      }
    }

    if (current === end) {
      return reconstructPath(cameFrom, current);
    }

    openSet.splice(currentIndex, 1);

    graph[current].forEach(({ node: neighbor, weight }) => {
      const tentativeGScore = gScore[current] + weight;

      if (tentativeGScore < gScore[neighbor]) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeGScore;
        fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, end);

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    });
  }

  return [];
};

const reconstructPath = (cameFrom, current) => {
  const path = [current];
  while (cameFrom[current]) {
    current = cameFrom[current];
    path.unshift(current);
  }
  return path;
};

// Union-Find for clustering
export class UnionFind {
  constructor(n) {
    this.parent = Array(n)
      .fill(0)
      .map((_, i) => i);
    this.rank = Array(n).fill(0);
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x, y) {
    const px = this.find(x);
    const py = this.find(y);

    if (px === py) return false;

    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
    } else {
      this.parent[py] = px;
      this.rank[px]++;
    }
    return true;
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}

// Knapsack optimization for cart
export const knapsackOptimization = (items, capacity) => {
  const n = items.length;
  const dp = Array(capacity + 1).fill(0);
  const selected = Array(capacity + 1).fill(false).map(() => []);

  for (let i = 0; i < n; i++) {
    for (let w = capacity; w >= items[i].weight; w--) {
      const value = dp[w - items[i].weight] + items[i].value;
      if (value > dp[w]) {
        dp[w] = value;
        selected[w] = [...selected[w - items[i].weight], items[i]];
      }
    }
  }

  return {
    maxValue: dp[capacity],
    selectedItems: selected[capacity],
  };
};

// Hash function for quick search
export const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
};

// KMP algorithm for pattern matching
export const kmpSearch = (text, pattern) => {
  const lps = buildLPS(pattern);
  const matches = [];
  let j = 0;

  for (let i = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== pattern[j]) {
      j = lps[j - 1];
    }
    if (text[i] === pattern[j]) {
      j++;
    }
    if (j === pattern.length) {
      matches.push(i - j + 1);
      j = lps[j - 1];
    }
  }

  return matches;
};

const buildLPS = (pattern) => {
  const lps = Array(pattern.length).fill(0);
  let length = 0;
  let i = 1;

  while (i < pattern.length) {
    if (pattern[i] === pattern[length]) {
      length++;
      lps[i] = length;
      i++;
    } else if (length !== 0) {
      length = lps[length - 1];
    } else {
      lps[i] = 0;
      i++;
    }
  }

  return lps;
};

export default {
  dijkstra,
  aStar,
  UnionFind,
  knapsackOptimization,
  hashString,
  kmpSearch,
};
