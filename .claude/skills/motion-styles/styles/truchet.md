# Multi-scale Truchet

**Family:** Generative & Type · **id:** `truchet`

**Look.** A bold two-ink poster built from winged Truchet tiles in cream and navy on cream paper. Each tile is a band of two quarter-circle arcs with small corner disks reaching into its neighbours, so paths flow unbroken across the grid. Tiles split into finer scales (up to three), with the inks swapped at each scale. A third ink, orange, fills only the shapes of the letters of a chosen word so it surfaces from the maze.

**Motion.** The maze is laid in a diagonal sweep, each tile spinning and scaling in. Tiles then subdivide into four smaller tiles in waves, again at a third scale, with a back-ease pop. The orange plate slides into register with the black type.

**How it explains.** Titles and labels are printed blocks: a navy-framed cream slab with navy type and an orange misregistered copy that slides into register as the block completes. Arrows are thick navy bars with a cream keyline and a solid triangular head. Boxes are navy-framed cream blocks with an orange side bar. Counters reuse the printed block. Emphasis is concentric cream, orange and navy half-ring arcs that spin out around the hit. The scene change is a diagonal sweep of navy tiles that quarter-turn in to cover and out again.

**Palette.** cream `#efe8d6`, navy `#16224a`, orange `#e8542a`, paper `#e9e1cc`, plus `#1d2b5a` for alternate transition tiles.

**Fonts.** Archivo Black (all printed lettering and the accent word).

**Signature techniques.**
- `tile()` draws two stroked quarter-annuli (radii w/3 to 2w/3) plus four corner disks of radius w/6, with ink roles swapped by level.
- `plan()` builds a deterministic subdivision tree from a seed and caches it; `leaves()` returns the visible tiles at time t, finest first so coarser wings sit on top.
- `accentWord()` draws the letters into a layer, then fills them with the maze in orange and navy via `source-in`, offset to slide into register, with a cream and navy keyline.
- The finish overlays paper tooth, light vignette and grain.

**SFX.** bed `tape`, runs of `click` and `tick` as tiles lay and split, `pop`, `whoosh` for sweeps, `stamp` as the word registers and on the emphasis, `click` per chip, `count`, `chime` to finish.

**When to use it.** Brand-forward reveals, big-word title cards and abstract openers where a pattern resolving into a word is the hook.
