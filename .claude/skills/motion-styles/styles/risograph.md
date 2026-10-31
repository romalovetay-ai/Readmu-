# Risograph Zine

**Family:** Print · **id:** `risograph`

**Look.** A one-page zine run through a risograph drum. Three fluorescent spot inks (pink, medium blue, yellow) are multiplied on off-white stock, each as its own pass with a small permanent misregistration. Solids are grainy and patchy with roller streaks and paper-tooth pinholes, lighter areas use coarse dot tints, and overlaps go purple or green.

**Motion.** Each ink reveals top-down as if the sheet were passing under the drum. Plates can slide into and out of registration, and the grain re-seeds at 8 fps so the print "boils". Type lands as two plates, pink first, blue second.

**How it explains.** Titles are display type printed as a pink pass and a blue pass offset a few pixels. Labels are mono captions on a yellow highlighter swipe. Arrows are round blue dots laid along the path with a solid triangular head. Boxes are a yellow solid, a pink dotted tint on the right half and a blue key line, each rolled in as a separate pass. Counters are the same two-plate type, large. Emphasis is a fat pink marker loop scribbled around the number. The scene change feeds a fresh sheet through the drum: it slides down over the frame and out the bottom, its leading edge wet with three bands of yellow, pink and blue ink.

**Palette.** pink `#ff48b0`, blue `#0078bf`, yellow `#ffe14a`, paper `#f4efe3`.

**Fonts.** Archivo Black (display type and counters), Space Mono 400/700 (captions).

**Signature techniques.**
- A 256px ink tile is generated pixel by pixel from fbm patchiness, roller-streak sine bands and random pinholes, then used as a repeat pattern for fills and strokes.
- Every ink pass is drawn with the multiply composite, shifted by a base misregistration plus an animated per-ink offset.
- A tint tile of dots at a chosen pitch gives the dotted halftone look.
- The finish pass adds quantised-time grain and a faint vignette, and the background has stray drum specks and ghost roller lines.

**SFX.** bed `tape` plus `room`; spray `scribble` for each ink pass, `click` for registration, `paper` + `whoosh` + `thud` on the drum feed, `count`, `stamp` with a marker `scribble` on the emphasis, `chime` to resolve.

**When to use it.** Indie, zine and creator-culture content, tips and lists that benefit from a bright, tactile, print-shop feel.
