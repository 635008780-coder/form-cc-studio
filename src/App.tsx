import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  Grid2X2,
  Layers,
  Paintbrush,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import * as THREE from "three";
import VehicleScene, { type CameraView, type DisplayMode } from "./VehicleScene";
import { buildCadBundle, buildSubdObjects, collectSceneAccessories, unweldCreases, writeFbxScene, writeObj, zipCadBundle, zipRenderMesh, type ObjUnit } from "./exporters";
import { conceptTemplates, createTemplateConfig, type ConceptTemplate } from "./conceptLibrary";
import { analyzeControlMesh, type TopologyReport } from "./topologyCheck";
import {
  buildControlMesh,
  getMinimumBodyHeight,
  getVehicleFrame,
  getTireSpecification,
  getWheelHousingLimits,
  vehicleNames,
  vehiclePresets,
  isFastbackTemplate,
  wheelDiameterOptions,
  type ControlMesh,
  type VehicleConfig,
  type VehicleType,
  type TireStyle,
  type CageDensity,
  type GrillePattern,
  type HeadlampStyle,
} from "./vehicleModel";

const STORAGE_KEY = "form-subd-workbench-v17";

const displayModes: Array<{ value: DisplayMode; label: string; short: string }> = [
  { value: "subd", label: "SubD 控制笼", short: "笼" },
  { value: "surface", label: "光顺渲染", short: "面" },
  { value: "wire", label: "曲面线框", short: "线" },
  { value: "boxmod", label: "BoxMode", short: "框" },
  { value: "xray", label: "透视", short: "透" },
];

const cameraViews: Array<{ value: CameraView; label: string }> = [
  { value: "perspective", label: "3D" },
  { value: "rearPerspective", label: "后 3D" },
  { value: "front", label: "前" },
  { value: "rear", label: "后" },
  { value: "left", label: "左" },
  { value: "right", label: "右" },
  { value: "top", label: "顶" },
  { value: "bottom", label: "底" },
];

const paintPalette = [
  { name: "珍珠白", color: "#d9d8cf" },
  { name: "钛银", color: "#aebbbd" },
  { name: "石墨灰", color: "#515b60" },
  { name: "深海蓝", color: "#365164" },
  { name: "赤陶红", color: "#853d37" },
  { name: "林地绿", color: "#526b5d" },
  { name: "暖沙金", color: "#b8a388" },
  { name: "薄荷青", color: "#79a69a" },
];

type NumericParameter = {
  [Key in keyof VehicleConfig]: VehicleConfig[Key] extends number ? Key : never;
}[keyof VehicleConfig];

interface ParameterFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}

function ParameterField({ label, value, min, max, step = 10, unit, onChange }: ParameterFieldProps) {
  const progress = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 100;
  const [draft, setDraft] = useState(String(Math.round(value)));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(Math.round(value)));
  }, [editing, value]);

  const commit = () => {
    const next = Number(draft);
    if (draft.trim() && Number.isFinite(next)) onChange(Math.max(min, Math.min(max, next)));
    else setDraft(String(Math.round(value)));
    setEditing(false);
  };

  return (
    <label className="parameter-field">
      <span className="parameter-label">{label}</span>
      <span className="parameter-number">
        <input
          aria-label={label}
          type="number"
          min={min}
          max={max}
          step={step}
          value={draft}
          onFocus={() => setEditing(true)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <span>{unit}</span>
      </span>
      <input
        className="parameter-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`${label}滑块`}
        style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function PaintSelector({ selected, onSelect }: { selected: string; onSelect: (color: string) => void }) {
  const current = paintPalette.find((paint) => paint.color.toLowerCase() === selected.toLowerCase());

  return (
    <section className="paint-section">
      <div className="panel-section-caption">
        <span className="paint-label"><Paintbrush size={13} />车身颜色</span>
        <span>{current?.name ?? "自定义"}</span>
      </div>
      <div className="paint-swatches" role="group" aria-label="选择车漆颜色">
        {paintPalette.map((paint) => (
          <button
            key={paint.color}
            type="button"
            className={`paint-swatch ${selected.toLowerCase() === paint.color.toLowerCase() ? "paint-swatch-active" : ""}`}
            style={{ "--swatch-color": paint.color } as React.CSSProperties}
            aria-label={paint.name}
            aria-pressed={selected.toLowerCase() === paint.color.toLowerCase()}
            title={paint.name}
            onClick={() => onSelect(paint.color)}
          >
            {selected.toLowerCase() === paint.color.toLowerCase() && <Check size={12} />}
          </button>
        ))}
      </div>
    </section>
  );
}

function WheelSetup({
  config,
  onDiameter,
  onTireStyle,
}: {
  config: VehicleConfig;
  onDiameter: (diameter: number) => void;
  onTireStyle: (style: TireStyle) => void;
}) {
  const tire = getTireSpecification(config);

  return (
    <div className="wheel-setup">
      <div className="wheel-size-heading">
        <span className="parameter-label">轮辋直径</span>
        <span className="wheel-size-note">标准英寸尺寸</span>
      </div>
      <div className="wheel-size-options" role="group" aria-label="轮辋尺寸">
        {wheelDiameterOptions.map((diameter) => (
          <button
            key={diameter}
            className={config.wheelDiameterInches === diameter ? "wheel-size-selected" : ""}
            type="button"
            aria-pressed={config.wheelDiameterInches === diameter}
            onClick={() => onDiameter(diameter)}
          >
            {diameter}<small>in</small>
          </button>
        ))}
      </div>
      <div className="tire-style-options" role="group" aria-label="轮胎类型">
        <button type="button" className={config.tireStyle === "road" ? "tire-style-selected" : ""} onClick={() => onTireStyle("road")}>
          公路胎
        </button>
        <button type="button" className={config.tireStyle === "allTerrain" ? "tire-style-selected" : ""} onClick={() => onTireStyle("allTerrain")}>
          越野胎
        </button>
      </div>
      <div className="tire-specification">
        <span><i className={config.tireStyle === "allTerrain" ? "tire-type-mark tire-type-at" : "tire-type-mark"} />{tire.label}</span>
        <span>外径 {tire.diameter} mm</span>
      </div>
    </div>
  );
}

function ConceptSelector({
  config,
  onSelect,
}: {
  config: VehicleConfig;
  onSelect: (template: ConceptTemplate) => void;
}) {
  const options = conceptTemplates.filter((template) => template.type === config.type);
  const active = options.find((template) => template.id === config.templateId);
  return (
    <section className="concept-section">
      <div className="panel-section-caption"><span>基础方案</span><span>PARAMETRIC BASE</span></div>
      <div className="concept-options" role="group" aria-label="选择基础方案">
        {options.map((template) => (
          <button
            key={template.id}
            type="button"
            className={`concept-option ${config.templateId === template.id ? "concept-option-active" : ""}`}
            aria-pressed={config.templateId === template.id}
            onClick={() => onSelect(template)}
          >
            <strong>{template.name}</strong>
            <span>{template.description}</span>
          </button>
        ))}
      </div>
      <p className="concept-note concept-reference">{active?.reference}</p>
      <p className="concept-note">按该细分市场常见整车尺寸设定的原创参数化曲面，选择后可继续调节。</p>
    </section>
  );
}

function ChoiceField<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="choice-field">
      <span className="parameter-label">{label}</span>
      <div className="choice-options" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "choice-selected" : ""}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TopologySummary({ report }: { report: TopologyReport }) {
  const hasIssue = report.otherFaces > 0 || report.nonManifoldEdges > 0 || report.inconsistentEdges > 0 || report.collapsedFaces > 0 || report.overlappingPoints > 0 || report.shortEdges > 0 || report.bodyComponents !== 1;
  return (
    <div className="topology-summary">
      <div className={`topology-status ${hasIssue ? "topology-warning" : ""}`}>
        <span className="topology-status-dot" />
        {hasIssue ? "基础拓扑存在待检查项" : "主车身基础拓扑检查通过"}
      </div>
      <div className="topology-row"><span>主车身四边面 / 其他面</span><strong>{report.quadFaces} / {report.otherFaces}</strong></div>
      <div className="topology-row"><span>连通片 / 非流形边</span><strong>{report.bodyComponents} / {report.nonManifoldEdges}</strong></div>
      <div className="topology-row"><span>法向冲突 / 退化面</span><strong>{report.inconsistentEdges} / {report.collapsedFaces}</strong></div>
      <div className="topology-row"><span>重合点 &lt; 0.1 mm</span><strong>{report.overlappingPoints}</strong></div>
      <div className="topology-row"><span>短边 &lt; 5 mm / 最短边</span><strong>{report.shortEdges} / {report.shortestEdgeMm.toFixed(1)} mm</strong></div>
      <div className="topology-row"><span>内部极点 / 开口边</span><strong>{report.interiorPoles} / {report.boundaryEdges}</strong></div>
      <p>开口边包含玻璃、格栅和轮眉；部分轮眉截面仍贯穿车身，后续可在 Alias 局部重布线。此检查不能替代曲率分析。</p>
      <a href="https://help.autodesk.com/cloudhelp/2022/ENU/Alias-NURBS-Modeling/files/Generate-designs-with-Dynamo/Alias-Dynamo-Player/GUID-478A0782-A04E-453F-829A-D29FBFF7CDBA.html" target="_blank" rel="noreferrer">查看 Alias 官方 SubD Car 工具说明</a>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  open,
  onClick,
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`section-header ${open ? "is-open" : ""}`} onClick={onClick} type="button">
      <span className="section-heading-copy">
        <span className="section-title">{title}</span>
        <span className="section-subtitle">{subtitle}</span>
      </span>
      <ChevronDown size={15} strokeWidth={1.8} className="section-chevron" />
    </button>
  );
}

function CarSilhouette({ type, active }: { type: VehicleType; active: boolean }) {
  const roofPath: Record<VehicleType, string> = {
    sedan: "M11 29 L20 21 L31 16 L48 16 L60 23 L69 28",
    suv: "M10 29 L18 20 L25 16 L51 16 L61 21 L70 28",
    mpv: "M10 29 L17 20 L21 15 L51 15 L61 19 L70 28",
    micro: "M13 29 L20 21 L27 17 L48 17 L58 22 L68 28",
  };

  return (
    <svg className="car-silhouette" viewBox="0 0 80 46" fill="none" aria-hidden="true">
      <path d={roofPath[type]} stroke={active ? "#e3a373" : "#879397"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 30 C10 27 14 26 19 26 L27 25 L32 24 L52 24 L62 26 L70 27 C72 28 73 30 72 33 L69 35 L12 35 C9 34 8 32 8 30Z" stroke={active ? "#e3a373" : "#879397"} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M24 23 L30 17 M53 17 L60 24" stroke={active ? "#e3a373" : "#879397"} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="22" cy="35" r="4.1" fill="#171f23" stroke={active ? "#e3a373" : "#879397"} strokeWidth="1.6" />
      <circle cx="60" cy="35" r="4.1" fill="#171f23" stroke={active ? "#e3a373" : "#879397"} strokeWidth="1.6" />
    </svg>
  );
}

/** Download text or binary data. Returns the byte size actually written into the Blob. */
function downloadFile(filename: string, data: string | Uint8Array, contentType: string) {
  const part: BlobPart = typeof data === "string" ? data : new Uint8Array(data);
  const blob = new Blob([part], { type: contentType });
  if (blob.size === 0) throw new Error("empty export");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke late: large files and some browsers read the Blob after the click returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  return blob.size;
}

const formatSize = (bytes: number) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function createControlJson(config: VehicleConfig, mesh: ControlMesh) {
  const mm = (point: number[]) => point.map((coordinate) => Number((coordinate * 1000).toFixed(3)));
  return JSON.stringify(
    {
      document: "FORM SubD Vehicle Concept",
      version: "3.0",
      subdivision: {
        scheme: "Catmull-Clark",
        previewLevels: 2,
        unit: "mm",
        coordinateSystem: "X length / Y up / Z width",
        loopsPerSection: mesh.ringCount,
        sections: mesh.sections.length,
        creaseCount: mesh.creases.length,
        glazing: "shared-cage-subdivision",
      },
      parameters: config,
      objects: [
        {
          name: "BODY_SHELL",
          type: "all_quad_control_cage",
          controlPoints: mesh.vertices.map(mm),
          quads: mesh.faces,
          ...(mesh.frontPanelGrid.length ? { frontPanelGrid: mesh.frontPanelGrid } : {}),
          creases: mesh.creases.map(({ a, b, weight, feature }) => ({ vertices: [a, b], sharpness: Number(weight.toFixed(3)), feature })),
        },
        { name: "SIDE_GLASS", sharesPointsWith: "BODY_SHELL", quads: mesh.sideGlass },
        { name: "WINDSHIELD", sharesPointsWith: "BODY_SHELL", quads: mesh.windshield },
        { name: "REAR_GLASS", sharesPointsWith: "BODY_SHELL", quads: mesh.rearGlass },
        ...(config.hasGrille ? [{ name: "GRILLE", controlPoints: mesh.grille.vertices.map(mm), quads: mesh.grille.faces }] : []),
      ],
    },
    null,
    2,
  );
}

const numericBounds: Record<NumericParameter, [number, number]> = {
  hoodWidthPercent: [50, 88], hoodDome: [0, 90], hoodEdgeDrop: [0, 100], noseLift: [0, 150],
  hoodRearDrop: [20, 260], hoodGlassBlend: [0, 100], frontBow: [0, 350], rearBow: [0, 350], noseHeightPercent: [38, 66], tailHeightPercent: [42, 78],
  noseWidthPercent: [68, 96], tailWidthPercent: [68, 96], rearGlassSpan: [2, 18], tailDeckPercent: [88, 99],
  length: [2700, 5600], width: [1400, 2200], height: [1250, 2000], wheelbase: [1700, 3500],
  wheelDiameterInches: [12, 22], tireDiameter: [400, 1000], wheelArch: [230, 600], archClearance: [20, 90],
  frontAxleFromFront: [300, 1450], rearAxleFromTail: [300, 1450],
  windshieldAngle: [25, 75], windshieldPosition: [450, 2500], hoodShape: [0, 100],
  beltline: [820, 1380], beltlineSlope: [-120, 120], windowHeightPercent: [55, 98], doorSplitPercent: [24, 72], sideTrend: [0, 100], surfaceHardness: [0, 100],
  groundClearance: [110, 400], roofEndPercent: [62, 95], roofWidthPercent: [58, 90],
  frontHeightOffset: [-120, 120], rearHeightOffset: [-120, 120],
  frontFlare: [0, 100], rearFlare: [0, 100], archLipWidth: [25, 140], archShape: [0, 100],
  frontWheelInset: [0, 100], rearWheelInset: [0, 100], sideSculpt: [0, 100],
  grilleWidth: [40, 82], grilleHeight: [10, 42], grilleOffset: [-150, 150], grilleRoundness: [0, 100], grilleTaper: [-40, 40],
  lowerGrilleWidth: [30, 95], lowerGrilleHeight: [40, 200], lowerGrilleTaper: [0, 50], headlampWidth: [60, 130], headlampHeight: [60, 140], bumperDepth: [0, 60],
};

function normalizeTireClearance(config: VehicleConfig) {
  config.wheelArch = Math.max(config.wheelArch, Math.ceil((config.tireDiameter / 2 + config.archClearance) / 5) * 5);
  const limits = getWheelHousingLimits(config);
  if (limits.feasible) {
    config.wheelArch = Math.min(config.wheelArch, limits.maxArch);
    config.archLipWidth = Math.max(25, Math.min(config.archLipWidth, getWheelHousingLimits(config).maxLip));
  }
  config.height = Math.min(2000, Math.max(config.height, getMinimumBodyHeight(config)));
  config.groundClearance = Math.max(110, Math.min(config.groundClearance, Math.floor(config.tireDiameter / 2 + 15)));
  config.beltline = Math.max(820, Math.min(config.beltline, Math.min(1380, config.height - 270)));
  config.doorSplitPercent = Math.min(config.doorSplitPercent, config.type === "mpv" ? 58 : config.type === "suv" ? 68 : 72);
  const minCowl = Math.max(450, Math.ceil(config.length * 0.12));
  const maxCowl = Math.min(2500, Math.floor(config.length * 0.55));
  config.windshieldPosition = Math.max(minCowl, Math.min(maxCowl, config.windshieldPosition));
  config.roofEndPercent = Math.min(95, Math.max(Math.ceil((config.windshieldPosition / config.length + 0.16) * 100), config.roofEndPercent));
  if (config.type !== "sedan") {
    const minRoof = config.type === "mpv" ? 88 : config.type === "micro" ? 84 : 83;
    const maxRoof = config.type === "mpv" ? 92 : 91;
    config.roofEndPercent = Math.max(minRoof, Math.min(maxRoof, config.roofEndPercent));
    config.tailHeightPercent = Math.max(60, Math.min(77, config.tailHeightPercent));
  }
  if (config.type === "mpv" && config.templateId !== "mpv-executive") config.hoodGlassBlend = Math.max(90, config.hoodGlassBlend);
  return config;
}

function rebalanceAxles(next: VehicleConfig, edited: NumericParameter | "load") {
  const length = next.length;
  const compensation = 3 / (2 + Math.cos(Math.PI / 4));
  const requiredOverhang = Math.ceil(Math.max(next.wheelArch, next.tireDiameter / 2 + next.archClearance)
    * compensation + next.archLipWidth + 70);
  const minOverhang = Math.max(300, Math.min(Math.floor((length - 1700) / 2), requiredOverhang));
  const maxOverhang = 1450;
  const minWheelbase = Math.max(1700, length - maxOverhang * 2);
  const maxWheelbase = Math.min(3500, length - minOverhang * 2);
  const clampValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  if (edited === "load") next.wheelbase = length - next.frontAxleFromFront - next.rearAxleFromTail;
  if (edited === "length" || edited === "wheelbase" || edited === "load") {
    next.wheelbase = clampValue(next.wheelbase, minWheelbase, maxWheelbase);
    const remaining = length - next.wheelbase;
    const minFront = Math.max(minOverhang, remaining - maxOverhang);
    const maxFront = Math.min(maxOverhang, remaining - minOverhang);
    const sum = Math.max(1, next.frontAxleFromFront + next.rearAxleFromTail);
    const front = edited === "length" ? Math.round(remaining * next.frontAxleFromFront / sum) : next.frontAxleFromFront;
    next.frontAxleFromFront = clampValue(front, minFront, maxFront);
    next.rearAxleFromTail = remaining - next.frontAxleFromFront;
  }

  const remaining = length - next.wheelbase;
  const minPosition = Math.max(minOverhang, remaining - maxOverhang);
  const maxPosition = Math.min(maxOverhang, remaining - minOverhang);
  if (edited === "frontAxleFromFront") {
    next.frontAxleFromFront = clampValue(next.frontAxleFromFront, minPosition, maxPosition);
    next.rearAxleFromTail = remaining - next.frontAxleFromFront;
  }
  if (edited === "rearAxleFromTail") {
    next.rearAxleFromTail = clampValue(next.rearAxleFromTail, minPosition, maxPosition);
    next.frontAxleFromFront = remaining - next.rearAxleFromTail;
  }
  return next;
}

function parseVehicleProject(input: unknown): VehicleConfig | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  const source = data.parameters && typeof data.parameters === "object" ? data.parameters as Record<string, unknown> : data;
  if (typeof source.type !== "string" || !Object.prototype.hasOwnProperty.call(vehiclePresets, source.type)) return null;
  const type = source.type as VehicleType;
  const config = { ...vehiclePresets[type] };
  (Object.keys(numericBounds) as NumericParameter[]).forEach((key) => {
    const value = source[key];
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    const [min, max] = numericBounds[key];
    config[key] = Math.max(min, Math.min(max, value));
  });
  config.wheelDiameterInches = Math.round(config.wheelDiameterInches);
  if (typeof source.hasGrille === "boolean") config.hasGrille = source.hasGrille;
  if (typeof source.hasLowerGrille === "boolean") config.hasLowerGrille = source.hasLowerGrille;
  if (typeof source.hasSpoiler === "boolean") config.hasSpoiler = source.hasSpoiler;
  if (source.tireStyle === "road" || source.tireStyle === "allTerrain") config.tireStyle = source.tireStyle;
  if (source.cageDensity === "compact" || source.cageDensity === "balanced" || source.cageDensity === "detailed") config.cageDensity = source.cageDensity;
  if (source.headlampStyle === "wide" || source.headlampStyle === "round") config.headlampStyle = source.headlampStyle;
  if (source.grillePattern === "closed") config.hasGrille = false;
  else if (["horizontal", "vertical", "mesh", "honeycomb", "diamond"].includes(source.grillePattern as string)) config.grillePattern = source.grillePattern as GrillePattern;
  if (typeof source.paintColor === "string" && /^#[0-9a-f]{6}$/i.test(source.paintColor)) config.paintColor = source.paintColor;
  if (typeof source.templateId === "string" && conceptTemplates.some((template) => template.id === source.templateId && template.type === type)) {
    config.templateId = source.templateId;
  }
  config.tireDiameter = getTireSpecification(config).diameter;
  return normalizeTireClearance(rebalanceAxles(config, "load"));
}

function App() {
  const [config, setConfig] = useState<VehicleConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseVehicleProject(JSON.parse(stored));
        if (parsed) return parsed;
      }
    } catch {
      // An unavailable or outdated local draft falls back to the sedan preset.
    }
    return { ...vehiclePresets.sedan };
  });
  const [mode, setMode] = useState<DisplayMode>("subd");
  const [view, setView] = useState<CameraView>("perspective");
  const [showGrid, setShowGrid] = useState(true);
  const [showCage, setShowCage] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false);
  const [expanded, setExpanded] = useState({ proportions: true, wheels: false, cabin: false, surface: false, fascia: true, rear: false, topology: false });
  const [exportOpen, setExportOpen] = useState(false);
  const [objUnit, setObjUnit] = useState<ObjUnit>("cm");
  const [toast, setToast] = useState("");
  const [previewConfig, setPreviewConfig] = useState(config);
  const exportGroupRef = useRef<THREE.Group>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  // Single full-quality update path: body and trims are always built together (no draft
  // stage), so accessories never disappear or lag behind the body. A short pause coalesces
  // slider events before the SubD and BVH evaluation.
  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewConfig(config), 60);
    return () => window.clearTimeout(timer);
  }, [config]);
  const deferredConfig = useDeferredValue(previewConfig);
  const geometryKey = JSON.stringify({ ...deferredConfig, paintColor: "" });
  const controlMesh = useMemo(() => buildControlMesh(deferredConfig), [geometryKey]);
  const isModelPending = deferredConfig !== config;
  const vehicleFrame = useMemo(() => getVehicleFrame(deferredConfig), [geometryKey]);
  const topology = useMemo(() => analyzeControlMesh(controlMesh), [controlMesh]);
  const housingLimits = getWheelHousingLimits(config);
  const measured = useMemo(() => {
    const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, maxZ: 0 };
    controlMesh.vertices.forEach(([x, y, z]) => {
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
      bounds.maxZ = Math.max(bounds.maxZ, Math.abs(z));
    });
    return {
      length: Math.round((bounds.maxX - bounds.minX) * 1000),
      width: Math.round(bounds.maxZ * 2000),
      height: Math.round(bounds.maxY * 1000),
    };
  }, [controlMesh]);
  const baseName = `FORM_${config.templateId.replace(/[^a-z0-9-]/gi, "_")}`;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // The workbench remains usable when storage is disabled.
    }
  }, [config]);

  useEffect(() => {
    if (!exportOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!exportMenuRef.current?.contains(event.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [exportOpen]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const notify = (message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  };

  const updateParameter = (key: NumericParameter, value: number) => {
    setConfig((current) => {
      const next = { ...current, [key]: value };
      return normalizeTireClearance(rebalanceAxles(next, key));
    });
  };

  const updateWheelDiameter = (wheelDiameterInches: number) => {
    setConfig((current) => {
      const next = { ...current, wheelDiameterInches };
      next.tireDiameter = getTireSpecification(next).diameter;
      return normalizeTireClearance(rebalanceAxles(next, "wheelbase"));
    });
  };

  const updateTireStyle = (tireStyle: TireStyle) => {
    setConfig((current) => {
      const next = { ...current, tireStyle };
      next.tireDiameter = getTireSpecification(next).diameter;
      return normalizeTireClearance(rebalanceAxles(next, "wheelbase"));
    });
  };

  const updatePaint = (paintColor: string) => {
    setConfig((current) => ({ ...current, paintColor }));
  };

  const selectTemplate = (template: ConceptTemplate) => {
    setConfig((current) => normalizeTireClearance({ ...createTemplateConfig(template), cageDensity: current.cageDensity }));
    notify(`${template.name}基础方案已载入`);
  };

  const changeVehicleType = (type: VehicleType) => {
    const template = conceptTemplates.find((item) => item.type === type);
    if (template) selectTemplate(template);
  };

  const resetParameters = () => {
    const template = conceptTemplates.find((item) => item.id === config.templateId);
    setConfig((current) => normalizeTireClearance(template
      ? { ...createTemplateConfig(template), cageDensity: current.cageDensity }
      : { ...vehiclePresets[current.type], cageDensity: current.cageDensity }));
    setView("perspective");
    notify("已恢复当前基础方案的参数");
  };

  const importProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = parseVehicleProject(JSON.parse(await file.text()));
      if (!parsed) throw new Error("Invalid project");
      setConfig(parsed);
      setView("perspective");
      notify("方案参数已载入并重新生成控制笼");
    } catch {
      notify("无法读取方案文件，请选择本工作台导出的 JSON");
    } finally {
      input.value = "";
    }
  };

  /** Current cage (never stale) and, when the viewport is in sync, its accessories. */
  const exportSources = () => {
    const cage = isModelPending ? buildControlMesh(config) : controlMesh;
    const group = exportGroupRef.current;
    const accessories = group && !isModelPending ? collectSceneAccessories(group) : [];
    return { cage, accessories };
  };

  const runExport = (label: string, action: () => number) => {
    try {
      const size = action();
      notify(`${label}已导出（${formatSize(size)}）`);
    } catch (error) {
      console.error(error);
      notify(`${label}导出失败，请稍后重试`);
    }
    setExportOpen(false);
  };

  const downloadCadPackage = () => runExport("细分工程包", () => {
    const { cage, accessories } = exportSources();
    const bundle = buildCadBundle(cage, config, accessories, baseName, objUnit);
    return downloadFile(`${baseName}_SUBD_PACKAGE.zip`, zipCadBundle(bundle, baseName), "application/zip");
  });

  const downloadFbx = () => runExport("细分体 FBX", () => {
    const { cage, accessories } = exportSources();
    return downloadFile(`${baseName}_SUBD.fbx`, writeFbxScene([...buildSubdObjects(cage, config), ...accessories]), "application/octet-stream");
  });

  const downloadCage = () => runExport("控制笼 OBJ", () => {
    const { cage } = exportSources();
    const header = ["FORM Subdivision Studio - Catmull-Clark control cage", "X towards rear", "Alias: File > Import > Subdiv"];
    return downloadFile(`${baseName}_SUBD_CAGE.obj`, writeObj(buildSubdObjects(cage, config), null, header, objUnit), "text/plain;charset=utf-8");
  });

  const downloadRhino = () => runExport("Rhino SubD OBJ", () => {
    const { cage } = exportSources();
    const objects = buildSubdObjects(cage, config).map((object) => unweldCreases(object));
    const header = ["FORM Subdivision Studio - Rhino SubD cage (hard creases unwelded)", "Rhino: _Import, then _ToSubD with creases enabled"];
    return downloadFile(`${baseName}_RHINO_SUBD.obj`, writeObj(objects, null, header, objUnit), "text/plain;charset=utf-8");
  });

  const downloadRenderMesh = () => {
    if (isModelPending) {
      notify("模型正在更新，请稍后再导出渲染网格");
      return;
    }
    runExport("渲染网格", () => {
      const { cage, accessories } = exportSources();
      return downloadFile(`${baseName}_RENDER_MESH.zip`, zipRenderMesh(cage, config, accessories, baseName, objUnit), "application/zip");
    });
  };

  const downloadJson = () => runExport("参数 JSON", () => downloadFile(
    `${baseName}_PARAMETERS.json`,
    createControlJson(config, isModelPending ? buildControlMesh(config) : controlMesh),
    "application/json;charset=utf-8",
  ));

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((current) => ({ ...current, [section]: !current[section] }));
  };

  return (
    <main className="workbench">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 34 34" fill="none">
              <path d="M5 23.5C9.1 14 14.7 9 29 8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 27C12 19.4 18.8 15.1 29 14.3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 29.5C14.4 25.2 20.6 22.8 29 21.8" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="7" cy="24" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div className="brand-copy">
            <div className="brand-name">FORM<span>.</span></div>
            <div className="brand-descriptor">SUBDIVISION STUDIO</div>
          </div>
        </div>

        <div className="project-heading">
          <span className="project-kicker">CONCEPT / 01</span>
          <span className="project-divider" />
          <span className="project-name">Exterior body shell</span>
        </div>

        <div className="topbar-actions">
          <div className="save-indicator"><span className="save-dot" />本地自动保存</div>
          <button className="reset-button" onClick={resetParameters} title="恢复当前车型基础比例" type="button">
            <RotateCcw size={14} strokeWidth={1.8} />
            <span>重置</span>
          </button>
          <div className="export-wrap" ref={exportMenuRef}>
            <button className="export-button" onClick={() => setExportOpen((open) => !open)} type="button" aria-expanded={exportOpen} aria-busy={isModelPending}>
              <Download size={15} strokeWidth={1.9} />
              <span>{isModelPending ? "模型更新中" : "导出模型"}</span>
              <ChevronDown size={13} className={exportOpen ? "rotate-chevron" : ""} />
            </button>
            {exportOpen && (
              <div className="export-menu">
                <div className="export-menu-heading">可编辑细分曲面（SubD）</div>
                <button className="export-option export-option-primary" onClick={downloadCadPackage} type="button">
                  <span className="export-option-icon"><Layers size={15} /></span>
                  <span><strong>细分工程包（推荐）</strong><small>ZIP · FBX + OBJ 控制笼 + Rhino OBJ + 导入说明</small></span>
                  <ArrowDownToLine size={14} />
                </button>
                <button className="export-option" onClick={downloadFbx} type="button">
                  <span className="export-option-icon"><Layers size={15} /></span>
                  <span><strong>Alias / Blender / Maya 细分体</strong><small>FBX · 细分标记 + 折边权重 + 材质 + 配件</small></span>
                  <ArrowDownToLine size={14} />
                </button>
                <button className="export-option" onClick={downloadCage} type="button">
                  <span className="export-option-icon"><Layers size={15} /></span>
                  <span><strong>SubD 控制笼</strong><small>OBJ · Alias「Import › Subdiv」· 四边面 · mm</small></span>
                  <ArrowDownToLine size={14} />
                </button>
                <button className="export-option" onClick={downloadRhino} type="button">
                  <span className="export-option-icon"><Layers size={15} /></span>
                  <span><strong>Rhino SubD</strong><small>OBJ · 硬折边已断开 · 导入后 ToSubD</small></span>
                  <ArrowDownToLine size={14} />
                </button>
                <div className="export-unit-row" role="group" aria-label="OBJ 单位">
                  <span>OBJ 单位</span>
                  {(["mm", "cm", "m"] as const).map((unit) => (
                    <button key={unit} type="button" className={objUnit === unit ? "export-unit-active" : ""} aria-pressed={objUnit === unit} onClick={() => setObjUnit(unit)}>{unit}</button>
                  ))}
                  <small>Alias 默认 cm · Rhino mm · Blender m</small>
                </div>
                <div className="export-menu-heading">渲染与数据</div>
                <button className="export-option" onClick={downloadRenderMesh} type="button">
                  <span className="export-option-icon"><Download size={15} /></span>
                  <span><strong>渲染网格</strong><small>ZIP · OBJ + MTL · 细分结果 + 车轮配件</small></span>
                  <ArrowDownToLine size={14} />
                </button>
                <button className="export-option" onClick={downloadJson} type="button">
                  <span className="export-option-icon"><SlidersHorizontal size={15} /></span>
                  <span><strong>参数与拓扑</strong><small>JSON · 点位 / 四边面 / 参数</small></span>
                  <ArrowDownToLine size={14} />
                </button>
                <button className="export-option" onClick={() => { setExportOpen(false); importInputRef.current?.click(); }} type="button">
                  <span className="export-option-icon"><Upload size={15} /></span>
                  <span><strong>载入方案参数</strong><small>选择本工作台导出的 JSON</small></span>
                </button>
                <div className="export-note">Z 轴向上，FBX 自带毫米单位。Alias：FBX 用 File › Open（保留折边），OBJ 用 File › Import › Subdiv。Blender 导入 FBX 时勾选「Subdivision Data」。Rhino：导入后运行 ToSubD。</div>
              </div>
            )}
          </div>
          <input ref={importInputRef} type="file" accept=".json,application/json" hidden onChange={importProject} />
        </div>
      </header>

      <div className="workspace">
        <nav className="tool-rail" aria-label="视口工具">
          <div className="rail-top-mark"><span /></div>
          <button className="rail-button" type="button" title="回到透视视图" onClick={() => setView("perspective")}>
            <span className="rail-icon-wrap"><RotateCcw size={17} strokeWidth={1.7} /></span>
            <small>视图</small>
          </button>
          <button className={`rail-button ${showGrid ? "rail-active" : ""}`} type="button" title="切换地面网格" onClick={() => setShowGrid((current) => !current)}>
            <span className="rail-icon-wrap"><Grid2X2 size={17} strokeWidth={1.7} /></span>
            <small>网格</small>
          </button>
          <button className={`rail-button ${showCage ? "rail-active" : ""}`} type="button" title="切换 SubD 控制笼" onClick={() => setShowCage((current) => !current)}>
            <span className="rail-icon-wrap"><Layers size={17} strokeWidth={1.7} /></span>
            <small>控制笼</small>
          </button>
          <button className={`rail-button ${showDimensions ? "rail-active" : ""}`} type="button" title="切换尺寸信息" onClick={() => setShowDimensions((current) => !current)}>
            <span className="rail-icon-wrap"><Ruler size={17} strokeWidth={1.7} /></span>
            <small>尺寸</small>
          </button>
          <div className="rail-bottom">
            <button className="rail-help" type="button" title="模型说明" onClick={() => notify("全四边面 Catmull-Clark 控制笼：轮眉/玻璃/格栅开口带硬边回折，Crease 权重随 JSON 导出") }>
              <CircleHelp size={17} strokeWidth={1.7} />
            </button>
            <span>v 1.0</span>
          </div>
        </nav>

        <section className="viewport" aria-label="汽车 SubD 三维预览">
          <VehicleScene
            config={deferredConfig}
            controlMesh={controlMesh}
            mode={mode}
            view={view}
            showGrid={showGrid}
            showCage={showCage}
            exportGroupRef={exportGroupRef}
          />

          <div className="viewport-heading">
            <div className="viewport-title-block">
              <span className="viewport-live-dot" />
              <div>
                <div className="viewport-title">BODY SHELL <span>/</span> 01</div>
                <div className="viewport-subtitle">{mode === "boxmod" ? "BOX MODE / FLAT CONTROL FACES + CAGE" : "CATMULL-CLARK SURFACE PREVIEW"}</div>
              </div>
            </div>
            <div className="viewport-mode-switch" role="group" aria-label="显示模式">
              {displayModes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={mode === item.value ? "mode-selected" : ""}
                  onClick={() => setMode(item.value)}
                  title={item.label}
                  aria-label={item.label}
                >
                  <span className="mode-short">{item.short}</span>
                  <span className="mode-full">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="camera-switch" role="group" aria-label="相机视图">
            {cameraViews.map((item) => (
              <button
                key={item.value}
                type="button"
                className={view === item.value ? "camera-selected" : ""}
                onClick={() => setView(item.value)}
                title={item.value === "perspective" || item.value === "rearPerspective" ? `${item.label} 透视视图` : `${item.label}标准视图`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {showDimensions && (
            <div className="dimension-strip">
              <span><i />总长 <b>{measured.length.toLocaleString("en-US")}</b> mm</span>
              <span><i />轴距 <b>{config.wheelbase.toLocaleString("en-US")}</b> mm</span>
              <span><i />总宽 <b>{measured.width.toLocaleString("en-US")}</b> mm</span>
              <span><i />总高 <b>{measured.height.toLocaleString("en-US")}</b> mm</span>
            </div>
          )}

          <div className="viewport-footer">
            <div className="viewport-model-status">
              <span className="status-badge">{mode === "boxmod" ? "BOX" : "SUBD"}</span>
              <span>CATMULL-CLARK <i /> 02 LEVELS</span>
              <span className="status-separator" />
              <span>{controlMesh.vertices.length} PTS / {controlMesh.creases.length} CREASES</span>
            </div>
            <div className="viewport-hint">拖拽旋转 <span /> 滚轮缩放</div>
          </div>
        </section>

        <aside className="parameter-panel">
          <div className="parameter-panel-header">
            <div>
              <div className="panel-eyebrow">FORM GENERATOR <span>01</span></div>
              <h1>造型参数</h1>
            </div>
            <div className="panel-symbol"><SlidersHorizontal size={17} strokeWidth={1.7} /></div>
          </div>

          <div className="parameter-scroll">
            <section className="vehicle-type-section">
              <div className="panel-section-caption"><span>车型基准</span><span>BODY CLASS</span></div>
              <div className="vehicle-type-grid" role="group" aria-label="选择车型">
                {(Object.keys(vehicleNames) as VehicleType[]).map((type) => (
                  <button
                    className={`vehicle-type-button ${config.type === type ? "vehicle-type-active" : ""}`}
                    key={type}
                    type="button"
                    onClick={() => changeVehicleType(type)}
                    aria-pressed={config.type === type}
                  >
                    <CarSilhouette type={type} active={config.type === type} />
                    <span>{vehicleNames[type]}</span>
                  </button>
                ))}
              </div>
            </section>

            <ConceptSelector config={config} onSelect={selectTemplate} />
            <section className="density-section">
              <ChoiceField<CageDensity>
                label="控制笼密度"
                value={config.cageDensity}
                options={[
                  { value: "compact", label: "精简" },
                  { value: "balanced", label: "均衡" },
                  { value: "detailed", label: "细致" },
                ]}
                onChange={(cageDensity) => setConfig((current) => ({ ...current, cageDensity }))}
              />
              <p className="density-note">精简截面与轮眉弧段；截面会贯穿车身</p>
            </section>
            <PaintSelector selected={config.paintColor} onSelect={updatePaint} />

            <div className="parameter-group">
              <SectionHeader title="车身比例" subtitle="PROPORTIONS" open={expanded.proportions} onClick={() => toggleSection("proportions")} />
              {expanded.proportions && (
                <div className="parameter-fields">
                  <ParameterField label="车长" value={config.length} min={Math.max(2700, 1700 + housingLimits.minOverhang * 2)} max={5600} unit="mm" onChange={(value) => updateParameter("length", value)} />
                  <ParameterField label="车宽" value={config.width} min={1400} max={2200} unit="mm" onChange={(value) => updateParameter("width", value)} />
                  <ParameterField label="车高" value={config.height} min={Math.max(1250, getMinimumBodyHeight(config))} max={2000} unit="mm" onChange={(value) => updateParameter("height", value)} />
                  <ParameterField label="轴距" value={config.wheelbase} min={Math.max(1700, config.length - 2900)} max={Math.min(3500, config.length - housingLimits.minOverhang * 2)} unit="mm" onChange={(value) => updateParameter("wheelbase", value)} />
                  <div className="inline-note"><span className="link-mark" />控制笼实测：总长 {measured.length} / 总宽 {measured.width} / 总高 {measured.height} mm（含轮眉外扩，不含后视镜）</div>
                  <ParameterField label="门槛下沿离地" value={config.groundClearance} min={110} max={Math.min(400, Math.floor(config.tireDiameter / 2 + 15))} unit="mm" onChange={(value) => updateParameter("groundClearance", value)} />
                </div>
              )}
            </div>

            <div className="parameter-group">
              <SectionHeader title="轮组与轮眉" subtitle="WHEEL / ARCH" open={expanded.wheels} onClick={() => toggleSection("wheels")} />
              {expanded.wheels && (
                <div className="parameter-fields">
                  <WheelSetup config={config} onDiameter={updateWheelDiameter} onTireStyle={updateTireStyle} />
                  <ParameterField label="轮眉半径" value={config.wheelArch} min={Math.max(230, housingLimits.minArch)} max={Math.max(housingLimits.minArch, housingLimits.maxArch)} step={5} unit="mm" onChange={(value) => updateParameter("wheelArch", value)} />
                  <ParameterField label="最小轮胎间隙" value={config.archClearance} min={20} max={90} step={5} unit="mm" onChange={(value) => updateParameter("archClearance", value)} />
                  <ParameterField label="轮眉外缘方圆度" value={config.archShape} min={0} max={100} step={1} unit="%" onChange={(value) => updateParameter("archShape", value)} />
                  <ParameterField label="轮眉宽度（唇口）" value={config.archLipWidth} min={25} max={Math.max(25, housingLimits.maxLip)} step={5} unit="mm" onChange={(value) => updateParameter("archLipWidth", value)} />
                  <div className="paired-parameters">
                    <ParameterField label="前翼子板外扩" value={config.frontFlare} min={0} max={100} step={5} unit="mm" onChange={(value) => updateParameter("frontFlare", value)} />
                    <ParameterField label="后翼子板外扩" value={config.rearFlare} min={0} max={100} step={5} unit="mm" onChange={(value) => updateParameter("rearFlare", value)} />
                  </div>
                  <div className="paired-parameters">
                    <ParameterField label="前轮内缩" value={config.frontWheelInset} min={0} max={100} step={5} unit="mm" onChange={(value) => updateParameter("frontWheelInset", value)} />
                    <ParameterField label="后轮内缩" value={config.rearWheelInset} min={0} max={100} step={5} unit="mm" onChange={(value) => updateParameter("rearWheelInset", value)} />
                  </div>
                  <div className="paired-parameters">
                    <ParameterField label="前轮中心距车头" value={config.frontAxleFromFront} min={Math.max(300, housingLimits.minOverhang, config.length - config.wheelbase - 1450)} max={Math.min(1450, config.length - config.wheelbase - housingLimits.minOverhang)} unit="mm" onChange={(value) => updateParameter("frontAxleFromFront", value)} />
                    <ParameterField label="后轮中心距车尾" value={config.rearAxleFromTail} min={Math.max(300, housingLimits.minOverhang, config.length - config.wheelbase - 1450)} max={Math.min(1450, config.length - config.wheelbase - housingLimits.minOverhang)} unit="mm" onChange={(value) => updateParameter("rearAxleFromTail", value)} />
                  </div>
                  <div className="inline-note"><span className="link-mark" />轮眉正圆校正；半径与唇口受前后悬限制，避免翼子板挤入前脸</div>
                </div>
              )}
            </div>

            <div className="parameter-group">
              <SectionHeader title="座舱与玻璃" subtitle="CABIN / GLASS" open={expanded.cabin} onClick={() => toggleSection("cabin")} />
              {expanded.cabin && (
                <div className="parameter-fields">
                  <ParameterField label="风挡后倾角（相对竖直）" value={config.windshieldAngle} min={25} max={75} step={1} unit="deg" onChange={(value) => updateParameter("windshieldAngle", value)} />
                  <ParameterField label="风挡下沿距车头" value={config.windshieldPosition} min={Math.max(450, Math.ceil(config.length * 0.12))} max={Math.min(2500, Math.floor(config.length * 0.55))} unit="mm" onChange={(value) => updateParameter("windshieldPosition", value)} />
                  <ParameterField label="侧窗高度（可用区域）" value={config.windowHeightPercent} min={55} max={98} step={1} unit="%" onChange={(value) => updateParameter("windowHeightPercent", value)} />
                  <ParameterField label="B 柱位置（侧窗长度）" value={config.doorSplitPercent} min={24} max={config.type === "suv" ? 68 : config.type === "mpv" ? 58 : 72} step={1} unit="%" onChange={(value) => updateParameter("doorSplitPercent", value)} />
                  <ParameterField label="车顶后沿位置" value={config.roofEndPercent} min={config.type === "sedan" ? Math.max(62, Math.ceil((config.windshieldPosition / config.length + 0.16) * 100)) : config.type === "mpv" ? 88 : config.type === "micro" ? 84 : 83} max={config.type === "sedan" ? 79 : config.type === "mpv" ? 92 : 91} step={1} unit="%" onChange={(value) => updateParameter("roofEndPercent", value)} />
                  <ParameterField label="车顶宽度比例" value={config.roofWidthPercent} min={58} max={90} step={1} unit="%" onChange={(value) => updateParameter("roofWidthPercent", value)} />
                  <div className="inline-note"><span className="link-mark" />侧窗高度控制玻璃上沿；B 柱位置同时改变侧窗分割与车门分缝</div>
                </div>
              )}
            </div>

            <div className="parameter-group parameter-group-last">
              <SectionHeader title="型面与腰线" subtitle="SURFACE / CHARACTER" open={expanded.surface} onClick={() => toggleSection("surface")} />
              {expanded.surface && (
                <div className="parameter-fields">
                  <ParameterField label="腰线高度" value={config.beltline} min={820} max={Math.min(1380, config.height - 270)} unit="mm" onChange={(value) => updateParameter("beltline", value)} />
                  <ParameterField label="腰线前后升降" value={config.beltlineSlope} min={-120} max={120} step={5} unit="mm" onChange={(value) => updateParameter("beltlineSlope", value)} />
                  <ParameterField label="侧围趋势" value={config.sideTrend} min={0} max={100} step={1} unit="%" onChange={(value) => updateParameter("sideTrend", value)} />
                  <ParameterField label="车门侧面凹塑" value={config.sideSculpt} min={0} max={100} step={1} unit="%" onChange={(value) => updateParameter("sideSculpt", value)} />
                  <ParameterField label="曲面硬朗度" value={config.surfaceHardness} min={0} max={100} step={1} unit="%" onChange={(value) => updateParameter("surfaceHardness", value)} />
                  <div className="inline-note"><span className="link-mark" />当前腰线约占车高 {Math.round(config.beltline / config.height * 100)}%；正数表示腰线向车尾抬升</div>
                </div>
              )}
            </div>

            <div className="parameter-group">
              <SectionHeader title="机盖与前脸" subtitle="HOOD / FRONT" open={expanded.fascia} onClick={() => toggleSection("fascia")} />
              {expanded.fascia && (
                <div className="parameter-fields">
                  <ParameterField label="机盖宽度（占车宽）" value={config.hoodWidthPercent} min={50} max={88} step={1} unit="%" onChange={(value) => updateParameter("hoodWidthPercent", value)} />
                  <ParameterField label="机盖饱满度（纵横向拱度）" value={config.hoodDome} min={0} max={90} step={1} unit="级" onChange={(value) => updateParameter("hoodDome", value)} />
                  <ParameterField label="翼子板落差（机盖边线）" value={config.hoodEdgeDrop} min={0} max={100} step={1} unit="mm" onChange={(value) => updateParameter("hoodEdgeDrop", value)} />
                  <ParameterField label="机盖整体高度（50 为基准）" value={config.hoodShape} min={0} max={100} step={1} unit="%" onChange={(value) => updateParameter("hoodShape", value)} />
                  <ParameterField label="机盖倾角（前低后高，40 为基准）" value={config.noseLift} min={0} max={150} step={1} unit="mm" onChange={(value) => updateParameter("noseLift", value)} />
                  <ParameterField label="机盖前缘高度（占车高）" value={config.noseHeightPercent} min={38} max={66} step={1} unit="%" onChange={(value) => updateParameter("noseHeightPercent", value)} />
                  <ParameterField label="机盖后缘低于风挡根部" value={config.hoodRearDrop} min={20} max={260} step={5} unit="mm" onChange={(value) => updateParameter("hoodRearDrop", value)} />
                  <ParameterField label="机盖与风挡衔接" value={config.hoodGlassBlend} min={config.type === "mpv" && config.templateId !== "mpv-executive" ? 90 : 0} max={100} step={1} unit="%" onChange={(value) => updateParameter("hoodGlassBlend", value)} />
                  <ParameterField label="车头正面弧度" value={config.frontBow} min={0} max={350} step={5} unit="mm" onChange={(value) => updateParameter("frontBow", value)} />
                  <ParameterField label="车头高度微调" value={config.frontHeightOffset} min={-120} max={120} unit="mm" onChange={(value) => updateParameter("frontHeightOffset", value)} />
                  <ChoiceField<"with" | "without">
                    label="前脸格栅 / 控制笼拓扑"
                    value={config.hasGrille ? "with" : "without"}
                    options={[
                      { value: "with", label: "有格栅开口" },
                      { value: "without", label: "无格栅整面" },
                    ]}
                    onChange={(value) => setConfig((current) => ({ ...current, hasGrille: value === "with", hasLowerGrille: value === "with" ? true : current.hasLowerGrille }))}
                  />
                  {config.hasGrille && <ChoiceField<GrillePattern>
                    label="格栅造型"
                    value={config.grillePattern}
                    options={[
                      { value: "horizontal", label: "横向" },
                      { value: "vertical", label: "竖向" },
                      { value: "mesh", label: "网格" },
                      { value: "honeycomb", label: "蜂窝" },
                      { value: "diamond", label: "菱格" },
                    ]}
                    onChange={(grillePattern) => setConfig((current) => ({ ...current, grillePattern }))}
                  />}
                  {config.hasGrille && <ParameterField label="格栅宽度" value={config.grilleWidth} min={40} max={82} step={1} unit="%" onChange={(value) => updateParameter("grilleWidth", value)} />}
                  {config.hasGrille && <ParameterField label="格栅高度" value={config.grilleHeight} min={10} max={42} step={1} unit="%" onChange={(value) => updateParameter("grilleHeight", value)} />}
                  {config.hasGrille && <ParameterField label="中网上下位置" value={config.grilleOffset} min={-150} max={150} step={5} unit="mm" onChange={(value) => updateParameter("grilleOffset", value)} />}
                  {config.hasGrille && <ParameterField label="中网圆角（0 方 / 100 椭圆）" value={config.grilleRoundness} min={0} max={100} step={1} unit="%" onChange={(value) => updateParameter("grilleRoundness", value)} />}
                  {config.hasGrille && <ParameterField label="中网梯形（正值下宽）" value={config.grilleTaper} min={-40} max={40} step={1} unit="%" onChange={(value) => updateParameter("grilleTaper", value)} />}
                  <ChoiceField<"with" | "without">
                    label="下进气格栅"
                    value={config.hasLowerGrille ? "with" : "without"}
                    options={[
                      { value: "with", label: "有下开口" },
                      { value: "without", label: "无" },
                    ]}
                    onChange={(value) => setConfig((current) => ({ ...current, hasLowerGrille: value === "with" }))}
                  />
                  {config.hasLowerGrille && <ParameterField label="下格栅宽度" value={config.lowerGrilleWidth} min={30} max={95} step={1} unit="%" onChange={(value) => updateParameter("lowerGrilleWidth", value)} />}
                  {config.hasLowerGrille && <ParameterField label="下格栅高度" value={config.lowerGrilleHeight} min={40} max={200} step={5} unit="mm" onChange={(value) => updateParameter("lowerGrilleHeight", value)} />}
                  {config.hasLowerGrille && <ParameterField label="下格栅梯形（下宽上窄）" value={config.lowerGrilleTaper} min={0} max={50} step={1} unit="%" onChange={(value) => updateParameter("lowerGrilleTaper", value)} />}
                  <ParameterField label="前包围进深" value={config.bumperDepth} min={0} max={60} step={1} unit="mm" onChange={(value) => updateParameter("bumperDepth", value)} />
                  <ChoiceField<HeadlampStyle>
                    label="前灯形式"
                    value={config.headlampStyle}
                    options={[
                      { value: "wide", label: "宽幅" },
                      { value: "round", label: "圆形" },
                    ]}
                    onChange={(headlampStyle) => setConfig((current) => ({ ...current, headlampStyle }))}
                  />
                  <ParameterField label="前灯宽度" value={config.headlampWidth} min={60} max={130} step={1} unit="%" onChange={(value) => updateParameter("headlampWidth", value)} />
                  <ParameterField label="前灯高度" value={config.headlampHeight} min={60} max={140} step={1} unit="%" onChange={(value) => updateParameter("headlampHeight", value)} />
                  <div className="inline-note"><span className="link-mark" />{!config.hasGrille ? "封闭前脸采用 7 列 × 6 行规则四边面，所有控制点位于同一连续凸曲面，无内凹框" : config.type === "mpv" && config.templateId === "mpv-executive" ? "商务 MPV：独立前舱 + 后倾 A 柱，弧形车顶，腰线在滑门后上扬" : config.type === "mpv" ? "MPV 机盖与前挡使用连续升高剖面，风挡根部不再保留水平台阶" : "格栅开口沿统一凸面前脸布线，带内翻边与饰圈；轮眉通过整体抬升机盖平面保证间隙"}</div>
                </div>
              )}
            </div>

            <div className="parameter-group">
              <SectionHeader title="车尾与整体轮廓" subtitle="REAR / SILHOUETTE" open={expanded.rear} onClick={() => toggleSection("rear")} />
              {expanded.rear && (
                <div className="parameter-fields">
                  <ParameterField label={config.type === "sedan" ? "后窗前后投影（占车长）" : `后窗倾角（当前 ${(isFastbackTemplate(config.templateId) ? (config.hasSpoiler ? Math.min(60, Math.max(22, config.rearGlassSpan * 2.5)) : Math.min(70, Math.max(40, config.rearGlassSpan * 2.5 + 18))) : config.rearGlassSpan * 2.5).toFixed(1)}°）`} value={config.rearGlassSpan} min={2} max={18} step={1} unit={config.type === "sedan" ? "%" : "档"} onChange={(value) => updateParameter("rearGlassSpan", value)} />
                  {isFastbackTemplate(config.templateId) && <ChoiceField<"with" | "without">
                    label="车顶尾翼（与车顶一体）"
                    value={config.hasSpoiler ? "with" : "without"}
                    options={[
                      { value: "with", label: "有尾翼" },
                      { value: "without", label: "无尾翼" },
                    ]}
                    onChange={(value) => setConfig((current) => ({ ...current, hasSpoiler: value === "with" }))}
                  />}
                  {config.type === "sedan" && <ParameterField label="后备厢盖末端位置" value={config.tailDeckPercent} min={88} max={98} step={1} unit="%" onChange={(value) => updateParameter("tailDeckPercent", value)} />}
                  <ParameterField label={config.type !== "sedan" ? "后窗下沿高度（占车高）" : "车尾高度（占车高）"} value={config.tailHeightPercent} min={config.type === "sedan" ? 42 : 60} max={config.type === "sedan" ? 78 : 77} step={1} unit="%" onChange={(value) => updateParameter("tailHeightPercent", value)} />
                  <ParameterField label="车尾高度微调" value={config.rearHeightOffset} min={-120} max={120} unit="mm" onChange={(value) => updateParameter("rearHeightOffset", value)} />
                  <ParameterField label="车尾正面弧度" value={config.rearBow} min={0} max={350} step={5} unit="mm" onChange={(value) => updateParameter("rearBow", value)} />
                  <ParameterField label="车头收窄（占最大车宽）" value={config.noseWidthPercent} min={68} max={96} step={1} unit="%" onChange={(value) => updateParameter("noseWidthPercent", value)} />
                  <ParameterField label="车尾收窄（占最大车宽）" value={config.tailWidthPercent} min={68} max={96} step={1} unit="%" onChange={(value) => updateParameter("tailWidthPercent", value)} />
                  <div className="inline-note"><span className="link-mark" />{config.type === "sedan" ? "三厢轮廓：后窗、行李厢盖与尾部依次衔接" : `两厢轮廓：后窗下降到 ${Math.round(vehicleFrame.rearGlassBottom * 1000)} mm，下方直接接尾门；无独立后备厢平台`}</div>
                </div>
              )}
            </div>

            <div className="parameter-group parameter-group-last">
              <SectionHeader title="控制笼检查" subtitle="TOPOLOGY CHECK" open={expanded.topology} onClick={() => toggleSection("topology")} />
              {expanded.topology && <TopologySummary report={topology} />}
            </div>
          </div>

          <div className="parameter-panel-footer">
            <div className="quad-icon" aria-hidden="true"><span /><span /><span /><span /></div>
            <div className="panel-footer-copy"><strong>单一车身大面 · 全四边面 · 玻璃/格栅独立</strong><span>QUAD / {controlMesh.vertices.length} PTS / {controlMesh.creases.length} CREASES</span></div>
            <Check size={14} className="panel-footer-check" />
          </div>
        </aside>
      </div>

      <div className={`toast-message ${toast ? "toast-visible" : ""}`} role="status" aria-live="polite">
        <span className="toast-check"><Check size={14} /></span>{toast}
      </div>
    </main>
  );
}

export default App;