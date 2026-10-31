# Transit Map

**Family:** Data & Information · **id:** `transit-map`

**Look.** A Beck-style metro diagram on warm off-white paper. Fat coloured lines run only at 0, 45 and 90 degrees with rounded bends, bundled so they never cross. Stations are small line-colour ticks, interchanges are white capsules with a heavy navy ring, routes end in terminus bars, and a pale blue river with an italic serif name runs behind the network. Lettering is clean bold sans.

**Motion.** Routes draw on from their start, one after another. Interchanges pop in with a back-ease. Once a route is finished, a small white train glides along it on a loop. The scene change is a full train rushing across the frame.

**How it explains.** Arrows are metro lines, a 45 degree route between two points with rounded corners and a terminus bar at the end. Labels are plain sans station names that fade up a few pixels. Boxes are white interchange capsules. Counters are amber dot-matrix digits in a departure board (a dark board with a dot mask over the lit characters), which in the demo flips to the takeaway text. Emphasis is rings in line colours (red, orange, blue) radiating out from an interchange. The scene change is a grey, red and navy train passing, with window panels and speed streaks.

**Palette.** paper `#f7f5ef`, ink `#1b1f3b`, river `#bfddeb`, river ink `#4b8db0`, navy `#2e3a87`, amber `#ffb000`, board `#121212`, line colours red `#dc2a26`, teal `#00a0a8`, orange `#f39419`, black `#1f1f1f`, blue `#0a6cb8`, purple `#8b4a9c`, green `#00894a`.

**Fonts.** Inter (titles and station labels), Libre Baskerville italic (river name), VT323 (dot-matrix departure board).

**Signature techniques.**
- `route45()` builds a horizontal, 45 degree diagonal, horizontal path (or its vertical twin) and `rounded()` converts the corners into sampled quadratic arcs so `K.trim` can draw them on.
- `tick()` and `terminusBar()` place perpendicular marks using the local direction of the trimmed path.
- The dot-matrix effect tiles a cached circle-cut mask over the lit board text.
- The paper is a cached tinted texture with a faint vignette and soft-light grain.

**SFX.** bed `crowd`, `click` for stations and labels, quiet `whoosh` as each line draws, `pop` + `ding` for the interchange, `pluck` notes on the line terminals, a low-pass noise rumble with `thud` and rail-joint `click`s for the passing train, `count` for the board, `ding` on the pulse, `chime` at the end.

**When to use it.** Pipelines, funnels, workflows, roadmaps and anything with a hub and multiple destinations, where "lines" and "stops" explain the structure cleanly.
