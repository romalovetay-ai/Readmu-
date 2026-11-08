"""Collect fresh posts from public Telegram channels (web preview t.me/s/<name>, no login).

    python3 fetch.py                 # new posts from all channels in sources.txt -> out/candidates.json
    python3 fetch.py --all           # ignore the "already seen" list
    python3 fetch.py --mark-seen     # also remember them so the next run skips them

Each candidate: channel, id, link, date, text, images (urls), views. Ads, pure reposts and posts
without text are dropped here; the topic choice (finance only) is made when the post is rewritten.
"""
import argparse
import html
import json
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SEEN = os.path.join(HERE, "state", "seen.json")
OUT = os.path.join(HERE, "out", "candidates.json")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
AD_WORDS = ("#реклама", "erid", "реклама.", "на правах рекламы", "промокод", "подписывайтесь на")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf8", "replace")


def clean(fragment):
    s = re.sub(r"<br\s*/?>", "\n", fragment)
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s).strip()


def parse(channel, page):
    posts = []
    for block in page.split('class="tgme_widget_message_wrap')[1:]:
        m = re.search(r'data-post="([^"/]+)/(\d+)"', block)
        if not m:
            continue
        tx = re.search(r'class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', block, re.S)
        text = clean(tx.group(1)) if tx else ""
        dt = re.search(r'datetime="([^"]+)"', block)
        views = re.search(r'tgme_widget_message_views">([^<]+)<', block)
        imgs = re.findall(r"tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'\)", block)
        posts.append({
            "channel": channel, "id": int(m.group(2)), "link": f"https://t.me/{channel}/{m.group(2)}",
            "date": dt.group(1) if dt else "", "text": text, "images": imgs,
            "views": views.group(1) if views else "", "forwarded": "tgme_widget_message_forwarded_from" in block,
        })
    return posts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--mark-seen", action="store_true")
    a = ap.parse_args()
    channels = [l.strip().lstrip("@").split("/")[-1] for l in open(os.path.join(HERE, "sources.txt")) if l.strip()]
    seen = json.load(open(SEEN)) if os.path.exists(SEEN) else {}
    out = []
    for ch in channels:
        try:
            posts = parse(ch, get(f"https://t.me/s/{ch}"))
        except Exception as e:  # one dead channel must not stop the rest
            print(f"{ch}: ошибка {e}")
            continue
        last = seen.get(ch, 0)
        fresh = [p for p in posts if a.all or p["id"] > last]
        good = [p for p in fresh if len(p["text"]) >= 60 and not p["forwarded"]
                and not any(w in p["text"].lower() for w in AD_WORDS)]
        print(f"{ch}: всего {len(posts)}, новых {len(fresh)}, годных {len(good)}")
        out += good
        if a.mark_seen and posts:
            seen[ch] = max(last, max(p["id"] for p in posts))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
    if a.mark_seen:
        json.dump(seen, open(SEEN, "w"), ensure_ascii=False, indent=1)
    print(f"-> {OUT} ({len(out)} постов)")


if __name__ == "__main__":
    main()
