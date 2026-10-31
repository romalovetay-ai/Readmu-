# Scripts do pipeline (grátis/local: ffmpeg + edge-tts)

Estes são os scripts **reais e provados** do canal faceless. Rodam 100% local, sem API paga.

## Como os caminhos resolvem (importante)
Cada script assume um **workspace** ao lado da pasta `scripts/`:

```
_kit-video/
├─ scripts/            ← você roda os .py daqui
│  └─ storyboard-<proj>.json / shorts-<proj>.json   ← o storyboard fica JUNTO do script
├─ <proj>/             ← pasta de trabalho do episódio (ex.: tesla/)
│  ├─ img/             ← imagens baixadas (baixar.py) ou trocadas à mão
│  ├─ <proj>-narracao.mp3 + .srt   ← saída do narrar.py
│  ├─ musica.mp3       ← trilha (opcional; ativa ducking automático)
│  └─ <saida>.mp4      ← vídeo final
```

Rodar **sem** argumento usa a raiz `<proj>` vazia e `storyboard.json`.
Rodar `python montar.py tesla` usa `tesla/` + `storyboard-tesla.json`.

## Ordem de produção (pipeline ponta-a-ponta)

```
1. roteiro.txt      →  narrar.py     →  narração .mp3 + legenda .srt
2. storyboard.json  →  baixar.py     →  img/*.jpg + img/creditos.md  (Wikimedia/domínio público)
3. narração+img+sb  →  montar.py     →  vídeo longo .mp4  (Ken Burns, cor, ducking, legenda)
4. storyboard       →  thumb.py      →  thumbnail 1280x720
5. shorts.json      →  shorts.py     →  Short 9:16 (recorte de um trecho do longo)
```

## Comandos

| Script | O que faz | Uso |
|---|---|---|
| `narrar.py` | texto → narração + legenda (edge-tts, voz `pt-BR-AntonioNeural`, `-6%`/`-2Hz`). Legenda sai do próprio TTS (alinhamento perfeito, sem Whisper). | `python narrar.py roteiro.txt tesla/tesla-narracao.mp3` |
| `baixar.py` | baixa cada cena do storyboard no Wikimedia Commons (~1920px) + escreve `img/creditos.md` (autor+licença). Pula slugs que já existem (troca manual). | `python baixar.py tesla` |
| `baixar_musica.py` | baixa trilha livre de copyright. | `python baixar_musica.py tesla` |
| `montar.py` | monta o vídeo: distribui a duração da narração pelas cenas (campo `peso`), Ken Burns, grade de cor dark, overlay de partículas, ducking da trilha (sidechain), `loudnorm -14` linear, card/intro, legenda burn-in. | `python montar.py tesla` |
| `thumb.py` | thumbnail no layout do canal (marca+título+retrato). Lê `thumb_img/thumb_titulo/thumb_sub` do storyboard. | `python thumb.py tesla` |
| `shorts.py` | corta um trecho da narração do longo em Short 9:16, legenda no terço central (safe zone). | `python shorts.py tesla` |
| `upscalar.py` | upscale de imagens fracas via Real-ESRGAN (baixe o binário à parte). | `python upscalar.py` |
| `particulas.py` | (re)gera o overlay `assets/particulas.mp4` (poeira/brasa, blend screen). | `python particulas.py` |

## Requisitos
- **ffmpeg + ffprobe** no PATH — `winget install Gyan.FFmpeg` (os scripts também
  acham o binário do WinGet automaticamente).
- **Python 3.12** + `pip install -r requirements.txt` (só `edge-tts`).
- Fonte serifada em `C:\Windows\Fonts` (Georgia/Times) pro card de título.

## Decisões de qualidade embutidas nos scripts (o "porquê")
- **Voz `-6%`/`-2Hz`** = um tico mais lenta e grave → mais dramática sem arrastar.
- **`loudnorm` linear 2-passos** preserva o silêncio dramático (o single-pass mata
  silêncio); alvo **-14 LUFS** (padrão YouTube).
- **Ducking por sidechain** = a trilha abaixa sozinha quando a voz entra.
- **Correção ANTES da grade** (`normalize`+`deband`) unifica o acervo Wikimedia díspar.
- **Imagem inteira sobre fundo borrado** (não corta o sujeito) + Ken Burns por cima.
- **`silencio`/`stinger_em`** no storyboard = som por ato (silêncio na morte, boom na virada).

Ver o ofício completo em `../oficio/`.
