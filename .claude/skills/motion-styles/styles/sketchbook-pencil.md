# Sketchbook Graphite

**Family:** Hand-Drawn · **id:** `sketchbook-pencil`

**Look.** A graphite study in a spiral sketchbook. Cream paper with tooth, punched holes and wire coils along the left edge (the top in portrait), faint old erased smudges, a five-step value strip and a small "sketch no." note in the corner. Marks are dark grey graphite with a thin lighter sheen, with a few red-pencil accents.

**Motion.** Things are drawn in stages. Long, faint construction lines overshoot first, then confident contours go over them, then hatching and smudges build tone. Lettering is revealed left to right like writing. The finish pass is a soft light gradient, vignette and fine grain.

**How it explains.** Titles and labels are Caveat handwriting in graphite, written twice with a half-pixel offset for weight. Arrows get a construction line first, then a wobbling contour with two pencilled head strokes. Boxes go from four overshooting construction lines to a firm outline, then diagonal hatching on the shadow side, a light tone across the face, smudges and a kneaded-eraser highlight near the top-left. Counters are pencilled over the faint erased ghosts of the previous values. Emphasis is two looping hand-drawn ellipses plus a red "yes!" note. The scene change turns the page: the sheet lifts at the right edge and folds over to the left, showing its curled back and a fresh page.

**Palette.** lead `#2c2c30`, mid grey `#6b6b70`, soft grey `#9a9a9e`, red pencil `#a8463c`, paper `#f2ede1`.

**Fonts.** Caveat 400/700 (all handwriting).

**Signature techniques.**
- Graphite is a 160px grain-tile pattern with alpha holes from noise, used as the stroke and fill style, so strokes break up on the paper tooth instead of being solid.
- `hatch()` draws many parallel strokes of random length and alpha inside a clip path, with density tied to progress.
- Seeded wobble is added to every path, and lines are built as slight bezier curves.
- Two cached paper pages (page 0 and 1) provide the front and the page revealed after the turn.

**SFX.** bed `room`; pencil `scribble` for every stroke and the lettering, `tick` as items land, `paper` + `whoosh` for the page turn, `count`, `paper` with a pencil stroke on the emphasis, `chime` to resolve.

**When to use it.** Process, planning and "back to the drawing board" explainers, tutorials, design topics, or anything that should feel like a thoughtful, in-progress study.
