import * as THREE from "three";
import {
  addBoundaryFlange,
  controlFacesGeometry,
  controlPointsGeometry,
  creaseLinesGeometry,
  evaluateBody,
  evaluateVehicleSurfaces,
  getVehicleFrame,
  grilleHalfWidth,
  grillePatternSegments,
  makeWheelArchCurve,
  patchEdgesGeometry,
  patchToGeometry,
  subdivide,
  type ControlMesh,
  type PatchMesh,
  type VehicleConfig,
} from "./vehicleModel";
import { buildVehicleDetails } from "./vehicleDetails";

/** Geometry with an (empty) position attribute: always safe to read and to render. */
export function emptyGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
  return geometry;
}

export function makeGrillePatternGeometry(config: VehicleConfig, grilleSurface: THREE.BufferGeometry) {
  const geometry = new THREE.BufferGeometry();
  if (!config.hasGrille) {
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    return geometry;
  }
  const positions: number[] = [];
  const frame = getVehicleFrame(config);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const target = new THREE.Mesh(grilleSurface, material);
  target.updateMatrixWorld();
  const raycaster = new THREE.Raycaster();
  const xAt = (z: number, y: number) => {
    raycaster.set(new THREE.Vector3(-frame.L, y, z), new THREE.Vector3(1, 0, 0));
    const hit = raycaster.intersectObject(target, false)[0];
    return hit ? hit.point.x - 0.004 : null;
  };
  const pattern = config.grillePattern === "closed" ? "horizontal" : config.grillePattern;
  for (const [[z0, y0], [z1, y1]] of grillePatternSegments(pattern, frame.grille)) {
    const x0 = xAt(z0, y0);
    const x1 = xAt(z1, y1);
    if (x0 !== null && x1 !== null) positions.push(x0, y0, z0, x1, y1, z1);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  material.dispose();
  return geometry;
}

/** Flat bars for each pattern segment, oriented perpendicular to the segment in the face plane. */
export function makeGrilleRibGeometry(lines: THREE.BufferGeometry, pattern: VehicleConfig["grillePattern"]) {
  const position = lines.getAttribute("position");
  const vertices: number[] = [];
  const indices: number[] = [];
  if (!position) return emptyGeometry();
  const half = pattern === "horizontal" ? 0.008 : pattern === "vertical" ? 0.006 : pattern === "mesh" ? 0.0035 : 0.003;
  for (let index = 0; index + 1 < position.count; index += 2) {
    const a = new THREE.Vector3().fromBufferAttribute(position, index);
    const b = new THREE.Vector3().fromBufferAttribute(position, index + 1);
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const length = Math.hypot(dy, dz) || 1;
    const oy = (-dz / length) * half;
    const oz = (dy / length) * half;
    const base = vertices.length / 3;
    for (const point of [a, b]) {
      vertices.push(point.x - 0.009, point.y + oy, point.z + oz);
      vertices.push(point.x - 0.009, point.y - oy, point.z - oz);
    }
    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Bezel path along the real (subdivided) opening edge, not the control ring. */
export function grilleBoundaryCurve(config: VehicleConfig, body: PatchMesh) {
  if (!config.hasGrille) return null;
  const frame = getVehicleFrame(config);
  const shape = frame.grille;
  const counts = new Map<string, number>();
  body.faces.forEach((face) => face.forEach((a, k) => {
    const b = face[(k + 1) % face.length];
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }));
  const picked = new Set<number>();
  counts.forEach((count, key) => {
    if (count !== 1) return;
    key.split("_").forEach((text) => {
      const index = Number(text);
      const [x, y, z] = body.vertices[index];
      if (x > -frame.L / 2 + 0.3) return;
      const yn = (y - shape.gc) / shape.gh;
      if (Math.abs(yn) > 1.35) return;
      const width = Math.max(0.02, grilleHalfWidth(shape, Math.max(-1, Math.min(1, yn))));
      if (Math.abs(z) > width * 1.35 + 0.03) return;
      picked.add(index);
    });
  });
  if (picked.size < 12) return null;
  const points = [...picked]
    .map((index) => body.vertices[index])
    .map((point) => ({ point, angle: Math.atan2((point[1] - shape.gc) / shape.gh, point[2] / Math.max(0.05, shape.gw)) }))
    .sort((a, b) => a.angle - b.angle)
    .map(({ point }) => new THREE.Vector3(point[0] - 0.004, point[1], point[2]));
  return new THREE.CatmullRomCurve3(points, true, "centripetal", 0.5);
}

/**
 * All renderable assets of one vehicle state. Pure (no React), so it is exercised by the
 * node regression script for both the interactive draft and the full-quality path.
 */
export function buildVehicleAssets(config: VehicleConfig, cage: ControlMesh, draft = false) {
  const level1 = evaluateBody(cage, 1);
  // Draft (interactive) quality: one subdivision level, trims and grille texture skipped.
  const surfaces = evaluateVehicleSurfaces(cage, draft ? 1 : 2);
  const level2 = surfaces.body;
  const glassFaces = [...cage.sideGlass, ...cage.windshield, ...cage.rearGlass];
  const grillePatch = cage.grille.faces.length
    ? subdivide(cage.grille.vertices, cage.grille.faces, [], 2)
    : { vertices: [], faces: [] };
  const grilleGeometry = cage.grille.faces.length ? patchToGeometry(grillePatch) : emptyGeometry();
  const grillePattern = draft ? emptyGeometry() : makeGrillePatternGeometry(config, grilleGeometry);
  const bodyGeometry = patchToGeometry(level2);
  const result = {
    cage,
    body: bodyGeometry,
    flange: draft ? emptyGeometry() : patchToGeometry(addBoundaryFlange(level2, 0.026, false)),
    surfaceLines: patchEdgesGeometry(level1.vertices, level1.faces),
    sideGlass: patchToGeometry(surfaces.sideGlass),
    windshield: patchToGeometry(surfaces.windshield),
    rearGlass: patchToGeometry(surfaces.rearGlass),
    grille: grilleGeometry,
    grilleBezel: draft ? null : grilleBoundaryCurve(config, level2),
    grillePattern,
    grilleRibs: makeGrilleRibGeometry(grillePattern, config.grillePattern),
    cageLines: patchEdgesGeometry(cage.vertices, [...cage.faces, ...glassFaces]),
    grilleCage: patchEdgesGeometry(cage.grille.vertices, cage.grille.faces),
    boxBody: controlFacesGeometry(cage.vertices, cage.faces),
    boxGlass: controlFacesGeometry(cage.vertices, glassFaces),
    boxGrille: controlFacesGeometry(cage.grille.vertices, cage.grille.faces),
    points: controlPointsGeometry(cage.vertices),
    creases: creaseLinesGeometry(cage),
    // Draft keeps the same shape of data (empty trims) so the scene never sees null.
    details: buildVehicleDetails(config, bodyGeometry, draft),
    archCurves: (["front", "rear"] as const).flatMap((axle) =>
      ([1, -1] as const).map((side) => makeWheelArchCurve(config, axle, side)),
    ),
  };
  return result;
}

export type VehicleAssets = ReturnType<typeof buildVehicleAssets>;
