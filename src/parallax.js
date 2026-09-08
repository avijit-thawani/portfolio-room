import * as THREE from 'three';

// A flat illustration made to feel like a room you can lean into.
//
// The image is a subdivided plane displaced along Z by a depth map (white =
// near) and viewed through a real PerspectiveCamera. Two separate effects ride
// on that:
//
//   1. Pointer sway - a per-pixel UV shift in the fragment shader, weighted by
//      depth. Resampling per pixel (rather than moving geometry) keeps object
//      silhouettes crisp; moving the mesh at rest smears them.
//   2. Zoom - the camera physically dollies toward a target point, and the
//      vertex displacement ramps in as it travels. At rest the plane is
//      perfectly flat, so there is no geometry to give the trick away.

const FOV = 38;             // vertical FOV, degrees. Higher = stronger perspective.
const SEG_X = 220;          // plane subdivisions; these vertices carry the depth
const SEG_Y = 140;
const DEPTH_SCALE = 0.18;   // displacement range in world units (plane height = 1)
const ZOOM_IN = 0.23;       // default dolly-in fraction of the resting distance
const POINTER_EASE = 0.06;
const FOCUS_EASE = 0.08;
const ZOOM_EASE = 0.06;
const PAN_EASE = 0.15;
const TAN_HALF_FOV = Math.tan((FOV * Math.PI / 180) / 2);

const VERT = /* glsl */ `
  precision highp float;
  uniform sampler2D uDepth;
  uniform float uDepthScale, uZoomAmt;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    float d = texture2D(uDepth, uv).r;
    vec3 p = position;
    // Scaled by uZoomAmt so the plane is flat until the camera starts moving.
    p.z += (d - 0.5) * uDepthScale * uZoomAmt;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uColor, uDepth;
  uniform float uStrength, uTime, uParallaxScale;
  uniform vec2 uPointer;
  void main() {
    float d = texture2D(uDepth, vUv).r;
    // A slow drift keeps the room breathing when the pointer is still.
    vec2 drift = vec2(sin(uTime * 0.25), cos(uTime * 0.20)) * 0.12;
    vec2 uv = vUv + (uPointer + drift) * uStrength * (d - 0.5) * uParallaxScale;
    gl_FragColor = vec4(texture2D(uColor, clamp(uv, 0.0, 1.0)).rgb, 1.0);
  }
`;

export function createParallax(container, opts) {
  const { colorURL, depthURL, aspect = 3 / 2, strength = 0.018 } = opts;

  // Mobile GPUs sometimes refuse the first context under memory pressure, so
  // fall back to cheaper settings before giving up on WebGL entirely.
  let renderer;
  for (const params of [
    { antialias: true, powerPreference: 'high-performance' },
    { antialias: false, powerPreference: 'default' },
  ]) {
    try {
      const r = new THREE.WebGLRenderer(params);
      if (!r.getContext()) throw new Error('no context');
      renderer = r;
      break;
    } catch (err) {
      renderer = null;
    }
  }
  if (!renderer) return { ok: false, error: new Error('WebGL unavailable') };

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);

  // Vertex texture fetch is universal on modern GPUs but optional in WebGL1.
  // Without it the plane stays flat and only the zoom survives.
  const canDisplace = renderer.capabilities.vertexTextures;

  // A mid-gray 1x1 stands in for the depth map. 0.5 means zero displacement and
  // zero pointer shift, so the room renders correctly the moment the color image
  // arrives and the depth can stream in a beat later.
  const grayDepth = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
  grayDepth.needsUpdate = true;

  const uniforms = {
    uColor: { value: null },
    uDepth: { value: grayDepth },
    uDepthScale: { value: canDisplace ? DEPTH_SCALE : 0 },
    uZoomAmt: { value: 0 },
    uStrength: { value: strength },
    uParallaxScale: { value: 1 },
    // Meshes grow on their own as the camera closes in; gl_PointSize is in raw
    // pixels and does not, so the particle layer multiplies by this to keep pace.
    uZoomScale: { value: 1 },
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uImageAspect: { value: aspect },
    uViewAspect: { value: 1 },
  };

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, SEG_X, SEG_Y),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG }),
  );
  mesh.scale.set(aspect, 1, 1);
  scene.add(mesh);

  const pointer = new THREE.Vector2(), pointerTarget = new THREE.Vector2();
  const focus = new THREE.Vector2(), focusTarget = new THREE.Vector2();
  let zoom = 0, zoomTarget = 0;
  let dolly = ZOOM_IN, dollyTarget = ZOOM_IN;
  let zoomEase = ZOOM_EASE;
  let restDist = 2;
  // Horizontal pan. On a portrait phone the room is wider than the viewport, so
  // cover-fit crops the sides off; dragging slides the camera across to reach
  // them. World-X offset, eased.
  let pan = 0, panTarget = 0, panEase = PAN_EASE;

  // Distance at which the camera frustum exactly covers the image at z = 0.
  function frame() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    const viewAspect = w / h, imgAspect = uniforms.uImageAspect.value;
    camera.aspect = viewAspect;
    camera.updateProjectionMatrix();
    uniforms.uViewAspect.value = viewAspect;
    // Cover-fit: if the viewport is wider than the image we are limited by width.
    const coverHeight = viewAspect > imgAspect ? imgAspect / viewAspect : 1;
    restDist = coverHeight / (2 * TAN_HALF_FOV);
    // Re-clamp: rotating portrait to landscape can remove the room to pan into.
    const limit = panLimit();
    panTarget = Math.min(limit, Math.max(-limit, panTarget));
  }

  // How far the camera can slide each way at rest before the frustum would
  // overhang the image. Zero unless the image is wider than the viewport.
  function panLimit() {
    const halfX = restDist * TAN_HALF_FOV * uniforms.uViewAspect.value;
    return Math.max(0, uniforms.uImageAspect.value / 2 - halfX);
  }
  // World units per screen pixel at rest, for 1:1 finger tracking.
  const worldPerPx = () =>
    (2 * restDist * TAN_HALF_FOV * uniforms.uViewAspect.value) / window.innerWidth;
  // `ease` of 1 makes the room track a finger exactly; the default lag reads as
  // the room struggling to keep up with the drag. Omit it for taps and glides.
  const setPan = (wx, ease) => {
    const limit = panLimit();
    panTarget = Math.min(limit, Math.max(-limit, wx));
    panEase = ease == null ? PAN_EASE : ease;
  };
  // Screen-px offset the panned content has slid by, so HTML hotspots can move
  // in lockstep. At rest the pan is a pure horizontal slide, so this is exact.
  const panShiftPx = () => -pan / worldPerPx();
  window.addEventListener('resize', frame);
  frame();

  const loader = new THREE.TextureLoader();
  let readyCb = null, isReady = false;

  const prep = (tex) => {
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  };

  loader.load(colorURL, (tex) => {
    prep(tex);
    if (tex.image) {
      uniforms.uImageAspect.value = tex.image.width / tex.image.height;
      mesh.scale.x = uniforms.uImageAspect.value;
      frame();
    }
    uniforms.uColor.value = tex;
    // Reveal on the color image alone; depth is an enhancement, not a gate.
    if (!isReady) { isReady = true; readyCb && readyCb(); }
  });
  // A CPU-side copy of the depth map, downsampled hard. The vertex shader pushes
  // each vertex to (d - 0.5) * scale * zoom, so anything that wants to know where
  // an object actually ended up on screen has to read the same d the GPU read.
  // 64x64 is plenty: hotspots average over a whole box, never a pixel.
  let depthData = null, depthW = 0, depthH = 0;
  function cacheDepth(image) {
    try {
      const c = document.createElement('canvas');
      depthW = c.width = 64;
      depthH = c.height = 64;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, depthW, depthH);
      depthData = ctx.getImageData(0, 0, depthW, depthH).data;
    } catch (err) {
      depthData = null;   // tainted canvas or no 2d context; fall back to flat
    }
  }

  // Mean depth over an image-space box, 0.5 (= no displacement) until loaded.
  function depthAt(box) {
    if (!depthData) return 0.5;
    const x0 = Math.max(0, Math.min(depthW - 1, Math.floor(box.x * depthW)));
    const x1 = Math.max(x0 + 1, Math.min(depthW, Math.ceil((box.x + box.w) * depthW)));
    const y0 = Math.max(0, Math.min(depthH - 1, Math.floor(box.y * depthH)));
    const y1 = Math.max(y0 + 1, Math.min(depthH, Math.ceil((box.y + box.h) * depthH)));
    let sum = 0, n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) { sum += depthData[(y * depthW + x) * 4]; n++; }
    }
    return n ? sum / n / 255 : 0.5;
  }

  loader.load(depthURL, (tex) => {
    uniforms.uDepth.value = prep(tex);
    if (tex.image) cacheDepth(tex.image);
  }, undefined, () => {});

  // Screen-space rect the image covers at rest, so HTML hotspots can be laid
  // out in image fractions and land on the right objects.
  function coverRect() {
    const W = window.innerWidth, H = window.innerHeight;
    const imgAspect = uniforms.uImageAspect.value;
    const w = W / H > imgAspect ? W : H * imgAspect;
    const h = W / H > imgAspect ? W / imgAspect : H;
    return { x: (W - w) / 2, y: (H - h) / 2, w, h };
  }

  // Project an image-space box (fractions, y measured down from the top) through
  // the live camera. Used to glue HTML onto an object so it tracks the dolly.
  //
  // Projecting at z = 0 is only right while the plane is flat. Once a zoom starts
  // the geometry displaces, and a box drawn on the flat plane drifts off the
  // object it is supposed to be on - worst on whatever the depth pass pinned
  // furthest back, which tends to be exactly the large flat panels people click.
  // So each box is projected at the z its own pixels get pushed to.
  const _v = new THREE.Vector3();
  const _depthCache = new WeakMap();
  function projectImageRect(box) {
    const imgAspect = uniforms.uImageAspect.value;
    const W = window.innerWidth, H = window.innerHeight;
    camera.updateMatrixWorld();

    let d = _depthCache.get(box);
    if (d === undefined || d === 0.5) {
      d = depthAt(box);
      if (depthData) _depthCache.set(box, d);
    }
    const z = (d - 0.5) * uniforms.uDepthScale.value * uniforms.uZoomAmt.value;

    const toPx = (wx, wy) => {
      _v.set(wx, wy, z).project(camera);
      return { x: (_v.x * 0.5 + 0.5) * W, y: (1 - (_v.y * 0.5 + 0.5)) * H };
    };
    const tl = toPx((box.x - 0.5) * imgAspect, 0.5 - box.y);
    const br = toPx((box.x + box.w - 0.5) * imgAspect, 0.5 - box.y - box.h);
    return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
  }

  const setPointer = (nx, ny) => pointerTarget.set(nx, ny);

  // Focus arrives in image fractions (y down); convert to plane world coords.
  const zoomTo = (fx, fy, depth = ZOOM_IN, ease = ZOOM_EASE) => {
    focusTarget.set((fx - 0.5) * uniforms.uImageAspect.value, 0.5 - fy);
    zoomTarget = 1;
    dollyTarget = depth;
    zoomEase = ease;
  };
  const zoomOut = () => {
    zoomTarget = 0;
    focusTarget.set(0, 0);
    dollyTarget = ZOOM_IN;
  };

  const _target = new THREE.Vector3();
  function render(seconds) {
    pointer.lerp(pointerTarget, POINTER_EASE);
    focus.lerp(focusTarget, FOCUS_EASE);
    zoom += (zoomTarget - zoom) * zoomEase;
    dolly += (dollyTarget - dolly) * zoomEase;

    uniforms.uPointer.value.copy(pointer);
    uniforms.uTime.value = seconds;
    uniforms.uZoomAmt.value = zoom;
    // Ease the pointer sway out as we zoom in, so the two don't compete.
    uniforms.uParallaxScale.value = 1 - 0.7 * zoom;

    const camDist = restDist * (1 - dolly * zoom);
    uniforms.uZoomScale.value = restDist / camDist;
    // Clamp the focus so the shrinking frustum never slides off the plane and
    // reveals the void behind it. The limits loosen as we push in.
    const halfY = camDist * TAN_HALF_FOV;
    const halfX = halfY * uniforms.uViewAspect.value;
    const maxX = Math.max(0, uniforms.uImageAspect.value / 2 - halfX);
    const maxY = Math.max(0, 0.5 - halfY);
    pan += (panTarget - pan) * panEase;
    // Fade the pan out as a hotspot zoom takes over, so the two never fight
    // over where the camera is pointing.
    const x = Math.min(maxX, Math.max(-maxX, focus.x + pan * (1 - zoom)));
    const y = Math.min(maxY, Math.max(-maxY, focus.y));

    _target.set(x, y, 0);
    camera.position.set(x, y, camDist);
    camera.lookAt(_target);
    renderer.render(scene, camera);
  }

  return {
    ok: true, renderer, scene, uniforms,
    setPointer, zoomTo, zoomOut, zoomValue: () => zoom,
    coverRect, projectImageRect, depthAt, render,
    canPan: () => panLimit() > 0.002,
    panMax: panLimit, getPan: () => panTarget, setPan, worldPerPx, panShiftPx,
    onReady(cb) { readyCb = cb; if (isReady) cb(); },
  };
}
