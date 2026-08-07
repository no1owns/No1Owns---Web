import * as THREE from 'three';

// Each object module exposes: metadata for the UI (name/params/presets),
// an optional reference model for download, and build(values) which
// returns the live 3D group plus the plain geometry to export as STL.
export const radialPleatingRuler = {
  id: 'radialPleatingRuler',
  name: 'Radial Pleating Ruler',
  description: 'Parametric wedge for radial pleating layout.',
  presets: [
    { label: '60 mm', values: { radius: 60 } },
    { label: '100 mm', values: { radius: 100 } },
    { label: '140 mm', values: { radius: 140 } },
  ],
  params: [
    { key: 'radius', label: 'Radius (mm)', type: 'range', min: 50, max: 180, step: 1, default: 100 },
    { key: 'angle', label: 'Wedge angle (°)', type: 'range', min: 25, max: 70, step: 1, default: 42 },
    { key: 'thickness', label: 'Thickness (mm)', type: 'number', min: 2, max: 8, step: 0.2, default: 3 },
    { key: 'slots', label: 'Pleating slots', type: 'number', min: 4, max: 24, step: 1, default: 12 },
    { key: 'slotWidth', label: 'Slot width (mm)', type: 'number', min: 3, max: 10, step: 0.5, default: 5 },
    { key: 'tieHoleDiameter', label: 'Tie-hole diameter (mm)', type: 'number', min: 3, max: 10, step: 0.5, default: 5 },
  ],
  referenceModel: {
    stl: 'models/radial-pleating-ruler/radial-pleating-ruler-medium-v1.stl',
    threeMf: 'models/radial-pleating-ruler/radial-pleating-ruler-medium-v1.3mf',
  },

  build(values) {
    const R = values.radius;
    const A = values.angle * Math.PI / 180;
    const T = values.thickness;
    const segments = 48;

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    for (let i = 0; i <= segments; i++) {
      const t = -A / 2 + (A * i) / segments;
      shape.lineTo(R * Math.sin(t), R * Math.cos(t));
    }
    shape.lineTo(0, 0);

    const wedgeGeometry = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: segments });
    const wedge = new THREE.Mesh(
      wedgeGeometry,
      new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 0.05, roughness: 0.65 })
    );

    const group = new THREE.Group();
    group.add(wedge);

    // Slot and tie-hole markers are a visual preview of the intended
    // system, not boolean-cut into the mesh — same V1 scope as the
    // supplied reference model (see README).
    const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const slots = Math.round(values.slots);
    for (let i = 0; i < slots; i++) {
      const frac = (i + 0.5) / slots;
      const dist = R * 0.18 + frac * R * 0.72;
      const halfWidth = Math.min(dist * Math.tan(A / 2) * 0.68, dist);
      const slotGeometry = new THREE.BoxGeometry(halfWidth * 2, Math.max(values.slotWidth * 0.3, 0.6), T + 0.4);
      const slotMesh = new THREE.Mesh(slotGeometry, markerMaterial);
      slotMesh.position.set(0, dist, T / 2);
      group.add(slotMesh);
    }

    const holeCount = 13;
    for (let i = 0; i < holeCount; i++) {
      const t = -A / 2 + (A * i) / (holeCount - 1);
      const x = (R - 10) * Math.sin(t);
      const y = (R - 10) * Math.cos(t);
      const holeGeometry = new THREE.CylinderGeometry(values.tieHoleDiameter / 2, values.tieHoleDiameter / 2, T + 0.4, 16);
      const holeMesh = new THREE.Mesh(holeGeometry, markerMaterial);
      holeMesh.rotation.x = Math.PI / 2;
      holeMesh.position.set(x, y, T / 2);
      group.add(holeMesh);
    }

    return { object: group, exportGeometry: wedgeGeometry };
  },
};
