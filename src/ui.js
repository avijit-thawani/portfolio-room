import { SECTIONS } from './content.js';

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
  }

  function close() {
    if (!openKey) return;
    openKey = null;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('show');
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
