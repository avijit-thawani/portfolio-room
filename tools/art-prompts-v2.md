# Scene prompts, second pass

Twelve variants across three scenes, built to be recombined: take one **scene
body**, prepend one **style clause**, append the **shared tail**. That is exactly
how the twelve samples were produced.

`art-prompt.md` still holds the provenance and the three constraints that matter
most. This file is the working prompt kit.

## Light direction is a variable, not a constant

`art-prompt.md` requires **one** light source with every shadow falling the same
way, because contradictory shadows look wrong the moment the camera moves. That
rule says nothing about *which* way. Fixing it at "from the LEFT" for every
prompt is how you get twelve samples that all look like the same afternoon.

Directions that all satisfy the constraint, and change the mood completely:

| Setup | Prompt clause |
|---|---|
| Low sun, right | sun at the far RIGHT, every shadow falls consistently to the LEFT |
| Overhead skylight | light from a skylight directly OVERHEAD, short soft shadows straight DOWN |
| Midday, behind camera | sun high and slightly BEHIND the camera, short shadows falling FORWARD |
| Night, single fixture | a strung line of bulbs ABOVE as the only source, shadows straight down |
| In-scene point source | a lit desk lamp at the centre, shadows radiating OUTWARD away from it |
| Backlit | diffuse daylight from a glass wall BEHIND the objects, soft shadows forward |

Layout is likewise free. The left-to-right zone order came from `hotspots.js`,
not from the art — a corner view with two walls, a reversed order, or objects
staggered at different distances from the wall all work, and staggering is
strictly better for parallax because it gives the shader more planes.

Dark scenes are the one real trap. Night forges and single-lamp rooms look
superb and then hand the depth model a low-contrast image, on top of costing
you contrast at first paint. Sample them, but check the depth map early.

## Shared tail — always append verbatim

> No people, no text, no lettering, no words, no signage, no watermark.
> Uncluttered, generous spacing, every object reading as a distinct silhouette
> with empty space around it, nothing important near the very top or bottom edge.

The last clause matters more than it looks: the generator returns **3:2 no matter
what you ask for**, including when an explicit `aspect_ratio: 16:9` parameter is
passed. All twelve samples came back 1536x1024. Portrait viewports crop the top
and bottom hardest, so anything load-bearing must sit in the central band.

## Style clauses

| Key | Clause | Depth-pass risk |
|---|---|---|
| `ghibli` | soft painterly anime style, warm muted colors, clean flat shading, crisp readable shapes | Low — the current baseline |
| `midcentury` | mid-century modern gouache poster, flat stylized shapes, geometric simplification, limited palette of teal, ochre, coral and deep navy, visible paper grain, strongly layered flat depth planes | Low — the idiom already stacks planes |
| `3d` | cozy stylized 3D render, soft global illumination, matte clay-like materials, physically plausible volumes, subtle ambient occlusion, no depth of field blur | Lowest — closest to the depth model's training data |
| `ligne-claire` | clean-line European comic style of Moebius and Herge, uniform bold black outlines of even weight, flat unshaded areas of clear bright color, no cross-hatching, no gradients | Medium — crisp silhouettes, but flat fills give the model little to read |
| `lowpoly` | isometric low-poly render, faceted low-polygon forms, flat matte colors, crisp geometric edges, soft uniform shading | Medium — great separation, but the void background carries no scene |
| `miniature` | inspired by Pahari and Basohli Indian miniature painting, flat jewel-tone fields of lapis, vermilion, emerald and gold, fine white outlines, stylized flat clouds, ornamental patterned surfaces, clearly layered overlapping planes rather than realistic perspective | **High** — no perspective cues at all; expect to hand-paint the depth map |

Cut before generating: pixel art, blueprint/technical, and risograph. Grain and
flatness all defeat the depth pass, and no amount of `--equalize` recovers it.

## Scene body: rooftop

Framing is the same as the room — straight-on, stage-set — but the payoff is that
foreground parapet, midground deck, background skyline are three *genuinely*
separated planes instead of one wall.

> Straight-on frontal view like a stage set. Strong low afternoon sunlight from
> the far LEFT; every shadow falls consistently to the RIGHT of every object.
> Foreground: a low parapet wall running across the bottom, with an open blank
> notebook and a fountain pen resting on its ledge at the right end, and a single
> empty wooden folding chair facing out at the left end. Midground, clearly
> spaced left to right with empty space between each: a crate of colorful books
> beside a deck chair; a vintage black film camera on a wooden tripod; a low
> metal work table holding a whimsical contraption of small ramps, gears and a
> marble; a brass telescope on a tripod aimed up and to the right; an open laptop
> on the work table; a chrome microphone on a slim stand beside a tall stool,
> under a strung line of small warm bulbs.

Background swap is the whole location choice:

- **NYC** — a distant skyline of wooden rooftop water towers and silhouetted
  brick buildings under a peach and lavender sky.
- **BHU / Varanasi** — the tall white marble spire of a Hindu temple rising above
  red sandstone Indo-Gothic domes, chhatris and arched cloisters, flame-red
  gulmohar treetops, several small diamond paper kites high in a warm hazy sky.
  Swap the book crate for a woven charpai stacked with books, and add a black
  cylindrical water tank on a short steel frame at the far right.

Section mapping: books/charpai = Reading, film camera on a tripod = Film, work
table + contraption = Making, pinboard of abstract diagrams = Research, laptop =
Build, typewriter = Writing, theatre mask = On stage, skyline or ghats = Travel,
empty chair = About.

Three objects changed after the first round and the change is global:

- **Telescope is out**, a pinboard or blackboard of abstract diagrams is in. The
  telescope looked good but said "astronomy", and the research is tokenization.
- **Notebook and pen are out, the typewriter is in** for Writing.
- **Microphone is out, a theatre mask is in** for On stage. It covers improv,
  which is the largest part of that section, and it reads at small sizes where a
  mic stand turns into a stick.

## Scene body: model-maker's table

> Viewed slightly from above. A single warm angled desk lamp at the far LEFT is
> the only light source; every shadow falls long and consistently to the RIGHT.
> On the bench, clearly spaced left to right with bare wood visible between each
> group: a stack of books propping up the left end; a small camera on a tiny
> tripod aimed at the model; in the centre a half-built miniature of a study
> room, open like a dollhouse, containing a tiny lit computer monitor, a tiny
> desk and tiny furniture; behind it a stand holding reference sheets of blank
> diagrams and a large magnifier on an arm; scattered modelling tools, tweezers,
> a scalpel and small open paint pots; an open blank notebook of plans; a small
> globe beside a box of blank postcards; a tiny model theatre with a red curtain
> at the far right; a canvas apron hanging on a hook on the wall behind.

Add "no hands" to the tail here — a workbench prompt attracts them.

The lamp-as-only-light reads beautifully but lands dark. If the depth pass or
first paint suffers, ask for "bright even daylight from a window at the far LEFT
in addition to the lamp" and keep the shadow direction clause.

Section mapping: tools and the model = Making, the miniature's lit monitor =
Build, apron on the hook = About, reference sheets + magnifier = Research, book
stack = Reading, small camera = Film, notebook = Writing, globe + postcards =
Travel, model theatre = On stage.

## Scene body: the current room

Unchanged from `art-prompt.md`, with one edit: the monitor is now "showing a dark
blank screen" rather than "a dark code editor". Asking for an editor invites
generated pseudo-code, which is lettering by another name.

## Depth settings per scene

The defaults were tuned on an interior with a wall a couple of metres away. A
scene containing real distance needs `--far`, and any scene with a bright flat
panel in it needs `--flat`. Commands that produced the current `assets/`:

```sh
python tools/depth.py art-src/nyc-daylight.png      art-src/nyc-daylight-depth.png      --far 0.38
python tools/depth.py art-src/varanasi-sunset.png   art-src/varanasi-sunset-depth.png   --far 0.38
python tools/depth.py art-src/garage-steampunk.png  art-src/garage-steampunk-depth.png  --far 0.28 \
    --flat 0.0,0.02,0.105,0.62,0.0
python tools/depth.py art-src/room-studio.png       art-src/room-studio-depth.png \
    --flat 0.379,0.505,0.562,0.690,0.22 --flat 0.415,0.360,0.475,0.505,0.30
```

`room-studio` takes **no** `--far`, and that is the lesson. `--far` is for scenes
with real distance in them; a room's back wall is two metres away, so `--far 0.28`
carried over from the rooftops swallowed the wall, the bookshelf and the camera
into one black slab. Reach for `--far` only when the histogram actually has a
far cluster to squash.

Picking `--far`: print the row-wise median of the depth map and find the row
where the ground starts. On both rooftops the terrace floor begins at 0.44 with
everything above it at or below 0.33, so 0.38 splits them cleanly. Set it too
high and it swallows real furniture — 0.35 on the interiors crushed the
steampunk workbench from 0.21 down to 0.16 and flattened the desk entirely.

Picking `--flat`: look for a bright flat panel reading *nearer* than the wall
around it. The steampunk window came back at 0.19 against a 0.06 wall, and the
skylight room's whiteboard varied by a third of the whole range across a board
that is perfectly flat.

Do not pick it off spread alone. In `room-studio` the chalkboard spans 0.44 of
the range and the map 0.22, which looks damning until you sample the bare wall
beside each: the wall spans exactly the same, because a side wall in perspective
*is* a depth ramp. Both panels were already correct, and flattening them shoved
them behind the wall they hang on. Always compare a panel against the wall it
sits on, never against the corner — the corner is the far point of the room and
makes everything look like it is floating.

The defect worth fixing was the opposite shape: the film camera read 0.00, level
with the corner it stands a metre in front of, so it was a hole rather than an
object. A rect `--flat` costs you the silhouette (the camera becomes a box in the
depth map) but buys correct occlusion, and the colour image still carries the
shape. Take that trade for a small object; refuse it for a large one.

## What to check on every sample

1. Do shadows all fall the same way? One contradictory shadow and the parallax
   looks wrong the moment the camera moves.
2. Does any object touch another? Touching objects merge into one depth plane.
3. Any lettering that crept in — spines, badges, screens, posters?
4. Run `tools/depth.py`, load the page, press `d`. If objects do not separate
   from the background in the depth view, discard the sample. That check is ten
   minutes; a hotspot calibration pass is an afternoon.
