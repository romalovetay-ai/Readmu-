"""
baixar.py - baixa as imagens do storyboard do Wikimedia Commons (dominio publico/livre).

- Resolve cada cena por BUSCA na API do Commons e baixa a versao ~1920px.
- Pula slugs que ja existem em img/ (assim voce pode SUBSTITUIR uma imagem
  manualmente: e so colocar um arquivo com o nome <slug>.jpg na pasta img/).
- Salva img/creditos.md com autor + licenca de cada imagem (pra descricao do video).

Uso:  python baixar.py
Sem dependencias externas (urllib/json da stdlib).
"""
import json, sys, re, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent      # .../producao
# projeto opcional: `python baixar.py tesla` -> usa producao/tesla/ e storyboard-tesla.json
PROJ = sys.argv[1] if len(sys.argv) > 1 else None
ROOT = BASE / PROJ if PROJ else BASE
IMG = ROOT / "img"
IMG.mkdir(parents=True, exist_ok=True)
_sb = f"storyboard-{PROJ}.json" if PROJ else "storyboard.json"
SB = json.loads((Path(__file__).parent / _sb).read_text(encoding="utf-8"))

API = "https://commons.wikimedia.org/w/api.php"
UA = "SangueEGloria/0.1 (canal de teste; uso pessoal/educacional)"

def http_get(url, tentativas=5):
    for t in range(tentativas):
        time.sleep(1.5)   # throttle: educado com o Wikimedia (evita 429)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and t < tentativas - 1:
                espera = 8 * (t + 1)
                print(f"   (429 - aguardando {espera}s e tentando de novo...)")
                time.sleep(espera)
                continue
            raise

def limpar_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()

RASTER = (".jpg", ".jpeg", ".png", ".tif", ".tiff")

def buscar_imagem(busca):
    """Busca os top resultados e escolhe, entre os mais relevantes, a MAIOR
    resolucao raster (evita mapinha/gif minusculo). Retorna tupla ou None."""
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": busca, "gsrnamespace": "6", "gsrlimit": "10",
        "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": "1920",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    data = json.loads(http_get(url).decode("utf-8"))
    pages = data.get("query", {}).get("pages")
    if not pages:
        return None
    # ordena por relevancia (index do search) e pega os 6 primeiros
    itens = []
    for page in pages.values():
        info = (page.get("imageinfo") or [None])[0]
        if info and not info.get("url", "").lower().endswith(".pdf"):   # nunca livros/PDF
            itens.append((page.get("index", 999), page, info))
    itens.sort(key=lambda x: x[0])
    top = itens[:6]
    raster = [(p, i) for _, p, i in top if (i.get("url", "").lower().endswith(RASTER))]
    naopdf = [(p, i) for _, p, i in top if not i.get("url", "").lower().endswith(".pdf")]
    pool = raster or naopdf or [(p, i) for _, p, i in top]
    if not pool:
        return None
    pool.sort(key=lambda pi: (pi[1].get("width", 0) * pi[1].get("height", 0)), reverse=True)
    page, info = pool[0]
    meta = info.get("extmetadata", {})
    autor = limpar_html(meta.get("Artist", {}).get("value", "")) or "desconhecido"
    lic = meta.get("LicenseShortName", {}).get("value", "") or "ver pagina"
    return (info.get("thumburl") or info.get("url"), info.get("descriptionurl", ""),
            autor, lic, page.get("title", busca))

def ja_existe(slug):
    return any(IMG.glob(slug + ".*"))

def main():
    slugs_busca = {}
    for c in SB["cenas"]:
        slugs_busca.setdefault(c["slug"], c["busca"])   # primeira busca por slug

    creditos = ["# Créditos das imagens (Wikimedia Commons)\n",
                "> Verificar a licença na página de cada arquivo. CC BY / BY-SA exigem atribuição.\n"]
    ok, pulados, falhas = 0, 0, 0
    for slug, busca in slugs_busca.items():
        # SEMPRE consulta o Commons p/ registrar o crédito (mesmo se a imagem já existe) —
        # senão o creditos.md fica incompleto ao re-rodar. Só PULA o download do que existe.
        try:
            res = buscar_imagem(busca)
            if not res:
                print(f"[FALHA] {slug}: sem resultado para '{busca}'")
                falhas += 1
                continue
            thumb, pagina, autor, lic, titulo = res
            creditos.append(f"- **{slug}** — {titulo} · autor: {autor} · licença: {lic} · {pagina}")
            if ja_existe(slug):
                print(f"[pula]  {slug} (ja existe — crédito registrado)")
                pulados += 1
                continue
            ext = ".png" if ".png" in thumb.lower() else ".jpg"
            dest = IMG / (slug + ext)
            dest.write_bytes(http_get(thumb))
            kb = dest.stat().st_size / 1024
            print(f"[ok]    {slug}{ext}  ({kb:.0f} KB)  <- {titulo}")
            ok += 1
        except Exception as e:
            print(f"[ERRO]  {slug}: {e}")
            falhas += 1

    (IMG / "creditos.md").write_text("\n".join(creditos) + "\n", encoding="utf-8")
    print(f"\nResumo: {ok} baixadas, {pulados} puladas, {falhas} falhas. Créditos em img/creditos.md")
    if falhas:
        print("Dica: pra cenas que falharam, coloque manualmente um arquivo <slug>.jpg em img/ e rode de novo.")

if __name__ == "__main__":
    main()
