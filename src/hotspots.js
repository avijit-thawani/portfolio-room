// Clickable regions over the illustration.
//
// Coordinates are fractions of the IMAGE, not the viewport: x,y is the top-left
// corner (y measured down from the top) and w,h the size. That way they survive
// any window size, and the cover-fit maths in parallax.js puts them back on the
// right object.
//
// Every section in content.js has an object here, and the illustration was drawn
// around this list rather than the other way round.
//
// These values are eyeballed from the art. Do NOT hand-tune them: open the page
// with ?edit, drag each box onto its object, and the corrected array is copied
// to your clipboard to paste over the list below.
//
// Ordered left to right across the room, which is also roughly the order the
// three zones read in: tinkerer (bookshelf, workbench), researcher (whiteboard,
// desk), storyteller (typewriter, map, mic).

export const HOTSPOTS = [
  { section: 'reading',  label: 'Reading & learning',  x: 0.076, y: 0.073, w: 0.138, h: 0.678 },
  { section: 'film',     label: 'Film',                x: 0.140, y: 0.262, w: 0.039, h: 0.044 },
  { section: 'making',   label: 'Making things',       x: 0.226, y: 0.339, w: 0.128, h: 0.229 },
  { section: 'research', label: 'Research',            x: 0.397, y: 0.101, w: 0.244, h: 0.275 },
  { section: 'build',    label: 'Things I build',      x: 0.480, y: 0.403, w: 0.116, h: 0.124 },
  { section: 'writing',  label: 'Writing',             x: 0.629, y: 0.467, w: 0.067, h: 0.082 },
  { section: 'about',    label: 'About me',            x: 0.672, y: 0.165, w: 0.049, h: 0.119 },
  { section: 'contact',  label: 'Contact',             x: 0.733, y: 0.504, w: 0.049, h: 0.055 },
  { section: 'travel',   label: 'Travel',              x: 0.745, y: 0.101, w: 0.226, h: 0.247 },
  { section: 'labs',     label: 'Where I\u2019ve worked', x: 0.763, y: 0.385, w: 0.128, h: 0.165 },
  { section: 'stage',    label: 'On stage',            x: 0.922, y: 0.375, w: 0.043, h: 0.376 },
];
