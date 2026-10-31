# Vaporwave

**Family:** Retro UI & Neon · **id:** `vaporwave`

**Look.** A pastel-neon dreamscape playing back on a worn VHS tape. A purple-to-pink sky with stars holds a sliced sunset sun, a glowing magenta grid floor runs under it, and dark palm silhouettes frame the sides. A procedurally drawn marble bust, lit lavender with pink and cyan rim light and veins, stands on a black and white checkerboard plinth. Katakana lines and pastel pop-up windows add the rest.

**Motion.** The sun's stripes crawl, the floor grid scrolls toward the camera and the tape finish runs on every frame. The bust and sliced elements glitch in horizontal slices, displaced on random frames. A tracking band crawls down the picture, and the VCR on-screen display counts the tape time.

**How it explains.** Titles and labels are typed out character by character with a cyan and magenta chroma split, in Montserrat, VT323 or Japanese serif. Arrows are glowing pastel lines with a filled head. Boxes are pastel pop-up windows with a gradient title bar and a close button that blink in over three whole-frame steps. Counters are huge VT323 digits with a wide chroma split. Emphasis blows the RGB split wide on a strip of the frame and adds a ring of sparkle ticks. The scene change is a tape cut: tearing fast-forward slices, a blue VCR screen with "FF", then a vertical roll back into lock.

**Palette.** pink `#ff71ce`, cyan `#01cdfe`, mint `#05ffa1`, lavender `#b967ff`, yellow `#fffb96`, deep `#1a0a3a`, sky `#2b0f5c` to `#ff9ad5`, plus VCR blue and marble whites.

**Fonts.** VT323 (OSD, labels, counter), Noto Serif JP (katakana lines), Montserrat (English titles and window text).

**Signature techniques.**
- `bustLayer()` builds the bust from bezier curves for shoulders, neck and profile, adds curls, marble veins with `source-atop`, and a pink-to-cyan side shading, then caches it.
- `sliced()` draws a layer in 18 horizontal strips and offsets random strips on glitch frames.
- The finish blends a half-resolution resample, a screen and multiply chroma split, a crawling tracking band with sliced displacement and head-switch noise, then scanlines, grain, vignette and the OSD ("PLAY", "SP", date stamp).
- `chroma()` draws any string three times, cyan left, magenta right, main colour on top.

**SFX.** beds `tape` and `vinyl`, a low `click` + `whoosh` and `swell` chord at the start, `glitch` and `blip` notes as each item lands, `pop` and `pluck` as the bust arrives, rewinding `whoosh` and clicks for the tape cut, `count`, `glitch` + `ding` on the emphasis, `swell` + `chime` to end.

**When to use it.** Nostalgic, ironic or aesthetic-forward pieces, music and culture content, and anything meant to look like found 90s footage.
