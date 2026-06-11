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

/**
 * Validate a submitted route against the network rules.
 *
 * @param {Array<{from_id: number, to_id: number}>} segments - the submitted route
 * @param {number} startStationId
 * @param {number} destStationId
 * @param {Array<{line_id: number, station_id: number, position: number}>} lineStations
 * @returns {{ valid: true } | { valid: false, reason: string }}
 */
export const validateRoute = (segments, startStationId, destStationId, lineStations) => {
  // Non empty route
  if (!segments || segments.length === 0) {
    return { valid: false, reason: 'Route is empty.' };
  }

  // Starts at the assigned starting station
  if (segments[0].from_id !== startStationId) {
    return { valid: false, reason: 'Route does not start at the assigned starting station.' };
  }

  // Ends at the assigned destination
  if (segments[segments.length - 1].to_id !== destStationId) {
    return { valid: false, reason: 'Route does not end at the assigned destination.' };
  }

  // End of segment i must equal start of segment i+1
  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].to_id !== segments[i + 1].from_id) {
      return { valid: false, reason: `Segments ${i + 1} and ${i + 2} are not connected.` };
    }
  }

  // Map: "fromId-toId" -> Set of line_ids that include this adjacent pair (bidirectional)
  const segmentLines = new Map();

  // Group lineStations by line, sorted by position
  const byLine = {};
  for (const ls of lineStations) {
    if (!byLine[ls.line_id]) byLine[ls.line_id] = [];
    byLine[ls.line_id].push(ls);
  }
  for (const lineId of Object.keys(byLine)) {
    byLine[lineId].sort((a, b) => a.position - b.position);
  }

  // Build segmentLines map from consecutive pairs in each line
  for (const [lineId, stops] of Object.entries(byLine)) {
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i].station_id;
      const b = stops[i + 1].station_id;
      const key1 = `${a}-${b}`;
      const key2 = `${b}-${a}`;
      if (!segmentLines.has(key1)) segmentLines.set(key1, new Set());
      if (!segmentLines.has(key2)) segmentLines.set(key2, new Set());
      segmentLines.get(key1).add(Number(lineId));
      segmentLines.get(key2).add(Number(lineId));
    }
  }

  // Map: station_id -> Set of line_ids that serve it (used for interchange detection)
  const stationLineMap = new Map();
  for (const ls of lineStations) {
    if (!stationLineMap.has(ls.station_id)) stationLineMap.set(ls.station_id, new Set());
    stationLineMap.get(ls.station_id).add(ls.line_id);
  }

  // Track the set of valid lines for the current leg of the journey.
  // Initially, any line that serves the first segment is acceptable.
  const firstKey = `${segments[0].from_id}-${segments[0].to_id}`;
  const firstLines = segmentLines.get(firstKey);
  if (!firstLines || firstLines.size === 0) {
    return { valid: false, reason: `Segment 1 (${segments[0].from_id} → ${segments[0].to_id}) does not exist in the network.` };
  }

  // currentLines: the set of lines on which we are currently travelling
  let currentLines = new Set(firstLines);

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const key = `${seg.from_id}-${seg.to_id}`;
    const linesForSeg = segmentLines.get(key);

    // The segment must exist on at least one line
    if (!linesForSeg || linesForSeg.size === 0) {
      return { valid: false, reason: `Segment ${i + 1} (${seg.from_id} → ${seg.to_id}) does not exist in the network.` };
    }

    // Try to continue on one of the current lines
    const continuationLines = new Set([...currentLines].filter(l => linesForSeg.has(l)));

    if (continuationLines.size > 0) {
      // Staying on the same line(s) — no change needed
      currentLines = continuationLines;
    } else {
      // Need to change line — only allowed at an interchange station
      const changeStationId = seg.from_id;
      const linesAtStation = stationLineMap.get(changeStationId) || new Set();
      const isInterchange = linesAtStation.size > 1;

      if (!isInterchange) {
        return {
          valid: false,
          reason: `Cannot change line at station ${changeStationId} — it is not an interchange station.`,
        };
      }

      // Verify the new line(s) actually serve this segment
      const newLines = new Set([...linesForSeg]);
      if (newLines.size === 0) {
        return { valid: false, reason: `No valid line found for segment ${i + 1} after a line change.` };
      }
      currentLines = newLines;
    }
  }

  return { valid: true };
};
