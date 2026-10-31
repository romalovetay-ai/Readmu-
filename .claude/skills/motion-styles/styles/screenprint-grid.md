# Silkscreen Grid

**Family:** Print · **id:** `screenprint-grid`

**Look.** Warhol-style silkscreen pulls. A flat colour flood sits inside a paper border, loose hand-cut colour plates are slapped on slightly off-register, and a grainy black photo screen is dragged over them, leaving squeegee streaks and starved patches. The payoff is the same video panel pulled eight times in garish colourways.

**Motion.** Colour slabs drop in a few pixels off position and settle, then the black layer is revealed left to right as if a squeegee were pulling it across. Emphasis cycles garish inks at about 12 fps. The finish pass re-seeds grain at 12 fps.

**How it explains.** Titles are condensed Anton on a loose colour slab, with the black screen pulled over a slightly offset position. Labels are the same style in capitals on a paper slab. Arrows are fat black screen-printed strokes with a solid head. Boxes are a hand-cut colour plate with a black key line pulled over. Counters are stencil numerals with a flat plate shadow beneath. Emphasis is a jagged 28-point starburst plate that flickers between inks. The scene change is the squeegee itself: a wooden-handled blade drags across with a wet ink bead, flooding the frame on the first pass and printing the next panel on the second.

**Palette.** paper `#f2ede2`, black `#141212`, pink `#ff5fa2`, orange `#ff7a1a`, yellow `#ffe11a`, teal `#17bfd3`, purple `#8b52d9`, green `#63d24c`, blue `#2f5fe0`, red `#ff3d32`. Eight colourways of flood, screen and play colours are defined for the repeat grid.

**Fonts.** Anton (titles and labels), Big Shoulders Stencil Display 800/900 (counter numerals).

**Signature techniques.**
- A 256px black screen tile is built per pixel from streak noise, grit and fbm, so alpha is patchy like emulsion, and used as a fill pattern for text and strokes.
- Flat plate tiles are near-solid with slight pinholing, and `cutRect()` builds a six-point hand-cut polygon with jittered corners.
- `pull()` clips content to a growing left-to-right rectangle to mimic the squeegee drag.
- The demo ends on a grid of the video pulled in several colourways (4 by 2 in landscape, 2 by 4 in portrait).

**SFX.** bed `room`; `thud` as each plate lands, brush `scribble` for each pull, `whoosh` for the squeegee, a quick run of `thud` for the grid, `count`, `glitch` + `stamp` on the colourway flicker, `chime` to resolve.

**When to use it.** Bold pop-art explainers and campaign recaps where repetition across variants or platforms is part of the message.
