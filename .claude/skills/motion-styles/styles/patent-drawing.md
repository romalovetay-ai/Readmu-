# Patent Drawing

**Family:** Illustration · **id:** `patent-drawing`

**Look.** A 1930s US patent sheet on yellowed paper that has been folded in three (light ridge plus dark valley
creases), browned toward the edges, with a faint coffee ring and a thin ruled border. The header is typeset: date
at left, "Patent No." at right, the sheet count in italics. Drawings are ruling-pen line art: crisp, even black
lines in a simple oblique projection, with heavier shade lines on the lower and right edges (light from the upper
left), parallel-line shading on the dark faces, stipple on the screen. Parts carry reference numerals on curved
leaders, each figure is captioned "FIG. n." in bold serif, and the sheet is signed by the inventor in ink.

**Motion.** The draughtsman inks one stroke at a time: outlines first, then shade lines, then hatching and stipple,
then the numerals and captions. Dial needles creep. Sheets change by sliding the next sheet across the table.

**How it explains.** Each thing is a figure (the video is a monitor, Creator OS is a cabinet with dials and an
output slot), ruled hairline arrows with small solid heads carry the flow to numbered outputs, the number rolls on
a drawn odometer whose lower drums roll the higher ones over, and the examiner's red pencil rings the result.

**Palette.** paper `#efe3c4`, ink `#1b1813`, examiner red `#b8322a`.

**Fonts.** Libre Baskerville (header, captions, labels), Courier Prime 700 (odometer digits),
Mrs Saint Delafield (signature, decorative only).

**Signature techniques.**
- `ink(polys, p)` spreads one progress value over a list of polylines by length, so a whole figure is inked in
  stroke order.
- Shade-line convention baked into `isoBox`: a second, thicker pass on the bottom and right edges.
- Odometer drums: digit k shows `floor(v / 10^k) % 10`; the ones drum rolls by the fractional part, every higher
  drum only during the last tenth of the drum below it; each window carries curvature hatching.
- Fold creases drawn as paired light/dark lines in the cached sheet.

**SFX.** draw `pen` (ruling pen), `type` for typeset text, land `tick`, emphasis `pencil` scribble + light
`stamp`, transition `paper`, bed `room`.

**When to use it.** "How it works" breakdowns, product mechanics, inventions and launches, anything that should
feel engineered, official and clever.
