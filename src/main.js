import { createParallax } from './parallax.js';
import { addParticles } from './particles.js';
import { mountPan } from './pan.js';
import { SECTIONS } from './content.js';
import { sceneById } from './scenes.js';
import { createUI, showFallback, mountChrome } from './ui.js';
import { mountEditor } from './editor.js';

// Tells the watchdog in index.html that the module graph resolved, so it must
// not swap in the text fallback.
window.__roomStarted = true;

const params = new URLSearchParams(location.search);
const EDIT = params.has('edit');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPhone = () => matchMedia('(max-width: 620px)').matches;
const scene = sceneById('benaras');
document.documentElement.style.setProperty('--depth-map', `url('assets/${scene.id}-depth.webp')`);

const px = createParallax(document.getElementById('app'), {
  colorURL: `assets/${scene.id}.webp`,
  depthURL: `assets/${scene.id}-depth.webp`,
  strength: reduceMotion ? 0.006 : 0.018,
});

if (!px.ok) {
  showFallback('WebGL unavailable');
  throw px.error;
}

// Skipped under prefers-reduced-motion: this is the one thing on the page that
// moves with nobody touching it, which is precisely what that setting is for.
if (!reduceMotion) addParticles(px, scene.particles);

const ui = createUI({ onClose: () => px.zoomOut() });
const layer = document.getElementById('hotspots');

const hotspots = scene.hotspots.map((h) => ({
  ...h,
  label: h.label ?? SECTIONS[h.section]?.title ?? h.section,
}));

const spots = hotspots.map((h) => {
  const el = document.createElement('button');
  el.className = 'hotspot';
  el.type = 'button';
  el.dataset.section = h.section;
  el.setAttribute('aria-label', h.label);

  el.addEventListener('click', (e) => {
    if (EDIT) return; // in calibration mode boxes are draggable, not clickable
    ui.tooltip(null);
    px.zoomTo(h.x + h.w / 2, h.y + h.h / 2);
    // Open opposite the click so the panel never covers what you just touched.
    // Phones get a sheet on the opposite vertical half; desktop a side drawer.
    const side = isPhone()
      ? (e.clientY < innerHeight / 2 ? 'bottom' : 'top')
      : (e.clientX > innerWidth / 2 ? 'left' : 'right');
    ui.open(h.section, side);
  });

  const hover = (e) => { if (!EDIT && !ui.isOpen()) ui.tooltip(h.label, e.clientX, e.clientY); };
  el.addEventListener('pointerenter', hover);
  el.addEventListener('pointermove', hover);
  el.addEventListener('pointerleave', () => ui.tooltip(null));

  layer.appendChild(el);
  return { h, el };
});

mountChrome({ ui, px, spots, isPhone });

function layoutHotspots() {
  const r = px.coverRect();
  for (const { h, el } of spots) {
    el.style.left = `${r.x + h.x * r.w}px`;
    el.style.top = `${r.y + h.y * r.h}px`;
    el.style.width = `${h.w * r.w}px`;
    el.style.height = `${h.h * r.h}px`;
  }
}

// coverRect() is exact only while the camera is resting. Once zoom or pan
// moves the camera, project every image-space box through that live camera;
// otherwise the artwork dollies away while its HTML target stays behind.
function projectHotspots() {
  for (const { h, el } of spots) {
    const r = px.projectImageRect(h);
    if (![r.x, r.y, r.w, r.h].every(Number.isFinite)) continue;
    el.style.left = `${r.x}px`;
    el.style.top = `${r.y}px`;
    el.style.width = `${r.w}px`;
    el.style.height = `${r.h}px`;
  }
}
addEventListener('resize', layoutHotspots);
layoutHotspots();

addEventListener('pointermove', (e) => {
  px.setPointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
});

// Touch drag, flick inertia and the edge arrows, shared with compare.html.
const { update: updateArrows } = mountPan(px, () => EDIT || ui.isOpen());

// Debug: 'd' shows the raw depth map, to check silhouettes line up with the art.
addEventListener('keydown', (e) => {
  if (e.key === 'd') document.body.classList.toggle('show-depth');
});

if (EDIT) mountEditor({ spots, px, layoutHotspots, hotspots });

let t0 = null;
function tick(now) {
  requestAnimationFrame(tick);
  if (t0 === null) t0 = now;
  px.render((now - t0) / 1000);
  projectHotspots();
  updateArrows();
}
requestAnimationFrame(tick);

px.onReady(() => { layoutHotspots(); ui.loadingDone(); });

// Handle for poking at the engine from the console while prototyping.
window.__room = { px, ui, spots, scene, layoutHotspots, updateArrows };
