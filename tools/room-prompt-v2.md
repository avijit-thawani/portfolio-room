# Study room v2 — the same lessons, applied indoors

Every correction the rooftops needed applies here, so they are listed once as
constraints rather than rediscovered per sample.

## Object changes from `room-skylight`

| Was | Is | Why |
|---|---|---|
| Full-height bookshelf, camera on a shelf | Low bookshelf, camera on a tripod **on top of it** | The camera was buried between spines; on top it is its own silhouette |
| Desk lamp | Gone | A second light source in a skylight room, and it overlapped the monitor |
| Theatre mask on a stand | Handheld mic on a **stool** | Matches the rooftops; a mask on a pole reads as a lollipop |
| Framed portrait (About) | Gone | The section was folded away; the wall is quieter without it |
| Typewriter on the desk | Typewriter on the **carpet** | The desk held three sections; the floor is empty space going unused |
| Whiteboard of grey diagrams | **Green chalkboard**, NLP/LLM notation in white chalk | Same swap the rooftops took; a white board flares under a skylight |
| Wall map | Unchanged | It works |

Nine objects became eight. Spread them; do not close the gap.

## Prompt body

> Cozy stylized 3D render, soft global illumination, matte clay-like materials,
> subtle ambient occlusion, no depth-of-field blur. A corner of a study room,
> two pale blue-grey walls meeting left of centre, straight-on stage-set framing.
> A large glass skylight directly OVERHEAD is the only light source; every shadow
> is short, soft and falls straight DOWN.
>
> On the left wall, a wide dark-green chalkboard covered in white chalk marks:
> boxes joined by arrows, a grid, a small curve, abstract symbolic notation and
> no readable letters or words. Below it, a long low bench holding a wooden
> Rube Goldberg contraption of ramps, gears and a marble, with a small tin robot
> beside it and clear bench space between them.
>
> Against the corner, a LOW waist-height wooden bookshelf, two shelves only,
> holding colourful books with blank spines. Standing ON TOP of the bookshelf, a
> vintage black film camera on a small wooden tripod, fully clear of the wall
> behind it.
>
> On the right wall, a large framed vintage world map in muted blue and cream
> with small red dots, and nothing else on that wall. Beneath it a plain wooden
> desk with an open laptop, closed and dark, and a dark blank monitor, no lamp.
>
> In the open middle of the floor, a patterned kilim rug. Standing directly on
> the rug near its left edge, a black vintage typewriter, isolated with bare rug
> all around it. To the right of the rug, a tall wooden stool with a chrome
> handheld microphone resting on the seat.
>
> No people, no hands, no text, no lettering, no words, no signage, no watermark.
> Uncluttered, generous spacing, every object reading as a distinct silhouette
> with empty space around it, nothing important near the very top or bottom edge.

## Checks specific to this scene

- The chalkboard must stay **flat**: it is a bright-ish panel on a wall and the
  depth model wobbles it. Expect a `--flat` box over it either way.
- The camera must not touch the wall or it merges into the wall plane.
- The typewriter must not touch the desk, the stool or the rug border.
- No lamp anywhere, and no second window: one overhead source only.
