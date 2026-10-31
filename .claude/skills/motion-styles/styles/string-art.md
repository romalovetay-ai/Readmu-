# Nail & Thread String Art

**Family:** Generative & Type · **id:** `string-art`

**Look.** A stained walnut plank board with visible grain and plank seams, lit by a warm lamp from above. Brass nails stand in rings and outlines, and taut cream cotton threads span them. Each thread has a cast shadow, a translucent body and a thin sheen line, so crossings glow. Kraft tags and burned script lettering sit on the wood.

**Motion.** Rings are wound chord by chord, with the nails popping in first and a golden glow building as the envelope fills. Titles are burned in left to right behind a travelling ember. Arrows are pulled across the board, sagging while slack and pulling taut at the end.

**How it explains.** Labels are kraft tags with a reinforced hole and a brass nail through it, typed in typewriter text. Arrows are threads from nail to nail finishing in a two-thread barb around two extra nails. Boxes are nails spaced around the outline, wound round the edge and then laced across with a gold thread. Counters are seven-segment digits made of threads and nails. Emphasis is a red thread wound round an ellipse of nails. The scene change slides a fresh stretch of walnut across with a dark motion smear.

**Palette.** wood `#6a3d20`, dark wood `#4a2914`, light wood `#8a5631`, brass `#c9a24a`, thread `#f6e7b8`, gold `#ffd25e`, red `#d8392f`, kraft `#c9a678`, burn `#2c160a`, ink `#2a1a10`.

**Fonts.** Kaushan Script (burned title lettering), Special Elite (typewritten text on the kraft tags).

**Signature techniques.**
- `thread()` draws every line three times: an offset dark shadow, a translucent coloured body and a thin white sheen.
- `windRing()` strings star chords i to i+k round a ring of nails, with an additive glow that strengthens as chords accumulate.
- The walnut board is generated per pixel from fbm noise (rings, grain, plank seams) at half resolution, then cached and upscaled.
- Pyrography titles use a clipped reveal, a soft burn shadow and an additive radial ember at the leading edge.

**SFX.** bed `room`, `scribble` (pencil medium) at the start and end, `tick` and `pluck` as nails and chords go in (pitched up through a scale for the platform chips), `whoosh` for the board slide, `count` for the digits, plucks on the emphasis, `chime` to resolve.

**When to use it.** Craft-flavoured explainers about connections, networks or a hub reaching many destinations, where the satisfying build of strings between points is the point.
