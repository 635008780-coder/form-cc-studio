import type { ControlMesh, Point3 } from "./vehicleModel";

export interface TopologyReport {
  quadFaces: number;
  otherFaces: number;
  bodyComponents: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
  inconsistentEdges: number;
  shortEdges: number;
  shortestEdgeMm: number;
  collapsedFaces: number;
  overlappingPoints: number;
  interiorPoles: number;
}

const edgeKey = (a: number, b: number) => a < b ? `${a}_${b}` : `${b}_${a}`;

function triangleArea(a: Point3, b: Point3, c: Point3) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  return Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
}

export function analyzeControlMesh(mesh: ControlMesh, shortEdgeMm = 5): TopologyReport {
  const edges = new Map<string, { a: number; b: number; count: number; direction: number }>();
  const neighbors = new Map<number, Set<number>>();
  let quadFaces = 0;
  let otherFaces = 0;
  let collapsedFaces = 0;

  mesh.faces.forEach((face) => {
    if (face.length === 4) quadFaces += 1;
    else otherFaces += 1;
    let area = 0;
    for (let index = 1; index < face.length - 1; index += 1) {
      area += triangleArea(mesh.vertices[face[0]], mesh.vertices[face[index]], mesh.vertices[face[index + 1]]);
    }
    if (area < 1e-8) collapsedFaces += 1;

    face.forEach((a, index) => {
      const b = face[(index + 1) % face.length];
      const key = edgeKey(a, b);
      const edge = edges.get(key) ?? { a: Math.min(a, b), b: Math.max(a, b), count: 0, direction: 0 };
      edge.count += 1;
      edge.direction += a < b ? 1 : -1;
      edges.set(key, edge);
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      if (!neighbors.has(b)) neighbors.set(b, new Set());
      neighbors.get(a)!.add(b);
      neighbors.get(b)!.add(a);
    });
  });

  const boundaryVertices = new Set<number>();
  let shortestEdgeMm = Infinity;
  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  let inconsistentEdges = 0;
  let shortEdges = 0;
  edges.forEach(({ a, b, count, direction }) => {
    if (count === 1) {
      boundaryEdges += 1;
      boundaryVertices.add(a);
      boundaryVertices.add(b);
    }
    if (count > 2) nonManifoldEdges += 1;
    if (count === 2 && direction !== 0) inconsistentEdges += 1;
    const first = mesh.vertices[a];
    const second = mesh.vertices[b];
    const lengthMm = Math.hypot(first[0] - second[0], first[1] - second[1], first[2] - second[2]) * 1000;
    shortestEdgeMm = Math.min(shortestEdgeMm, lengthMm);
    if (lengthMm < shortEdgeMm) shortEdges += 1;
  });

  let interiorPoles = 0;
  neighbors.forEach((adjacent, vertex) => {
    if (!boundaryVertices.has(vertex) && adjacent.size !== 4) interiorPoles += 1;
  });

  const tolerance = 0.0001;
  const buckets = new Map<string, number[]>();
  let overlappingPoints = 0;
  neighbors.forEach((_adjacent, vertex) => {
    const point = mesh.vertices[vertex];
    const cell = point.map((coordinate) => Math.floor(coordinate / tolerance));
    let overlaps = false;
    for (let x = -1; x <= 1 && !overlaps; x += 1) {
      for (let y = -1; y <= 1 && !overlaps; y += 1) {
        for (let z = -1; z <= 1 && !overlaps; z += 1) {
          const bucket = buckets.get(`${cell[0] + x}_${cell[1] + y}_${cell[2] + z}`) ?? [];
          overlaps = bucket.some((other) => {
            const previous = mesh.vertices[other];
            return Math.hypot(point[0] - previous[0], point[1] - previous[1], point[2] - previous[2]) < tolerance;
          });
        }
      }
    }
    if (overlaps) overlappingPoints += 1;
    const key = `${cell[0]}_${cell[1]}_${cell[2]}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(vertex);
    buckets.set(key, bucket);
  });

  const unvisited = new Set(neighbors.keys());
  let bodyComponents = 0;
  while (unvisited.size) {
    const first = unvisited.values().next().value as number;
    unvisited.delete(first);
    const stack = [first];
    bodyComponents += 1;
    while (stack.length) {
      const vertex = stack.pop()!;
      neighbors.get(vertex)!.forEach((next) => {
        if (unvisited.delete(next)) stack.push(next);
      });
    }
  }

  return {
    quadFaces,
    otherFaces,
    bodyComponents,
    boundaryEdges,
    nonManifoldEdges,
    inconsistentEdges,
    shortEdges,
    shortestEdgeMm: Number.isFinite(shortestEdgeMm) ? shortestEdgeMm : 0,
    collapsedFaces,
    overlappingPoints,
    interiorPoles,
  };
}