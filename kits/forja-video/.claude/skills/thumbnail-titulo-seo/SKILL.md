---
name: thumbnail-titulo-seo
description: >
  Empacota o vídeo pra descoberta: THUMBNAIL (arte + geração), TÍTULOS de alto CTR,
  descrição com capítulos e créditos, e tags. Use quando pedirem "títulos pro vídeo",
  "ideia/arte de thumbnail", "o que ponho na descrição", "SEO do vídeo", ou depois do
  roteiro aprovado. Gera a arte da thumb com o `thumb.py` real do kit. Título e
  thumbnail decidem o CTR — é metade do sucesso.
---

# Thumbnail + título + SEO (empacotamento)

## Thumbnail — conceito E arte
Conceito primeiro, depois gere com `../../scripts/thumb.py`.
- **Imagem-base:** domínio público (busto/mosaico/pintura), rosto forte, olhar.
- **Texto:** 1–4 palavras, sans-serif bold, **alto contraste** — legível no celular.
- **Paleta:** sangue/dourado/sombra combinam com a marca dark.
- Gerar a arte (layout marca+ícone+título+retrato):
  ```powershell
  python thumb.py <proj>
  ```
  Lê `thumb_img` / `thumb_titulo` / `thumb_sub` do `storyboard-<proj>.json` e usa o
  ícone do canal em `../../identidade/icone.jpg`. Saída 1280x720.
- Upscale de imagem-base fraca: `upscalar.py` (Real-ESRGAN, baixar binário à parte).

## Títulos (5–7 opções)
- 50–60 caracteres, curiosidade **sem** clickbait mentiroso (o A/B nativo do YouTube
  premia **watch time, não CTR** — falsa promessa derruba retenção e o algoritmo pune).
- Ancore na tensão do arco: ascensão→queda, o mistério, a contradição
  (ex.: "venceu o mundo e perdeu o futuro"). Use o nome do personagem (busca).
- Varie os ângulos (mistério da morte / lado sombrio / a queda / a conquista) e
  **marque a recomendada** com o porquê.

## Descrição
- 1º parágrafo (2–3 linhas): gancho + keywords naturais (aparece na busca).
- **Capítulos/timestamps** a partir das seções do roteiro (`00:00 Cold open`, …).
- **Créditos de imagem** (CC BY / BY-SA exigem atribuição — puxe de
  `<proj>/img/creditos.md` que o `baixar.py` gera) + fontes da pesquisa.
- CTA de inscrição + próximo vídeo.

## Tags / keywords (10–15)
Nome do personagem (PT + variações), "história", "documentário", período/civilização,
termos do nicho dark/épico. Valide volume com busca web se útil — sem inventar dados.

## Saída
Salve o pacote em `<proj>-seo.md` (títulos, conceito de thumb, descrição, tags) e
resuma no chat: título recomendado + qualquer atribuição obrigatória de licença.
