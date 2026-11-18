import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

// Node polyfill for FileReader required by Three.js GLTFExporter
global.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = 'data:application/octet-stream;base64,' + Buffer.from(buf).toString('base64');
      if (this.onloadend) this.onloadend();
    });
  }
};

/**
 * Procedural Luxury Pen Builder
 * Builds a precision 3D writing instrument matching haute horlogerie standards.
 */
function createLuxuryPen(finishType) {
  const penGroup = new THREE.Group();
  penGroup.name = `LuxuryPen_${finishType}`;

  // Color & Material definitions for the 4 luxury finishes
  let barrelColor = 0xFAFAFA;
  let barrelRoughness = 0.12;
  let barrelMetalness = 0.05;

  let trimColor = 0xE2E8F0; // silver platinum
  let trimRoughness = 0.12;
  let trimMetalness = 0.95;

  let capColor = 0xE2E8F0;
  let capRoughness = 0.18;
  let capMetalness = 0.92;

  if (finishType === 'gold') {
    barrelColor = 0x0A0B0E; // deep obsidian black lacquer
    barrelRoughness = 0.08;
    barrelMetalness = 0.05;
    trimColor = 0xD4AF37; // 24K imperial gold
    trimRoughness = 0.15;
    trimMetalness = 0.9;
    capColor = 0xD4AF37;
    capRoughness = 0.22;
    capMetalness = 0.88;
  } else if (finishType === 'silver') {
    barrelColor = 0x0A0B0E; // black barrel with silver trims
    barrelRoughness = 0.08;
    barrelMetalness = 0.05;
    trimColor = 0xF1F5F9;
    trimRoughness = 0.1;
    trimMetalness = 0.98;
    capColor = 0xE2E8F0;
    capRoughness = 0.2;
    capMetalness = 0.95;
  } else if (finishType === 'stealth') {
    barrelColor = 0x0E1117; // stealth matte black
    barrelRoughness = 0.25;
    barrelMetalness = 0.3;
    trimColor = 0x334155; // dark titanium
    trimRoughness = 0.28;
    trimMetalness = 0.85;
    capColor = 0x1E293B;
    capRoughness = 0.3;
    capMetalness = 0.8;
  } else {
    // 'white': Carrara White Lacquer & Silver Chrome
    barrelColor = 0xFFFFFF;
    barrelRoughness = 0.1;
    barrelMetalness = 0.04;
    trimColor = 0xF8FAFC;
    trimRoughness = 0.1;
    trimMetalness = 0.96;
    capColor = 0xE2E8F0;
    capRoughness = 0.2;
    capMetalness = 0.92;
  }

  // Materials
  const nibMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748B,
    metalness: 0.98,
    roughness: 0.15,
  });

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: trimColor,
    metalness: trimMetalness,
    roughness: trimRoughness,
  });

  const barrelMaterial = new THREE.MeshStandardMaterial({
    color: barrelColor,
    metalness: barrelMetalness,
    roughness: barrelRoughness,
  });

  const capMaterial = new THREE.MeshStandardMaterial({
    color: capColor,
    metalness: capMetalness,
    roughness: capRoughness,
  });

  // 1. Ballpoint Tip (x = -4.9)
  const tipGeom = new THREE.CylinderGeometry(0.04, 0.09, 0.3, 32);
  tipGeom.rotateZ(Math.PI / 2);
  const tipMesh = new THREE.Mesh(tipGeom, nibMaterial);
  tipMesh.position.set(-4.85, 0, 0);
  penGroup.add(tipMesh);

  // 2. Conical Nose Cone (x = -4.7 to -3.1)
  const noseGeom = new THREE.CylinderGeometry(0.09, 0.38, 1.6, 48);
  noseGeom.rotateZ(Math.PI / 2);
  const noseMesh = new THREE.Mesh(noseGeom, trimMaterial);
  noseMesh.position.set(-3.9, 0, 0);
  penGroup.add(noseMesh);

  // 3. Nose Accent Dual Rings (x = -3.1 to -2.9)
  const ring1Geom = new THREE.CylinderGeometry(0.395, 0.395, 0.08, 48);
  ring1Geom.rotateZ(Math.PI / 2);
  const ring1Mesh = new THREE.Mesh(ring1Geom, trimMaterial);
  ring1Mesh.position.set(-3.05, 0, 0);
  penGroup.add(ring1Mesh);

  const ring2Geom = new THREE.CylinderGeometry(0.39, 0.39, 0.06, 48);
  ring2Geom.rotateZ(Math.PI / 2);
  const ring2Mesh = new THREE.Mesh(ring2Geom, trimMaterial);
  ring2Mesh.position.set(-2.95, 0, 0);
  penGroup.add(ring2Mesh);

  // 4. Main Pen Barrel (x = -2.9 to 0.7, length 3.6)
  const barrelGeom = new THREE.CylinderGeometry(0.38, 0.385, 3.6, 64);
  barrelGeom.rotateZ(Math.PI / 2);
  const barrelMesh = new THREE.Mesh(barrelGeom, barrelMaterial);
  barrelMesh.position.set(-1.1, 0, 0);
  penGroup.add(barrelMesh);

  // 5. Center Waist Coupling Band (x = 0.7 to 1.1)
  const waistGeom = new THREE.CylinderGeometry(0.405, 0.405, 0.35, 48);
  waistGeom.rotateZ(Math.PI / 2);
  const waistMesh = new THREE.Mesh(waistGeom, trimMaterial);
  waistMesh.position.set(0.9, 0, 0);
  penGroup.add(waistMesh);

  // 6. Fluted Guilloché Pen Cap (x = 1.1 to 4.7, length 3.6)
  const capGeom = new THREE.CylinderGeometry(0.395, 0.39, 3.6, 64);
  capGeom.rotateZ(Math.PI / 2);
  const capMesh = new THREE.Mesh(capGeom, capMaterial);
  capMesh.position.set(2.9, 0, 0);
  penGroup.add(capMesh);

  // 7. Sculpted Pocket Clip
  // Clip mount block on cap near rear (x = 4.3)
  const clipBaseGeom = new THREE.BoxGeometry(0.2, 0.12, 0.1);
  const clipBase = new THREE.Mesh(clipBaseGeom, trimMaterial);
  clipBase.position.set(4.3, 0.44, 0);
  penGroup.add(clipBase);

  // Main arched clip blade extending forward to x = 1.7
  const clipBladeGeom = new THREE.BoxGeometry(2.6, 0.05, 0.12);
  const clipBlade = new THREE.Mesh(clipBladeGeom, trimMaterial);
  clipBlade.position.set(3.0, 0.49, 0);
  penGroup.add(clipBlade);

  // Clip drop finial/teardrop tip
  const clipTipGeom = new THREE.SphereGeometry(0.09, 24, 24);
  clipTipGeom.scale(1.4, 0.8, 1);
  const clipTip = new THREE.Mesh(clipTipGeom, trimMaterial);
  clipTip.position.set(1.7, 0.45, 0);
  penGroup.add(clipTip);

  // 8. Cap End Crown / Finial (x = 4.7 to 5.2)
  const crownGeom = new THREE.CylinderGeometry(0.39, 0.36, 0.5, 48);
  crownGeom.rotateZ(Math.PI / 2);
  const crownMesh = new THREE.Mesh(crownGeom, trimMaterial);
  crownMesh.position.set(4.95, 0, 0);
  penGroup.add(crownMesh);

  // End Jewel Inset
  const jewelGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 32);
  jewelGeom.rotateZ(Math.PI / 2);
  const jewelMat = new THREE.MeshStandardMaterial({
    color: 0x05070A,
    roughness: 0.05,
    metalness: 0.1,
  });
  const jewelMesh = new THREE.Mesh(jewelGeom, jewelMat);
  jewelMesh.position.set(5.22, 0, 0);
  penGroup.add(jewelMesh);

  return penGroup;
}

// Generate all 4 GLB models
const finishes = ['white', 'silver', 'stealth', 'gold'];
const outputDir = path.resolve('public/models');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function exportAll() {
  const exporter = new GLTFExporter();

  for (const finish of finishes) {
    const pen = createLuxuryPen(finish);
    const scene = new THREE.Scene();
    scene.add(pen);

    await new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (gltf) => {
          const outPath = path.join(outputDir, `luxury-pen-${finish}.glb`);
          fs.writeFileSync(outPath, Buffer.from(gltf));
          console.log(`Exported luxury-pen-${finish}.glb (${gltf.byteLength} bytes)`);
          resolve();
        },
        (err) => reject(err),
        { binary: true }
      );
    });
  }

  // Also create default luxury-pen.glb
  fs.copyFileSync(
    path.join(outputDir, 'luxury-pen-white.glb'),
    path.join(outputDir, 'luxury-pen.glb')
  );
  console.log('Created default luxury-pen.glb');
}

exportAll().then(() => console.log('All 3D luxury pen models built successfully!'));
