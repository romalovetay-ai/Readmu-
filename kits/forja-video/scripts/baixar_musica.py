"""
baixar_musica.py - baixa UMA trilha em dominio publico/livre do Wikimedia Commons.

Salva em producao/musica.<ext> (o montar.py acha por glob 'musica.*' e mistura baixinho).
Troque a busca pra mudar o clima. Default: Allegretto da 7a de Beethoven (solene/epico).

Uso:  python baixar_musica.py  [ "busca opcional entre aspas" ]
"""
import json, sys, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
API = "https://commons.wikimedia.org/w/api.php"
UA = "SangueEGloria/0.1 (canal de teste; uso pessoal/educacional)"
AUDIO = (".ogg", ".oga", ".mp3", ".flac", ".wav", ".opus")
BUSCA = sys.argv[1] if len(sys.argv) > 1 else "Beethoven Symphony No. 7 Allegretto"

def http_get(url, tentativas=5):
    for t in range(tentativas):
        time.sleep(1.5)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and t < tentativas - 1:
                print(f"   (429 - aguardando {8*(t+1)}s...)"); time.sleep(8 * (t + 1)); continue
            raise

def main():
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": BUSCA, "gsrnamespace": "6", "gsrlimit": "15",
        "prop": "imageinfo", "iiprop": "url|size|mediatype|extmetadata",
    }
    data = json.loads(http_get(API + "?" + urllib.parse.urlencode(params)).decode("utf-8"))
    pages = data.get("query", {}).get("pages", {})
    itens = []
    for p in pages.values():
        info = (p.get("imageinfo") or [None])[0]
        if info and info.get("url", "").lower().endswith(AUDIO):
            itens.append((p.get("index", 999), p, info))
    if not itens:
        sys.exit(f"Nenhum audio encontrado para '{BUSCA}'. Tente outra busca.")
    itens.sort(key=lambda x: x[0])           # por relevancia
    _, page, info = itens[0]
    url = info["url"]
    ext = "." + url.rsplit(".", 1)[-1].lower()
    dest = BASE / ("musica" + ext)
    # remove musica.* anterior pra nao deixar duas trilhas
    for old in BASE.glob("musica.*"):
        old.unlink()
    dest.write_bytes(http_get(url))
    meta = info.get("extmetadata", {})
    autor = meta.get("Artist", {}).get("value", "")
    lic = meta.get("LicenseShortName", {}).get("value", "ver pagina")
    mb = dest.stat().st_size / (1024 * 1024)
    print(f"trilha: {dest.name} ({mb:.1f} MB)  <- {page.get('title')}")
    print(f"licenca: {lic}  | pagina: {info.get('descriptionurl','')}")
    print("(se CC BY/BY-SA, creditar na descricao do video)")

if __name__ == "__main__":
    main()
