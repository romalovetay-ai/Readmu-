# Low-Poly Faceted

**Family:** Dimensional · **id:** `low-poly`

**Look.** A triangulated perspective valley at dawn. A violet-to-peach sky gradient holds a faceted sun with a halo, three layers of faceted mountain ranges that get foggier with distance, and a valley of flat-shaded Lambert triangles with depth fog and cone pine trees. Foreground items share the look: cut-corner cream tags, indigo faceted panels, a spinning mint crystal and a faceted rocket. The top of the frame has a dark veil for headline legibility.

**Motion.** The cached world plate slowly zooms and sways. The crystal spins on its vertical axis, with faces back-culled and depth sorted. The rocket flame flickers, and the demo lifts the rocket off with a column of faceted smoke. Titles reveal under a slanted sweeping clip.

**How it explains.** Titles are Space Grotesk bold white with a small two-tone coral bar. Labels are cut-corner cream tags with faceted fill, a coral notch and indigo lettering. Arrows are angular two-tone ribbons with a 45 degree elbow and a triangular head. Boxes are chamfered deep-indigo faceted panels with a lit top edge. The counter is a white-to-peach gradient number with a drop shadow, and emphasis is a burst of two-tone coral and mint shards with a faceted ring. The scene change is a field of dawn-gradient triangles that flip into place across the frame, then flip away.

**Palette.** night `#2a1f4f`, violet `#4d3f84`, mauve `#c06a93`, peach `#ffb08a`, dawn `#ffd49a`, pale `#fff4d8`, coral `#ff7060`, coral2 `#d9474a`, mint `#3ccf9a`, cream `#fff6f0`, pine `#1f5c46`, pine2 `#2e7d5b`.

**Fonts.** Space Grotesk 700 (titles, tags, counter), Space Grotesk 500 (smaller text).

**Signature techniques.**
- The valley is a real perspective grid (camera height, focal length, per-row z spacing) of triangles, each shaded with a Lambert dot product against a fixed light and mixed toward a pink fog colour by depth.
- A `tri()` helper fills and strokes each triangle in its own colour to hide seams.
- `facetFill()` fans triangles from an off-centre point with slightly varied shades to fake gem facets on tags and panels.
- The crystal is an octahedron-like shape built from a 6-point ring with per-face normals.

**SFX.** Bed `space`. Landings use `pluck`, emphasis uses `stamp`, the transition uses `whoosh`. The demo score adds `riser` for the crystal and rocket, `click` runs on the facet flip, `count` and a closing `chime`.

**When to use it.** Launches, growth and "take-off" stories, travel or exploration metaphors, and tech explainers wanting a modern, polished 3D-geometric feel.
