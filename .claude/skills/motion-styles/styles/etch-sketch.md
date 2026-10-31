# Etch A Sketch Toy

**Family:** Hand-Drawn · **id:** `etch-sketch`

**Look.** The classic red drawing toy. A glossy, rounded red plastic body with hard white specular streaks and a moulded bevel surrounds a grainy silver aluminium-powder screen, and two white knurled knobs sit at the bottom corners. Everything on the screen is one thin dark grey line with a lighter displaced-powder rim.

**Motion.** The stylus never lifts, so every element is joined to the next by a visible travel line. Diagonals and curves are stair-stepped into horizontal and vertical moves on a knob grid. The knobs rotate according to the horizontal and vertical distance travelled, and the finish pass lays the glass shading, the body and the knobs over the drawing. The scene change shakes the toy: the old drawing jitters while fresh powder recoats the screen in horizontal streaky bands, leaving a ghost that fades.

**How it explains.** Titles, labels and counters are drawn with a custom single-stroke block alphabet in which every glyph starts and ends on the baseline, so words ride a baseline travel line. Arrows are stair-stepped lines with a two-stroke head. Boxes are single or double rectangles, and the demo draws a play icon growing from a box's bottom edge. Counters are drawn as a whole number whose digits grow as it counts. Emphasis is a stair-stepped oval traced around the number.

**Palette.** line `#3b3c3e`, screen background `#c4c4bf`, body red `#d8221d` (gradient from `#f2412f` to `#8a0d09`), deep red `#b8150f`, knob `#ece9e1`, table `#2a201c`, vignette `#100505`.

**Fonts.** None. The module declares no web fonts, and all lettering is its own vector block alphabet (x from 0 to 4, cap height 6 units).

**Signature techniques.**
- A stroke routine that draws a pale offset rim under a dark core, with square caps and mitred joins.
- A powder texture built per pixel from base grey, soft noise and bright and dark sparkle specks, plus a cached body layer with a cut-out screen well.
- A `stair()` function that converts any diagonal into alternating horizontal and vertical steps.
- A demo built as a precomputed list of timed polyline pieces, where each next piece is joined from the stylus's last position.

**SFX.** bed `room`, long continuous pencil `scribble` scratches, `click` as knobs and items land, `glitch` + a burst of `whoosh` hits for the shake, `count` for the numeral, `tick` on the emphasis, `chime` to resolve.

**When to use it.** Nostalgic, playful, constraint-as-charm explainers where a single unbroken line telling the story is part of the joke.
