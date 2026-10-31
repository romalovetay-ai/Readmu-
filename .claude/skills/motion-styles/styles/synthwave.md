# Synthwave Outrun

**Family:** Retro UI & Neon · **id:** `synthwave`

**Look.** An 80s outrun poster. A starry indigo-to-magenta sky holds a striped sunset sun with a pink halo, wireframe purple mountains sit on the horizon, and a pink neon grid runs down to the camera along a dark road edged in cyan. Lettering is chrome, italic and extruded, with a hard horizon line cut inside the letters, next to hot-pink neon script.

**Motion.** The grid lines and road dashes race toward the camera continuously. Chrome letters scale in with a back-ease and carry a sweeping glint. Neon text flickers on. In the demo the camera tilts up so the horizon drops, and everything is bathed in bloom with faint scanlines.

**How it explains.** Titles and counters are the chrome lettering. Labels are neon tube text in Orbitron or Yellowtail script. Arrows are neon tube paths with a glowing white core and a V head. Boxes are dark glass panels outlined by a neon tube that traces itself on. Emphasis is a lens flare: a soft burst, a horizontal cyan streak and an eight-point star. The scene change sweeps stacked sun-stripe bars in from top and bottom to cover the frame, then parts them.

**Palette.** pink `#ff3ea5`, cyan `#3ef0ff`, purple `#7a2cff`, gold `#ffcf4a`, sky `#0a0420`, `#2a0a52`, horizon `#7a1a7a`.

**Fonts.** Orbitron (chrome titles, counters, tube labels), Yellowtail (neon script labels).

**Signature techniques.**
- `chrome()` stacks an extrusion, a dark stroke and a sky-to-sunset gradient with a hard line at the horizon, sheared into italic, plus a `source-atop` glint sweep limited to the letters.
- `neonPath()` and `neonText()` layer a wide faint glow, a saturated tube and a whitened core; `neonOn()` randomly stutters the alpha so tubes flicker on.
- The mountains are a cached wireframe mesh over a dark fill, and the sky is a double-height layer so the tilt reads as camera motion.
- The finish blurs a quarter-res copy of the frame at two radii and adds it with `lighter`, then scanlines, vignette and grain.

**SFX.** bed `space`, `swell` chords on the opening and tilt, `thud` + `whoosh` on the title, `pluck` notes (a rising scale for the platform chips) with `click`, `glitch` flickers, `stamp` as the wordmark lands, `count` + `riser` into the counter, `ding` + `thud` and `stamp` on the flare, `chime` to close.

**When to use it.** High-energy launches, hype reels, music and nightlife content, and anything meant to feel like a neon 80s poster.
