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
    weight: number;
}
export interface Graph {
    nodes: Map<string, GraphNode>;
    adjacency: Map<string, {
        to: string;
        weight: number;
    }[]>;
}
export declare function buildGraph(nodes: GraphNode[], edges: GraphEdge[]): Graph;
/**
 * Dijkstra's algorithm.
 * Returns shortest distances from `source` to all reachable nodes,
 * and the predecessor map for path reconstruction.
 */
export declare function dijkstra(graph: Graph, sourceId: string): {
    distances: Map<string, number>;
    predecessors: Map<string, string | null>;
};
/**
 * Reconstruct a path from the predecessor map.
 */
export declare function reconstructPath(predecessors: Map<string, string | null>, targetId: string): string[];
/**
 * A* search with a Euclidean heuristic (admissible for road graphs).
 * h(n) = straight-line distance to goal ≤ actual road distance.
 */
export declare function aStar(graph: Graph, sourceId: string, targetId: string, heuristic: (nodeId: string) => number): {
    path: string[];
    distance: number;
};
//# sourceMappingURL=dijkstra.d.ts.map