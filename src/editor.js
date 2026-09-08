// Hotspot calibration, reachable at ?edit.
//
// Placing boxes over an illustration by editing numbers is miserable, and you
// have to redo it every time the art changes. So: drag a box to move it, drag a
// handle to resize, and on release the whole corrected array lands on your
// clipboard ready to paste over src/hotspots.js.

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function mountEditor({ spots, px, layoutHotspots, hotspots }) {
  document.body.classList.add('edit');

  const readout = document.createElement('div');
  readout.id = 'readout';
  readout.textContent = 'EDIT \u2014 drag a box to move, a handle to resize. Release copies all boxes.';
  document.body.appendChild(readout);

  const serialize = () =>
    'export const HOTSPOTS = [\n' +
    hotspots.map((h) =>
      `  { section: '${h.section}', label: '${h.label.replace(/'/g, "\\'")}', ` +
      `x: ${h.x.toFixed(3)}, y: ${h.y.toFixed(3)}, ` +
      `w: ${h.w.toFixed(3)}, h: ${h.h.toFixed(3)} },`).join('\n') +
    '\n];';

  for (const { el } of spots) {
    for (const dir of HANDLES) {
      const handle = document.createElement('span');
      handle.className = `handle handle-${dir}`;
      handle.dataset.dir = dir;
      el.appendChild(handle);
    }
  }

  // Screen px -> image fractions, so a drag reads in the same units we store.
  const toImage = (cx, cy) => {
    const r = px.coverRect();
    return { x: (cx - r.x) / r.w, y: (cy - r.y) / r.h };
  };

  let drag = null;

  const onMove = (e) => {
    if (!drag) return;
    const p = toImage(e.clientX, e.clientY);
    const b = drag.box;
    let [x0, y0, x1, y1] = [b.x, b.y, b.x + b.w, b.y + b.h];

    if (drag.mode === 'move') {
      const dx = p.x - drag.start.x, dy = p.y - drag.start.y;
      x0 += dx; x1 += dx; y0 += dy; y1 += dy;
    } else {
      if (drag.mode.includes('w')) x0 = p.x;
      if (drag.mode.includes('e')) x1 = p.x;
      if (drag.mode.includes('n')) y0 = p.y;
      if (drag.mode.includes('s')) y1 = p.y;
    }

    // Normalize so dragging a handle past the opposite edge doesn't invert.
    const x = clamp01(Math.min(x0, x1)), y = clamp01(Math.min(y0, y1));
    Object.assign(drag.h, {
      x, y,
      w: Math.max(0.01, clamp01(Math.max(x0, x1)) - x),
      h: Math.max(0.01, clamp01(Math.max(y0, y1)) - y),
    });
    layoutHotspots();
    const { section, x: hx, y: hy, w, h } = drag.h;
    readout.textContent =
      `${section}  x ${hx.toFixed(3)}  y ${hy.toFixed(3)}  w ${w.toFixed(3)}  h ${h.toFixed(3)}`;
  };

  const onUp = () => {
    removeEventListener('pointermove', onMove);
    if (drag) {
      navigator.clipboard?.writeText(serialize()).catch(() => {});
      readout.textContent = `Copied all ${hotspots.length} boxes \u2014 paste into src/hotspots.js`;
    }
    drag = null;
  };

  for (const { h, el } of spots) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      drag = {
        h,
        mode: e.target.dataset?.dir || 'move',
        start: toImage(e.clientX, e.clientY),
        box: { x: h.x, y: h.y, w: h.w, h: h.h },
      };
      addEventListener('pointermove', onMove);
      addEventListener('pointerup', onUp, { once: true });
    });
  }
}
