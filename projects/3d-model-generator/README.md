# 3D Model Generator

A browser-based, parametric 3D model generator. Pick an object from the dropdown, tune its parameters, orbit around it in a real 3D view, and export an STL — no account, no backend, no build step.

## Objects

- **Radial Pleating Ruler** — a parametric wedge for radial pleating layout (radius, wedge angle, thickness, pleating slot count/width, tie-hole diameter). A reference base model (`.stl` / `.3mf`) is included under `models/radial-pleating-ruler/`; see the note below on what it does and doesn't capture yet.

New objects are added as modules in `js/objects/` (see `js/objects/radialPleatingRuler.js` for the shape each one implements) and registered in `js/objects/index.js`.

## Controls

- **Object** — switch between parametric objects; parameters and presets update to match.
- **Sliders / number fields** — live-update the 3D preview.
- **Reset parameters** — restores the current object's default values.
- **Reset view** — restores the camera to a framing of the current object (useful after orbiting/panning/zooming around).
- **Drag** to rotate, **scroll/pinch** to zoom, **right-click or two-finger drag** to pan.
- **Export STL** — downloads the current object's base geometry as an STL file, generated live from the parameters.
- **Save configuration** — downloads the current object + parameter values as JSON.

## V1 note (Radial Pleating Ruler)

The live 3D preview and exported STL now cut the pleating slots and tie holes directly through the wedge geometry (real openings, not overlaid markers) — radiating slots that taper wider away from the tip, and a tie-hole ring spaced along the rounded outer edge.

Not yet modeled: the small clip notches at each slot's outer tip, and the printed mm graduation scale down the centerline — both are visual/functional details on the reference product, not structural. The bundled reference model under `models/radial-pleating-ruler/` predates this pass and only has the base wedge (no cut slots/holes). This remains a clean-room interpretation, not a guaranteed exact duplicate — the source reference doesn't establish exact dimensions.

## Usage

Open `index.html` in a modern browser with WebGL support. Requires an internet connection to load [Three.js](https://threejs.org/) from a CDN (via an import map — no bundler, no npm install).

## Stack

Vanilla HTML, CSS, and JavaScript (ES modules) plus [Three.js](https://threejs.org/) for the 3D viewer, loaded from a CDN.

## Part of

[The Lab](https://work.akintilo.com) — tools and experiments by Ayodeji Akintilo, part of [Forge HQ](https://theforgehq.com).
