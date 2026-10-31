# Holographic Foil Card

**Family:** Light & Imaging · **id:** `holographic-foil`

**Look.** Holo-rare trading cards and die-cut stickers on a dark desk. The cracked-ice foil's rainbow diffraction shifts with the card's tilt, and every ice facet has its own angle and catches the light at a different moment. Lettering is foil-embossed with bevels and a sweeping specular glint. Printed ink sits on top (name bar, cream text panel, rarity and serial). Glitter flecks twinkle, and a rainbow spill lies on the desk.

**Motion.** Cards are dealt in with a spin and settle with an overshoot. Stickers slap down oversized and snap to size. The foil keeps shifting as the light moves, and glints sweep through cards and lettering. Confetti scatters from the emphasis.

**How it explains.** "My Video" is a common card and Creator OS is the holo-rare card. Labels are die-cut foil stickers with ink lettering, and arrows are foil ribbons with a sticker arrowhead. The number is foil-embossed digits with a glint sweep on the hit. The emphasis is a foil sunburst frame slapped behind the number with holo confetti. The scene change is a giant card flip to its back ("CREATOR OS" emblem) and away again.

**Palette.** desk `#121116`, ink `#191428`, cream `#efe9dc`, silver `#c9ccd6`; foil accents violet `#8a6cff`, pink `#ff6fc3`, cyan `#5fe3ff`, gold `#ffd36b`.

**Fonts.** Russo One (embossed lettering, stickers), Inter 600/800 (printed card text).

**Signature techniques.**
- A precomputed seamless Voronoi cracked-ice tile (190 facets with toroidal distance, bright and dark crack lines), rendered in 12 diffraction phases with periodic hue bands, a per-facet tilt offset and a per-facet specular term.
- Each frame cross-fades two neighbouring phases by tilt, then adds a depth gradient and a screen-blended glint band.
- Foil text renders into a reused buffer (white glyph, `source-in` rainbow gradient, `source-atop` glint) over drawn bevels.

**SFX.** bed `room`, `whoosh` + `paper` + `thud` card deals, `stamp` + rising `pop`s for sticker slaps, `chime` when the rare card lands, `count`, `stamp` + `ding` + a `tick` sparkle run on the sunburst, `chime` to resolve.

**When to use it.** Product reveals, features as collectible "cards", tier and plan comparisons, gamified or Gen-Z-leaning content, anything that should feel premium and shiny.
