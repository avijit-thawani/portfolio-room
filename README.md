# portfolio-room

An interactive portfolio that is one illustration you can lean into, with the
content hidden inside the objects in the picture. Click the typewriter to read
the writing section; click the chalkboard for research. Live at
**https://thawani.co**.

There is no 3D scene behind it. It is a single flat image plus a grayscale
depth map, displaced and shaded in a fragment shader, which is why the whole
thing is a few hundred kilobytes and runs on a phone.

This repo is the working engine, the tooling that produced the artwork, and the
prompts the artwork was generated from — enough to build your own version.

## Quick start

You need Python 3 and nothing else to run the site; three.js is vendored.

```sh
git clone https://github.com/avijit-thawani/portfolio-room
cd portfolio-room
python3 tools/serve.py --port 8010
```

Then open `http://localhost:8010`.

Do **not** use `python -m http.server`. It is single-threaded, the large room
texture monopolises the handler, and the ES module fetches fail in a way that
looks like a code bug. `tools/serve.py` is threaded for exactly this reason.

| Want to | Do this |
|---|---|
| Switch scenes | `/?scene=<id>` — ids are in `src/scenes.js` |
| See the dev chrome | add `?dev` — HUD, depth toggle, dashed hotspot outlines |
| Inspect the depth map | press **`d`** to overlay it; the single most useful debug view |
| Move a hotspot | add `?edit`, drag the boxes; releasing copies the new array to your clipboard |
| Poke the engine live | `window.__room` / `window.__compare` expose `px`, `ui`, `spots` |

## How the effect works

The illustration sits on a subdivided plane viewed through a real
`PerspectiveCamera`. Everything interesting is in `src/parallax.js`.

- **Pointer sway** is a per-pixel UV shift in the fragment shader, weighted by
  the depth map. Shifting pixels rather than geometry keeps silhouettes crisp —
  a continuous mesh cannot open a hole at a silhouette, it stretches across it.
- **Click-to-zoom** dollies the camera toward the clicked point and ramps the
  vertex displacement in *as it travels*. At rest the plane is flat, so nothing
  gives the trick away until you are already moving.
- **Panning** (`src/pan.js`) slides the camera when the image outgrows the
  viewport — touch drag plus edge arrows, gated on whether panning is possible
  at all rather than on whether the device has touch.
- **Particles** (`src/particles.js`) are the only thing moving on their own:
  dust indoors, birds over the rooftops. The sprites live in the plane's world
  space and reuse the same parallax maths, so depth alone decides how much each
  one sways.
- **Hotspots** are plain HTML `<button>`s positioned in image fractions, and
  they project at their own depth rather than at z = 0 — `projectImageRect`
  reads the depth map on the CPU so a box stays glued to its object during a
  zoom.

Knobs worth turning first: `FOV`, `DEPTH_SCALE` and `ZOOM_IN` in
`src/parallax.js`; the per-scene `particles` block in `src/scenes.js`.

## Making your own artwork

The prompts that generated the shipped scenes are in `tools/`, kept as a record
of what actually worked rather than as a tidy template:

- [`tools/art-prompt.md`](tools/art-prompt.md) — the original brief and the
  reasoning behind it.
- [`tools/art-prompts-v2.md`](tools/art-prompts-v2.md) — the second pass, with
  notes on which revisions helped and which did not.
- Per-scene prompts: `room-prompt-v2.md`, `benaras-prompt-v6.md`,
  `varanasi-prompt-v3.md`, `varanasi-prompt-v4.md`, `nyc-prompt-v2.md`.

The pipeline from a generated image to a scene the engine can load:

```sh
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python tools/depth.py  art-src/myscene.png --band 0.45,0.95
.venv/bin/python tools/encode.py art-src/myscene.png
```

`depth.py` estimates a depth map (white = near), `encode.py` writes the WebP the
browser loads into `assets/`. Then add the scene to `src/scenes.js` and
calibrate its hotspots with `?edit`.

`art-src/` — the full-resolution PNGs — is deliberately not committed: it is
about 30 MB that no browser ever requests. Only the compressed `assets/*.webp`
ship.

### Two things that will bite you

**Reach for `--band` before anything else.** A full-range depth map is the
smearing. Upstream depth models spend the whole 0..1 range separating regions,
but the shader also reads that number as distance, so the foreground travels far
enough to tear. `--band 0.45,0.95` halves the travel, keeps the ordering, and
anchoring the low end near 0.5 pins the background so only the foreground moves.

**New art invalidates the hotspot table.** The boxes are stored as image
fractions, so regenerating a scene silently leaves every hotspot on the old
object positions, with nothing erroring. Recalibrate in the same change and
check with `?dev`.

## Deploying

`tools/build.py` assembles `dist/`, which is the only thing ever published —
publishing the repo root would upload the source art and the tooling. Netlify
runs that build itself; `netlify.toml` holds the publish directory, the cache
headers and one redirect.

```sh
python3 tools/build.py && python3 tools/serve.py --dir dist   # preview the build
```

Previewing is not paranoia: `build.py` renames pages and filters assets, so a
scene that works at the repo root can still 404 in `dist/`. Art, depth tuning,
hotspots and particles are all judged by eye — no diff here can be reviewed by
reading it.

## Layout

```
compare.html      the scene switcher; deploys as /
index.html        single-scene build; deploys as /portfolio.html
netlify.toml      publish dir, redirect, cache headers
src/parallax.js   the engine - displaced plane, camera dolly, projection
src/particles.js  dust + birds; src/pan.js touch drag and edge arrows
src/scenes.js     per-scene tables; src/content.js all prose and thumbnails
src/hotspots.js   hotspot boxes; src/ui.js drawer; src/editor.js the ?edit tool
tools/            build, depth, encode, icon, thumbs, serve + the art prompts
vendor/three/     pinned three.js (three.module.js AND three.core.js - the
                  module statically imports the core, so both are required)
assets/           served WebPs, styles, favicon set
```

## Status

The engine, the particle layer and three depth-tuned scenes are done. Known
gaps: a canvas is invisible to crawlers, so search-engine output is a
placeholder; the scene switcher is still the homepage while a scene is being
chosen. A separate experiment — real geometry with movable lights instead of a
displaced plane — is in progress and deliberately not in this repo yet.

## Reusing this

The code is yours to learn from and adapt. The written content in
`src/content.js`, the generated artwork in `assets/`, and the photographs in
`assets/thumbs/` are Avijit Thawani's own and are not offered for reuse — if you
build on this, replace them with yours.
