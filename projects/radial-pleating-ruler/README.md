# Radial Pleating Ruler V1

A clean-room, parametric interpretation of the radial pleating tool shown in the supplied reference image.

## Included

- `models/radial-pleating-ruler-medium-v1.3mf` — 100 mm / 42° / 3 mm printable base model
- `models/radial-pleating-ruler-medium-v1.stl` — fallback mesh
- `index.html` — browser configurator and visual preview

## Important V1 note

The downloadable 3MF is a valid 3D Manufacturing Format mesh of the ruler body. The configurator previews the intended slot and tie-hole system. Because the source image does not establish exact dimensions, V1 does not claim to duplicate the photographed product. A subsequent CAD pass should boolean-cut the slots/holes/notches and add printable metric engraving after test-printing the overall proportions.

## Usage

Open `index.html` in a modern browser to explore the configurator (radius, wedge angle, thickness, slot count/width, tie-hole diameter), export a browser-generated STL, or save a JSON configuration. Open the `.3mf` directly in Bambu Studio (or any slicer that supports 3MF).

## Stack

Vanilla HTML, CSS, and JavaScript. SVG for the live preview; STL export is generated client-side.

## Part of

[The Lab](https://work.akintilo.com) — tools and experiments by Ayodeji Akintilo, part of [Forge HQ](https://theforgehq.com).
