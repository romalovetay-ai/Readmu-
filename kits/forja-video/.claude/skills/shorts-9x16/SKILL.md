---
name: shorts-9x16
description: >
  Corta SHORTS verticais 9:16 (1080x1920) a partir de um trecho da narração do vídeo
  longo. Use quando pedirem "faz um short", "corta um vertical", "tira um clipe pro
  Shorts/Reels/TikTok", ou depois que o longo estiver montado. Reenquadra sem cortar o
  sujeito, legenda no terço central (safe zone), mesma cor/áudio do longo. Explica como
  escolher o trecho e o funil de volta pro longo.
---

# Shorts verticais 9:16 (funil de descoberta)

Cada episódio rende Shorts. Usa `../../scripts/shorts.py` + `shorts-<proj>.json`.
Objetivo: um **momento autocontido** (uma virada com começo-meio-fim) que puxa gente
pro canal e **linka de volta** ao longo.

## Escolher o trecho
- Um momento com **começo, meio e fim** em ≤60s: o cold open, uma peripeteia, uma
  revelação. Não um pedaço no meio de uma frase.
- Anote a janela em segundos da narração do longo (`ini`/`fim`).

## shorts-<proj>.json
Veja `../../templates/shorts-exemplo.json`:
```jsonc
{
  "narracao": "tesla-narracao.mp3",   // o MP3 do longo (em <proj>/)
  "srt":      "tesla-narracao.srt",   // opcional; recortado e queimado no centro
  "ini": 0.0, "fim": 19.79,            // janela da narração (s)
  "saida": "shorts/tesla-coldopen.mp4",
  "cenas": [ { "slug": "feira-chicago", "peso": 5 }, ... ]
}
```

## Rodar
```powershell
python shorts.py <proj>
```

## O que o script aplica
- **9:16 1080x1920, 30fps** (specs oficiais). Miramos ≤60s.
- **Reframe sem cortar o sujeito:** imagem inteira (fit) sobre fundo borrado.
- **Legenda no terço central** (safe zone): fora do topo ~20% e da base ~25%, onde
  fica a UI do app.
- **Mesma grade dark + Ken Burns + `loudnorm -14`** do longo → look consistente.

## Funil (feito no YouTube, não no script)
Ligue o Short de volta ao longo: **Remix > Edit into a Short**, ou marque o longo como
"vídeo relacionado" no Studio. Sem isso o Short não converte em inscrito.

## Verificação
Assista no celular (ou em janela estreita): a legenda está na zona segura? O sujeito
não foi cortado? Prende nos 2 primeiros segundos?
