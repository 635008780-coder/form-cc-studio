import {
  addBoundaryFlange,
  evaluateVehicleSurfaces,
  subdivide,
  type ControlMesh,
  type PatchMesh,
} from "./vehicleModel";

/** Export the actual evaluated quad patches, not the triangles used by WebGL. */
export function createQuadSurfaceObj(cage: ControlMesh) {
  const lines = [
    "# FORM evaluated Catmull-Clark vehicle surfaces",
    "# Units: mm | X length / Y up / Z width",
    "# All face records are quads. Wheels and decorative trim are intentionally excluded.",
  ];
  let vertexOffset = 0;
  const writePatch = (name: string, patch: PatchMesh) => {
    if (patch.faces.length === 0) return;
    lines.push(`o ${name}`);
    patch.vertices.forEach(([x, y, z]) => {
      lines.push(`v ${(x * 1000).toFixed(4)} ${(y * 1000).toFixed(4)} ${(z * 1000).toFixed(4)}`);
    });
    patch.faces.forEach((face) => {
      if (face.length !== 4) throw new Error("The evaluated surface contains a non-quad face.");
      lines.push(`f ${face.map((index) => index + vertexOffset + 1).join(" ")}`);
    });
    vertexOffset += patch.vertices.length;
  };

  const surfaces = evaluateVehicleSurfaces(cage, 2);
  const body = surfaces.body;
  writePatch("BODY_SHELL", body);
  writePatch("OPENING_RETURNS", addBoundaryFlange(body, 0.026, false));
  writePatch("SIDE_GLASS", surfaces.sideGlass);
  writePatch("WINDSHIELD", surfaces.windshield);
  writePatch("REAR_GLASS", surfaces.rearGlass);
  if (cage.grille.faces.length) {
    writePatch("GRILLE", subdivide(cage.grille.vertices, cage.grille.faces, [], 2));
  }
  lines.push("");
  return lines.join("\n");
}