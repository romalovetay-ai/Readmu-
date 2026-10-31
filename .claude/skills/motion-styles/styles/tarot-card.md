# Tarot Card

**Family:** Illustration · **id:** `tarot-card`

**Look.** An art-nouveau tarot reading laid out on crushed burgundy velvet. Each trump is foxed cream cardstock
with browned, worn edges, a stamped gold-foil double border with navy corner roundels, a Roman-numeral cartouche,
an arched window of flat, muted lithograph colour (teal, rust, mustard, navy, lavender cloud bank, sunburst rays)
inside bold even outlines, and a cream name plaque in Roman capitals. Card backs are navy with a gold star field
and a central sun. Minor items are small foil-edged plaques with drawn celestial marks.

**Motion.** Cards are dealt in from off the table face down with a spin, then flip face up (scale-X through zero
with a lift and a growing shadow). A sheen slides across every piece of gold foil as a function of t, planets
drift on the orbit rings inside the art, and a pool of candle light wanders over the velvet pile.

**How it explains.** As a spread. A card for each thing, gold filigree strands (double strand with a root curl and
a star head) for flow, foil-stamped capitals for headlines (each letter presses in with a flash of sheen), an
engraved brass plaque for numbers, and a burst of gold rays and four-point sparkles on the key moment. The scene
change gathers the spread: a giant card back sweeps across and lifts away.

**Palette.** velvet `#3b0f22` / `#7a2444`, cardstock `#eadcb6`, outline `#2b2224`, gold `#c9a24a` / `#fff0b8`,
navy `#1f2a4f`, teal `#2f6b62`, rust `#b0563c`, mustard `#c99a3a`, lavender `#9a8fb3`, cream `#f3e6c4`.

**Fonts.** Cinzel 700 (titles, numerals, plaques), Cormorant Garamond italic 600 (captions).

**Signature techniques.**
- Foil = a linear gradient whose bright stop is placed at `frac(t * 0.18)`, reused for every gold stroke and fill.
- Velvet = warped-noise ridges (`|sin|^3` of an fbm-warped diagonal) computed once at quarter resolution, upscaled.
- Cardstock = a cached full-frame paper with foxing spots, sampled into each card so the texture rides with it.
- The flip is `scale(|cos(pi * p)|, 1)` with a lift scale and shadow offset at the midpoint.

**SFX.** draw none, land `paper` (card snaps) + rising `pluck`s, emphasis `chime` + `swell`, transition `whoosh`
+ `paper`, bed `room`.

**When to use it.** Predictions, "what the cards say about your strategy", trend forecasts, personality or
archetype breakdowns, anything mystical, premium or ritualistic.
