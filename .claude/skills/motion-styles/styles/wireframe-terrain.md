# Hidden-Line Wireframe

**Family:** Dimensional · **id:** `wireframe-terrain`

**Look.** Vector-display 3D on a deep navy night sky with a few stars. A perspective mesh of rolling terrain recedes to the horizon in glowing phosphor-cyan lines, with true hidden-line removal so ridges occlude what lies behind them. A rotating wireframe sphere with culled back lines stands in for the hero object. A HUD frame of corner brackets, a heading ruler and altitude and time readouts sits over everything.

**Motion.** The mesh scrolls continuously under the camera and is revealed row by row from near to far, with a brighter scan row at the leading edge. The sphere draws its latitude and longitude lines in and then rotates on a tilted axis. The heading ruler and readouts tick with time, and dashed arrows animate with a moving dash offset.

**How it explains.** Titles type on in bold monospace capitals with a blinking block cursor and an optional bracketed plate behind them. Labels are bracketed HUD tags: a dark glass rectangle with corner brackets that snap in and uppercase text that types on. Arrows are dashed glowing vectors with a chevron head. Boxes are dark panels with a faint scan grid and corner brackets that close in. Counters are amber glowing monospace numerals. Emphasis is a lock-on reticle: four amber brackets close in and spin to rest, then a ring, crosshair ticks and a "LOCK" tag flash on. The scene change is a bright scan bar that sweeps down wiping to a night grid, then sweeps again to reveal the next scene.

**Palette.** bg `#02051a`, `#081440`, `#0f2160`, cyan `#7feaff`, hot white `#e8fbff`, amber `#ffd36b`, red `#ff5a6e`, dim blue `#2a5c9a`.

**Fonts.** Space Mono (titles and counters), IBM Plex Mono (HUD labels, readouts, LOCK tag).

**Signature techniques.**
- `terrain()` builds a grid from a ridged-noise height function, projects it with a simple perspective, then paints each row of quads with the night colour before stroking, working far to near. That fill is what hides lines behind nearer ridges.
- `glowStroke()` strokes the current path three times (wide faint, medium, bright core) with additive blending for phosphor bloom.
- `sphere()` samples latitude and longitude curves and breaks the pen whenever a point faces away from the camera, so back lines are culled.
- The finish draws the HUD, a repeating 2-pixel scanline pattern, a heavy vignette and grain.

**SFX.** beds `hum` + `space`, `type` clicks under every typed readout, `riser` as the terrain and sphere build, `blip` notes (rising scale for the chips) with `click`, `whoosh` for the scan sweeps, `count`, `glitch` + paired `blip`s on lock-on, `chime` to close.

**When to use it.** Technical, data-driven and sci-fi pieces: analytics, telemetry, "systems online" reveals and anything that should feel like a flight or mission console.
