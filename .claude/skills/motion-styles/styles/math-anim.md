# Manim-Style Math

**Family:** Popular Explainer Looks · **id:** `math-anim`

**Look.** Pure black with crisp anti-aliased vector strokes in the Manim palette: blue, teal, yellow, red, green, gold, purple and grey on white. Text is a LaTeX-like serif with italic variables. The only texture is a very faint edge vignette, so it looks like a rendered Manim scene on a dark player.

**Motion.** Text is "written": each glyph's outline traces on and then fills, staggered left to right. Lines and shapes are drawn on along their path. Everything uses a sigmoid-shaped smooth rate function, similar to Manim's default easing. The demo also draws axes with tick marks and a climbing exponential curve with a moving dot.

**How it explains.** Titles are written and then a white rule draws underneath. Labels are written text, optionally italic variables. Arrows draw their shaft and then grow a triangular tip. Boxes are surrounding rectangles drawn clockwise from a corner, with an optional 18 percent fill. The counter is plain serif numerals. Emphasis is a yellow arc that runs around an ellipse with a trailing end, like a flash around the target. The demo also scales and tints the number yellow for an "indicate" pulse. The scene change fades out to pure black and back in.

**Palette.** bg `#000000`, white `#ffffff`, blue `#58c4dd`, teal `#5cd0b3`, yellow `#ffe45c`, red `#fc6255`, green `#83c167`, gold `#f0ac5f`, purple `#9a72ac`, grey `#888888`.

**Fonts.** STIX Two Text (regular for text and numerals, italic for variables and labels, 600 weight available for emphasis).

**Signature techniques.**
- `write()` strokes each glyph with a dash pattern that grows to reveal the outline, then fades in the fill once the outline is about half drawn.
- A sigmoid rate function `sig()` normalised to 0..1 for all draw-on timing.
- `K.drawOn` for rectangles and curves, and a separate tip triangle drawn at the arrow head.
- The flash around the target is a trimmed segment of an ellipse path, with head and tail moving at different speeds.

**SFX.** Bed `hum`. Landings use `tick`, emphasis uses `ding`, the transition uses `whoosh`. The demo score adds pen `scribble`s, `pluck` notes for each platform, `count` and a closing `chime`.

**When to use it.** Maths, logic, data and algorithm explanations, growth curves and anything where precise geometry and a clean 3Blue1Brown tone build trust.
