/**
 * Build an adjacency list graph from the lineStations data.
 *
 * lineStations is an array of { line_id, station_id, position } rows.
 *
 * The resulting graph maps each station_id to an array of neighbour station_ids.
 * Each entry in lineStations is sorted by (line_id, position), and for each
 * consecutive pair on the same line, a bidirectional edge is added.
 *
 * @param {Array} lineStations - rows from getLineStations()
 * @returns {Map<number, number[]>} adjacency list
 */
export const buildAdjacencyList = (lineStations) => {
  const graph = new Map();

  // Group by line
  const byLine = {};
  for (const ls of lineStations) {
    if (!byLine[ls.line_id]) byLine[ls.line_id] = [];
    byLine[ls.line_id].push(ls);
  }

  // For each line, sort by position and add bidirectional edges
  for (const lineId of Object.keys(byLine)) {
    const stops = byLine[lineId].sort((a, b) => a.position - b.position);
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i].station_id;
      const b = stops[i + 1].station_id;

      if (!graph.has(a)) graph.set(a, []);
      if (!graph.has(b)) graph.set(b, []);

      // Add neighbour only if not already present (stations can be on multiple lines)
      if (!graph.get(a).includes(b)) graph.get(a).push(b);
      if (!graph.get(b).includes(a)) graph.get(b).push(a);
    }
  }

  return graph;
};

/**
 * BFS to compute the shortest path distance between two stations.
 *
 * @param {Map<number, number[]>} graph - adjacency list from buildAdjacencyList
 * @param {number} startId
 * @param {number} endId
 * @returns {number} shortest distance in stops, or Infinity if unreachable
 */
export const bfsDistance = (graph, startId, endId) => {
  if (startId === endId) return 0;

  const visited = new Set([startId]);
  const queue = [[startId, 0]];

  while (queue.length > 0) {
    const [current, dist] = queue.shift();
    const neighbours = graph.get(current) || [];
    for (const neighbour of neighbours) {
      if (neighbour === endId) return dist + 1;
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push([neighbour, dist + 1]);
      }
    }
  }

  return Infinity;
};

/**
 * Randomly pick a valid (start, destination) pair where BFS distance >= 3.
 * Retries until a valid pair is found (the network is guaranteed to have such pairs).
 *
 * @param {Array<{id: number, name: string}>} stations
 * @param {Map<number, number[]>} graph
 * @returns {{ startStation: {id, name}, destStation: {id, name} }}
 */
export const findValidPair = (stations, graph) => {
  const maxAttempts = 500;

  for (let i = 0; i < maxAttempts; i++) {
    const startIdx = Math.floor(Math.random() * stations.length);
    let destIdx = Math.floor(Math.random() * stations.length);

    // Ensure different stations
    if (destIdx === startIdx) continue;

    const startStation = stations[startIdx];
    const destStation = stations[destIdx];

    const dist = bfsDistance(graph, startStation.id, destStation.id);
    if (dist >= 3) {
      return { startStation, destStation };
    }
  }

  // Fallback
  for (const start of stations) {
    for (const dest of stations) {
      if (start.id === dest.id) continue;
      if (bfsDistance(graph, start.id, dest.id) >= 3) {
        return { startStation: start, destStation: dest };
      }
    }
  }

  throw new Error('No valid start/destination pair found in the network');
};
