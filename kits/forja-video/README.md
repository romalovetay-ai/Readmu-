# forja-video

Kit de produção de **vídeo faceless** para o [Claude Code](https://claude.com/claude-code):
agentes, skills e os scripts Python que levam um episódio de documentário narrado da
pesquisa até o Short — **100% local e sem API paga** (ffmpeg + edge-tts + Wikimedia).

Feito para canal de história em PT-BR (épico-dramático, arco de ascensão e queda), mas o
pipeline serve qualquer canal narrado sem rosto.

## O pipeline

| Etapa | Ferramenta | O que sai |
|---|---|---|
| 1. Pesquisa + fact-check | agente `pesquisador-historico` | dossiê com fontes, separando ✅ verificado de ⚠️ lenda |
| 2. Roteiro | skill `roteiro-faceless` / agente `roteirista-epico` | roteiro marcado (🎙️ narração, 🎞️ visual, 🅣 texto, 🎵 trilha) |
| 3. Revisão do texto | agente `revisor-roteiro` | aponta fato frágil, ritmo e claim que desmonetiza |
| 4. Narração + legenda | skill `narracao-tts` → `narrar.py` | `.mp3` + `.srt` alinhado pelo próprio TTS |
| 5. Imagens | `baixar.py` | imagens do Wikimedia + `creditos.md` com autor e licença |
| 6. Montagem | skill `montar-video` → `montar.py` | `.mp4` com Ken Burns, grade dark, ducking, loudnorm |
| 7. Revisão da edição | agente `revisor-retencao` | riscos de queda de retenção, pacing, som, cor |
| 8. Thumbnail + SEO | skill `thumbnail-titulo-seo` → `thumb.py` | thumb 1280×720, títulos, descrição, tags |
| 9. Shorts | skill `shorts-9x16` → `shorts.py` | vertical 1080×1920 com legenda na safe zone |

## O que ele tenta resolver

**Erro factual é o risco número um.** A disciplina é encadeada: o pesquisador separa fato
de lenda, o roteirista só pode usar o que está ✅, e o revisor barra se algum ⚠️ vazou.
Fonte incerta entra com moldura honesta ("diz-se que…"), nunca narrada como fato.

**Vídeo automatizado sem valor é desmonetizado.** Por isso os dois revisores são
adversariais — o trabalho deles é achar o que está ruim, não aprovar. E por isso o kit
evita slideshow genérico: pesquisa real, roteiro autoral, identidade própria.

## Decisões de qualidade embutidas

Estão nos scripts porque foram testadas, não porque soam bem:

- **Voz a −6% de velocidade e −2 Hz de tom** — um tico mais lenta e grave fica dramática
  sem arrastar.
- **`loudnorm` linear em 2 passagens**, alvo −14 LUFS. O modo de passagem única mata o
  silêncio dramático.
- **Ducking por sidechain** — a trilha abaixa sozinha quando a voz entra.
- **Correção antes da grade de cor** (`normalize` + `deband`) — unifica um acervo do
  Wikimedia que vem de fontes muito diferentes.
- **Imagem inteira sobre fundo borrado**, nunca cortando o sujeito, com Ken Burns por cima.
- **Legenda do próprio edge-tts** (`SentenceBoundary`), não do Whisper: o alinhamento é
  exato porque vem de quem gerou o áudio.

## Uso

```bash
pip install -r scripts/requirements.txt
winget install Gyan.FFmpeg          # ffmpeg + ffprobe no PATH
```

Os scripts rodam de `scripts/`, com uma pasta de trabalho por episódio ao lado —
`scripts/LEIA-ME.md` tem o layout e os comandos de cada um.

Com o Claude Code, aponte o `.claude` do seu projeto para `.claude/skills` e
`.claude/agents` daqui (junction no Windows, symlink no resto) e peça
"pesquisa o \<personagem\>" para começar.

**A pasta `identidade/` não vem no repo** — é a marca do canal, e a do meu não é sua.
Ponha o ícone do seu em `identidade/icone.jpg` antes de rodar o `thumb.py`.

## O ofício

`oficio/` tem o porquê das decisões — o que é heurística de retenção e o que é regra,
o template de episódio, e a lente trágica usada nos roteiros (hamartia, peripeteia,
cena = valor). Vale ler antes de mexer nos números.

## Licença

MIT — veja [LICENSE](LICENSE). As imagens que o `baixar.py` traz são do Wikimedia Commons
e têm licença própria: ele escreve `img/creditos.md` com autor e licença de cada uma, e
esse crédito precisa ir na descrição do vídeo.
