# Ofício — o que decide a qualidade (cheat-sheet)

Resumo acionável do que estudei sobre edição faceless. As sínteses completas estão
aqui (`00-overview.md`, `01-template-episodio.md`), destiladas de uma base de 24+
conceitos com fontes citadas e claims verificadas ou refutadas.

> Regra de honestidade: os números abaixo são **heurística (faixa)**, não lei. A única
> verdade dura de retenção é a curva do seu próprio canal.

## Roteiro / narrativa
- **Arco ascensão→queda**: uma ação completa, não fatos soltos. Queda por **hamartia**
  (erro humano dele), não por maldade. Comove por **pena + medo**.
- **Cada cena = uma mudança de valor.** Se remover e nada muda, corte.
- **Payoff a cada ~60-90s.** Cold open abre um loop nos primeiros 15s, antes do card.
- Marque **peripeteia** (a fortuna vira) e **anagnórise** (entende tarde demais).

## Narração
- edge-tts sem SSML → cadência pela **pontuação** (vírgula/travessão/reticências).
- Pós: `loudnorm -14` + comp/EQ/de-esser leves. Voz manda, tela ancora os dados.

## Som
- Trilha por baixo com **ducking** (sidechain). Alvo **~-14 LUFS**, normalização down-only.
- **Silêncio** dramático tem função (use loudnorm linear pra não matá-lo). **Stinger**
  grave na virada. Trilha épica-tensa de base + íntima no ato sombrio.

## Imagem / look / movimento
- **Correção ANTES da grade** (unifica acervo Wikimedia díspar). Grade dark/épico:
  contraste, leve dessaturação, sombras frias + altas quentes, vignette.
- **Ken Burns** por estética/cobertura (NÃO como alavanca mágica de retenção — refutado).
- Imagem inteira sobre fundo borrado (não corta o sujeito). Overlay de partículas = "tela viva".
- **Evite slideshow genérico** → cheira a template → risco de desmonetização 2026.

## Legenda
- SRT do próprio TTS (alinhado) ou Whisper. Burn-in legível; no Short vai no terço central.

## Packaging (decide se é visto)
- **Thumbnail:** 1-4 palavras, sans-serif bold, alto contraste, legível no mobile.
- **Título:** promessa **real** — o A/B nativo premia **watch time, não CTR**. Clickbait perde.
- Capítulos + descrição com gancho + **créditos de imagem** (CC BY/BY-SA exigem atribuição).

## Shorts
- 9:16 1080x1920, ≤60s, momento autocontido. Legenda no terço central. **Linkar de
  volta** ao longo (Remix > Edit into a Short) — o funil é feito no YouTube.

## Monetização 2026 (o fosso)
- YouTube desmonetiza "conteúdo automatizado sem valor". Diferencial = **pesquisa real
  + roteiro autoral + voz e identidade próprias**. Rigor factual = fosso, não detalhe.
- Evitar: avatar/lipsync/face-swap de retrato histórico "falando" (gimmick marcado).

## Licenças / imagem
- Domínio público (arte pré-~1920, bustos, gravuras) = acervo livre farto. Figura
  moderna = foto com copyright → risco. `baixar.py` gera `img/creditos.md` por arquivo.
