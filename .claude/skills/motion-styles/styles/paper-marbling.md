# Ebru Paper Marbling

**Family:** Generative & Type · **id:** `paper-marbling`

**Look.** A Turkish ebru bath: a cream ground covered in navy, sky, ochre, teal and cream paint, each drop a hairline-outlined polygon. Bookbinder cream labels with double navy rules sit on top, and the whole sheet carries laid-paper chain lines, fibre and a soft brown vignette.

**Motion.** The bath is simulated with real marbling transforms on a timeline. A stone ground of 44 drops rains in, a comb rake drags it into gel-git flames in two offset passes, stacked ring drops land at the node, and a stylus pulls them into a tulip. Labels fade up and rise a few pixels. The finish pass can add a slow wet sheen that sweeps across the bath.

**How it explains.** Titles and labels are cream bookbinder slips with a drop shadow, a heavy and a hairline navy rule, and engraved serif or small-caps type. Arrows are tapered, slightly wavering ink strokes finished with a leaf-shaped head. Boxes are the same label stock as a card. Counters are navy serif numerals on that card. Emphasis is concentric suminagashi rings in red, navy, ochre and teal blooming outward. The scene change lays a sheet of paper over the bath from the top and lifts it off again with a curling highlight and shadow at the moving edge.

**Palette.** ground `#efe2c0`, navy `#1e2d6b`, sky `#86afd8`, ochre `#e0a535`, teal `#1d867c`, cream `#f4ead2`, red `#b4322b`, ink `#1a1a24`, label `#f6eedb`, green `#4f7a3a`.

**Fonts.** Cormorant Garamond 700 and italic 600 (titles, counter), Cormorant SC 700 (labels).

**Signature techniques.**
- Drop operation: each new drop pushes every earlier boundary point outward by `p' = c + (p - c) * sqrt(1 + r^2 / |p - c|^2)`.
- Tine operation: points are displaced along the stroke by `z * 2^(-d / c)`, with an optional repeating comb spacing.
- Edges are resampled so long segments stay smooth, and each cumulative state is cached, with in-flight operations applied partially.
- Laid-paper texture is multiplied over the bath in the finish pass.

**SFX.** bed `ocean`; soft `pluck` notes for the raining drops, brush `scribble` for each rake and stylus pull, descending plucks for the ring drops, pen `scribble` + `paper` per platform item, `paper` + `whoosh` on the transition, `count`, then `chime` + `swell` chord on the emphasis.

**When to use it.** Elegant, contemplative explainers, brand stories and cultural or craft topics where a fluid, generative backdrop should evolve as the story builds.
