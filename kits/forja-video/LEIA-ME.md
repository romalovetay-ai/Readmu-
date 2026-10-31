# 🎬 Kit de vídeo faceless (Claude) — narração, edição e produção

Guia de operação do kit. Para a visão geral, veja o `README.md`.

Kit **portátil e autocontido** com o que aprendi produzindo canal faceless de história
(dark, PT-BR, ascensão e queda): os **agentes**, as **skills**, os **scripts reais** do
pipeline grátis/local (ffmpeg + edge-tts + Wikimedia) e o **ofício** destilado. Basta
copiar a pasta e recriar o `.claude` — ver o fim deste arquivo.

## O que tem aqui

```
_kit-video/
├─ LEIA-ME.md              ← este guia
├─ CLAUDE.md               ← contexto que o Claude carrega ao trabalhar no kit
├─ .claude/
│  ├─ agents/              ← 5 agentes (pesquisa → roteiro → revisão → SEO → retenção)
│  └─ skills/              ← 5 skills executáveis do pipeline
├─ scripts/                ← os .py REAIS e provados (+ LEIA-ME com a ordem e os comandos)
│  └─ assets/particulas.mp4
├─ templates/              ← storyboard-exemplo.json, shorts-exemplo.json
├─ identidade/             ← ícone/foto/banner do SEU canal (pro thumb.py; fora do repo)
└─ oficio/                 ← ofício destilado (cheat-sheet + 2 sínteses da biblioteca)
```

## Pipeline ponta-a-ponta (quem faz o quê)

| Etapa | Ferramenta do kit | Grátis/local |
|---|---|---|
| 1. Pesquisa + fact-check | agente `pesquisador-historico` → `pesquisa/<slug>.md` | web |
| 2. Roteiro (arco trágico) | skill `roteiro-faceless` / agente `roteirista-epico` → `roteiros/<slug>.md` | ✅ |
| 3. Revisão do texto | agente `revisor-roteiro` (adversarial, barra fato/ritmo) | ✅ |
| 4. Narração + legenda | skill `narracao-tts` → `narrar.py` (edge-tts) | ✅ |
| 5. Imagens | `baixar.py` (Wikimedia/domínio público + créditos) | ✅ |
| 6. Montagem | skill `montar-video` → `montar.py` (Ken Burns, cor, ducking, loudnorm) | ✅ |
| 7. Revisão da edição | agente `revisor-retencao` (adversarial, pacing/som/cor) | ✅ |
| 8. Thumbnail + SEO | skill `thumbnail-titulo-seo` / agente `titulos-thumb-seo` → `thumb.py` | ✅ |
| 9. Shorts | skill `shorts-9x16` → `shorts.py` | ✅ |

> Disciplina factual encadeada: pesquisador separa fato×lenda ✅⚠️ → roteirista só usa
> ✅ → revisor barra se ⚠️ vazou. É a defesa contra desmonetização por erro factual.

## Como usar
1. Com o `.claude` do projeto apontando pra cá, as skills/agentes ficam ativos (setup abaixo).
2. Comece um episódio: peça "pesquisa o \<personagem\>" (dispara o `pesquisador-historico`),
   depois "escreve o roteiro" (skill `roteiro-faceless`), e siga o pipeline.
3. Os scripts rodam de `scripts/` com um workspace `<proj>/` ao lado — detalhes em
   `scripts/LEIA-ME.md`.

## Requisitos
- **ffmpeg + ffprobe** (`winget install Gyan.FFmpeg`)
- **Python 3.12** + `pip install -r scripts/requirements.txt` (só `edge-tts`)
- Fonte serifada em `C:\Windows\Fonts` (card de título)

## Ofício (o "porquê" das decisões)
`oficio/README.md` (cheat-sheet) → `oficio/00-overview.md` e `01-template-episodio.md`.

## Além do grátis/local (referência)
- **Trilha original:** MusicGen local — ver
  [musicgen-local](https://github.com/LucasSKrewer/musicgen-local). Atenção: os pesos do
  MusicGen são CC-BY-NC, ou seja, **não comercial**.
- **Imagem por GPU local:** ComfyUI + SDXL, com LoRA de estilo próprio, para gerar cena
  em vez de depender só do acervo do Wikimedia.
- **Fase "turbo" (IA paga):** geração de imagem/vídeo/música por API — fora deste kit,
  que é deliberadamente grátis e local.

## Levar pro PC do trabalho (portabilidade)
1. Copie a pasta `_kit-video` inteira.
2. No projeto de destino, aponte o `.claude` pras skills/agentes do kit — o jeito mais
   simples no Windows é **junction** (não precisa de admin), do diretório do projeto:
   ```powershell
   cmd /c mklink /J .claude\skills <caminho>\_kit-video\.claude\skills
   cmd /c mklink /J .claude\agents <caminho>\_kit-video\.claude\agents
   ```
   (ou simplesmente copie `_kit-video\.claude\{skills,agents}` pra dentro do `.claude`
   do projeto). O ffmpeg + edge-tts precisam estar instalados na máquina.
