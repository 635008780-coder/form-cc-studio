import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import { getVehicleFrame, type VehicleConfig, type VehicleFrame } from "./vehicleModel";

export interface DetailPlacement {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  normal: THREE.Vector3;
  side: 1 | -1;
}

export interface VehicleDetails {
  gaps: THREE.BufferGeometry;
  frontLamps: THREE.BufferGeometry;
  frontLightElements: THREE.BufferGeometry;
  drl: THREE.BufferGeometry;
  rearLamps: THREE.BufferGeometry;
  darkTrim: THREE.BufferGeometry;
  handles: DetailPlacement[];
  mirrors: DetailPlacement[];
  antenna: DetailPlacement | null;
  roofRails: THREE.Vector3[][];
  dispose: () => void;
}

interface Hit {
  p: THREE.Vector3;
  n: THREE.Vector3;
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

class SurfaceProbe {
  private bvh: MeshBVH;
  private geometry: THREE.BufferGeometry;
  private ray = new THREE.Ray();

  constructor(source: THREE.BufferGeometry) {
    this.geometry = source.clone();
    this.bvh = new MeshBVH(this.geometry);
  }

  cast(origin: THREE.Vector3, direction: THREE.Vector3, accept?: (point: THREE.Vector3, normal: THREE.Vector3) => boolean): Hit | null {
    this.ray.origin.copy(origin);
    this.ray.direction.copy(direction).normalize();
    const hits = this.bvh.raycast(this.ray, THREE.DoubleSide).sort((a, b) => a.distance - b.distance);
    for (const hit of hits) {
      const normal = hit.face?.normal ? hit.face.normal.clone() : this.ray.direction.clone().negate();
      if (normal.dot(this.ray.direction) > 0) normal.negate();
      if (accept && !accept(hit.point, normal)) continue;
      return { p: hit.point.clone(), n: normal.normalize() };
    }
    return null;
  }

  dispose() {
    this.geometry.dispose();
  }
}

class RibbonBuilder {
  positions: number[] = [];
  indices: number[] = [];

  add(points: Hit[], width: number, lift = 0.0028, closed = false) {
    if (points.length < 2) return;
    const base = this.positions.length / 3;
    const count = points.length;
    for (let i = 0; i < count; i += 1) {
      const previous = points[closed ? (i - 1 + count) % count : Math.max(0, i - 1)].p;
      const next = points[closed ? (i + 1) % count : Math.min(count - 1, i + 1)].p;
      const tangent = next.clone().sub(previous).normalize();
      const normal = points[i].n;
      const side = new THREE.Vector3().crossVectors(tangent, normal).normalize().multiplyScalar(width / 2);
      const center = points[i].p.clone().addScaledVector(normal, lift);
      const a = center.clone().sub(side);
      const b = center.clone().add(side);
      this.positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const segments = closed ? count : count - 1;
    for (let i = 0; i < segments; i += 1) {
      const i0 = base + i * 2;
      const i1 = base + ((i + 1) % count) * 2;
      this.indices.push(i0, i0 + 1, i1 + 1, i0, i1 + 1, i1);
    }
  }

  build() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setIndex(this.indices);
    geometry.computeVertexNormals();
    return geometry;
  }
}

class PatchBuilder {
  positions: number[] = [];
  indices: number[] = [];

  addGrid(grid: (Hit | null)[][], lift = 0.005) {
    const ids = grid.map((column) =>
      column.map((hit) => {
        if (!hit) return -1;
        const point = hit.p.clone().addScaledVector(hit.n, lift);
        this.positions.push(point.x, point.y, point.z);
        return this.positions.length / 3 - 1;
      }),
    );
    for (let u = 0; u < ids.length - 1; u += 1) {
      for (let v = 0; v < ids[u].length - 1; v += 1) {
        const a = ids[u][v];
        const b = ids[u + 1][v];
        const c = ids[u + 1][v + 1];
        const d = ids[u][v + 1];
        if (a < 0 || b < 0 || c < 0 || d < 0) continue;
        this.indices.push(a, b, c, a, c, d);
      }
    }
  }

  build() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setIndex(this.indices);
    geometry.computeVertexNormals();
    return geometry;
  }
}

/** Splits sampled hits into continuous runs (breaks at misses or jumps across openings). */
function runs(samples: (Hit | null)[], maxJump = 0.2) {
  const result: Hit[][] = [];
  let current: Hit[] = [];
  for (const sample of samples) {
    if (!sample || (current.length > 0 && current[current.length - 1].p.distanceTo(sample.p) > maxJump)) {
      if (current.length > 1) result.push(current);
      current = sample ? [sample] : [];
      continue;
    }
    current.push(sample);
  }
  if (current.length > 1) result.push(current);
  return result;
}

function placement(hit: Hit, side: 1 | -1): DetailPlacement {
  const zAxis = hit.n.clone();
  const xAxis = new THREE.Vector3(1, 0, 0).addScaledVector(zAxis, -zAxis.x).normalize();
  const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
  const matrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  return { position: hit.p.clone(), quaternion: new THREE.Quaternion().setFromRotationMatrix(matrix), normal: hit.n.clone(), side };
}

type Quad = [[number, number], [number, number], [number, number], [number, number]];

export function buildVehicleDetails(config: VehicleConfig, probeGeometry: THREE.BufferGeometry): VehicleDetails {
  const frame: VehicleFrame = getVehicleFrame(config);
  const probe = new SurfaceProbe(probeGeometry);
  const { L, H, type } = frame;
  const halfW = frame.W / 2;
  const gaps = new RibbonBuilder();
  const drl = new RibbonBuilder();
  const frontLamps = new PatchBuilder();
  const frontLightElements = new PatchBuilder();
  const rearLamps = new PatchBuilder();
  const darkTrim = new PatchBuilder();
  const sides = [1, -1] as const;

  const sideHit = (x: number, y: number, side: 1 | -1) =>
    probe.cast(new THREE.Vector3(x, y, side * 3), new THREE.Vector3(0, 0, -side), (p) => p.z * side > 0.25);
  const topHit = (x: number, z: number) =>
    probe.cast(new THREE.Vector3(x, H + 2, z), new THREE.Vector3(0, -1, 0));
  const frontHit = (y: number, z: number) =>
    probe.cast(new THREE.Vector3(-L, y, z), new THREE.Vector3(1, 0, 0), (p) => p.x < -L / 2 + 0.7);
  const rearHit = (y: number, z: number) =>
    probe.cast(new THREE.Vector3(L, y, z), new THREE.Vector3(-1, 0, 0), (p, normal) => p.x > L / 2 - 0.7 && normal.x > 0.5);

  const sampleLine = (fn: (t: number) => Hit | null, count: number) =>
    runs(Array.from({ length: count + 1 }, (_, i) => fn(i / count)));
  const addGap = (lines: Hit[][], width = 0.0055) => lines.forEach((line) => gaps.add(line, width));

  const beltAtX = (x: number) => frame.beltAt(frame.sAtX(x));
  const doorBottom = frame.rockerTop + 0.03;
  const [frontArch, rearArch] = frame.arches;
  const pillarX = frame.glass.pillars.map((pillar) => frame.xAt(pillar));
  const glassStartX = frame.xAt(frame.glass.start);
  const glassEndX = frame.xAt(frame.glass.end);
  const frontDoorX = Math.max(frontArch.x + frontArch.lipR + 0.02, glassStartX - 0.03);

  const vertical = (x: number, y0: number, y1: number, side: 1 | -1) =>
    sampleLine((t) => sideHit(x, mix(y0, y1, t), side), 14);
  const polyline = (points: Array<[number, number]>, side: 1 | -1, perSegment = 8) => {
    const samples: (Hit | null)[] = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      for (let j = i === 0 ? 0 : 1; j <= perSegment; j += 1) {
        const t = j / perSegment;
        samples.push(sideHit(mix(points[i][0], points[i + 1][0], t), mix(points[i][1], points[i + 1][1], t), side));
      }
    }
    return runs(samples);
  };

  const handles: DetailPlacement[] = [];
  const mirrors: DetailPlacement[] = [];

  /* Doors, sill and sliding track */
  for (const side of sides) {
    addGap(vertical(frontDoorX, doorBottom, beltAtX(frontDoorX) - 0.006, side));
    let doorEndBottomX = pillarX[0] ?? frontDoorX + 1;
    let doorEndTopX = doorEndBottomX;
    const handleXs: number[] = [];

    if (type === "mpv") {
      const b = pillarX[0];
      const c = pillarX[1] ?? b + 0.9;
      addGap(vertical(b, doorBottom, beltAtX(b) - 0.006, side));
      addGap(vertical(c, doorBottom, beltAtX(c) - 0.006, side));
      addGap(polyline([[c, beltAtX(c) - 0.035], [glassEndX - 0.06, beltAtX(glassEndX) - 0.035]], side, 14), 0.008);
      doorEndBottomX = c;
      doorEndTopX = c;
      handleXs.push(mix(frontDoorX, b, 0.72), b + 0.14);
    } else if (type === "micro") {
      const b = pillarX[0] + 0.03;
      addGap(vertical(b, doorBottom, beltAtX(b) - 0.006, side));
      doorEndBottomX = b;
      doorEndTopX = b;
      handleXs.push(mix(frontDoorX, b, 0.74));
    } else {
      const b = pillarX[0];
      addGap(vertical(b, doorBottom, beltAtX(b) - 0.006, side));
      const endTop = type === "suv" && pillarX[1] !== undefined ? pillarX[1] : Math.min(glassEndX - 0.02, rearArch.x - 0.02);
      const rx = rearArch.x - rearArch.lipR - 0.035;
      const kneeY = rearArch.cy + (rearArch.lipR + 0.035) * 0.55;
      const topY = beltAtX(endTop) - 0.006;
      addGap(polyline([[rx, doorBottom], [rx, kneeY], [mix(rx, endTop, 0.6), mix(kneeY, topY, 0.55)], [endTop, topY]], side, 8));
      doorEndBottomX = rx;
      doorEndTopX = endTop;
      handleXs.push(mix(frontDoorX, b, 0.72), mix(b, doorEndTopX, 0.6));
    }
    addGap(polyline([[frontDoorX, doorBottom], [doorEndBottomX, doorBottom]], side, 22));

    for (const hx of handleXs) {
      const hit = sideHit(hx, beltAtX(hx) - 0.08, side);
      if (hit) handles.push(placement(hit, side));
    }
    const mirrorX = glassStartX + 0.06;
    const mirrorHit = sideHit(mirrorX, beltAtX(mirrorX) - 0.025, side);
    if (mirrorHit) mirrors.push(placement(mirrorHit, side));

    // Fuel door on right rear quarter
    if (side === 1 && type !== "mpv") {
      const cx = rearArch.x + 0.02;
      const cy = beltAtX(cx) - 0.14;
      const ring: Hit[] = [];
      for (let i = 0; i < 20; i += 1) {
        const angle = (i / 20) * Math.PI * 2;
        const hit = sideHit(cx + Math.cos(angle) * 0.075, cy + Math.sin(angle) * 0.075, side);
        if (hit) ring.push(hit);
      }
      if (ring.length === 20) gaps.add(ring, 0.004, 0.0028, true);
    }
  }

  /* Hood */
  const hoodZ = (s: number) => frame.halfWidthAt(s) * frame.hoodW;
  const hoodS0 = frame.hoodFrontS;
  const hoodS1 = frame.cowlS - 0.012;
  for (const side of sides) {
    addGap(sampleLine((t) => {
      const s = mix(hoodS0, hoodS1, t);
      return topHit(frame.xAt(s), side * hoodZ(s));
    }, 26));
  }
  addGap(sampleLine((t) => topHit(frame.xAt(hoodS1), mix(-hoodZ(hoodS1), hoodZ(hoodS1), t)), 20));
  addGap(sampleLine((t) => topHit(frame.xAt(hoodS0), mix(-hoodZ(hoodS0), hoodZ(hoodS0), t)), 20));

  // Cowl panel (wiper tray) just ahead of the windshield
  const cowlHalf = frame.halfWidthAt(frame.cowlS) * 0.74;
  darkTrim.addGrid(
    Array.from({ length: 17 }, (_, i) =>
      Array.from({ length: 3 }, (_, j) =>
        topHit(frame.xAt(mix(frame.cowlS - (type === "mpv" ? 0.018 : 0.03), frame.cowlS - 0.006, j / 2)), mix(-cowlHalf, cowlHalf, i / 16)),
      ),
    ),
    0.004,
  );

  /* Trunk lid / tailgate */
  if (type === "sedan") {
    const t0 = frame.rearGlassS + 0.012;
    for (const side of sides) {
      addGap(sampleLine((t) => {
        const s = mix(t0, 0.99, t);
        return topHit(frame.xAt(s), side * frame.halfWidthAt(s) * 0.76);
      }, 16));
    }
    addGap(sampleLine((t) => topHit(frame.xAt(t0), mix(-1, 1, t) * frame.halfWidthAt(t0) * 0.76), 18));
    const lidY = frame.tailTop - 0.07;
    const lidZ = frame.halfWidthAt(1) * 0.76;
    addGap(sampleLine((t) => rearHit(lidY, mix(-lidZ, lidZ, t)), 20));
    for (const side of sides) addGap(sampleLine((t) => rearHit(mix(lidY, frame.tailTop + 0.06, t), side * lidZ), 8));
  } else {
    const tz = frame.halfWidthAt(1) * 0.76;
    const bumperY = frame.floor + (frame.rearGlassBottom - frame.floor) * 0.28;
    for (const side of sides) addGap(sampleLine((t) => rearHit(mix(bumperY, H - 0.08, t), side * tz), 30));
    addGap(sampleLine((t) => rearHit(bumperY, mix(-tz, tz, t)), 20));
  }

  /* Front lamps */
  const nose = frame.nose;
  const frontQuads: Record<VehicleFrame["type"], Quad | null> = {
    sedan: [[0.5, -0.12], [0.9, -0.085], [0.89, -0.04], [0.53, -0.07]],
    suv: [[0.56, -0.16], [0.9, -0.15], [0.9, -0.06], [0.58, -0.06]],
    mpv: [[0.62, -0.21], [0.91, -0.17], [0.91, -0.05], [0.64, -0.07]],
    micro: [[0.5, -0.13], [0.92, -0.1], [0.92, -0.05], [0.52, -0.075]],
  };
  const lampGrid = (
    cast: (y: number, z: number) => Hit | null,
    point: (u: number, v: number) => [number, number],
    nu = 12,
    nv = 5,
  ) =>
    Array.from({ length: nu + 1 }, (_, i) =>
      Array.from({ length: nv + 1 }, (_, j) => {
        const [z, y] = point(i / nu, j / nv);
        return cast(y, z);
      }),
    );
  const bilinear = (quad: Quad, side: 1 | -1, yBase: number) => (u: number, v: number): [number, number] => {
    const bottom = [mix(quad[0][0], quad[1][0], u), mix(quad[0][1], quad[1][1], u)];
    const top = [mix(quad[3][0], quad[2][0], u), mix(quad[3][1], quad[2][1], u)];
    return [side * mix(bottom[0], top[0], v) * halfW, yBase + mix(bottom[1], top[1], v)];
  };
  const outline = (grid: (Hit | null)[][], builder: RibbonBuilder, width: number, edge: "top" | "all") => {
    const topRow = grid.map((column) => column[column.length - 1]);
    runs(topRow).forEach((line) => builder.add(line, width, 0.0065));
    if (edge === "all") {
      runs(grid.map((column) => column[0])).forEach((line) => gaps.add(line, 0.005, 0.006));
      runs(topRow).forEach((line) => gaps.add(line, 0.004, 0.0058));
    }
  };

  const scaleFrontLamp = (quad: Quad): Quad => {
    const centerZ = quad.reduce((sum, point) => sum + point[0], 0) / 4;
    const centerY = quad.reduce((sum, point) => sum + point[1], 0) / 4;
    const widthScale = Math.max(0.6, Math.min(1.3, config.headlampWidth / 100));
    const heightScale = Math.max(0.6, Math.min(1.4, config.headlampHeight / 100));
    return quad.map(([z, y]) => [centerZ + (z - centerZ) * widthScale, centerY + (y - centerY) * heightScale]) as Quad;
  };

  for (const side of sides) {
    const quad = config.headlampStyle === "round" ? null : frontQuads[type];
    if (quad) {
      const lampPoint = bilinear(scaleFrontLamp(quad), side, nose);
      const grid = lampGrid(frontHit, lampPoint);
      frontLamps.addGrid(grid);
      outline(grid, drl, 0.011, "all");
      for (let module = 0; module < 3; module += 1) {
        const start = 0.1 + module * 0.27;
        const end = start + 0.12;
        frontLightElements.addGrid(lampGrid(frontHit, (u, v) => lampPoint(mix(start, end, u), mix(0.25, 0.62, v)), 3, 2), 0.007);
      }
    } else {
      const cz = side * 0.72 * halfW;
      const cy = nose - 0.12;
      const grid = lampGrid(frontHit, (u, v) => {
        const angle = u * Math.PI * 2;
        const radius = 0.078 * v;
        return [
          cz + Math.cos(angle) * radius * config.headlampWidth / 100,
          cy + Math.sin(angle) * radius * config.headlampHeight / 100,
        ];
      }, 20, 4);
      frontLamps.addGrid(grid);
      const rim = grid.map((column) => column[column.length - 1]).filter((hit): hit is Hit => hit !== null);
      if (rim.length > 8) {
        drl.add(rim, 0.012, 0.0065, true);
      }
    }

  }

  /* Rear lamps and plate */
  const tail = frame.hatchback ? frame.beltAt(0.96) + 0.045 : frame.tailTop;
  const rearQuads: Record<VehicleFrame["type"], Quad> = {
    sedan: [[0.32, -0.13], [0.95, -0.11], [0.96, -0.04], [0.34, -0.05]],
    suv: [[0.42, -0.17], [0.95, -0.16], [0.96, -0.05], [0.46, -0.05]],
    mpv: [[0.73, -0.28], [0.88, -0.28], [0.86, 0.2], [0.74, 0.2]],
    micro: [[0.68, -0.22], [0.86, -0.22], [0.85, 0.15], [0.7, 0.15]],
  };
  for (const side of sides) {
    const grid = lampGrid(rearHit, bilinear(rearQuads[type], side, tail), type === "mpv" || type === "micro" ? 8 : 16, type === "mpv" || type === "micro" ? 20 : 6);
    rearLamps.addGrid(grid);
    runs(grid.map((column) => column[0])).forEach((line) => gaps.add(line, 0.005, 0.006));
  }
  if (type === "sedan" || type === "suv") {
    const barY = tail - (type === "sedan" ? 0.075 : 0.1);
    const grid = lampGrid(rearHit, (u, v) => [mix(-0.34, 0.34, u) * halfW, barY + v * 0.018], 16, 1);
    rearLamps.addGrid(grid, 0.0055);
  }
  const plateY = frame.floor + (tail - frame.floor) * (frame.hatchback ? 0.42 : 0.36);
  darkTrim.addGrid(lampGrid(rearHit, (u, v) => [mix(-0.26, 0.26, u), plateY + mix(-0.06, 0.06, v)], 8, 3), 0.004);
  if (config.hasGrille) {
    darkTrim.addGrid(
      lampGrid(frontHit, (u, v) => [mix(-0.24, 0.24, u), frame.floor + 0.115 + mix(-0.026, 0.026, v)], 12, 3),
      0.004,
    );
  }

  /* Roof rails / antenna */
  const roofRails: THREE.Vector3[][] = [];
  if (type === "suv") {
    for (const side of sides) {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 20; i += 1) {
        const s = mix(frame.roofFrontS + 0.03, frame.roofRearS - 0.005, i / 20);
        const hit = topHit(frame.xAt(s), side * frame.halfWidthAt(s) * frame.style.roofEdge * 0.8);
        if (hit) points.push(hit.p.clone().add(new THREE.Vector3(0, 0.026, 0)));
      }
      if (points.length > 4) roofRails.push(points);
    }
  }
  let antenna: DetailPlacement | null = null;
  if (type !== "mpv") {
    const hit = topHit(frame.xAt(frame.roofRearS - 0.03), 0);
    if (hit) antenna = placement(hit, 1);
  }

  probe.dispose();
  const geometries = {
    gaps: gaps.build(),
    frontLamps: frontLamps.build(),
    frontLightElements: frontLightElements.build(),
    drl: drl.build(),
    rearLamps: rearLamps.build(),
    darkTrim: darkTrim.build(),
  };
  return {
    ...geometries,
    handles,
    mirrors,
    antenna,
    roofRails,
    dispose: () => Object.values(geometries).forEach((geometry) => geometry.dispose()),
  };
}
