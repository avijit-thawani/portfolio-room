import * as THREE from 'three';

// One `THREE.Points` overlay to stop the room being a photograph.
//
// A still illustration reads as a picture no matter how good the parallax is.
// Something has to move on its own, independent of the pointer, or the scene
// only ever feels alive while you are touching it. This is the cheapest thing
// that fixes that: a few hundred sprites, no extra textures, no second pass.
//
// Two kinds, because the rooftops and the interior need opposite things:
//
//   dust  - motes in the air, gated to wherever the illustration is already
//           bright, so they read as light catching them rather than as specks
//           pasted over the render. Near, so they drift with the pointer.
//   birds - dark silhouettes drifting across the sky, wings drawn procedurally
//           in the fragment shader and flapping. Far, so they hold still.
//
// The important part is the depth each sprite is given. Sprites live in the
// same world space as the plane and reuse the mesh's own parallax maths, so a
// depth near 0.5 means a bird gets essentially no pointer shift and no zoom
// displacement - which is what you want, because a bird half a mile out should
// not swing when the cursor moves. Dust sits near, so it does both. That is the
// whole reason this is not a CSS overlay: an overlay cannot know it is far away.

// Points are square, so the sprite is mostly empty and the alpha does the work.
const VERT = /* glsl */ `
  precision highp float;
  attribute float aSize, aSpeed, aDepth;
  uniform float uTime, uImageAspect, uPixelRatio, uZoomScale;
  uniform float uDepthScale, uZoomAmt, uStrength, uParallaxScale;
  uniform vec2 uPointer;
  varying float vSeed, vFade, vFlap;
  varying vec2 vAnchor;

  void main() {
    vec2 anchor = position.xy;      // resting position in image-uv
    float seed = position.z;
    vSeed = seed;
    float ph = seed * 6.2831;
    vec2 p = anchor;
    vFade = 1.0;

    #ifdef BIRDS
      // Drift right, wrap, and fade at both edges so the wrap never pops.
      p.x = fract(anchor.x + uTime * aSpeed * 0.006 + seed);
      p.y = anchor.y + 0.010 * sin(uTime * aSpeed * 0.35 + ph);
      vFade = smoothstep(0.0, 0.08, p.x) * (1.0 - smoothstep(0.90, 1.0, p.x));
      vFlap = sin(uTime * (2.2 + aSpeed * 0.5) + ph * 3.0);
    #else
      // Slow lissajous wander. Coprime-ish rates keep motes off a shared orbit.
      p += 0.035 * vec2(sin(uTime * aSpeed * 0.30 + ph),
                        cos(uTime * aSpeed * 0.23 + ph * 1.7));
      vFlap = 0.0;
    #endif

    // The same shift the image fragment shader applies, so a sprite tracks the
    // pixels behind it instead of sliding across them.
    vec2 drift = vec2(sin(uTime * 0.25), cos(uTime * 0.20)) * 0.12;
    p += (uPointer + drift) * uStrength * (aDepth - 0.5) * uParallaxScale;
    vAnchor = clamp(p, 0.0, 1.0);   // where to sample the illustration beneath

    // image-uv -> the plane's own world space, at the z the mesh would displace
    // this depth to. Far sprites barely move; near ones ride the dolly in.
    vec3 world = vec3((p.x - 0.5) * uImageAspect, 0.5 - p.y,
                      (aDepth - 0.5) * uDepthScale * uZoomAmt);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
    gl_PointSize = aSize * uPixelRatio * uZoomScale;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying float vSeed, vFade, vFlap;
  varying vec2 vAnchor;
  uniform float uTime, uOpacity;
  uniform vec3 uTint;
  uniform sampler2D uColor;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    p.y = -p.y;                     // gl_PointCoord runs down; the rest runs up

    #ifdef BIRDS
      // A bird at this size is two strokes. Drawing it beats a texture: the
      // wings can flap by changing one coefficient, and there is no atlas to
      // load, no mip to go soft at distance.
      float wing = abs(p.y - vFlap * 0.42 * abs(p.x) - 0.04);
      float taper = 0.070 * (1.0 - 0.65 * smoothstep(0.0, 0.42, abs(p.x)));
      float a = smoothstep(taper, taper * 0.2, wing)
              * (1.0 - smoothstep(0.30, 0.44, abs(p.x)));
    #else
      float a = smoothstep(1.0, 0.0, length(p) * 2.0);
      a *= 0.55 + 0.45 * sin(uTime * 0.9 + vSeed * 30.0);   // twinkle
      // Gate on the brightness of the illustration behind the mote. Ungated,
      // additive specks over a dark rug look like dead pixels rather than dust;
      // gated, they only show where there is light to catch, which is both what
      // dust does and free art direction - the layer finds the sunbeams itself.
      float lum = dot(texture2D(uColor, vAnchor).rgb, vec3(0.299, 0.587, 0.114));
      a *= smoothstep(0.34, 0.72, lum);
    #endif

    if (a < 0.004) discard;
    gl_FragColor = vec4(uTint, a * vFade * uOpacity);
  }
`;

// ── Clouds ───────────────────────────────────────────────────────────────────
// Quads rather than point sprites, unlike dust and birds. A point is square and
// `gl_PointSize` is capped by the driver - some report a maximum of 63 - which
// is fine for a bird a few pixels across and useless for a cloud that wants to
// be a third of the frame wide and much wider than it is tall. So each cloud is
// two triangles, sized in image-uv, and the shape is carved out of the quad by
// the fragment shader.
//
// Being quads also means they can be big and soft without costing anything: the
// whole layer is a dozen clouds, 72 vertices.
const CLOUD_VERT = /* glsl */ `
  precision highp float;
  attribute vec2 aSize;                 // half-extent in image-uv
  attribute vec2 aAnchor;
  attribute float aSeed, aSpeed, aDepth;
  uniform float uTime, uImageAspect, uDepthScale, uZoomAmt;
  uniform float uStrength, uParallaxScale;
  uniform vec2 uPointer;
  varying vec2 vLocal;
  varying float vSeed, vFade;

  void main() {
    vLocal = position.xy + 0.5;         // 0..1 across the quad, for the shape
    vSeed = aSeed;

    vec2 c = aAnchor;
    c.x = fract(aAnchor.x + uTime * aSpeed * 0.004 + aSeed);
    c.y = aAnchor.y + 0.006 * sin(uTime * aSpeed * 0.2 + aSeed * 6.2831);
    // Fade at both edges so the wrap is never visible as a pop.
    vFade = smoothstep(0.0, 0.14, c.x) * (1.0 - smoothstep(0.86, 1.0, c.x));

    vec2 drift = vec2(sin(uTime * 0.25), cos(uTime * 0.20)) * 0.12;
    c += (uPointer + drift) * uStrength * (aDepth - 0.5) * uParallaxScale;

    vec2 uv = c + position.xy * aSize * 2.0;
    vec3 world = vec3((uv.x - 0.5) * uImageAspect, 0.5 - uv.y,
                      (aDepth - 0.5) * uDepthScale * uZoomAmt);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`;

const CLOUD_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vLocal;
  varying float vSeed, vFade;
  uniform float uTime, uOpacity, uSoft;
  uniform vec3 uTint;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // Four octaves is the point where the outline stops reading as a blob and
  // starts reading as cauliflower, which is what a cumulus edge actually is.
  float fbm(vec2 p){
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return s;
  }

  void main() {
    vec2 q = (vLocal - 0.5) * 2.0;
    // Squashed radius: clouds are flat-bottomed and wide, not circular.
    float d = length(vec2(q.x, q.y * 1.45));
    // Drifting the noise slowly makes the silhouette boil, so a cloud that sits
    // on screen for a minute is never twice the same shape.
    vec2 np = vLocal * 3.4 + vec2(vSeed * 31.7, vSeed * 11.3) + uTime * 0.012;
    float n = fbm(np);
    float a = smoothstep(1.0, uSoft, d + (n - 0.5) * 0.95);
    a *= 0.55 + 0.45 * n;               // thinner where the noise thins
    if (a < 0.004) discard;
    gl_FragColor = vec4(uTint, a * vFade * uOpacity);
  }
`;

// Sizes are CSS pixels, not device pixels - the vertex shader multiplies by the
// pixel ratio. Getting that backwards makes the layer vanish on a retina screen,
// which is exactly how it looked the first time. Clouds are the exception: they
// are quads, so their size is in image fractions and resolution-independent.
const DEFAULTS = {
  dust:  { count: 220, size: [3.5, 10.0], speed: [0.3, 1.0], depth: [0.62, 0.92],
           band: [0.0, 1.0], tint: [1.0, 0.95, 0.84], opacity: 0.62 },
  // Birds sit at 0.45 on purpose: that is the value `--band` pins the sky and
  // the far distance to, so they inherit the background's total lack of sway.
  birds: { count: 16, size: [13.0, 30.0], speed: [0.6, 1.6], depth: [0.45, 0.47],
           band: [0.04, 0.30], tint: [0.16, 0.13, 0.12], opacity: 0.72 },
  // `width` is a fraction of image width; height follows from `squash`. Same far
  // depth as the birds, for the same reason.
  clouds: { count: 12, width: [0.14, 0.40], squash: 0.42, speed: [0.5, 1.5],
            depth: [0.45, 0.47], band: [0.05, 0.26], tint: [1.0, 0.99, 0.97],
            opacity: 0.5, soft: 0.25 },
};

/** Attach a particle layer to a live parallax instance. Returns a disposer. */
export function addParticles(px, spec) {
  if (!spec || !px?.ok) return () => {};
  const kind = DEFAULTS[spec.kind] ? spec.kind : 'dust';
  const cfg = { ...DEFAULTS[kind], ...spec };

  // A fixed seed keeps the layout identical across reloads, which matters when
  // you are staring at two scenes deciding whether one looks busier.
  let s = 0x9e3779b9;
  const rnd = () => (((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296));
  const lerp = ([lo, hi]) => lo + rnd() * (hi - lo);

  const u = px.uniforms;
  const shared = {
    uTime: u.uTime, uPointer: u.uPointer, uStrength: u.uStrength,
    uParallaxScale: u.uParallaxScale, uImageAspect: u.uImageAspect,
    uDepthScale: u.uDepthScale, uZoomAmt: u.uZoomAmt,
  };

  const attach = (obj) => {
    obj.frustumCulled = false;   // anchors are pre-motion, so the bounding box lies
    obj.renderOrder = 1;
    px.scene.add(obj);
    return () => {
      px.scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    };
  };

  if (kind === 'clouds') {
    const n = cfg.count;
    // Two triangles per cloud, written out flat. Instancing would save a few
    // hundred bytes on a dozen quads and cost a WebGL1 extension check.
    const CORNERS = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5],
                     [-0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
    const V = n * 6;
    const pos = new Float32Array(V * 3);
    const anchor = new Float32Array(V * 2);
    const size = new Float32Array(V * 2);
    const seed = new Float32Array(V);
    const speed = new Float32Array(V);
    const depth = new Float32Array(V);

    for (let i = 0; i < n; i++) {
      const w = lerp(cfg.width) / 2;          // half-extent, as the shader wants
      const h = w * cfg.squash;
      const a = [rnd(), lerp(cfg.band)];
      const sd = rnd(), sp = lerp(cfg.speed), dp = lerp(cfg.depth);
      for (let k = 0; k < 6; k++) {
        const v = i * 6 + k;
        pos[v * 3] = CORNERS[k][0];
        pos[v * 3 + 1] = CORNERS[k][1];
        anchor[v * 2] = a[0];
        anchor[v * 2 + 1] = a[1];
        size[v * 2] = w;
        size[v * 2 + 1] = h;
        seed[v] = sd;
        speed[v] = sp;
        depth[v] = dp;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aAnchor', new THREE.BufferAttribute(anchor, 2));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 2));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
    geo.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));

    return attach(new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: {
        ...shared,
        uTint: { value: new THREE.Color(...cfg.tint) },
        uOpacity: { value: cfg.opacity },
        uSoft: { value: cfg.soft },
      },
      vertexShader: CLOUD_VERT,
      fragmentShader: CLOUD_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    })));
  }

  const n = cfg.count;
  const pos = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const speed = new Float32Array(n);
  const depth = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = rnd();
    pos[i * 3 + 1] = lerp(cfg.band);
    pos[i * 3 + 2] = rnd();          // per-sprite seed, ridden as position.z
    // Squared so most sprites are small and a few carry the layer; a uniform
    // spread reads as a texture rather than as depth.
    size[i] = cfg.size[0] + (cfg.size[1] - cfg.size[0]) * rnd() ** 2;
    speed[i] = lerp(cfg.speed);
    depth[i] = lerp(cfg.depth);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));

  const mat = new THREE.ShaderMaterial({
    // Aliased on purpose: these are the *same* uniform objects the mesh uses,
    // so the layer cannot drift out of step with the image it sits on.
    uniforms: {
      uTime: u.uTime, uPointer: u.uPointer, uStrength: u.uStrength,
      uParallaxScale: u.uParallaxScale, uImageAspect: u.uImageAspect,
      uDepthScale: u.uDepthScale, uZoomAmt: u.uZoomAmt, uZoomScale: u.uZoomScale,
      uColor: u.uColor,
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uTint: { value: new THREE.Color(...cfg.tint) },
      uOpacity: { value: cfg.opacity },
    },
    defines: kind === 'birds' ? { BIRDS: '' } : {},
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    // Dust is light, so it adds; a bird is an absence of light, so it does not.
    blending: kind === 'birds' ? THREE.NormalBlending : THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;   // anchors are pre-motion, so the box lies
  points.renderOrder = 1;
  px.scene.add(points);

  return () => {
    px.scene.remove(points);
    geo.dispose();
    mat.dispose();
  };
}
