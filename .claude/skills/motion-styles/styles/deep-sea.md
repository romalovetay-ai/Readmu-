# Bioluminescent Deep Sea

**Family:** Light & Imaging · **id:** `deep-sea`

**Look.** The midnight zone: near-black teal water with faint surface shafts, three parallax layers of marine snow, and nothing lit but living light. A jellyfish has a pulsing rim and a flickering nerve net. Containers are comb jellies with rainbow comb rows, siphonophore chains act as arrows, and an anglerfish lure glows. A small depth gauge ticks in the corner.

**Motion.** The camera sinks: snow streams upward and the depth readout climbs. Words gather out of plankton motes that swim onto the glyph shapes before the word glows on. The bell pulses, nerve-net nodes switch on one by one, and chain beads light segment by segment.

**How it explains.** The hub is a jellyfish whose nerve net is the system. Its tentacle side feeds siphonophore chains out to each label. The number glows on, and the emphasis is a plankton bloom-burst with a glowing wave ring. The scene change is a descent into darkness (snow streaks up), then a lure switches on and lights new water.

**Palette.** water `#020a12`, cyan `#5ff6ff`, teal `#2fd6c0`, blue `#3f8cff`, magenta `#ff5fd2`, amber `#ffb54a`, pale `#d9fbff`.

**Fonts.** Fraunces italic 600 (titles), Space Grotesk 500/700 (labels, digits), IBM Plex Mono (depth gauge).

**Signature techniques.**
- Glyph sampling: each text is rasterised once and sampled into points (cached), so plankton motes can converge onto the letters.
- Everything luminous is drawn additively.
- The finish runs a quarter-res thresholded bloom plus an eighth-res wide bloom, a heavy vignette and fine grain. The water plate (gradient, shafts, fbm murk) is cached.

**SFX.** bed `ocean` + `space`, a `swell` + soft `riser` as the title gathers, `blip` arpeggios as chains light, `pluck`s per label, a falling `whoosh` + `thud` + `ding` for the descent and lure, `count`, `chime` on the bloom.

**When to use it.** Calm, wonder-filled explainers, "hidden systems" and networks, AI and biology metaphors, anything that should feel mysterious but beautiful.
