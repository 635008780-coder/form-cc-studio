import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  addBoundaryFlange,
  controlFacesGeometry,
  controlPointsGeometry,
  creaseLinesGeometry,
  evaluateBody,
  evaluateVehicleSurfaces,
  getVehicleFrame,
  getWheelPositions,
  makeWheelArchCurve,
  patchEdgesGeometry,
  patchToGeometry,
  subdivide,
  type ControlMesh,
  type TireStyle,
  type VehicleConfig,
} from "./vehicleModel";
import { buildVehicleDetails, type DetailPlacement } from "./vehicleDetails";

export type DisplayMode = "subd" | "surface" | "wire" | "boxmod" | "xray";
export type CameraView = "perspective" | "rearPerspective" | "front" | "rear" | "left" | "right" | "top" | "bottom";

interface ViewportProps {
  config: VehicleConfig;
  controlMesh: ControlMesh;
  mode: DisplayMode;
  view: CameraView;
  showGrid: boolean;
  showCage: boolean;
  exportGroupRef: React.RefObject<THREE.Group | null>;
}

interface OrbitHandle {
  target: THREE.Vector3;
  update: () => void;
}

const CAGE_ORANGE = "#e07a3c";

function viewDirection(view: CameraView) {
  const directions: Record<CameraView, [number, number, number]> = {
    perspective: [-0.62, 0.36, 0.7],
    rearPerspective: [0.66, 0.3, 0.7],
    front: [-1, 0.0001, 0],
    rear: [1, 0.0001, 0],
    left: [0, 0.0001, 1],
    right: [0, 0.0001, -1],
    top: [0.0001, 1, 0],
    bottom: [0.0001, -1, 0],
  };
  return new THREE.Vector3(...directions[view]).normalize();
}

function CameraRig({ view, length, width, height, controlsRef }: {
  view: CameraView;
  length: number;
  width: number;
  height: number;
  controlsRef: React.RefObject<OrbitHandle | null>;
}) {
  const { set, size } = useThree();

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const target = new THREE.Vector3(0, height * 0.48, 0);
    const direction = viewDirection(view);
    let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    if (view === "perspective" || view === "rearPerspective") {
      camera = new THREE.PerspectiveCamera(34, aspect, 0.05, 120);
      const horizontalFit = (length * 0.58 + width * 0.1) / (Math.tan((34 * Math.PI) / 360) * aspect);
      camera.position.copy(target).addScaledVector(direction, Math.max(7.5, length * 1.75, horizontalFit));
    } else {
      const planView = view === "top" || view === "bottom";
      const sideView = view === "left" || view === "right";
      const halfHeight = planView
        ? Math.max(length * 0.58, (width * 0.62) / aspect)
        : sideView
          ? Math.max(height * 0.75, length / (aspect * 1.75))
          : Math.max(height * 0.62, width / (aspect * 1.6));
      camera = new THREE.OrthographicCamera(-halfHeight * aspect, halfHeight * aspect, halfHeight, -halfHeight, 0.05, 120);
      camera.position.copy(target).addScaledVector(direction, Math.max(16, length * 3));
      if (view === "top") camera.up.set(1, 0, 0);
      if (view === "bottom") camera.up.set(1, 0, 0);
    }
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    set({ camera: camera as THREE.PerspectiveCamera });
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [view, length, width, height, size.width, size.height, set, controlsRef]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Wheels                                                              */
/* ------------------------------------------------------------------ */

function createTireGeometry(radius: number, rimRadius: number, width: number) {
  const half = width / 2;
  const wall = radius - rimRadius;
  const profile: Array<[number, number]> = [
    [rimRadius + 0.004, -half * 0.84],
    [rimRadius + wall * 0.3, -half * 0.97],
    [rimRadius + wall * 0.7, -half * 1.0],
    [radius - 0.016, -half * 0.94],
    [radius - 0.003, -half * 0.78],
    [radius, -half * 0.45],
    [radius, half * 0.45],
    [radius - 0.003, half * 0.78],
    [radius - 0.016, half * 0.94],
    [rimRadius + wall * 0.7, half * 1.0],
    [rimRadius + wall * 0.3, half * 0.97],
    [rimRadius + 0.004, half * 0.84],
  ];
  const geometry = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 64);
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createTreadGeometry(radius: number, tireWidth: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const count = 30;
  const blockHeight = 0.02;
  const blockLength = ((radius * Math.PI * 2) / count) * 0.55;
  const blockWidth = tireWidth * 0.27;
  const corners: Array<[number, number, number]> = [
    [-blockLength / 2, -blockHeight / 2, -blockWidth / 2], [blockLength / 2, -blockHeight / 2, -blockWidth / 2],
    [blockLength / 2, blockHeight / 2, -blockWidth / 2], [-blockLength / 2, blockHeight / 2, -blockWidth / 2],
    [-blockLength / 2, -blockHeight / 2, blockWidth / 2], [blockLength / 2, -blockHeight / 2, blockWidth / 2],
    [blockLength / 2, blockHeight / 2, blockWidth / 2], [-blockLength / 2, blockHeight / 2, blockWidth / 2],
  ];
  const box = [[0, 1, 2, 0, 2, 3], [4, 6, 5, 4, 7, 6], [0, 4, 5, 0, 5, 1], [3, 2, 6, 3, 6, 7], [0, 3, 7, 0, 7, 4], [1, 5, 6, 1, 6, 2]];
  for (let i = 0; i < count; i += 1) {
    const theta = (i / count) * Math.PI * 2;
    for (let row = 0; row < 3; row += 1) {
      const offset = positions.length / 3;
      const z = (row - 1) * blockWidth * 1.12 + (i % 2 === 0 ? 0.008 : -0.008);
      const transform = new THREE.Matrix4()
        .makeTranslation(Math.cos(theta) * (radius + 0.004), Math.sin(theta) * (radius + 0.004), z)
        .multiply(new THREE.Matrix4().makeRotationZ(theta - Math.PI / 2));
      corners.forEach((corner) => {
        const point = new THREE.Vector3(...corner).applyMatrix4(transform);
        positions.push(point.x, point.y, point.z);
      });
      box.forEach((face) => face.forEach((vertex) => indices.push(offset + vertex)));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Wheel({ x, z, side, radius, rimRadius, tireWidth, tireStyle }: {
  x: number;
  z: number;
  side: 1 | -1;
  radius: number;
  rimRadius: number;
  tireWidth: number;
  tireStyle: TireStyle;
}) {
  const tire = useMemo(() => createTireGeometry(radius, rimRadius, tireWidth), [radius, rimRadius, tireWidth]);
  const tread = useMemo(
    () => (tireStyle === "allTerrain" ? createTreadGeometry(radius, tireWidth) : null),
    [radius, tireWidth, tireStyle],
  );
  useEffect(() => () => {
    tire.dispose();
    tread?.dispose();
  }, [tire, tread]);

  const face = side * tireWidth * 0.36;
  const spokes = tireStyle === "allTerrain" ? 6 : 5;
  const spokeLength = rimRadius * 0.74;

  return (
    <group position={[x, radius, z]}>
      <mesh geometry={tire} castShadow receiveShadow>
        <meshStandardMaterial color="#1f2324" roughness={0.9} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      {tread && (
        <mesh geometry={tread}>
          <meshStandardMaterial color="#2b3031" roughness={0.95} />
        </mesh>
      )}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[rimRadius, rimRadius, tireWidth * 0.78, 40, 1, true]} />
        <meshStandardMaterial color="#5b6366" metalness={0.7} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, side * tireWidth * 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[rimRadius * 0.74, rimRadius * 0.74, 0.024, 36]} />
        <meshStandardMaterial color="#4b5052" metalness={0.8} roughness={0.42} />
      </mesh>
      <mesh position={[rimRadius * 0.52, rimRadius * 0.18, side * tireWidth * 0.14]}>
        <boxGeometry args={[0.07, rimRadius * 0.38, 0.05]} />
        <meshStandardMaterial color={tireStyle === "allTerrain" ? "#c9542d" : "#b23a2c"} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, face]}>
        <torusGeometry args={[rimRadius * 0.985, 0.014, 10, 56]} />
        <meshStandardMaterial color="#d0d4d1" metalness={0.92} roughness={0.18} />
      </mesh>
      {Array.from({ length: spokes }, (_, index) => {
        const angle = (index / spokes) * Math.PI * 2 + Math.PI / 2;
        return [-0.09, 0.09].map((spread) => {
          const a = angle + spread;
          return (
            <mesh
              key={`${index}-${spread}`}
              position={[Math.cos(a) * (rimRadius * 0.17 + spokeLength / 2), Math.sin(a) * (rimRadius * 0.17 + spokeLength / 2), face - side * 0.006]}
              rotation={[0, 0, a]}
            >
              <boxGeometry args={[spokeLength, tireStyle === "allTerrain" ? 0.034 : 0.022, 0.02]} />
              <meshStandardMaterial color="#c9cdca" metalness={0.88} roughness={0.22} />
            </mesh>
          );
        });
      })}
      <mesh position={[0, 0, face]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[rimRadius * 0.2, rimRadius * 0.22, 0.03, 24]} />
        <meshStandardMaterial color="#babfbc" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Mirror({ placement, color }: { placement: DetailPlacement; color: string }) {
  const { position, side } = placement;
  return (
    <group position={position}>
      <mesh position={[0.03, 0.035, side * 0.035]} rotation={[side * -0.75, 0, 0]}>
        <boxGeometry args={[0.07, 0.024, 0.09]} />
        <meshStandardMaterial color="#1f2527" roughness={0.5} />
      </mesh>
      <mesh position={[0.04, 0.075, side * 0.1]} scale={[0.13, 0.068, 0.092]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.3} clearcoat={0.8} />
      </mesh>
      <mesh position={[0.13, 0.075, side * 0.1]} rotation={[0, Math.PI / 2, 0]} scale={[0.85, 0.6, 1]}>
        <circleGeometry args={[0.085, 24]} />
        <meshStandardMaterial color="#2b3c44" metalness={0.8} roughness={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Handle({ placement }: { placement: DetailPlacement }) {
  return (
    <group position={placement.position} quaternion={placement.quaternion}>
      <mesh position={[0, 0, 0.007]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.011, 0.11, 6, 12]} />
        <meshStandardMaterial color="#8c9493" metalness={0.75} roughness={0.25} />
      </mesh>
    </group>
  );
}

function makeGrillePatternGeometry(config: VehicleConfig, grilleSurface: THREE.BufferGeometry) {
  const geometry = new THREE.BufferGeometry();
  if (!config.hasGrille) {
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    return geometry;
  }
  const positions: number[] = [];
  const frame = getVehicleFrame(config);
  const { gw, gh, gc, p } = frame.grille;
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const target = new THREE.Mesh(grilleSurface, material);
  target.updateMatrixWorld();
  const raycaster = new THREE.Raycaster();
  const xAt = (z: number, y: number) => {
    raycaster.set(new THREE.Vector3(-frame.L, y, z), new THREE.Vector3(1, 0, 0));
    const hit = raycaster.intersectObject(target, false)[0];
    return hit ? hit.point.x - 0.004 : null;
  };
  const edgeAt = (fraction: number) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(fraction), p)), 1 / p);
  const polyline = (points: Array<[number, number]>) => {
    for (let index = 0; index < points.length - 1; index += 1) {
      const [z0, y0] = points[index];
      const [z1, y1] = points[index + 1];
      const x0 = xAt(z0, y0);
      const x1 = xAt(z1, y1);
      if (x0 !== null && x1 !== null) positions.push(x0, y0, z0, x1, y1, z1);
    }
  };

  if (config.grillePattern === "horizontal" || config.grillePattern === "mesh") {
    for (let row = -4; row <= 4; row += 1) {
      const fraction = row / 5;
      const z = gw * edgeAt(fraction) * 0.9;
      const y = gc + gh * fraction;
      polyline(Array.from({ length: 13 }, (_, i) => [-z + (2 * z * i) / 12, y] as [number, number]));
    }
  }
  if (config.grillePattern === "vertical" || config.grillePattern === "mesh") {
    for (let column = -7; column <= 7; column += 1) {
      const fraction = column / 8;
      const z = gw * fraction;
      const y = gh * edgeAt(fraction) * 0.86;
      polyline(Array.from({ length: 5 }, (_, i) => [z, gc - y + (2 * y * i) / 4] as [number, number]));
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  material.dispose();
  return geometry;
}

function makeGrilleRibGeometry(lines: THREE.BufferGeometry, pattern: VehicleConfig["grillePattern"]) {
  const position = lines.getAttribute("position");
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index + 1 < position.count; index += 2) {
    const a = new THREE.Vector3().fromBufferAttribute(position, index);
    const b = new THREE.Vector3().fromBufferAttribute(position, index + 1);
    const horizontal = Math.abs(b.z - a.z) > Math.abs(b.y - a.y);
    const width = pattern === "mesh" ? 0.0035 : horizontal ? 0.008 : 0.006;
    const offset = horizontal ? [0, width, 0] : [0, 0, width];
    const base = vertices.length / 3;
    for (const point of [a, b]) {
      vertices.push(point.x - 0.009, point.y + offset[1], point.z + offset[2]);
      vertices.push(point.x - 0.009, point.y - offset[1], point.z - offset[2]);
    }
    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Vehicle                                                             */
/* ------------------------------------------------------------------ */

function useVehicleAssets(config: VehicleConfig, cage: ControlMesh) {
  const shapeKey = JSON.stringify({ ...config, paintColor: "" });
  const assets = useMemo(() => {
    const level1 = evaluateBody(cage, 1);
    const surfaces = evaluateVehicleSurfaces(cage, 2);
    const level2 = surfaces.body;
    const glassFaces = [...cage.sideGlass, ...cage.windshield, ...cage.rearGlass];
    const grillePatch = cage.grille.faces.length
      ? subdivide(cage.grille.vertices, cage.grille.faces, [], 2)
      : { vertices: [], faces: [] };
    const grilleGeometry = cage.grille.faces.length ? patchToGeometry(grillePatch) : new THREE.BufferGeometry();
    const grillePattern = makeGrillePatternGeometry(config, grilleGeometry);
    const bodyGeometry = patchToGeometry(level2);
    const result = {
      cage,
      body: bodyGeometry,
      flange: patchToGeometry(addBoundaryFlange(level2, 0.026, false)),
      surfaceLines: patchEdgesGeometry(level1.vertices, level1.faces),
      sideGlass: patchToGeometry(surfaces.sideGlass),
      windshield: patchToGeometry(surfaces.windshield),
      rearGlass: patchToGeometry(surfaces.rearGlass),
      grille: grilleGeometry,
      grilleBezel: cage.grilleOpening.length
        ? new THREE.CatmullRomCurve3(cage.grilleOpening.map((point) => new THREE.Vector3(...point)), true, "centripetal", 0.5)
        : null,
      grillePattern,
      grilleRibs: makeGrilleRibGeometry(grillePattern, config.grillePattern),
      cageLines: patchEdgesGeometry(cage.vertices, [...cage.faces, ...glassFaces]),
      grilleCage: patchEdgesGeometry(cage.grille.vertices, cage.grille.faces),
      boxBody: controlFacesGeometry(cage.vertices, cage.faces),
      boxGlass: controlFacesGeometry(cage.vertices, glassFaces),
      boxGrille: controlFacesGeometry(cage.grille.vertices, cage.grille.faces),
      points: controlPointsGeometry(cage.vertices),
      creases: creaseLinesGeometry(cage),
      details: buildVehicleDetails(config, bodyGeometry),
      archCurves: (["front", "rear"] as const).flatMap((axle) =>
        ([1, -1] as const).map((side) => makeWheelArchCurve(config, axle, side)),
      ),
    };
    return result;
  }, [shapeKey, cage]);

  useEffect(() => () => {
    Object.values(assets).forEach((value) => {
      if (value instanceof THREE.BufferGeometry) value.dispose();
    });
    assets.details.dispose();
  }, [assets]);

  return assets;
}

function VehicleAssembly({ config, controlMesh, mode, showCage, exportGroupRef }: {
  config: VehicleConfig;
  controlMesh: ControlMesh;
  mode: DisplayMode;
  showCage: boolean;
  exportGroupRef: React.RefObject<THREE.Group | null>;
}) {
  const assets = useVehicleAssets(config, controlMesh);
  const wheel = useMemo(() => getWheelPositions(config), [controlMesh]);
  const { details } = assets;
  const isBox = mode === "boxmod";
  const isXray = mode === "xray";
  const isWire = mode === "wire";
  const showSmooth = !isBox;
  const showTrim = mode === "surface" || mode === "subd";
  const paint = config.paintColor;

  return (
    <>
      <group ref={exportGroupRef}>
        <group visible={showSmooth}>
            <mesh geometry={assets.body} visible={!isXray} userData={{ exportIgnore: true }}>
                <meshStandardMaterial color={isWire ? "#9d9a93" : "#15191a"} roughness={0.9} side={THREE.BackSide} />
            </mesh>
            <mesh name="BODY_SHELL_EVALUATED" geometry={assets.body} castShadow>
              <meshPhysicalMaterial
                color={isWire ? "#eceae3" : paint}
                metalness={isWire ? 0 : 0.32}
                roughness={isWire ? 0.55 : 0.28}
                clearcoat={isWire ? 0 : 0.85}
                clearcoatRoughness={0.12}
                side={isXray ? THREE.DoubleSide : THREE.FrontSide}
                transparent={isXray}
                opacity={isXray ? 0.22 : 1}
                depthWrite={!isXray}
                polygonOffset
                polygonOffsetFactor={1}
                polygonOffsetUnits={2}
              />
            </mesh>
            <mesh name="OPENING_RETURNS" geometry={assets.flange}>
              <meshStandardMaterial color={isWire ? "#c9c6be" : "#1c2224"} roughness={0.8} side={THREE.DoubleSide} transparent={isXray} opacity={isXray ? 0.3 : 1} />
            </mesh>
            {[assets.sideGlass, assets.windshield, assets.rearGlass].map((geometry, index) => (
              <mesh key={index} name={["SIDE_GLASS", "WINDSHIELD", "REAR_GLASS"][index]} geometry={geometry}>
                <meshPhysicalMaterial
                  color={isWire ? "#b9cdd6" : "#1b2a31"}
                  metalness={0.3}
                  roughness={0.06}
                  clearcoat={1}
                  transparent
                  opacity={isWire ? 0.55 : 0.88}
                  side={THREE.DoubleSide}
                />
              </mesh>
            ))}
            {config.hasGrille && <>
              <mesh name="GRILLE" geometry={assets.grille}>
                <meshStandardMaterial color="#14191b" roughness={0.6} metalness={0.3} side={THREE.DoubleSide} />
              </mesh>
              {assets.grilleBezel && <>
                <mesh name="GRILLE_BEZEL_BASE">
                  <tubeGeometry args={[assets.grilleBezel, 96, 0.011, 6, true]} />
                  <meshStandardMaterial color="#161e22" roughness={0.62} metalness={0.2} />
                </mesh>
                <mesh name="GRILLE_BEZEL_EDGE" position={[-0.005, 0, 0]}>
                  <tubeGeometry args={[assets.grilleBezel, 96, 0.004, 5, true]} />
                  <meshStandardMaterial color="#afb8b6" metalness={0.8} roughness={0.28} />
                </mesh>
              </>}
              <lineSegments name="GRILLE_PATTERN" geometry={assets.grillePattern}>
                <lineBasicMaterial color={isWire ? CAGE_ORANGE : "#607075"} />
              </lineSegments>
              <mesh name="GRILLE_RIBS" geometry={assets.grilleRibs}>
                <meshStandardMaterial color="#a9b0ad" metalness={0.74} roughness={0.31} side={THREE.DoubleSide} />
              </mesh>
            </>}
        </group>

        <group visible={showTrim}>
            <mesh geometry={details.gaps}>
              <meshBasicMaterial color="#0d1112" side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={details.frontLamps}>
              <meshPhysicalMaterial color={config.type === "micro" ? "#c7d4d7" : "#26383f"} emissive="#2b444c" emissiveIntensity={0.18} metalness={0.45} roughness={0.1} clearcoat={1} side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={details.frontLightElements}>
              <meshBasicMaterial color="#e2f3f6" side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={details.drl}>
              <meshBasicMaterial color="#f3fbff" side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={details.rearLamps}>
              <meshPhysicalMaterial color="#7a1d1a" emissive="#c2281d" emissiveIntensity={0.35} roughness={0.15} clearcoat={1} side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={details.darkTrim}>
              <meshStandardMaterial color="#222829" roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            {details.mirrors.map((placement, index) => (
              <Mirror key={index} placement={placement} color={paint} />
            ))}
            {details.handles.map((placement, index) => (
              <Handle key={index} placement={placement} />
            ))}
            {details.antenna && (
              <group position={details.antenna.position} quaternion={details.antenna.quaternion}>
                <mesh position={[0.02, 0, 0.012]} scale={[0.07, 0.016, 0.03]}>
                  <sphereGeometry args={[1, 16, 10]} />
                  <meshStandardMaterial color="#1d2325" roughness={0.4} />
                </mesh>
              </group>
            )}
            {details.roofRails.map((points, index) => (
              <mesh key={index}>
                <tubeGeometry args={[new THREE.CatmullRomCurve3(points), 40, 0.014, 8, false]} />
                <meshStandardMaterial color="#2a3133" metalness={0.6} roughness={0.35} />
              </mesh>
            ))}
            {config.type === "suv" && assets.archCurves.map((curve, index) => (
              <mesh key={index}>
                <tubeGeometry args={[curve, 48, 0.02, 8, false]} />
                <meshStandardMaterial color="#262c2d" roughness={0.85} />
              </mesh>
            ))}
        </group>

        {[wheel.front, wheel.rear].flatMap((x, axleIndex) =>
          ([1, -1] as const).map((side) => (
            <Wheel
              key={`${axleIndex}-${side}`}
              x={x}
              z={side * (axleIndex === 0 ? wheel.frontLateral : wheel.rearLateral)}
              side={side}
              radius={wheel.radius}
              rimRadius={wheel.rimRadius}
              tireWidth={wheel.tireWidth}
              tireStyle={config.tireStyle}
            />
          )),
        )}
      </group>

      {isWire && (
        <lineSegments geometry={assets.surfaceLines} renderOrder={2}>
          <lineBasicMaterial color={CAGE_ORANGE} transparent opacity={0.9} />
        </lineSegments>
      )}

      {isBox && (
        <>
          <mesh geometry={assets.boxBody} castShadow receiveShadow>
            <meshStandardMaterial color="#f1eee6" roughness={0.75} metalness={0} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={2} />
          </mesh>
          <mesh geometry={assets.boxGlass}>
            <meshStandardMaterial color="#9fb9c4" roughness={0.4} transparent opacity={0.7} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={2} />
          </mesh>
          {config.hasGrille && <mesh geometry={assets.boxGrille}>
            <meshStandardMaterial color="#3b4447" roughness={0.6} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={2} />
          </mesh>}
          <lineSegments geometry={assets.cageLines} renderOrder={3}>
            <lineBasicMaterial color={CAGE_ORANGE} />
          </lineSegments>
          {config.hasGrille && <lineSegments geometry={assets.grilleCage} renderOrder={3}>
            <lineBasicMaterial color={CAGE_ORANGE} />
          </lineSegments>}
          {showCage && (
            <lineSegments geometry={assets.creases} renderOrder={4}>
              <lineBasicMaterial color="#7a2a0c" />
            </lineSegments>
          )}
        </>
      )}

      {showCage && (mode === "subd" || isXray) && (
        <>
          <lineSegments geometry={assets.cageLines} renderOrder={3}>
            <lineBasicMaterial color={CAGE_ORANGE} transparent opacity={isXray ? 0.95 : 0.85} depthTest={!isXray} />
          </lineSegments>
          {config.hasGrille && <lineSegments geometry={assets.grilleCage} renderOrder={3}>
            <lineBasicMaterial color={CAGE_ORANGE} transparent opacity={0.8} depthTest={!isXray} />
          </lineSegments>}
          <lineSegments geometry={assets.creases} renderOrder={4}>
            <lineBasicMaterial color="#ffd2a8" depthTest={!isXray} />
          </lineSegments>
          {mode === "subd" && (
            <points geometry={assets.points} renderOrder={5}>
              <pointsMaterial color="#ffb37a" size={0.028} sizeAttenuation />
            </points>
          )}
        </>
      )}
    </>
  );
}

function SceneContent({ config, controlMesh, mode, view, showGrid, showCage, exportGroupRef }: ViewportProps) {
  const controlsRef = useRef<OrbitHandle | null>(null);
  const height = config.height / 1000;
  const length = config.length / 1000;
  const width = config.width / 1000;
  const lightBackground = mode === "boxmod" || mode === "wire";

  return (
    <>
      <color attach="background" args={[lightBackground ? "#9a9c9b" : "#12191e"]} />
      <ambientLight intensity={lightBackground ? 1.4 : 0.9} />
      <hemisphereLight args={["#eef3f4", "#4c585d", 1.1]} />
      <directionalLight
        position={[-5, 8, 6]}
        intensity={3.1}
        color="#fff4e8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[5, 4, -6]} intensity={1.9} color="#a8c3cf" />
      <directionalLight position={[6, 2.5, 4]} intensity={0.9} color="#ffd9bd" />

      {showGrid && (
        <Grid
          position={[0, 0.004, 0]}
          infiniteGrid
          cellSize={0.5}
          cellThickness={0.55}
          sectionSize={2}
          sectionThickness={0.9}
          cellColor={lightBackground ? "#8a8d8c" : "#29343a"}
          sectionColor={lightBackground ? "#7b7f7e" : "#3a464c"}
          fadeDistance={26}
          fadeStrength={2.2}
        />
      )}
      <ContactShadows position={[0, 0.01, 0]} opacity={0.38} scale={14} blur={2.6} far={5} resolution={128} color="#050708" />

      <VehicleAssembly config={config} controlMesh={controlMesh} mode={mode} showCage={showCage} exportGroupRef={exportGroupRef} />
      <OrbitControls
        ref={controlsRef as React.RefObject<never>}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2.5}
        maxDistance={20}
        target={[0, height * 0.48, 0]}
      />
      <CameraRig view={view} length={length} width={width} height={height} controlsRef={controlsRef} />
    </>
  );
}

export default function VehicleScene(props: ViewportProps) {
  return (
    <Canvas
      camera={{ position: [-7.2, 4.2, 8.8], fov: 34, near: 0.05, far: 120 }}
      shadows
      frameloop="demand"
      dpr={[1, 1.35]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
