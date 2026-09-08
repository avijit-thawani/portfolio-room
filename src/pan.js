// Everything that lets you reach the parts of the room the viewport crops off.
//
// This lived inside main.js until compare.html became the published homepage,
// at which point the phone lost all of it in one commit: the switcher only ever
// had arrow *keys*, which is no help without a keyboard. Cover-fit on a portrait
// phone shows barely a third of a 3:2 image, so with no drag and no on-screen
// arrows the site renders a narrow slice of a room with no way out of it. That
// is the whole bug, and the fix is that both pages now mount the same thing.

const DRAG_SLOP = 8;     // px of movement before a touch counts as a pan, not a tap
const MAX_VEL = 4;       // px/ms, so a violent flick cannot fling the room away
const DECAY = 0.995;     // per ms, applied as pow(DECAY, dt) to stay frame-rate independent

/**
 * @param px       live parallax instance
 * @param blocked  () => true while something else owns the gesture (drawer, editor)
 * @returns {{ update: () => void }} call `update` once per frame
 */
export function mountPan(px, blocked = () => false) {
  let touch = null;
  let swallowClick = false;
  let glideRaf = null;

  addEventListener('touchstart', (e) => {
    if (glideRaf) { cancelAnimationFrame(glideRaf); glideRaf = null; } // grabbing stops the glide
    if (blocked() || !px.canPan() || e.touches.length !== 1) return;
    const t = e.touches[0];
    touch = {
      x0: t.clientX, y0: t.clientY, pan0: px.getPan(), moved: false,
      xLast: t.clientX, tLast: performance.now(), vel: 0, wx: px.getPan(),
    };
  }, { passive: true });

  addEventListener('touchmove', (e) => {
    if (!touch || e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const dx = x - touch.x0;
    if (!touch.moved && Math.hypot(dx, e.touches[0].clientY - touch.y0) < DRAG_SLOP) return;
    touch.moved = true;
    const now = performance.now(), dt = now - touch.tLast;
    if (dt > 0) { touch.vel = (x - touch.xLast) / dt; touch.xLast = x; touch.tLast = now; }
    touch.wx = touch.pan0 - dx * px.worldPerPx(); // drag right reveals the left
    px.setPan(touch.wx, 1);                       // 1:1 while the finger is down
  }, { passive: true });

  addEventListener('touchend', () => {
    if (touch && touch.moved) {
      // A drag ends over whatever hotspot the finger happens to be on top of, and
      // the browser will fire a click on it. Eat that one click.
      swallowClick = true;
      setTimeout(() => { swallowClick = false; }, 120);
      glide(touch.vel, touch.wx);
    }
    touch = null;
  });

  addEventListener('click', (e) => {
    if (swallowClick) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  // Flick inertia, so a quick swipe keeps travelling and decays instead of
  // stopping dead wherever the fingertip happened to lift.
  function glide(velPxPerMs, from) {
    let v = Math.max(-MAX_VEL, Math.min(MAX_VEL, velPxPerMs || 0));
    if (Math.abs(v) < 0.15) { px.setPan(from); return; } // a slow drag should just stop
    let wx = from, last = performance.now();
    const step = (now) => {
      const dt = Math.min(34, now - last);  // cap dt so a stalled frame cannot launch it
      last = now;
      wx -= v * dt * px.worldPerPx();
      const limit = px.panMax();
      if (wx <= -limit || wx >= limit) { wx = Math.min(limit, Math.max(-limit, wx)); v = 0; }
      v *= Math.pow(DECAY, dt);
      px.setPan(wx, 1);                     // easing here would read as a hitch
      glideRaf = Math.abs(v) > 0.02 ? requestAnimationFrame(step) : null;
    };
    glideRaf = requestAnimationFrame(step);
  }

  // Edge arrows hint that the room continues past the screen; each shows only
  // while there is still something to reveal on that side.
  const makeArrow = (dir, glyph, label) => {
    const b = document.createElement('button');
    b.className = `pan-arrow ${dir}`;
    b.type = 'button';
    b.textContent = glyph;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      px.setPan(px.getPan() + (dir === 'left' ? -1 : 1) * px.worldPerPx() * innerWidth * 0.6);
    });
    document.body.appendChild(b);
    return b;
  };
  const left = makeArrow('left', '\u2039', 'Look left');
  const right = makeArrow('right', '\u203a', 'Look right');

  function update() {
    // Gated on "is there anything to pan to", not on touch: a narrow desktop
    // window crops the sides off too, and a mouse user has no drag gesture, so
    // the arrows are their only way to reach the rest of the room.
    const on = !blocked() && px.canPan();
    const limit = px.panMax(), p = px.getPan(), eps = limit * 0.04 + 0.001;
    left.classList.toggle('show', on && p > -limit + eps);
    right.classList.toggle('show', on && p < limit - eps);
  }

  return { update };
}
