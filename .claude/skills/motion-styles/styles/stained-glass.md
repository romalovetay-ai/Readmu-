# Cathedral Glass

**Family:** Painterly · **id:** `stained-glass`

**Look.** A leaded Gothic arched window in a dim stone nave. The window is a mosaic of hand-cut pieces of deep blue, violet and the odd ruby, green or gold glass, each with its own gradient, streaks and seed bubbles, held in thick dark lead came with a ruby and gold border. Pale banner pieces carry painted lettering, and daylight blazes through in dusty rays.

**Motion.** A band of sunlight sweeps slowly across the panes, four soft rays drift into the nave and dust motes float down. Panels light up piece by piece from the top left. Titles are painted in left to right across the banner glass.

**How it explains.** Labels and titles are grisaille lettering on a pale banner piece cut into sections by lead. Arrows are strips of glass between two leads, cut into pieces, ending in a ruby glass arrowhead. Boxes are leaded panels whose pieces light up one by one while the rest stay dark. Counters are big grisaille numerals on banner glass. Emphasis is a ring of ruby glass pieces that completes and then flares with light. The scene change is a cloud crossing the sun, dimming the window to dusk and back.

**Palette.** blue `#1f3f9a`, deep blue `#14245e`, ruby `#b3152b`, gold `#e3a51e`, green `#2f7a3a`, violet `#5b2d82`, amber `#d9822b`, pale glass `#efe1b6`, lead `#17140f`, grisaille paint `#3a2412`, stone `#2a241e`.

**Fonts.** Grenze Gotisch (title lettering), Cinzel (labels, counter digits, the demo wordmark).

**Signature techniques.**
- `piece()` fills each polygon with a tinted gradient, adds a clipped streak and a few bright seed dots.
- `cells()` makes a jittered grid of quads, some split into triangles, used for the window mosaic, panels and arrow strips.
- `came()` strokes the lead as a dark core with a faint upper highlight, with solder blobs at panel corners.
- The stone wall, the window and a streaky glass texture are cached layers; the finish overlays the texture, a screen-blended light sweep, rays and dust.

**SFX.** bed `space`, `swell` chords on the title and the dusk transition, `chime` as pieces land (a rising run for the platform chips), `tick` as panels light, `ding` and `pluck` on the play button, `count` for the counter, `ding` + `stamp` on the emphasis ring.

**When to use it.** Reverent, monumental or heritage topics, "foundations" and origin stories, or anything where reveals should feel like light arriving.
