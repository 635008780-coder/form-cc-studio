/* Tiny software rasteriser used to inspect the subdivided body without a browser.
 * Usage: npx tsx scripts/render.ts <templateId> <out.png> <view> [key=value ...]
 * view: rear34 | front34 | side | top | rear | front | cowl | rearclose
 */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import * as THREE from "three";
import { conceptTemplates, createTemplateConfig } from "../src/conceptLibrary";
import { buildVehicleDetails } from "../src/vehicleDetails";
import { buildControlMesh, computePatchNormals, evaluateVehicleSurfaces, getVehicleFrame, grillePatternSegments, patchToGeometry, subdivide, type GrilleShape, type PatchMesh, type VehicleConfig } from "../src/vehicleModel";

const [, , templateId = "sedan-classic", out = "/tmp/render.png", view = "rear34", ...rest] = process.argv;
const template = conceptTemplates.find((t) => t.id === templateId)!;
const config = createTemplateConfig(template) as VehicleConfig & Record<string, unknown>;
let cageMode = false;
for (const item of rest) {
  if (item === "cage") { cageMode = true; continue; }
  const [k, v] = item.split("=");
  (config as Record<string, unknown>)[k] = v === "true" ? true : v === "false" ? false : Number.isNaN(Number(v)) ? v : Number(v);
}
const frame = getVehicleFrame(config);
const cage = buildControlMesh(config);
const surfaces = evaluateVehicleSurfaces(cage, 2);

const W = 1100;
const H = 760;
const color = new Uint8Array(W * H * 3);
const depth = new Float32Array(W * H).fill(Infinity);
for (let i = 0; i < W * H; i += 1) { color[i * 3] = 24; color[i * 3 + 1] = 32; color[i * 3 + 2] = 38; }

const L = frame.L;
const target = new THREE.Vector3(0, frame.H * 0.5, 0);
const views: Record<string, { dir: [number, number, number]; dist: number; fov: number; target?: [number, number, number] }> = {
  front34: { dir: [-0.62, 0.34, 0.7], dist: L * 1.6, fov: 34 },
  rear34: { dir: [0.66, 0.3, 0.7], dist: L * 1.6, fov: 34 },
  side: { dir: [0, 0.02, 1], dist: L * 2.2, fov: 30 },
  top: { dir: [0.001, 1, 0], dist: L * 2.0, fov: 30 },
  rear: { dir: [1, 0.12, 0.0001], dist: L * 2.0, fov: 30 },
  front: { dir: [-1, 0.12, 0.0001], dist: L * 2.0, fov: 30 },
  archside: { dir: [-0.15, 0.12, 1], dist: L * 0.55, fov: 34, target: [frame.arches[0].x, frame.H * 0.42, 0] },
  rearside: { dir: [0.25, 0.15, 1], dist: L * 0.6, fov: 34, target: [frame.arches[1].x + 0.2, frame.H * 0.55, 0] },
  under: { dir: [-0.35, -0.55, 0.75], dist: L * 1.3, fov: 34 },
  rearclose: { dir: [0.8, 0.45, 0.62], dist: L * 0.8, fov: 34, target: [L * 0.36, frame.H * 0.6, 0] },
  rearlow: { dir: [0.7, 0.12, 0.7], dist: L * 0.8, fov: 34, target: [L * 0.36, frame.H * 0.45, 0] },
  cowl: { dir: [-0.5, 0.55, 0.65], dist: L * 0.6, fov: 34, target: [-L * 0.22, frame.H * 0.6, 0] },
  cowlside: { dir: [-0.9, 0.2, 0.45], dist: L * 0.55, fov: 34, target: [-L * 0.2, frame.H * 0.62, 0] },
};
const v = views[view];
const cam = new THREE.PerspectiveCamera(v.fov, W / H, 0.05, 100);
const t = v.target ? new THREE.Vector3(...v.target) : target;
cam.position.copy(t).addScaledVector(new THREE.Vector3(...v.dir).normalize(), v.dist);
cam.up.set(0, 1, 0);
if (view === "top") cam.up.set(1, 0, 0);
cam.lookAt(t);
cam.updateMatrixWorld();
cam.updateProjectionMatrix();
const light = new THREE.Vector3(-0.4, 0.8, 0.5).normalize();
const light2 = new THREE.Vector3(0.6, 0.35, -0.5).normalize();

function project(p: THREE.Vector3) {
  const q = p.clone().project(cam);
  return { x: (q.x * 0.5 + 0.5) * W, y: (1 - (q.y * 0.5 + 0.5)) * H, z: q.z };
}

function draw(mesh: PatchMesh, base: [number, number, number], glass = false, wire = true) {
  const normals = computePatchNormals(mesh);
  const pts = mesh.vertices.map((p) => new THREE.Vector3(...p));
  const proj = pts.map(project);
  const tri = (a: number, b: number, c: number) => {
    const A = proj[a], B = proj[b], C = proj[c];
    const minX = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x)));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(A.x, B.x, C.x)));
    const minY = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y)));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(A.y, B.y, C.y)));
    const area = (B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y);
    if (Math.abs(area) < 1e-9) return;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((B.x - px) * (C.y - py) - (C.x - px) * (B.y - py)) / area;
        const w1 = ((C.x - px) * (A.y - py) - (A.x - px) * (C.y - py)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * A.z + w1 * B.z + w2 * C.z;
        const idx = y * W + x;
        if (z >= depth[idx]) continue;
        depth[idx] = z;
        const n = normals[a].clone().multiplyScalar(w0).addScaledVector(normals[b], w1).addScaledVector(normals[c], w2).normalize();
        const view = cam.position.clone().sub(pts[a]).normalize();
        if (n.dot(view) < 0) n.negate();
        const d1 = Math.max(0, n.dot(light));
        const d2 = Math.max(0, n.dot(light2));
        const spec = Math.pow(Math.max(0, n.dot(light.clone().add(view).normalize())), 40) * (glass ? 0.9 : 0.25);
        const shade = 0.22 + 0.72 * d1 + 0.25 * d2;
        for (let ch = 0; ch < 3; ch += 1) color[idx * 3 + ch] = Math.min(255, base[ch] * shade + spec * 255);
      }
    }
  };
  mesh.faces.forEach((face) => { for (let i = 1; i < face.length - 1; i += 1) tri(face[0], face[i], face[i + 1]); });
  if (!wire) return;
  // faint quad edges, depth-tested with a small bias
  const line = (a: number, b: number) => {
    const A = proj[a], B = proj[b];
    const steps = Math.ceil(Math.hypot(B.x - A.x, B.y - A.y));
    for (let s = 0; s <= steps; s += 1) {
      const f = steps ? s / steps : 0;
      const x = Math.round(A.x + (B.x - A.x) * f), y = Math.round(A.y + (B.y - A.y) * f);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const z = A.z + (B.z - A.z) * f;
      const idx = y * W + x;
      if (z > depth[idx] + 2e-5) continue;
      for (let ch = 0; ch < 3; ch += 1) color[idx * 3 + ch] = color[idx * 3 + ch] * (cageMode ? 0.3 : 0.72);
    }
  };
  mesh.faces.forEach((face) => face.forEach((a, i) => line(a, face[(i + 1) % face.length])));
}

if (cageMode) {
  // control cage: flat quads with dark edges
  draw({ vertices: cage.vertices, faces: cage.faces }, [235, 205, 170]);
  draw({ vertices: cage.vertices, faces: [...cage.sideGlass, ...cage.windshield, ...cage.rearGlass] }, [70, 100, 120]);
} else {
  draw(surfaces.body, [226, 226, 218]);
  draw(surfaces.sideGlass, [40, 70, 90], true, false);
  draw(surfaces.windshield, [40, 70, 90], true, false);
  draw(surfaces.rearGlass, [40, 70, 90], true, false);
}

// grille panel, texture bars and lower intake (approximate projection onto nearby vertices)
if (!cageMode) {
  const frontVerts = surfaces.body.vertices.filter((v) => v[0] < -frame.L / 2 + 0.35);
  const projectX = (pool: number[][], z: number, y: number) => {
    let best = Infinity, x = -frame.L / 2;
    for (const v of pool) { const d = (v[1] - y) ** 2 + (v[2] - z) ** 2; if (d < best) { best = d; x = v[0]; } }
    return x;
  };
  const bars = (shape: GrilleShape, pool: number[][], lift: number, scale: number) => {
    const quads: PatchMesh = { vertices: [], faces: [] };
    const pattern = config.grillePattern === "closed" ? "horizontal" : config.grillePattern;
    for (const [[z0, y0], [z1, y1]] of grillePatternSegments(pattern, shape, scale)) {
      const len = Math.hypot(z1 - z0, y1 - y0) || 1; const oz = ((y1 - y0) / len) * 0.004; const oy = (-(z1 - z0) / len) * 0.004;
      const x0 = projectX(pool, z0, y0) - lift, x1 = projectX(pool, z1, y1) - lift;
      const b = quads.vertices.length;
      quads.vertices.push([x0, y0 + oy, z0 + oz], [x0, y0 - oy, z0 - oz], [x1, y1 - oy, z1 - oz], [x1, y1 + oy, z1 + oz]);
      quads.faces.push([b, b + 1, b + 2, b + 3]);
    }
    draw(quads, [170, 176, 174], false, false);
  };
  if (config.hasGrille && cage.grille.faces.length) {
    const panel = subdivide(cage.grille.vertices, cage.grille.faces, [], 2);
    draw(panel, [26, 30, 32], false, false);
    bars(frame.grille, panel.vertices, 0.01, 1);
  }
  // real detail geometry (door gaps, lamps, trims, lower intake) as built for the app
  const details = buildVehicleDetails(config, patchToGeometry(surfaces.body));
  const toPatch = (g: THREE.BufferGeometry): PatchMesh => {
    const pos = g.getAttribute("position");
    const idx = g.getIndex();
    const vertices: Point3D[] = [];
    if (!pos) return { vertices, faces: [] };
    for (let i = 0; i < pos.count; i += 1) vertices.push([pos.getX(i), pos.getY(i), pos.getZ(i)]);
    const faces: number[][] = [];
    if (idx) for (let i = 0; i + 2 < idx.count; i += 3) faces.push([idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)]);
    return { vertices, faces };
  };
  draw(toPatch(details.lowerGrillePanel), [18, 22, 24], false, false);
  draw(toPatch(details.lowerGrilleBars), [150, 156, 154], false, false);
  draw(toPatch(details.lowerGrilleFrame), [40, 46, 50], false, false);
  draw(toPatch(details.darkTrim), [34, 40, 41], false, false);
  draw(toPatch(details.blackout), [12, 16, 18], true, false);
  draw(toPatch(details.chrome), [235, 240, 238], true, false);
  draw(toPatch(details.frontLamps), [40, 60, 68], true, false);
  draw(toPatch(details.rearLamps), [150, 30, 26], false, false);
  draw(toPatch(details.gaps), [8, 10, 11], false, false);
}

type Point3D = [number, number, number];
// wheels (simple discs) for orientation
const wheelR = config.tireDiameter / 2000;
const lateral = frame.halfWidthAt(0.5) * 0.9;
for (const arch of frame.arches) {
  for (const side of [-1, 1]) {
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i < 24; i += 1) {
      const a = (i / 24) * Math.PI * 2;
      pts.push([arch.x + Math.cos(a) * wheelR, arch.cy + Math.sin(a) * wheelR, side * lateral]);
    }
    const mesh: PatchMesh = { vertices: [[arch.x, arch.cy, side * lateral], ...pts], faces: pts.map((_, i) => [0, 1 + i, 1 + ((i + 1) % 24)]) };
    draw(mesh, [20, 20, 22], false, false);
  }
}

// PNG encode
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y += 1) {
  raw[y * (W * 3 + 1)] = 0;
  Buffer.from(color.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
}
const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf: Buffer) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, c]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
console.log("wrote", out);
