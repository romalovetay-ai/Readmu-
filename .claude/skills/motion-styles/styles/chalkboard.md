# Chalkboard Lesson

**Family:** Hand-Drawn · **id:** `chalkboard`

**Look.** Dry chalk on a dark green slate. Old eraser swirls and faint ghosts of past lessons ("x = 2", "homework", "p. 41") cloud the board, and a worn oak frame with grain lines surrounds it, with a chalk tray at the bottom holding coloured sticks, loose dust and a felt eraser.

**Motion.** Strokes draw on with a chalk stick held at the drawing point, leaving dust specks falling below the line. Letters appear one at a time, each slightly rotated and nudged. Slow chalk dust drifts through the air in the finish pass, which then lays the frame on top with a vignette and grain.

**How it explains.** Titles are Cabin Sketch and labels Patrick Hand, both chalked letter by letter. Arrows are wobbly arcs with a two-stroke open chevron head. Boxes are four separate strokes that overshoot their corners, with a faint side-of-the-chalk fill once drawn. Counters are yellow chalk numerals re-chalked with a jitter seed that follows the value. Emphasis is a pink chalk oval looped around the number. The scene change is a felt eraser zig-zagging across the board wiping it clean, followed by a settling cloud of chalk dust.

**Palette.** slate `#2f4a3b`, chalk white `#f1f0e6`, yellow `#f2d65c`, pink `#f08fb0`, blue `#8fc6ee`, green `#a7dc8a`, oak `#6e4424` (with `#8a5a32` and `#4a2c16` in the gradient), eraser felt `#c9b48d`, vignette `#050a07`.

**Fonts.** Cabin Sketch 400/700 (titles), Patrick Hand (labels, counters, ghost writing).

**Signature techniques.**
- A cached grain tile per chalk colour, with pixels dropped by anisotropic "board tooth" noise, used as a pattern fill for strokes and text so lines skip and break.
- Each stroke is a faint wide dust halo, a grainy body and a denser offset core.
- The eraser transition strokes the board layer itself as a pattern along a zig-zag path, so it truly erases what is above it.
- A cached board layer and a cached frame layer, both built once per size.

**SFX.** bed `room`, `scribble` with the chalk medium for strokes, `tick` as items land, `paper` swipes plus `whoosh` for the eraser, `count` for the numeral, `thud` on the emphasis, `chime` to resolve.

**When to use it.** Teaching and lesson-style explainers, step-by-step concepts, back-to-basics breakdowns with a classroom feel.
