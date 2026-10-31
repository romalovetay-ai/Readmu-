# Tech Glow Explainer

**Family:** Popular Explainer Looks · **id:** `tech-glow`

**Look.** The polished AI and tech YouTube motion-graphics look. A deep navy-to-indigo background carries a faint perspective floor grid that fades into the horizon, two large drifting violet and blue glows, and slowly rising cyan and violet particles. Dark glass cards with thin gradient neon borders and line icons sit on top, and everything bright blooms.

**Motion.** Glows drift in slow loops and particles float upward. Headlines rise word by word. Cards pop in with a back-ease and their icons draw on. Connectors trace on, then small white-hot light pulses race along them forever.

**How it explains.** Titles are gradient headline type with the second half of the words in cyan to violet. Labels are dark glass pills with a neon border and a glowing status dot. Arrows are glowing connector lines ending in a dot, with two light pulses travelling along them once drawn. Boxes are dark gradient cards with a glass sheen and optional icons (play, chip). Counters are large gradient numerals with a heavy glow. Emphasis is two expanding rings of light plus a soft flash. The scene change is a light-speed streak field that ends in a white-cyan flash at the midpoint.

**Palette.** bg `#070b24`, navy `#0b1238`, indigo `#1d1a63`, cyan `#3ee6ff`, blue `#4d7cff`, violet `#9b5cff`, pink `#ff5fd2`, mint `#3dffb5`, text `#e9eeff`, dim `#93a0c8`.

**Fonts.** Space Grotesk (headlines and counters), Inter (label text).

**Signature techniques.**
- A cached background with the grid masked by a `destination-in` gradient, then per-frame additive glows and particles.
- `K.drawOn` connectors with shadow glow, plus pulses drawn as two stacked radial glows at a point trimmed along the path.
- Cards use gradient strokes, shadow blur and a clipped top sheen; icons are dashed paths whose dash length grows with progress.
- The finish pass takes a downscaled, blurred copy of the frame and screens it back on for bloom.

**SFX.** bed `hum`, an opening `swell`, `blip` notes as items land (rising for the platform chips), `pop` for cards, `whoosh` for connectors, `riser` + `thud` on the streak transition, `count`, `ding` on the emphasis, `chime` at the end.

**When to use it.** AI, SaaS and developer product explainers and architecture or pipeline diagrams, where nodes and data flow should look slick and modern.
