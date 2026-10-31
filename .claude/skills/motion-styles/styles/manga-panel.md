# Manga Page

**Family:** Illustration · **id:** `manga-panel`

**Look.** A black-and-white manga page on off-white newsprint. Panels are quads with thick, even black borders and
slightly slanted gutters. Grey never exists as a flat colour: every tone is screentone, either a 45 degree dot grid
or a dot-size gradient (dark at the top of a sky, dark at the edges of a splash). Focus lines converge on the key
subject. Sound effects are katakana in a heavy gothic face with a fat white knock-out border, captions are
hand-lettered caps in white narration boxes, and dialogue sits in an oval balloon with a tail.

**Motion.** Panels slam in one after another, dropping a few pixels and settling, and every landing kicks a damped
camera shake. Focus lines and speed lines re-seed on twos (every 2 frames at 24 fps) so they boil, SFX letters
tremble per letter, headline words slam down from 1.6x scale, captions pop with an overshoot.

**How it explains.** A two-page manga. Page one: the hook panel with focus lines, a phone panel with speed lines,
Creator OS under a radial burst, then a toned panel where bold outlined arrows (white body, black outline,
widening toward a big head) fan out to captioned platforms. A page turn (the next page swings over from the left,
manga reading order) leads to a splash panel: the counter set huge with a white knock-out and black drop, a
jagged starburst and a trembling "ドン!" on the hit, and the takeaway in a speech balloon.

**Palette.** ink `#111111`, paper `#f3f1ea`, white `#ffffff`; mid greys only through dot density.

**Fonts.** Archivo Black (headlines, numbers), Patrick Hand (captions and balloons, set in caps),
Dela Gothic One (katakana SFX).

**Signature techniques.**
- Flat tone from a cached 2-cell dot tile used as a repeating pattern, clipped to the panel path.
- Gradient tone pre-rendered once per frame size (dot radius = sqrt of a field: top, left, radial) and clipped.
- Focus lines as one filled path of thin wedges seeded by `floor(t * 12)`.
- Knock-out lettering: wide white stroke, thin black stroke, black fill.
- Camera shake summed from `K.spring` kicks at every panel landing.

**SFX.** land `thud` (each panel), `whoosh` + `pop` per label, emphasis `stamp` + `thud`, transition `paper` +
`whoosh` (page turn), `riser` under the hook, bed `room`.

**When to use it.** High-energy reveals, before/after drama, "this changes everything" moments, anything aimed
at an anime-literate or Gen Z audience.
