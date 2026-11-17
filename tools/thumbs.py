#!/usr/bin/env python3
"""Fetch the section thumbnails from the old site and encode them for this one.

    python tools/thumbs.py            # fetch + encode into assets/thumbs/
    python tools/thumbs.py --check    # report what is missing, touch nothing

Provenance matters more than the bytes here. Every image below came from
`avijit-thawani/webpage` (the Next.js site behind thawani.netlify.app), and the
mapping from image to section was read out of that repo's own components -
`Home.tsx` for the affiliations, `Build.tsx` for the projects - rather than
guessed from filenames. Keeping the manifest here means the next person can
re-derive it instead of trusting that `neu.png` really is Northeastern.

Three images in that repo are orphans: no component references them.
`film.png` is used anyway (it is the short film's title card, and the old Fun
section embedded a YouTube iframe instead of a still). `pinegapLogo.svg` is used
in preference to the .jpeg the site actually shipped, which is a 200 px raster of
just the diamond; the SVG is the full lockup and scales. `ibm.webp` is not used,
because there is no IBM entry in content.js to attach it to.

Going the other way, eight things in content.js have no image anywhere and are
not worth hunting for again: Saras Mandarin, Read Party and Avi Trivia all
postdate that site; the WW2-jet documentary and the comedy sketch only ever
existed as Facebook video; and the robotics win, HandyPresents and the sketching
were never illustrated at all.

Two labs logos postdate that site too and are not fetched by this script, so a
re-run leaves them alone. Both came from the companies' own sites: `otter.webp`
is otter.ai's apple-touch-icon, flattened onto white and trimmed to the mark;
`eliseai.svg` is the wordmark from eliseai.com's nav, copied verbatim.
"""

import argparse
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "thumbs"
BASE = "https://raw.githubusercontent.com/avijit-thawani/webpage/HEAD/public/static"

# source filename -> (output stem, section, why it is that section)
MANIFEST = [
    # Film. Orphan in the source repo but unmistakably the short film card.
    ("film.png", "film", "film", "short film title card"),

    # Affiliations, in the order Home.tsx lists them.
    ("usc.jpeg", "usc", "labs", "USC thesis committee"),
    ("msr.png", "msr", "labs", "Microsoft Research Health Futures"),
    ("alexa.png", "alexa", "labs", "Amazon Alexa Conversations"),
    ("ai2.png", "ai2", "labs", "Allen Institute for AI"),
    ("neu.png", "neu", "labs", "Northeastern"),
    ("sutd.png", "sutd", "labs", "SUTD Singapore"),
    ("samsung.png", "samsung", "labs", "Samsung Research (Build.tsx)"),
    ("iitbhu.jpg", "iitbhu", "labs", "IIT BHU"),

    # Projects, in the order Build.tsx lists them.
    ("saras.png", "saras", "build", "Saras tutor bot"),
    ("ballpark.png", "ballpark", "build", "Ballpark"),
    ("survey.png", "survey", "build", "Living Surveys"),
    ("designAR.jpg", "designar", "build", "DesignAR / Imagine Cup"),
    ("election.png", "election", "build", "2020 election guide"),
    ("covid.png", "covid", "build", "COVID-19 India"),

    # Making.
    ("contraption.jpeg", "contraption", "making", "Rube Goldberg contraption"),
]

# Copied verbatim: re-encoding a vector logo to WebP only throws away quality.
PASSTHROUGH = [("pinegapLogo.svg", "pinegap.svg", "build", "PineGap.ai lockup")]

# Wide enough for a retina render of the sizes styles.css actually displays.
MAX_W = {"film": 720}
DEFAULT_MAX_W = 360


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    missing, total = [], 0

    for src, stem, section, note in MANIFEST:
        url = f"{BASE}/{src}"
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                data = r.read()
        except Exception as err:
            missing.append((src, section, note, str(err)))
            continue
        if args.check:
            print(f"ok    {section:8s} {src:20s} {len(data) // 1024} KB  {note}")
            continue

        tmp = OUT / f".{stem}.tmp"
        tmp.write_bytes(data)
        img = Image.open(tmp)
        # Logos ship as palette-with-transparency and as RGBA; flatten both onto
        # the drawer's own background so no logo arrives with a black box.
        if img.mode in ("P", "LA", "RGBA"):
            img = img.convert("RGBA")
            flat = Image.new("RGB", img.size, (255, 255, 255))
            flat.paste(img, mask=img.split()[-1])
            img = flat
        else:
            img = img.convert("RGB")

        cap = MAX_W.get(stem, DEFAULT_MAX_W)
        if img.width > cap:
            img = img.resize((cap, round(img.height * cap / img.width)), Image.LANCZOS)

        dst = OUT / f"{stem}.webp"
        img.save(dst, "WEBP", quality=80, method=6)
        tmp.unlink()
        total += dst.stat().st_size
        print(f"{src:20s} -> thumbs/{dst.name:16s} {img.width}x{img.height}  "
              f"{len(data) // 1024} KB -> {dst.stat().st_size // 1024} KB", file=sys.stderr)

    for src, dst_name, section, note in PASSTHROUGH:
        try:
            with urllib.request.urlopen(f"{BASE}/{src}", timeout=30) as r:
                data = r.read()
        except Exception as err:
            missing.append((src, section, note, str(err)))
            continue
        if args.check:
            print(f"ok    {section:8s} {src:20s} {len(data) // 1024} KB  {note}")
            continue
        (OUT / dst_name).write_bytes(data)
        total += len(data)
        print(f"{src:20s} -> thumbs/{dst_name:16s} verbatim  {len(data) // 1024} KB",
              file=sys.stderr)

    if not args.check:
        n = len(MANIFEST) + len(PASSTHROUGH) - len(missing)
        print(f"\n{n} thumbs, {total // 1024} KB total", file=sys.stderr)
    for src, section, note, err in missing:
        print(f"MISSING  {section:8s} {src:20s} {note}  ({err})", file=sys.stderr)
    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
