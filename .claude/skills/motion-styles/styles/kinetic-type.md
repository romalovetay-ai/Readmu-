# Kinetic Type

**Family:** Generative & Type · **id:** `kinetic-type`

**Look.** A typographic music-video frame in strictly two colours: near-black and acid yellow. Condensed Anton words are stretched to fill rectangular boxes edge to edge with zero leading, some solid, some outlined, and one word filled with a yellow halftone dot moon-and-horizon scene. Small HUD furniture sits in the corners: a timecode, a "[CREATOR OS / 120 BPM]" tag and registration crosshairs. Heavy print-like grain covers it.

**Motion.** Words land on a 120 bpm grid with one of three entrances: a scaled-down punch, a sideways whip with outline strobe echoes trailing it, or a rise from below clipped to its box. Some words get a slice glitch where three horizontal bands knock sideways. A one-frame inverted flash marks impacts, and the arrow chevrons march along their rule.

**How it explains.** Titles and the counter are stretched word-blocks. Labels are solid yellow mono tags (or inverted outlined tags) that drop onto their target. Arrows are heavy rules with marching chevrons and a triangle head. Boxes are heavy rule frames that draw in from corners with crop marks. Emphasis is a strobing inverted flash with outline echoes stepping outward. The scene change cuts the frame into 14 strips that tear sideways, with yellow slabs closing top and bottom at the midpoint.

**Palette.** bg `#0b0b0b`, ink (acid yellow) `#e8ff2a`.

**Fonts.** Anton (stretched headline and number blocks), Space Mono 700 (tags, timecode, HUD).

**Signature techniques.**
- `block()` measures a word's exact glyph bounding box at 200px and scales it non-uniformly to fill any target rectangle.
- A halftone mode renders the word to a layer, then composites a cached dot-screen tile into it with `source-in`.
- Inversion uses the `difference` composite with yellow over a region.
- Slice glitch and the transition both use clipped horizontal bands of a cached copy of the frame.

**SFX.** Bed `tape`. Landings use `thud`, emphasis uses `stamp`, the transition uses `glitch`. The demo score also lays a `tick` on every beat of the 120 bpm grid, plus `whoosh`, `count` and a closing `chime`.

**When to use it.** Hype intros, lyric-style statements, loud stat reveals and anything driven by a beat where the words themselves are the graphic.
