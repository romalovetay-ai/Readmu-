# Ukiyo-e Woodblock

**Family:** Art & Design Movements · **id:** `ukiyo-e`

**Look.** An Edo-period landscape print in the manner of Hokusai, on washi with visible fibres. A Prussian-blue
bokashi is wiped across the top of the sky and fades into ochre; the sea is a flat mid-blue block carved with pale
wave lines. Every shape is a flat colour block pressed a hair off register from its carved keyblock outline. A
towering wave curls in from the left with claw-like foam fingers along its lip and spray that breaks into tumbling
data cubes; a cargo boat with a play-marked crate rides the trough; Fuji stands in the distance. Text sits in cream
paper cartouches with a double keyblock border and a coloured head band; a vertical signature cartouche and a
vermilion seal sit in the corner. The wood grain of the blocks shows faintly through everything.

**Motion.** Printed like a real woodblock: keyblock lines land first, then each colour block is pressed in. The
wave swells and its claws lean, data cubes arc off the crest, the boat rolls on the swell, current streaks flow.

**How it explains.** Flow is a current: a blue band with flowing pale streaks and keyblock edges that ends in a
curling claw-foam head. Things are cartouches; Creator OS is Fuji. Numbers are printed in Prussian blue in a large
cartouche, and judgements are vermilion seals stamped down (the counter's is 百万, "one million"). Scenes change
behind golden kasumi cloud bands that drift across from alternating sides.

**Palette.** washi `#efe3c6`, keyblock `#1c2233`, Prussian `#1d3a63`, mid blue `#4f7aa6`, pale blue `#a9c3d1`,
foam `#f3ead2`, ochre `#e3c98f`, vermilion `#c4412a`, kasumi gold `#d8b25c`.

**Fonts.** Noto Serif JP 900 / 700 (Mincho-style Latin for titles and labels, kanji for seals and the signature).

**Signature techniques.**
- `block()` fills are translated by a fixed registration offset; `key()` outlines are drawn on top unshifted.
- Bokashi, sea, carved wave lines and washi fibres are baked into one cached sheet; a wood-grain tile is laid over
  every frame with `multiply` at low alpha.
- The wave is built in unit coordinates from a smoothed control polygon, so it can swell with t; claws are placed
  along a bezier crest, oriented to its normal.
- Seals: a rounded vermilion square with paper-coloured characters and random paper specks for uneven inking.

**SFX.** draw `brush` (baren rubbing), land `thud`, `pluck` on a pentatonic run per label, emphasis `stamp` +
`thud`, transition `whoosh` + `swell` under the clouds, bed `ocean`.

**When to use it.** Big-wave moments ("the wave of AI video"), journeys, Japan or craft themes, anything that wants
epic scale with calm, classic composure.
