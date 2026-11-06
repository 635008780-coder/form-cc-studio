/**
 * CAD exchange: editable subdivision cages for Alias / Rhino / Blender (+ Maya).
 *
 *  - FBX 7.4 binary (FBX SDK layout as written by Blender's exporter): the body cage is a
 *    Catmull-Clark mesh flagged as subdivision (Smoothness / PreviewDivisionLevels /
 *    BoundaryRule) with per-edge crease weights (LayerElementEdgeCrease) and per-face
 *    material groups. Alias: File > Open, Blender: Import FBX with "Subdivision Data".
 *  - OBJ control cage (+MTL): Alias File > Import > Subdiv, Blender, Maya (no creases: OBJ
 *    has no crease records).
 *  - Rhino OBJ: hard creases are "unwelded" so Rhino's ToSubD turns them into SubD creases.
 *  - Render mesh OBJ (+MTL): evaluated limit surfaces + all accessories (wheels, lamps...).
 *
 * Units: millimetres. Axes: Z up, X towards the rear, Y = across (right-handed).
 */
import * as THREE from "three";
import { strToU8, zipSync, zlibSync } from "three/examples/jsm/libs/fflate.module.js";
import {
  addBoundaryFlange,
  evaluateVehicleSurfaces,
  subdivide,
  type ControlMesh,
  type PatchMesh,
  type Point3,
  type VehicleConfig,
} from "./vehicleModel";

/* ------------------------------------------------------------------ */
/* Scene description                                                   */
/* ------------------------------------------------------------------ */

export interface ExportMaterial {
  name: string;
  color: [number, number, number];
  opacity: number;
}

export interface ExportCrease {
  a: number;
  b: number;
  /** semi-sharp crease level (OpenSubdiv / Pixar convention) */
  sharpness: number;
}

export interface ExportObject {
  name: string;
  /** CAD space, millimetres */
  vertices: Point3[];
  faces: number[][];
  faceMaterials: number[];
  materials: ExportMaterial[];
  creases: ExportCrease[];
  /** true: Catmull-Clark control cage (editable SubD); false: plain polygon mesh */
  subd: boolean;
}

/** App space (metres, Y up, Z across) -> CAD space (mm, Z up). Proper rotation: windings stay. */
export const toCad = (p: ArrayLike<number>): Point3 => [p[0] * 1000, -p[2] * 1000, p[1] * 1000];

const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  if (!Number.isFinite(value)) return [0.8, 0.8, 0.8];
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

const GLASS: ExportMaterial = { name: "GLASS", color: [0.1, 0.16, 0.19], opacity: 0.3 };
const GRILLE: ExportMaterial = { name: "GRILLE", color: [0.08, 0.1, 0.11], opacity: 1 };

function faceNormal(vertices: Point3[], face: number[]) {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < face.length; i += 1) {
    const c = vertices[face[i]];
    const n = vertices[face[(i + 1) % face.length]];
    x += (c[1] - n[1]) * (c[2] + n[2]);
    y += (c[2] - n[2]) * (c[0] + n[0]);
    z += (c[0] - n[0]) * (c[1] + n[1]);
  }
  return [x, y, z];
}

/** Make the face windings point away from the object's centre (outward normals). */
function orientOutward(object: ExportObject) {
  const centre = [0, 0, 0];
  object.vertices.forEach((v) => { centre[0] += v[0]; centre[1] += v[1]; centre[2] += v[2]; });
  centre.forEach((_, i) => { centre[i] /= Math.max(1, object.vertices.length); });
  let score = 0;
  for (const face of object.faces) {
    const n = faceNormal(object.vertices, face);
    const c = [0, 0, 0];
    face.forEach((index) => { const v = object.vertices[index]; c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; });
    score += n[0] * (c[0] / face.length - centre[0]) + n[1] * (c[1] / face.length - centre[1]) + n[2] * (c[2] / face.length - centre[2]);
  }
  if (score < 0) object.faces = object.faces.map((face) => [...face].reverse());
}

/** Editable SubD objects: body + glass as ONE continuous cage (glass = material group), grille. */
export function buildSubdObjects(cage: ControlMesh, config: VehicleConfig): ExportObject[] {
  const paint: ExportMaterial = { name: "PAINT", color: hexToRgb(config.paintColor), opacity: 1 };
  const glassFaces = [...cage.sideGlass, ...cage.windshield, ...cage.rearGlass];
  const body: ExportObject = {
    name: "BODY_SUBD",
    vertices: cage.vertices.map(toCad),
    faces: [...cage.faces, ...glassFaces].map((face) => [...face]),
    faceMaterials: [...cage.faces.map(() => 0), ...glassFaces.map(() => 1)],
    materials: [paint, GLASS],
    creases: cage.creases.map(({ a, b, weight }) => ({ a, b, sharpness: weight })),
    subd: true,
  };
  orientOutward(body);
  const objects = [body];
  if (cage.grille.faces.length) {
    const grille: ExportObject = {
      name: "GRILLE_SUBD",
      vertices: cage.grille.vertices.map(toCad),
      faces: cage.grille.faces.map((face) => [...face]),
      faceMaterials: cage.grille.faces.map(() => 0),
      materials: [GRILLE],
      creases: [],
      subd: true,
    };
    objects.push(grille);
  }
  return objects;
}

/** Evaluated limit surfaces (for rendering / visualisation tools, not for editing). */
export function buildRenderObjects(cage: ControlMesh, config: VehicleConfig): ExportObject[] {
  const paint: ExportMaterial = { name: "PAINT", color: hexToRgb(config.paintColor), opacity: 1 };
  const surfaces = evaluateVehicleSurfaces(cage, 2);
  const fromPatch = (name: string, patch: PatchMesh, material: ExportMaterial): ExportObject => ({
    name,
    vertices: patch.vertices.map(toCad),
    faces: patch.faces.map((face) => [...face]),
    faceMaterials: patch.faces.map(() => 0),
    materials: [material],
    creases: [],
    subd: false,
  });
  const objects = [
    fromPatch("BODY_SHELL", surfaces.body, paint),
    fromPatch("OPENING_RETURNS", addBoundaryFlange(surfaces.body, 0.026, false), { name: "TRIM_DARK", color: [0.11, 0.13, 0.14], opacity: 1 }),
    fromPatch("SIDE_GLASS", surfaces.sideGlass, GLASS),
    fromPatch("WINDSHIELD", surfaces.windshield, GLASS),
    fromPatch("REAR_GLASS", surfaces.rearGlass, GLASS),
  ];
  if (cage.grille.faces.length) objects.push(fromPatch("GRILLE", subdivide(cage.grille.vertices, cage.grille.faces, [], 2), GRILLE));
  return objects.filter((object) => object.faces.length > 0);
}

/**
 * Accessories from the live viewport (wheels, lamps, mirrors, handles, gaps, grille bars...).
 * Meshes tagged userData.exportRole = "subd" | "limit" are skipped (they are exported from the
 * cage itself), as is anything flagged exportIgnore.
 */
export function collectSceneAccessories(root: THREE.Object3D): ExportObject[] {
  root.updateWorldMatrix(true, true);
  const objects: ExportObject[] = [];
  const names = new Map<string, number>();
  const point = new THREE.Vector3();
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (child.userData.exportIgnore || child.userData.exportRole) return;
    const geometry = child.geometry as THREE.BufferGeometry;
    const position = geometry.getAttribute("position");
    if (!position || position.count < 3) return;
    const vertices: Point3[] = [];
    for (let i = 0; i < position.count; i += 1) {
      point.fromBufferAttribute(position, i).applyMatrix4(child.matrixWorld);
      vertices.push(toCad([point.x, point.y, point.z]));
    }
    const faces: number[][] = [];
    const index = geometry.getIndex();
    const count = index ? index.count : position.count;
    for (let i = 0; i + 2 < count; i += 3) {
      const a = index ? index.getX(i) : i;
      const b = index ? index.getX(i + 1) : i + 1;
      const c = index ? index.getX(i + 2) : i + 2;
      if (a !== b && b !== c && a !== c) faces.push([a, b, c]);
    }
    if (faces.length === 0) return;
    const material = (Array.isArray(child.material) ? child.material[0] : child.material) as THREE.MeshStandardMaterial;
    const color = material?.color ? [material.color.r, material.color.g, material.color.b] as [number, number, number] : [0.6, 0.6, 0.6] as [number, number, number];
    let named: THREE.Object3D | null = child;
    while (named && !named.name) named = named.parent;
    const base = (named && named !== root ? named.name : "ACCESSORY").replace(/[^A-Za-z0-9_]/g, "_") || "ACCESSORY";
    const n = (names.get(base) ?? 0) + 1;
    names.set(base, n);
    const name = `${base}_${String(n).padStart(2, "0")}`;
    objects.push({
      name,
      vertices,
      faces,
      faceMaterials: faces.map(() => 0),
      materials: [{ name: `MAT_${base}`, color, opacity: material?.transparent ? material.opacity : 1 }],
      creases: [],
      subd: false,
    });
  });
  return objects;
}

/* ------------------------------------------------------------------ */
/* OBJ / MTL                                                           */
/* ------------------------------------------------------------------ */

export type ObjUnit = "mm" | "cm" | "m";
export const OBJ_UNIT_SCALE: Record<ObjUnit, number> = { mm: 1, cm: 0.1, m: 0.001 };

/** OBJ has no unit field: vertices are written in `unit` (source data is millimetres). */
export function writeObj(objects: ExportObject[], mtlFile: string | null, header: string[], unit: ObjUnit = "mm") {
  const k = OBJ_UNIT_SCALE[unit];
  const digits = unit === "m" ? 6 : unit === "cm" ? 5 : 4;
  const lines = [...header.map((line) => `# ${line}`), `# OBJ units: ${unit} | Z up`];
  if (mtlFile) lines.push(`mtllib ${mtlFile}`);
  let offset = 1;
  for (const object of objects) {
    lines.push(`o ${object.name}`);
    for (const v of object.vertices) lines.push(`v ${(v[0] * k).toFixed(digits)} ${(v[1] * k).toFixed(digits)} ${(v[2] * k).toFixed(digits)}`);
    let current = -1;
    object.faces.forEach((face, faceIndex) => {
      const materialIndex = object.faceMaterials[faceIndex] ?? 0;
      if (mtlFile && materialIndex !== current) {
        lines.push(`usemtl ${object.materials[materialIndex].name}`);
        current = materialIndex;
      }
      lines.push(`f ${face.map((index) => index + offset).join(" ")}`);
    });
    offset += object.vertices.length;
  }
  lines.push("");
  return lines.join("\n");
}

export function writeMtl(objects: ExportObject[]) {
  const seen = new Map<string, ExportMaterial>();
  objects.forEach((object) => object.materials.forEach((material) => { if (!seen.has(material.name)) seen.set(material.name, material); }));
  const lines = ["# FORM Subdivision Studio materials"];
  seen.forEach((material) => {
    lines.push(
      `newmtl ${material.name}`,
      `Kd ${material.color.map((c) => c.toFixed(4)).join(" ")}`,
      "Ka 0 0 0",
      "Ks 0.25 0.25 0.25",
      "Ns 60",
      `d ${material.opacity.toFixed(3)}`,
      "illum 2",
      "",
    );
  });
  return lines.join("\n");
}

/**
 * Rhino variant: vertices are split ("unwelded") along hard creases. Rhino's ToSubD with
 * creases enabled turns unwelded edges into SubD creases (Rhino creases are all-or-nothing).
 */
export function unweldCreases(object: ExportObject, minSharpness = 1.5): ExportObject {
  const key = (a: number, b: number) => (a < b ? a * 67108864 + b : b * 67108864 + a);
  const hard = new Set(object.creases.filter((c) => c.sharpness >= minSharpness).map((c) => key(c.a, c.b)));
  const cornerBase: number[] = [];
  let corners = 0;
  object.faces.forEach((face) => { cornerBase.push(corners); corners += face.length; });
  const parent = Array.from({ length: corners }, (_, i) => i);
  const find = (i: number): number => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (a: number, b: number) => { const ra = find(a); const rb = find(b); if (ra !== rb) parent[ra] = rb; };
  const edgeUse = new Map<number, Array<{ face: number; k: number }>>();
  object.faces.forEach((face, f) => face.forEach((a, k) => {
    const b = face[(k + 1) % face.length];
    const list = edgeUse.get(key(a, b)) ?? [];
    list.push({ face: f, k });
    edgeUse.set(key(a, b), list);
  }));
  edgeUse.forEach((uses, edge) => {
    if (uses.length !== 2 || hard.has(edge)) return;
    const [u, w] = uses;
    const fu = object.faces[u.face];
    const fw = object.faces[w.face];
    const aU = cornerBase[u.face] + u.k;
    const bU = cornerBase[u.face] + ((u.k + 1) % fu.length);
    const aW = cornerBase[w.face] + w.k;
    const bW = cornerBase[w.face] + ((w.k + 1) % fw.length);
    // u runs a->b, w runs b->a (consistent winding): match corners by vertex
    if (fu[u.k] === fw[(w.k + 1) % fw.length]) {
      union(aU, bW);
      union(bU, aW);
    } else {
      union(aU, aW);
      union(bU, bW);
    }
  });
  const vertices = object.vertices.map((v) => [...v] as Point3);
  const firstRoot = new Map<number, number>();
  const rootVertex = new Map<number, number>();
  const faces = object.faces.map((face, f) => face.map((v, k) => {
    const root = find(cornerBase[f] + k);
    const existing = rootVertex.get(root);
    if (existing !== undefined) return existing;
    let index = v;
    if (firstRoot.has(v)) {
      index = vertices.length;
      vertices.push([...object.vertices[v]] as Point3);
    } else {
      firstRoot.set(v, root);
    }
    rootVertex.set(root, index);
    return index;
  }));
  return { ...object, name: `${object.name}_RHINO`, vertices, faces, creases: [] };
}

/* ------------------------------------------------------------------ */
/* FBX 7.4 binary                                                      */
/* ------------------------------------------------------------------ */

type FbxProp =
  | { t: "C"; v: number } | { t: "I"; v: number } | { t: "L"; v: bigint } | { t: "D"; v: number }
  | { t: "S"; v: string } | { t: "R"; v: Uint8Array }
  | { t: "i"; v: Int32Array } | { t: "d"; v: Float64Array };

interface FbxNode {
  name: string;
  props: FbxProp[];
  children: FbxNode[];
}

const node = (name: string, props: FbxProp[] = [], children: FbxNode[] = []): FbxNode => ({ name, props, children });
const S = (v: string): FbxProp => ({ t: "S", v });
const I = (v: number): FbxProp => ({ t: "I", v });
const D = (v: number): FbxProp => ({ t: "D", v });
const L = (v: number | bigint): FbxProp => ({ t: "L", v: BigInt(v) });
const encoder = new TextEncoder();

function encodeProp(prop: FbxProp): Uint8Array {
  const type = prop.t.charCodeAt(0);
  const scalar = (size: number, write: (view: DataView) => void) => {
    const out = new Uint8Array(1 + size);
    out[0] = type;
    write(new DataView(out.buffer, 1));
    return out;
  };
  switch (prop.t) {
    case "C": return scalar(1, (view) => view.setUint8(0, prop.v));
    case "I": return scalar(4, (view) => view.setInt32(0, prop.v, true));
    case "L": return scalar(8, (view) => view.setBigInt64(0, prop.v, true));
    case "D": return scalar(8, (view) => view.setFloat64(0, prop.v, true));
    case "S":
    case "R": {
      const data = prop.t === "S" ? encoder.encode(prop.v) : prop.v;
      const out = new Uint8Array(5 + data.length);
      out[0] = type;
      new DataView(out.buffer).setUint32(1, data.length, true);
      out.set(data, 5);
      return out;
    }
    case "i":
    case "d": {
      const raw = new Uint8Array(prop.v.buffer, prop.v.byteOffset, prop.v.byteLength);
      const compress = raw.length > 128;
      const data = compress ? zlibSync(raw, { level: 6 }) : raw;
      const out = new Uint8Array(13 + data.length);
      out[0] = type;
      const view = new DataView(out.buffer);
      view.setUint32(1, prop.v.length, true);
      view.setUint32(5, compress ? 1 : 0, true);
      view.setUint32(9, data.length, true);
      out.set(data, 13);
      return out;
    }
  }
}

const HEAD_MAGIC = encoder.encode("Kaydara FBX Binary  \u0000\u001a\u0000");
const FILE_ID = new Uint8Array([0x28, 0xb3, 0x2a, 0xeb, 0xb6, 0x24, 0xcc, 0xc2, 0xbf, 0xc8, 0xb0, 0x2a, 0xa9, 0x2b, 0xfc, 0xf1]);
const FOOT_ID = new Uint8Array([0xfa, 0xbc, 0xab, 0x09, 0xd0, 0xc8, 0xd4, 0x66, 0xb1, 0x76, 0xfb, 0x83, 0x1c, 0xf7, 0x26, 0x7e]);
const FOOT_MAGIC = new Uint8Array([0xf8, 0x5a, 0x8c, 0x6a, 0xde, 0xf5, 0xd9, 0x7e, 0xec, 0xe9, 0x0c, 0xe3, 0x75, 0x8f, 0x29, 0x0b]);
const FBX_VERSION = 7400;
const SENTINEL = 13;

interface EncodedNode {
  name: Uint8Array;
  props: Uint8Array[];
  propsLength: number;
  children: EncodedNode[];
  sentinel: boolean;
  size: number;
}

function encodeNode(fbx: FbxNode, isLast: boolean): EncodedNode {
  const name = encoder.encode(fbx.name);
  const props = fbx.props.map(encodeProp);
  const propsLength = props.reduce((sum, p) => sum + p.length, 0);
  const children = fbx.children.map((child, i) => encodeNode(child, i === fbx.children.length - 1));
  // Same sentinel rule as Blender's encoder (FBX SDK compatible).
  const sentinel = children.length > 0 || (props.length === 0 && !isLast);
  const size = 13 + name.length + propsLength + children.reduce((sum, c) => sum + c.size, 0) + (sentinel ? SENTINEL : 0);
  return { name, props, propsLength, children, sentinel, size };
}

function writeFbx(rootChildren: FbxNode[]): Uint8Array {
  const encoded = rootChildren.map((child, i) => encodeNode(child, i === rootChildren.length - 1));
  const bodySize = encoded.reduce((sum, e) => sum + e.size, 0) + SENTINEL;
  const headSize = HEAD_MAGIC.length + 4;
  const afterBody = headSize + bodySize + FOOT_ID.length + 4;
  let pad = ((afterBody + 15) & ~15) - afterBody;
  if (pad === 0) pad = 16;
  const total = afterBody + pad + 4 + 120 + FOOT_MAGIC.length;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let offset = 0;
  out.set(HEAD_MAGIC, 0);
  offset = HEAD_MAGIC.length;
  view.setUint32(offset, FBX_VERSION, true);
  offset += 4;
  const writeNode = (e: EncodedNode) => {
    const end = offset + e.size;
    view.setUint32(offset, end, true);
    view.setUint32(offset + 4, e.props.length, true);
    view.setUint32(offset + 8, e.propsLength, true);
    out[offset + 12] = e.name.length;
    offset += 13;
    out.set(e.name, offset);
    offset += e.name.length;
    for (const p of e.props) { out.set(p, offset); offset += p.length; }
    for (const child of e.children) writeNode(child);
    if (e.sentinel) offset += SENTINEL; // zero bytes
    if (offset !== end) throw new Error(`FBX node ${new TextDecoder().decode(e.name)} size mismatch`);
  };
  encoded.forEach(writeNode);
  offset += SENTINEL;
  out.set(FOOT_ID, offset);
  offset += FOOT_ID.length + 4 + pad;
  view.setUint32(offset, FBX_VERSION, true);
  offset += 4 + 120;
  out.set(FOOT_MAGIC, offset);
  return out;
}

/* Properties70 helpers (types/labels/flags exactly as the FBX SDK writes them) */
const P = (name: string, type: string, label: string, flags: string, ...values: FbxProp[]) =>
  node("P", [S(name), S(type), S(label), S(flags), ...values]);
const pInt = (name: string, v: number) => P(name, "int", "Integer", "", I(v));
const pDouble = (name: string, v: number) => P(name, "double", "Number", "", D(v));
const pEnum = (name: string, v: number) => P(name, "enum", "", "", I(v));
const pString = (name: string, v: string) => P(name, "KString", "", "", S(v));
const pColor = (name: string, c: [number, number, number]) => P(name, "Color", "", "A", D(c[0]), D(c[1]), D(c[2]));
const pNumber = (name: string, v: number) => P(name, "Number", "", "A", D(v));
const pVec = (name: string, v: [number, number, number]) => P(name, name, "", "A", D(v[0]), D(v[1]), D(v[2]));

function fbxGeometry(uid: number, object: ExportObject): FbxNode {
  const vertices = new Float64Array(object.vertices.length * 3);
  object.vertices.forEach((v, i) => { vertices[i * 3] = v[0]; vertices[i * 3 + 1] = v[1]; vertices[i * 3 + 2] = v[2]; });
  const loopCount = object.faces.reduce((sum, face) => sum + face.length, 0);
  const pvi = new Int32Array(loopCount);
  const edgeLoops: number[] = [];
  const edgeKeys: number[] = [];
  const edgeIndex = new Map<number, number>();
  const key = (a: number, b: number) => (a < b ? a * 67108864 + b : b * 67108864 + a);
  let loop = 0;
  for (const face of object.faces) {
    face.forEach((v, k) => {
      const next = face[(k + 1) % face.length];
      const ek = key(v, next);
      if (!edgeIndex.has(ek)) {
        edgeIndex.set(ek, edgeLoops.length);
        edgeLoops.push(loop);
        edgeKeys.push(ek);
      }
      pvi[loop] = k === face.length - 1 ? -(v + 1) : v; // last index of a polygon: bitwise NOT
      loop += 1;
    });
  }
  const children: FbxNode[] = [node("Properties70")];
  if (object.subd) {
    children.push(
      node("Smoothness", [I(2)]),               // display cage + smooth (subdivision on)
      node("BoundaryRule", [I(2)]),             // crease edges (open borders kept, corners smooth)
      node("PreviewDivisionLevels", [I(2)]),
      node("RenderDivisionLevels", [I(3)]),
      node("PreserveBorders", [I(0)]),
      node("PreserveHardEdges", [I(0)]),
      node("PropagateEdgeHardness", [I(0)]),
    );
  }
  children.push(
    node("GeometryVersion", [I(124)]),
    node("Vertices", [{ t: "d", v: vertices }]),
    node("PolygonVertexIndex", [{ t: "i", v: pvi }]),
    node("Edges", [{ t: "i", v: Int32Array.from(edgeLoops) }]),
  );
  const layerElements: FbxNode[] = [];
  if (object.subd) {
    // FBX crease range 0..1 = sharpness / 10 (Blender squares on export / sqrt on import:
    // same convention), so OpenSubdiv sharpness is preserved across Alias, Maya and Blender.
    const crease = new Float64Array(edgeLoops.length);
    object.creases.forEach(({ a, b, sharpness }) => {
      const index = edgeIndex.get(key(a, b));
      if (index !== undefined) crease[index] = Math.min(1, Math.max(0, sharpness / 10));
    });
    children.push(node("LayerElementEdgeCrease", [I(0)], [
      node("Version", [I(101)]),
      node("Name", [S("")]),
      node("MappingInformationType", [S("ByEdge")]),
      node("ReferenceInformationType", [S("Direct")]),
      node("EdgeCrease", [{ t: "d", v: crease }]),
    ]));
    layerElements.push(node("LayerElement", [], [node("Type", [S("LayerElementEdgeCrease")]), node("TypedIndex", [I(0)])]));
  }
  const allSame = object.materials.length <= 1;
  children.push(node("LayerElementMaterial", [I(0)], [
    node("Version", [I(101)]),
    node("Name", [S("")]),
    node("MappingInformationType", [S(allSame ? "AllSame" : "ByPolygon")]),
    node("ReferenceInformationType", [S("IndexToDirect")]),
    node("Materials", [{ t: "i", v: allSame ? Int32Array.from([0]) : Int32Array.from(object.faceMaterials) }]),
  ]));
  layerElements.push(node("LayerElement", [], [node("Type", [S("LayerElementMaterial")]), node("TypedIndex", [I(0)])]));
  children.push(node("Layer", [I(0)], [node("Version", [I(100)]), ...layerElements]));
  void edgeKeys;
  return node("Geometry", [L(uid), S(`${object.name}\u0000\u0001Geometry`), S("Mesh")], children);
}

function fbxModel(uid: number, name: string): FbxNode {
  return node("Model", [L(uid), S(`${name}\u0000\u0001Model`), S("Mesh")], [
    node("Version", [I(232)]),
    node("Properties70", [], [
      pVec("Lcl Translation", [0, 0, 0]),
      pVec("Lcl Rotation", [0, 0, 0]),
      pVec("Lcl Scaling", [1, 1, 1]),
      pInt("DefaultAttributeIndex", 0),
      pEnum("InheritType", 1),
    ]),
    node("MultiLayer", [I(0)]),
    node("MultiTake", [I(0)]),
    node("Shading", [{ t: "C", v: 1 }]),
    node("Culling", [S("CullingOff")]),
  ]);
}

function fbxMaterial(uid: number, material: ExportMaterial): FbxNode {
  return node("Material", [L(uid), S(`${material.name}\u0000\u0001Material`), S("")], [
    node("Version", [I(102)]),
    node("ShadingModel", [S("Phong")]),
    node("MultiLayer", [I(0)]),
    node("Properties70", [], [
      pString("ShadingModel", "Phong"),
      pColor("DiffuseColor", material.color),
      pNumber("DiffuseFactor", 1),
      pColor("SpecularColor", [0.3, 0.3, 0.3]),
      pNumber("SpecularFactor", 0.5),
      pNumber("Shininess", 40),
      pNumber("ShininessExponent", 40),
      pNumber("TransparencyFactor", 1 - material.opacity),
      pNumber("Opacity", material.opacity),
    ]),
  ]);
}

export function writeFbxScene(objects: ExportObject[]): Uint8Array {
  let nextUid = 1_000_000;
  const uid = () => (nextUid += 1);
  const geometries: FbxNode[] = [];
  const models: FbxNode[] = [];
  const materials: FbxNode[] = [];
  const connections: FbxNode[] = [];
  const materialUids = new Map<string, number>();
  for (const object of objects) {
    if (object.faces.length === 0) continue;
    const modelUid = uid();
    const geometryUid = uid();
    models.push(fbxModel(modelUid, object.name));
    geometries.push(fbxGeometry(geometryUid, object));
    connections.push(node("C", [S("OO"), L(modelUid), L(0)]));
    connections.push(node("C", [S("OO"), L(geometryUid), L(modelUid)]));
    for (const material of object.materials) {
      let materialUid = materialUids.get(material.name);
      if (materialUid === undefined) {
        materialUid = uid();
        materialUids.set(material.name, materialUid);
        materials.push(fbxMaterial(materialUid, material));
      }
      // connection order = material slot order on the model
      connections.push(node("C", [S("OO"), L(materialUid), L(modelUid)]));
    }
  }
  const now = new Date();
  const header = node("FBXHeaderExtension", [], [
    node("FBXHeaderVersion", [I(1003)]),
    node("FBXVersion", [I(FBX_VERSION)]),
    node("EncryptionType", [I(0)]),
    node("CreationTimeStamp", [], [
      node("Version", [I(1000)]),
      node("Year", [I(now.getFullYear())]),
      node("Month", [I(now.getMonth() + 1)]),
      node("Day", [I(now.getDate())]),
      node("Hour", [I(now.getHours())]),
      node("Minute", [I(now.getMinutes())]),
      node("Second", [I(now.getSeconds())]),
      node("Millisecond", [I(0)]),
    ]),
    node("Creator", [S("FORM Subdivision Studio")]),
  ]);
  const globalSettings = node("GlobalSettings", [], [
    node("Version", [I(1000)]),
    node("Properties70", [], [
      // Z up, right-handed, millimetres (UnitScaleFactor is in centimetres per unit)
      pInt("UpAxis", 2), pInt("UpAxisSign", 1),
      pInt("FrontAxis", 1), pInt("FrontAxisSign", -1),
      pInt("CoordAxis", 0), pInt("CoordAxisSign", 1),
      pInt("OriginalUpAxis", 2), pInt("OriginalUpAxisSign", 1),
      pDouble("UnitScaleFactor", 0.1), pDouble("OriginalUnitScaleFactor", 0.1),
      P("AmbientColor", "ColorRGB", "Color", "", D(0), D(0), D(0)),
      pString("DefaultCamera", "Producer Perspective"),
      pEnum("TimeMode", 11),
      P("TimeSpanStart", "KTime", "Time", "", L(0)),
      P("TimeSpanStop", "KTime", "Time", "", L(46186158000)),
      pDouble("CustomFrameRate", 24),
    ]),
  ]);
  const documents = node("Documents", [], [
    node("Count", [I(1)]),
    node("Document", [L(999_999), S("Scene"), S("Scene")], [
      node("Properties70", [], [P("SourceObject", "object", "", ""), pString("ActiveAnimStackName", "")]),
      node("RootNode", [L(0)]),
    ]),
  ]);
  const definitions = node("Definitions", [], [
    node("Version", [I(100)]),
    node("Count", [I(1 + models.length + geometries.length + materials.length)]),
    node("ObjectType", [S("GlobalSettings")], [node("Count", [I(1)])]),
    node("ObjectType", [S("Model")], [node("Count", [I(models.length)])]),
    node("ObjectType", [S("Geometry")], [node("Count", [I(geometries.length)])]),
    node("ObjectType", [S("Material")], [node("Count", [I(materials.length)])]),
  ]);
  return writeFbx([
    header,
    node("FileId", [{ t: "R", v: FILE_ID }]),
    node("CreationTime", [S("1970-01-01 10:00:00:000")]),
    node("Creator", [S("FORM Subdivision Studio")]),
    globalSettings,
    documents,
    node("References"),
    definitions,
    node("Objects", [], [...geometries, ...models, ...materials]),
    node("Connections", [], connections),
    node("Takes", [], [node("Current", [S("")])]),
  ]);
}

/* ------------------------------------------------------------------ */
/* Bundles                                                             */
/* ------------------------------------------------------------------ */

export const EXPORT_README = (baseName: string, objUnit: ObjUnit = "mm") => `FORM Subdivision Studio — 可编辑细分曲面导出说明
================================================

坐标：Z 轴向上，X 轴指向车尾，Y 轴为车宽方向（右手坐标系）。
单位：FBX 内部为毫米并写明单位（各软件自动换算）；本包内 OBJ 的数值单位为「${objUnit}」。
车身与玻璃是同一个连续的 Catmull-Clark 四边面控制笼（玻璃为独立材质分组），
格栅为单独的细分体；车轮、车灯、后视镜、门把手、缝线等配件为普通多边形网格。

文件
----
${baseName}_SUBD.fbx        细分体 FBX（Alias / Blender / Maya 推荐）：细分标记 + 折边权重 + 材质 + 配件
${baseName}_SUBD_CAGE.obj   纯控制笼 OBJ（+ .mtl）：Alias「Import > Subdiv」、Blender、Maya（OBJ 不含折边）
${baseName}_RHINO_SUBD.obj  Rhino 专用：硬折边处顶点已断开，ToSubD 后自动成为 SubD 折边

Autodesk Alias（2020 及以上）
--------------------------
方法 A（推荐，保留折边）：File > Open（或 File > Import > File...）选择 ${baseName}_SUBD.fbx
  → 车身以细分体 (Subdiv body) 载入，可直接用 Subdiv 工具编辑控制点/边/面；
  → 配件以多边形网格载入，可隐藏或删除。
方法 B：File > Import > Subdiv 选择 ${baseName}_SUBD_CAGE.obj
  → 直接得到细分体；Alias 官方说明 OBJ 不保存折边信息，折边需在 Alias 中重新设置。
提示：Alias 默认单位为厘米，FBX 会自动换算；OBJ 无单位信息，请在导出菜单把 OBJ 单位设为与 Alias 一致（默认 cm）。

Rhinoceros（7 / 8）
------------------
1. _Import 选择 ${baseName}_RHINO_SUBD.obj（Rhino 模板单位与 OBJ 单位一致即可，推荐毫米）。
2. 选中网格，运行 _ToSubD，并开启折边选项（Creases / InteriorCreases = 是）。
   → 断开的边自动成为 SubD 折边，得到可编辑的 Rhino SubD。
   Rhino 的折边只有“锐利/平滑”两种，半锐利权重会变成锐利或平滑。
   如需完全光滑：导入 ${baseName}_SUBD_CAGE.obj 后 _ToSubD（折边选项关闭）。

Blender（3.x / 4.x）
-------------------
File > Import > FBX，选择 ${baseName}_SUBD.fbx，在右侧选项中勾选「Subdivision Data（细分数据）」
  → 自动添加 Catmull-Clark 细分修改器（视图 2 级 / 渲染 3 级），边折痕 (Edge Crease) 与材质保留。
  （导入时缩放保持 1.0，FBX 已写明毫米单位。）
OBJ：File > Import > Wavefront (.obj)，Forward 选 Y、Up 选 Z（Blender 以米读取 OBJ 数值，导出时选 m 单位），然后添加细分修改器。

Autodesk Maya
-------------
File > Import ${baseName}_SUBD.fbx → 网格带平滑预览与折边；按 1 / 3 键切换控制笼 / 平滑显示。
`;

export interface ExportBundle {
  fbx: Uint8Array;
  cageObj: string;
  cageMtl: string;
  rhinoObj: string;
  readme: string;
}

export function buildCadBundle(cage: ControlMesh, config: VehicleConfig, accessories: ExportObject[], baseName: string, objUnit: ObjUnit = "mm"): ExportBundle {
  const subd = buildSubdObjects(cage, config);
  const header = [
    "FORM Subdivision Studio - Catmull-Clark control cage",
    "Z up | X towards rear",
    `Template: ${config.templateId} | ${subd[0].vertices.length} control points | ${subd[0].faces.length} quads`,
  ];
  return {
    fbx: writeFbxScene([...subd, ...accessories]),
    cageObj: writeObj(subd, `${baseName}_SUBD_CAGE.mtl`, header, objUnit),
    cageMtl: writeMtl(subd),
    rhinoObj: writeObj(subd.map((object) => unweldCreases(object)), null, [...header, "Rhino: hard creases unwelded - run _ToSubD with creases enabled"], objUnit),
    readme: EXPORT_README(baseName, objUnit),
  };
}

export function zipCadBundle(bundle: ExportBundle, baseName: string) {
  return zipSync({
    [`${baseName}_SUBD.fbx`]: bundle.fbx,
    [`${baseName}_SUBD_CAGE.obj`]: strToU8(bundle.cageObj),
    [`${baseName}_SUBD_CAGE.mtl`]: strToU8(bundle.cageMtl),
    [`${baseName}_RHINO_SUBD.obj`]: strToU8(bundle.rhinoObj),
    [`${baseName}_README_导入说明.txt`]: strToU8(bundle.readme),
  });
}

export function zipRenderMesh(cage: ControlMesh, config: VehicleConfig, accessories: ExportObject[], baseName: string, objUnit: ObjUnit = "mm") {
  const objects = [...buildRenderObjects(cage, config), ...accessories];
  const obj = writeObj(objects, `${baseName}_RENDER.mtl`, ["FORM Subdivision Studio - evaluated surfaces + accessories (not editable SubD)"], objUnit);
  return zipSync({
    [`${baseName}_RENDER.obj`]: strToU8(obj),
    [`${baseName}_RENDER.mtl`]: strToU8(writeMtl(objects)),
  });
}
