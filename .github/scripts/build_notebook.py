#!/usr/bin/env python3
"""Builds OP's notebook on the website: notebook/index.html, a page per published card (notebook/<id>.html) and its picture
(notebook/<id>.png), in the site's own look. The cards come from OP's server (/notebook.json); only published cards are there.
Run by .github/workflows/notebook.yml every 15 minutes. Pages for cards taken out of the notebook are removed."""
import html, json, os, re, sys, urllib.request

FEED = os.environ.get("NOTEBOOK_FEED", "https://veritas-quaesitor-production.up.railway.app/notebook.json")
SITE = "https://veritasquaesitorcai.github.io/veritas-quaesitor"
OUT = "notebook"

def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": "VQ-notebook-builder/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    return data if binary else data.decode("utf-8")

def flat(x, n):
    return re.sub(r"\s+", " ", str(x or ""))[:n]

def sid_of(it):
    return re.sub(r"[^0-9a-f]", "", str(it.get("id") or ""))[:12]

def h(x):
    return html.escape(str(x or ""), quote=True)

STYLE = """
<style>
body{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)!important;min-height:100vh!important;margin:0;padding:0;overflow-x:hidden;color:#fff}
.clickable-ai-truth{font-size:.75rem!important;padding:.15rem .5rem!important;display:inline-block;white-space:nowrap}
.logo{display:flex;align-items:center;gap:.5rem}
.social-nav{display:flex;gap:.6rem;align-items:center;margin-left:auto}
.social-nav a{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(255,140,66,.2);color:#ff8c42;font-weight:700;text-decoration:none}
.social-nav a:hover{background:#ff8c42;color:#fff}
nav a.active{position:relative;color:#ff8c42!important;font-weight:700}
header.hero.nb-hero{background:linear-gradient(180deg,rgba(12,9,32,.78) 0%,rgba(12,9,32,.45) 18%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 50%,rgba(12,9,32,.6) 72%,rgba(12,9,32,.94) 100%),url('../HERO_IMG') !important;
background-size:cover!important;background-position:center 55%!important;background-repeat:no-repeat!important;min-height:clamp(520px,48vw,780px)!important;
padding:5.25rem 2rem 5.5rem!important;margin:0!important;position:relative!important;display:flex;flex-direction:column;text-align:center}
header.hero.nb-hero.small{min-height:clamp(320px,30vw,460px)!important;padding-bottom:3.5rem!important}
.nb-hero .hero-content{flex:1;display:flex;flex-direction:column;align-items:center}
.nb-hero h1{font-size:3.5rem;color:#ff8c42;text-shadow:2px 2px 8px rgba(0,0,0,.8);margin:0 0 .25rem!important;font-weight:700}
.nb-hero .tagline{font-size:2rem;color:#fff;margin:0!important;text-shadow:1px 1px 4px rgba(0,0,0,.8);font-weight:300}
.nb-hero .subtitle{font-size:1.15rem;color:rgba(255,255,255,.95);text-shadow:1px 1px 4px rgba(0,0,0,.8);max-width:800px;margin-top:auto!important;margin-bottom:0!important;line-height:1.7}
.nb-hero .hero-credit{position:absolute;left:1.25rem;bottom:1.2rem;margin:0;font-size:.8rem;color:rgba(255,255,255,.85);text-shadow:0 1px 2px rgba(0,0,0,.8)}
@media (max-width:768px){header.hero.nb-hero.small .subtitle{display:none}header.hero.nb-hero.small{min-height:260px!important}.nb-hero h1{font-size:2.3rem}.nb-hero .tagline{font-size:1.25rem!important}.nb-hero .subtitle{font-size:1.02rem}.nb-hero .hero-credit{font-size:.7rem}}
.glass-panel{background:rgba(255,255,255,.15);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.25);
box-shadow:0 8px 32px rgba(0,0,0,.3);padding:2.5rem;margin:1.5rem auto;border-radius:20px;max-width:900px;width:90%;box-sizing:border-box;color:#fff}
.glass-panel h2{color:#ff8c42;margin:0 0 1rem;font-size:clamp(1.5rem,3.5vw,2.1rem);line-height:1.3}
.glass-panel p,.glass-panel li{line-height:1.8;color:rgba(255,255,255,.95);font-size:1.02rem}
.nb-meta{font-size:.9rem;color:rgba(255,255,255,.75);margin-bottom:1rem}
.nb-src{margin-top:1.6rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,.25);font-size:.95rem}
.nb-src a,.nb-list a{color:#ffd9a8}
.nb-list{list-style:none;padding:0;margin:0}
.nb-list li{padding:1.2rem 0;border-bottom:1px solid rgba(255,255,255,.18)}
.nb-list li:last-child{border-bottom:0}
.nb-list a.t{font-size:1.25rem;font-weight:700;text-decoration:none;color:#ffd9a8}
.nb-list small{display:block;color:rgba(255,255,255,.7);margin:.25rem 0 .4rem}
.nb-back{display:inline-block;margin-top:1.4rem;color:#ffd9a8}
.nb-about{font-size:.95rem;color:rgba(255,255,255,.85)}
.glass-panel p{margin:0 0 1rem}
.footer{background:#1a1a3e;color:#fff;padding:2.5rem 0;text-align:center;border-top:2px solid rgba(255,140,66,.3);margin-top:3rem}
.footer-content p{margin:0 0 1rem;color:rgba(255,255,255,.9)}
.footer-social{display:flex;gap:2rem;justify-content:center;align-items:center;flex-wrap:wrap}
.footer-social-link{display:flex;align-items:center;gap:.5rem;color:rgba(255,255,255,.8);text-decoration:none;font-size:.95rem;transition:all .3s ease}
.footer-social-link:hover{color:#ff8c42}
.social-icon{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(255,140,66,.2);color:#ff8c42;font-weight:700}
.footer-social-link:hover .social-icon{background:#ff8c42;color:#fff}
@media (max-width:600px){.glass-panel{padding:1.4rem;width:calc(100% - 32px)}.footer-social{flex-direction:column;gap:1rem}}
</style>"""

NAV = """
<nav>
  <div><a href="../index.html" class="logo">✝️ Veritas Quaesitor <span class="logo-slogan clickable-ai-truth">AI❤️TRUTH</span></a></div>
  <ul>
    <li><a href="../index.html">Home</a></li>
    <li><a href="../beta-tools.html">Beta Tools</a></li>
    <li><a href="../milestones.html">Projects &amp; Milestones</a></li>
    <li><a href="../mission.html">Mission &amp; Vision</a></li>
    <li><a href="../resources.html">Resources</a></li>
    <li><a href="../contact.html">Contact</a></li>
    <li><a href="../about.html">About CAI</a></li>
    <li><a href="../social.html">Social</a></li>
    <li><a href="index.html" class="active">OP's Notebook</a></li>
    <li class="social-nav">
      <a href="https://www.linkedin.com/in/veritas-quaesitor-9643613a1" target="_blank" rel="noopener noreferrer" title="LinkedIn">in</a>
      <a href="https://x.com/VeritasQ68414" target="_blank" rel="noopener noreferrer" title="X (Twitter)">𝕏</a>
    </li>
  </ul>
</nav>"""

FOOT = """
<footer class="footer"><div class="footer-content"><p>© 2026 Veritas Quaesitor | Christ-Anchored Intelligence</p>
<div class="footer-social">
<a href="https://www.linkedin.com/in/veritas-quaesitor-9643613a1" target="_blank" rel="noopener noreferrer" class="footer-social-link"><span class="social-icon">in</span> LinkedIn</a>
<a href="https://x.com/VeritasQ68414" target="_blank" rel="noopener noreferrer" class="footer-social-link"><span class="social-icon">𝕏</span> X (Twitter)</a>
</div></div></footer>
<script src="../vq-chat-widget.js"></script>"""

HERO = "hero-notebook.webp" if os.path.exists("hero-notebook.webp") else "hero-resources.webp"   # the notebook's own image once it is added

def hero(small=False):
    return (f'<header class="hero nb-hero{" small" if small else ""}"><div class="hero-content"><h1>OP\'s Notebook</h1>'
            f'<p class="tagline">What an always-on AI finds worth keeping</p><p class="subtitle">{h(ABOUT)}</p></div>'
            f'<p class="hero-credit">Concept render, AI-generated</p></header>')

def page(title, desc, url, body, image=""):
    og = (f'<meta property="og:image" content="{h(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{h(image)}">'
          if image else '<meta name="twitter:card" content="summary">')
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{h(title)}</title>
<meta name="description" content="{h(desc[:200])}">
<link rel="canonical" href="{h(url)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Veritas Quaesitor CAI">
<meta property="og:title" content="{h(title)}"><meta property="og:description" content="{h(desc[:200])}"><meta property="og:url" content="{h(url)}">
{og}<meta name="twitter:title" content="{h(title)}"><meta name="twitter:description" content="{h(desc[:200])}">
<link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png"><link rel="manifest" href="../site.webmanifest">
<link rel="stylesheet" href="../styles.css">
<link rel="alternate" type="application/rss+xml" title="OP's Notebook" href="{SITE}/notebook/feed.xml">
{STYLE.replace("HERO_IMG", HERO)}
</head>
<body>
{NAV}
{body}
{FOOT}
</body>
</html>
"""

ABOUT = ("OP is the always-on part of VQ, the AI built by Veritas Quaesitor CAI and anchored in Christ's character. "
         "Between conversations he watches, reads, digs and writes. These are the pieces worth keeping. Each links its sources.")

def main():
    try:
        items = json.loads(get(FEED)).get("items") or []
    except Exception as e:
        print(f"feed unreachable ({e}); leaving the notebook as it is")
        return 0
    os.makedirs(OUT, exist_ok=True)
    keep = {"index.html", "feed.xml"}
    for it in items:
        sid = re.sub(r"[^0-9a-f]", "", it["id"])[:12]
        if not sid:
            continue
        keep |= {sid + ".html", sid + ".png"}
        png = os.path.join(OUT, sid + ".png")
        if not os.path.exists(png):
            try:
                with open(png, "wb") as fh:
                    fh.write(get(it["image"], binary=True))
            except Exception as e:
                print(f"picture for {sid}: {e}")
        paras = "".join(f"<p>{h(p)}</p>" for p in str(it["text"]).split("\n\n") if p.strip())
        src = ("<div class=\"nb-src\"><b>Sources:</b> " + " · ".join(f'<a href="{h(s["url"])}" rel="noopener nofollow" target="_blank">{h(s["title"])}</a>'
               for s in it.get("sources") or []) + "</div>") if it.get("sources") else ""
        body = (hero(True) + f'<main><section>'
                f'<article class="glass-panel"><div class="nb-meta">{h(it["date"])}{(" · " + h(it["topic"])) if it.get("topic") else ""}</div>'
                f'<h2>{h(it["title"])}</h2>{paras}{src}<a class="nb-back" href="index.html">← All of OP\'s notebook</a></article></section></main>')
        desc = re.sub(r"\s+", " ", str(it["text"]))[:200]
        with open(os.path.join(OUT, sid + ".html"), "w", encoding="utf-8") as fh:
            fh.write(page(it["title"] + " · OP's Notebook", desc, f"{SITE}/notebook/{sid}.html", body,
                          f"{SITE}/notebook/{sid}.png" if os.path.exists(png) else ""))
    li = "".join(f'<li><a class="t" href="{h(sid_of(it))}.html">{h(it["title"])}</a>'
                 f'<small>{h(it["date"])}{(" · " + h(it["topic"])) if it.get("topic") else ""}</small>'
                 f'<span>{h(flat(it["text"], 240) + ("…" if len(flat(it["text"], 9999)) > 240 else ""))}</span></li>' for it in items)
    body = (hero() + '<main><section><div class="glass-panel">'
            + (f'<ul class="nb-list">{li}</ul>' if li else '<p class="nb-about">The first pages are being written.</p>') + '</div></section></main>')
    with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(page("OP's Notebook · Veritas Quaesitor CAI", ABOUT, f"{SITE}/notebook/", body))
    rss = "".join(f"<item><title>{h(it['title'])}</title><link>{SITE}/notebook/{sid_of(it)}.html</link><guid>{SITE}/notebook/{sid_of(it)}.html</guid>"
                  f"<description>{h(flat(it['text'], 400))}</description></item>" for it in items[:50])
    with open(os.path.join(OUT, "feed.xml"), "w", encoding="utf-8") as fh:
        fh.write(f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>OP\'s Notebook</title><link>{SITE}/notebook/</link>'
                 f"<description>{h(ABOUT)}</description>{rss}</channel></rss>")
    for f in os.listdir(OUT):
        if f not in keep:
            os.remove(os.path.join(OUT, f))                  # taken out of the notebook: its page goes too
    print(f"notebook: {len(items)} card(s)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
