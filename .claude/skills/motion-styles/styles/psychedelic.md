# Psychedelic Poster

**Family:** Cosmic & Psychedelic · **id:** `psychedelic`

**Look.** A 1960s San Francisco concert poster. Full-strength inks in vibrating complementary pairs (magenta and lime) fill churning concentric ring bands behind everything. A mirror-symmetric eye-flower, a daisy, bulbous Shrikhand lettering with an inline and a drop, and ribbon banners are all printed on worn, scuffed poster stock with fold creases.

**Motion.** The ring bands drift outward continuously and wobble through sine and noise, so the whole backdrop looks liquid. Title letters melt into place one by one with drips. The eye-flower unfurls petals layer by layer, then the eye opens and the iris drifts side to side. Labels and boxes pop in with a back ease.

**How it explains.** Titles are yellow Shrikhand with a red inline, a fat cream outline over a dark outline, and a deep blue drop shadow. Labels are cream ribbon banners with folded tails and a dark outline. Arrows are a striped ribbon (yellow with a moving purple dash) that waves along its path and ends in a fat teardrop point. Boxes are fat rounded blob panels with a coloured rim and cream face. Counters reuse the title style in lime with a magenta drop. Emphasis is a spinning 24-ray kaleidoscope sunburst around two concentric discs. The scene change floods wobbling ink rings out from the centre to cover the poster, then drains them away.

**Palette.** magenta `#ff2a8f`, lime `#a6e22e`, blue `#2547d8`, purple `#7b2fc4`, orange `#ff7a1c`, yellow `#ffd233`, cream `#fbefd3`, dark `#2a1248`, red `#e8322a`.

**Fonts.** Shrikhand (titles and counter), Righteous (ribbon labels).

**Signature techniques.**
- `bands()` draws up to 34 closed ring paths per frame with a radial wobble from sine plus 3D noise, scrolling slowly outward, each with a dark hairline stroke.
- `eyeFlower()` layers four petal rings (spike and oval) with staggered back-eased scaling, then a scalloped collar, veins and a lid-clipped iris.
- Titles are drawn in three per-letter passes (drop, outlines, fill and inline) so melt-in progress can differ per letter.
- The finish pass multiplies a paper texture, adds cached scuffs, specks and fold creases, a brown vignette and strong grain.

**SFX.** bed `vinyl`; a `swell` chord and `whoosh` to open, a pentatonic `pluck` run on the title, `pop`, `riser` + `thud` into the flower, rising `pluck` notes per platform, double `whoosh` on the ink flood, `count`, then `swell` + `stamp` on the sunburst and `chime` to resolve.

**When to use it.** Music, festival, creator-culture or high-energy launch content that should feel loud, trippy and unmistakably retro.
