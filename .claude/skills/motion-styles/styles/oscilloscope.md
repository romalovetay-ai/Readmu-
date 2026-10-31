# Oscilloscope Vector Art

**Family:** Retro Digital · **id:** `oscilloscope`

**Look.** A single P31 green beam on an analogue lab scope draws everything. The tube sits in a moulded dark bezel with corner screws, a graticule etched on the glass, a faint glass reflection and corner falloff. Beside or below it is a cream instrument front panel with knobs, tick marks, buttons, jacks and a glowing power LED.

**Motion.** Text and shapes are written by the beam in order, with a bright white writing spot at the head while a path is incomplete. Long, fast strokes draw dimmer and short vertices dwell brighter. Titles fade as the phosphor decays when they are not refreshed. The whole picture drifts by a fraction of a pixel, and emphasis pushes the bloom up for a frame.

**How it explains.** Text uses a custom single-stroke vector font (our own glyphs on a 4 by 6 grid, uppercase only). Labels are that font at a smaller size. Arrows are a beam-drawn arc with a V head. Boxes are traced rectangles, and the main node is a ring traced twice with a phase twist like an XY figure. Counters are large vector digits with extra intensity. Emphasis is a damped sine burst under the number. The scene change uses the scope's own controls: Y gain to zero collapses the picture to a line, X gain to zero collapses it to a dot, then it expands again.

**Palette.** screen `#060c08`, beam `#3dff6e`, core `#c4ffd0`, warn amber `#ffb347`, panel `#dcddd8`, bezel `#1d1f1e`, label blue `#4a6fa5`.

**Fonts.** Inter 600/800 (panel and graticule labels), Space Grotesk 700 (the XY-2 model mark). Beam text itself uses the built-in vector font, not a web font.

**Signature techniques.**
- `beam()` strokes each polyline three times: wide faint halation, mid glow and a bright core drawn per segment with additive blending.
- `bloom()` copies the frame at quarter resolution, blurs it and adds it back, clipped to the screen.
- Panel, bezel (with the screen cut out via destination-out) and graticule are cached layers, so the front glass sits over the beam.
- The transition redraws a captured copy of the frame scaled to a line and then a dot with a hot spot.

**SFX.** bed `hum`; a quiet triangle-wave tone plays while the beam writes, `blip` notes as items land, `click` + `whoosh` on the scale-down and back, `count` for the counter, `riser` + `thud` + a falling sine on the emphasis, `chime` to resolve.

**When to use it.** Technical, hacker-lab or signal-themed explainers, data and engineering topics, anything that suits glowing line work and a gear-head aesthetic.
