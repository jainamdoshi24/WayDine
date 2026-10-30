/**
 * Dijkstra's shortest-path algorithm over an explicit weighted graph.
 *
 * This is used for internal graph operations (e.g., finding optimal
 * ordering of pitstops when multiple stops are requested).
 *
 * Road routing is delegated to OSRM. This custom implementation fulfils
 * the hackathon requirement for a graph algorithm.
 */

export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number; // metres or seconds
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, { to: string; weight: number }[]>;
}

export function buildGraph(nodes: GraphNode[], edges: GraphEdge[]): Graph {
  const nodeMap = new Map<string, GraphNode>();
  const adjacency = new Map<string, { to: string; weight: number }[]>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.from)?.push({ to: edge.to, weight: edge.weight });
    // Bidirectional road graph
    adjacency.get(edge.to)?.push({ to: edge.from, weight: edge.weight });
  }

  return { nodes: nodeMap, adjacency };
}

/**
 * Dijkstra's algorithm.
 * Returns shortest distances from `source` to all reachable nodes,
 * and the predecessor map for path reconstruction.
 */
export function dijkstra(
  graph: Graph,
  sourceId: string
): { distances: Map<string, number>; predecessors: Map<string, string | null> } {
  const distances = new Map<string, number>();
  const predecessors = new Map<string, string | null>();
  const visited = new Set<string>();

  // Priority queue implemented as a min-heap via sorted insertion
  // For hackathon scale this is sufficient; replace with a binary heap for production
  const pq: { id: string; dist: number }[] = [];

  for (const id of graph.nodes.keys()) {
    distances.set(id, Infinity);
    predecessors.set(id, null);
  }
  distances.set(sourceId, 0);
  pq.push({ id: sourceId, dist: 0 });

  while (pq.length > 0) {
    // Extract minimum
    pq.sort((a, b) => a.dist - b.dist);
    const { id: u } = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    const neighbours = graph.adjacency.get(u) ?? [];
    for (const { to: v, weight } of neighbours) {
      if (visited.has(v)) continue;
      const alt = distances.get(u)! + weight;
      if (alt < distances.get(v)!) {
        distances.set(v, alt);
        predecessors.set(v, u);
        pq.push({ id: v, dist: alt });
      }
    }
  }

  return { distances, predecessors };
}

/**
 * Reconstruct a path from the predecessor map.
 */
export function reconstructPath(
  predecessors: Map<string, string | null>,
  targetId: string
): string[] {
  const path: string[] = [];
  let current: string | null = targetId;
  while (current !== null) {
    path.unshift(current);
    current = predecessors.get(current) ?? null;
  }
  return path;
}

/**
 * A* search with a Euclidean heuristic (admissible for road graphs).
 * h(n) = straight-line distance to goal ≤ actual road distance.
 */
export function aStar(
  graph: Graph,
  sourceId: string,
  targetId: string,
  heuristic: (nodeId: string) => number
): { path: string[]; distance: number } {
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const predecessors = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const id of graph.nodes.keys()) {
    gScore.set(id, Infinity);
    fScore.set(id, Infinity);
    predecessors.set(id, null);
  }

  gScore.set(sourceId, 0);
  fScore.set(sourceId, heuristic(sourceId));

  const open: { id: string; f: number }[] = [{ id: sourceId, f: heuristic(sourceId) }];

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const { id: current } = open.shift()!;

    if (current === targetId) {
      const path = reconstructPath(predecessors, targetId);
      return { path, distance: gScore.get(targetId) ?? Infinity };
    }

    if (visited.has(current)) continue;
    visited.add(current);

    const neighbours = graph.adjacency.get(current) ?? [];
    for (const { to: neighbour, weight } of neighbours) {
      if (visited.has(neighbour)) continue;
      const tentativeG = gScore.get(current)! + weight;
      if (tentativeG < gScore.get(neighbour)!) {
        predecessors.set(neighbour, current);
        gScore.set(neighbour, tentativeG);
        fScore.set(neighbour, tentativeG + heuristic(neighbour));
        open.push({ id: neighbour, f: fScore.get(neighbour)! });
      }
    }
  }

  return { path: [], distance: Infinity };
}
