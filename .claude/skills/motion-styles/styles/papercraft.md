# Papercraft Models

**Family:** Popular Explainer Looks · **id:** `papercraft`

**Look.** Printed cardstock kit pieces on a green self-healing cutting mat. Boxy oblique prisms have Lambert-shaded faces, dotted fold lines, glue tabs and hairline seam highlights, and sit under a warm key light from the upper left. The mat has a grid, angle guides, ruler numbers, knife scuffs, and a steel ruler, pencil and glue stick at the edges.

**Motion.** Everything animates on twos: progress is quantised to about 12 steps per second and pieces jitter slightly while moving, like stop motion. Cards hop in, then fold up from a flat template into a prism. A small robot model assembles its body then its head.

**How it explains.** Titles are a printed tent card with a blue "KIT No.07" header strip and heavy lettering. Labels are small tent tags that drop onto what they name, with a coloured edge strip. Arrows are a creased yellow paper strip that unrolls with a two-tone folded head. Boxes fold themselves up into prisms. Counters are heavy numerals on a cream prism. Emphasis is a red paper flag on a toothpick plus paper confetti. The scene change is a fresh printed kit sheet sliding across the mat in 16 steps.

**Palette.** mat `#2e6a4b`, mat dark `#24563c`, grid line `#9fd0b0`, card `#f4efe4`, blue `#2f6fb7`, orange `#e8742f`, red `#d63a32`, yellow `#efc23a`, ink `#23262b`, grey `#7c8590`, green `#3a9a5a`.

**Fonts.** Archivo Black (titles, counters, robot lettering), Rubik 600/800 (labels, kicker text, ruler numbers).

**Signature techniques.**
- `prism()` draws a front face plus a top and side face whose depth grows with fold progress, shaded 1.06 top, 0.97 front and 0.72 side, with a blurred contact shadow.
- `twos()` and `jit()` produce stop-motion stepping and seeded position and rotation jitter.
- The mat is a cached layer with grid, dashed guides, ruler numbering, scuffs and drawn tools.
- The finish pass adds a soft-light warm key gradient, vignette and grain.

**SFX.** bed `room`; `paper` on nearly every entrance, `click` as pieces snap together, `thud` on heavy landings, `whoosh` + `paper` on the transition, `count`, `pop` on the emphasis, `chime` to resolve.

**When to use it.** Playful how-it-works and product explainers where building something piece by piece suits the story, especially for a "kit" or "assemble it" metaphor.
