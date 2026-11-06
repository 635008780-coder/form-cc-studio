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
      wheelDiameterInches: 18, tireStyle: "road", wheelArch: 380, archClearance: 35,
      frontAxleFromFront: 960, rearAxleFromTail: 930,
      windshieldAngle: 64, windshieldPosition: 1480, hoodShape: 54, beltline: 970,
      beltlineSlope: 45, windowHeightPercent: 78, doorSplitPercent: 52,
      sideTrend: 55, surfaceHardness: 58, groundClearance: 150,
      roofEndPercent: 72, roofWidthPercent: 66, frontHeightOffset: 0, rearHeightOffset: 0,
      frontFlare: 16, rearFlare: 22, archLipWidth: 42, archShape: 0,
      frontWheelInset: 18, rearWheelInset: 18, sideSculpt: 45,
      grilleWidth: 66, grilleHeight: 26, grillePattern: "mesh",
      headlampWidth: 100, headlampHeight: 100, bumperDepth: 35, headlampStyle: "wide",
      hoodWidthPercent: 70, hoodDome: 22, hoodEdgeDrop: 12, noseLift: 55, hoodRearDrop: 75,
      noseHeightPercent: 47, tailHeightPercent: 64, noseWidthPercent: 80, tailWidthPercent: 78,
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
      windshieldAngle: 40, windshieldPosition: 1320, hoodShape: 50, beltline: 1220,
      beltlineSlope: 10, windowHeightPercent: 90, doorSplitPercent: 50,
      sideTrend: 45, surfaceHardness: 61, groundClearance: 235,
      roofEndPercent: 89, roofWidthPercent: 81, frontHeightOffset: 0, rearHeightOffset: 0,
      frontFlare: 34, rearFlare: 40, archLipWidth: 65, archShape: 32,
      frontWheelInset: 20, rearWheelInset: 20, sideSculpt: 18,
      hasGrille: false, grilleWidth: 66, grilleHeight: 31, grillePattern: "horizontal",
      headlampWidth: 100, headlampHeight: 100, bumperDepth: 40, headlampStyle: "round",
      hoodWidthPercent: 74, hoodDome: 34, hoodEdgeDrop: 24, noseLift: 35, hoodRearDrop: 85,
      hoodGlassBlend: 10, frontBow: 75, rearBow: 55,
      noseHeightPercent: 58, tailHeightPercent: 72, noseWidthPercent: 86, tailWidthPercent: 91,
      rearGlassSpan: 5, tailDeckPercent: 99, paintColor: "#d9d8cf",
    },
  },
  {
    id: "mpv-van",
    type: "mpv",
    name: "厢式面包车",
    description: "方盒车身 / 平直侧板 / 竖直尾门 / 极短车头",
    reference: "基准尺寸：4420×1685×1770 mm · 轴距 2720 · 185/65 R14",
    overrides: {},
  },
  {
    id: "mpv-executive",
    type: "mpv",
    name: "豪华商务 MPV",
    description: "高大直立前脸 / 巨幅竖格栅 / 短机盖 / 平直长车顶 / 悬浮黑色立柱 / 镀铬窗线 / 贯穿尾灯",
    reference: "基准尺寸：5200×1960×1920 mm · 轴距 3200 · 255/45 R20",
    overrides: {
      templateId: "mpv-executive", length: 5200, width: 1960, height: 1920,
      wheelDiameterInches: 20, tireStyle: "road", wheelArch: 420, archClearance: 30,
      frontAxleFromFront: 960, rearAxleFromTail: 1040,
      windshieldAngle: 60, windshieldPosition: 1240, hoodShape: 55, beltline: 1160,
      beltlineSlope: 18, windowHeightPercent: 88, doorSplitPercent: 47,
      sideTrend: 54, surfaceHardness: 46, groundClearance: 165,
      roofEndPercent: 91, roofWidthPercent: 86, frontHeightOffset: 0, rearHeightOffset: 0,
      frontFlare: 16, rearFlare: 20, archLipWidth: 44, archShape: 30,
      frontWheelInset: 16, rearWheelInset: 16, sideSculpt: 10,
      hasGrille: true, grilleWidth: 64, grilleHeight: 40, grillePattern: "vertical", grilleOffset: 0, grilleRoundness: 12, grilleTaper: 14,
      hasLowerGrille: true, lowerGrilleWidth: 82, lowerGrilleHeight: 70, lowerGrilleTaper: 20,
      headlampWidth: 110, headlampHeight: 75, bumperDepth: 30, headlampStyle: "wide",
      hoodWidthPercent: 80, hoodDome: 30, hoodEdgeDrop: 12, noseLift: 30, hoodRearDrop: 40,
      hoodGlassBlend: 40, frontBow: 120, rearBow: 90,
      noseHeightPercent: 60, tailHeightPercent: 66, noseWidthPercent: 88, tailWidthPercent: 92,
      rearGlassSpan: 6, tailDeckPercent: 99, paintColor: "#d9d8cf",
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
    description: "圆形大灯 / 鼓胀轮眉 / 圆弧车顶与腰线",
    reference: "基准尺寸：3660×1690×1540 mm · 轴距 2430",
    overrides: {
      templateId: "micro-city", length: 3660, width: 1690, height: 1540,
      wheelDiameterInches: 16, tireStyle: "road", wheelArch: 365, archClearance: 35,
      frontAxleFromFront: 610, rearAxleFromTail: 620,
      windshieldAngle: 58, windshieldPosition: 1100, hoodShape: 43, beltline: 975,
      beltlineSlope: 30, windowHeightPercent: 86, doorSplitPercent: 54,
      sideTrend: 64, surfaceHardness: 20, groundClearance: 200,
      roofEndPercent: 84, roofWidthPercent: 72, frontHeightOffset: 0, rearHeightOffset: 0,
      frontFlare: 30, rearFlare: 34, archLipWidth: 62, archShape: 5,
      frontWheelInset: 12, rearWheelInset: 12, sideSculpt: 10,
      hasGrille: false, grilleWidth: 52, grilleHeight: 18, grillePattern: "horizontal",
      headlampWidth: 100, headlampHeight: 100, bumperDepth: 20, headlampStyle: "round",
      hoodWidthPercent: 70, hoodDome: 60, hoodEdgeDrop: 14, noseLift: 50, hoodRearDrop: 70,
      hoodGlassBlend: 20, frontBow: 250, rearBow: 210,
      noseHeightPercent: 52, tailHeightPercent: 68, noseWidthPercent: 84, tailWidthPercent: 90,
      rearGlassSpan: 14, tailDeckPercent: 99, paintColor: "#b8a388",
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
