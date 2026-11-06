/* Export regression: builds every CAD bundle and validates the files structurally.
 * Writes the FBX files to /tmp/fbxcheck so they can also be checked with Blender's parser. */
import { strict as assert } from "node:assert";
import { mkdirSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { unzipSync, strFromU8 } from "three/examples/jsm/libs/fflate.module.js";
import { conceptTemplates, createTemplateConfig } from "../src/conceptLibrary";
import { buildCadBundle, buildSubdObjects, collectSceneAccessories, unweldCreases, writeObj, zipCadBundle, zipRenderMesh } from "../src/exporters";
import { buildVehicleAssets } from "../src/vehicleAssets";
import { buildControlMesh, type VehicleConfig } from "../src/vehicleModel";

const outDir = "/tmp/fbxcheck";
mkdirSync(outDir, { recursive: true });

const edgeKey = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);

for (const template of conceptTemplates) {
  for (const hasGrille of [false, true]) {
    const config = { ...createTemplateConfig(template), hasGrille } as VehicleConfig;
    const cage = buildControlMesh(config);
    const label = `${template.id}${hasGrille ? "+grille" : ""}`;

    // accessories as the app collects them (details from the real asset builder)
    const assets = buildVehicleAssets(config, cage, false);
    const root = new THREE.Group();
    for (const [name, geometry] of Object.entries(assets.details)) {
      if (geometry instanceof THREE.BufferGeometry) {
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: "#445055" }));
        mesh.name = name.toUpperCase();
        root.add(mesh);
      }
    }
    const tagged = new THREE.Mesh(assets.body, new THREE.MeshStandardMaterial());
    tagged.userData.exportRole = "limit";
    root.add(tagged);
    const accessories = collectSceneAccessories(root);
    assert.ok(accessories.every((object) => !object.name.startsWith("BODY")), `${label}: limit surface leaked into accessories`);

    // SubD cage: all quads, consistent winding (every interior edge used once per direction)
    const [body] = buildSubdObjects(cage, config);
    assert.ok(body.faces.every((face) => face.length === 4), `${label}: cage not all quads`);
    const directed = new Set<string>();
    for (const face of body.faces) {
      face.forEach((a, k) => {
        const key = `${a}>${face[(k + 1) % face.length]}`;
        assert.ok(!directed.has(key), `${label}: inconsistent winding at ${key}`);
        directed.add(key);
      });
    }
    assert.ok(body.creases.length > 20, `${label}: creases missing`);
    assert.ok(body.faceMaterials.includes(1), `${label}: glass material group missing`);
    const zs = body.vertices.map((v) => v[2]);
    assert.ok(Math.min(...zs) > -1 && Math.max(...zs) > 1000, `${label}: not Z-up millimetres`);

    // Rhino: hard creases become open edges
    const rhino = unweldCreases(body);
    assert.equal(rhino.faces.length, body.faces.length, `${label}: rhino face count`);
    assert.ok(rhino.vertices.length > body.vertices.length, `${label}: rhino creases not unwelded`);
    const use = new Map<string, number>();
    rhino.faces.forEach((face) => face.forEach((a, k) => {
      const key = edgeKey(a, face[(k + 1) % face.length]);
      use.set(key, (use.get(key) ?? 0) + 1);
    }));
    assert.ok([...use.values()].every((count) => count <= 2), `${label}: rhino mesh non-manifold`);

    // bundle + files
    const baseName = `FORM_${label}`;
    const bundle = buildCadBundle(cage, config, accessories, baseName);
    assert.ok(bundle.fbx.length > 20000, `${label}: FBX too small (${bundle.fbx.length} bytes)`);
    writeFileSync(`${outDir}/${label}.fbx`, bundle.fbx);

    const objGroup = new OBJLoader().parse(bundle.cageObj);
    const objBody = objGroup.children.find((child) => child.name === "BODY_SUBD") as THREE.Mesh | undefined;
    assert.ok(objBody, `${label}: OBJ body missing`);
    const objFaces = bundle.cageObj.split("\n").filter((line) => line.startsWith("f "));
    assert.ok(objFaces.every((line) => line.trim().split(/\s+/).length === 5), `${label}: OBJ cage has non-quads`);
    assert.equal(objFaces.length, body.faces.length + (hasGrille ? cage.grille.faces.length : 0), `${label}: OBJ face count`);
    assert.ok(bundle.cageObj.includes("usemtl GLASS") && bundle.cageMtl.includes("newmtl PAINT"), `${label}: OBJ materials`);

    // FBX readable by three's independent FBX parser
    const fbxBuffer = bundle.fbx.buffer.slice(bundle.fbx.byteOffset, bundle.fbx.byteOffset + bundle.fbx.byteLength);
    const scene = new FBXLoader().parse(fbxBuffer as ArrayBuffer, "");
    let meshes = 0;
    let bodyMesh: THREE.Mesh | null = null;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes += 1;
        if (child.name === "BODY_SUBD") bodyMesh = child;
      }
    });
    assert.ok(bodyMesh, `${label}: FBXLoader did not find BODY_SUBD`);
    assert.equal(meshes, 1 + (hasGrille ? 1 : 0) + accessories.length, `${label}: FBX mesh count`);

    const zip = unzipSync(zipCadBundle(bundle, baseName));
    assert.equal(Object.keys(zip).length, 5, `${label}: zip entries`);
    assert.ok(Object.values(zip).every((data) => data.length > 0), `${label}: empty file in zip`);
    assert.ok(strFromU8(zip[`${baseName}_README_导入说明.txt`]).includes("Alias"), `${label}: readme`);
    const render = unzipSync(zipRenderMesh(cage, config, accessories, baseName));
    assert.ok(render[`${baseName}_RENDER.obj`].length > 100000, `${label}: render OBJ too small`);

    if (!hasGrille) {
      console.log(`${label}: FBX ${(bundle.fbx.length / 1024).toFixed(0)} KB, ${body.vertices.length} pts / ${body.faces.length} quads / ${body.creases.length} creases, ${accessories.length} accessories, Rhino +${rhino.vertices.length - body.vertices.length} split pts`);
    }
  }
}
// OBJ units: cm output is exactly 1/10 of mm output
{
  const config = createTemplateConfig(conceptTemplates[0]);
  const objects = buildSubdObjects(buildControlMesh(config), config);
  const firstVertex = (text: string) => text.split("\n").find((line) => line.startsWith("v "))!.split(/\s+/).slice(1).map(Number);
  const mm = firstVertex(writeObj(objects, null, [], "mm"));
  const cm = firstVertex(writeObj(objects, null, [], "cm"));
  mm.forEach((value, i) => assert.ok(Math.abs(value / 10 - cm[i]) < 1e-3, "OBJ cm scaling"));
}
console.log("Export checks passed.");
