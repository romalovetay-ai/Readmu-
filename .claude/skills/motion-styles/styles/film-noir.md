# 1940s Film Noir

**Family:** Light & Imaging · **id:** `film-noir`

**Look.** A silver-nitrate still from a forties detective picture. A dark plaster office wall is raked by venetian-blind light with soft penumbra edges. Smoke hangs in the beams, a CRT terminal is the only other light, and a fedora-and-trench-coat silhouette is rim-lit from the screen side, with the blind stripes falling across his coat.

**Motion.** The blinds sway a hair and the smoke drifts up. The terminal warms up with a CRT flash. The title card dissolves in word by word. Booking placards swing in on their cords and settle. Under everything the projector runs: gate weave, flicker, grain, dust and scratches.

**How it explains.** Told as a B-picture case board. Labels are mugshot booking placards, arrows are fat white newsreel arrows with hard drop shadows, and containers are deco intertitle frames. Numbers roll on a mechanical odometer (upper drums only turn when the lower ones carry). The emphasis is a rubber stamp ("CASE CLOSED") slammed down with ink-starved speckle. The scene change is an iris out and back in.

**Palette.** black `#08080a`, ink `#151517`, wall `#2b2a28`, grey `#6f6c66`, silver `#cdc8bd`, white `#f3f0e8` (the finish strips all colour, so anything drawn ends up silver).

**Fonts.** Limelight (art-deco title cards), Special Elite (typewritten placards), Oswald 700 (odometer digits, stamp).

**Signature techniques.**
- A cached blind-light plate drawn at quarter resolution and upscaled for soft penumbrae, with a linear falloff at the window edge and a radial falloff from the window.
- A cached fbm smoke plate screened over the wall.
- The finish pass copies the frame and redraws it with per-frame gate-weave offset and overscan, forces monochrome with a `saturation` composite, adds quarter-res thresholded halation, projector flicker, a heavy vignette and strong overlay grain, per-frame dust specks and hairs, and vertical scratches that persist for about 7 frames.

**SFX.** bed `vinyl` + `hum` (projector), `swell` minor chord on the title card, `glitch` + `blip` for the CRT warm-up, `whoosh` + `thud` + `paper` per placard, `type` on the node, `count` for the odometer, `stamp` + `thud` on the emphasis, `chime` to resolve.

**When to use it.** Mystery, "the case of..." reveals, investigations, before/after exposés, or anything that wants drama and a hard-boiled voice-over.
