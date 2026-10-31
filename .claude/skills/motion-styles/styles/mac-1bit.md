# MacPaint 1984

**Family:** Retro Digital · **id:** `mac-1bit`

**Look.** Pure black and white at the grain of the original Macintosh. A grey-dithered desktop holds a menu bar, a tool palette, a window with a striped title bar and close box, and a pattern palette along the bottom. The artwork itself is drawn inside the window with 8x8 fill patterns, aliased bitmap type, 2px lines and a small pointer. Photo-like areas are Atkinson-dithered into crunchy black and white dots.

**Motion.** The scene is drawn on a half-resolution buffer in 30 fps steps, with a pointer that follows whatever is being drawn. The active tool in the palette is inverted and changes with the story (text, rectangle, line, bucket, selection). Text types on letter by letter with a caret, lines rubber-band out, and boxes snap out from a corner before being flood-filled with a pattern.

**How it explains.** Titles use Libre Baskerville bitmap type. Labels use Inter bitmap type, optionally on a white box. Arrows are 2px aliased lines with a small filled pixel head. Boxes are drawn rectangles that fill with a named pattern (diagonal, brick, weave and so on) and an offset black shadow. The counter is large bitmap serif numerals. Emphasis is marching ants around the number that flash an invert, as if selected. The scene change is zoom rectangles: dotted frames shrink to the centre like a closing window and then grow back out.

**Palette.** black `#000000` and white `#ffffff` only (everything is forced to 1 bit).

**Fonts.** Libre Baskerville 700 (titles and numerals), Inter 700 (menu, labels, window title, tool and platform text).

**Signature techniques.**
- The finish pass downsamples the frame by 2, runs an Atkinson error-diffusion dither to pure black and white, and scales back up with nearest-neighbour.
- Text is rasterised once, its alpha thresholded at 110 to remove anti-aliasing, and cached as aliased glyph bitmaps.
- Bresenham pixel lines, 8x8 bit-pattern fills built from string rows and cached as tiles, and a hand-coded pointer sprite.
- Marching ants animated by shifting a 4-on 4-off dash along the rectangle perimeter.

**SFX.** Bed `room`. Strokes use a `pencil` scribble, landings use `click`, emphasis uses `blip`, the transition uses `whoosh`. The demo score adds `type` for lettering, `count` for the number and a closing `chime`.

**When to use it.** Nostalgic tech stories, "how it started" angles, retro-computing humour, and tutorials where a vintage software interface is part of the joke.
