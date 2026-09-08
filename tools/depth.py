#!/usr/bin/env python3
"""Produce the depth map the parallax shader reads, white = near.

Prefers monocular depth estimation (Depth Anything V2). If torch/transformers
are missing it falls back to a crude synthetic gradient, which is enough to feel
the effect but not enough to ship: the fallback knows nothing about the objects
in the scene, so it cannot separate them from the wall.

    python tools/depth.py assets/room.png assets/room-depth.png
"""

import argparse
import sys

import numpy as np
from PIL import Image, ImageFilter

MODEL = "depth-anything/Depth-Anything-V2-Small-hf"


def estimate(img: Image.Image) -> np.ndarray:
    """Run Depth Anything V2. Returns float32 in 0..1, larger = nearer."""
    import torch
    from transformers import pipeline

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"loading {MODEL} on {device}", file=sys.stderr)
    pipe = pipeline("depth-estimation", model=MODEL, device=device)
    # The pipeline returns disparity: larger values are already nearer, which
    # matches the shader's white = near convention.
    depth = np.asarray(pipe(img)["depth"], dtype=np.float32)
    lo, hi = float(depth.min()), float(depth.max())
    return (depth - lo) / (hi - lo) if hi > lo else np.zeros_like(depth)


def autolevel(d: np.ndarray, clip: float) -> np.ndarray:
    """Stretch to full range, ignoring outlier pixels at either tail."""
    lo, hi = np.percentile(d, [clip, 100.0 - clip])
    if hi <= lo:
        return np.clip(d, 0.0, 1.0)
    return np.clip((d - lo) / (hi - lo), 0.0, 1.0)


def equalize(d: np.ndarray) -> np.ndarray:
    """Rank transform: replace each value by its position in the sorted order.

    Yields a perfectly uniform histogram, which maximises the *separation*
    between regions that the model packed into a narrow band.
    """
    flat = d.ravel()
    order = flat.argsort()
    ranks = np.empty(flat.size, dtype=np.float32)
    ranks[order] = np.arange(flat.size, dtype=np.float32)
    return (ranks / max(flat.size - 1, 1)).reshape(d.shape)


def posterize(d: np.ndarray, levels: int) -> np.ndarray:
    """Snap depth to discrete planes.

    An illustration is not a photograph: it genuinely has a wall plane, a floor
    plane, and objects standing at a few distances between them. The depth model
    reports a continuous field instead, complete with slow drifts across surfaces
    that should be perfectly flat - and expanding the range amplifies those
    drifts into blobs that ripple as the parallax shifts.

    Quantizing collapses each of those drifts onto one plane. Median filtering
    was the obvious alternative and is much worse: a window wide enough to
    swallow a blob also melts the object silhouettes the effect depends on.
    """
    if levels < 2:
        return d
    return np.round(d * (levels - 1)) / (levels - 1)


def compress_far(d: np.ndarray, thresh: float, band: float) -> np.ndarray:
    """Squash everything beyond `thresh` into a thin band at the far end.

    Scenes with a real distance in them - a skyline, a river, a treeline - break
    the room's assumptions. The model is right that a tower recedes, so it hands
    back a smooth ramp across the facade, and posterizing only terraces it. Then
    the vertex displacement pulls the top of the facade away from the bottom and
    every window grid visibly shears.

    The physical answer is that distant things have no parallax relative to each
    other. Collapsing them onto one plane costs nothing real and removes the
    shear entirely, while the near half of the range - parapet, floor, objects,
    the part the effect is actually about - keeps its full resolution.

    Piecewise-linear: [0, thresh) maps into [0, band), and [thresh, 1] stretches
    across the rest.
    """
    if thresh <= 0.0:
        return d
    far = d < thresh
    out = np.empty_like(d)
    out[far] = d[far] * (band / thresh)
    out[~far] = band + (d[~far] - thresh) * (1.0 - band) / (1.0 - thresh)
    return out


def band(d: np.ndarray, spec: str) -> np.ndarray:
    """Rescale the finished map into `lo,hi` instead of the full 0..1.

    Everything upstream of here is trying to *separate* regions, and it does that
    by spending the whole range. But the shader reads the same number twice: it is
    both the ordering of the planes and the distance between them, since the
    vertex displaces by `(d - 0.5) * DEPTH_SCALE`. A map that runs 0 to 1 asks for
    the full displacement, and the mesh is a continuous sheet - it cannot open a
    hole at a silhouette, so it stretches across it instead. That stretch is the
    smearing you see on the near objects once the camera dollies in.

    Narrowing the band keeps the ordering (near still reads nearer) and cuts the
    stretch proportionally. Putting the *floor* of the band near 0.5 rather than
    centring on it matters just as much: at 0.5 a vertex does not move at all, so
    the background stays pinned to the plane and only the foreground travels.
    Halving the range halves the tearing, and the effect barely reads as weaker
    because what sells the depth is the relative motion, not its absolute size.
    """
    lo, hi = (float(p) for p in spec.split(","))
    return lo + np.clip(d, 0.0, 1.0) * (hi - lo)


def flatten(d: np.ndarray, spec: str) -> np.ndarray:
    """Force an image-space rectangle to a single depth. `x0,y0,x1,y1[,value]`.

    The model reads brightness as a depth cue, which is fine for photographs and
    wrong for illustrations: a lit window, a skylight or a whiteboard is a flat
    bright shape, so it comes back both misplaced and noisy. A window reading
    *nearer* than the wall around it is the usual tell.

    A global threshold cannot fix that - push it far enough to catch the window
    and it swallows the furniture too - so this is the escape hatch. Coordinates
    are image fractions, matching hotspots.js. Omit the value to flatten the
    rectangle onto its own median, which kills the ripple but leaves it where
    the model put it.
    """
    parts = [float(p) for p in spec.split(",")]
    if not 4 <= len(parts) <= 5:
        raise ValueError(f"--flat wants x0,y0,x1,y1[,value], got {spec!r}")
    x0, y0, x1, y1 = parts[:4]
    h, w = d.shape
    sl = (slice(int(y0 * h), int(y1 * h)), slice(int(x0 * w), int(x1 * w)))
    if d[sl].size == 0:
        raise ValueError(f"--flat rectangle is empty: {spec!r}")
    value = parts[4] if len(parts) == 5 else float(np.median(d[sl]))
    d = d.copy()
    d[sl] = value
    return d


def shape(d: np.ndarray, strength: float, clip: float) -> np.ndarray:
    """Expand the mid-range the depth model compressed.

    Depth models spend most of their output range on the floor sweeping toward
    the camera, leaving the wall and the objects standing against it only a few
    values apart - so those objects barely separate from the wall when the
    parallax shifts. Full equalization fixes the separation but flattens the
    real geometry, so blend the two: `strength` picks the trade-off.
    """
    base = autolevel(d, clip)
    if strength <= 0:
        return base
    return np.clip((1.0 - strength) * base + strength * equalize(d), 0.0, 1.0)


def report(label: str, d: np.ndarray) -> None:
    pcts = np.percentile(d, [2, 25, 50, 75, 98])
    print(f"  {label:9} p2={pcts[0]:.2f} p25={pcts[1]:.2f} "
          f"p50={pcts[2]:.2f} p75={pcts[3]:.2f} p98={pcts[4]:.2f}", file=sys.stderr)


def synthetic(img: Image.Image) -> np.ndarray:
    """Geometry-only stand-in: the floor comes at you, the back wall recedes.

    Deliberately dumb. It encodes "lower in frame is nearer" plus a mild vignette
    for the side walls, and nothing about the actual contents of the room.
    """
    w, h = img.size
    ys = np.linspace(0.0, 1.0, h, dtype=np.float32)[:, None]
    xs = np.linspace(-1.0, 1.0, w, dtype=np.float32)[None, :]
    floor = np.clip((ys - 0.55) / 0.45, 0.0, 1.0) ** 0.8   # rises over the bottom half
    walls = (np.abs(xs) ** 2.2) * 0.35                      # edges lean toward the viewer
    return np.clip(0.30 + floor * 0.55 + walls, 0.0, 1.0)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--blur", type=float, default=2.0,
                    help="gaussian radius; softens the quantization steps")
    ap.add_argument("--levels", type=int, default=10, metavar="N",
                    help="quantize to N depth planes (0 disables)")
    ap.add_argument("--equalize", type=float, default=0.6, metavar="0..1",
                    help="how far to push the mid-range expansion (0 = raw model output)")
    ap.add_argument("--clip", type=float, default=0.5, metavar="PCT",
                    help="percentile trimmed from each tail before stretching")
    ap.add_argument("--far", type=float, default=0.0, metavar="0..1",
                    help="collapse everything below this depth onto one far "
                         "plane; use for scenes with a skyline or a horizon "
                         "(0 disables, which is right for an interior)")
    ap.add_argument("--far-band", type=float, default=0.05, metavar="0..1",
                    help="range the collapsed background is allowed to occupy")
    ap.add_argument("--flat", action="append", default=[], metavar="X0,Y0,X1,Y1[,V]",
                    help="force an image-space rectangle to one depth; repeatable. "
                         "For windows, skylights and whiteboards the model gets wrong")
    ap.add_argument("--band", default="", metavar="LO,HI",
                    help="rescale the finished map into LO..HI instead of 0..1. "
                         "The single biggest lever on silhouette smearing: the "
                         "shader displaces by (d-0.5), so a narrower band means "
                         "less stretch. Try 0.45,0.95")
    ap.add_argument("--synthetic", action="store_true", help="skip the model")
    args = ap.parse_args()

    img = Image.open(args.src).convert("RGB")

    if args.synthetic:
        depth, how = synthetic(img), "synthetic"
    else:
        try:
            depth, how = estimate(img), "Depth Anything V2"
        except Exception as exc:  # noqa: BLE001 - any failure means fall back
            print(f"depth model unavailable ({exc}); using synthetic", file=sys.stderr)
            depth, how = synthetic(img), "synthetic"

    report("raw", depth)
    depth = shape(depth, args.equalize, args.clip)
    report("shaped", depth)
    if args.far > 0:
        depth = compress_far(depth, args.far, args.far_band)
        report("far", depth)
    for spec in args.flat:
        depth = flatten(depth, spec)
    if args.flat:
        report("flattened", depth)
    if args.levels >= 2:
        depth = posterize(depth, args.levels)
        report("posterized", depth)
    # Last, so posterize still snaps against a full 0..1 range and the planes stay
    # evenly spaced; the band only scales the result.
    if args.band:
        depth = band(depth, args.band)
        report("banded", depth)

    out = Image.fromarray((depth * 255).astype(np.uint8), mode="L")
    if args.blur > 0:
        out = out.filter(ImageFilter.GaussianBlur(args.blur))
    out.save(args.dst)
    print(f"wrote {args.dst} ({out.size[0]}x{out.size[1]}, {how}, "
          f"equalize={args.equalize}, levels={args.levels})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
