#!/usr/bin/env python3
"""Draw the favicon set from one geometric definition.

    python tools/icon.py

Writes `assets/favicon.svg` plus the raster sizes browsers still insist on. The
shape is authored as coordinates rather than type: a font-rendered glyph is at
the mercy of whatever is installed on the machine that rasterises it, and at
16 px a hinting difference is the whole letter.

The mark is an A drawn as two strokes, sized so the counter (the triangular hole
under the apex) survives 16 px. That is the constraint that decides everything
here - a heavier stroke looks better at 180 px and fills solid in a tab strip.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"

BG = "#1a1714"      # --panel-solid
FG = "#d9a45b"      # --accent

# All geometry in a 64x64 box, scaled up for the raster sizes.
BOX = 64
RADIUS = 14
APEX = (32, 15)
LEFT = (15, 51)
RIGHT = (49, 51)
BAR_Y = 39
STROKE = 7
BAR_STROKE = 6.5

SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {BOX} {BOX}">
  <rect width="{BOX}" height="{BOX}" rx="{RADIUS}" fill="{BG}"/>
  <g fill="none" stroke="{FG}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M{LEFT[0]} {LEFT[1]} L{APEX[0]} {APEX[1]} L{RIGHT[0]} {RIGHT[1]}" stroke-width="{STROKE}"/>
    <path d="M21 {BAR_Y} L43 {BAR_Y}" stroke-width="{BAR_STROKE}"/>
  </g>
</svg>
"""


def render(size: int, pad: int = 0) -> Image.Image:
    """Draw at 8x and downsample; PIL has no antialiased vector rasteriser."""
    ss = 8
    n = size * ss
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    inner = n - 2 * pad * ss
    d.rounded_rectangle(
        [pad * ss, pad * ss, pad * ss + inner - 1, pad * ss + inner - 1],
        radius=RADIUS / BOX * inner, fill=BG,
    )

    def pt(p):
        return (pad * ss + p[0] / BOX * inner, pad * ss + p[1] / BOX * inner)

    w = STROKE / BOX * inner
    d.line([pt(LEFT), pt(APEX), pt(RIGHT)], fill=FG, width=round(w), joint="curve")
    # `joint="curve"` rounds the interior corner but not the two ends.
    for p in (LEFT, RIGHT, APEX):
        x, y = pt(p)
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=FG)

    bw = BAR_STROKE / BOX * inner
    a, b = pt((21, BAR_Y)), pt((43, BAR_Y))
    d.line([a, b], fill=FG, width=round(bw))
    for x, y in (a, b):
        d.ellipse([x - bw / 2, y - bw / 2, x + bw / 2, y + bw / 2], fill=FG)

    return img.resize((size, size), Image.LANCZOS)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "favicon.svg").write_text(SVG)

    render(32).save(OUT / "favicon-32.png")
    # Apple crops to its own rounded mask and never shows transparency, so this
    # one is flattened and padded rather than rounded.
    apple = Image.new("RGB", (180, 180), BG)
    apple.paste(render(180), (0, 0), render(180))
    apple.save(OUT / "apple-touch-icon.png")

    # Bare /favicon.ico is still requested by crawlers and older browsers.
    render(64).save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    for f in ("favicon.svg", "favicon-32.png", "apple-touch-icon.png", "favicon.ico"):
        print(f"{f}  {(OUT / f).stat().st_size} B", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
