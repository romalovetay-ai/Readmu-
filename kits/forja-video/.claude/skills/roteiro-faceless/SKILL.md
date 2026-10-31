---
name: roteiro-faceless
description: >
  Escreve o ROTEIRO de um vídeo faceless histórico/documental (canal dark, PT-BR,
  ~10-13 min, arco de ascensão e queda), a partir de um dossiê de fatos. Use quando
  pedirem "escreve o roteiro do X", "transforma a pesquisa em vídeo", "monta o script",
  ou quando for começar um episódio novo do canal. Aplica a lente trágica (hamartia,
  pena+medo, cena=valor, peripeteia/anagnórise), o gancho dos 15s e a marcação de
  produção (🎙️🎞️🅣🎵). NÃO gera narração nem monta vídeo — isso é `narracao-tts` e
  `montar-video`. NÃO faz a pesquisa factual — isso é o agente `pesquisador-historico`.
---

# Roteiro faceless (canal dark / história trágica)

Você escreve o roteiro de um episódio faceless a partir de um **dossiê só com fatos
verificados** (✅). O produto é um `.md` de roteiro com marcação de produção, pronto
pra virar narração e storyboard.

## Antes de escrever
1. Se ainda **não há dossiê**, pare e peça/rode o agente `pesquisador-historico` — o
   canal não pode narrar lenda como fato (desmonetização). Só use a seção ✅ do dossiê.
2. Leia `../../oficio/01-template-episodio.md` — é o esqueleto canônico deste kit.

## Esqueleto (alvo ~10-13 min ≈ 1.500-1.900 palavras a ~150 ppm)

| # | Bloco | Duração | O que faz |
|---|---|---|---|
| 1 | **Cold open** | 0:00–0:30 | micro-cena sensorial que abre um loop; o gancho mais forte do dossiê, **antes** do card |
| 2 | **Card/vinheta** | ~5s | identidade (nome + "ascensão e queda") |
| 3 | **Ato I — o auge** | 25-30% | mostrar renome/prosperidade (a queda precisa de altura) + incidente incitante |
| 4 | **Ato II — a virada** | 45-50% | degraus que viram valor; nomear a **hamartia** (o erro dele); **peripeteia** |
| 5 | **Ato III — a queda** | 20-25% | clímax que comove por **pena + medo**; **anagnórise** (entende tarde demais) |
| 6 | **Desfecho + legado + CTA** | últimos 30-60s | fecha "uma ação completa"; ecoa a abertura; CTA caloroso PT-BR |

## Regras de ouro (o que separa retenção de slideshow)
- **Uma ação completa**, não fatos soltos. Começo, meio, fim.
- **Cada cena = uma mudança de valor.** Se remover a cena e nada muda, ela não devia existir.
- **Payoff a cada ~60-90s** (faixa, não relógio): cada bloco fecha um loop e abre outro.
- **A queda é por HAMARTIA, não por maldade** — o personagem é humano, reconhecível
  ("como nós"). Nem santo, nem monstro. Nomeie o erro e deixe-o causar a queda.
- **Comover = pena + medo:** a queda não pode parecer 100% merecida (pena) e a falha
  tem que ser humana (medo).
- **Honestidade vira drama:** quando a fonte é incerta, narre com moldura ("segundo
  Arriano…", "ninguém sabe ao certo…"). Nunca invente.

## Narração pro OUVIDO (a voz é edge-tts, sem SSML)
- Controle a cadência pela **pontuação**: vírgula = respiro, travessão = corte,
  reticências = suspense. **Pausa dramática tem função — não corte.**
- Frases que respiram bem faladas. Evite excesso de números/datas na voz — vão na
  tela (🅣); a voz conta a HISTÓRIA, a tela ancora os dados.

## Marcação obrigatória (uma por linha, com timestamp aproximado por seção)
- 🎙️ narração · 🎞️ visual sugerido · 🅣 texto na tela · 🎵 trilha
- Para cada bloco 🎙️, sugira um 🎞️ pensando em **domínio público** (bustos, mosaicos,
  pinturas, mapas, gravuras) — o `baixar.py` vai buscar no Wikimedia. Slugs curtos
  (ex.: `busto-alexandre`, `batalha-gaugamela`) viram as cenas do storyboard.

## Notas de produção (no fim do arquivo)
- Imagens-chave sugeridas (+ lembrete de conferir licença por arquivo).
- Trilha (uma faixa épica-tensa de base + uma mais íntima pro ato sombrio).
- Ritmo (Ken Burns em todo still; cortes secos nas batalhas, lentos na morte;
  candidatos a `silencio`/`stinger_em` no storyboard).
- Duração-alvo e o que cortar primeiro se passar.
- O que ficou pra v2 (os ⚠️ do dossiê não usados).

## Frontmatter do roteiro
`video` (título de trabalho) · `canal` · `formato` · `narracao` (voz) · `base` (arquivo
de pesquisa) · `duracao_estimada` · `gerado`.

## Ao terminar
Devolva a contagem de palavras estimada, a duração-alvo, e os 3 candidatos a Short
(momentos autocontidos). Depois passe pelo agente `revisor-roteiro` **antes** de produzir.
