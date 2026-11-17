import { SECTIONS, HERO } from './content.js';

const $ = (id) => document.getElementById(id);
const SIDES = ['left', 'right', 'top', 'bottom'];

export function createUI({ onClose } = {}) {
  const panel = $('panel');
  const backdrop = $('backdrop');
  const titleEl = $('panel-title');
  const tagEl = $('panel-tag');
  const bodyEl = $('panel-body');
  const tip = $('tooltip');
  const loading = $('loading');

  let openKey = null;

  function open(key, side) {
    const section = SECTIONS[key];
    if (!section) return;
    openKey = key;
    titleEl.textContent = section.title;
    tagEl.textContent = section.tagline || '';
    bodyEl.innerHTML = section.body;
    // The cards need room for two columns; every other section is prose and
    // reads better narrow.
    panel.classList.toggle('wide', key === 'build');
    panel.scrollTop = 0;

    // Snap to the target edge without animating, so the panel always slides
    // straight in from that edge instead of sweeping across from the last one.
    const current = SIDES.find((s) => panel.classList.contains(s));
    if (current && current !== side) {
      panel.style.transition = 'none';
      panel.classList.remove(...SIDES);
      panel.classList.add(side);
      void panel.offsetWidth; // force reflow before restoring the transition
      panel.style.transition = '';
    } else {
      panel.classList.remove(...SIDES);
      panel.classList.add(side);
    }

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('show');
    document.body.classList.add('panel-open');
  }

  function close() {
    if (!openKey) return;
    openKey = null;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('show');
    document.body.classList.remove('panel-open');
    onClose && onClose();
  }

  function tooltip(label, x, y) {
    if (!label) { tip.classList.remove('show'); return; }
    tip.textContent = label;
    tip.style.transform = `translate(${x + 16}px, ${y + 16}px)`;
    tip.classList.add('show');
  }

  $('panel-close').addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  return {
    open, close, tooltip,
    isOpen: () => !!openKey,
    loadingDone: () => loading.classList.add('hide'),
  };
}

// The parts of the page that say what it is without anyone having to hover:
// a name plate, a nav with Projects and Contact, and a resting label on every
// hotspot. Before this the homepage was an unlabelled picture - the objects only
// lit up under a pointer, which a phone does not have, and the one section a
// visitor is most likely to want (projects) sat behind the smallest object.
// Shared by both pages so the homepage and /portfolio.html cannot drift.
export function mountChrome({ ui, px, spots, isPhone, brand = true }) {
  for (const { h, el } of spots) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = SECTIONS[h.section]?.chip ?? h.label;
    el.appendChild(chip);
  }

  if (brand) {
    const plate = document.createElement('div');
    plate.id = 'brand';
    plate.innerHTML = `<strong></strong><span></span>`;
    plate.firstChild.textContent = HERO.name;
    plate.lastChild.textContent = HERO.tagline;
    document.body.appendChild(plate);
  }

  // Opening from the nav zooms to the section's object when the scene has one,
  // so the button teaches where the section lives instead of bypassing the room.
  const openSection = (key) => {
    if (ui.isOpen()) return;
    ui.tooltip(null);
    const spot = spots.find((s) => s.h.section === key);
    let side = isPhone() ? 'bottom' : 'right';
    if (spot) {
      const r = spot.el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      side = isPhone() ? (cy < innerHeight / 2 ? 'bottom' : 'top')
                       : (cx > innerWidth / 2 ? 'left' : 'right');
      px.zoomTo(spot.h.x + spot.h.w / 2, spot.h.y + spot.h.h / 2);
    }
    ui.open(key, side);
  };

  const nav = document.createElement('nav');
  nav.id = 'nav';
  for (const [key, text, cls] of [['build', 'Projects', 'primary'], ['contact', 'Contact', '']]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    if (cls) b.className = cls;
    b.addEventListener('click', () => openSection(key));
    nav.appendChild(b);
  }
  document.body.appendChild(nav);
  return { openSection };
}

// No WebGL? Render every section as plain text rather than showing nothing.
export function showFallback(reason) {
  const wrap = document.createElement('div');
  wrap.className = 'fallback';
  wrap.innerHTML = `<div class="fallback-inner">
      <h1>Avijit Thawani</h1>
      <p class="muted">This browser couldn\u2019t start the room${reason ? ` (${reason})` : ''},
      so here is everything as plain text.</p>
      ${Object.values(SECTIONS).map((s) => `<section><h2>${s.title}</h2>${s.body}</section>`).join('')}
    </div>`;
  document.body.appendChild(wrap);
  $('loading')?.classList.add('hide');
}
