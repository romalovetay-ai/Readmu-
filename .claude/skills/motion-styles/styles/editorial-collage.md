# Editorial Essay Collage

**Family:** Popular Explainer Looks · **id:** `editorial-collage`

**Look.** The "animated essay" collage on warm, grainy tan paper. A flat red colour block with a torn leading edge fills one side (the right in landscape, the bottom in portrait), and an old clipping peeks from the top-left corner. On top sit archival halftone prints with torn white borders and soft shadows, serif newspaper clippings held by masking tape, and big cut-out condensed headlines on black paper strips.

**Motion.** Cutouts move in 12 fps steps, so pieces slide, drop and rotate with a hand-animated stutter. Headline strips slide in from alternating sides, clippings and prints drop in from above, and dust specks and fibres change every step. The finish adds grain on the same clock and a warm vignette. The scene change is a torn sheet of new paper whipping up on stepped motion.

**How it explains.** Titles are Anton caps on black (or cream, or yellow) torn strips with a slight tilt. Labels are Libre Caslon clippings on torn newsprint with a tape strip and an optional yellow highlighter sweep. Arrows are dashed ink route lines with a pin dot at the start and a chevron head. Boxes are halftone prints with a torn white border and two taped corners. Counters set each numeral on its own paper scrap in cream, black or yellow. Emphasis is a red marker ring with an overshoot loop and a thinner offset echo, or a multiplied yellow highlighter bar. The demo's "Creator OS" node is a newspaper clipping with a highlighter sweep over its italic subhead.

**Palette.** paper `#ece2cf`, darker paper `#d9ccb2`, clipping `#f3ecdc`, ink `#1b1a18`, red `#cf3b2c`, yellow `#f4d03f`, tape `#e9dfc0`, grey `#8b857a`, vignette `#3a2410`.

**Fonts.** Anton (cut-out headlines and counters), Libre Caslon Text 400/700 plus italic (clippings, headline text in the demo clipping).

**Signature techniques.**
- Torn outlines built by jittering points along each edge, used for strips, prints, tape, clippings and the transition sheet.
- A halftone tile drawn as a staggered dot screen whose dot radius follows fractal noise, with a vignette and a darker lower third.
- A shared shadow helper for the soft drop shadows under every cut piece.
- Progress is quantised (`stepP`, eighths) so all reveals move in steps.

**SFX.** bed `vinyl`, `paper` rustles with `thud` as pieces land, marker `scribble` for rings and highlights, pen `scribble`, `whoosh` for the sheet, `count` for the numeral, `stamp` on the emphasis, `chime` to resolve.

**When to use it.** Documentary-style essays, history and "how we got here" stories, culture and media commentary, and anything that benefits from an editorial scrapbook feel.
