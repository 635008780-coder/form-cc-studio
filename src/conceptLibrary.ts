import { getTireSpecification, vehiclePresets, type VehicleConfig, type VehicleType } from "./vehicleModel";

export interface ConceptTemplate {
  id: string;
  type: VehicleType;
  name: string;
  description: string;
  /** Public dimensions of the real car this prototype is based on (or a note for generic bases). */
  reference: string;
  overrides: Partial<VehicleConfig>;
}

// Each base is an original parametric body set to the typical overall dimensions of its
// market segment. Names describe the styling direction only; no third-party meshes are embedded.
export const conceptTemplates: ConceptTemplate[] = [
  {
    id: "sedan-classic",
    type: "sedan",
    name: "经典直立三厢",
    description: "短机盖 / 平直腰线 / 高后备厢",
    reference: "基准尺寸：4475×1706×1469 mm · 轴距 2603 · 185/60 R15",
    overrides: {},
  },
  {
    id: "sedan-fastback",
    type: "sedan",
    name: "运动溜背轿车",
    description: "低车顶 / 长机盖 / 宽肩线",
    reference: "基准尺寸：4700×1840×1430 mm · 轴距 2810",
    overrides: {
      templateId: "sedan-fastback", length: 4700, width: 1840, height: 1430,
      wheelDiameterInches: 18, tireStyle: "road", wheelArch: 395, archClearance: 35,
      frontAxleFromFront: 960, rearAxleFromTail: 930,
      windshieldAngle: 64, windshieldPosition: 1480, hoodShape: 54, beltline: 1010,
      beltlineSlope: 45, windowHeightPercent: 78, doorSplitPercent: 52,
      sideTrend: 55, surfaceHardness: 58, groundClearance: 150,
      roofEndPercent: 72, roofWidthPercent: 66, frontHeightOffset: 0, rearHeightOffset: 0,
      frontFlare: 16, rearFlare: 22, archLipWidth: 55, archShape: 0,
      frontWheelInset: 18, rearWheelInset: 18, sideSculpt: 45,
      grilleWidth: 66, grilleHeight: 26, grillePattern: "mesh",
      headlampWidth: 100, headlampHeight: 100, bumperDepth: 35, headlampStyle: "wide",
      hoodWidthPercent: 70, hoodDome: 30, hoodEdgeDrop: 22, noseLift: 55, hoodRearDrop: 75,
      noseHeightPercent: 47, tailHeightPercent: 60, noseWidthPercent: 80, tailWidthPercent: 78,
      hoodGlassBlend: 0, frontBow: 150, rearBow: 120,
      rearGlassSpan: 15, tailDeckPercent: 95, paintColor: "#aebbbd",
    },
  },
  {
    id: "suv-rounded",
    type: "suv",
    name: "圆润豪华 SUV",
    description: "高姿态 / 宽机盖 / 悬浮车顶",
    reference: "基准尺寸：4800×1930×1730 mm · 轴距 2880 · 265/50 R20",
    overrides: {},
  },
  {
    id: "suv-rugged",
    type: "suv",
    name: "现代硬派 SUV",
    description: "短机盖 / 直立座舱 / 圆中带方轮眉",
    reference: "基准尺寸：4780×1900×1820 mm · 轴距 2790 · 265/65 R17 越野胎",
    overrides: {
      templateId: "suv-rugged", length: 4780, width: 1900, height: 1820,
      wheelDiameterInches: 17, tireStyle: "allTerrain", wheelArch: 445, archClearance: 55,
      frontAxleFromFront: 820, rearAxleFromTail: 1170,
      windshieldAngle: 47, windshieldPosition: 1320, hoodShape: 50, beltline: 1220,
      beltlineSlope: 10, windowHeightPercent: 90, doorSplitPercent: 45,
      sideTrend: 45, surfaceHardness: 61, groundClearance: 235,
      roofEndPercent: 89, roofWidthPercent: 81, frontHeightOffset: 0, rearHeightOffset: 0,
      frontFlare: 34, rearFlare: 40, archLipWidth: 65, archShape: 32,
      frontWheelInset: 20, rearWheelInset: 20, sideSculpt: 18,
      hasGrille: true, grilleWidth: 66, grilleHeight: 31, grillePattern: "horizontal",
      headlampWidth: 100, headlampHeight: 100, bumperDepth: 40, headlampStyle: "round",
      hoodWidthPercent: 74, hoodDome: 34, hoodEdgeDrop: 24, noseLift: 35, hoodRearDrop: 85,
      hoodGlassBlend: 10, frontBow: 75, rearBow: 55,
      noseHeightPercent: 53, tailHeightPercent: 72, noseWidthPercent: 86, tailWidthPercent: 91,
      rearGlassSpan: 8, tailDeckPercent: 99, paintColor: "#d9d8cf",
    },
  },
  {
    id: "mpv-van",
    type: "mpv",
    name: "厢式面包车",
    description: "座舱前置 / 极短机盖 / 机盖接风挡",
    reference: "基准尺寸：4420×1685×1770 mm · 轴距 2720 · 185/65 R14",
    overrides: {},
  },
  {
    id: "mpv-executive",
    type: "mpv",
    name: "商务 MPV",
    description: "长车顶 / 大侧窗 / 滑门",
    reference: "基准尺寸：5150×1900×1830 mm · 轴距 3200",
    overrides: {
      templateId: "mpv-executive", length: 5150, width: 1900, height: 1830,
      wheelDiameterInches: 18, tireStyle: "road", wheelArch: 420, archClearance: 35,
      frontAxleFromFront: 930, rearAxleFromTail: 1020,
      windshieldAngle: 56, windshieldPosition: 1180, hoodShape: 42, beltline: 1130,
      beltlineSlope: 5, windowHeightPercent: 92, doorSplitPercent: 35,
      sideTrend: 46, surfaceHardness: 50, groundClearance: 200,
      roofEndPercent: 90, roofWidthPercent: 84, frontHeightOffset: 0, rearHeightOffset: 0,
      frontFlare: 12, rearFlare: 14, archLipWidth: 55, archShape: 8,
      frontWheelInset: 18, rearWheelInset: 18, sideSculpt: 23,
      grilleWidth: 70, grilleHeight: 30, grillePattern: "vertical",
      headlampWidth: 100, headlampHeight: 100, bumperDepth: 28, headlampStyle: "wide",
      hoodWidthPercent: 78, hoodDome: 16, hoodEdgeDrop: 12, noseLift: 40, hoodRearDrop: 50,
      hoodGlassBlend: 95, frontBow: 170, rearBow: 60,
      noseHeightPercent: 48, tailHeightPercent: 67, noseWidthPercent: 86, tailWidthPercent: 92,
      rearGlassSpan: 7, tailDeckPercent: 99, paintColor: "#aebbbd",
    },
  },
  {
    id: "micro-cube",
    type: "micro",
    name: "立方体微型车",
    description: "超短前后悬 / 直立车身 / 内凹门板",
    reference: "基准尺寸：2920×1493×1621 mm · 轴距 1940 · 145/70 R12",
    overrides: {},
  },
  {
    id: "micro-city",
    type: "micro",
    name: "圆润都市两厢",
    description: "圆形大灯 / 高座舱",
    reference: "基准尺寸：3660×1690×1600 mm · 轴距 2430",
    overrides: {
      templateId: "micro-city", length: 3660, width: 1690, height: 1600,
      wheelDiameterInches: 16, tireStyle: "road", wheelArch: 365, archClearance: 35,
      frontAxleFromFront: 610, rearAxleFromTail: 620,
      windshieldAngle: 52, windshieldPosition: 1100, hoodShape: 43, beltline: 1010,
      beltlineSlope: 20, windowHeightPercent: 86, doorSplitPercent: 54,
      sideTrend: 49, surfaceHardness: 42, groundClearance: 200,
      roofEndPercent: 84, roofWidthPercent: 82, frontHeightOffset: 0, rearHeightOffset: 0,
      frontFlare: 14, rearFlare: 16, archLipWidth: 50, archShape: 5,
      frontWheelInset: 12, rearWheelInset: 12, sideSculpt: 25,
      hasGrille: true, grilleWidth: 52, grilleHeight: 18, grillePattern: "horizontal",
      headlampWidth: 100, headlampHeight: 100, bumperDepth: 20, headlampStyle: "round",
      hoodWidthPercent: 74, hoodDome: 14, hoodEdgeDrop: 14, noseLift: 50, hoodRearDrop: 70,
      hoodGlassBlend: 20, frontBow: 190, rearBow: 150,
      noseHeightPercent: 50, tailHeightPercent: 68, noseWidthPercent: 84, tailWidthPercent: 90,
      rearGlassSpan: 12, tailDeckPercent: 99, paintColor: "#b8a388",
    },
  },
];

export function createTemplateConfig(template: ConceptTemplate): VehicleConfig {
  const config: VehicleConfig = {
    ...vehiclePresets[template.type],
    ...template.overrides,
    type: template.type,
    templateId: template.id,
  };
  config.wheelbase = config.length - config.frontAxleFromFront - config.rearAxleFromTail;
  config.tireDiameter = getTireSpecification(config).diameter;
  config.wheelArch = Math.max(config.wheelArch, Math.ceil((config.tireDiameter / 2 + config.archClearance) / 5) * 5);
  return config;
}
