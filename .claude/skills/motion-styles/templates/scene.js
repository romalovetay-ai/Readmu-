// Custom explainer scene for the motion-style suite. Render with:
//   node engine/render.mjs --style <id> --scene /abs/path/scene.js --out out.mp4 [--size 1080x1920]
// S = the chosen style (its primitives), K = engine kit. Every frame is a pure function of t.
window.SCENE = {
  duration: 14,

  draw(ctx, W, H, t, S) {
    const L = K.layout(W, H), s = L.s, P = L.portrait;
    S.background(ctx, W, H, t);

    const CUT = 10.0;   // the transition covers the frame at CUT: draw scene A before it, scene B after it

    if (t < CUT) {
      // Beat 1 (0 to 2 s): hook title, out of the way fast.
      S.title(ctx, 'Your hook here', W / 2, P ? H * 0.12 : 110 * s, K.beat(t, 0.2, 1.2, 'lin'), { size: P ? 44 : 64, align: 'center' });

      // Beat 2 (2 to 5 s): a node, an arrow drawing to a second node, labels landing on them.
      const a = P ? [W * 0.5, H * 0.3] : [330 * s, 300 * s], b = P ? [W * 0.5, H * 0.5] : [950 * s, 300 * s];
      S.box(ctx, a[0] - 130 * s, a[1] - 60 * s, 260 * s, 120 * s, K.beat(t, 2.0, 0.6, 'lin'), { seed: 1 });
      S.label(ctx, 'Input', a[0], a[1] + 12 * s, K.beat(t, 2.4, 0.4, 'lin'), { align: 'center' });
      S.arrow(ctx, [a[0] + (P ? 0 : 140 * s), a[1] + (P ? 70 * s : 0)], [b[0] - (P ? 0 : 140 * s), b[1] - (P ? 70 * s : 0)], K.beat(t, 3.0, 0.7, 'lin'), { seed: 2 });
      S.box(ctx, b[0] - 130 * s, b[1] - 60 * s, 260 * s, 120 * s, K.beat(t, 3.6, 0.6, 'lin'), { seed: 3 });
      S.label(ctx, 'Output', b[0], b[1] + 12 * s, K.beat(t, 4.0, 0.4, 'lin'), { align: 'center' });

      // Beat 3 (6 to 9 s): the key number rolls under the diagram, emphasis lands as it settles.
      if (t > 6) {
        const cy = P ? H * 0.72 : 560 * s, v = K.count(t, 6.2, 1.6, 0, 1000000);
        S.counter(ctx, Math.round(v), W / 2, cy, 1, { size: P ? 96 : 110, align: 'center' });
        S.emphasis(ctx, W / 2, cy - 35 * s, 210 * s, K.beat(t, 7.8, 0.5, 'lin'), {});
      }
    } else {
      // Beat 4 (after the cut): the held takeaway on a clean frame.
      S.title(ctx, 'The takeaway, said once.', W / 2, P ? H * 0.5 : 380 * s, K.beat(t, 10.4, 1.0, 'lin'), { size: P ? 42 : 60, align: 'center' });
    }

    // One medium-true scene change when the story moves on (covers the frame around CUT).
    if (t > CUT - 0.6 && t < CUT + 0.6) S.transition(ctx, W, H, K.clamp((t - (CUT - 0.6)) / 1.2), {});

    S.finish(ctx, W, H, t);
  },

  score(k, S) {
    k.bed(S.sfx.bed || 'room', 0, this.duration, 1);
    const draw = (t, dur) => S.sfx.draw && k.play('scribble', t, { medium: S.sfx.draw, dur });
    draw(0.2, 1.2);
    draw(2.0, 0.6); k.play(S.sfx.land || 'pop', 2.5);
    draw(3.0, 0.7); draw(3.6, 0.6); k.play(S.sfx.land || 'pop', 4.1);
    k.play('count', 6.2, { dur: 1.6 }); k.play(S.sfx.emphasis || 'stamp', 7.8);
    k.play(S.sfx.transition || 'whoosh', 9.4, { dur: 1.0 });
    draw(10.4, 1.0); k.play('chime', 11.6);
  },
};
