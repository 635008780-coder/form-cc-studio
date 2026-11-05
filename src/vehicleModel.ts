import * as THREE from "three";

export type VehicleType = "sedan" | "suv" | "mpv" | "micro";
export type TireStyle = "road" | "allTerrain";
export type CageDensity = "compact" | "balanced" | "detailed";
export type GrillePattern = "horizontal" | "vertical" | "mesh" | "closed";
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
  roofEndPercent: 67,
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
  hasGrille: true,
  grilleWidth: 58,
  grilleHeight: 24,
  grillePattern: "horizontal",
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
  tailHeightPercent: 56,
  noseWidthPercent: 86,
  tailWidthPercent: 86,
  rearGlassSpan: 11,
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
    wheelDiameterInches: 20, tireDiameter: 773, tireStyle: "road", wheelArch: 440, archClearance: 45,
    frontAxleFromFront: 880, rearAxleFromTail: 1040,
    windshieldAngle: 60, windshieldPosition: 1620, hoodShape: 54, beltline: 1210,
    beltlineSlope: 35, windowHeightPercent: 88, doorSplitPercent: 46,
    sideTrend: 60, surfaceHardness: 36, groundClearance: 240,
    roofEndPercent: 87, roofWidthPercent: 76,
    frontFlare: 36, rearFlare: 42, archLipWidth: 70, archShape: 18,
    frontWheelInset: 20, rearWheelInset: 20, sideSculpt: 38,
    hasGrille: true, grilleWidth: 64, grilleHeight: 28, grillePattern: "mesh",
    headlampWidth: 100, headlampHeight: 90, bumperDepth: 38,
    hoodWidthPercent: 82, hoodDome: 30, hoodEdgeDrop: 16, noseLift: 45, hoodRearDrop: 60,
    hoodGlassBlend: 10, frontBow: 230, rearBow: 170,
    noseHeightPercent: 55, tailHeightPercent: 72, noseWidthPercent: 84, tailWidthPercent: 89,
    rearGlassSpan: 10, tailDeckPercent: 99, paintColor: "#aebbbd",
  }),
  // Cab-forward van – very short hood flowing straight into the windshield
  mpv: makePreset({
    type: "mpv", templateId: "mpv-van",
    length: 4420, width: 1685, height: 1770, wheelbase: 2720,
    wheelDiameterInches: 14, tireDiameter: 596, tireStyle: "road", wheelArch: 340, archClearance: 35,
    frontAxleFromFront: 790, rearAxleFromTail: 910,
    windshieldAngle: 50, windshieldPosition: 820, hoodShape: 45, beltline: 1010,
    beltlineSlope: 0, windowHeightPercent: 93, doorSplitPercent: 34,
    sideTrend: 45, surfaceHardness: 55, groundClearance: 190,
    roofEndPercent: 91, roofWidthPercent: 85,
    frontFlare: 6, rearFlare: 8, archLipWidth: 32, archShape: 8,
    frontWheelInset: 15, rearWheelInset: 15, sideSculpt: 14,
    hasGrille: true, grilleWidth: 60, grilleHeight: 17, grillePattern: "horizontal",
    headlampWidth: 112, headlampHeight: 105, bumperDepth: 28,
    hoodWidthPercent: 82, hoodDome: 14, hoodEdgeDrop: 10, noseLift: 25, hoodRearDrop: 40,
    hoodGlassBlend: 100, frontBow: 150, rearBow: 55,
    noseHeightPercent: 44, tailHeightPercent: 64, noseWidthPercent: 90, tailWidthPercent: 94,
    rearGlassSpan: 6, tailDeckPercent: 99, paintColor: "#d9d8cf",
  }),
  // Cube-shaped city micro car
  micro: makePreset({
    type: "micro", templateId: "micro-cube",
    length: 2920, width: 1493, height: 1621, wheelbase: 1940,
    wheelDiameterInches: 12, tireDiameter: 508, tireStyle: "road", wheelArch: 295, archClearance: 35,
    frontAxleFromFront: 480, rearAxleFromTail: 500,
    windshieldAngle: 42, windshieldPosition: 620, hoodShape: 46, beltline: 960,
    beltlineSlope: 10, windowHeightPercent: 90, doorSplitPercent: 55,
    sideTrend: 50, surfaceHardness: 38, groundClearance: 160,
    roofEndPercent: 87, roofWidthPercent: 84,
    frontFlare: 6, rearFlare: 8, archLipWidth: 28, archShape: 10,
    frontWheelInset: 10, rearWheelInset: 10, sideSculpt: 48,
    hasGrille: false, grilleWidth: 52, grilleHeight: 13, grillePattern: "horizontal",
    headlampWidth: 100, headlampHeight: 100, bumperDepth: 18,
    hoodWidthPercent: 84, hoodDome: 12, hoodEdgeDrop: 8, noseLift: 25, hoodRearDrop: 50,
    hoodGlassBlend: 60, frontBow: 140, rearBow: 90,
    noseHeightPercent: 46, tailHeightPercent: 65, noseWidthPercent: 90, tailWidthPercent: 94,
    rearGlassSpan: 10, tailDeckPercent: 99, paintColor: "#79a69a",
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

function edgeKey(a: number, b: number) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
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
  },
};

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
  tailDeckS: number;
  hatchback: boolean;
  rearGlassBottom: number;
  arches: ArchFrame[];
  glass: { start: number; end: number; pillars: number[]; pillarHalf: number };
  grille: { gw: number; gh: number; gc: number; p: number };
}

export function getVehicleFrame(config: VehicleConfig): VehicleFrame {
  const baseStyle = typeStyles[config.type];
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
  const cowlY = Math.min(H - 0.2, belt + style.cowlRise);
  const rise = H - 0.035 - cowlY;
  const run = (rise * Math.tan((clamp(config.windshieldAngle, 20, 80) * Math.PI) / 180)) / Lb;
  const minRearRoof = config.type === "mpv" ? 0.875 : config.type === "micro" ? 0.84 : 0.825;
  const maxRearRoof = config.type === "mpv" ? 0.925 : 0.91;
  const desiredRoofRear = Math.max(
    clamp(config.roofEndPercent / 100, hatchback ? minRearRoof : 0.62, hatchback ? maxRearRoof : 0.79),
    cowlS + 0.16,
  );
  const roofFrontS = clamp(cowlS + run, cowlS + 0.04, desiredRoofRear - 0.12);
  const roofRearS = clamp(Math.max(desiredRoofRear, roofFrontS + 0.12), 0.62, hatchback ? maxRearRoof : 0.79);
  const rearGlassS = hatchback
    ? clamp(roofRearS + config.rearGlassSpan / 100, Math.max(0.962, roofRearS + 0.038), 0.98)
    : clamp(roofRearS + clamp(config.rearGlassSpan, 6, 18) / 100, roofRearS + 0.055, 0.91);
  const tailDeckS = hatchback
    ? mix(rearGlassS, 1, 0.52)
    : clamp(config.tailDeckPercent / 100, rearGlassS + 0.025, 0.985);
  const hoodOffset = ((config.hoodShape - 50) / 50) * 0.035;
  const nose = clamp((config.noseHeightPercent / 100) * H + config.frontHeightOffset / 1000, floor + 0.28, belt - 0.14);
  const lipY = nose + clamp(config.noseLift / 1000, 0, 0.15);
  const hoodRearDrop = clamp(config.hoodRearDrop / 1000, 0.02, 0.26);
  const hoodRearFree = clamp(belt - hoodRearDrop + hoodOffset, lipY + 0.005, cowlY - 0.03);
  const hoodRear = mix(hoodRearFree, cowlY - 0.015, clamp(config.hoodGlassBlend / 100, 0, 1));
  const hoodEndS = cowlS - Math.min(0.07, cowlS * 0.3);
  const hoodFrontS = Math.min(0.05, hoodEndS * 0.4);
  const preCowlS = cowlS - Math.min(0.025, cowlS * 0.1);
  const preCowlY = clamp(belt - 0.02, hoodRear + 0.005, cowlY - 0.01);
  const rearBelt = belt + 0.5 * (config.beltlineSlope / 1000 + 0.05 * trend);
  const rearGlassY = hatchback
    ? clamp(config.tailHeightPercent / 100 * H + config.rearHeightOffset / 1000,
      Math.max(rearBelt + 0.065, H * 0.6), Math.min(H * 0.77, H - 0.3))
    : clamp(rearBelt + 0.055, H * 0.58, H - 0.25);
  const hatchContinuation = clamp(
    (H - style.roofSag - rearGlassY) / Math.max(0.025, rearGlassS - roofRearS) * (1 - rearGlassS) * 0.9,
    0.075,
    0.24,
  );
  const tailTopY = hatchback
    ? rearGlassY - hatchContinuation
    : Math.min(config.tailHeightPercent / 100 * H + config.rearHeightOffset / 1000, rearGlassY - 0.10);
  const tailDeckY = hatchback
    ? mix(rearGlassY, tailTopY, 0.52)
    : clamp(belt - style.tailDrop + config.rearHeightOffset / 2000, floor + 0.28, rearGlassY - 0.035);
  const hoodW = clamp(config.hoodWidthPercent / 100, 0.5, 0.88);
  const hoodDome = clamp(config.hoodDome / 1000, 0, 0.09);
  const hoodDomeAt = (s: number) => {
    const t = (s - hoodFrontS) / Math.max(0.02, hoodEndS - hoodFrontS);
    if (t <= 0 || t >= 1) return 0;
    return hoodDome * Math.pow(Math.sin(Math.PI * t), 2);
  };

  const legacyFront = monotone([
    [0, nose],
    [hoodFrontS, lipY],
    [mix(hoodFrontS, hoodEndS, 0.4), mix(lipY, hoodRear, 0.2)],
    [mix(hoodFrontS, hoodEndS, 0.75), mix(lipY, hoodRear, 0.65)],
    [hoodEndS, hoodRear],
    [preCowlS, preCowlY],
    [cowlS, cowlY],
    [roofFrontS, H - 0.03],
  ]);
  const roofMid = (roofFrontS + roofRearS) / 2;
  const roofY = H - 0.03;
  const rearRoofY = H - style.roofSag;
  const roofAt = monotone([
    [roofFrontS, roofY],
    [roofMid, H],
    [roofRearS, rearRoofY],
  ]);
  const blendStrength = config.type === "mpv" ? Math.max(0.9, config.hoodGlassBlend / 100) : config.hoodGlassBlend / 100;
  const hoodSlope = (cowlY - lipY) / Math.max(0.025, cowlS - hoodFrontS);
  const screenSlope = (roofY - cowlY) / Math.max(0.025, roofFrontS - cowlS);
  const cowlSlope = 2 * Math.max(0, hoodSlope) * screenSlope / Math.max(0.01, hoodSlope + screenSlope);
  const lipJoinSlope = Math.min(Math.max(0, hoodSlope) * 0.8, 2 * Math.max(0, lipY - nose) / Math.max(0.01, hoodFrontS));
  const roofJoinSlope = (H - roofY) / Math.max(0.02, roofMid - roofFrontS);
  const frontAt = (s: number) => {
    let flow: number;
    if (s <= hoodFrontS) {
      flow = hermiteSegment(s, 0, hoodFrontS, nose, lipY, lipJoinSlope, lipJoinSlope);
    } else if (s <= cowlS) {
      flow = hermiteSegment(s, hoodFrontS, cowlS, lipY, cowlY, lipJoinSlope, cowlSlope);
    } else {
      flow = hermiteSegment(s, cowlS, roofFrontS, cowlY, roofY, cowlSlope, roofJoinSlope);
    }
    return mix(legacyFront(s), flow, clamp(blendStrength, 0, 1));
  };
  const rearSlope = (rearGlassY - rearRoofY) / (rearGlassS - roofRearS);
  const finishSlope = (tailTopY - rearGlassY) / (1 - rearGlassS);
  const glassLowerSlope = Math.max(2.2 * rearSlope, Math.min(0.5 * rearSlope, finishSlope));
  const sedanDeck = monotone([[rearGlassS, rearGlassY], [tailDeckS, tailDeckY], [1, tailTopY]]);
  const baseTopAt = (s: number) => {
    if (s < roofFrontS) return frontAt(s);
    if (s <= roofRearS) return roofAt(s);
    if (s <= rearGlassS) {
      return hermiteSegment(s, roofRearS, rearGlassS, rearRoofY, rearGlassY,
        rearSlope * 0.65, hatchback ? glassLowerSlope : rearSlope * 0.75);
    }
    if (hatchback) return hermiteSegment(s, rearGlassS, 1, rearGlassY, tailTopY, glassLowerSlope, finishSlope);
    return sedanDeck(s);
  };
  const widthFn = monotone(style.widthKeys);
  const halfWidthAt = (s: number) =>
    (W / 2) * widthFn(clamp(s, 0, 1)) * (1 + 0.012 * trend * Math.sin(Math.PI * clamp(s, 0, 1)));
  const beltAt = (s: number) => belt + (s - 0.45) * (config.beltlineSlope / 1000 + 0.05 * trend);

  const archSegments = config.cageDensity === "compact" ? 4 : config.cageDensity === "detailed" ? 8 : 6;
  // Opening stays circular; archShape only influences the surrounding wheel-arch lip.
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
  const protectiveLifts = arches.map((arch) =>
    Math.max(0, arch.cy + arch.lipR + 0.095 - baseTopAt(arch.s)));
  const topAt = (s: number) => {
    const x = xAt(s);
    let hood = baseTopAt(s);
    arches.forEach((arch, index) => {
      const distance = Math.abs(x - arch.x);
      const radius = Math.max(0.08, arch.lipR * 0.9);
      const roofMask = s > roofRearS ? 1 - smoothstep(roofRearS, rearGlassS, s) : 1;
      hood += protectiveLifts[index] * Math.exp(-Math.pow(distance / radius, 4)) * roofMask;
      if (s >= roofRearS) return;
      if (distance >= arch.lipR) return;
      const lipHeight = arch.cy + archHalfHeight(distance, arch.lipR, arch.power);
      const wheelHeight = distance < arch.rc
        ? arch.cy + archHalfHeight(distance, arch.rc, 2)
        : arch.cy;
      const minimum = Math.max(lipHeight + 0.105, wheelHeight + 0.085);
      const difference = hood - minimum;
      hood = (hood + minimum + Math.sqrt(difference * difference + 0.01 * 0.01)) / 2;
    });
    return Math.min(H - 0.012, hood);
  };
  const cabinAt = (s: number) => {
    const frontBlend = smoothstep(Math.max(hoodFrontS, cowlS - 0.09), roofFrontS - 0.015, s);
    if (hatchback) return frontBlend;
    const backBlend = 1 - smoothstep(roofRearS, rearGlassS + (hatchback ? 0.025 : 0.035), s);
    return frontBlend * backBlend;
  };

  // Plan/side-view curvature of the front and rear faces. The centre of each face sits at
  // ±L/2, corners and top/bottom recede inward, so overall length stays exactly L.
  const frontReach = clamp(arches[0].s - arches[0].rc / Lb - 0.012, 0.03, 0.14);
  const rearReach = clamp(1 - (arches[1].s + arches[1].rc / Lb) - 0.012, 0.03, 0.14);
  const frontBow = Math.min(clamp(config.frontBow / 1000, 0, 0.4), (frontReach * Lb) / 1.6);
  const rearBow = Math.min(clamp(config.rearBow / 1000, 0, 0.4), (rearReach * Lb) / 1.6);
  const recessFor = (bow: number, hw: number, yLow: number, yHigh: number) => {
    const yMid = (yLow + yHigh) / 2;
    const hh = Math.max(0.1, (yHigh - yLow) / 2);
    return (z: number, y: number) => {
      const zn = clamp(Math.abs(z) / Math.max(0.05, hw), 0, 1.1);
      const yn = clamp((y - yMid) / hh, -1.2, 1.2);
      // Upper half (hood lip / deck) rolls back more than the bumper lip.
      return bow * (zn * zn + (yn > 0 ? 0.5 : 0.15) * yn * yn);
    };
  };
  const frontRecess = recessFor(frontBow, halfWidthAt(0), floor, topAt(0));
  const rearRecess = recessFor(rearBow, halfWidthAt(1), floor, topAt(1));

  const greenhouse = (s: number) => topAt(s) - beltAt(s);
  let start = cowlS;
  for (let s = cowlS; s < roofRearS; s += 0.002) {
    if (greenhouse(s) >= 0.165) {
      start = s;
      break;
    }
  }
  let endLimit = roofRearS;
  for (let s = Math.min(0.99, tailDeckS); s > roofRearS; s -= 0.002) {
    if (greenhouse(s) >= 0.165) {
      endLimit = s;
      break;
    }
  }
  const end = style.cPillar !== null
    ? Math.min(endLimit, roofRearS + style.cPillar * (rearGlassS - roofRearS))
    : Math.min(endLimit - 0.015, roofRearS + (rearGlassS - roofRearS) * 0.32);
  const pillars = style.pillars.map((ratio, index) => {
    const split = clamp(config.doorSplitPercent / 100, 0.24, style.pillars.length > 1 ? style.pillars[1] - 0.12 : 0.72);
    return mix(start, end, index === 0 ? split : ratio);
  });

  const hw0 = halfWidthAt(0);
  const noseSpan = nose - floor;
  let gh = clamp(config.grilleHeight / 100, 0.1, 0.42) * noseSpan;
  gh = Math.max(0.035, Math.min(gh, (nose - 0.07 - (floor + 0.05)) / 2));
  const gc = clamp(floor + style.grille.c * noseSpan, floor + 0.05 + gh, nose - 0.07 - gh);

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
    crown: 0.03 + (0.05 * config.hoodShape) / 100,
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
    tailDeckS,
    hatchback,
    rearGlassBottom: rearGlassY,
    arches,
    glass: { start, end, pillars, pillarHalf: 0.05 / Lb },
    grille: { gw: clamp(config.grilleWidth / 100, 0.4, 0.82) * hw0, gh, gc, p: style.grille.p },
  };
}

/* ------------------------------------------------------------------ */
/* Section stations                                                    */
/* ------------------------------------------------------------------ */

function makeStations(frame: VehicleFrame, density: CageDensity) {
  const entries: Array<{ s: number; priority: number; arch?: boolean }> = [];
  const push = (s: number, priority: number, arch = false) => {
    if (s >= 0 && s <= 1) entries.push({ s, priority, arch });
  };
  push(0, 10);
  push(1, 10);
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
  push((frame.roofFrontS + frame.roofRearS) / 2, 4);
  push(frame.roofRearS, 8);
  push(frame.rearGlassS, 8);
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
    const minimum = last && last.arch && entry.arch ? 0.005 : 0.008;
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
  for (const arch of frame.arches) {
    const dx = Math.abs(x - arch.x);
    if (dx <= arch.rc + 1e-5) {
      y3 = Math.max(rockerTop - 0.035, arch.cy + archHalfHeight(dx, arch.rc, 2));
    }
    if (dx < arch.lipR) {
      const lipHeight = arch.cy + archHalfHeight(dx, arch.lipR, arch.power);
      const blendWidth = Math.min(0.16, arch.lipR * 0.24);
      const fade = 1 - smoothstep(arch.lipR - blendWidth, arch.lipR, dx);
      y4 = smoothMax(y4, mix(y4, lipHeight, fade), 0.004);
    }
    const influence = 1 - smoothstep(arch.lipR - 0.04, arch.lipR + 0.25, dx);
    flareDistance = Math.max(flareDistance, arch.flare * influence);
  }

  const hoodZone = 1 - smoothstep(frame.cowlS - 0.01, frame.cowlS + 0.045, s);
  const hoodSpan = Math.max(0.025, frame.hoodEndS - frame.hoodFrontS);
  const hoodT = clamp((s - frame.hoodFrontS) / hoodSpan, 0, 1);
  const broadSwell = (0.023 + config.hoodShape * 0.00022) * Math.sin(Math.PI * hoodT) ** 2;
  const dome = (frame.hoodDomeAt(s) + broadSwell) * hoodZone;
  const hoodW = frame.hoodW;
  const edgeDrop = frame.hoodEdgeDrop * hoodZone * smoothstep(frame.hoodFrontS * 0.4, frame.hoodFrontS * 1.7, s);
  const deckY = (zf: number) =>
    top
    + dome * (1 - zf * zf)
    - frame.crown * zf * zf
    - edgeDrop * smoothstep(hoodW - 0.02, hoodW + 0.1, zf);
  const g = frame.cabinAt(s);
  const shoulderZ = style.shoulder - 0.018 * hard;
  const fenderMid = (hoodW + 0.93) / 2;
  const deck: Array<[number, number]> = [
    [0.985, deckY(0.985) - 0.022],
    [0.93, deckY(0.93)],
    [fenderMid, deckY(fenderMid)],
    [hoodW, deckY(hoodW)],
    [hoodW * 0.5, deckY(hoodW * 0.5)],
    [0, deckY(0)],
  ];
  const y8c = Math.min(belt + 0.014, top - 0.075);
  const y10c = top - Math.min(style.railDrop, (top - y8c) * 0.42);
  const y9c = Math.max(
    y8c + 0.012,
    Math.min(y10c - 0.012, y8c + (y10c - y8c) * clamp(config.windowHeightPercent / 100, 0.55, 0.98)),
  );
  const z8c = shoulderZ - 0.045;
  const roofFactor = frame.hatchback
    ? mix(style.roofEdge, Math.min(z8c - 0.015, 0.9), smoothstep(frame.roofRearS, 1, s))
    : style.roofEdge;
  const t9 = clamp((y9c - y8c) / Math.max(0.001, y10c - y8c), 0, 1);
  const z9c = mix(z8c, roofFactor, t9) + 0.012 * Math.sin(Math.PI * t9);
  const cabin: Array<[number, number]> = [
    [shoulderZ, Math.min(belt - 0.012, y8c - 0.026)],
    [z8c, y8c],
    [z9c, y9c],
    [roofFactor, y10c],
    [roofFactor * 0.55, top - 0.014],
    [0, top],
  ];
  const upper = deck.map(([zd, yd], index) => [
    mix(zd, cabin[index][0], g) * hw,
    mix(yd, cabin[index][1], g),
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
  const fenderTarget = y4 + 0.074 * archInfluence;
  const lift = Math.min(
    Math.max(0, smoothMax(upper[0][1], fenderTarget, 0.009) - upper[0][1]),
    Math.max(0, upper[5][1] - upper[0][1] - 0.048),
  );
  const liftWeights = [1, 0.93, 0.73, 0.46, 0.18];
  liftWeights.forEach((weight, index) => { upper[index][1] += lift * weight; });
  for (let index = 1; index < upper.length - 1; index += 1) {
    upper[index][1] = Math.max(upper[index][1], upper[index - 1][1] + 0.004);
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

  return [
    [0, floor],
    [0.955 * hw, rockerBottom],
    [(0.988 + flare * 0.9) * hw, y3],
    [(1 + flare) * hw, y4],
    [(1 + bulge + flare * 0.35) * hw - doorHollow, y5],
    [(1.012 + bulge * 0.5) * hw, y6],
    ...upper,
  ];
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

/** Regular quadrilateral front panel, isolated from the uneven body-section perimeter. */
function fillClosedFront(
  vertices: Point3[],
  outerBase: number,
  frame: VehicleFrame,
  gridOutput: number[][],
): number[][] {
  const halfWidth = Math.min(frame.halfWidthAt(0) * 0.8, Math.abs(vertices[outerBase + 3][2]) * 0.9);
  const bottom = frame.floor + Math.max(0.055, (frame.nose - frame.floor) * 0.12);
  const top = Math.min(frame.nose - 0.025, Math.max(bottom + 0.2, frame.nose - 0.052));
  const profile: Array<[number, number]> = [];
  for (let ring = 0; ring <= HALF; ring += 1) {
    if (ring <= 3) profile.push([halfWidth * ring / 3, bottom]);
    else if (ring <= 8) profile.push([halfWidth, mix(bottom, top, (ring - 3) / 5)]);
    else profile.push([halfWidth * (11 - ring) / 3, top]);
  }
  const faceRingBase = vertices.length;
  const regularRing = ringFromHalf(profile, -frame.L / 2);
  regularRing.forEach((point, ring) => {
    const outer = vertices[outerBase + ring];
    point[0] = Math.max(outer[0] + 0.088, -frame.L / 2 + 0.05 + frame.frontRecess(point[2], point[1]) * 0.45);
  });
  vertices.push(...regularRing);

  const faces: number[][] = [];
  for (let ring = 0; ring < RING_COUNT; ring += 1) {
    const next = (ring + 1) % RING_COUNT;
    faces.push([outerBase + ring, outerBase + next, faceRingBase + next, faceRingBase + ring]);
  }
  const panelStart = vertices.length;
  const panelRing = Array.from({ length: RING_COUNT }, (_, ring) => faceRingBase + ring);
  faces.push(...gridFill(vertices, panelRing, 3, HALF - 3, (u, v) => [
    -(0.09 + frame.frontBow * 0.15) * Math.sin(Math.PI * u) * Math.sin(Math.PI * v), 0, 0,
  ], [-1, 0, 0], 0, gridOutput));
  for (let index = panelStart; index < vertices.length; index += 1) {
    vertices[index][0] = Math.max(-frame.L / 2, vertices[index][0]);
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
    for (let row = 4; row <= 10; row += 1) {
      for (let coordinate = 0; coordinate <= 1; coordinate += 1) {
        const guide = mix(guideHalves[index - 1][row][coordinate], guideHalves[index + 1][row][coordinate], ratio);
        halves[index][row][coordinate] = mix(halves[index][row][coordinate], guide, nearArch ? 0.1 : 0.18);
      }
    }
  }
  sections.forEach((s, index) => vertices.push(...ringFromHalf(halves[index], frame.xAt(s))));

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
  // Per-loop shifts reused by the inner rings so ring spacing never inverts.
  const frontRingShift = Array.from({ length: N }, (_, k) => vertices[k][0] - frame.xAt(0));
  const rearRingShift = Array.from({ length: N }, (_, k) => frame.xAt(1) - vertices[(S - 1) * N + k][0]);

  // Front: perimeter -> fascia -> surround. Optional grille removes the centre quads.
  const half0 = halves[0];
  const lengths = [0];
  for (let k = 1; k <= HALF; k += 1) {
    lengths.push(lengths[k - 1] + Math.hypot(half0[k][0] - half0[k - 1][0], half0[k][1] - half0[k - 1][1]));
  }
  const total = lengths[HALF];
  const { gw, gh, gc, p } = frame.grille;
  const openingHalf = half0.map((_, k) => {
    const phi = -Math.PI / 2 + (Math.PI * lengths[k]) / total;
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    return [
      gw * Math.sign(c) * Math.abs(c) ** (2 / p),
      gc + gh * Math.sign(sn) * Math.abs(sn) ** (2 / p),
    ] as [number, number];
  });
  const fasciaHalf = half0.map(([z, y], k) => [mix(z, openingHalf[k][0], 0.38), mix(y, openingHalf[k][1], 0.38)] as [number, number]);
  const surroundHalf = fasciaHalf.map(([z, y], k) => [mix(z, openingHalf[k][0], 0.7), mix(y, openingHalf[k][1], 0.7)] as [number, number]);
  const fBase = vertices.length;
  const fasciaRing = ringFromHalf(fasciaHalf, -frame.L / 2);
  const bumperOffsets = fasciaRing.map((point) => {
    const lateral = clamp(Math.abs(point[2]) / Math.max(0.001, frame.halfWidthAt(0)), 0, 1);
    const height = clamp((point[1] - frame.floor) / Math.max(0.001, frame.nose - frame.floor), 0, 1);
    const lowerBumper = 1 - smoothstep(0.2, 0.7, height);
    return 0.015 + 0.03 * lateral * lateral - clamp(config.bumperDepth / 1000, 0, 0.06) * lowerBumper * 0.5;
  });
  const bumperDatum = Math.min(...bumperOffsets);
  fasciaRing.forEach((point, k) => { point[0] += bumperOffsets[k] - bumperDatum; });
  fasciaRing.forEach((point, k) => { point[0] += frontRingShift[k]; });
  vertices.push(...fasciaRing);
  const surroundBase = vertices.length;
  const surroundRing = ringFromHalf(surroundHalf, -frame.L / 2 + 0.012);
  surroundRing.forEach((point, k) => { point[0] += frontRingShift[k]; });
  vertices.push(...surroundRing);
  const oBase = vertices.length;
  const openingRing = ringFromHalf(openingHalf, -frame.L / 2 + 0.03);
  openingRing.forEach((point, k) => { point[0] += frontRingShift[k]; });
  vertices.push(...openingRing);

  // Rear: perimeter → rear fascia ring → all-quad grid cap
  const halfLast = halves[S - 1];
  const rearCenterY = (frame.floor + frame.tailTop) / 2;
  const rearHalf = halfLast.map(([z, y]) => [
    z * (frame.hatchback ? 0.9 : 0.76),
    mix(y, rearCenterY, frame.hatchback ? 0.1 : 0.24),
  ] as [number, number]);
  const rBase = vertices.length;
  const rearRing = ringFromHalf(rearHalf, frame.L / 2);
  rearRing.forEach((point, k) => { point[0] -= rearRingShift[k]; });
  vertices.push(...rearRing);

  const faces: number[][] = [];
  const sideGlass: number[][] = [];
  const windshield: number[][] = [];
  const rearGlass: number[][] = [];
  const frontPanelGrid: number[][] = [];
  const quad = (prev: number, next: number, r: number) => [prev + r, next + r, next + ((r + 1) % N), prev + ((r + 1) % N)];

  for (let r = 0; r < N; r += 1) {
    if (config.hasGrille) {
      faces.push(quad(oBase, surroundBase, r));
      faces.push(quad(surroundBase, fBase, r));
    }
    faces.push(quad(fBase, 0, r));
  }
  if (!config.hasGrille) {
    faces.push(...fillClosedFront(vertices, fBase, frame, frontPanelGrid));
  }

  for (let i = 0; i < S - 1; i += 1) {
    const middle = (sections[i] + sections[i + 1]) / 2;
    const xm = frame.xAt(middle);
    const inArch = frame.arches.some((arch) => Math.abs(xm - arch.x) < arch.rc);
    const pillarBand = frame.glass.pillars.some((pillar) => Math.abs(middle - pillar) < frame.glass.pillarHalf * 1.1);
    const isSideGlass = middle > frame.glass.start && middle < frame.glass.end && !pillarBand;
    const isWindshield = middle > frame.cowlS && middle < frame.roofFrontS;
    const isRearGlass = middle > frame.roofRearS && middle < frame.rearGlassS;
    for (let r = 0; r < N; r += 1) {
      const face = quad(i * N, (i + 1) * N, r);
      if (inArch && (r === 1 || r === N - 2)) continue;
      if (isSideGlass && (r === 7 || r === N - 8)) {
        sideGlass.push(face);
        continue;
      }
      if (r >= 9 && r <= 12 && isWindshield) {
        windshield.push(face);
        continue;
      }
      if (r >= 9 && r <= 12 && isRearGlass) {
        rearGlass.push(face);
        continue;
      }
      faces.push(face);
    }
  }

  for (let r = 0; r < N; r += 1) faces.push(quad((S - 1) * N, rBase, r));
  const rearLoop = Array.from({ length: N }, (_, r) => rBase + r);
  // The cap centre is the rearmost point (x = +L/2); curvature comes from the recessed loop.
  const rearCapStart = vertices.length;
  faces.push(...gridFill(vertices, rearLoop, 3, HALF - 3, () => [0, 0, 0], [1, 0, 0], 6));
  for (let index = rearCapStart; index < vertices.length; index += 1) {
    vertices[index][0] = Math.min(frame.L / 2, vertices[index][0]);
  }

  const grilleVertices: Point3[] = [];
  const grilleFaces: number[][] = [];
  if (config.hasGrille) {
    grilleVertices.push(...ringFromHalf(openingHalf, -frame.L / 2 + 0.058));
    grilleVertices.forEach((point, k) => { point[0] += frontRingShift[k]; });
    grilleFaces.push(...gridFill(
      grilleVertices,
      Array.from({ length: N }, (_, r) => r),
      3,
      HALF - 3,
      (u, v) => [-0.008 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v), 0, 0],
      [-1, 0, 0],
    ));
  }

  // Creases
  const edgeCounts = new Map<string, { a: number; b: number; count: number }>();
  faces.forEach((face) => face.forEach((a, index) => {
    const b = face[(index + 1) % face.length];
    const key = edgeKey(a, b);
    const current = edgeCounts.get(key) ?? { a, b, count: 0 };
    current.count += 1;
    edgeCounts.set(key, current);
  }));
  const edgeSet = new Set(edgeCounts.keys());
  const glassEdges = new Set<string>();
  [...sideGlass, ...windshield, ...rearGlass].forEach((face) => face.forEach((a, index) => {
    glassEdges.add(edgeKey(a, face[(index + 1) % face.length]));
  }));
  const creaseMap = new Map(buildCreases(frame, config, sections, edgeSet).map((crease) => [edgeKey(crease.a, crease.b), crease]));
  for (let ring = 0; ring < N && config.hasGrille; ring += 1) {
    const a = surroundBase + ring;
    const b = surroundBase + ((ring + 1) % N);
    const key = edgeKey(a, b);
    if (edgeSet.has(key)) creaseMap.set(key, { a, b, weight: 0.75 + config.surfaceHardness / 100, feature: "grille-surround" });
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
        : middle[0] < -frame.L / 2 + 0.12
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

function buildCreases(frame: VehicleFrame, config: VehicleConfig, sections: number[], edgeSet: Set<string>) {
  const N = RING_COUNT;
  const hard = clamp(config.surfaceHardness / 100, 0, 1);
  const map = new Map<string, Crease>();
  const addCrease = (a: number, b: number, weight: number, feature: string) => {
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
    longitudinal(i, 1, 0.5 + 0.7 * hard, "rocker-lower-edge");
    longitudinal(i, 2, inArch ? 1.5 + 1.2 * hard : 0.6 + 1.0 * hard, inArch ? "wheel-arch-opening" : "rocker-line");
    longitudinal(i, 3, inLip ? 1.6 + 1.4 * hard : 0.25 + 0.4 * hard, inLip ? "wheel-arch-lip" : "lower-body-line");
    longitudinal(i, 5, endFade * (0.55 + 1.6 * hard), "feature-line");
    longitudinal(i, 6, cabin > 0.5 ? 0.5 + 0.9 * hard : 0.9 + 1.1 * hard, cabin > 0.5 ? "shoulder" : "fender-edge");
    if (middle < frame.cowlS) {
      longitudinal(i, 9, config.type === "mpv" ? 0.35 + 0.75 * hard : 0.7 + 1.25 * hard, "hood-edge");
      if (middle > frame.hoodFrontS) longitudinal(i, 10, 0.2 + 0.55 * hard, "hood-character-line");
    }
    if (middle > frame.roofFrontS && middle < frame.roofRearS) longitudinal(i, 9, 1.2 + 1.2 * hard, "roof-rail");
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

  const last = sections.length - 1;
  for (let r = 0; r < N; r += 1) {
    addCrease(last * N + r, last * N + ((r + 1) % N), frame.hatchback ? 0.25 + 0.55 * hard : 0.7 + 0.9 * hard, "rear-corner");
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
  creases: Map<string, number>;
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
  const edges = new Map<string, SubdEdge>();
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

  const edgeIndex = new Map<string, number>();
  const nextCreases = new Map<string, number>();
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
  const edgeCounts = new Map<string, { a: number; b: number; count: number }>();
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
  const edges = new Map<string, { a: number; b: number; count: number }>();
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
  const normals = computePatchNormals(mesh);
  const counts = new Map<string, number>();
  mesh.faces.forEach((face) =>
    face.forEach((v, k) => {
      const key = edgeKey(v, face[(k + 1) % face.length]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }),
  );
  const vertices = [...mesh.vertices];
  const faces = includeBody ? [...mesh.faces] : [];
  const outer = new Map<number, number>();
  const inner = new Map<number, number>();
  const outerOf = (v: number) => {
    if (!outer.has(v)) {
      outer.set(v, vertices.length);
      vertices.push([...mesh.vertices[v]] as Point3);
    }
    return outer.get(v)!;
  };
  const innerOf = (v: number) => {
    if (!inner.has(v)) {
      const p = mesh.vertices[v];
      const n = normals[v];
      inner.set(v, vertices.length);
      vertices.push([p[0] - n.x * depth, p[1] - n.y * depth, p[2] - n.z * depth]);
    }
    return inner.get(v)!;
  };
  mesh.faces.forEach((face) =>
    face.forEach((a, k) => {
      const b = face[(k + 1) % face.length];
      if (counts.get(edgeKey(a, b)) !== 1) return;
      faces.push([outerOf(b), outerOf(a), innerOf(a), innerOf(b)]);
    }),
  );
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
  const normals = computePatchNormals(mesh);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(mesh.vertices.flat(), 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals.flatMap((n) => [n.x, n.y, n.z]), 3));
  const indices: number[] = [];
  mesh.faces.forEach((face) => {
    for (let i = 1; i < face.length - 1; i += 1) indices.push(face[0], face[i], face[i + 1]);
  });
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/** Quad edge lines only (no triangle diagonals) – used for wireframe & cage displays. */
export function patchEdgesGeometry(vertices: Point3[], faces: number[][]) {
  const positions: number[] = [];
  const seen = new Set<string>();
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
