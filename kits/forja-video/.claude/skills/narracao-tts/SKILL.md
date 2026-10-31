---
name: narracao-tts
description: >
  Gera a NARRAÇÃO neural (mp3) + LEGENDA (srt) de um roteiro faceless, grátis e local,
  via edge-tts. Use quando pedirem "gera a narração", "narra o roteiro", "cria a voz do
  vídeo", ou depois que o roteiro estiver aprovado e antes de montar. Voz dramática
  PT-BR (`pt-BR-AntonioNeural`, -6% rate / -2Hz pitch); a legenda sai do próprio TTS
  (alinhamento perfeito, sem Whisper). NÃO escreve o roteiro (`roteiro-faceless`) nem
  monta o vídeo (`montar-video`).
---

# Narração + legenda (edge-tts, grátis/local)

Transforma o texto da narração num `.mp3` + `.srt` alinhado, usando o script real
`../../scripts/narrar.py`.

## Preparo do texto
1. Extraia **só a narração 🎙️** do roteiro para um `.txt` limpo (sem marcações
   🎞️🅣🎵, sem timestamps, sem cabeçalhos). É esse texto que a voz vai ler.
2. A cadência é controlada pela **pontuação** (edge-tts não aceita SSML custom):
   vírgula = respiro curto, travessão = corte, reticências = suspense. Ajuste a
   pontuação do texto se quiser mudar o ritmo — não há outro botão.

## Rodar
```powershell
# do diretório _kit-video/scripts
python narrar.py <texto.txt> <proj>/<proj>-narracao.mp3
# a legenda .srt sai automática ao lado do .mp3
```
Ex.: `python narrar.py tesla-narracao.txt tesla/tesla-narracao.mp3`

## O que o script decide (e por quê)
- **Voz `pt-BR-AntonioNeural`, rate `-6%`, pitch `-2Hz`** → mais lenta e grave =
  dramática, sem arrastar. (Ajuste `VOICE/RATE/PITCH` no topo do script se quiser
  outra voz — ex.: `pt-BR-FranciscaNeural` feminina.)
- **Legenda do próprio TTS** (SentenceBoundary: offset+duração+texto) → alinhamento
  perfeito, dispensa Whisper. Frases longas (>84 chars) quebram em ~2 partes com
  tempo proporcional (cada parte ≈ 2 linhas no burn-in).

## Saída e verificação
O script imprime: nº de palavras, nº de legendas e duração em minutos. **Confira a
duração** contra a duração-alvo do roteiro antes de montar — é o número que o
`montar.py` usa pra distribuir as cenas.

## Alternativas de voz (referência)
- Outras vozes PT-BR do edge-tts: `pt-BR-AntonioNeural`, `pt-BR-FranciscaNeural`,
  `pt-BR-ThalitaNeural`. Liste com `edge-tts --list-voices`.
- Para voz local sem depender da MS (offline total): **Piper TTS** (validado no
  laboratório-gpu do Lucas) — troca de motor, mesmo lugar no pipeline.
