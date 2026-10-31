# Gouache Travel Poster

**Family:** Painterly · **id:** `gouache-poster`

**Look.** A mid-century travel poster painted in flat, opaque, matte colours on cream paper. Three sky bands in pink and peach, an orange sun, teal and deep-teal ridges with cream snow caps, a sage foreground and a navy lettering band along the bottom, all inside a cream border. Every shape has faint dry-brush streaks and a ragged dry edge where the paint thins.

**Motion.** The sun slowly rises, the ridges drift sideways at different speeds for parallax, and three small birds glide across the sky. Shapes are painted on by a brush front that sweeps left to right, and lettering is revealed with a left-to-right wipe.

**How it explains.** Titles are Bebas Neue capitals in the navy band, wiped on with a slightly offset second pass. Labels are cream painted tags with navy lettering. Arrows are thick flat poster arrows with a wide triangular head, painted in one pass. Boxes are rounded cards with an offset flat shadow block. The counter is large navy lettering, and emphasis is an 18-point mustard starburst that pops in behind the number. The scene change is a fresh coat of cream swept across the board with a dry front edge.

**Palette.** cream `#efe5cf`, peach `#f3b79a`, pink `#e98f86`, sun `#e8582a`, teal `#4f9a98`, deep `#24626a`, sage `#9cbf9b`, navy `#1e3350`, mustard `#e2a93b`, ink `#1b2638`, plus sky band `#f6cfa8`.

**Fonts.** Bebas Neue (titles, tags, counter), Oswald 700 (small sub-lines in the band).

**Signature techniques.**
- A `paint()` helper fills a path opaque, clips a cached streak tile inside it, then strokes the outline with a per-colour dry-brush tile for the ragged edge.
- A bounding-box clip that sweeps across simulates the brush pass.
- Text gets streaks via `source-atop` plus a faint offset duplicate for hand-lettered unevenness.
- The finish multiplies a chalky paper texture, adds a warm vignette and soft-light grain.

**SFX.** Bed `room`. Strokes use the `brush` scribble, labels land with `pop`, emphasis uses `stamp`, the transition uses `whoosh`. The demo score adds an opening `swell`, `count` for the number and a closing `chime`.

**When to use it.** Journey, route and "destination" stories, launches framed as a trip, or anything that wants warm retro optimism and a bold headline.
