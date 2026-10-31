# Napkin Sketch

**Family:** Hand-Drawn · **id:** `napkin-sketch`

**Look.** A cafe-table pitch in black Sharpie on a paper napkin. The napkin is off-white tissue with per-pixel fibre and crumple shading, quarter-fold creases, an embossed border of tiny pressed flowers and double lines, and a coffee ring. It lies on warm wooden planks with long grain lines and knots, lit by window light from the top left, with a white cup and saucer at the corner and a black marker.

**Motion.** Strokes are drawn on and the demo marker follows the pen tip across the napkin, then lies on the table when nothing is drawing. The napkin breathes by a tiny amount. The camera starts tight on the hook line and pulls back to show the whole napkin. Letters are placed one by one with a small random tilt and baseline wobble.

**How it explains.** Titles and labels are Permanent Marker lettering with a soft bleed. Arrows are wobbly Sharpie arcs with a flick-style head. Boxes are single quick loops that do not quite close. The counter is big marker numerals. Emphasis is a red hand-drawn circle around the number plus three short tick strokes. The scene change slaps a fresh napkin onto the pile, which lands with a skid and a drop shadow. Blue ink is used for secondary labels.

**Palette.** napkin `#f5f2ea`, black ink `#141414`, red `#c8221e`, blue `#1f3f9a`, table base browns `#8a5532` and `#6d3f22`, window light warm `rgba(255,220,170)`.

**Fonts.** Permanent Marker (all text).

**Signature techniques.**
- `sharpie()` draws each stroke as a feathered wide halo, a mid halo and a solid body, then random hairline wicks off the edge and a darker dot where the pen paused.
- The napkin is rendered once into a cache using per-pixel ridged noise, finite-difference lighting for crumple relief and a ragged jittered outline.
- Border emboss is drawn as a white highlight and a grey shadow pair offset by a pixel or so.
- The wooden table is cached planks with wavy grain lines, knots and plank edges.

**SFX.** Bed `crowd`. Strokes use the `marker` scribble, labels land with `pop`, emphasis uses `stamp`, the transition uses `paper`. The demo score adds `whoosh`, `thud`, `count` and a closing `chime`.

**When to use it.** Startup pitches, "idea on the back of a napkin" stories, brainstorming, early-stage plans and anything that should feel informal and quickly sketched.
