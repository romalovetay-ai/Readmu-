# Editorial Chart

**Family:** Data & Information · **id:** `editorial-chart`

**Look.** A prestige-newspaper data graphic on pale salmon newsprint. A thin black rule across the top carries a short claret block and a small bold claret eyebrow. A Libre Baskerville serif headline sits below, with hairline grid lines, quiet greys against a single claret highlight colour, and a small-caps Inter source line closing the page.

**Motion.** The masthead rule draws across. The headline sets line by line, each line rising a few pixels as it fades in. Labels slide in a few pixels while fading. Panels grow downward from a heavy top rule. Hand-written Caveat notes type on letter by letter. The finish is only a faint warm vignette and soft grain.

**How it explains.** Direct labels are Inter semibold, optionally in the serif. Arrows come in two kinds: newspaper elbow leaders (hairline, right angles, a small dot where they land) and inked hand arrows that taper with an open two-stroke head. Boxes are hairline inset panels with a heavier top rule on a translucent cream fill. Counters are tabular serif numerals in claret. Emphasis is a hand-inked ring around the key point, with an optional expanding claret pulse on the data point. The scene change scrolls the page: the finished panel slides up and off the top while the next rises from below, with an ink rule between the two stories.

**Palette.** paper `#fff1e5`, ink `#33302e`, claret `#990f3d`, grey `#b9afa5`, grey2 `#857d75`, grey3 `#66605c`, grid `#e3d5c8`, teal `#0d7680`, vignette `#8a6a55`.

**Fonts.** Libre Baskerville 400/700 (headline, counters, serif labels), Inter 400/600/700 (labels, eyebrow, source line), Caveat 600/700 (hand-written annotations).

**Signature techniques.**
- Newspaper furniture helpers for the masthead rule, eyebrow and source line, with a "graphic by the data desk" credit in landscape.
- A hand arrow whose line width swells through the middle using a sine of path progress.
- A page-scroll transition that snapshots the current frame to a temp layer and redraws it offset over fresh paper.

**SFX.** bed `room`, quiet `tick` on labels, pen and pencil `scribble` for annotations, `pluck`, `paper` + soft `whoosh` for the page scroll, `count` for the numeral, `stamp` on the emphasis, `chime` to resolve.

**When to use it.** Data stories, comparisons and "here is the number" moments that should look authoritative and journalistic rather than flashy.
