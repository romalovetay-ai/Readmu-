#!/usr/bin/env python3
"""YouTube channel tool: upload, thumbnail, captions, playlists, stats, analytics. Python stdlib only.

One-time setup (Google Cloud Console):
  1. Create a project, enable "YouTube Data API v3" and "YouTube Analytics API".
  2. OAuth consent screen -> External, add your Google account as a test user.
  3. Credentials -> OAuth client ID -> "Desktop app". Copy client id and secret.
  4. export YT_CLIENT_ID=... YT_CLIENT_SECRET=...
     python3 .claude/tools/youtube.py auth
     Open the printed link, allow access. The browser then fails to load http://localhost/?code=...:
     copy the whole address from the address bar and paste it here. The tool prints YT_REFRESH_TOKEN.
  5. Store YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN as environment secrets (never commit them).

Commands:
  youtube.py auth
  youtube.py upload video.mp4 --title T --description-file d.txt [--tags a,b] [--privacy private|unlisted|public]
             [--publish-at 2026-11-05T15:00:00Z] [--thumbnail t.jpg] [--captions subs.srt --lang ru]
             [--playlist PLAYLIST_ID] [--category 22] [--made-for-kids] [--lang ru]
  youtube.py thumbnail VIDEO_ID t.jpg
  youtube.py captions VIDEO_ID subs.srt [--lang ru] [--name "Русский"]
  youtube.py update VIDEO_ID [--title T] [--description-file d.txt] [--tags a,b] [--privacy P] [--publish-at ISO]
  youtube.py playlist-add PLAYLIST_ID VIDEO_ID
  youtube.py channel                       # channel stats + latest 50 uploads with views/likes/comments (JSON)
  youtube.py videos VIDEO_ID[,VIDEO_ID...]   # stats for given videos
  youtube.py comments VIDEO_ID [--max 100]  # top-level comments (for yt-comment / comment-mining)
  youtube.py reply COMMENT_ID "text"         # reply to a comment
  youtube.py analytics [--days 28] [--video VIDEO_ID] [--metrics views,estimatedMinutesWatched,...] [--dimensions day]
  youtube.py retention VIDEO_ID              # audience retention curve CSV (elapsedVideoTimeRatio, audienceWatchRatio) for yt-retention
Uploads cost 1600 quota units of the default 10000/day; publishing at a planned time = --privacy private --publish-at.
"""
import argparse, json, mimetypes, os, sys, urllib.parse, urllib.request, urllib.error, uuid
from datetime import date, timedelta

API = "https://www.googleapis.com/youtube/v3"
UPLOAD = "https://www.googleapis.com/upload/youtube/v3"
ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports"
SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/yt-analytics.readonly"]
REDIRECT = "http://localhost"


def env(name):
    v = os.environ.get(name)
    if not v:
        sys.exit(f"{name} is not set. See the setup steps at the top of {__file__}")
    return v


def http(method, url, data=None, headers=None, raw=False):
    headers = dict(headers or {})
    body = data
    if isinstance(data, (dict, list)):
        body = json.dumps(data).encode()
        headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            out = r.read()
            return (r, out) if raw else (json.loads(out) if out else {})
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} {method} {url.split('?')[0]}\n{e.read().decode(errors='replace')}")


def token():
    data = urllib.parse.urlencode({
        "client_id": env("YT_CLIENT_ID"), "client_secret": env("YT_CLIENT_SECRET"),
        "refresh_token": env("YT_REFRESH_TOKEN"), "grant_type": "refresh_token"}).encode()
    return http("POST", "https://oauth2.googleapis.com/token", data,
                {"Content-Type": "application/x-www-form-urlencoded"})["access_token"]


def auth_headers():
    return {"Authorization": "Bearer " + token()}


def cmd_auth(a):
    q = urllib.parse.urlencode({"client_id": env("YT_CLIENT_ID"), "redirect_uri": REDIRECT,
                                "response_type": "code", "scope": " ".join(SCOPES),
                                "access_type": "offline", "prompt": "consent"})
    print("Open this link, allow access, then paste the full http://localhost/?code=... address:\n")
    print("https://accounts.google.com/o/oauth2/v2/auth?" + q + "\n")
    pasted = input("> ").strip()
    code = urllib.parse.parse_qs(urllib.parse.urlparse(pasted).query).get("code", [pasted])[0]
    data = urllib.parse.urlencode({"code": code, "client_id": env("YT_CLIENT_ID"),
                                   "client_secret": env("YT_CLIENT_SECRET"), "redirect_uri": REDIRECT,
                                   "grant_type": "authorization_code"}).encode()
    r = http("POST", "https://oauth2.googleapis.com/token", data,
             {"Content-Type": "application/x-www-form-urlencoded"})
    if "refresh_token" not in r:
        sys.exit(f"No refresh token returned: {r}")
    print("\nYT_REFRESH_TOKEN=" + r["refresh_token"])


def read_text(path):
    return open(path, encoding="utf-8").read() if path else None


def snippet_from(a, base=None):
    sn = dict(base or {})
    if a.title:
        if len(a.title) > 100:
            sys.exit(f"Title is {len(a.title)} characters; YouTube allows 100")
        sn["title"] = a.title
    desc = read_text(getattr(a, "description_file", None))
    if desc is not None:
        if len(desc.encode()) > 5000:
            sys.exit("Description exceeds 5000 bytes")
        sn["description"] = desc
    if a.tags:
        sn["tags"] = [t.strip() for t in a.tags.split(",") if t.strip()]
    if getattr(a, "category", None):
        sn["categoryId"] = a.category
    if getattr(a, "lang", None):
        sn["defaultLanguage"] = sn["defaultAudioLanguage"] = a.lang
    return sn


def status_from(a, base=None):
    st = dict(base or {})
    if a.privacy:
        st["privacyStatus"] = a.privacy
    if a.publish_at:
        st["privacyStatus"] = "private"   # YouTube requires private for scheduled publishing
        st["publishAt"] = a.publish_at
    if getattr(a, "made_for_kids", None) is not None:
        st["selfDeclaredMadeForKids"] = bool(a.made_for_kids)
    return st


def multipart_upload(url, meta, path, headers):
    """Small files (thumbnails, captions): multipart/related in one request."""
    boundary = uuid.uuid4().hex
    ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
    body = (f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{json.dumps(meta)}\r\n"
            f"--{boundary}\r\nContent-Type: {ctype}\r\n\r\n").encode() + open(path, "rb").read() + f"\r\n--{boundary}--".encode()
    h = dict(headers, **{"Content-Type": f"multipart/related; boundary={boundary}"})
    return http("POST", url, body, h)


def cmd_upload(a):
    h = auth_headers()
    meta = {"snippet": snippet_from(a, {"categoryId": a.category or "22"}),
            "status": status_from(a, {"privacyStatus": "private", "selfDeclaredMadeForKids": bool(a.made_for_kids)})}
    if "title" not in meta["snippet"]:
        sys.exit("--title is required")
    size = os.path.getsize(a.video)
    r, _ = http("POST", f"{UPLOAD}/videos?uploadType=resumable&part=snippet,status", meta,
                dict(h, **{"X-Upload-Content-Type": "video/*", "X-Upload-Content-Length": str(size)}), raw=True)
    session = r.headers["Location"]
    chunk, sent, video_id = 32 * 1024 * 1024, 0, None
    with open(a.video, "rb") as f:
        while sent < size:
            part = f.read(chunk)
            end = sent + len(part) - 1
            req = urllib.request.Request(session, data=part, method="PUT", headers=dict(
                h, **{"Content-Length": str(len(part)), "Content-Range": f"bytes {sent}-{end}/{size}"}))
            try:
                with urllib.request.urlopen(req, timeout=600) as resp:
                    video_id = json.loads(resp.read())["id"]
            except urllib.error.HTTPError as e:
                if e.code != 308:
                    sys.exit(f"Upload failed: HTTP {e.code} {e.read().decode(errors='replace')}")
            sent = end + 1
            print(f"uploaded {sent * 100 // size}%", file=sys.stderr)
    print(json.dumps({"videoId": video_id, "url": f"https://youtu.be/{video_id}"}, ensure_ascii=False))
    if a.thumbnail:
        cmd_thumbnail(argparse.Namespace(video_id=video_id, image=a.thumbnail))
    if a.captions:
        cmd_captions(argparse.Namespace(video_id=video_id, srt=a.captions, lang=a.lang or "ru", name=None))
    if a.playlist:
        cmd_playlist_add(argparse.Namespace(playlist_id=a.playlist, video_id=video_id))


def cmd_thumbnail(a):
    if os.path.getsize(a.image) > 2 * 1024 * 1024:
        sys.exit("Thumbnail must be under 2 MB (1280x720 JPG recommended)")
    ctype = mimetypes.guess_type(a.image)[0] or "image/jpeg"
    r = http("POST", f"{UPLOAD}/thumbnails/set?videoId={a.video_id}", open(a.image, "rb").read(),
             dict(auth_headers(), **{"Content-Type": ctype}))
    print("thumbnail set", json.dumps(r.get("items", [{}])[0].get("maxres", {}) or r.get("items", [{}])[0].get("default", {})))


def cmd_captions(a):
    meta = {"snippet": {"videoId": a.video_id, "language": a.lang, "name": a.name or "", "isDraft": False}}
    r = multipart_upload(f"{UPLOAD}/captions?uploadType=multipart&part=snippet", meta, a.srt, auth_headers())
    print("captions uploaded", r.get("id"))


def cmd_update(a):
    h = auth_headers()
    cur = http("GET", f"{API}/videos?part=snippet,status&id={a.video_id}", headers=h)["items"]
    if not cur:
        sys.exit("video not found")
    cur = cur[0]
    body = {"id": a.video_id, "snippet": snippet_from(a, {k: cur["snippet"][k] for k in
            ("title", "description", "tags", "categoryId", "defaultLanguage") if k in cur["snippet"]})}
    parts = ["snippet"]
    if a.privacy or a.publish_at:
        body["status"] = status_from(a, {"privacyStatus": cur["status"]["privacyStatus"]})
        parts.append("status")
    r = http("PUT", f"{API}/videos?part={','.join(parts)}", body, h)
    print(json.dumps({"id": r["id"], "title": r["snippet"]["title"], "status": r.get("status")}, ensure_ascii=False))


def cmd_playlist_add(a):
    body = {"snippet": {"playlistId": a.playlist_id, "resourceId": {"kind": "youtube#video", "videoId": a.video_id}}}
    http("POST", f"{API}/playlistItems?part=snippet", body, auth_headers())
    print("added to playlist", a.playlist_id)


def video_stats(ids, h):
    out = []
    for i in range(0, len(ids), 50):
        r = http("GET", f"{API}/videos?part=snippet,statistics,contentDetails,status&id={','.join(ids[i:i+50])}", headers=h)
        for v in r.get("items", []):
            out.append({"id": v["id"], "title": v["snippet"]["title"], "published": v["snippet"]["publishedAt"],
                        "duration": v["contentDetails"]["duration"], "privacy": v["status"]["privacyStatus"],
                        **{k: int(x) for k, x in v["statistics"].items() if x.isdigit()}})
    return out


def cmd_channel(a):
    h = auth_headers()
    ch = http("GET", f"{API}/channels?part=snippet,statistics,contentDetails&mine=true", headers=h)["items"][0]
    uploads = ch["contentDetails"]["relatedPlaylists"]["uploads"]
    items = http("GET", f"{API}/playlistItems?part=contentDetails&maxResults=50&playlistId={uploads}", headers=h).get("items", [])
    ids = [i["contentDetails"]["videoId"] for i in items]
    print(json.dumps({"channel": {"id": ch["id"], "title": ch["snippet"]["title"], **ch["statistics"]},
                      "videos": video_stats(ids, h)}, ensure_ascii=False, indent=1))


def cmd_videos(a):
    print(json.dumps(video_stats(a.ids.split(","), auth_headers()), ensure_ascii=False, indent=1))


def cmd_comments(a):
    h, out, page = auth_headers(), [], ""
    while len(out) < a.max:
        r = http("GET", f"{API}/commentThreads?part=snippet&order=relevance&maxResults=100&textFormat=plainText"
                        f"&videoId={a.video_id}" + (f"&pageToken={page}" if page else ""), headers=h)
        for t in r.get("items", []):
            c = t["snippet"]["topLevelComment"]["snippet"]
            out.append({"id": t["snippet"]["topLevelComment"]["id"], "author": c["authorDisplayName"],
                        "text": c["textDisplay"], "likes": c["likeCount"], "replies": t["snippet"]["totalReplyCount"],
                        "published": c["publishedAt"]})
        page = r.get("nextPageToken")
        if not page:
            break
    print(json.dumps(out[:a.max], ensure_ascii=False, indent=1))


def cmd_reply(a):
    r = http("POST", f"{API}/comments?part=snippet", {"snippet": {"parentId": a.comment_id, "textOriginal": a.text}}, auth_headers())
    print("replied", r.get("id"))


def analytics(h, metrics, dimensions="", filters="", days=28, sort=""):
    q = {"ids": "channel==MINE", "startDate": str(date.today() - timedelta(days=days)),
         "endDate": str(date.today()), "metrics": metrics}
    if dimensions: q["dimensions"] = dimensions
    if filters: q["filters"] = filters
    if sort: q["sort"] = sort
    return http("GET", ANALYTICS + "?" + urllib.parse.urlencode(q), headers=h)


def print_table(r):
    cols = [c["name"] for c in r.get("columnHeaders", [])]
    print(",".join(cols))
    for row in r.get("rows", []) or []:
        print(",".join(str(x) for x in row))


def cmd_analytics(a):
    filters = f"video=={a.video}" if a.video else ""
    print_table(analytics(auth_headers(), a.metrics, a.dimensions, filters, a.days))


def cmd_retention(a):
    print_table(analytics(auth_headers(), "audienceWatchRatio,relativeRetentionPerformance",
                          "elapsedVideoTimeRatio", f"video=={a.video_id}", a.days))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = p.add_subparsers(dest="cmd", required=True)
    s.add_parser("auth").set_defaults(f=cmd_auth)

    def meta_args(x):
        x.add_argument("--title"); x.add_argument("--description-file"); x.add_argument("--tags")
        x.add_argument("--privacy", choices=["private", "unlisted", "public"]); x.add_argument("--publish-at")
    u = s.add_parser("upload"); u.add_argument("video"); meta_args(u)
    u.add_argument("--thumbnail"); u.add_argument("--captions"); u.add_argument("--lang", default="ru")
    u.add_argument("--playlist"); u.add_argument("--category"); u.add_argument("--made-for-kids", action="store_true")
    u.set_defaults(f=cmd_upload)
    t = s.add_parser("thumbnail"); t.add_argument("video_id"); t.add_argument("image"); t.set_defaults(f=cmd_thumbnail)
    c = s.add_parser("captions"); c.add_argument("video_id"); c.add_argument("srt"); c.add_argument("--lang", default="ru")
    c.add_argument("--name"); c.set_defaults(f=cmd_captions)
    up = s.add_parser("update"); up.add_argument("video_id"); meta_args(up); up.set_defaults(f=cmd_update, category=None, lang=None)
    pa = s.add_parser("playlist-add"); pa.add_argument("playlist_id"); pa.add_argument("video_id"); pa.set_defaults(f=cmd_playlist_add)
    s.add_parser("channel").set_defaults(f=cmd_channel)
    v = s.add_parser("videos"); v.add_argument("ids"); v.set_defaults(f=cmd_videos)
    cm = s.add_parser("comments"); cm.add_argument("video_id"); cm.add_argument("--max", type=int, default=100); cm.set_defaults(f=cmd_comments)
    rp = s.add_parser("reply"); rp.add_argument("comment_id"); rp.add_argument("text"); rp.set_defaults(f=cmd_reply)
    an = s.add_parser("analytics"); an.add_argument("--days", type=int, default=28); an.add_argument("--video")
    an.add_argument("--metrics", default="views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes,comments,shares")
    an.add_argument("--dimensions", default="day"); an.set_defaults(f=cmd_analytics)
    rt = s.add_parser("retention"); rt.add_argument("video_id"); rt.add_argument("--days", type=int, default=365); rt.set_defaults(f=cmd_retention)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
