# Art provenance and prompt

`art-src/room.png` is **AI-generated** from the prompt below, using Cursor's
image generation tool. Nothing in this project is derived from any other
portfolio site's assets.

Everything else is downstream of that one file:

```
art-src/room.png        the generated original, 1536x1024
  -> tools/depth.py      -> art-src/room-depth.png
  -> Pillow WebP encode  -> assets/room.webp, assets/room-depth.webp
```

So regenerating the art means re-running the depth step and the WebP encode, and
then recalibrating the hotspot boxes with `?edit`.

## What matters in the prompt

Three constraints do more work than the subject matter, and are worth preserving
in any regeneration:

1. **One light source, from the left, with every shadow falling right.**
   Consistent lighting sells the depth more than the depth map does. Art with
   contradictory shadows looks wrong the moment the camera moves and no amount
   of depth tuning fixes it.
2. **Generous spacing, with clear separation between objects.** Objects that
   overlap or touch cannot be separated by the depth model, so they end up on one
   plane and stop reading as distinct things to click.
3. **No text or lettering anywhere.** Generated text comes out as garbled
   pseudo-writing. The whiteboard is the one exception, and only because it was
   specified as abstract boxes and arrows rather than words.

A fourth, learned the hard way: **ask for a wide image and mean it.** The request
was 16:9 and the result was 3:2, which is why portrait phones crop so hard that
panning became necessary. Keep nothing important near the top or bottom edges.

## The prompt

> A wide 16:9 illustration of a hybrid garage-study room, in a soft painterly
> anime style with warm muted colors, clean flat shading and crisp readable
> shapes. Straight-on frontal view of one wall, like a stage set, with clear
> empty space between objects so each reads distinctly. Strong warm afternoon
> sunlight enters from a tall window on the far LEFT edge; every shadow falls
> consistently to the RIGHT of every object. Layout strictly left to right:
> (1) tall window at the far left edge; (2) a tall wooden bookshelf filled with
> colorful books, with a vintage black film camera sitting on one shelf and a
> small potted plant on another; (3) a low metal workbench holding a whimsical
> Rube Goldberg contraption of small ramps, gears and a marble, plus a tiny toy
> robot; (4) in the centre a large wooden desk with a desktop monitor showing a
> dark code editor, a keyboard, an angled desk lamp on its left, a vintage
> typewriter at the right end of the desk, and a wire letter tray holding a white
> envelope; (5) on the wall above the desk a whiteboard covered in abstract
> diagrams, arrows and boxes, and beside it a small framed portrait photo; (6) to
> the right a large world map poster on the wall studded with small red pins, and
> below it a row of colorful conference lanyards with blank badges hanging from a
> wall hook; (7) at the far right a chrome microphone on a floor stand. A
> patterned woven rug on the wooden floor in the foreground. Warm off-white
> plaster walls with white baseboard trim. No people, no readable text, no
> lettering, no words, no watermark. Uncluttered, generous spacing, everything
> clearly separated.

## Object-to-section mapping

The prompt enumerates objects in the order the sections appear in
`src/hotspots.js`, and each numbered item corresponds to a clickable region. If
you add a section, add its object to the prompt before regenerating \u2014 the
illustration is drawn around the section list, not the other way round.
