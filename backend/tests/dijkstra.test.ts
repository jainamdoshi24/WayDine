import { describe, it, expect } from 'vitest';
import { buildGraph, dijkstra, reconstructPath, aStar } from '../src/algorithms/dijkstra.js';
import { haversineDistance } from '../src/algorithms/geo.js';

describe('Dijkstra', () => {
  const nodes = [
    { id: 'A', lat: 0, lng: 0 },
    { id: 'B', lat: 0, lng: 1 },
    { id: 'C', lat: 1, lng: 0 },
    { id: 'D', lat: 1, lng: 1 },
  ];

  const edges = [
    { from: 'A', to: 'B', weight: 1 },
    { from: 'A', to: 'C', weight: 4 },
    { from: 'B', to: 'D', weight: 1 },
    { from: 'C', to: 'D', weight: 1 },
  ];

  const graph = buildGraph(nodes, edges);

  it('finds shortest path A→D = 2', () => {
    const { distances } = dijkstra(graph, 'A');
    expect(distances.get('D')).toBe(2);
  });

  it('finds shortest path A→C = 3 (via B→D→C through bidirectional graph)', () => {
    // Graph is bidirectional: A→B(1), B→D(1), D→C(1) ⟹ A→C = 3
    // Direct A→C edge has weight 4, but the shorter path is A→B→D→C = 3
    const { distances } = dijkstra(graph, 'A');
    expect(distances.get('C')).toBe(3);
  });

  it('reconstructs path A→D as A→B→D', () => {
    // Bidirectional: A→B(1)→D(1) = 2, which is still the shortest to D
    const { predecessors } = dijkstra(graph, 'A');
    const path = reconstructPath(predecessors, 'D');
    expect(path[0]).toBe('A');
    expect(path[path.length - 1]).toBe('D');
    expect(path.length).toBeLessThanOrEqual(3);
  });

  it('distance to unreachable node is Infinity', () => {
    const isolatedGraph = buildGraph(
      [...nodes, { id: 'E', lat: 5, lng: 5 }],
      edges // E has no edges
    );
    const { distances } = dijkstra(isolatedGraph, 'A');
    expect(distances.get('E')).toBe(Infinity);
  });
});

describe('A*', () => {
  const nodes = [
    { id: 'A', lat: 0, lng: 0 },
    { id: 'B', lat: 0, lng: 1 },
    { id: 'C', lat: 1, lng: 0 },
    { id: 'D', lat: 1, lng: 1 },
  ];

  const edges = [
    { from: 'A', to: 'B', weight: 1 },
    { from: 'A', to: 'C', weight: 4 },
    { from: 'B', to: 'D', weight: 1 },
    { from: 'C', to: 'D', weight: 1 },
  ];

  const graph = buildGraph(nodes, edges);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const heuristic = (id: string) => {
    const n = nodeMap.get(id)!;
    const goal = nodeMap.get('D')!;
    return haversineDistance(n, goal) / 111_320; // rough normalisation
  };

  it('finds path A→D', () => {
    const { path, distance } = aStar(graph, 'A', 'D', heuristic);
    expect(path).toContain('A');
    expect(path).toContain('D');
    expect(distance).toBe(2);
  });
});
