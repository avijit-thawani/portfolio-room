#!/usr/bin/env python3
"""Encode a full-resolution source into the WebP the site actually serves.

This step used to live in someone's shell history. It is the difference between
a 2.25 MB first paint and a 202 KB one, and it is the single asset gating the
reveal, so it belongs in the repo.

    python tools/encode.py art-src/room.png assets/room.webp
    python tools/encode.py art-src/room-depth.png assets/room-depth.webp --depth

Depth maps get their own mode: they are grayscale, they are read as data by the
shader rather than looked at, and lossy ringing around an edge shows up as a
wobbling silhouette when the camera moves. So they encode at a higher quality
and stay single-channel.
"""

import argparse
import sys
from pathlib import Path

from PIL import Image


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--quality", type=int, default=None,
                    help="WebP quality; defaults to 82 for color, 92 for depth")
    ap.add_argument("--max-width", type=int, default=2048,
                    help="downscale if wider; 0 disables")
    ap.add_argument("--depth", action="store_true",
                    help="treat as a depth map: grayscale, higher quality")
    args = ap.parse_args()

    src = Path(args.src)
    dst = Path(args.dst)
    img = Image.open(src)
    img = img.convert("L" if args.depth else "RGB")

    if args.max_width and img.width > args.max_width:
        h = round(img.height * args.max_width / img.width)
        img = img.resize((args.max_width, h), Image.LANCZOS)

    quality = args.quality if args.quality is not None else (92 if args.depth else 82)
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "WEBP", quality=quality, method=6)

    before = src.stat().st_size
    after = dst.stat().st_size
    print(f"{src.name} -> {dst.name}  {img.width}x{img.height}  "
          f"{before // 1024} KB -> {after // 1024} KB "
          f"({100 * after / before:.0f}%, q={quality})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
