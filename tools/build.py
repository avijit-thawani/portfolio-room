#!/usr/bin/env python3
"""Assemble the directory Netlify actually publishes.

Deploying the repo root would upload `art-src/` - twenty full-resolution PNGs,
about 45 MB of source art that no browser ever requests - along with the venv
and the tooling. So the deploy has a manifest, and the manifest lives here
rather than in someone's `netlify deploy --dir` flag.

    python tools/build.py && netlify deploy --dir dist --prod

Only the three shortlisted scenes ship their WebP. The superseded art
(`varanasi-balanced`, `nyc-daylight`, `room-skylight` and friends) stays out, which
means `compare.html?dev` on the deployed URL can list Steampunk and Current in
the scene bar but will 404 on their textures. That is the right trade: `?dev` is
a local calibration tool, and the alternative is shipping 1.5 MB of dead art to
keep a debug view honest.
"""

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

# Source page -> published path. The scene switcher is the homepage while the
# three candidates are still being chosen between; the single-scene Varanasi
# build stays reachable at /portfolio.html. Swap these two back once a scene
# wins and the switcher retires.
PAGES = {
    "compare.html": "index.html",
    "index.html": "portfolio.html",
}
TREES = ["src", "vendor"]
SCENES = ["benaras", "nyc-balanced", "room-studio"]


def main() -> int:
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "assets").mkdir(parents=True)

    for src, dst in PAGES.items():
        shutil.copy2(ROOT / src, DIST / dst)

    for tree in TREES:
        shutil.copytree(
            ROOT / tree, DIST / tree,
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc", ".DS_Store"),
        )

    wanted = ["styles.css", "favicon.svg", "favicon-32.png",
              "apple-touch-icon.png", "favicon.ico"]
    for scene in SCENES:
        wanted += [f"{scene}.webp", f"{scene}-depth.webp"]

    for name in wanted:
        src = ROOT / "assets" / name
        if not src.exists():
            print(f"missing asset: {src.relative_to(ROOT)}", file=sys.stderr)
            return 1
        shutil.copy2(src, DIST / "assets" / name)

    # Browsers and crawlers request bare /favicon.ico regardless of any <link>,
    # so it is served from the root as well as from assets/.
    shutil.copy2(ROOT / "assets" / "favicon.ico", DIST / "favicon.ico")

    # Section thumbnails, copied wholesale: they are referenced from content.js
    # as HTML strings, so there is no import graph to walk and a per-file
    # manifest here would silently drop whichever one was added last.
    thumbs = ROOT / "assets" / "thumbs"
    if thumbs.is_dir():
        shutil.copytree(thumbs, DIST / "assets" / "thumbs")

    total = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file())
    count = sum(1 for f in DIST.rglob("*") if f.is_file())
    print(f"dist/  {count} files  {total // 1024} KB", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
