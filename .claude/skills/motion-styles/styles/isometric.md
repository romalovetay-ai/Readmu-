# Isometric Pastel

**Family:** Dimensional · **id:** `isometric`

**Look.** A soft lavender-white backdrop with a floating isometric tile at a true 30 degree projection. Everything is built from three-tone flat blocks (lit top, mid left face, darker right face) with long soft violet ground shadows, ambient occlusion where walls meet the floor and crisp white edge highlights. Mint lollipop trees and tiny walking figures give scale, and coral is the accent colour.

**Motion.** Tiny pale cubes bob in the background. Blocks and tiles pop up on a back-ease spring, server LEDs blink, roof fans spin, and the little people walk with a bob. Dotted arrows march along their path and data cubes ride them once they are drawn.

**How it explains.** Labels are white pin tags with a coral icon square. Arrows are dotted coral arcs with a dot at each end and small cubes travelling along them. Boxes are floating isometric slabs with faint floor tile lines. The counter is a big navy number sheared onto an isometric billboard plane. Emphasis is three expanding ground-plane ellipse rings plus coral and mint sparkle ticks. The scene change is a wave of pastel cubes that pop up to tile the whole screen and then sink away, with a few coral and mint cubes mixed in.

**Palette.** bg `#f3f1fa`, ink `#2d3058`, sub `#6f6e98`, coral `#ff6b5b`, mint `#7fc8a8`, blue `#8e9bd0`, lav `#d8d4ea`, side `#b9b1dd`, navy `#4a5488`, white `#ffffff`, floor `#fbf9f6`.

**Fonts.** Inter 800 (titles and counter), Inter 700 (tags), Inter 600 (small labels).

**Signature techniques.**
- A projection helper `ip()` maps (x, y, z) to screen with cos 30 and half-slope axes, and a `block()` function draws any box with shaded faces and returns face mappers so decals (screens, server panels, billboard) can be placed on a face.
- Long shadows are a linear-gradient parallelogram cast down and to the right.
- Text is sheared onto the plane with `ctx.transform(C, 0.5, 0, 1, 0, 0)`.
- Finish is a faint top-to-bottom wash, a light vignette and soft-light grain.

**SFX.** Bed `room`. Labels land with `pop`, emphasis uses `ding`, the transition uses `whoosh`. The demo score adds `click`, `thud` on block landings, `count` for the number and a closing `chime`.

**When to use it.** Systems, infrastructure and product-flow explainers where a tidy miniature world helps, such as pipelines, platforms, hubs and city-style diagrams.
