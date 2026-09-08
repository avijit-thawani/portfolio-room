// Candidate scenes for compare.html, each with its own hotspot table.
//
// Same sections, different rooms. The point of having four of these is to find
// out which illustration makes the sections *findable* - the engine works on all
// of them, so the decision is about whether a stranger can look at the picture
// and guess that the typewriter opens the writing section.
//
// Boxes are image fractions exactly as in hotspots.js: x,y is the top-left
// corner with y measured down, w,h the size. Calibrate the same way too - open
// compare.html?edit&scene=<id>, drag, and the corrected array lands on your
// clipboard.
//
// Because they are fractions and not anchors, regenerating a scene's art leaves
// the table quietly pointing at where the old objects were. Varanasi shipped
// that way once: the art moved the chalkboard right by 13% of frame width and
// the Research box stayed put, so it highlighted empty parapet. Recalibrate in
// the same commit as new art, and confirm with `?dev` before shipping.
//
// The object set has moved twice. First round: the telescope became a board of
// diagrams (the research is tokenization, not astronomy) and the notebook became
// a typewriter. Second round, once the boards were on screen: the whiteboard went
// green, because a white panel flares under any strong light and the depth model
// reads the flare as geometry; and the theatre mask went back to a mic on a stool,
// because a mask on a pole reads as a lollipop at the size it actually renders.
//
// `about`, `labs` and `contact` have no object in the newer scenes on purpose -
// labs folds into research, contact is persistent UI, and about was cut rather
// than given a portrait on the wall nobody would think to click. Benaras tried
// giving `about` a figure at the parapet, seen from behind. It was rejected on
// sight: a room full of objects reads as someone's things, and the moment you
// put the person in it, it stops being a room you are looking around and starts
// being a portrait you are looking at. Leave the host out of the frame.

import { HOTSPOTS } from './hotspots.js';

export const SCENES = [
  {
    id: 'nyc-balanced',
    label: 'NYC',
    deploy: true,
    title: 'Brooklyn rooftop, midday',
    note: 'Balanced rooftop arc against a restrained modern skyline.',
    depthArgs: '--far 0.38 --flat 0.51,0.19,0.76,0.48,0.08 --flat 0.35,0.58,0.46,0.70,0.55 --band 0.45,0.95',
    // Midday, so the birds are far fewer and higher than the sunset scene.
    particles: { kind: 'birds', count: 11, band: [0.03, 0.17], opacity: 0.5 },
    hotspots: [
      { section: 'reading',  x: 0.075, y: 0.640, w: 0.120, h: 0.105 },
      { section: 'film',     x: 0.128, y: 0.300, w: 0.105, h: 0.290 },
      { section: 'making',   x: 0.245, y: 0.335, w: 0.185, h: 0.245 },
      { section: 'research', x: 0.515, y: 0.275, w: 0.240, h: 0.230 },
      { section: 'build',    x: 0.350, y: 0.575, w: 0.115, h: 0.145 },
      { section: 'labs',     x: 0.365, y: 0.700, w: 0.140, h: 0.225 },
      { section: 'writing',  x: 0.565, y: 0.655, w: 0.140, h: 0.225 },
      { section: 'stage',    x: 0.765, y: 0.545, w: 0.098, h: 0.220 },
      { section: 'travel',   x: 0.845, y: 0.355, w: 0.105, h: 0.420 },
    ],
  },
  {
    id: 'benaras',
    label: 'Benaras',
    deploy: true,
    title: 'Benaras rooftop, sunset',
    note: 'Ghats at left, BHU canopy and temple beyond the rooftop.',
    depthArgs: '--far 0.38 --flat 0.46,0.19,0.69,0.45,0.08 --flat 0.19,0.56,0.31,0.69,0.55 --band 0.45,0.95',
    // The art already has kites pinned in this band, so live birds crossing it
    // reads as the same evening rather than as an effect bolted on top.
    particles: { kind: 'birds', count: 15, band: [0.04, 0.22] },
    hotspots: [
      { section: 'reading',  x: 0.088, y: 0.590, w: 0.135, h: 0.100 },
      { section: 'film',     x: 0.105, y: 0.265, w: 0.105, h: 0.330 },
      { section: 'making',   x: 0.355, y: 0.190, w: 0.180, h: 0.335 },
      { section: 'research', x: 0.580, y: 0.205, w: 0.245, h: 0.245 },
      { section: 'build',    x: 0.235, y: 0.525, w: 0.100, h: 0.135 },
      { section: 'labs',     x: 0.240, y: 0.720, w: 0.140, h: 0.210 },
      { section: 'writing',  x: 0.445, y: 0.615, w: 0.130, h: 0.180 },
      { section: 'stage',    x: 0.745, y: 0.605, w: 0.110, h: 0.230 },
      { section: 'travel',   x: 0.845, y: 0.385, w: 0.100, h: 0.400 },
    ],
  },
  {
    id: 'garage-steampunk',
    label: 'Steampunk',
    title: 'Steampunk garage',
    note: 'Arched window at the left, warm brass and oxblood.',
    depthArgs: '--far 0.28 --flat 0.0,0.02,0.105,0.62,0.0',
    particles: { kind: 'dust', count: 170, band: [0.0, 0.70] },
    hotspots: [
      { section: 'reading',  x: 0.112, y: 0.205, w: 0.135, h: 0.565 },
      { section: 'film',     x: 0.246, y: 0.425, w: 0.072, h: 0.345 },
      { section: 'making',   x: 0.332, y: 0.195, w: 0.185, h: 0.415 },
      { section: 'research', x: 0.527, y: 0.325, w: 0.120, h: 0.245 },
      { section: 'build',    x: 0.655, y: 0.450, w: 0.080, h: 0.140 },
      { section: 'writing',  x: 0.704, y: 0.580, w: 0.058, h: 0.048 },
      { section: 'stage',    x: 0.758, y: 0.405, w: 0.042, h: 0.115 },
      { section: 'travel',   x: 0.814, y: 0.415, w: 0.092, h: 0.190 },
      { section: 'about',    x: 0.800, y: 0.600, w: 0.145, h: 0.195 },
    ],
  },
  {
    id: 'room-studio',
    label: 'Room',
    deploy: true,
    title: 'Study room, corner + skylight',
    note: 'Eight objects, overhead light, floor used instead of a crowded desk.',
    // No --far: this interior has no real distance, and the rooftop threshold
    // swallowed the whole back wall. The chalkboard and the map look like they
    // need --flat and do not - their spread is the side walls' honest
    // perspective ramp. The camera did: it read at 0.00, level with the corner
    // it stands a metre in front of, so it and the shelf are lifted by hand.
    depthArgs: '--flat 0.379,0.505,0.562,0.690,0.22 --flat 0.415,0.360,0.475,0.505,0.30 --band 0.45,0.95',
    // Interior, so dust rather than sky. Kept to the upper two thirds: motes
    // only read as motes where there is light behind them, and the floor here
    // is the darkest part of the frame.
    particles: { kind: 'dust', count: 200, band: [0.0, 0.72] },
    hotspots: [
      { section: 'research', x: 0.028, y: 0.167, w: 0.336, h: 0.331 },
      { section: 'making',   x: 0.012, y: 0.485, w: 0.324, h: 0.215 },
      { section: 'film',     x: 0.405, y: 0.355, w: 0.080, h: 0.150 },
      { section: 'reading',  x: 0.379, y: 0.500, w: 0.183, h: 0.195 },
      { section: 'travel',   x: 0.650, y: 0.240, w: 0.315, h: 0.252 },
      { section: 'build',    x: 0.735, y: 0.515, w: 0.087, h: 0.070 },
      { section: 'writing',  x: 0.405, y: 0.712, w: 0.087, h: 0.163 },
      { section: 'stage',    x: 0.865, y: 0.575, w: 0.097, h: 0.345 },
    ],
  },
  {
    id: 'room',
    label: 'Current',
    title: 'The current room (baseline)',
    note: 'What is shipping today, with its calibrated boxes.',
    depthArgs: '(defaults)',
    hotspots: HOTSPOTS,
  },
];

export const sceneById = (id) => SCENES.find((s) => s.id === id) ?? SCENES[0];

// The three that go out on the public URL. Steampunk and the original room stay
// in the harness: they are still useful to compare against, but they carry an
// `about` section that the shortlist dropped, so shipping them would show
// visitors a section the other two scenes cannot open.
export const DEPLOYED = SCENES.filter((s) => s.deploy);
