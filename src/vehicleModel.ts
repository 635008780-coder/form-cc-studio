import * as THREE from "three";

export type VehicleType = "sedan" | "suv" | "mpv" | "micro";
export type TireStyle = "road" | "allTerrain";
export type CageDensity = "compact" | "balanced" | "detailed";
export type GrillePattern = "horizontal" | "vertical" | "mesh" | "honeycomb" | "diamond" | "closed";
export type HeadlampStyle = "wide" | "round";
export type Point3 = [number, number, number];

export interface VehicleConfig {
  type: VehicleType;
  templateId: string;
  cageDensity: CageDensity;
  length: number;
  width: number;
  height: number;
  wheelbase: number;
  wheelDiameterInches: number;
  tireDiameter: number;
  tireStyle: TireStyle;
  wheelArch: number;
  archClearance: number;
  frontAxleFromFront: number;
  rearAxleFromTail: number;
  windshieldAngle: number;
  windshieldPosition: number;
  hoodShape: number;
  beltline: number;
  beltlineSlope: number;
  windowHeightPercent: number;
  doorSplitPercent: number;
  sideTrend: number;
  surfaceHardness: number;
  groundClearance: number;
  roofEndPercent: number;
  roofWidthPercent: number;
  frontHeightOffset: number;
  rearHeightOffset: number;
  frontFlare: number;
  rearFlare: number;
  archLipWidth: number;
  archShape: number;
  frontWheelInset: number;
  rearWheelInset: number;
  sideSculpt: number;
  hasGrille: boolean;
  grilleWidth: number;
  grilleHeight: number;
  grillePattern: GrillePattern;
  /** vertical offset of the main grille centre, mm */
  grilleOffset: number;
  /** 0 = sharp rectangle, 100 = ellipse */
  grilleRoundness: number;
  /** % : positive = wider at the bottom (trapezoid), negative = wider at the top */
  grilleTaper: number;
  hasLowerGrille: boolean;
  /** fastback roofs: integrated roof spoiler (roof runs on to a lip above the rear window) */
  hasSpoiler: boolean;
  /** % of the front half width */
  lowerGrilleWidth: number;
  /** mm */
  lowerGrilleHeight: number;
  /** % : how much wider the bottom of the lower intake is than its top */
  lowerGrilleTaper: number;
  headlampWidth: number;
  headlampHeight: number;
  bumperDepth: number;
  headlampStyle: HeadlampStyle;
  hoodWidthPercent: number;
  hoodDome: number;
  hoodEdgeDrop: number;
  noseLift: number;
  hoodRearDrop: number;
  hoodGlassBlend: number;
  frontBow: number;
  rearBow: number;
  noseHeightPercent: number;
  tailHeightPercent: number;
  noseWidthPercent: number;
  tailWidthPercent: number;
  rearGlassSpan: number;
  tailDeckPercent: number;
  paintColor: string;
}

export interface Crease {
  a: number;
  b: number;
  weight: number;
  feature: string;
}

export interface PatchMesh {
  vertices: Point3[];
  faces: number[][];
}

export interface ControlMesh {
  vertices: Point3[];
  faces: number[][];
  sections: number[];
  ringCount: number;
  creases: Crease[];
  sideGlass: number[][];
  windshield: number[][];
  rearGlass: number[][];
  grille: PatchMesh;
  grilleOpening: Point3[];
  frontPanelGrid: number[][];
  wheelArches: Array<{ x: number; cy: number; r: number; zMin: number }>;
}

export interface TireSpecification {
  width: number;
  aspectRatio: number;
  rimInches: number;
  diameter: number;
  label: string;
}

/** Number of control points around one body section (11 per side, mirrored). */
export const RING_COUNT = 22;
const HALF = RING_COUNT / 2;

export const vehicleNames: Record<VehicleType, string> = {
  sedan: "轿车",
  suv: "SUV",
  mpv: "MPV",
  micro: "微型车",
};

// Base proportions follow typical published overall dimensions of each market segment
// (compact three-box sedan, premium crossover, body-on-frame off-roader, cab-forward van,
// city micro car). All surfaces are original parametric interpretations.
const baseConfig: VehicleConfig = {
  type: "sedan",
  templateId: "sedan-classic",
  cageDensity: "balanced",
  length: 4475,
  width: 1706,
  height: 1469,
  wheelbase: 2603,
  wheelDiameterInches: 15,
  tireDiameter: 603,
  tireStyle: "road",
  wheelArch: 340,
  archClearance: 35,
  frontAxleFromFront: 880,
  rearAxleFromTail: 992,
  windshieldAngle: 60,
  windshieldPosition: 1160,
  hoodShape: 52,
  beltline: 975,
  beltlineSlope: 0,
  windowHeightPercent: 90,
  doorSplitPercent: 50,
  sideTrend: 50,
  surfaceHardness: 48,
  groundClearance: 165,
  roofEndPercent: 70,
  roofWidthPercent: 70,
  frontHeightOffset: 0,
  rearHeightOffset: 0,
  frontFlare: 10,
  rearFlare: 12,
  archLipWidth: 40,
  archShape: 0,
  frontWheelInset: 18,
  rearWheelInset: 18,
  sideSculpt: 30,
  hasGrille: false,
  grilleWidth: 58,
  grilleHeight: 24,
  grillePattern: "horizontal",
  grilleOffset: 0,
  grilleRoundness: 45,
  grilleTaper: 10,
  hasLowerGrille: false,
  hasSpoiler: true,
  lowerGrilleWidth: 70,
  lowerGrilleHeight: 90,
  lowerGrilleTaper: 28,
  headlampWidth: 100,
  headlampHeight: 100,
  bumperDepth: 30,
  headlampStyle: "wide",
  hoodWidthPercent: 76,
  hoodDome: 32,
  hoodEdgeDrop: 22,
  noseLift: 35,
  hoodRearDrop: 70,
  hoodGlassBlend: 0,
  frontBow: 110,
  rearBow: 90,
  noseHeightPercent: 51,
  tailHeightPercent: 63,
  noseWidthPercent: 86,
  tailWidthPercent: 86,
  rearGlassSpan: 12,
  tailDeckPercent: 96,
  paintColor: "#cfd3d1",
};

const makePreset = (overrides: Partial<VehicleConfig>): VehicleConfig => ({ ...baseConfig, ...overrides });

export const vehiclePresets: Record<VehicleType, VehicleConfig> = {
  // Compact three-box sedan
  sedan: makePreset({}),
  // Rounded premium crossover – tall stance, soft wedge body, large wheels
  suv: makePreset({
    type: "suv", templateId: "suv-rounded",
    length: 4800, width: 1930, height: 1730, wheelbase: 2880,
    wheelDiameterInches: 20, tireDiameter: 773, tireStyle: "road", wheelArch: 420, archClearance: 35,
    frontAxleFromFront: 880, rearAxleFromTail: 1040,
    windshieldAngle: 60, windshieldPosition: 1240, hoodShape: 54, beltline: 1110,
    beltlineSlope: 10, windowHeightPercent: 82, doorSplitPercent: 50,
    sideTrend: 62, surfaceHardness: 24, groundClearance: 240,
    roofEndPercent: 87, roofWidthPercent: 72,
    frontFlare: 36, rearFlare: 42, archLipWidth: 70, archShape: 18,
    frontWheelInset: 20, rearWheelInset: 20, sideSculpt: 38,
    hasGrille: false, grilleWidth: 64, grilleHeight: 28, grillePattern: "mesh", grilleRoundness: 30, grilleTaper: 8, lowerGrilleHeight: 110,
    headlampWidth: 100, headlampHeight: 90, bumperDepth: 38,
    hoodWidthPercent: 80, hoodDome: 55, hoodEdgeDrop: 18, noseLift: 50, hoodRearDrop: 60,
    hoodGlassBlend: 10, frontBow: 230, rearBow: 170,
    noseHeightPercent: 57, tailHeightPercent: 72, noseWidthPercent: 80, tailWidthPercent: 89,
    rearGlassSpan: 16, tailDeckPercent: 99, paintColor: "#aebbbd",
  }),
  // Cab-forward van – very short hood flowing straight into the windshield
  mpv: makePreset({
    type: "mpv", templateId: "mpv-van",
    length: 4420, width: 1695, height: 1800, wheelbase: 2720,
    wheelDiameterInches: 14, tireDiameter: 596, tireStyle: "road", wheelArch: 340, archClearance: 35,
    frontAxleFromFront: 790, rearAxleFromTail: 910,
    windshieldAngle: 40, windshieldPosition: 600, hoodShape: 45, beltline: 1060,
    beltlineSlope: 0, windowHeightPercent: 94, doorSplitPercent: 47,
    sideTrend: 40, surfaceHardness: 70, groundClearance: 190,
    roofEndPercent: 91, roofWidthPercent: 92,
    frontFlare: 0, rearFlare: 0, archLipWidth: 28, archShape: 40,
    frontWheelInset: 15, rearWheelInset: 15, sideSculpt: 0,
    hasGrille: false, grilleWidth: 60, grilleHeight: 17, grillePattern: "horizontal", grilleRoundness: 40, grilleTaper: 0, lowerGrilleHeight: 100,
    headlampWidth: 112, headlampHeight: 105, bumperDepth: 12,
    hoodWidthPercent: 82, hoodDome: 14, hoodEdgeDrop: 3, noseLift: 25, hoodRearDrop: 40,
    hoodGlassBlend: 100, frontBow: 90, rearBow: 40,
    noseHeightPercent: 50, tailHeightPercent: 64, noseWidthPercent: 90, tailWidthPercent: 94,
    rearGlassSpan: 2, tailDeckPercent: 99, paintColor: "#d9d8cf",
  }),
  // Cube-shaped city micro car
  micro: makePreset({
    type: "micro", templateId: "micro-cube",
    length: 2920, width: 1493, height: 1621, wheelbase: 1940,
    wheelDiameterInches: 12, tireDiameter: 508, tireStyle: "road", wheelArch: 295, archClearance: 35,
    frontAxleFromFront: 480, rearAxleFromTail: 500,
    windshieldAngle: 42, windshieldPosition: 620, hoodShape: 46, beltline: 960,
    beltlineSlope: 10, windowHeightPercent: 90, doorSplitPercent: 55,
    sideTrend: 45, surfaceHardness: 60, groundClearance: 160,
    roofEndPercent: 87, roofWidthPercent: 88,
    frontFlare: 6, rearFlare: 8, archLipWidth: 28, archShape: 10,
    frontWheelInset: 10, rearWheelInset: 10, sideSculpt: 48,
    hasGrille: false, grilleWidth: 52, grilleHeight: 13, grillePattern: "horizontal", grilleRoundness: 65, grilleTaper: 0, lowerGrilleHeight: 70,
    headlampWidth: 100, headlampHeight: 100, bumperDepth: 18,
    hoodWidthPercent: 84, hoodDome: 12, hoodEdgeDrop: 8, noseLift: 25, hoodRearDrop: 50,
    hoodGlassBlend: 60, frontBow: 140, rearBow: 90,
    noseHeightPercent: 49, tailHeightPercent: 65, noseWidthPercent: 90, tailWidthPercent: 94,
    rearGlassSpan: 4, tailDeckPercent: 99, paintColor: "#79a69a",
  }),
};

type TireTable = Record<number, [number, number]>;
const tireTables: Record<TireStyle, Record<VehicleType, TireTable>> = {
  road: {
    sedan: { 12: [155, 70], 13: [165, 65], 14: [175, 65], 15: [185, 60], 16: [215, 60], 17: [225, 55], 18: [235, 50], 19: [245, 45], 20: [255, 40], 21: [265, 35], 22: [275, 30] },
    suv: { 12: [165, 70], 13: [175, 70], 14: [185, 70], 15: [205, 70], 16: [245, 70], 17: [265, 65], 18: [265, 60], 19: [255, 55], 20: [265, 50], 21: [275, 45], 22: [285, 40] },
    mpv: { 12: [155, 70], 13: [165, 70], 14: [185, 65], 15: [195, 65], 16: [215, 65], 17: [225, 60], 18: [235, 55], 19: [245, 50], 20: [255, 45], 21: [265, 40], 22: [275, 35] },
    micro: { 12: [145, 70], 13: [155, 65], 14: [165, 60], 15: [175, 60], 16: [185, 60], 17: [195, 55], 18: [205, 50], 19: [215, 45], 20: [225, 40], 21: [235, 35], 22: [245, 30] },
  },
  allTerrain: {
    sedan: { 12: [155, 75], 13: [165, 75], 14: [175, 75], 15: [195, 75], 16: [225, 70], 17: [235, 70], 18: [245, 65], 19: [255, 60], 20: [265, 60], 21: [275, 55], 22: [285, 50] },
    suv: { 12: [175, 75], 13: [185, 75], 14: [205, 75], 15: [235, 75], 16: [265, 70], 17: [265, 70], 18: [275, 65], 19: [285, 60], 20: [285, 60], 21: [295, 55], 22: [305, 50] },
    mpv: { 12: [155, 75], 13: [165, 75], 14: [175, 75], 15: [195, 75], 16: [225, 70], 17: [235, 70], 18: [245, 65], 19: [255, 60], 20: [265, 60], 21: [275, 55], 22: [285, 50] },
    micro: { 12: [145, 80], 13: [155, 80], 14: [165, 75], 15: [185, 75], 16: [205, 70], 17: [215, 70], 18: [225, 65], 19: [235, 60], 20: [245, 60], 21: [255, 55], 22: [265, 50] },
  },
};

export const wheelDiameterOptions = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] as const;

export function getTireSpecification(config: Pick<VehicleConfig, "type" | "tireStyle" | "wheelDiameterInches">): TireSpecification {
  const rim = Math.max(12, Math.min(22, Math.round(config.wheelDiameterInches)));
  const [width, aspectRatio] = tireTables[config.tireStyle][config.type][rim];
  const diameter = Math.round(rim * 25.4 + (2 * width * aspectRatio) / 100);
  return {
    width,
    aspectRatio,
    rimInches: rim,
    diameter,
    label: `${width}/${aspectRatio} R${rim}`,
  };
}

export function getMinimumBodyHeight(config: VehicleConfig) {
  const radius = Math.max(config.wheelArch, config.tireDiameter / 2 + config.archClearance);
  return Math.ceil((config.tireDiameter / 2 + radius * 1.07 + config.archLipWidth + 150) / 5) * 5;
}

export function getWheelHousingLimits(config: VehicleConfig) {
  // Use the widest control-cage compensation so changing density cannot make
  // a previously valid wheel housing collide with the front or rear fascia.
  const compensation = 3 / (2 + Math.cos(Math.PI / 4));
  const minArch = Math.ceil((config.tireDiameter / 2 + config.archClearance) / 5) * 5;
  const overhang = Math.min(config.frontAxleFromFront, config.rearAxleFromTail);
  const faceMargin = 70;
  const maxArch = Math.min(600, Math.floor((overhang - faceMargin - 25) / compensation / 5) * 5);
  const maxLip = Math.min(140, Math.floor((overhang - faceMargin - config.wheelArch * compensation) / 5) * 5);
  const minOverhang = Math.ceil(config.wheelArch * compensation + config.archLipWidth + faceMargin);
  return { minArch, maxArch, maxLip, minOverhang, feasible: maxArch >= minArch };
}

/* ------------------------------------------------------------------ */
/* Math helpers                                                        */
/* ------------------------------------------------------------------ */

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function smoothMax(a: number, b: number, softness = 0.008) {
  const difference = a - b;
  return (a + b + Math.sqrt(difference * difference + softness * softness)) / 2;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hermiteSegment(x: number, x0: number, x1: number, y0: number, y1: number, slope0: number, slope1: number) {
  const span = Math.max(1e-6, x1 - x0);
  const t = clamp((x - x0) / span, 0, 1);
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * span * slope0
    + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * span * slope1;
}

function archHalfHeight(distance: number, radius: number, power: number) {
  const ratio = clamp(Math.abs(distance) / radius, 0, 1);
  return radius * Math.pow(Math.max(0, 1 - Math.pow(ratio, power)), 1 / power);
}

function archHorizontal(radius: number, radians: number, power: number) {
  const cosine = Math.cos(radians);
  return radius * Math.sign(cosine) * Math.pow(Math.abs(cosine), 2 / power);
}

/** Monotone cubic (PCHIP) interpolation – never overshoots between keys. */
function monotone(keysIn: Array<[number, number]>) {
  const keys = [...keysIn]
    .sort((a, b) => a[0] - b[0])
    .filter((key, index, list) => index === 0 || key[0] - list[index - 1][0] > 1e-4);
  const xs = keys.map((key) => key[0]);
  const ys = keys.map((key) => key[1]);
  const n = keys.length;
  if (n === 1) return () => ys[0];
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    h.push(xs[i + 1] - xs[i]);
    d.push((ys[i + 1] - ys[i]) / h[i]);
  }
  const m = new Array<number>(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i += 1;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}

/** Numeric undirected edge key (no string allocation; valid for < 2^26 vertices). */
const EDGE_KEY_BASE = 67108864;
function edgeKey(a: number, b: number) {
  return a < b ? a * EDGE_KEY_BASE + b : b * EDGE_KEY_BASE + a;
}

function average(points: Point3[]): Point3 {
  const result: Point3 = [0, 0, 0];
  if (points.length === 0) return result;
  for (const point of points) {
    result[0] += point[0];
    result[1] += point[1];
    result[2] += point[2];
  }
  return [result[0] / points.length, result[1] / points.length, result[2] / points.length];
}

function add(a: Point3, b: Point3, factor = 1): Point3 {
  return [a[0] + b[0] * factor, a[1] + b[1] * factor, a[2] + b[2] * factor];
}

function scale(point: Point3, amount: number): Point3 {
  return [point[0] * amount, point[1] * amount, point[2] * amount];
}

function blend(a: Point3, b: Point3, amount: number): Point3 {
  return [mix(a[0], b[0], amount), mix(a[1], b[1], amount), mix(a[2], b[2], amount)];
}

/* ------------------------------------------------------------------ */
/* Vehicle class styling                                               */
/* ------------------------------------------------------------------ */

interface TypeStyle {
  floor: number;
  rockerHeight: number;
  nose: number;
  noseUp: number;
  hoodDrop: number;
  cowlRise: number;
  roofRear: number;
  roofSag: number;
  rearGlass: number;
  tailDeck: number;
  tailDrop: number;
  tail: number;
  roofEdge: number;
  railDrop: number;
  shoulder: number;
  featureDrop: number;
  beltWedge: number;
  flare: number;
  lip: number;
  widthKeys: Array<[number, number]>;
  grille: { w: number; h: number; c: number; p: number };
  pillars: number[];
  cPillar: number | null;
  /** hatchbacks: body-colour D-pillar, side glass ends this far (m) ahead of the roof rear edge */
  dPillar?: number;
  /** fenders may peak this far (m) above a lower 'valley' bonnet */
  fenderRise?: number;
  /** MPV with a distinct short bonnet instead of the one-motion nose */
  twoBoxFront?: boolean;
  /** beltline rise (m) behind the sliding door: rear quarter window steps up */
  beltKick?: number;
  /** straight raked A-pillar / windshield with only a small header radius (vans) */
  straightScreen?: boolean;
  /** hatchback with a fastback roof: roof peaks over the B-pillar and falls in one parabola */
  fastback?: boolean;
  /** progressive upward sweep (m) of the beltline towards the tail (coupe C-pillar) */
  beltArc?: number;
  /** scale for body feature creases (hood edges, nose corner, shoulder); < 1 = softer */
  creaseScale?: number;
  /** SUV rear door top edge (C-pillar) relative to the rear axle, m (+ = behind) */
  cFromAxle?: number;
}

function shapeWidthKeys(keys: Array<[number, number]>, noseWidth: number, tailWidth: number) {
  const first = keys[0][1];
  const last = keys[keys.length - 1][1];
  const noseFactor = (1 - noseWidth) / Math.max(0.01, 1 - first);
  const tailFactor = (1 - tailWidth) / Math.max(0.01, 1 - last);
  return keys.map(([s, w]) => [s, clamp(1 - (1 - w) * (s < 0.5 ? noseFactor : tailFactor), 0.55, 1.02)] as [number, number]);
}

const typeStyles: Record<VehicleType, TypeStyle> = {
  sedan: {
    floor: 0.3,
    rockerHeight: 0.13,
    nose: 0.46,
    noseUp: 0.05,
    hoodDrop: 0.08,
    cowlRise: 0.05,
    roofRear: 0.7,
    roofSag: 0.06,
    rearGlass: 0.835,
    tailDeck: 0.925,
    tailDrop: 0.02,
    tail: 0.655,
    roofEdge: 0.68,
    railDrop: 0.075,
    shoulder: 0.965,
    featureDrop: 0.11,
    beltWedge: 0.05,
    flare: 0.02,
    lip: 0.06,
    widthKeys: [[0, 0.74], [0.05, 0.84], [0.15, 0.93], [0.28, 0.985], [0.42, 1], [0.58, 0.985], [0.72, 0.975], [0.82, 0.99], [0.93, 0.91], [1, 0.76]],
    grille: { w: 0.62, h: 0.3, c: 0.4, p: 3.2 },
    pillars: [0.5],
    cPillar: 0.45,
  },
  suv: {
    floor: 0.4,
    rockerHeight: 0.15,
    nose: 0.56,
    noseUp: 0.04,
    hoodDrop: 0.06,
    cowlRise: 0.04,
    roofRear: 0.8,
    roofSag: 0.025,
    rearGlass: 0.89,
    tailDeck: 0.955,
    tailDrop: 0.05,
    tail: 0.62,
    roofEdge: 0.78,
    railDrop: 0.055,
    shoulder: 0.975,
    featureDrop: 0.13,
    beltWedge: 0.03,
    flare: 0.034,
    lip: 0.085,
    widthKeys: [[0, 0.81], [0.05, 0.89], [0.15, 0.95], [0.28, 0.99], [0.42, 1], [0.62, 0.995], [0.8, 1], [0.92, 0.965], [1, 0.84]],
    grille: { w: 0.66, h: 0.36, c: 0.48, p: 5 },
    pillars: [0.46, 0.8],
    cPillar: null,
    dPillar: 0.14,
  },
  mpv: {
    floor: 0.32,
    rockerHeight: 0.13,
    nose: 0.5,
    noseUp: 0.05,
    hoodDrop: 0.08,
    cowlRise: 0.14,
    roofRear: 0.9,
    roofSag: 0.02,
    rearGlass: 0.965,
    tailDeck: 0.985,
    tailDrop: 0.05,
    tail: 0.52,
    roofEdge: 0.85,
    railDrop: 0.05,
    shoulder: 0.975,
    featureDrop: 0.12,
    beltWedge: 0,
    flare: 0.012,
    lip: 0.055,
    widthKeys: [[0, 0.86], [0.06, 0.91], [0.17, 0.965], [0.3, 0.99], [0.44, 1], [0.66, 1], [0.84, 0.99], [0.95, 0.965], [1, 0.88]],
    grille: { w: 0.7, h: 0.34, c: 0.45, p: 3.6 },
    pillars: [0.34, 0.7],
    cPillar: null,
    dPillar: 0.07,
  },
  micro: {
    floor: 0.29,
    rockerHeight: 0.12,
    nose: 0.5,
    noseUp: 0.06,
    hoodDrop: 0.07,
    cowlRise: 0.1,
    roofRear: 0.84,
    roofSag: 0.03,
    rearGlass: 0.93,
    tailDeck: 0.975,
    tailDrop: 0.05,
    tail: 0.56,
    roofEdge: 0.82,
    railDrop: 0.055,
    shoulder: 0.97,
    featureDrop: 0.1,
    beltWedge: 0.02,
    flare: 0.014,
    lip: 0.05,
    widthKeys: [[0, 0.84], [0.07, 0.91], [0.18, 0.965], [0.33, 0.99], [0.46, 1], [0.67, 0.995], [0.83, 0.99], [0.95, 0.945], [1, 0.84]],
    grille: { w: 0.52, h: 0.18, c: 0.42, p: 2.6 },
    pillars: [0.55],
    cPillar: null,
    dPillar: 0.15,
  },
};

/** Per-template style overrides (plan shape, pillar layout, roof form). */
const templateStyles: Record<string, Partial<TypeStyle>> = {
  // Modern rugged SUV: C-pillar just ahead of the rear axle, large quarter window behind.
  "suv-rugged": {
    cFromAxle: -0.04,
  },
  // Round luxury SUV, coupe-SUV fastback: roof peaks over the B-pillar and falls in one
  // parabola to a short tailgate; rising beltline, tapered ends with rear haunches, soft nose.
  "suv-rounded": {
    fastback: true,
    beltArc: 0,
    cFromAxle: 0.06,
    creaseScale: 0.55,
    railDrop: 0.06,
    shoulder: 0.965,
    featureDrop: 0.12,
    widthKeys: [[0, 0.79], [0.05, 0.87], [0.15, 0.945], [0.3, 0.98], [0.45, 0.985], [0.62, 0.995], [0.77, 1], [0.88, 0.98], [0.96, 0.92], [1, 0.82]],
    dPillar: 0.1,
  },
  // Utility van: slab sides, flat roof, square plan, thin D-pillar.
  "mpv-van": {
    roofSag: 0.006,
    railDrop: 0.038,
    shoulder: 0.985,
    featureDrop: 0.15,
    widthKeys: [[0, 0.9], [0.06, 0.95], [0.17, 0.985], [0.3, 1], [0.7, 1], [0.9, 1], [0.97, 0.985], [1, 0.93]],
    dPillar: 0.05,
    straightScreen: true,
    // one-motion nose: soft bonnet edges so face, bonnet and screen read as one slope
    creaseScale: 0.25,
  },
  // Executive MPV: independent front compartment (clear bonnet), strongly raked A-pillar,
  // arched roof and long, low proportions; crowned sides with a kicked belt.
  "mpv-executive": {
    cowlRise: 0.12,
    roofSag: 0.045,
    railDrop: 0.05,
    shoulder: 0.972,
    featureDrop: 0.13,
    widthKeys: [[0, 0.86], [0.05, 0.93], [0.15, 0.975], [0.28, 0.995], [0.4, 1], [0.8, 1], [0.92, 0.985], [0.97, 0.96], [1, 0.9]],
    dPillar: 0.11,
    twoBoxFront: true,
    beltKick: 0.07,
  },
  // Cube: near-constant plan width and a wide, flat D-pillar.
  "micro-cube": {
    roofSag: 0.01,
    railDrop: 0.045,
    shoulder: 0.985,
    widthKeys: [[0, 0.9], [0.07, 0.95], [0.18, 0.985], [0.33, 1], [0.7, 1], [0.86, 0.995], [0.95, 0.975], [1, 0.92]],
    dPillar: 0.2,
  },
  // Round city car, fastback hatch: tapered ends with rear haunches, roof falls in one
  // parabola, rising beltline and soft nose/bonnet corners.
  "micro-city": {
    fastback: true,
    beltArc: 0,
    creaseScale: 0.5,
    roofSag: 0.045,
    railDrop: 0.06,
    shoulder: 0.96,
    widthKeys: [[0, 0.78], [0.07, 0.89], [0.18, 0.955], [0.33, 0.985], [0.5, 0.99], [0.68, 1], [0.83, 0.985], [0.94, 0.93], [1, 0.8]],
    dPillar: 0.1,
  },
};

/** Templates with a fastback roof (they offer the integrated roof spoiler option). */
export function isFastbackTemplate(templateId: string) {
  return templateStyles[templateId]?.fastback === true;
}

/* ------------------------------------------------------------------ */
/* Vehicle frame – all derived design lines                            */
/* ------------------------------------------------------------------ */

export interface ArchFrame {
  x: number;
  s: number;
  cy: number;
  r: number;
  rc: number;
  lipR: number;
  flare: number;
  power: number;
}

/** Greenhouse (daylight opening) at one station, physical metres. */
export interface DloStation {
  /** sill (glass bottom edge) */
  y7: number;
  z7: number;
  /** glass top edge */
  y8: number;
  z8: number;
  /** cant rail / mohawk line */
  y9: number;
  z9: number;
  /** roof edge, just inboard of the rail */
  y10: number;
  z10: number;
}

/** Rounded-trapezoid opening: |z| <= gw (1 - taper yn) (1 - |yn|^p)^(1/p), yn = (y - gc) / gh. */
export interface GrilleShape {
  gw: number;
  gh: number;
  gc: number;
  p: number;
  taper: number;
  /** open at the bottom: straight sides run down to the body edge, only the top corners round */
  openBottom?: boolean;
}

export function grilleHalfWidth(shape: GrilleShape, yn: number) {
  if (shape.openBottom && yn <= 0) return shape.gw * (1 - shape.taper * Math.max(-1, yn));
  const a = Math.min(1, Math.abs(yn));
  return shape.gw * (1 - shape.taper * yn) * Math.pow(Math.max(0, 1 - Math.pow(a, shape.p)), 1 / shape.p);
}

export function insideGrille(shape: GrilleShape, z: number, y: number, margin = 0) {
  const yn = (y - shape.gc) / shape.gh;
  if (yn >= 1 - margin / shape.gh) return false;
  if (yn <= (shape.openBottom ? -1 : -(1 - margin / shape.gh))) return false;
  return Math.abs(z) < grilleHalfWidth(shape, yn) - margin;
}

/** Closed outline of a grille shape, `count` points, starting at the bottom centre. */
export function grilleOutline(shape: GrilleShape, count = 64): Array<[number, number]> {
  if (shape.openBottom) {
    // Open polyline: right side up, rounded top, left side down (no bottom edge).
    const side = Math.max(4, Math.round(count * 0.18));
    const top = Math.max(8, count - 2 * side);
    const points: Array<[number, number]> = [];
    for (let i = 0; i <= side; i += 1) {
      const yn = -1 + i / side;
      points.push([grilleHalfWidth(shape, yn), shape.gc + shape.gh * yn]);
    }
    for (let i = 1; i < top; i += 1) {
      const phi = (Math.PI * i) / top;
      const c = Math.cos(phi);
      const yn = Math.sin(phi) ** (2 / shape.p);
      points.push([shape.gw * (1 - shape.taper * yn) * Math.sign(c) * Math.abs(c) ** (2 / shape.p), shape.gc + shape.gh * yn]);
    }
    for (let i = 0; i <= side; i += 1) {
      const yn = -i / side;
      points.push([-grilleHalfWidth(shape, yn), shape.gc + shape.gh * yn]);
    }
    return points;
  }
  return Array.from({ length: count }, (_, i) => {
    const phi = -Math.PI / 2 + (2 * Math.PI * i) / count;
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    const yn = Math.sign(sn) * Math.abs(sn) ** (2 / shape.p);
    return [shape.gw * (1 - shape.taper * yn) * Math.sign(c) * Math.abs(c) ** (2 / shape.p), shape.gc + shape.gh * yn];
  });
}

/** 2D (z, y) bar segments of a grille texture, clipped to the opening. */
export function grillePatternSegments(pattern: GrillePattern, shape: GrilleShape, scale = 1) {
  const segments: Array<[[number, number], [number, number]]> = [];
  const margin = 0.012 * scale;
  const W = shape.gw * (1 + Math.abs(shape.taper));
  const y0 = shape.gc - shape.gh;
  const y1 = shape.gc + shape.gh;
  const polyline = (points: Array<[number, number]>) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      if (insideGrille(shape, a[0], a[1], margin) && insideGrille(shape, b[0], b[1], margin)) segments.push([a, b]);
    }
  };
  const line = (a: [number, number], b: [number, number], steps: number) =>
    polyline(Array.from({ length: steps + 1 }, (_, i) => [mix(a[0], b[0], i / steps), mix(a[1], b[1], i / steps)] as [number, number]));
  if (pattern === "horizontal" || pattern === "mesh") {
    const gap = (pattern === "mesh" ? 0.024 : 0.034) * scale;
    for (let y = shape.gc - Math.floor(shape.gh / gap) * gap; y < y1; y += gap) line([-W, y], [W, y], 48);
  }
  if (pattern === "vertical" || pattern === "mesh") {
    const gap = (pattern === "mesh" ? 0.024 : 0.03) * scale;
    for (let z = -Math.floor(W / gap) * gap; z <= W; z += gap) line([z, y0], [z, y1], 16);
  }
  if (pattern === "diamond") {
    const gap = 0.042 * scale;
    const span = W + shape.gh;
    for (let d = -span; d <= span; d += gap) {
      line([d - shape.gh, y0], [d + shape.gh, y1], 18);
      line([d + shape.gh, y0], [d - shape.gh, y1], 18);
    }
  }
  if (pattern === "honeycomb") {
    const r = 0.017 * scale;
    const dx = 1.5 * r;
    const dy = Math.sqrt(3) * r;
    let column = 0;
    for (let z = -W - r; z <= W + r; z += dx, column += 1) {
      for (let y = y0 - dy + (column % 2 ? dy / 2 : 0); y <= y1 + dy; y += dy) {
        const hex = Array.from({ length: 7 }, (_, k) => {
          const a = (Math.PI / 3) * k;
          return [z + r * Math.cos(a), y + r * Math.sin(a)] as [number, number];
        });
        // three edges per cell are enough: neighbours supply the rest
        polyline(hex.slice(0, 4));
      }
    }
  }
  return segments;
}

export interface VehicleFrame {
  type: VehicleType;
  style: TypeStyle;
  L: number;
  W: number;
  H: number;
  Lb: number;
  floor: number;
  rockerTop: number;
  belt: number;
  nose: number;
  tailTop: number;
  crown: number;
  pillarDrop: number;
  xAt: (s: number) => number;
  sAtX: (x: number) => number;
  topAt: (s: number) => number;
  halfWidthAt: (s: number) => number;
  beltAt: (s: number) => number;
  cabinAt: (s: number) => number;
  cowlS: number;
  hoodEndS: number;
  hoodFrontS: number;
  hoodW: number;
  hoodEdgeDrop: number;
  hoodDomeAt: (s: number) => number;
  frontBow: number;
  rearBow: number;
  frontRecess: (z: number, y: number) => number;
  rearRecess: (z: number, y: number) => number;
  frontReach: number;
  rearReach: number;
  roofFrontS: number;
  roofRearS: number;
  rearGlassS: number;
  rearGlassTopS: number;
  /** top edge of the windshield (level with the top of the side glass) */
  windshieldTopS: number;
  /** integrated spoiler lip station (fastback with spoiler), -1 otherwise */
  spoilerTipS: number;
  tailS0: number;
  tailFillet: (s: number) => { z: number; y: number };
  shoulderAt: (s: number) => number;
  pillarAt: (s: number) => number;
  dloAt: (s: number) => DloStation;
  archWarp: (x: number, strength: number) => number;
  /** plan-view bow of the glass edges: x offset (m) for a point at station s and lateral z */
  glassBowX: (s: number, z: number) => number;
  fenderPeakAt: (s: number) => number;
  tailDeckS: number;
  hatchback: boolean;
  rearGlassBottom: number;
  arches: ArchFrame[];
  glass: { start: number; end: number; pillars: number[]; pillarHalf: number };
  grille: GrilleShape;
  lowerGrille: GrilleShape | null;
}

export function getVehicleFrame(config: VehicleConfig): VehicleFrame {
  const baseStyle: TypeStyle = { ...typeStyles[config.type], ...(templateStyles[config.templateId] ?? {}) };
  const style: TypeStyle = {
    ...baseStyle,
    roofEdge: clamp(config.roofWidthPercent / 100, 0.58, 0.9),
    widthKeys: shapeWidthKeys(
      baseStyle.widthKeys,
      clamp(config.noseWidthPercent / 100, 0.6, 0.98),
      clamp(config.tailWidthPercent / 100, 0.6, 0.98),
    ),
  };
  const L = config.length / 1000;
  const W = config.width / 1000;
  const H = Math.max(config.height, getMinimumBodyHeight(config)) / 1000;
  const endInset = 0.045;
  const Lb = L - endInset * 2;
  const xAt = (s: number) => -L / 2 + endInset + s * Lb;
  const sAtX = (x: number) => (x + L / 2 - endInset) / Lb;
  const tireR = config.tireDiameter / 2000;
  const archR = Math.max(config.wheelArch / 1000, tireR + clamp(config.archClearance, 20, 90) / 1000);
  const floor = clamp(config.groundClearance / 1000, 0.12, tireR + 0.015);
  const rockerTop = floor + style.rockerHeight;
  const belt = config.beltline / 1000;
  const trend = (config.sideTrend - 50) / 50;
  const hatchback = config.type !== "sedan";

  const cowlS = clamp(config.windshieldPosition / config.length, 0.12, 0.55);
  // Windshield base sits level with the side-glass sill (beltline + 14 mm at the cowl);
  // +18 mm compensates the bonnet crown so the lowest glass points line up.
  const sillAtCowl = belt + (cowlS - 0.45) * (config.beltlineSlope / 1000 + 0.05 * ((config.sideTrend - 50) / 50)) + 0.014;
  const cowlY = Math.min(H - 0.2, sillAtCowl + 0.018);
  const rise = H - 0.035 - cowlY;
  const run = (rise * Math.tan((clamp(config.windshieldAngle, 20, 80) * Math.PI) / 180)) / Lb;
  const rearBelt = belt + 0.5 * (config.beltlineSlope / 1000 + 0.05 * trend);
  // Rear window base is level with the rear end of the side-glass sill (beltline + 14 mm;
  // +16 mm compensates the SubD limit pulling the glass corners down).
  const rearBeltFull = belt + 0.55 * (config.beltlineSlope / 1000 + 0.05 * trend) + (style.beltArc ?? 0);
  void rearBelt;
  const rearGlassY = hatchback
    ? clamp(rearBeltFull + 0.03, H * 0.5, H - 0.3)
    : clamp(rearBelt + 0.03, H * 0.55, H - 0.25);
  // Hatchbacks (SUV / MPV / micro), side view, one continuous convex line:
  //   roof -> backlight (chord rake = rearGlassSpan x 2.5 deg from vertical, rolling over
  //   from the roof and steepening downwards) -> lower tailgate: a circular arc that keeps
  //   turning the glass direction towards vertical -> rear end face.
  // There is no horizontal shelf behind the glass, so the tail never "sticks out" below it.
  // roofEndPercent sets the height of the tailgate band below the glass. Near-vertical
  // backlights (vans) collapse the band: glass and tailgate become one upright plane.
  // Fastback: the rake parameter sets the chord of the whole roof descent (peak -> glass
  // base); the descent is the parabola y = H - drop * t^2, so its end slope is 2x the chord.
  const fastback = hatchback && style.fastback === true;
  // Integrated spoiler (fastbacks): the roof runs on almost flat to a lip, the rear window
  // drops from under the lip at a more upright rake (rearGlassSpan x 2.5 deg from
  // vertical), so the spoiler reads as the extension of the roof, not an add-on.
  const spoiler = fastback && config.hasSpoiler !== false;
  const hatchRake = ((spoiler ? clamp(2.5 * config.rearGlassSpan, 22, 60)
    : fastback ? clamp(2.5 * config.rearGlassSpan + 18, 40, 70) : clamp(2.5 * config.rearGlassSpan, 2, 45)) * Math.PI) / 180;
  const hatchDrop = Math.max(0.1, H - (fastback ? 0 : style.roofSag) - rearGlassY);
  const glassEndRatio = spoiler ? 1.25 : fastback ? 2 : 1.55;
  const glassEndAngle = Math.atan(Math.tan(hatchRake) / glassEndRatio);
  const tailEndAngle = glassEndAngle * 0.3;
  const arcRunPerDrop = (Math.cos(tailEndAngle) - Math.cos(glassEndAngle))
    / Math.max(1e-6, Math.sin(glassEndAngle) - Math.sin(tailEndAngle));
  const bandTarget = clamp(0.06 + (95 - config.roofEndPercent) * 0.015, 0.06, 0.24);
  const bandFade = smoothstep(0.02, 0.05, bandTarget * arcRunPerDrop);
  // The tailgate band may never pull the tail top below the beltline band: the shoulder,
  // feature line and sill must wrap round the rear corner at their own height (as on real
  // SUVs), otherwise they dive in the last section and pinch the D-pillar corner.
  const rearBeltEnd = rearBeltFull;
  const hatchBand = Math.min(bandTarget * bandFade, Math.max(0, rearGlassY - floor - 0.32),
    Math.max(0, rearGlassY - (rearBeltEnd + (style.fastback ? -0.045 : 0.095))));
  const hatchArcR = hatchBand / Math.max(1e-6, Math.sin(glassEndAngle) - Math.sin(tailEndAngle));
  const hatchArcRun = hatchBand * arcRunPerDrop;
  const hatchGlassS = clamp(1 - hatchArcRun / Lb, 0.95, 1);
  const hatchRoofRear = hatchGlassS - (hatchDrop * Math.tan(hatchRake)) / Lb;
  // Estimated top of the side glass (roof - rail drop - pillar band) = top of the rear window.
  const winFractionEarly = clamp((clamp(config.windowHeightPercent / 100, 0.55, 0.98) - 0.55) / 0.43, 0, 1);
  const spoilerGlassTop = H - style.railDrop - mix(0.11, 0.045, winFractionEarly) * 0.97 + 0.008;
  const spoilerGlassRun = Math.max(0.05, spoilerGlassTop - rearGlassY) * Math.tan(hatchRake);
  const spoilerG0 = hatchGlassS - spoilerGlassRun / Lb;
  const spoilerTip = spoilerG0 - 0.04 / Lb;
  const spoilerExtDrop = 0.025;
  const desiredRoofRear = hatchback
    ? Math.max(spoiler ? spoilerTip : hatchRoofRear, cowlS + 0.16)
    : Math.max(clamp(config.roofEndPercent / 100, 0.62, 0.79), cowlS + 0.16);
  const roofFrontS = clamp(cowlS + run, cowlS + 0.04, desiredRoofRear - 0.12);
  // For fastbacks this is the roof peak; the backlight header then sits part-way down the slope.
  const roofPeakS = spoiler
    ? clamp(mix(roofFrontS, spoilerTip, 0.45), roofFrontS + 0.08, spoilerTip - 0.1)
    : hatchback
      ? clamp(Math.max(desiredRoofRear, roofFrontS + 0.12), fastback ? 0.45 : 0.62, hatchGlassS - 0.012)
      : clamp(Math.max(desiredRoofRear, roofFrontS + 0.12), 0.62, 0.79);
  const rearGlassS = hatchback
    ? hatchGlassS
    : clamp(roofPeakS + clamp(config.rearGlassSpan, 6, 18) / 100, roofPeakS + 0.055, 0.91);
  const roofRearS = spoiler ? spoilerTip : fastback ? roofPeakS + 0.42 * (rearGlassS - roofPeakS) : roofPeakS;
  const spoilerTipY = H - spoilerExtDrop;
  const spoilerGlassChord = (rearGlassY - spoilerGlassTop) / Math.max(1e-4, rearGlassS - spoilerG0);
  const spoilerExtSlope = (-2 * spoilerExtDrop) / Math.max(1e-4, spoilerTip - roofPeakS);
  const fastbackDescent = (s: number) => {
    if (spoiler) {
      if (s <= spoilerTip) {
        const u = clamp((s - roofPeakS) / Math.max(1e-4, spoilerTip - roofPeakS), 0, 1);
        return H - spoilerExtDrop * u * u;
      }
      if (s <= spoilerG0) {
        return hermiteSegment(s, spoilerTip, spoilerG0, spoilerTipY, spoilerGlassTop, spoilerExtSlope, 0.8 * spoilerGlassChord);
      }
      return hermiteSegment(s, spoilerG0, rearGlassS, spoilerGlassTop, rearGlassY, 0.8 * spoilerGlassChord, 1.25 * spoilerGlassChord);
    }
    const t = clamp((s - roofPeakS) / Math.max(1e-4, rearGlassS - roofPeakS), 0, 1);
    return H - (H - rearGlassY) * t * t;
  };
  const tailDeckS = hatchback
    ? mix(rearGlassS, 1, 0.52)
    : clamp(config.tailDeckPercent / 100, rearGlassS + 0.025, 0.985);
  // Holistic bonnet controls:
  //   hoodShape  -> overall bonnet height (50 = reference, +/-60 mm, nose and rear together)
  //   noseLift   -> bonnet rake: front-down / rear-up about the bonnet middle (40 = reference)
  //   hoodDome   -> fullness: longitudinal convexity and transverse crown together
  const hoodLift = ((clamp(config.hoodShape, 0, 100) - 50) / 50) * 0.06;
  const hoodTilt = (clamp(config.noseLift, 0, 150) - 40) / 1000;
  const hoodFull = clamp(config.hoodDome / 90, 0, 1);
  // Two-box luxury MPV fronts carry a tall, upright face: the nose may rise to 50 mm below the belt.
  const nose = clamp((config.noseHeightPercent / 100) * H + config.frontHeightOffset / 1000 + hoodLift - hoodTilt * 0.5,
    floor + 0.28, belt - (style.twoBoxFront ? 0.05 : 0.14));
  const lipY = nose;
  const hoodRearDrop = clamp(config.hoodRearDrop / 1000, 0.02, 0.26);
  // Hood rear edge is referenced to the windshield base so the plenum step stays short
  // and the bonnet reads as one convex surface rather than a sagging ramp.
  const hoodRearFree = clamp(cowlY - 0.03 - hoodRearDrop * 0.7 + hoodLift + hoodTilt * 0.5, lipY + 0.005, cowlY - 0.012);
  const hoodRear = mix(hoodRearFree, cowlY - 0.015, clamp(config.hoodGlassBlend / 100, 0, 1));
  const hoodEndS = cowlS - Math.min(0.07, cowlS * 0.3);
  const hoodFrontS = Math.min(0.05, hoodEndS * 0.4);
  const tailTopY = hatchback
    ? rearGlassY - hatchBand
    : Math.min(config.tailHeightPercent / 100 * H + config.rearHeightOffset / 1000, rearGlassY - 0.06);
  const tailDeckY = hatchback
    ? mix(rearGlassY, tailTopY, 0.52)
    : clamp(belt - style.tailDrop + config.rearHeightOffset / 2000, floor + 0.28, rearGlassY - 0.035);
  const hoodW = clamp(config.hoodWidthPercent / 100, 0.5, 0.88);
  const hoodDome = 0.016 + 0.034 * hoodFull;
  // Transverse crown builds up behind the front lip and then stays constant to the cowl:
  // a continuous crowned panel instead of a sin^2 hump in the middle of the bonnet.
  const hoodCrownProfile = (s: number) =>
    smoothstep(0, 0.5, (s - hoodFrontS) / Math.max(0.02, hoodEndS - hoodFrontS));
  const hoodDomeAt = (s: number) => hoodDome * hoodCrownProfile(s);

  // Convex bonnet profile (side view): one parabola-blended curve from the nose to the hood
  // rear edge, y = nose + rise*t + rise*k*t*(1-t). For 0 < k <= 1 it is strictly convex and
  // monotone: steepest where it rolls over the nose, flattening towards the cowl, with no
  // S-bend at the lip. `noseLift` controls the fullness k.
  const hoodRise = Math.max(0.01, hoodRear - nose);
  const hoodFullness = 0.12 + 0.72 * hoodFull;
  const hoodSpanS = Math.max(0.03, hoodEndS);
  const hoodSlopeEnd = (hoodRise / hoodSpanS) * (1 - hoodFullness);
  const plenumChord = Math.max(0, cowlY - hoodRear) / Math.max(0.01, cowlS - hoodEndS);
  const screenChord = Math.max(0, H - 0.03 - cowlY) / Math.max(0.02, roofFrontS - cowlS);
  const plenumEnd = Math.min(screenChord * 1.1, 3 * plenumChord);
  const legacyFront = (s: number) => {
    if (s <= hoodEndS) {
      const t = clamp(s / hoodSpanS, 0, 1);
      return nose + hoodRise * t + hoodRise * hoodFullness * t * (1 - t);
    }
    if (s <= cowlS) {
      return hermiteSegment(s, hoodEndS, cowlS, hoodRear, cowlY, Math.min(hoodSlopeEnd, 3 * plenumChord), plenumEnd);
    }
    return hermiteSegment(s, cowlS, roofFrontS, cowlY, H - 0.03, plenumEnd, screenChord * 0.9);
  };
  const roofMid = fastback ? roofPeakS : (roofFrontS + roofRearS) / 2;
  const roofY = H - 0.03;
  const rearRoofY = fastback ? fastbackDescent(roofRearS) : H - style.roofSag;
  // The backlight starts a little below the roof edge so a body-colour header (~75 mm,
  // measured along the surface) is left above it, like a real tailgate frame.
  const glassSpanS = Math.max(1e-3, rearGlassS - roofRearS);
  const glassArc = Math.hypot(glassSpanS * Lb, Math.max(0.05, rearRoofY - rearGlassY));
  const rearGlassTopFallback = roofRearS + Math.max(clamp(0.075 / glassArc, 0.05, 0.4) * glassSpanS, Math.min(0.4 * glassSpanS, 0.0058));
  const roofAt = monotone([
    [roofFrontS, roofY],
    [roofMid, H],
    [roofRearS, rearRoofY],
  ]);
  const blendStrength = config.type === "mpv" && !style.twoBoxFront ? Math.max(0.9, config.hoodGlassBlend / 100) : config.hoodGlassBlend / 100;
  const roofJoinSlope = (H - roofY) / Math.max(0.02, roofMid - roofFrontS);
  // Blended ("one-motion") front used by MPVs: a convex bonnet that rolls over the nose,
  // a convex windshield that is steepest at its base and rolls into the roof, joined at
  // the cowl by a large-radius fillet (radius grows with hoodGlassBlend). No sagging ramp
  // and no hard break between bonnet and glass.
  const screenChordS = (roofY - cowlY) / Math.max(0.025, roofFrontS - cowlS);
  const screenBase = Math.max(1.5 * screenChordS - 0.5 * roofJoinSlope, roofJoinSlope);
  const flowRise = Math.max(0.01, cowlY - nose);
  const flowSpan = Math.max(0.03, cowlS);
  // A one-motion bonnet is only gently crowned, so it keeps rising into the windshield and
  // the bonnet-to-glass angle stays small (noseLift still scales the crown).
  // Straight-screen vans: an almost straight bonnet so front face, bonnet and A-pillar read
  // as one continuous slope (no crown that would kink at the cowl).
  const flowFullness = style.straightScreen ? 0.06
    : clamp(Math.max(0.55 * hoodFullness, 1 - (0.6 * screenChordS * flowSpan) / flowRise), 0, 1);
  const flowHoodEnd = (flowRise * (1 - flowFullness)) / flowSpan;
  const flowHood = (s: number) => {
    if (s >= cowlS) return cowlY + flowHoodEnd * (s - cowlS);
    const t = clamp(s / flowSpan, 0, 1);
    return nose + flowRise * t + flowRise * flowFullness * t * (1 - t);
  };
  // Straight screen: a plane from the cowl to the header, rounded only over the last
  // ~120 mm into the roof (small header radius), as on real vans.
  const straight = style.straightScreen === true;
  // End the windshield on the roof curve's actual starting slope (the roof is a PCHIP whose
  // end slope differs from its chord), so the header is tangent-continuous.
  const roofStartSlope = (roofAt(roofFrontS + 1e-4) - roofAt(roofFrontS)) / 1e-4;
  const headerS = Math.max(cowlS + 0.35 * (roofFrontS - cowlS), roofFrontS - 0.32 / Lb);
  const flowScreen = (s: number) => {
    if (straight) {
      if (s <= headerS) return cowlY + screenChordS * (s - cowlS);
      return hermiteSegment(s, headerS, roofFrontS, cowlY + screenChordS * (headerS - cowlS), roofY, screenChordS, roofStartSlope);
    }
    return s >= cowlS
      ? hermiteSegment(s, cowlS, roofFrontS, cowlY, roofY, screenBase, roofStartSlope)
      : cowlY + screenBase * (s - cowlS);
  };
  const filletSoft = straight ? 0.06 : 0.03 + 0.12 * clamp(blendStrength, 0, 1);
  const frontAt = (s: number) => {
    // Compact fillet window: exactly zero well before the header and the nose, so the
    // soft-max adds no bias where the roof / nose curves take over (no value step there).
    const reach = Math.max(1e-3, Math.min(0.12, 0.9 * (roofFrontS - cowlS), 0.9 * cowlS));
    const window = 1 - smoothstep(0.55 * reach, reach, Math.abs(s - cowlS));
    const soft = (filletSoft * Math.exp(-Math.pow((s - cowlS) / 0.055, 2)) + 1e-4) * window;
    const flow = smoothMax(flowHood(s), flowScreen(s), soft);
    return mix(legacyFront(s), flow, clamp(blendStrength, 0, 1));
  };
  const rearSlope = (rearGlassY - rearRoofY) / (rearGlassS - roofRearS);
  // Convex backlight: shallow where it leaves the roof, steeper at its lower edge
  // (within the cubic's convexity window 1.3c..2.2c for a 0.45c start slope).
  const glassStartSlope = rearSlope * (hatchback ? 0.45 : 0.65);
  const glassEndSlope = rearSlope * (hatchback ? glassEndRatio : 0.75);
  // Lower tailgate arc: centre (cx, cy), radius R, starts tangent to the glass.
  const arcX0 = xAt(rearGlassS);
  // Fastback: re-derive the arc from the parabola's real end slope (exact tangency even if
  // the roof peak was clamped).
  const fastEndSlope = spoiler
    ? (-1.25 * spoilerGlassChord) / Lb
    : (2 * (H - rearGlassY)) / Math.max(1e-4, (rearGlassS - roofPeakS) * Lb);
  const arcAngle = fastback ? Math.atan(1 / Math.max(1e-6, fastEndSlope)) : glassEndAngle;
  const arcR = fastback ? hatchBand / Math.max(1e-6, Math.sin(arcAngle) - Math.sin(arcAngle * 0.3)) : hatchArcR;
  const arcCx = arcX0 - arcR * Math.cos(arcAngle);
  const arcCy = rearGlassY - arcR * Math.sin(arcAngle);
  const tailgateArc = (s: number) => {
    const dx = clamp(xAt(s) - arcCx, -arcR, arcR);
    return arcCy + Math.sqrt(Math.max(0, arcR * arcR - dx * dx));
  };
  const sedanDeck = monotone([[rearGlassS, rearGlassY], [tailDeckS, tailDeckY], [1, tailTopY]]);
  const baseTopAt = (s: number) => {
    if (s < roofFrontS) return frontAt(s);
    if (fastback && s >= roofPeakS) {
      if (s <= rearGlassS) return fastbackDescent(s);
      return arcR > 1e-4 ? tailgateArc(s) : rearGlassY;
    }
    if (s <= roofRearS) return roofAt(s);
    if (s <= rearGlassS) {
      return hermiteSegment(s, roofRearS, rearGlassS, rearRoofY, rearGlassY, glassStartSlope, glassEndSlope);
    }
    if (hatchback) return hatchArcR > 1e-4 ? tailgateArc(s) : rearGlassY;
    return sedanDeck(s);
  };
  const widthFn = monotone(style.widthKeys);
  const halfWidthAt = (s: number) =>
    (W / 2) * widthFn(clamp(s, 0, 1)) * (1 + 0.012 * trend * Math.sin(Math.PI * clamp(s, 0, 1)));
  const beltLinear = (s: number) => belt + (s - 0.45) * (config.beltlineSlope / 1000 + 0.05 * trend);
  // Beltline kick (luxury MPV): smooth rise behind the sliding door / C-pillar, positioned
  // from the rear axle so it does not depend on the glass layout derived from beltAt.
  const kickX = L / 2 - config.rearAxleFromTail / 1000 - (archR + clamp(config.archLipWidth / 1000, 0.025, 0.14)) + 0.02;
  const beltAt = (s: number) => beltLinear(s)
    + (style.beltKick ?? 0) * smoothstep(sAtX(kickX), sAtX(kickX + 0.45), s)
    + (style.beltArc ?? 0) * Math.pow(clamp((s - 0.25) / 0.75, 0, 1), 2);

  const archSegments = config.cageDensity === "compact" ? 4 : config.cageDensity === "detailed" ? 8 : 6;
  // The opening stays circular; the outer support lip has a tunable shoulder.
  const archPower = 2 + clamp(config.archShape / 100, 0, 1) * 1.2;
  const archFor = (x: number, flare: number): ArchFrame => {
    const rc = archR * (3 / (2 + Math.cos(Math.PI / archSegments)));
    const endRoom = Math.min(x + L / 2, L / 2 - x) - 0.07;
    return {
      x,
      s: sAtX(x),
      cy: tireR + 0.02,
      r: archR,
      rc,
      lipR: Math.min(rc + clamp(config.archLipWidth / 1000, 0.025, 0.14), Math.max(rc + 0.025, endRoom)),
      flare: clamp(flare / 1000, 0, 0.1),
      power: archPower,
    };
  };
  const arches = [
    archFor(-L / 2 + config.frontAxleFromFront / 1000, config.frontFlare),
    archFor(L / 2 - config.rearAxleFromTail / 1000, config.rearFlare),
  ];
  // Concentric arch wiring: section stations are vertical, so sampling the lip loop at the
  // station x makes the lip band ~4x wider at the arch ends than at the top. The lip rows
  // are therefore re-timed with a monotone C1 warp of x: inside the opening they are
  // scaled radially (x' = cx + u * (rc + w) / rc), then blend back to identity. Monotone
  // means rows can never cross; the opening row itself is untouched (stays a true circle).
  const archWarp = (x: number, strength: number) => {
    let out = x;
    for (const arch of arches) {
      const u = x - arch.x;
      const a = Math.abs(u);
      // Stay clear of the body ends and of the (densely stationed) rounded tail.
      const endRoom = u >= 0 ? Math.min(L / 2 - 0.05, xAt(tailS0) - 0.03) - arch.x : arch.x + L / 2 - 0.05;
      const w = Math.max(0, arch.lipR - arch.rc);
      const D = Math.min(2.5 * w + 0.08, endRoom - arch.rc);
      if (D <= 0.03 || w <= 0 || a >= arch.rc + D) continue;
      const wEff = Math.min(w, 0.4 * D) * strength;
      const k = (arch.rc + wEff) / arch.rc;
      const v = a <= arch.rc ? a * k : hermiteSegment(a, arch.rc, arch.rc + D, arch.rc * k, arch.rc + D, k, 1);
      out += Math.sign(u) * (v - a);
    }
    return out;
  };
  const cabinAt = (s: number) => {
    const frontBlend = smoothstep(Math.max(hoodFrontS, cowlS - 0.09), roofFrontS - 0.015, s);
    if (hatchback) return frontBlend;
    const backBlend = 1 - smoothstep(roofRearS, rearGlassS + (hatchback ? 0.025 : 0.035), s);
    return frontBlend * backBlend;
  };
  // Side shoulder/sill rows leave the bonnet height quickly after the cowl instead of
  // chasing the windshield up, so the quarter-glass sill never humps above the beltline.
  // Side rows (shoulder, sill, glass top, rail) must be fully in their cabin position
  // wherever there is side glass; otherwise the glass corners inherit bonnet/deck shape
  // and twist. They leave the bonnet just after the cowl, not when the roof starts.
  const shoulderAt = (s: number) => {
    const front = smoothstep(Math.min(cowlS - 0.03, start - 0.04), start, s);
    if (hatchback) return front;
    return front * (1 - smoothstep(end, Math.max(end + 0.04, rearGlassS + 0.035), s));
  };
  // A-pillar rows (glass top + rail) need a much longer lead-in than the shoulder: the
  // bonnet shut line has to sweep out to the A-pillar base over ~0.4 m. Switching inside one
  // station gap made the rail jump outward and back (twisted A-pillar root), most visibly on
  // cab-forward MPVs whose windshield base coincides with the start of the side glass.
  const pillarAt = (s: number) => {
    const pillarLead = Math.min(0.42 / Lb, Math.max(0.02, cowlS - hoodFrontS - 0.02));
    const front = smoothstep(cowlS - pillarLead, cowlS, s);
    if (hatchback) return front;
    return front * (1 - smoothstep(end, Math.max(end + 0.04, rearGlassS + 0.035), s));
  };

  // Hood-plane clearance: instead of a local bump above the wheel (which twists the
  // bonnet sides), the whole bonnet plane is raised uniformly until the fender
  // shoulder clears the circular arch lip everywhere along the opening.
  const crownValue = 0.03 + (0.05 * config.hoodShape) / 100;
  const edgeDropValue = clamp(config.hoodEdgeDrop / 1000, 0, 0.1);
  const sideDrop = 0.97 * crownValue + edgeDropValue;
  const requiredLift = (arch: ArchFrame, region: (s: number) => number) => {
    let lift = 0;
    for (let i = -20; i <= 20; i += 1) {
      const dx = (arch.lipR * i) / 20;
      const s = sAtX(arch.x + dx);
      const weight = region(s);
      if (weight < 0.5) continue;
      const lipTop = arch.cy + archHalfHeight(dx, arch.lipR, arch.power);
      const required = lipTop + 0.05 + sideDrop;
      lift = Math.max(lift, required - baseTopAt(s));
    }
    return clamp(lift, 0, 0.3);
  };
  const frontLift = requiredLift(arches[0], (s) => 1 - cabinAt(s));
  // Front clearance as a linear tilt of the bonnet plane (more at the nose, less at the
  // cowl) instead of a uniform raise: the deficit is largest ahead of the axle where the
  // bonnet is still low, so a uniform raise lifted the whole bonnet and cowl too much.
  // A linear term adds no bump or twist; the nose never rises more than the old raise.
  const frontNeed: Array<[number, number]> = [];
  for (let i = -20; i <= 20; i += 1) {
    const dx = (arches[0].lipR * i) / 20;
    const sNeed = sAtX(arches[0].x + dx);
    if (1 - cabinAt(sNeed) < 0.5) continue;
    const lipTop = arches[0].cy + archHalfHeight(dx, arches[0].lipR, arches[0].power);
    frontNeed.push([sNeed, lipTop + 0.05 + sideDrop - baseTopAt(sNeed)]);
  }
  let frontLiftCowl = frontLift;
  let frontLiftSlope = 0;
  for (let step = 1; step <= 60; step += 1) {
    const k = (step / 60) * 1.2;
    const atCowl = Math.max(0, ...frontNeed.map(([sn, need]) => need - k * Math.max(0, cowlS - sn)));
    if (atCowl + k * cowlS > frontLift + 1e-4) break;
    if (atCowl < frontLiftCowl) {
      frontLiftCowl = atCowl;
      frontLiftSlope = k;
    }
  }
  const frontLiftAt = (s: number) => clamp(frontLiftCowl + frontLiftSlope * Math.max(0, cowlS - s), 0, 0.3);
  const fenderStyleEarly = (style.fenderRise ?? 0) > 0;
  const rearLiftNeed = hatchback ? 0 : requiredLift(arches[1], (s) => (s > rearGlassS ? 1 : 0));
  const rearLift = fenderStyleEarly ? 0 : rearLiftNeed;
  const frontLiftWeight = (s: number) => 1 - smoothstep(cowlS, roofFrontS, s);
  // Sculpted-fender style (optional): the bonnet line is not lifted at all; instead only
  // the fender rows rise as a smooth peak over each wheel to keep the arch clearance, so
  // the bonnet sits low between two fender crowns.
  const fenderStyle = (style.fenderRise ?? 0) > 0;
  // Per-station clearance need over both arches, then a smooth upper envelope of it
  // (max of Gaussians, width 0.42 m) so the crown follows the arch instead of a worst case.
  const needSamples: Array<[number, number]> = [];
  if (fenderStyle) {
    arches.forEach((arch) => {
      for (let i = -24; i <= 24; i += 1) {
        const dx = (arch.lipR * i) / 24;
        const sn = sAtX(arch.x + dx);
        const lipTop = arch.cy + archHalfHeight(dx, arch.lipR, arch.power);
        const need = lipTop + 0.05 + sideDrop - baseTopAt(sn);
        if (need > 0) needSamples.push([arch.x + dx, need]);
      }
    });
  }
  const fenderPeakAt = (s: number) => {
    if (!fenderStyle) return 0;
    const x = xAt(s);
    let peak = 0;
    for (const [xn, need] of needSamples) peak = Math.max(peak, need * Math.exp(-Math.pow((x - xn) / 0.42, 2)));
    return peak;
  };
  const rearLiftWeight = (s: number) => smoothstep(roofRearS, rearGlassS, s);
  const topAt = (s: number) => {
    const x = xAt(s);
    let top = baseTopAt(s) + (fenderStyle ? 0 : frontLiftAt(s) * frontLiftWeight(s)) + rearLift * rearLiftWeight(s);
    // Residual safety for cab-forward bodies: very broad, low-order falloff only.
    arches.forEach((arch, index) => {
      if (index === 1 && !hatchback) return;
      if (index === 0 && fenderStyle) return;
      const distance = Math.abs(x - arch.x);
      const lipTop = arch.cy + arch.lipR + 0.1;
      const deficit = Math.max(0, lipTop - (baseTopAt(arch.s) + (index === 0 ? frontLiftAt(arch.s) : 0)));
      if (deficit <= 0) return;
      const roofMask = index === 1 ? 1 - smoothstep(roofRearS, rearGlassS, s) : 1;
      top += deficit * Math.exp(-Math.pow(distance / (arch.lipR * 2.2), 2)) * roofMask;
    });
    return Math.min(H - 0.012, top);
  };

  // Plan/side-view curvature of the front and rear faces. The centre of each face sits at
  // ±L/2, corners and top/bottom recede inward, so overall length stays exactly L.
  const frontReach = clamp(arches[0].s - arches[0].rc / Lb - 0.012, 0.03, 0.14);
  const rearReach = clamp(1 - (arches[1].s + arches[1].rc / Lb) - 0.012, 0.03, 0.14);
  const frontBow = Math.min(clamp(config.frontBow / 1000, 0, 0.4), (frontReach * Lb) / 1.6);
  const rearBow = Math.min(clamp(config.rearBow / 1000, 0, 0.4), (rearReach * Lb) / 1.6);
  const recessFor = (bow: number, hw: number, yLow: number, yHigh: number, upper = 0.5, bounded = false) => {
    const yMid = (yLow + yHigh) / 2;
    const hh = Math.max(0.1, (yHigh - yLow) / 2);
    return (z: number, y: number) => {
      const zn = clamp(Math.abs(z) / Math.max(0.05, hw), 0, 1.1);
      const yn = clamp((y - yMid) / hh, -1.2, 1.2);
      // Upper half (hood lip / deck) rolls back more than the bumper lip.
      // zn^3.2: flat across the middle, rounding off over the corners (full, not pointed).
      const q = Math.pow(zn, 3.2) + (yn > 0 ? upper : 0.15) * yn * yn;
      if (!bounded) return bow * q;
      // Soft-capped at `bow`: the recess then never grows faster along the body than the
      // stations advance, so tail sections cannot bunch up and fold the rear corners.
      return bow * (q + 1 - Math.sqrt((q - 1) * (q - 1) + 0.04)) / 2;
    };
  };
  const frontRecess = recessFor(frontBow, halfWidthAt(0), floor, topAt(0));
  const rearRecess = recessFor(rearBow, halfWidthAt(1), floor, topAt(1), hatchback ? 0.12 : 0.5, true);
  // Rounded tail: over the last `tailDepth` metres every section shrinks towards the
  // body axis along a quarter ellipse (plan view and side view), so the end face is
  // reached tangentially instead of through a 90 degree fold.
  const tailDepth = Math.max(0.08, Math.min(clamp(0.1 + 1.6 * rearBow, 0.14, 0.34), rearReach * Lb * 0.85));
  const tailS0 = 1 - tailDepth / Lb;
  const tailZ = clamp((0.7 * tailDepth) / Math.max(0.3, halfWidthAt(1)), 0.05, 0.2);
  const tailY = clamp((1.2 * tailDepth) / Math.max(0.4, topAt(1) - floor), 0.06, 0.26) * (hatchback ? 0.6 : 1);
  const tailFillet = (s: number) => {
    if (s <= tailS0) return { z: 0, y: 0 };
    const u = clamp((s - tailS0) / (1 - tailS0), 0, 1);
    const f = 1 - Math.sqrt(1 - u * u);
    return { z: tailZ * f, y: tailY * f };
  };

  /* ---------------- Greenhouse: side glass, pillars and mohawk line ---------------- */
  const hardness = clamp(config.surfaceHardness / 100, 0, 1);
  const sillAt = (s: number) => {
    const top = topAt(s);
    const y = Math.min(beltAt(s) + 0.014, top - 0.075);
    const z = (style.shoulder - 0.018 * hardness - 0.045) * halfWidthAt(s);
    return { y, z, top };
  };
  const railDropAt = (s: number) => {
    const { y, top } = sillAt(s);
    return Math.min(style.railDrop, (top - y) * 0.42);
  };
  const railRaw = (s: number) => topAt(s) - railDropAt(s);
  // Side view: the mohawk line follows the roof, but the windshield-header and
  // backlight-header corners are rounded with a large radius (variable-width Gaussian),
  // so A-pillar -> roof rail -> C/D-pillar is one continuous arc instead of a polyline.
  const cornerSigma = (s: number) => (style.straightScreen ? 0.024 : 0.032) * Math.max(
    Math.exp(-Math.pow((s - roofFrontS) / 0.07, 2)),
    (spoiler ? 0.2 : 1) * Math.exp(-Math.pow((s - roofRearS) / 0.07, 2)),
  );
  const RAIL_SAMPLES = 320;
  let railTable: Float64Array | null = null;
  const railY = (s: number) => {
    if (!railTable) {
      const table = new Float64Array(RAIL_SAMPLES + 1);
      for (let i = 0; i <= RAIL_SAMPLES; i += 1) {
        const si = i / RAIL_SAMPLES;
        const sigma = cornerSigma(si);
        if (sigma < 0.002) {
          table[i] = railRaw(si);
          continue;
        }
        let sum = 0;
        let weight = 0;
        for (let k = -8; k <= 8; k += 1) {
          const t = (k / 8) * 2.5;
          const w = Math.exp(-0.5 * t * t);
          sum += railRaw(clamp(si + t * sigma, 0, 1)) * w;
          weight += w;
        }
        table[i] = Math.min(sum / weight, railRaw(si));
      }
      railTable = table;
    }
    const f = clamp(s, 0, 1) * RAIL_SAMPLES;
    const i0 = Math.min(RAIL_SAMPLES - 1, Math.floor(f));
    return mix(railTable[i0], railTable[i0 + 1], f - i0);
  };
  // One tumblehome angle for the whole car: the side glass is a ruled surface with a
  // constant tilt (no twist). It is solved at mid roof so `roofWidthPercent` is honoured.
  const sRoofMid = (roofFrontS + roofRearS) / 2;
  const tumbleTan = (() => {
    const sill = sillAt(sRoofMid);
    const rise = Math.max(0.08, railRaw(sRoofMid) - sill.y);
    const inward = sill.z - style.roofEdge * halfWidthAt(sRoofMid);
    return clamp(inward / rise, Math.tan((4 * Math.PI) / 180), Math.tan((34 * Math.PI) / 180));
  })();
  const tumbleCos = 1 / Math.sqrt(1 + tumbleTan * tumbleTan);
  const winFraction = clamp((clamp(config.windowHeightPercent / 100, 0.55, 0.98) - 0.55) / 0.43, 0, 1);
  // Visible pillar / rail width (perpendicular to the pillar), uniform around the DLO.
  const pillarWidth = mix(0.11, 0.045, winFraction);
  const railPoint = (s: number) => {
    const sill = sillAt(s);
    const y9 = railY(s);
    return { sill, y9, z9: sill.z - (y9 - sill.y) * tumbleTan };
  };
  // A-pillar in plan view: the rail does not follow the glass plane down to the cowl (that
  // puts the pillar base on the shoulder line and kinks it). It sweeps on one smooth curve
  // from the bonnet shut line (lead-in start) to its roof-front position.
  const aPillarZ = (s: number, zTumble: number) => {
    if (s >= cowlS) return zTumble;
    const lead = Math.min(0.42 / Lb, Math.max(0.02, cowlS - hoodFrontS - 0.02));
    const s0 = cowlS - lead;
    if (s <= s0) return zTumble;
    const zH = hoodW * halfWidthAt(s0);
    const zC = railPoint(cowlS).z9;
    const t = clamp((s - s0) / Math.max(1e-3, cowlS - s0), 0, 1);
    // smoothstep ease: leaves the bonnet edge and arrives at the pillar base tangentially
    return zH + (zC - zH) * t * t * (3 - 2 * t);
  };
  // Fastback with spoiler: quarter window = trapezoid. Its top stays level with the side
  // glass top; its rear edge runs parallel to the rear-window side edge, offset forward so
  // the D-pillar has a constant perpendicular width (dPillarWidth).
  const dPillarWidth = 0.16;
  const dShift = dPillarWidth / Math.max(0.3, Math.cos(hatchRake));
  const dLineX0 = xAt(spoilerG0) - dShift;
  const dLineX1 = xAt(rearGlassS) - dShift;
  const dLine = (x: number) => spoilerGlassTop - 0.008
    - ((x - dLineX0) / Math.max(1e-3, dLineX1 - dLineX0)) * (spoilerGlassTop - 0.008 - rearGlassY);
  const dloAt = (s: number): DloStation => {
    const railRawPoint = railPoint(s);
    const { sill, y9 } = railRawPoint;
    const z9 = aPillarZ(s, railRawPoint.z9);
    // Section cuts are at constant x; an inclined pillar is cut obliquely, so widen the
    // section offset by 1/sin(phi) to keep the true (perpendicular) width constant.
    const ds = 0.004;
    const p0 = railPoint(clamp(s - ds, 0, 1));
    const p1 = railPoint(clamp(s + ds, 0, 1));
    const tx = (clamp(s + ds, 0, 1) - clamp(s - ds, 0, 1)) * Lb;
    const ty = p1.y9 - p0.y9;
    const tz = p1.z9 - p0.z9;
    const tl = Math.max(1e-6, Math.hypot(tx, ty, tz));
    const dy = -tumbleCos;
    const dz = tumbleTan * tumbleCos;
    const along = (ty * dy + tz * dz) / tl;
    const sinPhi = Math.sqrt(Math.max(0, 1 - along * along));
    const rearGrowth = hatchback ? 1 : 1 + 0.15 * smoothstep(roofRearS, rearGlassS, s);
    const section = (pillarWidth * rearGrowth) / Math.max(0.55, sinPhi);
    let y8 = y9 - Math.min(section * tumbleCos, Math.max(0.012, (y9 - sill.y) * 0.62));
    if (spoiler) {
      const x = xAt(s);
      const levelTop = Math.min(y8, spoilerGlassTop - 0.008);
      const pillarEdge = dLine(x);
      // soft minimum: rounded window corner where the level top meets the slanted edge
      const k = 0.03;
      let edge = (levelTop + pillarEdge - Math.sqrt((levelTop - pillarEdge) * (levelTop - pillarEdge) + k * k)) / 2;
      // behind the window, row 8 eases back up along the (flat) pillar surface
      const behind = smoothstep(dLineX1, dLineX1 + 0.25, x);
      edge = mix(Math.max(edge, sill.y + 0.012), y8, behind);
      y8 = Math.min(y8, edge);
    }
    const z8Plane = sill.z - (y8 - sill.y) * tumbleTan;
    const z8 = Math.max(z8Plane, z9 + 0.004);
    const top = sill.top;
    const roofInset = Math.min(0.075, Math.max(0.03, z9 * 0.11));
    // Mohawk line on the corner: the rail (row 9 = edge of windshield / roof / backlight)
    // moves a little inboard and up onto the top surface, so the rail band 8 -> 9 wraps round
    // the corner (part side, part top) instead of lying flat in the side-glass plane. The
    // rise follows the existing roof-rail rounding slope, so row 9 lands on the top surface.
    const cornerSlope = clamp((0.58 * Math.max(0, top - y9)) / roofInset, 0, 1.2);
    const wrapIn = Math.min(0.028, Math.max(0, z9 - 0.25) * 0.1);
    const z9w = z9 - wrapIn;
    const y9w = Math.min(top - 0.002, y9 + wrapIn * cornerSlope * 0.9);
    return {
      y7: sill.y,
      z7: sill.z,
      y8,
      z8,
      y9: y9w,
      z9: z9w,
      y10: Math.max(y9w + 0.006, top - (top - y9w) * 0.42),
      z10: z9w - Math.max(0.022, roofInset - wrapIn * 0.5),
    };
  };

  const greenhouse = (s: number) => topAt(s) - beltAt(s);
  let start = cowlS;
  for (let s = cowlS; s < roofRearS; s += 0.002) {
    if (greenhouse(s) >= 0.165) {
      start = s;
      break;
    }
  }
  // Keep a body-colour A-pillar foot (mirror sail) of at least 150 mm behind the windshield
  // base. Cab-forward MPVs otherwise start the side glass exactly at the cowl and the
  // A-pillar root pinches to a point.
  start = Math.max(start, cowlS + 0.15 / Lb);
  let endLimit = roofRearS;
  for (let s = Math.min(0.99, tailDeckS); s > roofRearS; s -= 0.002) {
    if (greenhouse(s) >= 0.165) {
      endLimit = s;
      break;
    }
  }
  // Fastbacks: the side glass runs on under the falling roof (bounded by the minimum
  // greenhouse height), so the DLO tapers into the C-pillar instead of stopping short.
  const endRaw = style.cPillar !== null
    ? Math.min(endLimit, roofRearS + style.cPillar * (rearGlassS - roofRearS))
    : Math.min(endLimit - 0.015, fastback
      ? roofRearS + 0.3 * (rearGlassS - roofRearS)
      : style.dPillar
        ? Math.max(start + 0.2, roofRearS - style.dPillar / Lb)
        : roofRearS + (rearGlassS - roofRearS) * 0.32);
  // Two-row door layouts are anchored to the wheels, not to the length of the side glass
  // (which grows with the backlight angle): SUV rear doors end just behind the rear axle
  // and wrap the arch; MPV sliding doors end ahead of the rear arch. doorSplitPercent
  // divides the door zone between the front and rear door.
  const pillarHalfS = 0.05 / Lb;
  const pillars = style.pillars.length === 0 ? [] : style.pillars.length > 1
    ? (() => {
      const frontDoorEdge = Math.max(arches[0].x + arches[0].lipR + 0.02, xAt(start) - 0.03);
      // SUV rear door: ends ~120 mm behind the axle and wraps the arch (real SUV layout).
      const rearDoorEdge = config.type === "mpv" ? arches[1].x - arches[1].lipR - 0.03 : arches[1].x + (style.cFromAxle ?? 0.12);
      const cS = clamp(sAtX(rearDoorEdge), start + 0.12, spoiler ? sAtX(dLineX0) - 0.04 : endRaw - 3 * pillarHalfS);
      const split = clamp(config.doorSplitPercent / 100, 0.3, 0.7);
      const bS = sAtX(mix(frontDoorEdge, xAt(cS), split));
      // Rear door glass ends at the C-pillar; behind it a quarter window (also on fastbacks).
      return [bS, cS];
    })()
    : [mix(start, endRaw, clamp(config.doorSplitPercent / 100, 0.24, 0.72))];
  // Fastback SUV: a compact quarter window (~0.3 m) behind the C-pillar; its top edge runs
  // down with the roof, parallel to the D-pillar, instead of a long window into the tail.
  const end = spoiler
    ? clamp(sAtX(dLineX1 - 0.015), start + 0.2, rearGlassS - 0.01)
    : fastback && style.pillars.length > 1
      ? Math.min(endRaw, sAtX(arches[1].x + (style.cFromAxle ?? 0.12) + 0.4))
      : endRaw;

  const hw0 = halfWidthAt(0);
  const noseSpan = nose - floor;
  const grilleTaper = clamp((config.grilleTaper ?? 0) / 100, -0.4, 0.4);
  const grilleP = mix(10, 2.2, clamp((config.grilleRoundness ?? 50) / 100, 0, 1));
  const grilleW = Math.min(clamp(config.grilleWidth / 100, 0.4, 0.82) * hw0, (0.84 * hw0) / (1 + Math.abs(grilleTaper)));
  // Layout: the lower intake's height is reserved first (floor clearance + intake + 35 mm
  // web), the main grille sits above it and only shrinks when the face is too short.
  // Lower intake: trapezoid, wider at the bottom and open into the lower body edge.
  const lowerBottom = floor + 0.025;
  const mainTopLimit = nose - 0.07;
  let lowerHalf = config.hasLowerGrille ? clamp((config.lowerGrilleHeight ?? 90) / 1000, 0.04, 0.2) / 2 : 0;
  if (config.hasLowerGrille && config.hasGrille) {
    const spare = mainTopLimit - (lowerBottom + 2 * lowerHalf + 0.035) - 2 * 0.035;
    if (spare < 0) lowerHalf = Math.max(0.02, lowerHalf + spare / 2);
  }
  const mainBottomLimit = config.hasLowerGrille && config.hasGrille ? lowerBottom + 2 * lowerHalf + 0.035 : floor + 0.05;
  let gh = clamp(config.grilleHeight / 100, 0.1, 0.42) * noseSpan;
  gh = Math.max(0.035, Math.min(gh, (mainTopLimit - mainBottomLimit) / 2));
  const gc = clamp(floor + style.grille.c * noseSpan + clamp(config.grilleOffset ?? 0, -150, 150) / 1000,
    mainBottomLimit + gh, Math.max(mainBottomLimit + gh, mainTopLimit - gh));
  const lowerTop = config.hasGrille ? gc - gh - 0.035 : nose - 0.13;
  const lowerH = Math.min(lowerHalf, (lowerTop - lowerBottom) / 2);
  const lowerTaper = clamp((config.lowerGrilleTaper ?? 28) / 100, 0, 0.5);
  const lowerGrille: GrilleShape | null = config.hasLowerGrille && lowerH > 0.018
    ? {
      gw: (clamp((config.lowerGrilleWidth ?? 70) / 100, 0.3, 0.95) * hw0 * 0.9) / (1 + lowerTaper),
      gh: lowerH,
      gc: lowerBottom + lowerH,
      p: 6,
      taper: lowerTaper,
      openBottom: true,
    }
    : null;

  // Glass alignment: windshield top and rear-window top level with the highest point of the
  // side glass (+8 mm SubD compensation); found on the centre-line profile.
  let sideTopMax = -Infinity;
  for (let i = 0; i <= 48; i += 1) sideTopMax = Math.max(sideTopMax, dloAt(mix(start, end, i / 48)).y8);
  const glassTopY = sideTopMax + 0.008;
  let windshieldTopS = roofFrontS;
  for (let sScan = cowlS + 0.04; sScan < roofFrontS; sScan += 0.0005) {
    if (topAt(sScan) >= glassTopY) {
      windshieldTopS = sScan;
      break;
    }
  }
  let rearGlassTopS = rearGlassTopFallback;
  // Upright backlights lose more height to the SubD limit along their side edges.
  const rearTopY = glassTopY + (hatchback && !fastback ? 0.02 : 0);
  for (let sScan = roofRearS; sScan < rearGlassS - 0.002; sScan += 0.0002) {
    if (topAt(sScan) <= rearTopY) {
      rearGlassTopS = Math.max(sScan, roofRearS + 0.0012);
      break;
    }
  }

  // Glass edges bowed in plan view, parallel to the nose / tail: inside the windshield and
  // rear-window bands the centre is displaced towards that end (up to bowFront / bowRear),
  // easing in and out over 0.25 m so section spacing never folds. Rail rows stay put.
  const bowFront = 0.07;
  const bowRear = hatchback ? 0.04 : 0.05;
  const easeS = 0.25 / Lb;
  const band = (s: number, a: number, b: number) =>
    smoothstep(a - easeS, a, s) * (1 - smoothstep(b, b + easeS, s));
  const glassBowX = (s: number, z: number) => {
    const wF = band(s, cowlS, windshieldTopS);
    const wR = band(s, rearGlassTopS, rearGlassS) * (1 - smoothstep(0.975, 0.995, s));
    if (wF < 1e-4 && wR < 1e-4) return 0;
    const sRef = clamp(s, cowlS, rearGlassS);
    const zRail = Math.max(0.2, dloAt(sRef).z9);
    const zn = clamp(Math.abs(z) / zRail, 0, 1);
    const shape = 1 - zn * zn;
    return (-bowFront * wF + bowRear * wR) * shape;
  };

  return {
    type: config.type,
    style,
    L,
    W,
    H,
    Lb,
    floor,
    rockerTop,
    belt,
    nose,
    tailTop: topAt(1),
    crown: 0.025 + 0.035 * clamp(config.hoodDome / 90, 0, 1),
    pillarDrop: 0.05,
    xAt,
    sAtX,
    topAt,
    halfWidthAt,
    beltAt,
    cabinAt,
    cowlS,
    hoodEndS,
    hoodFrontS,
    hoodW,
    hoodEdgeDrop: clamp(config.hoodEdgeDrop / 1000, 0, 0.1),
    hoodDomeAt,
    frontBow,
    rearBow,
    frontRecess,
    rearRecess,
    frontReach,
    rearReach,
    roofFrontS,
    roofRearS,
    rearGlassS,
    rearGlassTopS,
    windshieldTopS,
    spoilerTipS: spoiler ? spoilerTip : -1,
    tailS0,
    tailFillet,
    shoulderAt,
    pillarAt,
    dloAt,
    archWarp,
    glassBowX,
    fenderPeakAt,
    tailDeckS,
    hatchback,
    rearGlassBottom: rearGlassY,
    arches,
    glass: { start, end, pillars, pillarHalf: 0.05 / Lb },
    grille: { gw: grilleW, gh, gc, p: grilleP, taper: grilleTaper },
    lowerGrille,
  };
}

/* ------------------------------------------------------------------ */
/* Section stations                                                    */
/* ------------------------------------------------------------------ */

function makeStations(frame: VehicleFrame, density: CageDensity) {
  const entries: Array<{ s: number; priority: number; arch?: boolean; tail?: boolean; glass?: boolean }> = [];
  const push = (s: number, priority: number, arch = false, tail = false, glass = false) => {
    if (s >= 0 && s <= 1) entries.push({ s, priority, arch, tail, glass });
  };
  push(0, 10);
  push(1, 11);
  push(0.03, 4);
  push(0.97, 4);
  const archSegments = density === "compact" ? 4 : density === "detailed" ? 8 : 6;
  for (const archFrame of frame.arches) {
    for (let segment = 0; segment <= archSegments; segment += 1) {
      const angle = (Math.PI * segment) / archSegments;
      push(archFrame.s + archHorizontal(archFrame.rc, angle, 2) / frame.Lb, 9, true);
    }
  }
  push(frame.cowlS, 8);
  push(frame.hoodFrontS, 8);
  push(mix(frame.hoodFrontS, frame.hoodEndS, 0.5), 5);
  if (density === "detailed") {
    push(mix(frame.hoodFrontS, frame.hoodEndS, 0.25), 4);
    push(mix(frame.hoodFrontS, frame.hoodEndS, 0.78), 4);
  }
  push(frame.hoodEndS, 7);
  push(frame.roofFrontS, 8);
  push(frame.windshieldTopS, 10);
  if (frame.spoilerTipS > 0) {
    push(frame.spoilerTipS, 10, false, false, true);
    // quarter-window top-rear corner and two stations down its slanted rear edge
    const corner = frame.rearGlassTopS - (frame.rearGlassS - frame.glass.end);
    for (const t of [0, 0.34, 0.67]) push(mix(corner, frame.glass.end, t), 7);
  }
  push((frame.roofFrontS + frame.roofRearS) / 2, 4);
  push(frame.roofRearS, 8);
  // Backlight landmarks may sit close together in x on upright tailgates (they are far
  // apart along the surface), so they use the fine spacing rule.
  push(frame.roofRearS, 10, false, false, frame.hatchback);
  push(frame.rearGlassTopS, 10, false, false, frame.hatchback);
  push(frame.rearGlassS, 10, false, false, frame.hatchback);
  // Upright backlights are short in x but tall: distribute rings by true arc length
  // (~130 mm) so the glass is several quads tall and does not shrink to an oval.
  {
    const span = frame.rearGlassS - frame.rearGlassTopS;
    const arc = Math.hypot(span * frame.Lb, frame.topAt(frame.rearGlassTopS) - frame.topAt(frame.rearGlassS));
    const target = density === "compact" ? 0.19 : density === "detailed" ? 0.1 : 0.13;
    // Cap by true arc length (>= 50 mm per row), not by body-length s: upright backlights
    // are short in x but tall, and need several rows to keep a rounded-rectangle opening.
    const count = clamp(Math.ceil(arc / target), 2, Math.max(2, Math.floor(arc / 0.05)));
    for (let step = 1; step < count; step += 1) push(frame.rearGlassTopS + (span * step) / count, 9, false, false, true);
  }
  // Quarter-ellipse tail fillet: equal angle steps, so rings bunch up towards the end face.
  const tailSteps = density === "compact" ? 3 : density === "detailed" ? 5 : 4;
  for (let step = 0; step <= tailSteps; step += 1) {
    push(frame.tailS0 + (1 - frame.tailS0) * Math.sin((step / tailSteps) * Math.PI / 2), 9, false, true);
  }
  push(frame.tailDeckS, 6);
  if (frame.glass.end > frame.glass.start) {
    push(frame.glass.start, 7);
    push(frame.glass.end, 7);
    for (const pillar of frame.glass.pillars) {
      push(pillar - frame.glass.pillarHalf, 7);
      push(pillar + frame.glass.pillarHalf, 7);
    }
  }
  entries.sort((a, b) => a.s - b.s);

  const kept: typeof entries = [];
  for (const entry of entries) {
    const last = kept[kept.length - 1];
    // Glass stations merge by true distance along the profile (x and height), so rows on an
    // upright backlight are not collapsed just because they are close in x.
    const profileGap = last ? Math.hypot((entry.s - last.s) * frame.Lb, frame.topAt(entry.s) - frame.topAt(last.s)) : Infinity;
    const glassPair = last && last.glass && entry.glass;
    const minimum = last && (last.glass || entry.glass)
      ? (glassPair ? (profileGap < 0.035 ? Infinity : 0) : ((entry.s - last.s) * frame.Lb < 0.012 || profileGap < 0.045 ? Infinity : 0))
      : last && last.tail && entry.tail ? 0.002 : last && last.arch && entry.arch ? 0.005 : 0.008;
    if (last && entry.s - last.s < minimum) {
      if (entry.priority > last.priority) kept[kept.length - 1] = entry;
    } else {
      kept.push(entry);
    }
  }

  const stations: number[] = [];
  const baseSpacing = density === "compact" ? 0.34 : density === "detailed" ? 0.16 : 0.24;
  const localSpacing = (s: number) => {
    const ds = 0.012;
    const xSpan = 2 * ds * frame.Lb;
    const topSlope = (frame.topAt(s + ds) - frame.topAt(s - ds)) / xSpan;
    const shoulderSlope = (frame.topAt(s + 2 * ds) - 2 * frame.topAt(s) + frame.topAt(s - 2 * ds)) / (4 * ds * frame.Lb);
    const widthSlope = (frame.halfWidthAt(s + ds) - frame.halfWidthAt(s - ds)) / xSpan;
    const change = Math.abs(shoulderSlope) * 0.42 + Math.abs(topSlope) * 0.12 + Math.abs(widthSlope) * 0.1;
    return baseSpacing / (1 + Math.min(1.15, change));
  };
  kept.forEach((entry, index) => {
    if (index > 0) {
      const previous = kept[index - 1].s;
      const gap = entry.s - previous;
      const spacing = localSpacing((previous + entry.s) / 2);
      const count = Math.ceil(gap * frame.Lb / spacing);
      for (let j = 1; j < count; j += 1) stations.push(previous + (gap * j) / count);
    }
    stations.push(entry.s);
  });
  return stations;
}

/* ------------------------------------------------------------------ */
/* Section profile (11 control points per side)                        */
/*  0 floor centre   1 rocker bottom   2 rocker / arch  3 arch lip     */
/*  4 door middle    5 feature line    6 shoulder       7 glass sill   */
/*  8 glass top      9 roof rail      10 roof side     11 roof centre  */
/* ------------------------------------------------------------------ */

function sectionHalf(frame: VehicleFrame, config: VehicleConfig, s: number): Array<[number, number]> {
  const style = frame.style;
  const x = frame.xAt(s);
  const top = frame.topAt(s);
  const hw = frame.halfWidthAt(s);
  const belt = frame.beltAt(s);
  const hard = clamp(config.surfaceHardness / 100, 0, 1);
  const floor = frame.floor;
  const rockerBottom = floor + 0.028;
  const rockerTop = frame.rockerTop;

  let y3 = rockerTop;
  let y4 = rockerTop + 0.085;
  let flareDistance = 0;
  const xLip = frame.archWarp(x, 1);
  for (const arch of frame.arches) {
    const dx = Math.abs(x - arch.x);
    const dxLip = Math.abs(xLip - arch.x);
    if (dx <= arch.rc + 1e-5) {
      y3 = Math.max(rockerTop - 0.035, arch.cy + archHalfHeight(dx, arch.rc, 2));
    }
    if (dxLip < arch.lipR) {
      const lipHeight = arch.cy + archHalfHeight(dxLip, arch.lipR, arch.power);
      const blendWidth = Math.min(0.16, arch.lipR * 0.24);
      const fade = 1 - smoothstep(arch.lipR - blendWidth, arch.lipR, dxLip);
      y4 = smoothMax(y4, mix(y4, lipHeight, fade), 0.004);
    }
    const influence = 1 - smoothstep(arch.lipR - 0.04, arch.lipR + 0.25, dx);
    flareDistance = Math.max(flareDistance, arch.flare * influence);
  }

  const hoodZone = 1 - smoothstep(frame.cowlS - 0.01, frame.cowlS + 0.045, s);
  const hoodSpan = Math.max(0.025, frame.hoodEndS - frame.hoodFrontS);
  const hoodT = clamp((s - frame.hoodFrontS) / hoodSpan, 0, 1);
  const broadSwell = 0 * hoodT;
  const dome = (frame.hoodDomeAt(s) + broadSwell) * hoodZone;
  const hoodW = frame.hoodW;
  const edgeDrop = frame.hoodEdgeDrop * hoodZone * smoothstep(frame.hoodFrontS * 0.4, frame.hoodFrontS * 1.7, s);
  const deckYAt = (zf: number, base: number) =>
    base
    + dome * (1 - zf * zf)
    - frame.crown * zf * zf
    - edgeDrop * smoothstep(hoodW - 0.02, hoodW + 0.1, zf);
  const deckY = (zf: number) => deckYAt(zf, top);
  const g = frame.cabinAt(s);
  const gSide = frame.shoulderAt(s);
  const topSide = s > frame.cowlS && s < frame.roofRearS ? frame.topAt(frame.cowlS) : top;
  const shoulderZ = style.shoulder - 0.018 * hard;
  const fenderMid = (hoodW + 0.93) / 2;
  const deck: Array<[number, number]> = [
    [0.985, deckYAt(0.985, topSide) - 0.022],
    [0.93, deckYAt(0.93, topSide)],
    [fenderMid, deckY(fenderMid)],
    [hoodW, deckY(hoodW)],
    [hoodW * 0.5, deckY(hoodW * 0.5)],
    [0, deckY(0)],
  ];
  const y8c = Math.min(belt + 0.014, top - 0.075);
  // Greenhouse rows come from one constant-tumblehome DLO: sill (7), glass top (8) and
  // mohawk rail (9) are collinear in every section, so the side glass never twists; the
  // rail is a smooth arc in side view and, through the tumblehome, in plan view as well.
  const dlo = frame.dloAt(s);
  // Shoulder line: ahead of the side glass the fender shoulder (rows 6-7) must not ride up
  // with a steep one-motion bonnet; it continues horizontally under the A-pillar foot and
  // the bonnet rises inboard of it (soft minimum, so no crease where the cap engages).
  const softMin = (a: number, b: number, k = 0.06) => (a + b - Math.sqrt((a - b) * (a - b) + k * k)) / 2;
  const shoulderCabinY = Math.min(belt - 0.012, y8c - 0.026);
  deck[0][1] = softMin(deck[0][1], shoulderCabinY + 0.03);
  deck[1][1] = softMin(deck[1][1], dlo.y7 + 0.03);
  const cabin: Array<[number, number]> = [
    [shoulderZ, shoulderCabinY],
    [dlo.z7 / hw, dlo.y7],
    [dlo.z8 / hw, dlo.y8],
    [dlo.z9 / hw, dlo.y9],
    [dlo.z10 / hw, dlo.y10],
    [0, top],
  ];
  // Rail (row 9) and roof-side (row 10) share one blend behind the roof, otherwise they
  // descend at different rates along the C-pillar and the backlight edge twists.
  const gPillar = frame.pillarAt(s);
  const gFoot = Math.max(gSide * 0.35, gPillar);
  const blendOf = (index: number) => (index <= 1 ? (s < frame.cowlS + 0.2 ? gFoot : gSide)
    : index <= 3 ? gPillar
      : index === 4 && s > frame.roofRearS ? gSide : g);
  const upper = deck.map(([zd, yd], index) => [
    mix(zd, cabin[index][0], blendOf(index)) * hw,
    mix(yd, cabin[index][1], blendOf(index)),
  ] as [number, number]);
  upper[upper.length - 1] = [0, mix(deckY(0), top, g)];
  for (let i = upper.length - 2; i >= 0; i -= 1) {
    if (i >= 3 || g > 0.5) upper[i][1] = Math.min(upper[i][1], upper[i + 1][1] - 0.004);
    upper[i][0] = Math.max(upper[i][0], upper[i + 1][0] + 0.004);
  }
  // Support the arch with a broad falloff instead of switching fender heights
  // at a fixed wheel-zone boundary; preserve the opening's circular control row.
  const archInfluence = Math.max(...frame.arches.map((arch) =>
    1 - smoothstep(arch.lipR - 0.04, arch.lipR + 0.18, Math.abs(x - arch.x))));
  y4 = smoothMax(y4, y3 + 0.027, 0.005);
  const fenderTarget = y4 + 0.062 * archInfluence;
  const lift = Math.min(
    Math.max(0, smoothMax(upper[0][1], fenderTarget, 0.009) - upper[0][1]),
    Math.max(0, upper[5][1] - upper[0][1] - 0.048),
  );
  const liftWeights = [1, 0.93, 0.73, 0.46, 0.18];
  liftWeights.forEach((weight, index) => { upper[index][1] += lift * weight; });
  for (let index = 1; index < upper.length - 1; index += 1) {
    upper[index][1] = Math.max(upper[index][1], upper[index - 1][1] + 0.004);
  }
  const peak = frame.fenderPeakAt(s) * (1 - g);
  if (peak > 1e-4) {
    const zfOf = [0.985, 0.93, fenderMid, hoodW, hoodW * 0.5, 0];
    upper.forEach((point, index) => {
      point[1] += peak * smoothstep(hoodW * 0.55, fenderMid, zfOf[index]);
    });
  }
  const y7 = upper[0][1];
  const y6 = Math.min(y7 - 0.022, smoothMax(
    Math.min(belt - style.featureDrop, y7 - 0.045), y4 + 0.048, 0.008,
  ));
  const y5 = clamp(mix(y4, y6, 0.5), y4 + 0.022, y6 - 0.022);
  y3 = Math.max(y3, rockerBottom + 0.03);
  const flare = flareDistance / Math.max(hw, 0.001);
  const bulge = (0.008 * (config.sideTrend - 50)) / 50;
  const [frontArch, rearArch] = frame.arches;
  const doorStart = frontArch.x + frontArch.lipR;
  const doorEnd = rearArch.x - rearArch.lipR;
  const doorInfluence = smoothstep(doorStart - 0.08, doorStart + 0.3, x)
    * (1 - smoothstep(doorEnd - 0.3, doorEnd + 0.08, x));
  const doorHollow = clamp(config.sideSculpt / 100, 0, 1) * 0.055 * doorInfluence;

  const profile: Array<[number, number]> = [
    [0, floor],
    // Underbody is open: this row is the turned-in lower return of the rocker.
    [0.915 * hw, floor + 0.016],
    [(0.988 + flare * 0.9) * hw, y3],
    [(1 + flare) * hw, y4],
    [(1 + bulge + flare * 0.35) * hw - doorHollow, y5],
    [(1.012 + bulge * 0.5) * hw, y6],
    ...upper,
  ];
  // Towards the tail, spread the two lower-corner rows evenly along the outline between
  // the floor centre and the side wall, so the 3-segment bottom of the end face is fed by
  // regular quads instead of one long flat segment plus two bunched corner points.
  const respace = smoothstep(frame.tailS0 - 0.01, 1, s);
  if (respace > 0) {
    const path = [profile[0], profile[1], profile[2], profile[3]];
    const cumulative = [0];
    for (let index = 1; index < path.length; index += 1) {
      cumulative.push(cumulative[index - 1] + Math.hypot(path[index][0] - path[index - 1][0], path[index][1] - path[index - 1][1]));
    }
    const pointAt = (fraction: number): [number, number] => {
      const distance = fraction * cumulative[3];
      let segment = 0;
      while (segment < 2 && distance > cumulative[segment + 1]) segment += 1;
      const span = Math.max(1e-9, cumulative[segment + 1] - cumulative[segment]);
      const t = clamp((distance - cumulative[segment]) / span, 0, 1);
      return [mix(path[segment][0], path[segment + 1][0], t), mix(path[segment][1], path[segment + 1][1], t)];
    };
    [1, 2].forEach((row) => {
      const target = pointAt(row / 3);
      profile[row] = [mix(profile[row][0], target[0], respace), mix(profile[row][1], target[1], respace)];
    });
  }
  // Hatchbacks: behind the side glass, spread rows 4-8 evenly along the outline between
  // the arch-lip row and the D-pillar rail, so the side lines wrap the rear corner evenly
  // and meet the evenly spaced side of the rear face (no sheared "X" quads at the corner).
  if (frame.hatchback) {
    // Blend across the whole D-pillar (glass end -> tail), not just the short tail fillet:
    // rows then move a little per station instead of jumping, so the pillar quads stay square.
    const wrapStart = Math.min(frame.glass.end + 0.004, frame.tailS0 - 0.004);
    const wrapRaw = clamp((s - wrapStart) / Math.max(1e-3, 1 - wrapStart), 0, 1);
    const wrap = wrapRaw * wrapRaw * (3 - 2 * wrapRaw) * (frame.type === "micro" || frame.type === "suv" || frame.type === "mpv" ? 1 : 0);
    if (wrap > 0) {
      // Rows 7-9 (sill, glass top, rail) are the beltline/pillar and wrap at their own height;
      // only the lower side rows 4-6 are evened out between the lip row (3) and the sill (7).
      const path = profile.slice(3, 8);
      const cumulative = [0];
      for (let index = 1; index < path.length; index += 1) {
        cumulative.push(cumulative[index - 1] + Math.hypot(path[index][0] - path[index - 1][0], path[index][1] - path[index - 1][1]));
      }
      const total = cumulative[cumulative.length - 1];
      const at = (distance: number): [number, number] => {
        let segment = 0;
        while (segment < path.length - 2 && distance > cumulative[segment + 1]) segment += 1;
        const span = Math.max(1e-9, cumulative[segment + 1] - cumulative[segment]);
        const t = clamp((distance - cumulative[segment]) / span, 0, 1);
        return [mix(path[segment][0], path[segment + 1][0], t), mix(path[segment][1], path[segment + 1][1], t)];
      };
      const targets = [4, 5, 6].map((row) => at((total * (row - 3)) / 4));
      [4, 5, 6].forEach((row, index) => {
        profile[row] = [mix(profile[row][0], targets[index][0], wrap), mix(profile[row][1], targets[index][1], wrap)];
      });
    }
  }
  const tail = frame.tailFillet(s);
  if (tail.z > 0 || tail.y > 0) {
    const centreY = (profile[0][1] + profile[profile.length - 1][1]) / 2;
    profile.forEach((point) => {
      point[0] *= 1 - tail.z;
      // Hatchbacks: the upper tail is already shaped by the side-view tailgate arc, so the
      // vertical roll only rounds the lower (bumper) corner.
      if (!frame.hatchback || point[1] < centreY) point[1] = centreY + (point[1] - centreY) * (1 - tail.y);
    });
  }
  return profile;
}

function ringFromHalf(half: Array<[number, number]>, x: number): Point3[] {
  const ring: Point3[] = [];
  for (let k = 0; k < RING_COUNT; k += 1) {
    const h = k <= HALF ? k : RING_COUNT - k;
    const side = k <= HALF ? 1 : -1;
    ring.push([x, half[h][1], half[h][0] * side]);
  }
  return ring;
}

function newell(points: Point3[]) {
  const normal = new THREE.Vector3();
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    normal.x += (current[1] - next[1]) * (current[2] + next[2]);
    normal.y += (current[2] - next[2]) * (current[0] + next[0]);
    normal.z += (current[0] - next[0]) * (current[1] + next[1]);
  }
  return normal;
}

/** Coons-patch grid fill of the perimeter loop into an all-quad cap. */
function gridFill(
  vertices: Point3[],
  ring: number[],
  a: number,
  b: number,
  offset: (u: number, v: number) => Point3,
  expected: Point3,
  relaxIterations = 0,
  gridOutput?: number[][],
) {
  const n = ring.length;
  const M = 2 * a;
  const K = b - a;
  const idx = (i: number) => ring[((i % n) + n) % n];
  const grid: number[][] = Array.from({ length: M + 1 }, () => new Array<number>(K + 1).fill(-1));
  for (let u = 0; u <= M; u += 1) {
    grid[u][0] = idx(n - a + u);
    grid[u][K] = idx(n - b - u);
  }
  for (let v = 0; v <= K; v += 1) {
    grid[0][v] = idx(n - a - v);
    grid[M][v] = idx(a + v);
  }
  const P = (i: number) => vertices[i];
  for (let u = 1; u < M; u += 1) {
    for (let v = 1; v < K; v += 1) {
      const uu = u / M;
      const vv = v / K;
      const B = P(grid[u][0]);
      const T = P(grid[u][K]);
      const Lp = P(grid[0][v]);
      const R = P(grid[M][v]);
      const c00 = P(grid[0][0]);
      const c10 = P(grid[M][0]);
      const c01 = P(grid[0][K]);
      const c11 = P(grid[M][K]);
      const o = offset(uu, vv);
      const point = [0, 1, 2].map((c) =>
        (1 - vv) * B[c] + vv * T[c] + (1 - uu) * Lp[c] + uu * R[c] -
        ((1 - uu) * (1 - vv) * c00[c] + uu * (1 - vv) * c10[c] + (1 - uu) * vv * c01[c] + uu * vv * c11[c]) +
        o[c],
      ) as Point3;
      grid[u][v] = vertices.length;
      vertices.push(point);
    }
  }
  for (let iteration = 0; iteration < relaxIterations; iteration += 1) {
    const next: Array<[number, Point3]> = [];
    for (let u = 1; u < M; u += 1) {
      for (let v = 1; v < K; v += 1) {
        const index = grid[u][v];
        const adjacent = [grid[u - 1][v], grid[u + 1][v], grid[u][v - 1], grid[u][v + 1]];
        const center = average(adjacent.map((neighbor) => vertices[neighbor]));
        next.push([index, blend(vertices[index], center, 0.42)]);
      }
    }
    next.forEach(([index, point]) => { vertices[index] = point; });
  }
  if (gridOutput) gridOutput.push(...grid.map((row) => [...row]));
  const faces: number[][] = [];
  for (let u = 0; u < M; u += 1) {
    for (let v = 0; v < K; v += 1) {
      faces.push([grid[u][v], grid[u + 1][v], grid[u + 1][v + 1], grid[u][v + 1]]);
    }
  }
  const sample = faces[Math.floor(faces.length / 2)];
  const normal = newell(sample.map((i) => vertices[i]));
  if (normal.x * expected[0] + normal.y * expected[1] + normal.z * expected[2] < 0) {
    faces.forEach((face) => face.reverse());
  }
  return faces;
}

/**
 * Closed (grille-less) front: fascia ring -> regular rectangle loop -> 7 x 6 quad grid.
 * Every control point is placed on one continuous convex front surface (domeX), so the
 * rectangle loop is only a wiring guide and never becomes a recessed "frame".
 */
function fillFaceOnDome(
  vertices: Point3[],
  outerBase: number,
  rectHalf: Array<[number, number]>,
  domeX: (z: number, y: number) => number,
  gridOutput: number[][],
  expected: Point3 = [-1, 0, 0],
  flip = false,
): number[][] {
  const faceRingBase = vertices.length;
  const regularRing = ringFromHalf(rectHalf, 0);
  regularRing.forEach((point) => { point[0] = domeX(point[2], point[1]); });
  vertices.push(...regularRing);

  const faces: number[][] = [];
  for (let ring = 0; ring < RING_COUNT; ring += 1) {
    const next = (ring + 1) % RING_COUNT;
    const band = [outerBase + ring, outerBase + next, faceRingBase + next, faceRingBase + ring];
    faces.push(flip ? band.reverse() : band);
  }
  const panelStart = vertices.length;
  const panelRing = Array.from({ length: RING_COUNT }, (_, ring) => faceRingBase + ring);
  faces.push(...gridFill(vertices, panelRing, 3, HALF - 3, () => [0, 0, 0], expected, 0, gridOutput));
  for (let index = panelStart; index < vertices.length; index += 1) {
    const point = vertices[index];
    point[0] = domeX(point[2], point[1]);
  }
  return faces;
}

/* ------------------------------------------------------------------ */
/* Control cage                                                        */
/* ------------------------------------------------------------------ */

export function buildControlMesh(config: VehicleConfig): ControlMesh {
  const frame = getVehicleFrame(config);
  const N = RING_COUNT;
  const sections = makeStations(frame, config.cageDensity);
  const S = sections.length;
  const vertices: Point3[] = [];
  const halves = sections.map((s) => sectionHalf(frame, config, s));
  const guideHalves = halves.map((half) => half.map((point) => [...point] as [number, number]));
  // Relax longitudinal guide rows without moving hard landmarks or circular arch edges.
  const landmarks = [frame.cowlS, frame.hoodFrontS, frame.hoodEndS, frame.roofFrontS, frame.roofRearS, frame.rearGlassS];
  for (let index = 1; index < sections.length - 1; index += 1) {
    const s = sections[index];
    const anchored = landmarks.some((landmark) => Math.abs(s - landmark) < 0.008)
      || frame.glass.pillars.some((pillar) => Math.abs(s - pillar) < frame.glass.pillarHalf * 1.3);
    if (anchored) continue;
    const ratio = (s - sections[index - 1]) / (sections[index + 1] - sections[index - 1]);
    const nearArch = frame.arches.some((arch) => Math.abs(frame.xAt(s) - arch.x) < arch.lipR + 0.08);
    // Greenhouse rows are already a smooth, constant-tumblehome DLO in the cabin; relaxing
    // them against bonnet/deck neighbours would re-introduce twist at the glass corners.
    const lastRelaxedRow = frame.shoulderAt(s) > 0.01 ? 6 : 10;
    for (let row = 4; row <= lastRelaxedRow; row += 1) {
      for (let coordinate = 0; coordinate <= 1; coordinate += 1) {
        const guide = mix(guideHalves[index - 1][row][coordinate], guideHalves[index + 1][row][coordinate], ratio);
        halves[index][row][coordinate] = mix(halves[index][row][coordinate], guide, nearArch ? 0.1 : 0.18);
      }
    }
  }
  sections.forEach((s, index) => {
    const ring = ringFromHalf(halves[index], frame.xAt(s));
    // curved glass edges (plan view): only the inner roof/glass rows 10-12 move
    for (const k of [HALF - 1, HALF, HALF + 1]) ring[k][0] += frame.glassBowX(s, ring[k][2]);
    // Lip loop (row 3) fully re-timed, door-middle row (4) half way: concentric arch bands.
    const x = frame.xAt(s);
    const lipX = frame.archWarp(x, 1);
    const midX = frame.archWarp(x, 0.5);
    ring[3][0] = lipX;
    ring[N - 3][0] = lipX;
    ring[4][0] = midX;
    ring[N - 4][0] = midX;
    vertices.push(...ring);
  });

  // Curve the front and rear faces: recess fades out towards the wheel arches.
  const frontShift = (point: Point3) => frame.frontRecess(point[2], point[1]);
  const rearShift = (point: Point3) => frame.rearRecess(point[2], point[1]);
  // Normalise so the least-recessed loop point of each end face stays exactly on ±L/2.
  const frontDatum = Math.min(...Array.from({ length: N }, (_, k) => frontShift(vertices[k])));
  const rearDatum = Math.min(...Array.from({ length: N }, (_, k) => rearShift(vertices[(S - 1) * N + k])));
  sections.forEach((s, index) => {
    const wFront = 1 - smoothstep(0, frame.frontReach, s);
    const wRear = 1 - smoothstep(0, frame.rearReach, 1 - s);
    for (let k = 0; k < N; k += 1) {
      const point = vertices[index * N + k];
      if (wFront > 0) point[0] += wFront * (frontShift(point) - frontDatum);
      if (wRear > 0) point[0] -= wRear * (rearShift(point) - rearDatum);
    }
  });

  // Front: one continuous convex front surface drives every front control point.
  const half0 = halves[0];
  const hw0 = frame.halfWidthAt(0);
  const top0 = half0[HALF][1];
  const frontYC = (frame.floor + top0) / 2;
  const frontHH = Math.max(0.1, (top0 - frame.floor) / 2);
  const bumperDepth = clamp(config.bumperDepth / 1000, 0, 0.06);
  // Forward volume: zero on the body perimeter, peaks in the middle of the face. The
  // lower band adds bumper volume. Its amplitude is solved below so the most forward
  // control point is always exactly at -L/2 (overall length is preserved).
  const bulgeShape = (z: number, y: number) => {
    const zn = clamp(Math.abs(z) / Math.max(0.05, hw0), 0, 1.1);
    const yn = clamp((y - frontYC) / frontHH, -1.2, 1.2);
    const lateral = Math.max(0, 1 - zn * zn * zn * zn);
    const vertical = Math.max(0, 1 - yn * yn);
    return lateral * vertical * (1 + (bumperDepth / 0.03) * 0.6 * Math.exp(-Math.pow((yn + 0.35) / 0.5, 2)));
  };
  const domeBase = (z: number, y: number) => frame.xAt(0) + frame.frontRecess(z, y) - frontDatum;
  let bulgeAmount = 0;
  let solveDome: Array<[number, number]> = [];
  const domeX = (z: number, y: number) => domeBase(z, y) - bulgeAmount * bulgeShape(z, y);
  const atDome = (half: Array<[number, number]>, inset = 0) => {
    const ring = ringFromHalf(half, 0);
    ring.forEach((point) => { point[0] = domeX(point[2], point[1]) + inset; });
    return ring;
  };

  const lengths = [0];
  for (let k = 1; k <= HALF; k += 1) {
    lengths.push(lengths[k - 1] + Math.hypot(half0[k][0] - half0[k - 1][0], half0[k][1] - half0[k - 1][1]));
  }
  const total = lengths[HALF];
  const { gw, gh, gc, p, taper } = frame.grille;
  const openingHalf = half0.map((_, k) => {
    const phi = -Math.PI / 2 + (Math.PI * lengths[k]) / total;
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    const yn = Math.sign(sn) * Math.abs(sn) ** (2 / p);
    return [gw * (1 - taper * yn) * Math.sign(c) * Math.abs(c) ** (2 / p), gc + gh * yn] as [number, number];
  });
  // Regular rectangle guide for the closed front (bottom 3 / side 5 / top 3 segments).
  const rectBottom = frame.floor + Math.max(0.06, (top0 - frame.floor) * 0.16);
  const rectTop = top0 - Math.max(0.06, (top0 - frame.floor) * 0.16);
  const rectWidth = Math.min(hw0 * 0.74, Math.abs(half0[3][0]) * 0.86);
  const rectHalf: Array<[number, number]> = [];
  for (let ring = 0; ring <= HALF; ring += 1) {
    if (ring <= 3) rectHalf.push([rectWidth * ring / 3, rectBottom]);
    else if (ring <= 8) rectHalf.push([rectWidth, mix(rectBottom, rectTop, (ring - 3) / 5)]);
    else rectHalf.push([rectWidth * (11 - ring) / 3, rectTop]);
  }
  const innerHalf = config.hasGrille ? openingHalf : rectHalf;
  const fasciaHalf = half0.map(([z, y], k) =>
    [mix(z, innerHalf[k][0], config.hasGrille ? 0.36 : 0.45), mix(y, innerHalf[k][1], config.hasGrille ? 0.36 : 0.45)] as [number, number]);
  const surroundHalf = fasciaHalf.map(([z, y], k) => [mix(z, openingHalf[k][0], 0.62), mix(y, openingHalf[k][1], 0.62)] as [number, number]);
  // Inner return flange of the grille opening: real cars wrap the skin inwards.
  const returnHalf = openingHalf.map(([z, y]) => [z * 0.965, mix(y, gc, 0.045)] as [number, number]);

  // Only points that sit ON the dome take part in the length solve; the grille opening edge
  // is set back behind the surround (lip), so it must not define the frontmost point.
  solveDome = [...fasciaHalf, ...surroundHalf];
  if (!config.hasGrille) {
    solveDome.push(...rectHalf);
    for (let u = 0; u <= 6; u += 1) {
      for (let v = 0; v <= 5; v += 1) solveDome.push([rectWidth * (u - 3) / 3, mix(rectBottom, rectTop, v / 5)]);
    }
  }
  {
    let low = -0.3;
    let high = 0.3;
    const frontMost = (amount: number) => Math.min(...solveDome.map(([z, y]) => domeBase(z, y) - amount * bulgeShape(z, y)));
    for (let iteration = 0; iteration < 48; iteration += 1) {
      const middle = (low + high) / 2;
      if (frontMost(middle) > -frame.L / 2) low = middle;
      else high = middle;
    }
    bulgeAmount = (low + high) / 2;
  }
  const fBase = vertices.length;
  vertices.push(...atDome(fasciaHalf));
  const surroundBase = vertices.length;
  vertices.push(...atDome(surroundHalf));
  const oBase = vertices.length;
  // The opening edge is set back from the surround so the grille reads with a defined lip.
  const openingRing = atDome(openingHalf, 0.016);
  vertices.push(...openingRing);
  const returnBase = vertices.length;
  vertices.push(...atDome(returnHalf, 0.038));

  // Rear: mirror of the front. Every rear control point sits on one convex tail surface;
  // the last section is already a rounded outline (tail fillet), so the cap is reached
  // tangentially: perimeter -> transition ring -> regular rectangle -> 7 x 6 quad grid.
  const halfLast = halves[S - 1];
  const lastBase = (S - 1) * N;
  const botL = halfLast[0][1];
  const topL = halfLast[HALF][1];
  const hwL = Math.max(0.05, ...halfLast.map(([z]) => Math.abs(z)));
  const rearYC = (botL + topL) / 2;
  const rearHH = Math.max(0.1, (topL - botL) / 2);
  const rearShape = (z: number, y: number) => {
    const zn = clamp(Math.abs(z) / hwL, 0, 1.1);
    const yn = clamp((y - rearYC) / rearHH, -1.2, 1.2);
    return Math.max(0, 1 - zn * zn * zn * zn) * Math.max(0, 1 - yn * yn);
  };
  const rearSurface = (z: number, y: number) => frame.xAt(1) - (frame.rearRecess(z, y) - rearDatum);
  let rearBulge = 0;
  const rearDomeX = (z: number, y: number) => rearSurface(z, y) + rearBulge * rearShape(z, y);
  const rearInset = Math.max(0.06, (topL - botL) * 0.16);
  const rearRectBottom = botL + rearInset;
  const rearRectTop = topL - rearInset;
  const rearRectWidth = Math.min(hwL * 0.74, Math.abs(halfLast[3][0]) * 0.86);
  const rearRect: Array<[number, number]> = [];
  for (let ring = 0; ring <= HALF; ring += 1) {
    if (ring <= 3) rearRect.push([rearRectWidth * ring / 3, rearRectBottom]);
    else if (ring <= 8) rearRect.push([rearRectWidth, mix(rearRectBottom, rearRectTop, (ring - 3) / 5)]);
    else rearRect.push([rearRectWidth * (11 - ring) / 3, rearRectTop]);
  }
  const blendToRect = (amount: number) => halfLast.map(([z, y], k) =>
    [mix(z, rearRect[k][0], amount), mix(y, rearRect[k][1], amount)] as [number, number]);
  const rearMidHalf = blendToRect(0.3);
  const rearOuterHalf = blendToRect(0.64);
  {
    // Solve the tail bulge so the rearmost control point is exactly at +L/2.
    const probe: Array<[number, number]> = [...rearMidHalf, ...rearOuterHalf, ...rearRect];
    for (let u = 0; u <= 6; u += 1) {
      for (let v = 0; v <= 5; v += 1) probe.push([rearRectWidth * (u - 3) / 3, mix(rearRectBottom, rearRectTop, v / 5)]);
    }
    let low = -0.3;
    let high = 0.3;
    for (let iteration = 0; iteration < 48; iteration += 1) {
      const middle = (low + high) / 2;
      const rearmost = Math.max(...probe.map(([z, y]) => rearSurface(z, y) + middle * rearShape(z, y)));
      if (rearmost < frame.L / 2) low = middle;
      else high = middle;
    }
    rearBulge = (low + high) / 2;
  }
  const rBase = vertices.length;
  const rearMidRing = ringFromHalf(rearMidHalf, 0);
  rearMidRing.forEach((point) => { point[0] = rearDomeX(point[2], point[1]); });
  vertices.push(...rearMidRing);
  const rOuterBase = vertices.length;
  const rearOuterRing = ringFromHalf(rearOuterHalf, 0);
  rearOuterRing.forEach((point) => { point[0] = rearDomeX(point[2], point[1]); });
  vertices.push(...rearOuterRing);

  const faces: number[][] = [];
  const sideGlass: number[][] = [];
  const windshield: number[][] = [];
  const rearGlass: number[][] = [];
  const frontPanelGrid: number[][] = [];
  const quad = (prev: number, next: number, r: number) => [prev + r, next + r, next + ((r + 1) % N), prev + ((r + 1) % N)];

  for (let r = 0; r < N; r += 1) {
    if (config.hasGrille) {
      faces.push(quad(returnBase, oBase, r));
      faces.push(quad(oBase, surroundBase, r));
      faces.push(quad(surroundBase, fBase, r));
    }
    faces.push(quad(fBase, 0, r));
  }
  if (!config.hasGrille) {
    faces.push(...fillFaceOnDome(vertices, fBase, rectHalf, domeX, frontPanelGrid));
  }

  for (let i = 0; i < S - 1; i += 1) {
    const middle = (sections[i] + sections[i + 1]) / 2;
    const xm = frame.xAt(middle);
    const inArch = frame.arches.some((arch) => Math.abs(xm - arch.x) < arch.rc);
    const pillarBand = frame.glass.pillars.some((pillar) => Math.abs(middle - pillar) < frame.glass.pillarHalf * 1.1);
    const isSideGlass = middle > frame.glass.start && middle < frame.glass.end && !pillarBand;
    const isWindshield = middle > frame.cowlS && middle < frame.windshieldTopS;
    const isRearGlass = middle > frame.rearGlassTopS && middle < frame.rearGlassS;
    for (let r = 0; r < N; r += 1) {
      const face = quad(i * N, (i + 1) * N, r);
      // Open underbody: no floor panel, the body ends at the turned-in rocker return.
      if (r === 0 || r === N - 1) continue;
      if (inArch && (r === 1 || r === N - 2)) continue;
      if (isSideGlass && (r === 7 || r === N - 8)) {
        sideGlass.push(face);
        continue;
      }
      if (r >= 9 && r <= 12 && isWindshield) {
        windshield.push(face);
        continue;
      }
      // Hatchbacks: the backlight stops one row inboard, leaving a body-colour D-pillar
      // frame (rail band 9-10) around its top corners and sides.
      const rearFrom = frame.hatchback ? 10 : 9;
      if (r >= rearFrom && r <= N - 1 - rearFrom && isRearGlass) {
        rearGlass.push(face);
        continue;
      }
      faces.push(face);
    }
  }

  for (let r = 0; r < N; r += 1) {
    faces.push(quad(lastBase, rBase, r));
    faces.push(quad(rBase, rOuterBase, r));
  }
  faces.push(...fillFaceOnDome(vertices, rOuterBase, rearRect, rearDomeX, [], [1, 0, 0], true));

  const grilleVertices: Point3[] = [];
  const grilleFaces: number[][] = [];
  if (config.hasGrille) {
    grilleVertices.push(...ringFromHalf(returnHalf, 0));
    grilleFaces.push(...gridFill(
      grilleVertices,
      Array.from({ length: N }, (_, r) => r),
      3,
      HALF - 3,
      () => [0, 0, 0],
      [-1, 0, 0],
      2,
    ));
    grilleVertices.forEach((point) => { point[0] = domeX(point[2], point[1]) + 0.05; });
  }

  // Creases
  const edgeCounts = new Map<number, { a: number; b: number; count: number }>();
  faces.forEach((face) => face.forEach((a, index) => {
    const b = face[(index + 1) % face.length];
    const key = edgeKey(a, b);
    const current = edgeCounts.get(key) ?? { a, b, count: 0 };
    current.count += 1;
    edgeCounts.set(key, current);
  }));
  const edgeSet = new Set(edgeCounts.keys());
  const glassEdges = new Set<number>();
  [...sideGlass, ...windshield, ...rearGlass].forEach((face) => face.forEach((a, index) => {
    glassEdges.add(edgeKey(a, face[(index + 1) % face.length]));
  }));
  const creaseMap = new Map(buildCreases(frame, config, sections, edgeSet).map((crease) => [edgeKey(crease.a, crease.b), crease]));
  for (let ring = 0; ring < N && config.hasGrille; ring += 1) {
    const a = surroundBase + ring;
    const b = surroundBase + ((ring + 1) % N);
    const key = edgeKey(a, b);
    if (edgeSet.has(key)) creaseMap.set(key, { a, b, weight: 0.75 + config.surfaceHardness / 100, feature: "grille-surround" });
    const openingA = oBase + ring;
    const openingB = oBase + ((ring + 1) % N);
    const openingKey = edgeKey(openingA, openingB);
    if (edgeSet.has(openingKey)) creaseMap.set(openingKey, {
      a: openingA, b: openingB, weight: 1.7 + config.surfaceHardness / 125, feature: "grille-opening",
    });
  }
  edgeCounts.forEach(({ a, b, count }, key) => {
    if (count !== 1) return;
    const middle = average([vertices[a], vertices[b]]);
    const nearWheel = frame.arches.some((arch) =>
      Math.abs(middle[0] - arch.x) < arch.rc + 0.05
      && middle[1] < arch.cy + arch.lipR + 0.08
      && Math.abs(middle[2]) > frame.W * 0.3,
    );
    const feature = glassEdges.has(key)
      ? "glass-opening"
      : nearWheel
        ? "wheel-arch-opening"
        // Only the real grille opening gets this crease; the open underbody's lower return
        // edge also lies near the nose and must stay soft.
        : config.hasGrille && middle[0] < -frame.L / 2 + 0.12 && middle[1] > frame.floor + 0.04
          ? "grille-opening"
          : null;
    if (!feature) return;
    const weight = 1.7 + clamp(config.surfaceHardness / 100, 0, 1) * 0.8;
    const previous = creaseMap.get(key);
    if (!previous || previous.weight < weight) creaseMap.set(key, { a, b, weight, feature });
  });
  const creases = [...creaseMap.values()];

  // Compact unused vertices (e.g. wheel opening interiors)
  const used = new Set<number>();
  [...faces, ...sideGlass, ...windshield, ...rearGlass].forEach((face) => face.forEach((v) => used.add(v)));
  const remap = new Map<number, number>();
  const compactVertices: Point3[] = [];
  vertices.forEach((vertex, index) => {
    if (!used.has(index)) return;
    remap.set(index, compactVertices.length);
    compactVertices.push(vertex);
  });
  const mapFace = (face: number[]) => face.map((v) => remap.get(v)!);

  return {
    vertices: compactVertices,
    faces: faces.map(mapFace),
    sections,
    ringCount: N,
    creases: creases
      .filter(({ a, b }) => remap.has(a) && remap.has(b))
      .map((crease) => ({ ...crease, a: remap.get(crease.a)!, b: remap.get(crease.b)! })),
    sideGlass: sideGlass.map(mapFace),
    windshield: windshield.map(mapFace),
    rearGlass: rearGlass.map(mapFace),
    grille: { vertices: grilleVertices, faces: grilleFaces },
    grilleOpening: config.hasGrille ? openingRing : [],
    frontPanelGrid: frontPanelGrid.map(mapFace),
    wheelArches: frame.arches.map((arch) => ({
      x: arch.x, cy: arch.cy, r: arch.r, zMin: frame.halfWidthAt(arch.s) * 0.65,
    })),
  };
}

function buildCreases(frame: VehicleFrame, config: VehicleConfig, sections: number[], edgeSet: Set<number>) {
  const N = RING_COUNT;
  const hard = clamp(config.surfaceHardness / 100, 0, 1);
  const map = new Map<number, Crease>();
  // Softer styles scale body feature lines only; glass / wheel-opening edges stay crisp.
  const softFeatures = new Set(["hood-front-edge", "front-corner", "hood-edge", "hood-character-line",
    "feature-line", "fender-edge", "shoulder", "cowl-line", "lower-body-line", "rocker-line"]);
  const creaseScale = frame.style.creaseScale ?? 1;
  const addCrease = (a: number, b: number, rawWeight: number, feature: string) => {
    const weight = softFeatures.has(feature) ? rawWeight * creaseScale : rawWeight;
    const key = edgeKey(a, b);
    if (!edgeSet.has(key) || weight <= 0.05) return;
    const existing = map.get(key);
    if (!existing || existing.weight < weight) map.set(key, { a, b, weight, feature });
  };
  const longitudinal = (i: number, k: number, weight: number, feature: string) => {
    addCrease(i * N + k, (i + 1) * N + k, weight, feature);
    if (k > 0 && k < HALF) addCrease(i * N + N - k, (i + 1) * N + N - k, weight, feature);
  };
  const across = (i: number, k: number, weight: number, feature: string) => {
    addCrease(i * N + k, i * N + k + 1, weight, feature);
    addCrease(i * N + ((N - k) % N), i * N + N - k - 1, weight, feature);
  };

  for (let i = 0; i < sections.length - 1; i += 1) {
    const middle = (sections[i] + sections[i + 1]) / 2;
    const xm = frame.xAt(middle);
    const inArch = frame.arches.some((arch) => Math.abs(xm - arch.x) < arch.rc);
    const inLip = frame.arches.some((arch) => Math.abs(xm - arch.x) < arch.lipR);
    const cabin = frame.cabinAt(middle);
    const endFade = middle < 0.03 || middle > 0.97 ? 0.5 : 1;
    // Longitudinal fold lines dissolve inside the tail fillet; ending them abruptly at the
    // last ring leaves darts (ripples) in the limit surface.
    const tailFade = inLip ? 1 : 1 - 0.92 * smoothstep(frame.tailS0 - 0.012, 1, middle);
    longitudinal(i, 1, (0.5 + 0.7 * hard) * tailFade, "rocker-lower-edge");
    longitudinal(i, 2, (inArch ? 1.5 + 1.2 * hard : 0.6 + 1.0 * hard) * tailFade, inArch ? "wheel-arch-opening" : "rocker-line");
    longitudinal(i, 3, (inLip ? 1.6 + 1.4 * hard : 0.25 + 0.4 * hard) * tailFade, inLip ? "wheel-arch-lip" : "lower-body-line");
    longitudinal(i, 5, endFade * tailFade * (0.55 + 1.6 * hard), "feature-line");
    longitudinal(i, 6, (cabin > 0.5 ? 0.5 + 0.9 * hard : 0.9 + 1.1 * hard) * tailFade, cabin > 0.5 ? "shoulder" : "fender-edge");
    if (middle < frame.cowlS) {
      longitudinal(i, 9, config.type === "mpv" ? 0.35 + 0.75 * hard : 0.7 + 1.25 * hard, "hood-edge");
      if (middle > frame.hoodFrontS) longitudinal(i, 10, 0.2 + 0.55 * hard, "hood-character-line");
    }
    const aPillarRail = middle >= frame.cowlS && middle <= frame.roofFrontS
      ? smoothstep(frame.cowlS, frame.roofFrontS, middle)
      : 0;
    const cPillarRail = middle >= frame.roofRearS && middle <= frame.rearGlassS
      ? 1 - smoothstep(frame.roofRearS, frame.rearGlassS, middle)
      : 0;
    const railWeight = (middle > frame.roofFrontS && middle < frame.roofRearS)
      ? 1.2 + 1.2 * hard
      : Math.max(aPillarRail, cPillarRail) * (1.2 + 1.2 * hard);
    if (railWeight > 0.1) longitudinal(i, 9, railWeight * tailFade, "roof-rail");
  }

  let cowlIndex = 0;
  sections.forEach((s, index) => {
    if (Math.abs(s - frame.cowlS) < Math.abs(sections[cowlIndex] - frame.cowlS)) cowlIndex = index;
  });
  for (const k of [5, 6, 7, 8, 9, 10]) across(cowlIndex, k, config.type === "mpv" ? 0.2 + hard * 0.3 : 0.6 + hard * 0.7, "cowl-line");

  let hoodFrontIndex = 0;
  sections.forEach((s, index) => {
    if (Math.abs(s - frame.hoodFrontS) < Math.abs(sections[hoodFrontIndex] - frame.hoodFrontS)) hoodFrontIndex = index;
  });
  for (const k of [6, 7, 8, 9, 10]) across(hoodFrontIndex, k, 0.7 + 1.1 * hard, "hood-front-edge");

  // Integrated spoiler: crisp lip across the roof (rail to centre) at the tip station.
  if (frame.spoilerTipS > 0) {
    let tipIndex = 0;
    sections.forEach((s, index) => {
      if (Math.abs(s - frame.spoilerTipS) < Math.abs(sections[tipIndex] - frame.spoilerTipS)) tipIndex = index;
    });
    for (const k of [8, 9, 10]) across(tipIndex, k, 1.3 + 0.6 * hard, "spoiler-edge");
  }

  // No crease on the rear ring: the tail is rounded by geometry, not by a fold line.
  for (let r = 0; r < N; r += 1) {
    addCrease(r, (r + 1) % N, 0.35 + 0.5 * hard, "front-corner");
  }
  return [...map.values()];
}

/* ------------------------------------------------------------------ */
/* Catmull–Clark with semi-sharp creases                               */
/* ------------------------------------------------------------------ */

interface SubdData {
  vertices: Point3[];
  faces: number[][];
  creases: Map<number, number>;
}

interface SubdEdge {
  a: number;
  b: number;
  faces: number[];
  sharpness: number;
}

function subdivideOnce(mesh: SubdData): SubdData {
  const { vertices, faces } = mesh;
  const facePoints = faces.map((face) => average(face.map((index) => vertices[index])));
  const edges = new Map<number, SubdEdge>();
  const vertexFaces: number[][] = vertices.map(() => []);

  faces.forEach((face, faceIndex) => {
    face.forEach((vertex, k) => {
      vertexFaces[vertex].push(faceIndex);
      const next = face[(k + 1) % face.length];
      const key = edgeKey(vertex, next);
      let edge = edges.get(key);
      if (!edge) {
        edge = { a: Math.min(vertex, next), b: Math.max(vertex, next), faces: [], sharpness: mesh.creases.get(key) ?? 0 };
        edges.set(key, edge);
      }
      edge.faces.push(faceIndex);
    });
  });

  const vertexEdges: SubdEdge[][] = vertices.map(() => []);
  edges.forEach((edge) => {
    vertexEdges[edge.a].push(edge);
    vertexEdges[edge.b].push(edge);
  });
  const other = (edge: SubdEdge, vertex: number) => (edge.a === vertex ? edge.b : edge.a);

  const refined: Point3[] = [];
  vertices.forEach((point, vertexIndex) => {
    const attached = vertexEdges[vertexIndex];
    if (attached.length === 0) {
      refined.push(point);
      return;
    }
    const boundary = attached.filter((edge) => edge.faces.length === 1);
    if (boundary.length >= 2) {
      if (boundary.length === 2) {
        const n0 = vertices[other(boundary[0], vertexIndex)];
        const n1 = vertices[other(boundary[1], vertexIndex)];
        const smoothBoundary = add(add(scale(point, 0.75), n0, 0.125), n1, 0.125);
        const firstDirection = new THREE.Vector3(...n0).sub(new THREE.Vector3(...point)).normalize();
        const secondDirection = new THREE.Vector3(...n1).sub(new THREE.Vector3(...point)).normalize();
        const turn = smoothstep(-0.85, -0.25, firstDirection.dot(secondDirection));
        const strength = clamp(Math.min(boundary[0].sharpness, boundary[1].sharpness) / 2, 0, 1);
        refined.push(blend(smoothBoundary, point, turn * strength * 0.7));
      } else {
        refined.push(point);
      }
      return;
    }
    const valence = attached.length;
    const faceAverage = average(vertexFaces[vertexIndex].map((faceIndex) => facePoints[faceIndex]));
    const edgeAverage = average(attached.map((edge) => average([vertices[edge.a], vertices[edge.b]])));
    let smooth = scale(add(add(faceAverage, edgeAverage, 2), point, valence - 3), 1 / valence);
    const sharp = attached.filter((edge) => edge.sharpness > 0).sort((x, y) => y.sharpness - x.sharpness);
    if (sharp.length >= 2) {
      const creasePoint = add(
        add(scale(point, 0.75), vertices[other(sharp[0], vertexIndex)], 0.125),
        vertices[other(sharp[1], vertexIndex)],
        0.125,
      );
      smooth = blend(smooth, creasePoint, clamp((sharp[0].sharpness + sharp[1].sharpness) / 2, 0, 1));
      if (sharp.length > 2) smooth = blend(smooth, point, clamp(sharp[2].sharpness, 0, 1));
    }
    refined.push(smooth);
  });

  const edgeIndex = new Map<number, number>();
  const nextCreases = new Map<number, number>();
  edges.forEach((edge, key) => {
    const mid = average([vertices[edge.a], vertices[edge.b]]);
    let point = mid;
    if (edge.faces.length === 2) {
      const smoothEdge = scale(
        add(add(add(vertices[edge.a], vertices[edge.b]), facePoints[edge.faces[0]]), facePoints[edge.faces[1]]),
        0.25,
      );
      point = blend(smoothEdge, mid, clamp(edge.sharpness, 0, 1));
    }
    const index = refined.length;
    refined.push(point);
    edgeIndex.set(key, index);
    if (edge.sharpness > 1) {
      nextCreases.set(edgeKey(edge.a, index), edge.sharpness - 1);
      nextCreases.set(edgeKey(index, edge.b), edge.sharpness - 1);
    }
  });

  const faceIndexStart = refined.length;
  facePoints.forEach((point) => refined.push(point));
  const refinedFaces: number[][] = [];
  faces.forEach((face, faceIndex) => {
    face.forEach((vertex, k) => {
      const next = face[(k + 1) % face.length];
      const previous = face[(k + face.length - 1) % face.length];
      refinedFaces.push([
        vertex,
        edgeIndex.get(edgeKey(vertex, next))!,
        faceIndexStart + faceIndex,
        edgeIndex.get(edgeKey(previous, vertex))!,
      ]);
    });
  });

  return { vertices: refined, faces: refinedFaces, creases: nextCreases };
}

export function compactPatch(vertices: Point3[], faces: number[][], creases: Crease[] = []) {
  const remap = new Map<number, number>();
  const compact: Point3[] = [];
  faces.forEach((face) =>
    face.forEach((v) => {
      if (!remap.has(v)) {
        remap.set(v, compact.length);
        compact.push(vertices[v]);
      }
    }),
  );
  return {
    vertices: compact,
    faces: faces.map((face) => face.map((v) => remap.get(v)!)),
    creases: creases
      .filter(({ a, b }) => remap.has(a) && remap.has(b))
      .map((crease) => ({ ...crease, a: remap.get(crease.a)!, b: remap.get(crease.b)! })),
  };
}

export function subdivide(vertices: Point3[], faces: number[][], creases: Crease[] = [], levels = 2): PatchMesh {
  let data: SubdData = {
    vertices,
    faces,
    creases: new Map(creases.map((crease) => [edgeKey(crease.a, crease.b), crease.weight])),
  };
  for (let level = 0; level < levels; level += 1) data = subdivideOnce(data);
  return { vertices: data.vertices, faces: data.faces };
}

function correctWheelBoundaries(surface: PatchMesh, controlMesh: ControlMesh, glazingPoints?: Set<Point3>): PatchMesh {
  // The Catmull-Clark limit shrinks circular boundary polygons. Reproject only
  // the opening boundary, keeping every wheel-to-arch gap truly constant.
  const edgeCounts = new Map<number, { a: number; b: number; count: number }>();
  surface.faces.forEach((face) => face.forEach((a, index) => {
    const b = face[(index + 1) % face.length];
    const key = edgeKey(a, b);
    const edge = edgeCounts.get(key) ?? { a, b, count: 0 };
    edge.count += 1;
    edgeCounts.set(key, edge);
  }));
  const boundary = new Set<number>();
  edgeCounts.forEach((edge) => {
    if (edge.count !== 1) return;
    boundary.add(edge.a);
    boundary.add(edge.b);
  });
  boundary.forEach((index) => {
    const point = surface.vertices[index];
    if (glazingPoints?.has(point)) return;
    for (const arch of controlMesh.wheelArches) {
      if (Math.abs(point[2]) < arch.zMin || point[1] < arch.cy - 0.015) continue;
      const dx = point[0] - arch.x;
      const dy = point[1] - arch.cy;
      const distance = Math.hypot(dx, dy);
      if (distance < arch.r - 0.075 || distance > arch.r + 0.075) continue;
      point[0] = arch.x + dx * arch.r / distance;
      point[1] = arch.cy + dy * arch.r / distance;
      break;
    }
  });
  return surface;
}

export interface VehicleSurfaces {
  body: PatchMesh;
  sideGlass: PatchMesh;
  windshield: PatchMesh;
  rearGlass: PatchMesh;
}

const evaluatedCache = new WeakMap<ControlMesh, Map<number, VehicleSurfaces>>();

export function evaluateVehicleSurfaces(cage: ControlMesh, levels = 2): VehicleSurfaces {
  const cache = evaluatedCache.get(cage);
  const existing = cache?.get(levels);
  if (existing) return existing;
  const groups = [cage.faces, cage.sideGlass, cage.windshield, cage.rearGlass];
  let owners = groups.flatMap((faces, owner) => faces.map(() => owner));
  let surface: SubdData = {
    vertices: cage.vertices,
    faces: groups.flat(),
    creases: new Map(cage.creases.map((crease) => [edgeKey(crease.a, crease.b), crease.weight])),
  };
  // Evaluate glass and body as one cage, then split by material. Shared borders
  // therefore have identical limit positions instead of independently shrinking.
  for (let level = 0; level < levels; level += 1) {
    const nextOwners = surface.faces.flatMap((face, index) => face.map(() => owners[index]));
    surface = subdivideOnce(surface);
    owners = nextOwners;
  }
  const facesByMaterial: number[][][] = [[], [], [], []];
  surface.faces.forEach((face, index) => facesByMaterial[owners[index]].push(face));
  const patches = facesByMaterial.map((faces) => compactPatch(surface.vertices, faces));
  const glazingPoints = new Set(patches.slice(1).flatMap((patch) => patch.vertices));
  const result: VehicleSurfaces = {
    body: correctWheelBoundaries(patches[0], cage, glazingPoints),
    sideGlass: patches[1],
    windshield: patches[2],
    rearGlass: patches[3],
  };
  const nextCache = cache ?? new Map<number, VehicleSurfaces>();
  nextCache.set(levels, result);
  evaluatedCache.set(cage, nextCache);
  return result;
}

export function evaluateBody(controlMesh: ControlMesh, levels = 2): PatchMesh {
  return evaluateVehicleSurfaces(controlMesh, levels).body;
}

export function evaluatePatch(vertices: Point3[], faces: number[][], levels = 2): PatchMesh {
  if (faces.length === 0) return { vertices: [], faces: [] };
  const compact = compactPatch(vertices, faces);
  const edges = new Map<number, { a: number; b: number; count: number }>();
  compact.faces.forEach((face) => face.forEach((a, index) => {
    const b = face[(index + 1) % face.length];
    const key = edgeKey(a, b);
    const edge = edges.get(key) ?? { a, b, count: 0 };
    edge.count += 1;
    edges.set(key, edge);
  }));
  const boundary = [...edges.values()]
    .filter((edge) => edge.count === 1)
    .map(({ a, b }) => ({ a, b, weight: 2.1, feature: "glass-opening" }));
  return subdivide(compact.vertices, compact.faces, boundary, levels);
}

/* ------------------------------------------------------------------ */
/* Geometry conversion                                                 */
/* ------------------------------------------------------------------ */

/** Area-weighted (Newell) vertex normals as a flat Float32Array, allocation-free per face. */
function patchNormalArray(mesh: PatchMesh) {
  const { vertices, faces } = mesh;
  const out = new Float32Array(vertices.length * 3);
  for (let f = 0; f < faces.length; f += 1) {
    const face = faces[f];
    let nx = 0;
    let ny = 0;
    let nz = 0;
    for (let i = 0; i < face.length; i += 1) {
      const c = vertices[face[i]];
      const n = vertices[face[(i + 1) % face.length]];
      nx += (c[1] - n[1]) * (c[2] + n[2]);
      ny += (c[2] - n[2]) * (c[0] + n[0]);
      nz += (c[0] - n[0]) * (c[1] + n[1]);
    }
    for (let i = 0; i < face.length; i += 1) {
      const o = face[i] * 3;
      out[o] += nx;
      out[o + 1] += ny;
      out[o + 2] += nz;
    }
  }
  for (let o = 0; o < out.length; o += 3) {
    const l = Math.hypot(out[o], out[o + 1], out[o + 2]);
    if (l > 0) {
      out[o] /= l;
      out[o + 1] /= l;
      out[o + 2] /= l;
    }
  }
  return out;
}

export function computePatchNormals(mesh: PatchMesh) {
  const normals = mesh.vertices.map(() => new THREE.Vector3());
  mesh.faces.forEach((face) => {
    const normal = newell(face.map((index) => mesh.vertices[index]));
    face.forEach((index) => normals[index].add(normal));
  });
  normals.forEach((normal) => normal.normalize());
  return normals;
}

/** Adds an inward return flange on every open boundary (glass, wheel and grille openings). */
export function addBoundaryFlange(mesh: PatchMesh, depth: number, includeBody = true): PatchMesh {
  const normals = patchNormalArray(mesh);
  const counts = new Map<number, number>();
  for (const face of mesh.faces) {
    for (let k = 0; k < face.length; k += 1) {
      const key = edgeKey(face[k], face[(k + 1) % face.length]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const vertices = [...mesh.vertices];
  const faces = includeBody ? [...mesh.faces] : [];
  const outer = new Map<number, number>();
  const inner = new Map<number, number>();
  const outerOf = (v: number) => {
    let index = outer.get(v);
    if (index === undefined) {
      index = vertices.length;
      outer.set(v, index);
      vertices.push([...mesh.vertices[v]] as Point3);
    }
    return index;
  };
  const innerOf = (v: number) => {
    let index = inner.get(v);
    if (index === undefined) {
      const p = mesh.vertices[v];
      const o = v * 3;
      index = vertices.length;
      inner.set(v, index);
      vertices.push([p[0] - normals[o] * depth, p[1] - normals[o + 1] * depth, p[2] - normals[o + 2] * depth]);
    }
    return index;
  };
  for (const face of mesh.faces) {
    for (let k = 0; k < face.length; k += 1) {
      const a = face[k];
      const b = face[(k + 1) % face.length];
      if (counts.get(edgeKey(a, b)) !== 1) continue;
      faces.push([outerOf(b), outerOf(a), innerOf(a), innerOf(b)]);
    }
  }
  return includeBody ? { vertices, faces } : compactPatch(vertices, faces);
}

export function offsetPatch(mesh: PatchMesh, distance: number): PatchMesh {
  const normals = computePatchNormals(mesh);
  return {
    vertices: mesh.vertices.map((p, index) => [
      p[0] + normals[index].x * distance,
      p[1] + normals[index].y * distance,
      p[2] + normals[index].z * distance,
    ]),
    faces: mesh.faces,
  };
}

export function patchToGeometry(mesh: PatchMesh) {
  const { vertices, faces } = mesh;
  const positions = new Float32Array(vertices.length * 3);
  for (let i = 0; i < vertices.length; i += 1) {
    const v = vertices[i];
    positions[i * 3] = v[0];
    positions[i * 3 + 1] = v[1];
    positions[i * 3 + 2] = v[2];
  }
  let triangleCount = 0;
  for (const face of faces) triangleCount += Math.max(0, face.length - 2);
  const indices = vertices.length > 65535 ? new Uint32Array(triangleCount * 3) : new Uint16Array(triangleCount * 3);
  let k = 0;
  for (const face of faces) {
    for (let i = 1; i < face.length - 1; i += 1) {
      indices[k++] = face[0];
      indices[k++] = face[i];
      indices[k++] = face[i + 1];
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(patchNormalArray(mesh), 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/** Quad edge lines only (no triangle diagonals) – used for wireframe & cage displays. */
export function patchEdgesGeometry(vertices: Point3[], faces: number[][]) {
  const positions: number[] = [];
  const seen = new Set<number>();
  faces.forEach((face) =>
    face.forEach((v, k) => {
      const next = face[(k + 1) % face.length];
      const key = edgeKey(v, next);
      if (seen.has(key)) return;
      seen.add(key);
      positions.push(...vertices[v], ...vertices[next]);
    }),
  );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

/** Flat-shaded control polygons (BoxMode). */
export function controlFacesGeometry(vertices: Point3[], faces: number[][]) {
  const positions: number[] = [];
  const normals: number[] = [];
  faces.forEach((face) => {
    const normal = newell(face.map((index) => vertices[index])).normalize();
    for (let i = 1; i < face.length - 1; i += 1) {
      for (const index of [face[0], face[i], face[i + 1]]) {
        positions.push(...vertices[index]);
        normals.push(normal.x, normal.y, normal.z);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return geometry;
}

export function controlPointsGeometry(vertices: Point3[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices.flat(), 3));
  return geometry;
}

export function creaseLinesGeometry(controlMesh: ControlMesh) {
  const positions = controlMesh.creases
    .filter((crease) => crease.weight >= 0.9)
    .flatMap(({ a, b }) => [...controlMesh.vertices[a], ...controlMesh.vertices[b]]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Wheels                                                              */
/* ------------------------------------------------------------------ */

export function getWheelPositions(config: VehicleConfig) {
  const frame = getVehicleFrame(config);
  const tire = getTireSpecification(config);
  const tireWidth = tire.width / 1000;
  const lateral = (arch: ArchFrame, inset: number) =>
    frame.halfWidthAt(arch.s) * 0.985 + arch.flare * 0.9 - tireWidth / 2 - clamp(inset, 0, 100) / 1000;
  return {
    front: frame.arches[0].x,
    rear: frame.arches[1].x,
    radius: config.tireDiameter / 2000,
    rimRadius: config.wheelDiameterInches * 0.0127,
    tireWidth,
    frontLateral: lateral(frame.arches[0], config.frontWheelInset),
    rearLateral: lateral(frame.arches[1], config.rearWheelInset),
  };
}

export function makeWheelArchCurve(config: VehicleConfig, axle: "front" | "rear", side: 1 | -1) {
  const frame = getVehicleFrame(config);
  const arch = frame.arches[axle === "front" ? 0 : 1];
  const z = frame.halfWidthAt(arch.s) * 0.992 + arch.flare * 0.95;
  const minY = frame.rockerTop - 0.03;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 36; i += 1) {
    const angle = Math.PI - (i / 36) * Math.PI;
    const x = archHorizontal(arch.r + 0.012, angle, 2);
    const y = arch.cy + archHalfHeight(x, arch.r + 0.012, 2);
    if (y < minY) continue;
    points.push(new THREE.Vector3(arch.x + x, y, side * z));
  }
  return new THREE.CatmullRomCurve3(points, false, "centripetal", 0.4);
}
