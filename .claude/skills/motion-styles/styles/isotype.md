# ISOTYPE Pictograms

**Family:** Data & Information · **id:** `isotype`

**Look.** A Vienna Method picture statistic on warm cream litho paper. Identical flat pictograms (a person, a screen) stand in strict grids, each symbol standing for a fixed quantity, with remainders shown as cut partial symbols. Only a few muted inks are used: navy, brick red and ochre, with near-black ink. Tiny paper-coloured specks punch voids in the ink, and a slightly offset red layer sits under the numerals.

**Motion.** Everything runs on a stepped 12 fps clock, so things stamp on in discrete jumps rather than easing. Titles appear a whole word at a time, arrows grow in six steps, symbols stamp in one after another, and the grain also steps with the 12 fps time.

**How it explains.** Titles and labels are letterspaced geometric sans capitals. Arrows are solid flat Isotype arrows with a broad triangular head, ochre by default. Boxes are solid ink blocks with no outline. The counter is stamped black numerals with a red misregistered copy behind. Emphasis is a heavy red frame, slightly askew, that lands in steps. The scene change is a stepped sideways pan along the chart sheet: the old panel slides off while the next slides in, with a vertical ink rule on the seam.

**Palette.** paper `#efe7d4`, navy `#294c63`, red `#c2432c`, ochre `#d49a33`, ink `#26231f`, rule `#8c8070`.

**Fonts.** Space Grotesk 700 (titles, labels, numerals), Space Grotesk 500 (key and small notes).

**Signature techniques.**
- A `symbolRow()` helper repeats a drawn pictogram and clips the last one to a fraction width for partial symbols.
- Pictograms (person, screen) are drawn with plain rects, arcs and paths in a square cell.
- A cached "ink voids" layer of paper-coloured specks laid over the final frame.
- Letterspacing set via `ctx.letterSpacing`, with a cached paper texture as the background.

**SFX.** Bed `room`. Landings use `stamp`, emphasis uses `stamp`, the transition uses `paper`. The demo score adds `click` ticks per row, a `count` run, `thud` and a closing `chime`.

**When to use it.** Statistics, comparisons and "how many" stories where counting identical icons makes the number tangible, in a serious, historical infographic voice.
