# Byzantine Mosaic

**Family:** Illustration · **id:** `mosaic`

**Look.** A wall mosaic in an apse. The ground is gold smalti laid in jittered horizontal rows with warm mortar in
every joint, each stone a slightly irregular, bevelled quad in its own shade of gold. A red-and-white band frames
the wall. Figures are laid the Byzantine way, in rows that follow their own contours (andamento): panels in
concentric rings from the edge inward (dark outline course, a white or gold course, then the field), connectors
in two courses along their length with a chevron head. Lettering is cut from small tesserae with a white outline
course and sits slightly proud of the wall.

**Motion.** Everything is laid tile by tile: the stone being pressed in right now is lifted with a small shadow.
A band of raking light sweeps the wall and individual gold smalti flash in turn as it passes. Scene changes pry
the old tesserae up along a sweeping front (stones tumble away, bare gold ground behind) and re-lay the new wall.

**How it explains.** Panels for things, laid-tile connectors for flow, tessellated lettering for labels and
numbers, and on the key moment a red-and-white ring of stones is laid around it and gold smalti flash outward.

**Palette.** mortar `#5f5546`, gold `#c9a03c` / `#f2d77e` / `#a98428`, red `#9e2a24`, white `#ece4d2`,
lapis `#1f3a7a`, ink `#1d1a1f`.

**Fonts.** Libre Baskerville 700 (cut into tesserae for titles, labels, numbers).

**Signature techniques.**
- Ground baked once: row generator with per-row random offsets and widths, irregular quads, bevel highlight on the
  lit edges, per-stone shade picked from a pre-mixed table; a quarter of gold stones are remembered as glint sites.
- Andamento generators (`alongPath`, `rings`, `polyFill`) produce cached tile lists; `lay` draws the first
  `p * n` of them so draw-on is literally tile by tile.
- Lettering: text drawn into a scratch canvas, joints punched out with a cached grout pattern
  (`destination-out`), per-stone shading added with `source-atop`, then composited with a hard mortar shadow.
- A mortar setting bed goes down under each panel so the gold never shows through its joints.

**SFX.** land `click` bursts (stones being set, one click per few tiles), `pop` per label, emphasis `chime`,
transition `glitch` + rattling clicks + `whoosh` (tesserae prised up), bed `room` with a low `swell`.

**When to use it.** Timeless, monumental messages: mission statements, "the foundations", hall-of-fame
milestones, anything that should feel built to last.
