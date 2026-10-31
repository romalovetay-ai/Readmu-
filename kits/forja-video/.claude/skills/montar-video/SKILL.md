---
name: montar-video
description: >
  Monta o VÍDEO longo faceless a partir da narração + storyboard + imagens, via ffmpeg
  (grátis/local). Use quando pedirem "monta o vídeo", "renderiza o episódio", "junta
  narração com as imagens", ou depois que narração e imagens estiverem prontas. Cuida
  de Ken Burns, grade de cor dark, overlay de partículas, ducking da trilha, loudnorm
  -14, card/intro, legenda burn-in. Também explica o storyboard.json. NÃO gera narração
  (`narracao-tts`) nem faz Shorts (`shorts-9x16`).
---

# Montagem do vídeo longo (ffmpeg, grátis/local)

Usa `../../scripts/montar.py` + `baixar.py`. O motor distribui a duração da narração
entre as cenas pelo campo `peso` e aplica todas as camadas de qualidade.

## Fluxo
```powershell
# do diretório _kit-video/scripts
python baixar.py <proj>     # baixa img/*.jpg do Wikimedia + img/creditos.md
python montar.py <proj>     # gera o <proj>/<saida>.mp4
```
Antes de rodar, confira: existe `<proj>/<proj>-narracao.mp3` (+ `.srt`) e o
`storyboard-<proj>.json` está ao lado do script. Trilha opcional: `<proj>/musica.*`.

## Anatomia do storyboard-<proj>.json
Veja `../../templates/storyboard-exemplo.json`. Campos:
```jsonc
{
  "narracao": "tesla-narracao.mp3",   // dentro de <proj>/
  "saida":    "nikola-tesla.mp4",
  "titulo":   "O CRONISTA",            // card/intro
  "nome":     "NIKOLA TESLA",
  "subtitulo":"Glória e Ruína",
  "tagline":  "...",
  "legenda":  true,                    // burn-in do .srt
  "normalizar": true,                  // correção de cor ANTES da grade
  "particulas": true,                  // overlay poeira/brasa
  "silencio":  [aaa, bbb],             // corta a trilha a zero nessa janela (ex.: a morte)
  "stinger_em": ttt,                   // boom grave sintetizado nesse instante (a virada)
  "thumb_img": "slug", "thumb_titulo": "...", "thumb_sub": "...",  // pro thumb.py
  "cenas": [
    { "slug": "feira-chicago", "peso": 5 },   // imagem: baixada por baixar.py
    { "slug": "raio",          "peso": 3, "video": "broll/raio.mp4" }  // b-roll em vídeo
  ]
}
```
- **`peso`** = fatia proporcional da duração. Some dos pesos = 100%. Cena mais longa
  = peso maior. Pense em ritmo: batalhas curtas (peso baixo), morte demorada (peso alto).
- **`slug`** = nome do arquivo em `img/`. Pra trocar uma imagem à mão, coloque
  `img/<slug>.jpg` e o `baixar.py` pula (não sobrescreve).

## Camadas que o script aplica (o ofício embutido)
1. **Correção → grade.** `normalize`+`deband` unifica o acervo Wikimedia díspar; a
   grade dark/épico (`eq`+`colorbalance` teal-laranja+`vignette`) vem depois. Ver
   `../../oficio/`.
2. **Enquadramento sem cortar o sujeito:** imagem inteira sobre fundo borrado dela
   mesma (cover+blur), com **Ken Burns** (zoom lento ~1.0→1.22) por cima.
3. **Partículas:** overlay de poeira/brasa (blend screen) → "tela viva". Desliga com
   `"particulas": false`.
4. **Áudio:** narração manda; trilha por baixo com **ducking** (sidechain); `loudnorm
   -14` **linear** (preserva silêncio dramático). `silencio` zera a trilha na janela;
   `stinger_em` insere um boom grave na peripeteia.
5. **Abertura:** intro animada (Remotion, se existir) ou card estático (fonte serifada).
6. **Legenda:** burn-in do `.srt`, deslocada pra casar com a intro.

## Verificação (obrigatória antes de dizer "pronto")
- Rode e **assista** o `.mp4`: os primeiros 15s prendem? A cor não estourou? A voz
  está acima da trilha? O silêncio da morte ficou? A legenda casa com a fala?
- O script imprime duração + tamanho no fim. Se a cor ficou forte demais, baixe o
  `contrast`/`saturation` na constante `GRADE` do `montar.py` (calibrar no olho).

## Depois
`thumb.py <proj>` (thumbnail) e a skill `shorts-9x16` (cortes verticais).
