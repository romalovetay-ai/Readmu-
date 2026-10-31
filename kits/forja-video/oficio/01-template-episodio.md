---
tipo: wiki-pagina
categoria: sintese
tags: [tema, edicao-video, template, episodio, roteiro, pipeline]
atualizado: "2026-06-19"
fontes: 0
nota: "síntese — consolida conceitos já verificados; não introduz fato novo"
---

# 🎬 Template de episódio (esqueleto reaproveitável)

> Página de **síntese**: junta o que já está firme no tema num **esqueleto de
> vídeo** pronto pra reusar a cada personagem. Não traz fato novo — cada bloco
> linka o conceito que o fundamenta. Alvo: longo **~10-13 min** (zona validada no
> caso BR), faceless histórico, ascensão→queda.

## Esqueleto narrativo (a ordem dos blocos)

| # | Bloco | Duração-alvo | O que faz | Fundamento |
|---|---|---|---|---|
| 0 | **Pré-roteiro** | — | dossiê só com fato ✅ (separar fato×lenda) | rigor = fosso (monetizacao-conteudo-original-2026) |
| 1 | **Cold open** | ~0:00–0:30 | micro-cena sensorial que abre um loop; **gancho ANTES do card** | gancho-primeiros-15s, estudo-caso-referencias |
| 2 | **Card de título** | ~4s | identidade (nome + "ascensão e queda") | montador (`montar.py`) |
| 3 | **Ato I — o auge** | ~25-30% | mostrar renome/prosperidade (a queda precisa de altura); **incidente incitante** | arco-narrativo-ascensao-queda, unidades-roteiro-cena-sequencia |
| 4 | **Ato II — a virada** | ~45-50% | degraus que **viram valor**; nomear a **hamartia** (erro dele); **peripeteia** | unidades-roteiro-cena-sequencia, arco-narrativo-ascensao-queda |
| 5 | **Ato III — a queda** | ~20-25% | clímax que comove por **pena+medo**; **anagnórise** (entende tarde demais) | arco-narrativo-ascensao-queda |
| 6 | **Desfecho + legado + CTA** | ~últimos 30-60s | fecho de "uma ação completa" + CTA **caloroso PT-BR** | estudo-caso-referencias |

**Regras de fluxo (do que já validamos):**
- O vídeo é **uma ação completa** (começo/meio/fim), não fatos soltos.
- **Payoff a cada ~60-90s** (faixa, não relógio); cada bloco fecha um loop e abre outro → ritmo-e-pacing.
- **Cada cena = uma mudança de valor** (se tirar a cena e nada muda, ela não devia existir) → unidades-roteiro-cena-sequencia.
- A falha é **dele** e **humana** (reconhecível) — sem moralizar, sem inventar.

## Camadas técnicas (aplicadas em CADA cena)

```
imagem curada  →  Ken Burns  →  cor (preset)  →  [narração + pós-voz]  →  trilha (ducking)  →  legenda
```

- **Imagem:** curada e variada, análoga quando não há literal → b-roll-e-cobertura. (evitar slideshow genérico = cheira a template → risco monetização)
- **Movimento:** zoom/pan lento e com intenção → ken-burns-e-movimento _(por estética/cobertura, NÃO como alavanca de retenção — isso foi refutado)_.
- **Cor:** **correção ANTES da grade** pra unificar acervo Wikimedia díspar; preset dark/épico de partida → cor-e-look-cinematografico.
- **Voz:** edge-tts com cadência por **pontuação** (sem SSML custom) → narracao-edge-tts; depois **loudnorm -14 + comp/EQ/de-esser leves** → pos-processamento-voz.
- **Mix:** voz manda; trilha por baixo com **ducking**; mirar **~-14 LUFS** (normalização down-only) → mixagem-niveis.
- **Trilha/SFX:** sustentar emoção sem competir; silêncio/stingers ⚠️ ainda lacuna → sound-design-e-trilha.
- **Legenda:** SRT do Whisper → legendas-whisper.

## Packaging (fora do vídeo, decide se é visto)
- **Thumbnail:** 1-4 palavras, sans-serif bold, **alto contraste** (faceless) → thumbnail-e-titulo.
- **Título:** promessa **real** (o A/B nativo premia **watch time, não CTR** → clickbait perde).
- **Capítulos + descrição + créditos de imagem** ⚠️ (página de SEO/descoberta a escrever).

## Disciplina (gates do projeto)
`pesquisador-historico` (só fato ✅) → `roteirista-epico` (já com a lente trágica:
hamartia, pena+medo, cena=valor, peripeteia/anagnórise) → `revisor-roteiro` (barra
⚠️) → montador.

## Derivar Shorts do episódio
Cada episódio rende Shorts de descoberta: cortar um **momento autocontido** (uma virada/
cena com começo-meio-fim) em 9:16, e **linkar de volta ao longo** (Remix>Edit into a Short
ou "vídeo relacionado" no Studio). Detalhe em shorts-vertical-9x16. _(falta o modo
vertical no montador — trabalho técnico.)_

## Estado do conhecimento
Todas as frentes do ofício estão cobertas (gancho, arco, ritmo, voz, som, cor, imagem,
legenda, thumbnail/SEO, licenças, retenção, Shorts). O que falta agora é **prática**,
não mais pesquisa.
