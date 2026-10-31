# Voxel Diorama

**Family:** Dimensional · **id:** `voxel`

**Look.** A MagicaVoxel-style toy world on a warm peach gradient. Everything is built from unit cubes in true isometric projection with three tones per cube (light top, mid left, dark right), darker creases, and a bright bevel on the front top edges. The hero is a floating island with grass, dirt and rock layers, a pond, chunky trees, flowers and a cream and orange robot. Small floating cubes bob in the background.

**Motion.** The island builds layer by layer as cubes drop in with a bounce, then bobs gently. The robot waves its arm between two poses and its cyan visor eyes flicker. Lettering drops in column by column, and arrows are chains of cubes that hop into place.

**How it explains.** Titles and counters are extruded pixel-voxel lettering, each pixel an individual bevelled block. Labels are cream block tags with a coloured cube icon and Silkscreen text. Arrows are cube chains with a larger orange head cube. Boxes are a raised slab of cubes that drop in diagonally. Emphasis flings a burst of coloured cubes outward that fall and shrink. The scene change is a rain of large voxels that stack to cover the frame, then drop away.

**Palette.** bg `#fde6cf` and `#f6c39c`, ink `#4a2f22`, grass `#9fcb55` and `#86b844`, dirt `#a0673f` and `#74432d`, rock `#b9b3ad` and `#8f8a86`, water `#5fc4ea`, orange `#ff8a3d`, red `#ff5a4f`, cream `#fff4e2`, dark `#4a4458`, navy `#2b2d42`, cyan `#7ff9ff`, yellow `#ffd23f`, trunk `#8a5a3c`, leaves `#5fae4a` and `#7cc35a`.

**Fonts.** Silkscreen (pixel lettering source, label text).

**Signature techniques.**
- `cube()` draws each cube's three faces with tone-shifted colours and per-face ambient occlusion; `bake()` culls hidden faces, computes AO from neighbouring voxels and ray-marches toward a light to shadow the top faces.
- Models are `Map` objects of "x,y,z" to colour, sorted back to front, and rendered into cached canvases (`modelCanvas`) once complete.
- `pixelMask()` samples Silkscreen into a pixel grid, and `voxTextCanvas()` renders each pixel as an extruded, bevelled block.
- The finish applies a warm soft-light bloom, light vignette and grain.

**SFX.** bed `room`, many `click`s for blocks landing, `pop` and `blip` for the tag and robot waking, `thud` rolls for the voxel rain, `whoosh`, `count`, `stamp` + `pop` on the burst, `chime` to end.

**When to use it.** Friendly product tours, game or app worlds, and playful "build it up" explainers where a warm toy-box feel suits the brand.
