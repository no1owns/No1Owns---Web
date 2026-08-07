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
    // exported STL both reflect the actual cut geometry.
    //
    // The reference keeps a solid strip straight down the centreline
    // (where its printed mm scale sits) and arranges the slots as two
    // mirrored fans flanking it — not one continuous fan sweeping through
    // the middle. Each slot spans a fixed *angular* width (not a fixed
    // linear width): with many slots on each side converging toward the
    // spine, a constant linear width is geometrically impossible to fit
    // without adjacent slots overlapping (an earlier pass tried that and
    // it silently broke Three.js's triangulator, dropping most of each
    // hole). A fixed angular width tapers the physical slot width down
    // toward the spine by construction, and the 0.8 factor caps each slot
    // within its own angular budget so neighbors can never overlap.
    const margin = A * 0.04; // keep the outermost slots off the straight side edges
    const usableAngle = A - 2 * margin;
    const spineHalfAngle = usableAngle * 0.06; // solid centre strip for the ruler markings
    const sideAngle = usableAngle / 2 - spineHalfAngle;
    const slotsPerSide = Math.max(1, Math.round(values.slots / 2));
    const angularStep = sideAngle / slotsPerSide;

    const tieHoleR = values.tieHoleDiameter / 2;
    const tieBandR = R - tieHoleR - 1.5; // tie holes sit right against the rounded edge
    const outerR = Math.min(R * 0.95, tieBandR - tieHoleR - 2); // slots stop just short of the tie-hole band
    const innerR = R * 0.06; // thin solid hub left near the apex for strength
    const midR = (innerR + outerR) / 2;
    const halfAngle = Math.min((values.slotWidth / 2) / midR, (angularStep / 2) * 0.8);

    for (const side of [-1, 1]) {
      for (let i = 0; i < slotsPerSide; i++) {
        const center = side * (spineHalfAngle + angularStep * (i + 0.5));
        const a0 = center - halfAngle, a1 = center + halfAngle;
        const hole = new THREE.Path();
        hole.moveTo(innerR * Math.sin(a0), -innerR * Math.cos(a0));
        hole.lineTo(outerR * Math.sin(a0), -outerR * Math.cos(a0));
        hole.lineTo(outerR * Math.sin(a1), -outerR * Math.cos(a1));
        hole.lineTo(innerR * Math.sin(a1), -innerR * Math.cos(a1));
        hole.closePath();
        shape.holes.push(hole);
      }
    }

    // Tie holes: a real through-cut ring of circles right along the
    // rounded outer edge, spaced by arc length so bigger/smaller rulers
    // get proportionately more/fewer holes.
    const arcLength = tieBandR * A;
    const tieSpacing = Math.max(values.tieHoleDiameter * 2, 7);
    // Floor of 2 (not a larger fixed minimum): a hard floor that ignores
    // arc length is exactly the bug the slots just had — on a short arc
    // with large holes it forces overlapping holes and breaks the
    // triangulator the same way.
    const tieCount = Math.max(2, Math.min(24, Math.round(arcLength / tieSpacing) + 1));

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
