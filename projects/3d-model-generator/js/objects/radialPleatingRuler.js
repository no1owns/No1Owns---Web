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
    const segments = 64;

    // Outer silhouette: apex, two straight "pleat guide" edges, rounded
    // (arc) outer edge — a plain circular sector. The apex sits at the
    // local origin with the arc trailing off in -Y, so the tip reads as
    // "up" once framed by the viewer (Three.js treats +Y as screen-up).
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    for (let i = 0; i <= segments; i++) {
      const t = -A / 2 + (A * i) / segments;
      shape.lineTo(R * Math.sin(t), -R * Math.cos(t));
    }
    shape.lineTo(0, 0);

    // Radiating pleat-guide slots: real through-cut openings (holes in the
    // 2D shape, not overlaid markers), so the browser preview and the
    // exported STL both reflect the actual cut geometry. Each slot is a
    // thin angular sector, which naturally tapers wider as it moves away
    // from the tip — matching the reference's converging guide edges.
    const slotCount = Math.round(values.slots);
    const innerR = R * 0.14; // solid hub left near the apex for strength
    const outerR = R * 0.78; // slots stop short of the edge, leaving room for the tie-hole band
    const midR = (innerR + outerR) / 2;
    const margin = A * 0.05; // keep the outermost slots off the straight side edges
    const usableAngle = A - 2 * margin;

    for (let i = 0; i < slotCount; i++) {
      const center = -A / 2 + margin + (usableAngle * (i + 0.5)) / slotCount;
      const halfAngle = Math.min(
        (values.slotWidth / 2) / midR,
        (usableAngle / slotCount / 2) * 0.85
      );
      const a0 = center - halfAngle, a1 = center + halfAngle;
      const hole = new THREE.Path();
      hole.moveTo(innerR * Math.sin(a0), -innerR * Math.cos(a0));
      hole.lineTo(outerR * Math.sin(a0), -outerR * Math.cos(a0));
      hole.lineTo(outerR * Math.sin(a1), -outerR * Math.cos(a1));
      hole.lineTo(innerR * Math.sin(a1), -innerR * Math.cos(a1));
      hole.closePath();
      shape.holes.push(hole);
    }

    // Tie holes: a real through-cut ring of circles along the rounded
    // outer edge, spaced by arc length so bigger/smaller rulers get
    // proportionately more/fewer holes.
    const tieHoleR = values.tieHoleDiameter / 2;
    const tieBandR = Math.min(R - tieHoleR - 3, Math.max(outerR + tieHoleR + 4, R * 0.92));
    const arcLength = tieBandR * A;
    const tieSpacing = Math.max(values.tieHoleDiameter * 2.2, 8);
    const tieCount = Math.max(4, Math.min(20, Math.round(arcLength / tieSpacing) + 1));

    for (let i = 0; i < tieCount; i++) {
      const t = -A / 2 + (A * i) / (tieCount - 1);
      const cx = tieBandR * Math.sin(t), cy = -tieBandR * Math.cos(t);
      const hole = new THREE.Path();
      hole.absarc(cx, cy, tieHoleR, 0, Math.PI * 2, false);
      shape.holes.push(hole);
    }

    const wedgeGeometry = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: segments });
    const wedge = new THREE.Mesh(
      wedgeGeometry,
      new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 0.05, roughness: 0.65 })
    );

    const group = new THREE.Group();
    group.add(wedge);

    return { object: group, exportGeometry: wedgeGeometry };
  },
};
