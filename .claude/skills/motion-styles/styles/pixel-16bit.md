# 16-Bit Pixel Odyssey

**Family:** Retro Digital · **id:** `pixel-16bit`

**Look.** A SNES-era cutscene drawn on a true low-res grid (320 by 180 in landscape at 4x, 360 by 640 in portrait at 3x) and blown up with nearest-neighbour scaling. A banded dusk sky with checkerboard dither between bands, a striped sun on the horizon, parallax hills, a city with lit windows, and a road with a railing. A faint scanline gap runs between pixel rows.

**Motion.** Everything moves in whole-pixel steps. Stars twinkle on 12 fps frames, hills and city scroll at different integer speeds, and windows grow open in quarter steps. Text types out letter by letter. Emphasis rays shoot out in eighths.

**How it explains.** Titles and labels are Press Start 2P text rendered once, alpha-thresholded to hard pixels, tinted and cached, with a one-pixel drop shadow. Arrows are dotted Bresenham lines with a two-line head. Boxes are blue RPG windows with a dark outline, white bevel and three banded blues with dithered seams. Counters are big gold pixel numerals. Emphasis is a "level up" burst of eight pixel rays plus twinkling crosses. The scene change is the SNES mosaic: blocks grow up to 16x while brightness steps down in 16 levels, then back.

**Palette.** ink `#0b0b1e`, night `#1a1640`, navy `#24205a`, violet `#3d2a78`, plum `#6a3088`, magenta `#a83a8a`, rose `#d8506e`, coral `#f07a5a`, peach `#f8b070`, sun `#fde08a`, window gold `#ffd86a`, cyan `#6ae0ff`, white `#f4f4ff`, cream `#fff1c8`, gold `#ffd23a`, window blues `#2a46b8` `#20378f` `#182a6e` with edge `#c8d4ff`.

**Fonts.** Press Start 2P (all text, only at multiples of 8px, never anti-aliased).

**Signature techniques.**
- A small offscreen buffer is the real canvas, so the scenery is drawn at native pixel size and scaled up without smoothing.
- The finish pass downsamples whatever is on the canvas to the pixel grid and scales it back up, then adds row gaps and a light vignette, so even other draw calls snap to the grid.
- Glyph rendering thresholds alpha at 120 to remove anti-aliasing.
- A small hero sprite is defined from character maps, and the sun is a discs-by-rows primitive with stripe cut-outs.

**SFX.** bed `tape`; a `swell` chord to open, `blip` per typed character (note A5), `click`, `tick` and `pop` for windows, rising `blip` arpeggios for the platform list, `glitch` + `whoosh` on the mosaic, `count`, `ding` with an arpeggio on the level-up.

**When to use it.** Game-flavoured explainers, launch announcements or "level up" stories for an audience that loves retro games, where a chunky dialog-box cadence suits the script.
