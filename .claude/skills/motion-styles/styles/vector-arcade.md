# Vector Arcade 1980

**Family:** Retro Digital · **id:** `vector-arcade`

**Look.** An XY vector-monitor arcade cabinet. Everything is hair-thin phosphor lines on pure black in green, red, white and cyan, with a soft additive bloom. Short strokes are bright and long strokes dimmer, and small bright dots sit at vertices where the beam would pause. The scene is a wireframe horizon with a green perspective floor, a SCORE and HI SCORE HUD, and a rotating wireframe icosahedron and cube in perspective.

**Motion.** Every item is drawn by a travelling beam with a bright white head. The whole picture flickers with a noise-driven beam-load flutter. The floor scrolls, the radar sweeps and 3D shapes rotate continuously.

**How it explains.** Titles, labels and counters are written in a hand-built single-stroke font on a 4 by 6 grid. Arrows are dashed tracer lines ending in an open arrowhead. Boxes are chamfered-corner outlines. Counters are red vector digits, matched to the score HUD. Emphasis is four red lock-on corner brackets slamming in from wide, followed by a pulsing white ring. The scene change is a hyperspace jump: the screen darkens, stars stretch into streaks from the centre and a pale green flash fires at the midpoint.

**Palette.** phosphor green `#5dff7a`, red `#ff4d3a`, white `#e6f2ff`, cyan `#4de8ff`, black `#000000`.

**Fonts.** None loaded. All lettering is the module's own stroke font (`vecText`).

**Signature techniques.**
- `beam()` draws polylines under a length budget so progress is time spent along the stroke, with a wide faint glow pass, a bright whitened core per segment (shorter segments brighter), vertex dots, and a white head dot while drawing.
- `vecText()` converts text into polyline glyphs from a hand-authored glyph table.
- `wire()` rotates, scales and perspective-projects vertex and edge lists for the icosahedron and cube.
- The finish adds a quarter-resolution blur twice (tight and wide halo) with `lighter`, a faint glass reflection, vignette and grain.

**SFX.** bed `hum`, sawtooth `tone` buzz while the beam writes text, `blip` notes (rising scale for the chips) with `click`, a low square-wave sweep for the core, `riser` + `thud` + `whoosh` on hyperspace, `count`, `glitch` + `stamp` plus a square chirp on lock-on, `chime` to end.

**When to use it.** Gaming, hacker, retro-tech and score-style content, or any explainer that wants a monochrome, high-contrast arcade feel.
