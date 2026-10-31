# Op Art Sphere

**Family:** Generative & Type · **id:** `op-art`

**Look.** A hard-edged black and ivory checkerboard that is pushed through Riley-style folds and a Vasarely lens until it reads as a bulging sphere. Red cells flip in from the centre of the lens. Everything is flat acrylic colour on a primed linen canvas, with a faint weave and a whisper of vignette.

**Motion.** The folds ripple in and keep drifting with a phase tied to time, then the lens swells slightly past its size and settles. Red cells appear progressively outward from the centre. The finish pass is nearly static: linen weave, brush drag, vignette and very light grain.

**How it explains.** Every cell is a warped quad of one grid, so the vibration is real geometry. Titles are a solid ivory slab with black edge bars that wipes open. Labels are black (or red) blocks with ivory type inside an ivory keyline. Arrows are blunt black bars with a mitred head and an ivory outline so they read over the checkers. Boxes are ivory panels in a heavy black frame with a red corner block that pop in with a back ease. Counters sit on a full-width ivory band with black rules. Emphasis is five stepping concentric rectangles, alternating red and black. The scene change is a Riley fold: the picture is crushed into crowded black and ivory columns that cover the frame at the midpoint.

**Palette.** ivory `#efe9da`, black `#121212`, red `#d22b21`, canvas `#e6dfcd`.

**Fonts.** Archivo Black (headlines, labels and counter figures).

**Signature techniques.**
- A `warp()` function applies sine column folds and then a radial sine magnification lens to every grid vertex, and each checker cell is filled as a quad between warped vertices.
- Red cells replace ivory ones inside 66 percent of the lens radius, gated by a progress value.
- The finish pass overlays a cached 64px linen weave and a soft-light brush-drag texture.
- The transition draws 40 vertical bands in six staggered rows with sine skew and widening coverage.

**SFX.** bed `room`; clicks on each grid tick, `thud` on the first beat, `pop` and `click` for the box, `whoosh` + `riser` as the lens swells, `tick` runs for the red cells, `whoosh` + clicks on the transition, `count` for the counter, double `stamp` on the emphasis, `chime` to resolve.

**When to use it.** Hypnotic, graphic explainers where one idea (a hub, a lens, a focal number) should dominate a hard-edged frame. Good for platform-fan-out and "one thing, many outputs" stories.
