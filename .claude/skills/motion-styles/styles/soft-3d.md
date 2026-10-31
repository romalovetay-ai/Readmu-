# Soft 3D Clay

**Family:** Dimensional · **id:** `soft-3d`

**Look.** Puffy matte-clay objects on a seamless pastel lavender sweep. Each body has a chunky extrusion, a broad core shadow, a bright bounce-light rim along the bottom, a soft top-edge highlight and a glossy specular blob. Blurry contact shadows sit under everything, and out-of-focus clay props (balls and a donut) bob in the corners.

**Motion.** Elements drop in with squash and stretch: a stretched fall, then a damped sine wobble on landing. Contact shadows shrink and sharpen as objects get closer to the floor. Background props bob slowly and are blurred to fake depth of field. Emphasis pops clay stars and balls out around the key moment.

**How it explains.** Titles are puffy Fredoka lettering with a darker extrusion stack and a gradient face, dropping in line by line. Labels are squishy pill sprites with white text that spring on. Arrows are puffy clay tubes (shadow, extrusion, body, highlight stripe) with a blobby triangular head. Boxes are clay pills or speech-bubble shapes that spring on, with a contact shadow. Counters are white puffy numbers inside a butter-yellow clay badge. The scene change is five stacked clay bars in different pastels that bounce down over the frame, then lift away upward in staggered order.

**Palette.** sweep `#f3eeff` and `#fdfbff`, lavender `#a99cff`, violet `#7d6bf0`, pink `#ff8fa8`, peach `#ffc2a8`, mint `#a6e3d2`, sky `#9fd3ff`, butter `#ffe08a`, coral `#ff7a68`, ink `#4b3a8c`, white `#ffffff`.

**Fonts.** Fredoka 500/600/700 (all text).

**Signature techniques.**
- `clayBody()` fakes lighting in 2D: an offset darker copy for extrusion, a diagonal light-to-shadow gradient clipped inside the shape, and an inner-shadow trick (a huge ring with a shadow blur drawn with even-odd fill) for the core shadow, bounce rim and top highlight.
- Rendered bodies are cached as padded sprites, optionally pre-blurred for depth of field.
- `squash()` returns x and y scale plus a drop offset from a fall phase and a damped oscillation.
- The finish pass is a light lavender vignette and soft-light grain.

**SFX.** bed `room`; soft low-pitched `pop` for each landing, a short `pluck` accent, quiet `paper` + rising `pop` per platform, a run of `thud` plus `whoosh` for the clay bars, `count`, `pop` + `chime` and a pop burst on the emphasis, `chime` to resolve.

**When to use it.** Friendly consumer-app, onboarding and feature explainers where the tone should be soft, playful and approachable.
