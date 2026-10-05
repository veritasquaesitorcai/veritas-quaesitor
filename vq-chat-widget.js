/**
 * VQ Chat Widget: the quick-answer front door to VQ Chat
 * Veritas Quaesitor CAI (veritasquaesitorcai.github.io)
 *
 * Usage: <script src="vq-chat-widget.js"></script>
 * Quick plain-text answers on every page; "Open in VQ Chat" carries the conversation into the full app.
 */

(function() {
    'use strict';

    const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || location.href;
    const BASE = new URL('.', SCRIPT_SRC);
    const CONFIG = {
        apiEndpoint: 'https://veritas-quaesitor-production.up.railway.app/chat',
        appUrl: new URL('app/', BASE).href,
        tourUrl: new URL('tour.html', BASE).href,
        welcomeMessage: "Hi, I'm VQ, your guide to this site. Ask me where to find anything (the resurrection calculation, the VQ-1 robot, the ETS, the tour) and I'll take you straight there.\n\nYou can ask me anything else too."
    };

    const ROBOT = '<svg viewBox="0 0 32 32" aria-hidden="true"><line x1="16" y1="4.2" x2="16" y2="8" stroke="#7ff3ff" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="3.4" r="2.1" fill="#ff5fd2"/><rect x="5.5" y="8" width="21" height="16.5" rx="6.5" fill="none" stroke="#7ff3ff" stroke-width="2"/><rect x="8.6" y="11.6" width="14.8" height="7.6" rx="3.8" fill="#05060a"/><circle cx="12.6" cy="15.4" r="2" fill="#7ff3ff"/><circle cx="19.4" cy="15.4" r="2" fill="#7ff3ff"/><circle cx="13.2" cy="14.8" r=".6" fill="#fff"/><circle cx="20" cy="14.8" r=".6" fill="#fff"/><path d="M13 21.6c1.9 1 4.1 1 6 0" stroke="#7ff3ff" stroke-width="1.8" fill="none" stroke-linecap="round"/><rect x="2.6" y="13.6" width="2.6" height="5.2" rx="1.3" fill="#ff5fd2"/><rect x="26.8" y="13.6" width="2.6" height="5.2" rx="1.3" fill="#ff5fd2"/></svg>';
    const ICON = {
        expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>',
        shrink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>',
        clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        send: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.4 19.6 21 12 4.4 4.4l.1 5.9L15 12 4.5 13.7z"/></svg>'
    };

    const PAGE_NAMES = { 'index.html': 'Home', '': 'Home', 'beta-tools.html': 'Beta Tools', 'milestones.html': 'Projects & Milestones',
        'mission.html': 'Mission & Vision', 'resources.html': 'Resources', 'contact.html': 'Contact', 'about.html': 'About CAI',
        'social.html': 'Social', 'tour.html': 'The 1-minute tour', 'symmetric-record.html': 'The Symmetric Record',
        'epistemic-tier-system.html': 'The Epistemic Tier System', 'technical-christianity.html': 'Technical Christianity',
        'birth-of-cai.html': 'The Birth of CAI', 'Critical-Dialogue.html': 'Critical Dialogue', '2-layer.html': 'The Two-Layer Protocol',
        'pluralism.html': 'Pluralism Under CAI', 'epistemic-alignment-framework.html': 'Epistemic Alignment Framework',
        'endtimes.html': 'End Times Chronology', 'reports.html': 'Weekly LLM Risk Reports', 'protocols.html': 'Protocols',
        'TTCSF.html': 'Technical Christianity Syllabus', 'privacy.html': 'Privacy Policy', 'terms.html': 'Terms of Service', 'app/': 'VQ Chat' };
    function linkInfo(href) {
        let url; try { url = new URL(href, location.href); } catch (e) { return null; }
        if (url.origin !== location.origin) return null;
        const file = url.pathname.split('/veritas-quaesitor/')[1] ?? url.pathname.split('/').pop();
        const m = /:~:text=([^&]+)/.exec(url.hash);
        const section = m ? decodeURIComponent(m[1]) : '';
        const page = PAGE_NAMES[file] || PAGE_NAMES[file.replace(/^.*\//, '')] || decodeURIComponent(file.replace(/\.html$/, '').replace(/[-_]/g, ' ')) || 'Home';
        return { url, page, section, label: section ? `${section} · ${page}` : page };
    }

    const styles = `
        #vq-chat-widget, #vq-chat-widget * { box-sizing: border-box; }
        #vq-chat-widget h3, #vq-chat-widget p, #vq-chat-widget ul, #vq-chat-widget ol, #vq-chat-widget li { margin: 0; padding: 0; }
        #vq-chat-widget button { margin: 0; font-family: inherit; }
        #vq-chat-widget { --vq-bg: #0e0e0e; --vq-surface: #161616; --vq-line: rgba(255,255,255,0.09); --vq-text: #ececec;
            --vq-muted: rgba(236,236,236,0.62); --vq-neon: #7ff3ff; --vq-accent: #ff8c42; --vq-accent-2: #ffb27a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

        #vq-chat-bubble { position: fixed; top: 100px; right: 30px; z-index: 9998; height: 50px; padding: 0 18px 0 6px;
            display: flex; align-items: center; gap: 10px; border-radius: 25px; cursor: pointer; color: #fff;
            background: #101014; border: 1px solid rgba(127,243,255,0.35); font: 600 0.95rem/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            box-shadow: 0 10px 30px rgba(0,0,0,0.45), 0 0 18px rgba(127,243,255,0.18); transition: transform .25s ease, box-shadow .25s ease;
            animation: vq-pulse 2.4s ease-out 1.2s 2; }
        #vq-chat-bubble:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(0,0,0,0.5), 0 0 26px rgba(127,243,255,0.32); }
        #vq-chat-bubble:focus-visible, #vq-chat-widget button:focus-visible, #vq-chat-widget a:focus-visible { outline: 2px solid #ffd9a8; outline-offset: 3px; }
        #vq-chat-bubble .vq-face { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center;
            background: radial-gradient(circle at 50% 40%, #17171e, #050507); box-shadow: 0 0 0 1px rgba(127,243,255,0.4), 0 0 12px rgba(127,243,255,0.35); }
        #vq-chat-bubble .vq-face svg { width: 30px; height: 30px; }
        @keyframes vq-pulse { 0% { box-shadow: 0 10px 30px rgba(0,0,0,.45), 0 0 0 0 rgba(127,243,255,.5); } 100% { box-shadow: 0 10px 30px rgba(0,0,0,.45), 0 0 0 16px rgba(127,243,255,0); } }

        #vq-chat-panel { position: fixed; top: 162px; right: 30px; z-index: 9999; width: 400px; height: min(620px, calc(100vh - 182px)); min-height: 380px;
            display: none; flex-direction: column; overflow: hidden; border-radius: 18px; background: var(--vq-bg); color: var(--vq-text);
            border: 1px solid rgba(127,243,255,0.2); box-shadow: 0 24px 70px rgba(0,0,0,0.6), 0 0 34px rgba(127,243,255,0.08); }
        #vq-chat-panel.open { display: flex; animation: vq-in .22s ease-out; }
        /* "Appears digitally": a scan line draws the panel in from the top, with a brief flicker and CRT lines that clear */
        #vq-chat-panel.vq-welcome { animation: vq-materialize 2.4s cubic-bezier(.25,.6,.2,1) both; }
        @keyframes vq-materialize {
            0%   { opacity: 0;   clip-path: inset(0 0 100% 0 round 18px); filter: blur(6px) brightness(1.8) saturate(1.4); }
            8%   { opacity: .75; }
            12%  { opacity: .25; }
            16%  { opacity: .9; }
            20%  { opacity: .45; }
            26%  { opacity: 1; }
            62%  { clip-path: inset(0 0 0 0 round 18px); filter: blur(1.5px) brightness(1.25) saturate(1.15); }
            100% { opacity: 1;   clip-path: inset(0 0 0 0 round 18px); filter: none; }
        }
        #vq-chat-panel .vq-scan { position: absolute; left: 0; right: 0; top: 0; height: 2px; z-index: 6; pointer-events: none;
            background: #bffaff; box-shadow: 0 0 10px 2px rgba(127,243,255,.9), 0 0 34px 8px rgba(127,243,255,.35);
            animation: vq-scan 1.5s cubic-bezier(.3,.6,.25,1) forwards; }
        #vq-chat-panel .vq-scan::after { content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 70px;
            background: linear-gradient(to top, rgba(127,243,255,.18), transparent); }
        @keyframes vq-scan { 0% { top: 0; opacity: 1; } 88% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        #vq-chat-panel .vq-crt { position: absolute; inset: 0; z-index: 5; pointer-events: none;
            background: repeating-linear-gradient(to bottom, rgba(127,243,255,.10) 0 1px, transparent 1px 3px);
            animation: vq-crt 2.4s ease-out forwards; }
        @keyframes vq-crt { 0% { opacity: 1; } 55% { opacity: .55; } 100% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { #vq-chat-panel.vq-welcome { animation: none; } #vq-chat-panel .vq-scan, #vq-chat-panel .vq-crt { display: none; } }
        /* single diagonal accent: neon corner brackets top-right and bottom-left */
        #vq-chat-panel::before, #vq-chat-panel::after { content: ""; position: absolute; width: 34px; height: 34px; pointer-events: none; z-index: 3;
            border: 0 solid #7ff3ff; filter: drop-shadow(0 0 4px rgba(127,243,255,.7)); }
        #vq-chat-panel::before { top: 0; right: 0; border-top-width: 2px; border-right-width: 2px; border-top-right-radius: 18px; }
        #vq-chat-panel::after { bottom: 0; left: 0; border-bottom-width: 2px; border-left-width: 2px; border-bottom-left-radius: 18px; }
        #vq-chat-panel.expanded { width: min(760px, calc(100vw - 60px)); height: calc(100vh - 182px); }
        #vq-chat-panel.expanded .vq-message-content { font-size: .98rem; }
        .vq-go-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
        .vq-go { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 7px 12px; border-radius: 999px; cursor: pointer;
            border: 1px solid rgba(255,140,66,.55); background: rgba(255,140,66,.12); color: #ffd2ad; font: 600 .82rem/1.2 inherit; text-align: left; }
        .vq-go:hover { background: rgba(255,140,66,.24); color: #fff; }
        .vq-go span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #vq-teaser { position: fixed; top: 160px; right: 30px; z-index: 9997; max-width: 260px; display: flex; gap: 8px; align-items: flex-start;
            padding: 11px 12px 11px 14px; border-radius: 14px 4px 14px 14px; background: #121216; color: #ececec; cursor: pointer;
            border: 1px solid rgba(127,243,255,.3); box-shadow: 0 14px 34px rgba(0,0,0,.45); font: 500 .86rem/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            animation: vq-in .3s ease-out; }
        #vq-teaser b { color: #fff; }
        #vq-teaser button { flex-shrink: 0; width: 22px; height: 22px; border: 0; border-radius: 50%; cursor: pointer; display: grid; place-items: center;
            background: rgba(255,255,255,.1); color: #ccc; font-size: 13px; line-height: 1; }
        #vq-teaser button:hover { background: rgba(255,255,255,.2); color: #fff; }
        @media (max-width: 768px) { #vq-teaser { top: auto; right: 16px; bottom: calc(88px + env(safe-area-inset-bottom, 0px)); max-width: min(270px, calc(100vw - 32px)); } }
        .vq-section-flash { outline: 2px solid rgba(255,140,66,.75) !important; outline-offset: 6px; border-radius: 6px; }
        @keyframes vq-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

        #vq-chat-header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 12px 14px; border-bottom: 1px solid var(--vq-line); background: var(--vq-surface); }
        #vq-chat-header .vq-face { width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center;
            background: radial-gradient(circle at 50% 40%, #17171e, #050507); box-shadow: 0 0 0 1px rgba(127,243,255,0.4), 0 0 12px rgba(127,243,255,0.3); }
        #vq-chat-header .vq-face svg { width: 27px; height: 27px; }
        #vq-chat-info { flex: 1; min-width: 0; }
        #vq-chat-info h3 { display: flex; align-items: center; gap: 7px; white-space: nowrap; font: 700 0.9rem/1.2 "Cinzel", Georgia, serif; letter-spacing: .05em; color: #fff; }
        #vq-chat-info h3 span { font: 700 0.58rem/1 -apple-system, "Segoe UI", sans-serif; letter-spacing: .14em; color: #1a1030; padding: 3px 5px 2px; border-radius: 4px;
            background: linear-gradient(135deg, var(--vq-accent), var(--vq-accent-2)); }
        #vq-chat-info p { margin-top: 3px; font-size: .74rem; color: var(--vq-muted); }
        .vq-hbtn { width: 34px; height: 34px; flex-shrink: 0; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--vq-line);
            background: transparent; color: var(--vq-muted); cursor: pointer; transition: color .2s, border-color .2s; }
        .vq-hbtn:hover { color: #fff; border-color: rgba(255,140,66,.55); }
        #vq-chat-close { width: 36px; height: 36px; color: #fff; background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.28); }
        #vq-chat-close svg { width: 18px; height: 18px; }
        #vq-chat-close:hover { background: #ff8c42; border-color: #ff8c42; color: #1a1030; }
        .vq-hbtn svg { width: 16px; height: 16px; }

        #vq-chat-messages { flex: 1; overflow-y: auto; padding: 16px 16px 8px; display: flex; flex-direction: column; gap: 14px; scrollbar-width: thin; }
        .vq-message { display: flex; gap: 9px; align-items: flex-start; animation: vq-in .25s ease-out; }
        .vq-message .vq-av { width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; margin-top: 1px;
            background: radial-gradient(circle at 50% 40%, #17171e, #050507); box-shadow: 0 0 0 1px rgba(127,243,255,0.35), 0 0 10px rgba(127,243,255,0.25); }
        .vq-message .vq-av svg { width: 21px; height: 21px; }
        .vq-message-content { min-width: 0; font-size: .92rem; line-height: 1.6; color: var(--vq-text); overflow-wrap: anywhere; }
        #vq-chat-widget .vq-message-content p { margin: 0 0 .6em; } #vq-chat-widget .vq-message-content p:last-child { margin-bottom: 0; }
        #vq-chat-widget .vq-message-content ul, #vq-chat-widget .vq-message-content ol { margin: .25em 0 .6em 1.25em; } .vq-message-content li { margin: .15em 0; }
        .vq-message-content strong { color: #fff; }
        .vq-message-content a { color: var(--vq-accent-2); text-decoration: underline; text-underline-offset: 2px; }
        .vq-message-content code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: .85em; background: rgba(255,255,255,.07); padding: 1px 5px; border-radius: 4px; }
        .vq-message-content img { display: block; width: 100%; border-radius: 8px; margin-top: 8px; }
        .vq-user-message { justify-content: flex-end; }
        .vq-user-message .vq-message-content { max-width: 82%; padding: 9px 13px; border-radius: 16px 16px 4px 16px; color: #1a1030; font-weight: 500;
            background: linear-gradient(135deg, var(--vq-accent), var(--vq-accent-2)); box-shadow: 0 4px 14px rgba(255,140,66,.18); }
        .vq-typing { display: flex; gap: 5px; padding: 8px 2px; }
        .vq-typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--vq-neon); opacity: .35; animation: vq-dot 1.2s ease-in-out infinite; }
        .vq-typing-text p:last-child::after { content: "▍"; color: #7ff3ff; margin-left: 1px; animation: vq-blink 1s steps(1) infinite; }
        @keyframes vq-blink { 50% { opacity: 0; } }
        .vq-typing i:nth-child(2) { animation-delay: .15s; } .vq-typing i:nth-child(3) { animation-delay: .3s; }
        @keyframes vq-dot { 30% { opacity: 1; transform: translateY(-3px); } }

        #vq-chat-input-area { padding: 10px 12px 8px; border-top: 1px solid var(--vq-line); }
        .vq-inputrow { display: flex; align-items: center; gap: 6px; padding: 4px 4px 4px 14px; border-radius: 22px; border: 1px solid var(--vq-line); background: rgba(255,255,255,.04); }
        .vq-inputrow:focus-within { border-color: rgba(255,140,66,.5); }
        #vq-chat-input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--vq-text); font: inherit; font-size: .92rem; padding: 8px 0; }
        #vq-chat-input::placeholder { color: rgba(236,236,236,.4); }
        #vq-chat-send { width: 36px; height: 36px; flex-shrink: 0; border: 0; border-radius: 50%; cursor: pointer; display: grid; place-items: center; color: #1a1030;
            background: linear-gradient(135deg, var(--vq-accent), var(--vq-accent-2)); }
        #vq-chat-send:disabled { opacity: .45; cursor: default; }
        #vq-chat-send svg { width: 17px; height: 17px; margin-left: 2px; }
        .vq-links { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; padding: 0 4px; font-size: .74rem; }
        .vq-links a { color: var(--vq-muted); text-decoration: none; } .vq-links a:hover { color: var(--vq-accent-2); }
        .vq-links a.vq-full { color: var(--vq-accent-2); font-weight: 600; }

        @media (prefers-reduced-motion: reduce) { #vq-chat-bubble, #vq-chat-panel, .vq-message, .vq-typing i { animation: none !important; } }
        @media (max-width: 768px) {
            #vq-chat-bubble { top: auto; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); right: 16px; width: 58px; height: 58px; padding: 0; border-radius: 50%; justify-content: center; }
            #vq-chat-bubble .vq-bubble-text { display: none; }
            #vq-chat-bubble .vq-face { width: 46px; height: 46px; } #vq-chat-bubble .vq-face svg { width: 36px; height: 36px; }
            #vq-chat-panel, #vq-chat-panel.expanded { top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100vh; height: 100dvh; min-height: 0; border-radius: 0; border: 0; }
            #vq-chat-panel::before, #vq-chat-panel::after { display: none; }
            .vq-expand, #vq-chat-expand { display: none; }
            #vq-chat-header { padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
            #vq-chat-input { font-size: 16px; }
            #vq-chat-input-area { padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }
            html.vq-chat-open, html.vq-chat-open body { overflow: hidden; }
        }
    `;

    if (!document.querySelector('link[href*="family=Cinzel"]')) {
        const f = document.createElement('link');
        f.rel = 'stylesheet';
        f.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap';
        document.head.appendChild(f);
    }
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    const widgetHTML = `
        <div id="vq-chat-widget">
            <button id="vq-chat-bubble" aria-label="Chat with VQ" aria-expanded="false">
                <span class="vq-face">${ROBOT}</span><span class="vq-bubble-text">Ask VQ</span>
            </button>
            <div id="vq-chat-panel" role="dialog" aria-label="Chat with VQ">
                <div id="vq-chat-header">
                    <span class="vq-face">${ROBOT}</span>
                    <div id="vq-chat-info">
                        <h3>Veritas Quaesitor <span>CAI</span></h3>
                        <p>Your guide to this site, and quick answers</p>
                    </div>
                    <button class="vq-hbtn vq-expand" id="vq-chat-expand" title="Bigger window" aria-label="Make the chat window bigger" aria-pressed="false">${ICON.expand}</button>
                    <button class="vq-hbtn" id="vq-chat-clear" title="Start over" aria-label="Start a new conversation">${ICON.clear}</button>
                    <button class="vq-hbtn" id="vq-chat-close" title="Close (Esc)" aria-label="Close chat">${ICON.close}</button>
                </div>
                <div id="vq-chat-messages" aria-live="polite"></div>
                <div id="vq-chat-input-area">
                    <div class="vq-inputrow">
                        <input type="text" id="vq-chat-input" placeholder="Find something on the site, or ask VQ anything…" autocomplete="off" maxlength="2000" aria-label="Message VQ">
                        <button id="vq-chat-send" aria-label="Send">${ICON.send}</button>
                    </div>
                    <div class="vq-links">
                        <a href="${CONFIG.appUrl}" class="vq-full" id="vq-chat-full">Open in VQ Chat</a>
                        <a href="${CONFIG.tourUrl}" target="_blank" rel="noopener">Take the 1-minute tour</a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Safe, minimal Markdown: escape everything, then allow bold, italics, code, https links and lists
    function escapeHtml(t) { return t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
    function inline(t) {
        return escapeHtml(t)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
            .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/(^|[\s(])(https:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    }
    function renderMarkdown(text) {
        const out = []; let list = null;
        const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
        text.replace(/\r/g, '').split('\n').forEach(line => {
            const ul = /^\s*[-•*]\s+(.*)$/.exec(line), ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
            if (ul || ol) {
                const kind = ul ? 'ul' : 'ol';
                if (list !== kind) { close(); out.push(`<${kind}>`); list = kind; }
                out.push(`<li>${inline((ul || ol)[1])}</li>`);
            } else if (!line.trim()) {
                close(); out.push('');
            } else {
                close();
                const h = /^#{1,6}\s+(.*)$/.exec(line);
                out.push(`<p>${h ? '<strong>' + inline(h[1]) + '</strong>' : inline(line)}</p>`);
            }
        });
        close();
        // consecutive lines inside one paragraph join with a line break; a blank line starts a new paragraph
        return out.join('\n').replace(/<\/p>\n<p>/g, '<br>').replace(/\n/g, '');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        if (document.getElementById('vq-chat-widget')) return;
        const container = document.createElement('div');
        container.innerHTML = widgetHTML;
        document.body.appendChild(container.firstElementChild);

        const bubble = document.getElementById('vq-chat-bubble');
        const panel = document.getElementById('vq-chat-panel');
        const input = document.getElementById('vq-chat-input');
        const sendBtn = document.getElementById('vq-chat-send');
        const messagesContainer = document.getElementById('vq-chat-messages');

        let conversationHistory = [];
        let pendingGo = null;   // the last place VQ offered to take you
        try { conversationHistory = JSON.parse(localStorage.getItem('vq-conversation-history') || '[]'); } catch (e) { conversationHistory = []; }
        if (!Array.isArray(conversationHistory)) conversationHistory = [];
        // Greetings aren't stored, so visitors always see the current welcome
        const isWelcome = (m) => m && m.role === 'assistant' && typeof m.content === 'string' &&
            (m.content === CONFIG.welcomeMessage || /^(Hi, I'm VQ|Hey! 👋 I'm VQ|Hey! I'm VQ)/.test(m.content));
        conversationHistory = conversationHistory.filter(m => !isWelcome(m));
        addMessageToUI('assistant', CONFIG.welcomeMessage);
        // The greeting is typed out the first time the chat opens in a visit (instant if motion is reduced)
        let welcomeBox = messagesContainer.lastElementChild && messagesContainer.lastElementChild.querySelector('.vq-message-content');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let typingTimer = null;
        // Only a fresh conversation gets the typed greeting; with earlier messages below it, it simply shows
        if (welcomeBox && !reduceMotion && !conversationHistory.length && !sessionStorage.getItem('vq-greeting-typed')) {
            welcomeBox.innerHTML = '';
            welcomeBox.dataset.pending = '1';
        }
        function finishGreeting() {
            if (!welcomeBox || !welcomeBox.dataset.pending) return;
            clearInterval(typingTimer); typingTimer = null;
            delete welcomeBox.dataset.pending;
            welcomeBox.innerHTML = renderMarkdown(CONFIG.welcomeMessage);
            welcomeBox.classList.remove('vq-typing-text');
        }
        function typeGreeting() {
            if (!welcomeBox || !welcomeBox.dataset.pending || typingTimer || welcomeBox.dataset.started) return;
            welcomeBox.dataset.started = '1';
            sessionStorage.setItem('vq-greeting-typed', '1');
            const full = CONFIG.welcomeMessage;
            welcomeBox.innerHTML = '<div class="vq-typing" aria-hidden="true"><i></i><i></i><i></i></div>';
            let i = 0;
            setTimeout(() => {
                if (!welcomeBox || !welcomeBox.dataset.pending) return;
                welcomeBox.classList.add('vq-typing-text');
                typingTimer = setInterval(() => {
                    i = Math.min(full.length, i + 2);
                    welcomeBox.innerHTML = renderMarkdown(full.slice(0, i));
                    if (i >= full.length) finishGreeting();
                }, 28);
            }, 650);
        }
        if (conversationHistory.length) conversationHistory.forEach(m => addMessageToUI(m.role, m.content));
        setTimeout(greetArrival, 0);

        // First visit in this browser session (desktop): a small hello under the button, gone after a few seconds
        function showTeaser() {
            if (panel.classList.contains('open') || sessionStorage.getItem('vq-teaser-shown')) return;
            sessionStorage.setItem('vq-teaser-shown', '1');
            const t = document.createElement('div');
            t.id = 'vq-teaser';
            t.setAttribute('role', 'status');
            t.innerHTML = '<span><b>Hi, I\'m VQ.</b> Looking for something on this site? I can take you straight to it.</span><button type="button" aria-label="Dismiss">✕</button>';
            const remove = () => { t.remove(); };
            t.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); remove(); });
            t.addEventListener('click', () => { remove(); openChat(true); });
            document.getElementById('vq-chat-widget').appendChild(t);
            setTimeout(remove, 9000);
            bubble.addEventListener('click', remove, { once: true });
        }
        function welcomeOpen() {
            if (panel.classList.contains('open') || sessionStorage.getItem('vq-welcomed')) return;
            const dismissed = parseInt(localStorage.getItem('vq-widget-dismissed') || '0', 10);
            if (Date.now() - dismissed < 7 * 24 * 3600 * 1000) return;          // they closed it recently: respect that
            if (/\/app\//.test(location.pathname)) return;
            sessionStorage.setItem('vq-welcomed', '1');
            sessionStorage.setItem('vq-teaser-shown', '1');
            fadeOpen();                                                          // no keyboard focus, no scrolling
        }
        // (deferred so everything below has been set up first)
        setTimeout(() => { if (isPhone()) setTimeout(showTeaser, 2500); else setTimeout(welcomeOpen, 3000); }, 0);

        const isPhone = () => window.matchMedia('(max-width: 768px)').matches;
        // Reopen a bubble that was left open, but let the page settle first and fade it in
        function fadeOpen() {
            if (panel.classList.contains('open')) return;
            panel.classList.add('vq-welcome');
            const scan = document.createElement('div'); scan.className = 'vq-scan';
            const crt = document.createElement('div'); crt.className = 'vq-crt';
            panel.append(scan, crt);
            openChat(false, reduceMotion ? 350 : 2000);   // the greeting starts typing once the panel has fully appeared
            setTimeout(() => { panel.classList.remove('vq-welcome'); scan.remove(); crt.remove(); }, 2600);
        }
        if (localStorage.getItem('vq-widget-open') === 'true' && !isPhone()) setTimeout(fadeOpen, 900);

        bubble.addEventListener('click', () => panel.classList.contains('open') ? closeChat() : openChat(true));
        document.getElementById('vq-chat-close').addEventListener('click', closeChat);
        document.getElementById('vq-chat-clear').addEventListener('click', clearConversation);
        const expandBtn = document.getElementById('vq-chat-expand');
        let userSized = false;   // once someone sizes the window themselves, we stop resizing it for them
        const setExpanded = (on, auto) => {
            if (!auto) userSized = true;
            panel.classList.toggle('expanded', on);
            expandBtn.innerHTML = on ? ICON.shrink : ICON.expand;
            expandBtn.title = on ? 'Smaller window' : 'Bigger window';
            expandBtn.setAttribute('aria-label', on ? 'Make the chat window smaller' : 'Make the chat window bigger');
            expandBtn.setAttribute('aria-pressed', String(on));
            if (!auto) { try { localStorage.setItem('vq-widget-expanded', on ? 'true' : 'false'); } catch (e) {} }
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };
        expandBtn.addEventListener('click', () => setExpanded(!panel.classList.contains('expanded')));
        if (localStorage.getItem('vq-widget-expanded') === 'true') { setExpanded(true, true); userSized = true; }
        // Long answers get room to breathe: the window grows for them (desktop only)
        const maybeGrow = (text) => {
            if (userSized || isPhone() || panel.classList.contains('expanded')) return;
            const t = String(text || '');
            if (t.length > 700 || (t.match(/\n/g) || []).length > 9) setExpanded(true, true);
        };
        document.getElementById('vq-chat-full').addEventListener('click', (e) => { e.preventDefault(); openInApp(); });
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('input', finishGreeting);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMessage(); } });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) closeChat(); });

        function openChat(focus, greetDelay) {
            setTimeout(typeGreeting, greetDelay || 350);
            panel.classList.add('open');
            bubble.setAttribute('aria-expanded', 'true');
            document.documentElement.classList.add('vq-chat-open');
            localStorage.setItem('vq-widget-open', 'true');
            if (focus && !isPhone()) input.focus();
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        function closeChat() {
            if (panel.classList.contains('open')) { try { localStorage.setItem('vq-widget-dismissed', String(Date.now())); } catch (e) {} }
            panel.classList.remove('open', 'vq-welcome');
            bubble.setAttribute('aria-expanded', 'false');
            document.documentElement.classList.remove('vq-chat-open');
            localStorage.setItem('vq-widget-open', 'false');
        }
        function clearConversation() {
            localStorage.removeItem('vq-conversation-history');
            messagesContainer.innerHTML = '';
            conversationHistory = [];
            addMessageToUI('assistant', CONFIG.welcomeMessage);
            welcomeBox = null;
        }

        // Hand the conversation to the full app (same site, so it travels through this browser's storage)
        function openInApp() {
            const messages = conversationHistory.filter(m => m.content !== CONFIG.welcomeMessage);
            try {
                if (messages.some(m => m.role === 'user')) localStorage.setItem('vq-handoff', JSON.stringify({ ts: Date.now(), messages }));
            } catch (e) { /* storage full: the app simply opens fresh */ }
            window.location.href = CONFIG.appUrl;
        }

        let activeTyping = null;   // finishes the reply being typed, if any
        function addMessageToUI(role, content, typed) {
            const messageDiv = document.createElement('div');
            messageDiv.className = role === 'user' ? 'vq-message vq-user-message' : 'vq-message';
            const bubbleEl = document.createElement('div');
            bubbleEl.className = 'vq-message-content';
            if (role === 'user') {
                bubbleEl.textContent = content;
            } else {
                const av = document.createElement('span');
                av.className = 'vq-av';
                av.innerHTML = ROBOT;
                messageDiv.appendChild(av);
                if (typed && !reduceMotion) typeReply(bubbleEl, content);
                else fillAssistant(bubbleEl, content);
            }
            messageDiv.appendChild(bubbleEl);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Replies are typed out like the greeting; links and buttons appear once the text is complete
        function typeReply(box, content) {
            if (activeTyping) activeTyping();
            const text = String(content).replace(/<img[^>]*>/gi, '');
            const step = Math.max(2, Math.ceil(text.length / 160));   // long answers still finish in about 4-5 seconds
            let i = 0, timer = null;
            box.classList.add('vq-typing-text');
            const done = () => {
                clearInterval(timer);
                if (activeTyping === done) activeTyping = null;
                box.classList.remove('vq-typing-text');
                box.innerHTML = '';
                fillAssistant(box, content);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            };
            activeTyping = done;
            timer = setInterval(() => {
                i = Math.min(text.length, i + step);
                box.innerHTML = renderMarkdown(text.slice(0, i));
                const nearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 80;
                if (nearBottom) messagesContainer.scrollTop = messagesContainer.scrollHeight;
                if (i >= text.length) done();
            }, 28);
        }

        function fillAssistant(bubbleEl, content) {
                String(content).split(/(<img[^>]*>)/i).forEach(part => {
                    if (/^<img/i.test(part)) { const img = safeImageFrom(part); if (img) bubbleEl.appendChild(img); }
                    else if (part.trim()) { const d = document.createElement('div'); d.innerHTML = renderMarkdown(part); bubbleEl.appendChild(d); }
                });
                bubbleEl.querySelectorAll('a[href]').forEach(prepareLink);
                const targets = [];
                bubbleEl.querySelectorAll('a[href]').forEach(a => {
                    const info = linkInfo(a.getAttribute('href'));
                    if (!info) return;
                    if (/^https?:\/\//.test(a.textContent.trim())) a.textContent = info.label;   // no long raw addresses
                    if (!targets.some(t => t.url.href === info.url.href)) targets.push(info);
                });
                if (targets.length) {
                    const row = document.createElement('div');
                    row.className = 'vq-go-row';
                    targets.slice(0, 3).forEach(t => {
                        const b = document.createElement('button');
                        b.type = 'button'; b.className = 'vq-go';
                        b.innerHTML = '<span></span>→';
                        b.firstChild.textContent = `Take me there: ${t.section || t.page}`;
                        b.addEventListener('click', () => goTo(t));
                        row.appendChild(b);
                    });
                    bubbleEl.appendChild(row);
                    pendingGo = targets[0];
                } else {
                    pendingGo = null;
                }
        }

        // Site links open in this tab; a link to a section of the page you're on scrolls straight to it
        function prepareLink(a) {
            let url; try { url = new URL(a.getAttribute('href'), location.href); } catch (e) { return; }
            if (url.origin !== location.origin) return;
            a.removeAttribute('target');
            const samePage = url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
            const m = /:~:text=([^&]+)/.exec(url.hash);
            if (samePage && m) {
                a.addEventListener('click', (e) => {
                    const wanted = decodeURIComponent(m[1]).toLowerCase().replace(/\s+/g, ' ').trim();
                    const target = [...document.querySelectorAll('h1, h2, h3, h4')]
                        .find(h => !h.closest('#vq-chat-widget') && h.textContent.toLowerCase().replace(/\s+/g, ' ').includes(wanted));
                    if (!target) return;   // let the browser try the text fragment itself
                    e.preventDefault();
                    if (isPhone()) closeChat();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    target.classList.add('vq-section-flash');
                    setTimeout(() => target.classList.remove('vq-section-flash'), 2200);
                });
            }
        }

        function safeImageFrom(tagHtml) {
            const m = /\ssrc\s*=\s*["']([^"']+)["']/i.exec(tagHtml);
            if (!m) return null;
            let url; try { url = new URL(m[1]); } catch (e) { return null; }
            if (url.protocol !== 'https:') return null;
            const img = document.createElement('img');
            img.src = url.href; img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
            img.onerror = function () { this.remove(); };
            return img;
        }

        // ---------- Navigation: VQ can take you to a page or section ----------
        const YES = /^(?:(?:yes|yeah|yep|yup|sure|ok|okay|please|please do|go|go there|go ahead|take me|take me there|open it|let'?s go|do it|show me)[\s,.!]*)+$/i;

        function findHeading(text) {
            const wanted = String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
            if (!wanted) return null;
            return [...document.querySelectorAll('h1, h2, h3, h4')]
                .find(h => !h.closest('#vq-chat-widget') && h.textContent.toLowerCase().replace(/\s+/g, ' ').includes(wanted));
        }
        function flash(el) {
            if (isPhone()) closeChat();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el.classList.add('vq-section-flash');
            setTimeout(() => el.classList.remove('vq-section-flash'), 2400);
        }
        function goTo(t) {
            const samePage = t.url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
            if (samePage) {
                const h = findHeading(t.section);
                if (h) { flash(h); addMessage('assistant', `Here it is: **${t.section || t.page}**.`); return; }
                if (!t.section) { window.scrollTo({ top: 0, behavior: 'smooth' }); addMessage('assistant', `You're already on **${t.page}**.`); return; }
            }
            try {
                localStorage.setItem('vq-arrival', JSON.stringify({ ts: Date.now(), page: t.page, section: t.section }));
                localStorage.setItem('vq-widget-open', isPhone() ? 'false' : 'true');
            } catch (e) {}
            if (/\/tour\.html$/.test(t.url.pathname)) {
                localStorage.removeItem('vq-arrival');
                window.open(t.url.href, '_blank', 'noopener');
                addMessage('assistant', 'I opened the **1-minute tour** in a new tab. Come back here any time with questions about it.');
                return;
            }
            if (panel.classList.contains('expanded')) setExpanded(false, true);
            window.location.href = t.url.href;
        }
        // After arriving on the new page: say where we are and point at the section
        function greetArrival() {
            let a = null;
            try { a = JSON.parse(localStorage.getItem('vq-arrival') || 'null'); localStorage.removeItem('vq-arrival'); } catch (e) {}
            if (!a || Date.now() - (a.ts || 0) > 60000) return;
            addMessage('assistant', a.section ? `Here you are: **${a.section}** on ${a.page}.` : `Here you are: **${a.page}**. Ask me if you'd like to find something on this page.`);
            if (a.section) setTimeout(() => { const h = findHeading(a.section); if (h) { h.scrollIntoView({ block: 'start' }); h.classList.add('vq-section-flash'); setTimeout(() => h.classList.remove('vq-section-flash'), 2600); } }, 450);
        }

        function addMessage(role, content) {
            addMessageToUI(role, content, role === 'assistant');
            conversationHistory.push({ role, content });
            if (conversationHistory.length > 40) conversationHistory = conversationHistory.slice(-40);
            try { localStorage.setItem('vq-conversation-history', JSON.stringify(conversationHistory)); }
            catch (e) { conversationHistory = conversationHistory.slice(-12); try { localStorage.setItem('vq-conversation-history', JSON.stringify(conversationHistory)); } catch (_) {} }
        }

        function showTypingIndicator() {
            const t = document.createElement('div');
            t.className = 'vq-message'; t.id = 'vq-typing';
            t.innerHTML = `<span class="vq-av">${ROBOT}</span><div class="vq-typing" aria-label="VQ is typing"><i></i><i></i><i></i></div>`;
            messagesContainer.appendChild(t);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        function hideTypingIndicator() { const t = document.getElementById('vq-typing'); if (t) t.remove(); }

        function getSmartPageContext() {
            const url = window.location.href;
            const pathname = window.location.pathname;
            
            let pageType = 'unknown';
            let relevantContent = '';

            if (window.VQ_APP_MODE === 'standalone' || pathname.includes('/app/')) {
                pageType = 'standalone-app';
                relevantContent = extractMainContent('main', '#app', '#root', 'body');
                
            } else if (window.VQ_APP_MODE === 'extension' || (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && !url.includes('veritasquaesitorcai.github.io')) || (!url.includes('veritasquaesitorcai.github.io') && !pathname.includes('/app/'))) {
                pageType = 'extension-' + detectExternalPageType();
                relevantContent = extractExternalPageContent();

            } else if (pathname.includes('index-ai') || pathname.includes('ai-index')) {
                pageType = 'ai-index';
                relevantContent = extractMainContent('#calculation', 'main', 'article', '.methodology');
            } else if (pathname.includes('beta-tools')) {
                pageType = 'beta-tools';
                relevantContent = extractToolDescriptions();
            } else if (pathname.includes('mission')) {
                pageType = 'mission';
                relevantContent = extractMainContent('.mission', '.mandate', 'main');
            } else if (pathname.includes('vq1') || pathname.includes('robot')) {
                pageType = 'vq1-robot';
                relevantContent = extractMainContent('main', 'article');
            } else if (pathname.includes('resources')) {
                pageType = 'resources';
                relevantContent = extractMainContent('.resource-list', 'main');
            } else if (pathname.includes('contact')) {
                pageType = 'contact';
                relevantContent = extractMainContent('main', '.contact');
            } else if (pathname.includes('index-human')) {
                pageType = 'human-index';
                relevantContent = extractMainContent('main', '.hero');
            } else if (/\/(index\.html)?$/.test(pathname)) {
                pageType = 'ai-index';
                relevantContent = extractMainContent('#calculation', 'main', 'article', '.methodology');
            }
            
            return {
                url: url,
                pageType: pageType,
                title: document.title,
                content: relevantContent.substring(0, 1000)
            };
        }

        function extractMainContent(...selectors) {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const clone = element.cloneNode(true);
                    clone.querySelectorAll('script, style, .hidden, [hidden]').forEach(el => el.remove());
                    return clone.innerText.trim();
                }
            }
            return document.body.innerText.substring(0, 800);
        }

        function extractToolDescriptions() {
            const tools = document.querySelectorAll('.tool-card, .beta-tool, [class*="tool"]');
            let content = '';
            tools.forEach(tool => {
                const title = tool.querySelector('h3, h2, .tool-name')?.innerText || '';
                const desc = tool.querySelector('p, .description, .tool-description')?.innerText || '';
                if (title || desc) content += `${title}: ${desc}\n`;
            });
            return content || extractMainContent('main');
        }

        function detectExternalPageType() {
            const host = window.location.hostname;
            if (host.includes('wikipedia')) return 'wikipedia';
            if (host.includes('youtube')) return 'youtube';
            if (host.includes('arxiv')) return 'arxiv';
            if (host.includes('scholar.google')) return 'google-scholar';
            if (host.includes('reddit')) return 'reddit';
            if (host.includes('twitter') || host.includes('x.com')) return 'twitter';
            if (host.includes('linkedin')) return 'linkedin';
            if (host.includes('github')) return 'github';
            if (host.includes('medium')) return 'medium';
            if (host.includes('stackoverflow')) return 'stackoverflow';
            return 'webpage';
        }

        function extractExternalPageContent() {
            const host = window.location.hostname;
            let content = '';
            const title = document.title || '';
            const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
            const selectedText = window.getSelection()?.toString().trim() || '';
            if (selectedText.length > 10) content += `[USER SELECTED TEXT]: "${selectedText}"\n\n`;
            content += `[PAGE TITLE]: ${title}\n`;
            if (metaDesc) content += `[PAGE DESCRIPTION]: ${metaDesc}\n`;
            content += '\n';
            if (host.includes('wikipedia')) {
                const article = document.querySelector('#mw-content-text .mw-parser-output');
                if (article) {
                    const h1 = document.querySelector('h1#firstHeading')?.innerText || '';
                    content += `[ARTICLE]: ${h1}\n`;
                    const paragraphs = article.querySelectorAll('p');
                    paragraphs.forEach((p, i) => {
                        if (i < 3 && p.innerText.trim().length > 50) content += p.innerText.trim() + '\n';
                    });
                } else {
                    content += '[PAGE]: Wikipedia Main Page\n';
                    content += getVisibleText(300);
                }
            } else if (host.includes('youtube')) {
                const titleEl = document.querySelector('h1.ytd-video-title-renderer') || document.querySelector('h1[class*="title"]') || document.querySelector('yt-formatted-string.ytd-video-title-renderer');
                const videoTitle = titleEl?.innerText || '';
                const channelEl = document.querySelector('.ytd-channel-name-renderer a') || document.querySelector('[class*="channel-name"]');
                const channel = channelEl?.innerText || '';
                const descEl = document.querySelector('.ytd-text-expand-container') || document.querySelector('[class*="description"]');
                const desc = descEl?.innerText || '';
                if (videoTitle) content += `[VIDEO]: ${videoTitle}\n`;
                if (channel) content += `[CHANNEL]: ${channel}\n`;
                if (desc) content += `[DESCRIPTION]: ${desc.substring(0, 400)}\n`;
            } else if (host.includes('arxiv')) {
                const paperTitle = document.querySelector('h1.title')?.innerText || document.querySelector('.abs-title')?.innerText || '';
                const abstract = document.querySelector('.abstract')?.innerText || document.querySelector('[class*="abstract"]')?.innerText || '';
                if (paperTitle) content += `[PAPER]: ${paperTitle}\n`;
                if (abstract) content += `[ABSTRACT]: ${abstract}\n`;
            } else if (host.includes('reddit')) {
                const postTitle = document.querySelector('h1[data-testid="post-title"]')?.innerText || document.querySelector('h1')?.innerText || '';
                const postBody = document.querySelector('[data-testid="post-content"]')?.innerText || document.querySelector('.self-text')?.innerText || '';
                if (postTitle) content += `[POST]: ${postTitle}\n`;
                if (postBody) content += `[BODY]: ${postBody.substring(0, 300)}\n`;
                const comments = document.querySelectorAll('[data-testid="comment"]');
                let commentCount = 0;
                comments.forEach(c => {
                    if (commentCount < 2) {
                        const text = c.querySelector('[class*="comment-content"]')?.innerText || c.innerText;
                        if (text && text.length > 20) { content += `[COMMENT]: ${text.substring(0, 150)}\n`; commentCount++; }
                    }
                });
            } else if (host.includes('twitter') || host.includes('x.com')) {
                const tweets = document.querySelectorAll('[data-testid="tweet"] [data-testid="tweetText"]');
                let tweetCount = 0;
                tweets.forEach(t => { if (tweetCount < 3) { content += `[TWEET]: ${t.innerText}\n`; tweetCount++; } });
            } else if (host.includes('github.com')) {
                const repoName = document.querySelector('.repository-content h1')?.innerText || document.querySelector('[data-testid="repository-title-link"]')?.innerText || '';
                const readme = document.querySelector('.markdown')?.innerText || '';
                const fileContent = document.querySelector('.code-view .Lines')?.innerText || '';
                if (repoName) content += `[REPO]: ${repoName}\n`;
                if (readme) content += `[README]: ${readme.substring(0, 400)}\n`;
                if (fileContent) content += `[FILE]: ${fileContent.substring(0, 400)}\n`;
            } else if (host.includes('stackoverflow')) {
                const question = document.querySelector('.post-text[itemprop="text"]')?.innerText || document.querySelector('[class*="question-text"]')?.innerText || '';
                const answers = document.querySelectorAll('.answer .post-text');
                if (question) content += `[QUESTION]: ${question.substring(0, 300)}\n`;
                if (answers[0]) content += `[TOP ANSWER]: ${answers[0].innerText.substring(0, 300)}\n`;
            } else {
                content += getVisibleText(500);
            }
            return content.substring(0, 1000);
        }

        function getVisibleText(maxChars) {
            const viewportHeight = window.innerHeight;
            const elements = document.querySelectorAll('h1, h2, h3, p, li, td, th');
            let text = '';
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.bottom <= viewportHeight && el.innerText.trim().length > 20) {
                    text += el.innerText.trim() + '\n';
                }
            });
            return text.substring(0, maxChars);
        }

        async function sendMessage() {
            const message = input.value.trim();
            if (!message || sendBtn.disabled) return;
            if (activeTyping) activeTyping();   // finish the reply being typed (so its links and buttons are ready)
            finishGreeting();
            if (pendingGo && YES.test(message)) {
                input.value = '';
                addMessage('user', message);
                goTo(pendingGo);
                return;
            }
            addMessage('user', message);
            input.value = '';
            sendBtn.disabled = true;
            const pageContext = getSmartPageContext();
            showTypingIndicator();
            try {
                const response = await fetch(CONFIG.apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        client: 'bubble',
                        history: conversationHistory.filter(m => m.content !== CONFIG.welcomeMessage).slice(-20),
                        pageContext: pageContext
                    })
                });
                const data = await response.json().catch(() => ({}));
                hideTypingIndicator();
                if (data && data.response) {
                    if (response.ok) { addMessage('assistant', data.response); maybeGrow(data.response); }
                    else addMessageToUI('assistant', data.response);   // limit or error notices aren't saved
                } else {
                    throw new Error('Network response was not ok');
                }
            } catch (error) {
                console.error('VQ chat error:', error);
                hideTypingIndicator();
                addMessageToUI('assistant', "I'm having trouble connecting right now. Please try again in a moment, or open the full VQ Chat app.");
            } finally {
                sendBtn.disabled = false;
                if (!isPhone()) input.focus();
            }
        }
    }
})();
