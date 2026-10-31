# Kit de vídeo faceless — contexto de trabalho

Você está no **kit de produção de vídeo faceless** (canal dark de história, PT-BR,
épico-dramático, ascensão e queda). Stack **100% grátis/local**: ffmpeg + edge-tts +
Wikimedia/domínio público. Sem API paga (isso é fase "turbo", fora daqui).

## Pipeline e ferramentas
Siga a ordem: pesquisa → roteiro → revisão texto → narração → imagens → montagem →
revisão edição → thumbnail/SEO → shorts. Cada etapa tem agente ou skill próprios —
ver `LEIA-ME.md`. Os scripts reais estão em `scripts/` (ver `scripts/LEIA-ME.md` para
comandos e layout de workspace `<proj>/`).

## Regras não-negociáveis
- **Nunca narrar lenda como fato.** Só entra no roteiro o que está ✅ no dossiê. Fonte
  incerta → moldura honesta ("segundo…", "diz-se que…"). Rigor factual = defesa contra
  desmonetização (YouTube 2026 pune conteúdo automatizado sem valor).
- **Diferencial = pesquisa real + roteiro autoral + voz/identidade próprias.** Evite
  slideshow genérico e gimmicks (avatar/lipsync de retrato "falando").
- Antes de dizer "pronto/renderizou/funciona": **assista o resultado** e cole a
  evidência (segue a skill global `verification-before-completion`).
- Números de edição (gancho 15s, payoff 60-90s) são **heurística (faixa)**, não lei —
  a verdade é a curva de retenção real do canal.

## Ambiente
- Desenvolvido no Windows/PowerShell; os scripts acham o ffmpeg do WinGet sozinhos.
- No PowerShell, pipe corrompe input de script Python (injeta BOM) — passar texto
  por arquivo em vez de `echo ... | python`.

## O ofício (por que cada decisão)
`oficio/README.md` → sínteses em `oficio/`.
