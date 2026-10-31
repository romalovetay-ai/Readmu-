#!/usr/bin/env python3
"""Telegram channel tool (Bot API). Python stdlib only.

Setup: create a bot with @BotFather, add it to the channel as an administrator with "Post messages"
(and "Edit messages" / "Delete messages" if needed). Then:
  export TG_BOT_TOKEN=123456:ABC...   TG_CHANNEL=@my_channel   (or the numeric id -100...)
Never commit the token: store it as an environment secret.

Commands (text is HTML: <b>, <i>, <u>, <s>, <a href="">, <code>, <pre>, <blockquote>, <tg-spoiler>):
  telegram.py me                                   # check the token
  telegram.py post "text" | --file post.html [--silent] [--no-preview] [--button "Смотреть|https://youtu.be/..."]
  telegram.py photo img.jpg [--caption "..." | --caption-file c.html] [--button ...]
  telegram.py video clip.mp4 [--caption ...] [--thumb cover.jpg] [--button ...]   # files up to 50 MB
  telegram.py album a.jpg b.jpg clip.mp4 [--caption ...]                         # 2-10 media, caption on the first
  telegram.py audio voice.mp3 [--caption ...]
  telegram.py poll "Вопрос?" "Вариант 1" "Вариант 2" [...] [--anonymous]
  telegram.py edit MESSAGE_ID "new text" | --file post.html
  telegram.py delete MESSAGE_ID
  telegram.py pin MESSAGE_ID
  telegram.py stats                                # subscriber count and channel info
Bot API has no scheduled posts: schedule by running the command at the right time (cron / scheduled task).
Limits: text 4096 characters, caption 1024.
"""
import argparse, json, mimetypes, os, sys, urllib.error, urllib.request, uuid


def env(name):
    v = os.environ.get(name)
    if not v:
        sys.exit(f"{name} is not set. See the setup at the top of {__file__}")
    return v


def call(method, fields=None, files=None):
    url = f"https://api.telegram.org/bot{env('TG_BOT_TOKEN')}/{method}"
    fields = {k: v for k, v in (fields or {}).items() if v is not None}
    if files:
        fields = {k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list))
                      else str(v).lower() if isinstance(v, bool) else str(v)) for k, v in fields.items()}
        b = uuid.uuid4().hex
        body = b""
        for k, v in fields.items():
            body += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        for k, path in files.items():
            ct = mimetypes.guess_type(path)[0] or "application/octet-stream"
            body += (f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{os.path.basename(path)}"\r\n'
                     f"Content-Type: {ct}\r\n\r\n").encode() + open(path, "rb").read() + b"\r\n"
        body += f"--{b}--\r\n".encode()
        req = urllib.request.Request(url, body, {"Content-Type": f"multipart/form-data; boundary={b}"})
    else:
        req = urllib.request.Request(url, json.dumps(fields).encode(), {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        res = json.loads(e.read() or b"{}")
    if not res.get("ok"):
        sys.exit(f"Telegram error: {res.get('description', res)}")
    return res["result"]


def text_of(a, attr="text", file_attr="file", limit=4096):
    t = getattr(a, attr, None)
    f = getattr(a, file_attr, None)
    if f:
        t = open(f, encoding="utf-8").read().strip()
    if t and len(t) > limit:
        sys.exit(f"Text is {len(t)} characters; the limit here is {limit}")
    return t


def buttons(a):
    if not getattr(a, "button", None):
        return None
    rows = []
    for b in a.button:
        label, _, url = b.partition("|")
        rows.append([{"text": label, "url": url}])
    return {"inline_keyboard": rows}


def common(a):
    return {"chat_id": env("TG_CHANNEL"), "parse_mode": "HTML",
            "disable_notification": True if getattr(a, "silent", False) else None,
            "reply_markup": buttons(a)}


def done(r):
    ch = env("TG_CHANNEL").lstrip("@")
    link = f"https://t.me/{ch}/{r['message_id']}" if not ch.lstrip("-").isdigit() else ""
    print(json.dumps({"message_id": r["message_id"], "link": link}, ensure_ascii=False))


def cmd_post(a):
    f = common(a)
    f["text"] = text_of(a) or sys.exit("text or --file is required")
    if a.no_preview:
        f["link_preview_options"] = {"is_disabled": True}
    done(call("sendMessage", f))


def media(kind, field, a):
    f = common(a)
    f["caption"] = text_of(a, "caption", "caption_file", 1024)
    files = {field: getattr(a, "path")}
    if getattr(a, "thumb", None):
        files["thumbnail"] = a.thumb
    if kind == "sendVideo":
        f["supports_streaming"] = True
    done(call(kind, f, files))


def cmd_album(a):
    if not 2 <= len(a.paths) <= 10:
        sys.exit("An album takes 2-10 files")
    group, files = [], {}
    for i, p in enumerate(a.paths):
        ct = mimetypes.guess_type(p)[0] or ""
        kind = "video" if ct.startswith("video") else "photo"
        item = {"type": kind, "media": f"attach://f{i}"}
        if i == 0 and a.caption:
            item.update(caption=a.caption[:1024], parse_mode="HTML")
        group.append(item)
        files[f"f{i}"] = p
    r = call("sendMediaGroup", {"chat_id": env("TG_CHANNEL"), "media": group}, files)
    done(r[0])


def cmd_poll(a):
    r = call("sendPoll", {"chat_id": env("TG_CHANNEL"), "question": a.question,
                          "options": [{"text": o} for o in a.options], "is_anonymous": a.anonymous})
    done(r)


def cmd_edit(a):
    t = text_of(a)
    call("editMessageText", {"chat_id": env("TG_CHANNEL"), "message_id": a.message_id, "text": t, "parse_mode": "HTML"})
    print("edited", a.message_id)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = p.add_subparsers(dest="cmd", required=True)
    s.add_parser("me").set_defaults(f=lambda a: print(json.dumps(call("getMe"), ensure_ascii=False)))

    def opts(x, cap=True):
        x.add_argument("--silent", action="store_true"); x.add_argument("--button", action="append")
        if cap:
            x.add_argument("--caption"); x.add_argument("--caption-file")
    po = s.add_parser("post"); po.add_argument("text", nargs="?"); po.add_argument("--file")
    po.add_argument("--no-preview", action="store_true"); opts(po, False); po.set_defaults(f=cmd_post)
    for name, kind, field in (("photo", "sendPhoto", "photo"), ("video", "sendVideo", "video"), ("audio", "sendAudio", "audio")):
        x = s.add_parser(name); x.add_argument("path"); opts(x)
        if name == "video":
            x.add_argument("--thumb")
        x.set_defaults(f=lambda a, k=kind, fl=field: media(k, fl, a))
    al = s.add_parser("album"); al.add_argument("paths", nargs="+"); al.add_argument("--caption"); al.set_defaults(f=cmd_album)
    pl = s.add_parser("poll"); pl.add_argument("question"); pl.add_argument("options", nargs="+")
    pl.add_argument("--anonymous", action="store_true"); pl.set_defaults(f=cmd_poll)
    ed = s.add_parser("edit"); ed.add_argument("message_id", type=int); ed.add_argument("text", nargs="?")
    ed.add_argument("--file"); ed.set_defaults(f=cmd_edit)
    de = s.add_parser("delete"); de.add_argument("message_id", type=int)
    de.set_defaults(f=lambda a: (call("deleteMessage", {"chat_id": env("TG_CHANNEL"), "message_id": a.message_id}), print("deleted")))
    pn = s.add_parser("pin"); pn.add_argument("message_id", type=int)
    pn.set_defaults(f=lambda a: (call("pinChatMessage", {"chat_id": env("TG_CHANNEL"), "message_id": a.message_id,
                                                         "disable_notification": True}), print("pinned")))

    def stats(a):
        ch = call("getChat", {"chat_id": env("TG_CHANNEL")})
        n = call("getChatMemberCount", {"chat_id": env("TG_CHANNEL")})
        print(json.dumps({"title": ch.get("title"), "username": ch.get("username"), "subscribers": n,
                          "description": ch.get("description")}, ensure_ascii=False, indent=1))
    s.add_parser("stats").set_defaults(f=stats)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
