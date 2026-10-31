# Phosphor Terminal

**Family:** Retro Digital · **id:** `crt-terminal`

**Look.** A green P1-phosphor CRT inside a grey-brown plastic bezel with a moulded lip, a "CX-80 CREATOR TERMINAL" badge, two knobs and a POWER label. The screen is near-black green with bright green VT323 text, bloom and halation, scanlines, a darkened tube edge and a faint glass reflection streak.

**Motion.** Text is typed at terminal speed with an optional blinking block cursor. Lines draw on in a straight line or clockwise trace. A faint hum bar rolls up the raster, the phosphor flickers with noise, and the whole raster bows through barrel distortion. The scene change is a V-hold roll: the picture slips vertically while a black blanking bar crosses, and the frame is blanked at the midpoint.

**How it explains.** Titles and labels are typed character by character, optionally in inverse video (a phosphor block with dark text). Arrows are hard square-capped green lines with an open chevron head. Boxes are double-ruled rectangles traced on clockwise. Counters are huge bright VT323 numerals. Emphasis is a blinking inverse-video block behind the number, blended with difference and multiply.

**Palette.** phosphor `#5cff7a`, dim `#2c9a48`, hot `#d6ffde`, screen bg `#03140a`, tube centre `#04190c`, tube edge `#010703`, bezel `#5d5a52` to `#3b3934`, lip `#24231f` to `#4a4842`, fringe magenta `#ff2a70`.

**Fonts.** VT323 (all screen text), Space Mono 400/700 (bezel badge and labels).

**Signature techniques.**
- Barrel distortion by strip resampling: 72 horizontal strips narrowed toward top and bottom, then 72 vertical strips shortened toward the sides.
- Bloom from a quarter-res copy blurred at two radii and added with `lighter`.
- Colour fringing from a magenta-tinted ghost of the screen drawn slightly larger.
- A cached scanline texture of dark and softer lines, and a cached bezel layer with a cut-out for the tube.

**SFX.** bed `hum`, a power-on `thud` with a high-pitched whine tone, `type` for typing, `click` as items land, `blip` notes, `whoosh` + `glitch` for the V-hold roll, `count` for the numeral, `stamp` on the emphasis, `chime` to resolve.

**When to use it.** Developer, hacker, command-line or "system boot" content, status reports, and anything that works as a terminal session.
