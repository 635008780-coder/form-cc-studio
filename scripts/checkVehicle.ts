import { strict as assert } from "node:assert";
import * as THREE from "three";
import { conceptTemplates, createTemplateConfig } from "../src/conceptLibrary";
import { analyzeControlMesh } from "../src/topologyCheck";
import { buildVehicleDetails } from "../src/vehicleDetails";
import { createQuadSurfaceObj } from "../src/quadExport";
import { buildControlMesh, computePatchNormals, evaluateBody, evaluateVehicleSurfaces, getMinimumBodyHeight, getTireSpecification, getVehicleFrame, getWheelHousingLimits, getWheelPositions, patchToGeometry, RING_COUNT, type PatchMesh, type VehicleConfig } from "../src/vehicleModel";

function pointKey(point: number[]) {
  return point.map((value) => value.toFixed(8)).join("/");
}

function boundaryPoints(mesh: PatchMesh) {
  const edges = new Map<string, { a: number; b: number; count: number }>();
  mesh.faces.forEach((face) => face.forEach((a, index) => {
    const b = face[(index + 1) % face.length];
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const edge = edges.get(key) ?? { a, b, count: 0 };
    edge.count += 1;
    edges.set(key, edge);
  }));
  const points = new Set<string>();
  edges.forEach(({ a, b, count }) => {
    if (count !== 1) return;
    points.add(pointKey(mesh.vertices[a]));
    points.add(pointKey(mesh.vertices[b]));
  });
  return points;
}

function checkMesh(label: string, config: VehicleConfig) {
  const mesh = buildControlMesh(config);
  const report = analyzeControlMesh(mesh);
  assert.equal(report.otherFaces, 0, `${label}: expected only quads`);
  assert.equal(report.bodyComponents, 1, `${label}: expected one connected body`);
  assert.equal(report.nonManifoldEdges, 0, `${label}: non-manifold edges`);
  assert.equal(report.inconsistentEdges, 0, `${label}: inconsistent winding`);
  assert.equal(report.collapsedFaces, 0, `${label}: collapsed faces`);
  assert.equal(report.overlappingPoints, 0, `${label}: overlapping control points`);
  assert.ok(mesh.sideGlass.length > 0 && mesh.windshield.length > 0 && mesh.rearGlass.length > 0, `${label}: missing glazing`);
  assert.equal(mesh.grille.faces.length > 0, config.hasGrille, `${label}: grille toggle must change topology`);
  assert.equal(mesh.grilleOpening.length, config.hasGrille ? RING_COUNT : 0, `${label}: grille border is missing`);
  assert.ok(mesh.grille.faces.every((face) => face.length === 4), `${label}: grille is not quad-based`);
  if (!config.hasGrille) {
    const grid = mesh.frontPanelGrid;
    assert.equal(grid.length, 7, `${label}: expected seven regular front columns`);
    assert.ok(grid.every((column) => column.length === 6), `${label}: expected six regular front rows`);
    const sideWidth = mesh.vertices[grid[6][1]][2] - mesh.vertices[grid[0][1]][2];
    const height = mesh.vertices[grid[1][5]][1] - mesh.vertices[grid[1][0]][1];
    for (let u = 0; u < 7; u += 1) {
      for (let v = 0; v < 6; v += 1) {
        const point = mesh.vertices[grid[u][v]];
        const expectedZ = mesh.vertices[grid[0][v]][2] + sideWidth * u / 6;
        const expectedY = mesh.vertices[grid[u][0]][1] + height * v / 5;
        assert.ok(Math.abs(point[2] - expectedZ) < 0.00001, `${label}: front vertical guide is crooked`);
        assert.ok(Math.abs(point[1] - expectedY) < 0.00001, `${label}: front horizontal guide is crooked`);
        if (u > 0 && u < 6 && v > 0 && v < 5) {
          const sideX = (mesh.vertices[grid[0][v]][0] + mesh.vertices[grid[6][v]][0]) / 2;
          assert.ok(point[0] <= sideX + 0.003, `${label}: front panel is concave`);
        }
      }
    }
  } else {
    assert.equal(mesh.frontPanelGrid.length, 0, `${label}: grille template retained a sealed panel grid`);
  }
  assert.ok(mesh.vertices.every((point) => point.every(Number.isFinite)), `${label}: non-finite control point`);
  const surface = evaluateBody(mesh, 2);
  assert.ok(surface.vertices.every((point) => point.every(Number.isFinite)), `${label}: non-finite surface point`);
  const materials = evaluateVehicleSurfaces(mesh, 2);
  const bodyBoundary = boundaryPoints(materials.body);
  for (const patch of [materials.sideGlass, materials.windshield, materials.rearGlass]) {
    assert.ok([...boundaryPoints(patch)].every((point) => bodyBoundary.has(point)), `${label}: floating glass seam`);
  }
  const rearNormals = computePatchNormals(materials.rearGlass);
  const rearNormalX = rearNormals.reduce((sum, normal) => sum + normal.x, 0) / rearNormals.length;
  // Mid-engine fastbacks carry a flatter rear window than three-box sedans.
  const rearGlassMin = config.type === "sedan" ? 0.3 : 0.5;
  assert.ok(rearNormalX > rearGlassMin, `${label}: rear glass points toward sky (${rearNormalX.toFixed(2)})`);
  const roofHeight = getVehicleFrame(config).H;
  assert.ok(materials.rearGlass.vertices.every((point) => point[1] < roofHeight + 0.001), `${label}: backlight rises above roof`);
  const counts = new Map<string, number>();
  surface.faces.forEach((face) => face.forEach((a, index) => {
    const b = face[(index + 1) % face.length];
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }));
  const openingVertices = new Set<number>();
  counts.forEach((count, key) => {
    if (count !== 1) return;
    key.split("_").forEach((index) => openingVertices.add(Number(index)));
  });
  for (const arch of mesh.wheelArches) {
    const radii = [...openingVertices].map((index) => surface.vertices[index]).filter((point) => {
      const radius = Math.hypot(point[0] - arch.x, point[1] - arch.cy);
      return Math.abs(point[2]) > arch.zMin && point[1] >= arch.cy + 0.02 && Math.abs(radius - arch.r) < 0.025;
    }).map((point) => Math.hypot(point[0] - arch.x, point[1] - arch.cy));
    assert.ok(radii.length >= 10, `${label}: incomplete wheel opening`);
    assert.ok(radii.every((radius) => Math.abs(radius - arch.r) < 0.0005), `${label}: wheel arch opening is not circular`);
    assert.ok(arch.r * 1000 - config.tireDiameter / 2 >= config.archClearance - 0.1, `${label}: insufficient tire clearance`);
  }
  return { mesh, report };
}

for (const template of conceptTemplates) {
  const base = createTemplateConfig(template);
  const compact = checkMesh(`${template.id}/compact`, { ...base, cageDensity: "compact" });
  const balanced = checkMesh(`${template.id}/balanced`, { ...base, cageDensity: "balanced" });
  const detailed = checkMesh(`${template.id}/detailed`, { ...base, cageDensity: "detailed" });
  assert.ok(compact.mesh.vertices.length < balanced.mesh.vertices.length, `${template.id}: compact should reduce points`);
  assert.ok(balanced.mesh.vertices.length < detailed.mesh.vertices.length, `${template.id}: detailed should increase points`);
  assert.equal(base.length, base.frontAxleFromFront + base.wheelbase + base.rearAxleFromTail);
  assert.equal(base.tireDiameter, getTireSpecification(base).diameter);
  const housing = getWheelHousingLimits(base);
  assert.ok(housing.feasible && housing.minOverhang <= Math.min(base.frontAxleFromFront, base.rearAxleFromTail), `${template.id}: wheel housing overlaps a bumper`);
  const featureNames = new Set(balanced.mesh.creases.map((crease) => crease.feature));
  assert.ok(featureNames.has("glass-opening"), `${template.id}: missing glass boundary creases`);
  assert.ok(featureNames.has("wheel-arch-opening"), `${template.id}: missing wheel opening creases`);
  const opposite = checkMesh(`${template.id}/other-grille`, { ...base, hasGrille: !base.hasGrille });
  assert.notEqual(opposite.mesh.faces.length, balanced.mesh.faces.length, `${template.id}: grille toggle must change body faces`);
  const closed = base.hasGrille ? opposite.mesh : balanced.mesh;
  const closedFrame = getVehicleFrame({ ...base, hasGrille: false });
  const panel = closed.frontPanelGrid;
  const frontGeometry = patchToGeometry(evaluateBody(closed, 2));
  const frontMesh = new THREE.Mesh(frontGeometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  frontMesh.updateMatrixWorld();
  const panelY = closed.vertices[panel[3][2]][1];
  const panelWidth = Math.abs(closed.vertices[panel[6][2]][2]);
  const frontHitX = (z: number) => new THREE.Raycaster(
    new THREE.Vector3(-closedFrame.L, panelY, z), new THREE.Vector3(1, 0, 0),
  ).intersectObject(frontMesh)[0]?.point.x;
  const centerX = frontHitX(0);
  const outerX = frontHitX(panelWidth * 0.65);
  // Full (squarer) plan-view front: centre must still lead, but need not be pointed.
  assert.ok(centerX !== undefined && outerX !== undefined && centerX < outerX - 0.004,
    `${template.id}: smoothed closed front is sunken or not convex`);
  frontGeometry.dispose();
  (frontMesh.material as THREE.Material).dispose();

  const frontArch = closedFrame.arches[0];
  const fenderPatch = evaluateBody(closed, 2);
  const edgeNormals = new Map<string, THREE.Vector3>();
  let worstNormalDot = 1;
  fenderPatch.faces.forEach((face) => {
    const points = face.map((index) => new THREE.Vector3(...fenderPatch.vertices[index]));
    const center = points.reduce((total, point) => total.add(point), new THREE.Vector3()).multiplyScalar(0.25);
    if (Math.abs(center.x - frontArch.x) > frontArch.lipR + 0.2
      || center.y < frontArch.cy + frontArch.r * 0.42 || center.z < closedFrame.W * 0.25) return;
    const normal = new THREE.Vector3().subVectors(points[1], points[0])
      .cross(new THREE.Vector3().subVectors(points[2], points[0])).normalize();
    face.forEach((vertex, index) => {
      const next = face[(index + 1) % face.length];
      const key = vertex < next ? `${vertex}_${next}` : `${next}_${vertex}`;
      const previous = edgeNormals.get(key);
      if (previous) worstNormalDot = Math.min(worstNormalDot, previous.dot(normal));
      else edgeNormals.set(key, normal);
    });
  });
  assert.ok(worstNormalDot > 0.08, `${template.id}: front fender surface folds at a shared edge (${worstNormalDot.toFixed(2)})`);
  const frontCreases = new Set(opposite.mesh.creases.map((crease) => crease.feature));
  if (!base.hasGrille) assert.ok(frontCreases.has("grille-opening"), `${template.id}: expected opening creases in grille variant`);
  else assert.ok(!frontCreases.has("grille-opening"), `${template.id}: closed front should have no opening crease`);
  const frame = getVehicleFrame(base);
  const middleHood = (frame.hoodFrontS + frame.hoodEndS) / 2;
  const hoodStation = balanced.mesh.sections.reduce((best, station) => Math.abs(station - middleHood) < Math.abs(best - middleHood) ? station : best);
  const centerHood = balanced.mesh.vertices.filter((point) =>
    Math.abs(point[0] - frame.xAt(hoodStation)) < 0.02 && Math.abs(point[2]) < 0.00001,
  ).sort((a, b) => b[1] - a[1])[0];
  assert.ok(centerHood && centerHood[1] > frame.topAt(hoodStation) + 0.019, `${template.id}: hood centre is not crowned`);
  const waistRatio = frame.beltAt((frame.roofFrontS + frame.roofRearS) / 2) / frame.H;
  const waistRanges: Record<VehicleConfig["type"], [number, number]> = {
    sedan: [0.62, 0.74], suv: [0.64, 0.77], mpv: [0.53, 0.67], micro: [0.55, 0.70],
  };
  const waistRange = waistRanges[base.type];
  assert.ok(waistRatio >= waistRange[0] && waistRatio <= waistRange[1], `${template.id}: unrealistic baseline waist ratio ${waistRatio.toFixed(2)}`);
  const stationGaps = balanced.mesh.sections.slice(1).map((station, index) =>
    (station - balanced.mesh.sections[index]) * frame.Lb,
  );
  assert.ok(Math.max(...stationGaps) < 0.28, `${template.id}: uneven longitudinal spacing`);
  const gapFromTire = frame.arches[0].r * 1000 - base.tireDiameter / 2;
  assert.ok(gapFromTire >= base.archClearance - 0.1, `${template.id}: wheel/tire clearance`);
  // Sculpted-fender styles clear the arch with the fender crown instead of the bonnet line.
  assert.ok(frame.topAt(frame.arches[0].s) + frame.fenderPeakAt(frame.arches[0].s) > frame.arches[0].cy + frame.arches[0].lipR + 0.06, `${template.id}: front wheel arch exceeds hood`);
  if (base.type !== "sedan") {
    assert.ok(frame.rearGlassBottom < frame.H * 0.79, `${template.id}: backlight lower edge is too high`);
    assert.ok(frame.topAt(frame.roofRearS) - frame.rearGlassBottom > 0.28, `${template.id}: hatch glass is nearly horizontal`);
    assert.ok((1 - frame.rearGlassS) * frame.Lb < 0.2, `${template.id}: unexpected trunk platform`);
    assert.ok(frame.tailTop <= frame.rearGlassBottom + 1e-6, `${template.id}: tailgate must not rise above the backlight`);
    let previous = frame.topAt(frame.roofRearS);
    for (let step = 1; step <= 100; step += 1) {
      const y = frame.topAt(frame.roofRearS + (1 - frame.roofRearS) * step / 100);
      assert.ok(y <= previous + 0.0001, `${template.id}: upturned hatch profile`);
      previous = y;
    }
  }
  const quadObj = createQuadSurfaceObj(balanced.mesh);
  assert.ok(quadObj.includes("o BODY_SHELL") && quadObj.includes("o WINDSHIELD"), `${template.id}: quad export missing surfaces`);
  assert.equal(quadObj.includes("o GRILLE"), base.hasGrille, `${template.id}: quad export grille mismatch`);
  assert.ok(quadObj.split("\n").filter((line) => line.startsWith("f ")).every((line) => line.trim().split(/\s+/).length === 5), `${template.id}: quad export contains triangles`);
  console.log(`${template.id}: ${compact.mesh.vertices.length}/${balanced.mesh.vertices.length}/${detailed.mesh.vertices.length} points; minimum edge ${balanced.report.shortestEdgeMm.toFixed(1)} mm`);
}

const base = createTemplateConfig(conceptTemplates[0]);
const baseFrame = getVehicleFrame(base);
assert.notEqual(getVehicleFrame({ ...base, roofEndPercent: 78 }).roofRearS, baseFrame.roofRearS);
assert.notEqual(getVehicleFrame({ ...base, beltlineSlope: 120 }).beltAt(0.78), baseFrame.beltAt(0.78));
assert.notEqual(getVehicleFrame({ ...base, doorSplitPercent: 66 }).glass.pillars[0], baseFrame.glass.pillars[0]);
const shortWindow = buildControlMesh({ ...base, windowHeightPercent: 55 });
const tallWindow = buildControlMesh({ ...base, windowHeightPercent: 98 });
assert.ok(shortWindow.vertices.some((point, index) => Math.abs(point[1] - tallWindow.vertices[index][1]) > 0.03), "window height must reshape upper control rows");
assert.notEqual(getVehicleFrame({ ...base, roofWidthPercent: 80 }).style.roofEdge, baseFrame.style.roofEdge);
assert.notEqual(getVehicleFrame({ ...base, groundClearance: 190 }).floor, baseFrame.floor);
assert.notEqual(getVehicleFrame({ ...base, frontHeightOffset: 80 }).nose, baseFrame.nose);
assert.notEqual(getVehicleFrame({ ...base, grilleWidth: 78 }).grille.gw, baseFrame.grille.gw);
assert.notEqual(getVehicleFrame({ ...base, grilleHeight: 12 }).grille.gh, baseFrame.grille.gh);
assert.notEqual(getVehicleFrame({ ...base, archShape: 80 }).arches[0].power, baseFrame.arches[0].power);
assert.notEqual(getVehicleFrame({ ...base, archLipWidth: 95 }).arches[0].lipR, baseFrame.arches[0].lipR);
assert.notEqual(getVehicleFrame({ ...base, archClearance: 90, wheelArch: 230 }).arches[0].r, getVehicleFrame({ ...base, archClearance: 20, wheelArch: 230 }).arches[0].r);
assert.notEqual(getVehicleFrame({ ...base, frontFlare: 80 }).arches[0].flare, baseFrame.arches[0].flare);
assert.notEqual(getWheelPositions({ ...base, frontWheelInset: 70 }).frontLateral, getWheelPositions(base).frontLateral);
const sculptA = buildControlMesh({ ...base, sideSculpt: 0 });
const sculptB = buildControlMesh({ ...base, sideSculpt: 100 });
assert.ok(sculptA.vertices.some((point, index) => Math.abs(point[2] - sculptB.vertices[index][2]) > 0.01), "side sculpt must move cage points");
const bumperA = buildControlMesh({ ...base, bumperDepth: 0 });
const bumperB = buildControlMesh({ ...base, bumperDepth: 60 });
assert.ok(bumperA.vertices.some((point, index) => Math.abs(point[0] - bumperB.vertices[index][0]) > 0.005), "bumper depth must move cage points");
const probe = patchToGeometry(evaluateBody(buildControlMesh(base), 1));
const lampsA = buildVehicleDetails({ ...base, headlampWidth: 60 }, probe);
const lampsB = buildVehicleDetails({ ...base, headlampWidth: 130 }, probe);
const firstLamp = lampsA.frontLamps.getAttribute("position");
const secondLamp = lampsB.frontLamps.getAttribute("position");
assert.ok(firstLamp.count > 0 && secondLamp.count > 0, "headlamp reference surfaces must exist");
assert.notDeepEqual(Array.from(firstLamp.array), Array.from(secondLamp.array), "headlamp width must reshape the reference");
lampsA.dispose();
lampsB.dispose();
probe.dispose();
// Hood: dome raises the centre line, edge drop lowers the fender, front lip lifts.
const hoodBase = buildControlMesh({ ...base, hoodDome: 0, hoodEdgeDrop: 0 });
const hoodShaped = buildControlMesh({ ...base, hoodDome: 60, hoodEdgeDrop: 60 });
assert.equal(hoodBase.vertices.length, hoodShaped.vertices.length, "hood params must not change topology");
const hoodFrame = getVehicleFrame(base);
const centreRise = Math.max(...hoodShaped.vertices.map((point, index) => Math.abs(point[2]) < 1e-6 ? point[1] - hoodBase.vertices[index][1] : 0));
assert.ok(centreRise > 0.04, `hood dome should lift centre line (got ${centreRise})`);
const shapedFrame = getVehicleFrame({ ...base, hoodDome: 60, hoodEdgeDrop: 60 });
const flatFrame = getVehicleFrame({ ...base, hoodDome: 0, hoodEdgeDrop: 0 });
// Edge drop is measured relative to the (globally lifted) hood plane.
const fenderFall = Math.min(...hoodShaped.vertices.map((point, index) => {
  if (Math.abs(point[2]) <= hoodFrame.W * 0.4) return 0;
  const s = hoodFrame.sAtX(point[0]);
  const planeLift = shapedFrame.topAt(s) - flatFrame.topAt(s);
  return point[1] - hoodBase.vertices[index][1] - planeLift;
}));
assert.ok(fenderFall < -0.03, `fender drop should lower outer deck (got ${fenderFall})`);
assert.notEqual(getVehicleFrame({ ...base, hoodWidthPercent: 60 }).hoodW, hoodFrame.hoodW);
assert.notEqual(getVehicleFrame({ ...base, noseLift: 110 }).topAt(hoodFrame.hoodFrontS), hoodFrame.topAt(hoodFrame.hoodFrontS));
assert.notEqual(getVehicleFrame({ ...base, hoodRearDrop: 160 }).topAt(hoodFrame.hoodEndS), hoodFrame.topAt(hoodFrame.hoodEndS));
assert.notEqual(getVehicleFrame({ ...base, tailHeightPercent: 70 }).tailTop, hoodFrame.tailTop);
assert.notEqual(getVehicleFrame({ ...base, rearGlassSpan: 4 }).rearGlassS, hoodFrame.rearGlassS);
assert.notEqual(getVehicleFrame({ ...base, tailDeckPercent: 90 }).tailDeckS, hoodFrame.tailDeckS);
assert.notEqual(getVehicleFrame({ ...base, noseWidthPercent: 72 }).halfWidthAt(0), hoodFrame.halfWidthAt(0));
const hoodCreases = new Set(buildControlMesh(base).creases.map((crease) => crease.feature));
for (const feature of ["hood-edge", "hood-front-edge", "cowl-line"]) assert.ok(hoodCreases.has(feature), `missing ${feature} crease`);

// MPV hood and windshield share a tangent rather than a flat plenum step.
const vanBase = createTemplateConfig(conceptTemplates.find((template) => template.id === "mpv-van") as (typeof conceptTemplates)[number]);
const vanFrame = getVehicleFrame(vanBase);
const epsilon = 0.00001;
const beforeSlope = (vanFrame.topAt(vanFrame.cowlS) - vanFrame.topAt(vanFrame.cowlS - epsilon)) / epsilon;
const afterSlope = (vanFrame.topAt(vanFrame.cowlS + epsilon) - vanFrame.topAt(vanFrame.cowlS)) / epsilon;
assert.ok(Math.abs(beforeSlope - afterSlope) / Math.max(1, beforeSlope) < 0.02, "MPV cowl must have a continuous slope");
assert.ok(beforeSlope / vanFrame.Lb > 0.3, "MPV hood must not flatten before windshield");
for (const joint of [vanFrame.hoodFrontS, vanFrame.cowlS, vanFrame.roofFrontS]) {
  const leftSlope = (vanFrame.topAt(joint) - vanFrame.topAt(joint - epsilon)) / epsilon;
  const rightSlope = (vanFrame.topAt(joint + epsilon) - vanFrame.topAt(joint)) / epsilon;
  assert.ok(Math.abs(leftSlope - rightSlope) / Math.max(1, leftSlope) < 0.06, "MPV front profile has a tangent step");
}
for (const template of conceptTemplates) {
  const origin = createTemplateConfig(template);
  for (const bow of [0, 350]) {
    const mesh = buildControlMesh({ ...origin, frontBow: bow, rearBow: bow });
    const xs = mesh.vertices.map((point) => point[0]);
    const measured = (Math.max(...xs) - Math.min(...xs)) * 1000;
    assert.ok(Math.abs(measured - origin.length) < 1.5, `${template.id}: bow ${bow} changed length to ${measured.toFixed(1)}`);
    const report = analyzeControlMesh(mesh);
    assert.equal(report.inconsistentEdges + report.collapsedFaces + report.nonManifoldEdges, 0, `${template.id}: bow ${bow} broke topology`);
  }
  const flat = buildControlMesh({ ...origin, frontBow: 0, rearBow: 0 });
  const round = buildControlMesh({ ...origin, frontBow: 300, rearBow: 300 });
  const frame = getVehicleFrame({ ...origin, frontBow: 300, rearBow: 300 });
  // Compare the first (front) section ring: tail station counts may differ with rearBow.
  const cornerShift = Math.max(...round.vertices.slice(0, RING_COUNT).map((point, index) => Math.abs(point[0] - flat.vertices[index][0])));
  assert.ok(cornerShift > Math.min(0.25, frame.frontBow * 0.9) - 0.01, `${template.id}: bow should move corners (got ${cornerShift})`);
}
// Segment separation: the crossover sits clearly above the sedan.
const sedan = createTemplateConfig(conceptTemplates.find((template) => template.id === "sedan-classic")!);
const suv = createTemplateConfig(conceptTemplates.find((template) => template.id === "suv-rounded")!);
assert.ok(suv.height - sedan.height >= 240 && suv.groundClearance - sedan.groundClearance >= 60, "SUV must be clearly taller than the sedan");

// Stress test: every prototype under extreme settings keeps a clean manifold cage.
let stress = 0;
for (const template of conceptTemplates) {
  const origin = createTemplateConfig(template);
  const cases: Array<[string, Partial<VehicleConfig>]> = [
    ["hood-max", { hoodDome: 90, hoodEdgeDrop: 100, hoodWidthPercent: 50, noseLift: 150, hoodRearDrop: 260 }],
    ["hood-min", { hoodDome: 0, hoodEdgeDrop: 0, hoodWidthPercent: 88, noseLift: 0, hoodRearDrop: 20, hoodGlassBlend: 100, frontBow: 350, rearBow: 350 }],
    ["rear-max", { rearGlassSpan: 18, tailDeckPercent: 88, tailHeightPercent: 80, noseWidthPercent: 68, tailWidthPercent: 68 }],
    ["rear-min", { rearGlassSpan: 2, tailDeckPercent: 99, tailHeightPercent: 42, noseWidthPercent: 96, tailWidthPercent: 96 }],
    ["low", { groundClearance: 110, frontBow: 350, rearBow: 0, sideSculpt: 100, frontFlare: 100, rearFlare: 100, archLipWidth: 140, archShape: 100 }],
    ["roof", { height: 2000, beltline: 1380, roofWidthPercent: 90, roofEndPercent: 95 }],
    ["cab", { height: 1250, beltline: 980, roofWidthPercent: 58, roofEndPercent: 62 }],
    ["proportions", { beltlineSlope: 120, windowHeightPercent: 55, doorSplitPercent: 68, rearGlassSpan: 18 }],
  ];
  for (const [name, patch] of cases) {
    const config = { ...origin, ...patch };
    config.tireDiameter = getTireSpecification(config).diameter;
    for (const density of ["compact", "detailed"] as const) {
      const mesh = buildControlMesh({ ...config, cageDensity: density });
      const report = analyzeControlMesh(mesh);
      const label = `${template.id}/${name}/${density}`;
      assert.equal(report.otherFaces, 0, `${label}: non-quad`);
      assert.equal(report.nonManifoldEdges, 0, `${label}: non-manifold`);
      assert.equal(report.inconsistentEdges, 0, `${label}: winding`);
      assert.equal(report.collapsedFaces, 0, `${label}: collapsed`);
      assert.equal(report.bodyComponents, 1, `${label}: split body`);
      assert.ok(mesh.vertices.every((point) => point.every(Number.isFinite)), `${label}: NaN`);
      const frame = getVehicleFrame(config);
      assert.ok(frame.topAt(frame.arches[0].s) + frame.fenderPeakAt(frame.arches[0].s) > frame.arches[0].cy + frame.arches[0].lipR + 0.055, `${label}: front arch exceeds hood`);
      assert.ok(frame.H * 1000 >= getMinimumBodyHeight(config), `${label}: body too low for tire and arch`);
      stress += 1;
    }
  }
}
console.log(`Stress cases passed: ${stress}`);
console.log("Parametric deformation checks passed.");