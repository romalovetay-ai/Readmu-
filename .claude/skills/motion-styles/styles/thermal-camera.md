# Thermal Camera

**Family:** Light & Imaging · **id:** `thermal-camera`

**Look.** A handheld IR camera frame in ironbow. The heat field is soft and low-res: a cold window, a warm desk, a hot coffee mug with steam, a hot laptop, and a rack whose blades heat up. There is edge enhancement, fixed-pattern column noise and temporal sensor noise. On top sits the camera's own crisp HUD: emissivity and palette, battery, AUTO, a scale bar with live max/min, a timestamp, a spot meter and a measurement box.

**Motion.** Auto-gain settles in the first second. Words warm up one at a time. Heat flows along streams with a hot pulse at the head, and devices warm when the heat arrives. The spot-meter crosshair rides the main stream with a live reading. The rack heats bottom to top.

**How it explains.** Physical things are temperature, and the HUD does the explaining. Labels are HUD tag chips, a POSTED counter ticks as each platform lands, the number is hot digits, and the emphasis is the Bx1 measurement box (corner brackets, hot-spot triangle, MAX readout). The scene change is the shutter calibration (NUC): a flat uniform field, a click, CALIBRATING, then the shutter opens.

**Palette.** ironbow `#05020f` > `#24096a` > `#6b1798` > `#b22783` > `#e2492f` > `#f68a17` > `#ffcd33` > `#fffbe2`; HUD white, cold `#46a8ff`, hot marker `#ff3b2f`.

**Fonts.** IBM Plex Mono 600/700 (HUD), Inter 800 (heat lettering).

**Signature techniques.** Physical primitives paint grey levels into a half-res heat layer over a cached IR room plate. The finish then:
- blurs the heat layer (optics);
- runs one pass over the half-res pixels with auto-gain, an ironbow LUT, edge enhancement, fixed-pattern and temporal noise;
- draws the result under the HUD with `destination-over`, so HUD primitives drawn earlier stay crisp on top;
- adds the camera chrome and grain.

**SFX.** bed `hum` + `tape`, shutter `click`s at start, `blip` on HUD tags, `type` as tags print, `tick`s while the spot meter tracks, a `whoosh` + rising `blip` per platform, `click` + `thud` for the NUC, `count`, `ding` on Bx1, `chime` to resolve.

**When to use it.** Performance, load, activity or "where the heat is" stories, analytics and hot-spot reveals, anything technical that benefits from a measuring-instrument feel.
