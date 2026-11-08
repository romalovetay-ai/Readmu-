"""Telegram Bot API helper for the channel. Token: env TELEGRAM_BOT_TOKEN. Settings: config.json.

    python3 tg.py check                         # bot ok? admin in the channel?
    python3 tg.py chats                         # who wrote /start to the bot -> your admin_chat_id
    python3 tg.py post  --photo out/card.jpg --text out/post.html   # mode from config: draft | auto
    python3 tg.py post  ... --now               # straight to the channel, ignoring draft mode
    python3 tg.py sync                          # publish drafts you approved with the ✅ button

Draft mode: the bot sends the finished post (photo + caption) to your DM with two buttons.
✅ Опубликовать -> on the next `sync` the bot copies exactly that message into the channel.
✏️ Переделать  -> the draft is marked and skipped. Telegram keeps button presses for 24 h, so sync at
least once a day. Caption text is Telegram HTML (<b>, <i>, <a href>), up to 1024 characters.
"""
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, "config.json")))


def api(method, fields=None, files=None):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        sys.exit("Нет TELEGRAM_BOT_TOKEN в переменных среды.")
    url = f"https://api.telegram.org/bot{token}/{method}"
    fields = {k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else str(v))
              for k, v in (fields or {}).items()}
    if files:
        b = uuid.uuid4().hex
        body = b""
        for k, v in fields.items():
            body += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        for k, path in files.items():
            body += (f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{os.path.basename(path)}"\r\n'
                     f"Content-Type: image/jpeg\r\n\r\n").encode() + open(path, "rb").read() + b"\r\n"
        body += f"--{b}--\r\n".encode()
        req = urllib.request.Request(url, body, {"Content-Type": f"multipart/form-data; boundary={b}"})
    else:
        req = urllib.request.Request(url, urllib.parse.urlencode(fields).encode())
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)["result"]
    except urllib.error.HTTPError as e:
        sys.exit(f"Telegram: {e.code} {e.read().decode()}")


def send(chat, photo, caption, buttons=None):
    f = {"chat_id": chat, "caption": caption, "parse_mode": "HTML"}
    if buttons:
        f["reply_markup"] = {"inline_keyboard": [buttons]}
    return api("sendPhoto", f, {"photo": photo})


def cmd_check(_):
    me = api("getMe")
    print(f"Бот: @{me['username']}")
    ch = api("getChat", {"chat_id": CFG["channel"]})
    print(f"Канал: {ch.get('title')} ({CFG['channel']})")
    m = api("getChatMember", {"chat_id": CFG["channel"], "user_id": me["id"]})
    print(f"Права бота в канале: {m['status']}, может публиковать: {m.get('can_post_messages', False)}")
    print(f"Режим: {CFG['mode']}, admin_chat_id: {CFG.get('admin_chat_id') or 'не задан'}")


def cmd_chats(_):
    seen = {}
    for u in api("getUpdates", {"allowed_updates": ["message"]}):
        m = u.get("message")
        if m:
            seen[m["chat"]["id"]] = m["chat"].get("username") or m["chat"].get("first_name")
    for cid, name in seen.items():
        print(cid, name)
    if not seen:
        print("Пусто. Напишите боту /start в личку и запустите ещё раз.")


def cmd_post(a):
    caption = open(a.text, encoding="utf8").read().strip()
    if len(caption) > 1024:
        sys.exit(f"Подпись {len(caption)} символов, максимум 1024. Сократи.")
    if CFG["mode"] == "auto" or a.now:
        r = send(CFG["channel"], a.photo, caption)
        print(f"Опубликовано: message_id {r['message_id']}")
    else:
        if not CFG.get("admin_chat_id"):
            sys.exit("Режим draft, но admin_chat_id не задан (см. `tg.py chats`).")
        r = send(CFG["admin_chat_id"], a.photo, caption,
                 [{"text": "✅ Опубликовать", "callback_data": "pub"}, {"text": "✏️ Переделать", "callback_data": "redo"}])
        print(f"Черновик отправлен в личку: message_id {r['message_id']}")


def cmd_sync(_):
    ups = api("getUpdates", {"allowed_updates": ["callback_query"]})
    done = 0
    for u in ups:
        q = u.get("callback_query")
        if not q or str(q["from"]["id"]) != str(CFG.get("admin_chat_id")):
            continue
        msg = q["message"]
        if q["data"] == "pub":
            api("copyMessage", {"chat_id": CFG["channel"], "from_chat_id": msg["chat"]["id"], "message_id": msg["message_id"]})
            label, done = "✅ Опубликовано", done + 1
        else:
            label = "✏️ На переделку"
        api("editMessageReplyMarkup", {"chat_id": msg["chat"]["id"], "message_id": msg["message_id"],
                                        "reply_markup": {"inline_keyboard": [[{"text": label, "callback_data": "x"}]]}})
        api("answerCallbackQuery", {"callback_query_id": q["id"], "text": label})
    if ups:
        api("getUpdates", {"offset": ups[-1]["update_id"] + 1})  # confirm, so presses are not handled twice
    print(f"Опубликовано одобренных: {done}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check")
    sub.add_parser("chats")
    p = sub.add_parser("post")
    p.add_argument("--photo", required=True)
    p.add_argument("--text", required=True)
    p.add_argument("--now", action="store_true")
    sub.add_parser("sync")
    a = ap.parse_args()
    {"check": cmd_check, "chats": cmd_chats, "post": cmd_post, "sync": cmd_sync}[a.cmd](a)


if __name__ == "__main__":
    main()
