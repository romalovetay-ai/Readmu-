# Watercolor Wash

**Family:** Painterly · **id:** `watercolor`

**Look.** Transparent pigment on cold-press paper. The sheet has an embossed bumpy tooth lit from the top left, with loose blue, ochre and violet background washes and splatter dots at the edges. Each wash is a stack of independently ragged, low-opacity layers with a darker pooled rim, granulation specks, optional wet-in-wet bleeds and cauliflower blooms, leaving paper white where the lights are. A faint pencil outline sits under each shape.

**Motion.** Washes flood in from a point with a ragged expanding wet front. Brush strokes grow along their path with a loaded bead at the tip. Titles are brushed in left to right with a soft edge.

**How it explains.** Titles, labels and counters are brush-lettered in Caveat Brush with a double glaze. Arrows are tapered loaded-brush strokes with two short stroke barbs as the head. Boxes are pencil-sketched rounded outlines filled by a flooding wash (blue by default). Emphasis is an alizarin-red looped brush circle with splatter flecks around it. The scene change is a wet indigo wash sweeping across the sheet until it covers it at the midpoint, then lifting off.

**Palette.** ultramarine `#2f4fa8`, indigo `#2a2f5c`, sap green `#4f8a3c`, ochre `#d9a23a`, sienna `#b0582c`, alizarin `#c22a45`, teal `#2a8a8c`, violet `#6a4a9c`, paper `#fbf7ee`.

**Fonts.** Caveat Brush (all lettering).

**Signature techniques.**
- `deform()` midpoint-displaces polygon edges along their normals; `washLayer()` stacks about eleven differently deformed copies at about 10 percent alpha, plus rim strokes, `source-atop` granulation and optional bloom or bleed, and caches the result.
- `wash()` reveals a cached wash through a clip made of a deformed expanding blob, so the wet front is ragged.
- `brush()` builds a tapered polygon from left and right offsets of the path and fills it twice with a small offset.
- The paper is generated per pixel from noise as an emboss, then re-multiplied lightly over everything in the finish.

**SFX.** bed `room`, an opening `swell`, `scribble` (brush medium) for every stroke and wash, `pluck` notes landing on a rising scale for the chips, `whoosh` for the indigo sweep, `count`, a `pluck` with a brush stroke on the emphasis, `chime` to close.

**When to use it.** Soft, artistic or human-feeling stories: lifestyle, wellness, education and brand-warmth pieces where loose, translucent colour suits the tone.
