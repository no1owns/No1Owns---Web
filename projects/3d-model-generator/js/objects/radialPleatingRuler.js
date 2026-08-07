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
    { key: 'slots', label: 'Pleating slots', type: 'number', min: 6, max: 32, step: 1, default: 18 },
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
    // exported STL both reflect the actual cut geometry. In the reference,
    // the slots run almost the entire length of the ruler — a thin solid
    // hub at the tip, a thin solid rim at the edge, everything else is
    // slot — and stay close to a constant width rather than fanning out
    // sharply, so these are built from explicit Cartesian offsets (a
    // near-uniform width, tapering only slightly) rather than a fixed
    // angular width that would blow up near the tip.
    const slotCount = Math.round(values.slots);
    const margin = A * 0.04; // keep the outermost slots off the straight side edges
    const usableAngle = A - 2 * margin;
    const angularStep = usableAngle / slotCount;

    const tieHoleR = values.tieHoleDiameter / 2;
    const tieBandR = R - tieHoleR - 1.5; // tie holes sit right against the rounded edge
    const outerR = Math.min(R * 0.95, tieBandR - tieHoleR - 2); // slots stop just short of the tie-hole band
    // Inner radius grows only as far as needed to keep dense/wide slots
    // from overlapping near the tip; otherwise it stays small, matching
    // how close the reference's slots start to the centre point.
    const minInnerR = (values.slotWidth * 1.3) / Math.max(angularStep, 0.01);
    const innerR = Math.max(R * 0.05, Math.min(minInnerR, R * 0.3));

    for (let i = 0; i < slotCount; i++) {
      const center = -A / 2 + margin + angularStep * (i + 0.5);
      const dirX = Math.sin(center), dirY = -Math.cos(center);
      const perpX = Math.cos(center), perpY = Math.sin(center);
      const innerHalf = values.slotWidth / 2;
      const outerHalf = innerHalf * 1.4; // gentle taper, not a full angular fan-out

      const ix = dirX * innerR, iy = dirY * innerR;
      const ox = dirX * outerR, oy = dirY * outerR;

      const hole = new THREE.Path();
      hole.moveTo(ix - perpX * innerHalf, iy - perpY * innerHalf);
      hole.lineTo(ox - perpX * outerHalf, oy - perpY * outerHalf);
      hole.lineTo(ox + perpX * outerHalf, oy + perpY * outerHalf);
      hole.lineTo(ix + perpX * innerHalf, iy + perpY * innerHalf);
      hole.closePath();
      shape.holes.push(hole);
    }

    // Tie holes: a real through-cut ring of circles right along the
    // rounded outer edge, spaced by arc length so bigger/smaller rulers
    // get proportionately more/fewer holes.
    const arcLength = tieBandR * A;
    const tieSpacing = Math.max(values.tieHoleDiameter * 2, 7);
    const tieCount = Math.max(6, Math.min(24, Math.round(arcLength / tieSpacing) + 1));

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
