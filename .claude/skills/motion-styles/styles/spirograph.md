# Guilloché Security Print

**Family:** Generative & Type · **id:** `spirograph`

**Look.** A banknote under a loupe. Fibred security paper in pale green and cream carries a wavy underprint and a rope border of interleaved sine strands between double rules. On top sit hairline rosettes and woven rings inked in a split-fountain gradient of green, copper and violet, with engraved serif lettering and red serial numbers.

**Motion.** Rings and hypotrochoid rosettes are drawn on pen pass by pen pass, starting slightly out of register and sliding into register. The rosettes rotate slowly. At the end a soft white glint sweeps across the whole note.

**How it explains.** Labels are caption cartouches: a pale pill with a double hairline outline and engraved capitals. Arrows are double-rule lines with an outlined, hatched head. Boxes are double hairline frames filled with a faint wave mesh. Counters are red numbering-machine digits with a slight misprint offset. Emphasis is a tilted rubber cancellation stamp ("VERIFIED") with speckled ink. The scene change slides a second note across the frame, with perforation dots along the seam.

**Palette.** paper `#e6ede0` and `#f2e6d8`, green `#2f6f5c`, copper `#c27a45`, violet `#5f55a3`, ink `#1f2b28`, red `#c3262a`, stamp purple `#6b3fa0`.

**Fonts.** Cinzel (engraved titles, labels, stamp), IBM Plex Mono (red serials and counter digits, microtext), Cormorant Garamond italic (loaded as a secondary serif).

**Signature techniques.**
- `band()` draws woven sine-ring meshes, many passes of r = R0 + A sin(n theta + phase), with fractional pass counts so the last ring draws on.
- `hypo()` traces a hypotrochoid rosette and normalises it to a target radius, drawn on by progress.
- The paper, security fibres, underprint waves and rope border are rendered once and cached.
- Titles are wiped in with a clip rect, then cut with a fine horizontal line screen to look engraved, and underlined with repeating microtext.

**SFX.** bed `room`, `scribble` (pen medium) for every draw-on, `click` runs for the title and chips, `tick` and `pluck` as items land, `paper` + `whoosh` on the note slide, `count` for the counter, `stamp` + `thud` on the emphasis, `chime` to close.

**When to use it.** Trust, security, value and "issued once, valid everywhere" stories, or anything about currency, verification or distribution that wants a precise, engraved feel.
