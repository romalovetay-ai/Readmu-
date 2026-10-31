---
tipo: wiki-pagina
categoria: sintese
tags: [tema, edicao-video, faceless, dark, overview]
atualizado: "2026-06-20"
fontes: 12
---

# 🎬 Edição de vídeo faceless — visão geral

> 🟢 **11 fontes ingeridas** (#1 retenção+monetização · #2 som+thumbnail+Ken Burns ·
> #3 roteiro/narrativa · #4 narração/edge-tts · #5 cor/look · #6 licenças/PD ·
> #7 sound design+curva de retenção · #8 SEO/descoberta · #9 Shorts · #10 sub-lacunas ·
> #11 métricas/descoberta YouTube). **Comece pelo
> template-de-episodio** (síntese acionável). Conceitos firmes:
> arco-narrativo-ascensao-queda, unidades-roteiro-cena-sequencia, gancho-primeiros-15s,
> psicologia-gancho-curiosidade, ritmo-e-pacing, narracao-edge-tts, pos-processamento-voz, mixagem-niveis,
> sound-design-e-trilha, cor-e-look-cinematografico, ken-burns-e-movimento,
> thumbnail-e-titulo, seo-descoberta-youtube, shorts-vertical-9x16,
> licencas-dominio-publico, curva-de-retencao, monetizacao-conteudo-original-2026.
> ✅ **Todas as frentes grandes fechadas.** Resta implementação técnica (modo vertical no
> montador) e sub-lacunas menores. Lembrete: números de edição são **heurística (faixa)**,
> não dado experimental — só a curva de retenção do canal vira dado duro.

## O que é "edição faceless"
Montar um vídeo onde **ninguém aparece**: a narração conduz, e a imagem (arte,
foto, gravura, B-roll, vídeo) + a trilha sustentam a atenção. O editor não corta
um "talento" falando — ele **constrói o ritmo do zero** a partir de áudio +
acervo visual. É o nosso caso no "Sangue e Glória".

## Por que é um tema próprio (e não uma nota)
Editar faceless tem um corpo de ofício que cresce: gancho, pacing, sound design,
cor, legendas, thumbnail, formato curto. Vale acumular ao longo do tempo,
cruzando cada fonte com o **pipeline real** que já temos.

## O pipeline já existe — falta o ofício
O lado **técnico** está provado ponta-a-ponta:

| Etapa | Ferramenta (grátis/local) | Conceito de edição que decide a qualidade |
|---|---|---|
| Narração | edge-tts (voz neural) | narracao-edge-tts — ritmo, ênfase, respiro |
| Movimento | Ken Burns via ffmpeg | ken-burns-e-movimento — quando/quanto mexer |
| Cenas | montador (storyboard.json, peso=duração) | ritmo-e-pacing — duração por cena, corte na deixa |
| Trilha | Biblioteca de Áudio / Pixabay | sound-design-e-trilha — nível, stinger, silêncio |
| Legenda | Whisper local (SRT) | legendas-whisper — timing, quebra de linha |
| Abertura | card de título | gancho-primeiros-15s — prender nos 1ºs segundos |

A máquina monta; **este tema ensina o que pôr na máquina pra reter o espectador.**

## As perguntas que o tema vai responder (TODO → fontes)
1. **Retenção:** o que segura nos 1ºs 15s e ao longo do vídeo? (gancho-primeiros-15s, curva-de-retencao)
2. **Ritmo:** quanto tempo por cena? quando cortar? (ritmo-e-pacing)
3. **Som:** como misturar narração × trilha × SFX sem cansar? (sound-design-e-trilha, mixagem-niveis)
4. **Look:** o que dá o visual "dark/cinematográfico"? (cor-e-look-cinematografico)
5. **Alcance:** Shorts (shorts-vertical-9x16), thumbnail/título (thumbnail-e-titulo).
6. **Regras:** monetização 2026 vs conteúdo automatizado ⚠️ (monetizacao-conteudo-original-2026).

## Como alimentar este tema
Operação INGERIR da skill `wiki-conhecimento`: *"li/assisti tal fonte sobre
edição, adiciona"*. O Claude salva em `raw/`, escreve a página-resumo em
`wiki/fontes/`, cria/atualiza os conceitos acima e registra no log.

## Relacionado
- Cheat-sheet acionável: `README.md` · Template de episódio: `01-template-episodio.md`
