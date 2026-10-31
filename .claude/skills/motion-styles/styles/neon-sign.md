# Neon Sign at Night

**Family:** Light & Imaging · **id:** `neon-sign`

**Look.** Hand-bent glass neon on an old brick wall after rain. Unlit tubes show as grey tinted glass. Lit tubes have white-hot cores inside saturated colour halos. There are standoff clips, electrodes at the tube joins and a dark feed wire. Light spills across the brickwork and smears in the wet pavement below.

**Motion.** Every sign buzzes on letter by letter with a seeded stutter. One letter in each headline keeps failing. Puddle reflections shiver in rippling strips and raindrops land as expanding rings.

**How it explains.** One long wall of signs. Containers are rounded-rectangle frame tubes. Arrows are segmented chase-light tubes (painted-out gaps) that ignite toward their target, finishing with a chevron. Numbers are neon digits that dim and re-light as they change. The emphasis is a blinking red oval tube with rays. The scene change is a whip-pan along the wall that smears into horizontal streaks.

**Palette.** pink `#ff3f8e`, cyan `#2fe6ff`, amber `#ffb13d`, violet `#a95cff`, green `#45ff8f`, red `#ff3030`, warm white `#fff0dc`, brick `#5c2a20`, night `#07060a`.

**Fonts.** Tilt Neon (single-stroke tube lettering) for everything.

**Signature techniques.**
- Tube rendering in three passes: a dim glass base that is always visible, a coloured stroke-plus-fill halo via `shadowBlur`, and a near-white core fill. Letters are grouped into runs of equal brightness so flicker stays cheap.
- A cached procedural brick plate (per-brick colour, chips, grit overlay, mottled grime, night falloff).
- The finish reflects the wall into the pavement through a flipped, blurred half-res copy redrawn in 5px strips with sine offsets. Two bloom passes follow: a tight halo at quarter res and a wide wash at eighth res for the colour spill on the bricks.

**SFX.** bed `hum` + `tape` (rain hiss), `click` relays + `glitch` stutters as tubes ignite, `tick` chase steps, `count`, three `blip`s for the blinking emphasis, `whoosh` whip-pans, `chime` to resolve.

**When to use it.** Launches, "open now" announcements, nightlife or retail energy, punchy lists where each item can be its own sign.
