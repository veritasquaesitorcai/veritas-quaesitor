(function() {
    'use strict';

    // Drawn icons (replace emoji, which look different on every device)
    const ICONS = {"vq": "<svg class=\"ic vq-mark\" viewBox=\"0 0 32 32\" aria-hidden=\"true\"><line class=\"l vq-antenna\" x1=\"16\" y1=\"4.2\" x2=\"16\" y2=\"8\"/><circle class=\"vq-light\" cx=\"16\" cy=\"3.4\" r=\"2.1\"/><rect class=\"f vq-head\" x=\"5.5\" y=\"8\" width=\"21\" height=\"16.5\" rx=\"6.5\"/><rect class=\"l\" x=\"5.5\" y=\"8\" width=\"21\" height=\"16.5\" rx=\"6.5\"/><rect class=\"vq-visor\" x=\"8.6\" y=\"11.6\" width=\"14.8\" height=\"7.6\" rx=\"3.8\"/><circle class=\"vq-eye\" cx=\"12.6\" cy=\"15.4\" r=\"2\"/><circle class=\"vq-eye\" cx=\"19.4\" cy=\"15.4\" r=\"2\"/><circle class=\"vq-glint\" cx=\"13.2\" cy=\"14.8\" r=\"0.6\"/><circle class=\"vq-glint\" cx=\"20\" cy=\"14.8\" r=\"0.6\"/><path class=\"l vq-mouth\" d=\"M13 21.6c1.9 1 4.1 1 6 0\"/><rect class=\"a vq-ear\" x=\"2.6\" y=\"13.6\" width=\"2.6\" height=\"5.2\" rx=\"1.3\"/><rect class=\"a vq-ear\" x=\"26.8\" y=\"13.6\" width=\"2.6\" height=\"5.2\" rx=\"1.3\"/></svg>", "user": "<svg class=\"ic\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle class=\"f\" cx=\"12\" cy=\"8.6\" r=\"3.9\"/><path class=\"f\" d=\"M4.8 20.2a7.2 7.2 0 0 1 14.4 0z\"/><circle class=\"l\" cx=\"12\" cy=\"8.6\" r=\"3.9\"/><path class=\"l\" d=\"M4.8 20.2a7.2 7.2 0 0 1 14.4 0\"/></svg>", "chat": "<svg class=\"ic\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path class=\"f\" d=\"M20.2 11.8a8.2 8.2 0 0 1-11.9 7.3L4 20.2l1.1-4.2a8.2 8.2 0 1 1 15.1-4.2z\"/><path class=\"l\" d=\"M20.2 11.8a8.2 8.2 0 0 1-11.9 7.3L4 20.2l1.1-4.2a8.2 8.2 0 1 1 15.1-4.2z\"/><circle class=\"a\" cx=\"8.6\" cy=\"12\" r=\"1\"/><circle class=\"a\" cx=\"12.2\" cy=\"12\" r=\"1\"/><circle class=\"a\" cx=\"15.8\" cy=\"12\" r=\"1\"/></svg>"};

    const CONFIG = {
        apiEndpoint: 'https://veritas-quaesitor-production.up.railway.app/chat',
        maxMessageLength: 2000,
        chatsKey: 'vq-app-chats',
        legacyKey: 'vq-app-conversation',
        sidebarStateKey: 'vq-sidebar-state',
        maxChats: 50,
        historySent: 20
    };

    // store = { activeId, chats: { id: { id, title, messages: [{role, content, sent?}], updated } } }
    let store = { activeId: null, chats: {} };
    let conversationHistory = [];
    let isTyping = false;
    let activePill = null; // capability pill mode

    const elements = {
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebar-toggle'),
        newChatBtn: document.getElementById('new-chat-btn'),
        mobileNewChatBtn: document.getElementById('mobile-new-chat-btn'),
        chatHistoryList: document.getElementById('chat-history'),
        messagesArea: document.getElementById('messages-area'),
        welcomeScreen: document.getElementById('welcome-screen'),
        chatContainer: document.getElementById('chat-container'),
        messageInput: document.getElementById('message-input'),
        sendBtn: document.getElementById('send-btn'),
        helpBtn: document.getElementById('help-btn'),
        infoModal: document.getElementById('info-modal'),
        closeModal: document.getElementById('close-modal'),
        charCount: document.getElementById('char-count'),
        statusText: document.getElementById('status-text'),
        panel: document.getElementById('insight-panel'),
        panelBody: document.getElementById('insight-body'),
        panelClose: document.getElementById('insight-close'),
        panelToggle: document.getElementById('insight-toggle'),
        panelScrim: document.getElementById('insight-scrim')
    };

    // ---------- Init ----------

    function init() {
        loadSidebarState();
        loadStore();
        randomizeRotatingCard();
        attachEventListeners();
        renderSidebar();
        applyTitleStyle();
        applyUIPrefs();
        renderActiveChat();
        setupPanel();
        setupPanelViews();
        setupAuth();
        if (window.innerWidth > 768) elements.messageInput.focus();
    }

    function attachEventListeners() {
        elements.sidebarToggle.addEventListener('click', toggleSidebar);
        // Phones: a menu button in the header opens the chat list as a drawer
        const mm = document.getElementById('mobile-menu-btn');
        if (mm) mm.addEventListener('click', () => { elements.sidebar.classList.remove('minimized'); syncSidebarDrawer(); });
        const ss = document.getElementById('sidebar-scrim');
        if (ss) ss.addEventListener('click', () => { elements.sidebar.classList.add('minimized'); syncSidebarDrawer(); });
        new MutationObserver(syncSidebarDrawer).observe(elements.sidebar, { attributes: true, attributeFilter: ['class'] });
        const shortPlaceholder = () => { elements.messageInput.placeholder = window.innerWidth <= 480 ? 'Ask VQ anything…' : 'Ask about CAI, resurrection evidence, or anything...'; };
        shortPlaceholder();
        window.addEventListener('resize', shortPlaceholder);
        elements.newChatBtn.addEventListener('click', startNewChat);
        elements.mobileNewChatBtn.addEventListener('click', startNewChat);
        elements.sendBtn.addEventListener('click', () => sendMessage());
        elements.helpBtn.addEventListener('click', () => showModal());
        elements.closeModal.addEventListener('click', () => hideModal());

        elements.infoModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) hideModal();
        });

        elements.messageInput.addEventListener('input', handleInputChange);
        elements.messageInput.addEventListener('keydown', handleKeyDown);

        // Capability pills
        document.querySelectorAll('.cap-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const mode = pill.dataset.mode;
                if (activePill === mode) {
                    activePill = null;
                    pill.classList.remove('active');
                } else {
                    document.querySelectorAll('.cap-pill').forEach(p => p.classList.remove('active'));
                    activePill = mode;
                    pill.classList.add('active');
                }
                elements.messageInput.focus();
            });
        });

        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                let prompt;
                if (card.classList.contains('cai-card-rotate-1') || card.classList.contains('cai-card-rotate-2')) {
                    prompt = card.dataset.currentPrompt;
                } else {
                    prompt = card.dataset.prompt;
                }
                elements.messageInput.value = prompt;
                handleInputChange();
                elements.messageInput.focus();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !elements.infoModal.classList.contains('hidden')) hideModal();
        });

        if (window.innerWidth <= 768) elements.sidebar.classList.add('minimized');
    }

    // ---------- Sidebar ----------

    function syncSidebarDrawer() {
        const open = window.innerWidth <= 768 && !elements.sidebar.classList.contains('minimized');
        document.body.classList.toggle('sidebar-open', open);
        const mm = document.getElementById('mobile-menu-btn');
        if (mm) mm.setAttribute('aria-expanded', String(open));
    }

    function toggleSidebar() {
        elements.sidebar.classList.toggle('minimized');
        saveSidebarState();
    }

    function loadSidebarState() {
        const isMinimized = localStorage.getItem(CONFIG.sidebarStateKey) === 'minimized';
        if (isMinimized || window.innerWidth < 1024) elements.sidebar.classList.add('minimized');
    }

    function saveSidebarState() {
        const state = elements.sidebar.classList.contains('minimized') ? 'minimized' : 'expanded';
        localStorage.setItem(CONFIG.sidebarStateKey, state);
    }

    function renderSidebar() {
        const list = elements.chatHistoryList;
        list.textContent = '';
        const chats = Object.values(store.chats)
            .filter(c => (c.messages && c.messages.length) || (c.oria && c.oria.length))
            .sort((a, b) => b.updated - a.updated);
        if (chats.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No conversations yet';
            list.appendChild(empty);
            return;
        }
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'chat-history-item' + (chat.id === store.activeId ? ' active' : '');
            item.setAttribute('role', 'button');
            item.tabIndex = 0;
            item.title = chat.title;

            const icon = document.createElement('span');
            icon.className = 'chat-history-icon';
            icon.innerHTML = ICONS.chat;
            icon.classList.add('chat-item-icon');

            const text = document.createElement('span');
            text.className = 'chat-history-text';
            text.textContent = chat.title;

            const del = document.createElement('button');
            del.className = 'chat-history-delete';
            del.type = 'button';
            del.setAttribute('aria-label', 'Delete chat');
            del.title = 'Delete chat';
            del.textContent = '×';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            });

            item.addEventListener('click', () => switchChat(chat.id));
            item.addEventListener('keydown', (e) => {
                if (e.target === item && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    switchChat(chat.id);
                }
            });

            item.append(icon, text, del);
            list.appendChild(item);
        });
    }

    // ---------- Chat storage ----------

    function newId() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    function loadStore() {
        try {
            const saved = localStorage.getItem(CONFIG.chatsKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object' && parsed.chats) store = parsed;
            }
            // Bring over the single conversation kept by the previous version of the app
            const legacy = localStorage.getItem(CONFIG.legacyKey);
            if (legacy) {
                const msgs = JSON.parse(legacy);
                if (Array.isArray(msgs) && msgs.length) {
                    const id = newId();
                    store.chats[id] = { id, title: titleFrom(msgs), messages: msgs, updated: Date.now() };
                    store.activeId = id;
                }
                localStorage.removeItem(CONFIG.legacyKey);
                saveStore();
            }
        } catch (e) {
            console.error('Failed to load chats:', e);
            store = { activeId: null, chats: {} };
        }
        if (store.activeId && !store.chats[store.activeId]) store.activeId = null;
        conversationHistory = store.activeId ? store.chats[store.activeId].messages : [];
    }

    function saveStore(quiet) {
        if (!quiet) scheduleSync();
        const ids = Object.keys(store.chats).sort((a, b) => store.chats[b].updated - store.chats[a].updated);
        ids.slice(CONFIG.maxChats).forEach(id => { if (id !== store.activeId) delete store.chats[id]; });
        try {
            localStorage.setItem(CONFIG.chatsKey, JSON.stringify(store));
        } catch (e) {
            // Storage full: drop the oldest chats until it fits
            console.error('Failed to save chats:', e);
            const oldest = Object.keys(store.chats)
                .filter(id => id !== store.activeId)
                .sort((a, b) => store.chats[a].updated - store.chats[b].updated);
            while (oldest.length) {
                delete store.chats[oldest.shift()];
                try { localStorage.setItem(CONFIG.chatsKey, JSON.stringify(store)); return; } catch (_) { /* keep trimming */ }
            }
        }
    }

    function titleFrom(messages) {
        const first = messages.find(m => m.role === 'user');
        if (!first) return 'New chat';
        const t = first.content.replace(/\s+/g, ' ').trim();
        return t.length > 42 ? t.slice(0, 40) + '…' : t;
    }

    function ensureActiveChat() {
        if (store.activeId && store.chats[store.activeId]) return;
        const id = newId();
        store.chats[id] = { id, title: 'New chat', messages: [], updated: Date.now() };
        store.activeId = id;
        conversationHistory = store.chats[id].messages;
    }

    function touchActiveChat() {
        const chat = store.chats[store.activeId];
        if (!chat) return;
        chat.messages = conversationHistory;
        chat.title = titleFrom(conversationHistory);
        chat.updated = Date.now();
        saveStore();
        renderSidebar();
    }

    function startNewChat() {
        if (isTyping) return;
        store.activeId = null;
        conversationHistory = [];
        saveStore();
        renderSidebar();
        renderActiveChat();
        elements.messageInput.value = '';
        handleInputChange();
        if (window.innerWidth <= 768) elements.sidebar.classList.add('minimized');
        elements.messageInput.focus();
    }

    function switchChat(id) {
        if (isTyping || !store.chats[id]) return;
        store.activeId = id;
        conversationHistory = store.chats[id].messages;
        saveStore();
        renderSidebar();
        renderActiveChat();
        if (window.innerWidth <= 768) elements.sidebar.classList.add('minimized');
    }

    function deleteChat(id) {
        if (isTyping || !store.chats[id]) return;
        if (!confirm('Delete this chat? This cannot be undone.')) return;
        delete store.chats[id];
        if (currentUser && sb) {
            sb.from('conversations').delete().eq('id', id).then(({ error }) => { if (error) console.error('Cloud delete failed:', error); });
        }
        if (store.activeId === id) {
            store.activeId = null;
            conversationHistory = [];
            renderActiveChat();
        }
        saveStore();
        renderSidebar();
    }

    function renderActiveChat() {
        elements.messagesArea.textContent = '';
        setTimeout(() => { if (typeof applySwapUI === 'function') applySwapUI(); }, 0);
        if (conversationHistory.length === 0) {
            if (elements.panel) rebuildPanelLog();
            showWelcomeScreen();
            elements.chatContainer.classList.remove('has-messages');
            return;
        }
        hideWelcomeScreen();
        elements.chatContainer.classList.add('has-messages');
        conversationHistory.forEach(msg => {
            const d = addMessageToUI(msg.role, msg.content, msg.role === 'assistant' ? msg.meta : null);
            if (d && msg.role === 'assistant') d._record = msg;
            if (d && msg.meta && msg.meta.fromOria) styleAsOria(d);
            if (d && msg.meta && msg.meta.uiOnly) d.classList.add(msg.role === 'user' ? 'ui-change-user' : 'ui-change');
            if (d && msg.meta && msg.meta.voice === 'oria') styleOriaAnswer(d);
            if (d && msg.meta && msg.meta.fromVQPanel) styleAsVQPanel(d);
        });
        rebuildPanelLog();
        refreshRetryButton();
        scrollToBottom();
    }

    // ---------- Welcome & modal ----------

    function randomizeRotatingCard() {
        const card1 = document.querySelector('.cai-card-rotate-1');
        const text1 = card1.querySelector('.cai-text-rotate-1');
        const options1 = [
            { text: 'Explain CAI methodology', prompt: 'Explain CAI methodology' },
            { text: 'Resurrection evidence', prompt: 'What evidence supports the resurrection?' },
            { text: 'Bayesian reasoning', prompt: 'How does Bayesian reasoning apply to faith?' }
        ];
        const selected1 = options1[Math.floor(Math.random() * options1.length)];
        text1.textContent = selected1.text;
        card1.dataset.currentPrompt = selected1.prompt;

        const card2 = document.querySelector('.cai-card-rotate-2');
        const text2 = card2.querySelector('.cai-text-rotate-2');
        const options2 = [
            { text: 'Beta Tools overview', prompt: 'Tell me about the Beta Tools' },
            { text: 'Mechanism challenges', prompt: 'How does CAI handle mechanism challenges?' },
            { text: 'Epistemic symmetry', prompt: 'What is Epistemic Truth Symmetry?' }
        ];
        const selected2 = options2[Math.floor(Math.random() * options2.length)];
        text2.textContent = selected2.text;
        card2.dataset.currentPrompt = selected2.prompt;
    }

    function showWelcomeScreen() {
        elements.welcomeScreen.classList.remove('hidden');
        randomizeRotatingCard();
    }

    function hideWelcomeScreen() {
        elements.welcomeScreen.classList.add('hidden');
    }

    function showModal() { elements.infoModal.classList.remove('hidden'); }
    function hideModal() { elements.infoModal.classList.add('hidden'); }

    // ---------- Input ----------

    function handleInputChange() {
        const length = elements.messageInput.value.length;
        elements.charCount.textContent = `${length} / ${CONFIG.maxMessageLength}`;
        elements.sendBtn.disabled = length === 0 || length > CONFIG.maxMessageLength || isTyping;
        autoResizeTextarea();
    }

    function autoResizeTextarea() {
        elements.messageInput.style.height = 'auto';
        const newHeight = Math.min(elements.messageInput.scrollHeight, 150);
        elements.messageInput.style.height = newHeight + 'px';
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!elements.sendBtn.disabled) sendMessage();
        }
    }

    // ---------- Rendering ----------

    // Build an <img> from a model-supplied tag using only its https src (no other attributes survive)
    function safeImageFrom(tagHtml) {
        const m = /\ssrc\s*=\s*["']([^"']+)["']/i.exec(tagHtml);
        if (!m) return null;
        let url;
        try { url = new URL(m[1]); } catch (e) { return null; }
        if (url.protocol !== 'https:') return null;
        const img = document.createElement('img');
        img.src = url.href;
        img.alt = '';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.style.display = 'block';
        img.style.width = '100%';
        img.style.borderRadius = '8px';
        img.style.marginTop = '8px';
        img.onerror = function() { this.style.display = 'none'; };
        return img;
    }

    const MD_ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'del', 'ul', 'ol', 'li', 'a', 'code', 'pre',
        'blockquote', 'h1', 'h2', 'h3', 'h4', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'];

    // Formatted text (bold, lists, links...) rendered safely; plain text if the libraries failed to load
    function appendRichText(container, text) {
        if (window.marked && window.DOMPurify) {
            const html = window.marked.parse(text, { breaks: true, gfm: true });
            const clean = window.DOMPurify.sanitize(html, {
                ALLOWED_TAGS: MD_ALLOWED_TAGS,
                ALLOWED_ATTR: ['href', 'title'],
                ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i
            });
            const block = document.createElement('div');
            block.className = 'md';
            block.innerHTML = clean;
            block.querySelectorAll('a').forEach(a => {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            });
            container.appendChild(block);
        } else {
            const span = document.createElement('span');
            span.style.whiteSpace = 'pre-wrap';
            span.style.display = 'block';
            span.textContent = text;
            container.appendChild(span);
        }
    }

    // Code fences are stripped because the model sometimes wraps image tags in them
    // Only unwrap old-style ```html fences; real code blocks and layout blocks stay intact
    function cleanReply(text) {
        return (text || '').replace(/```html\s*([\s\S]*?)```/gi, '$1');
    }

    const PRESENT_RE = /```vq-present\s*([\s\S]*?)(```|$)/g;

    // The model sometimes drops the ``` fences and writes just "vq-present" followed by the JSON.
    // Find that JSON by matching its braces and put the fences back, so it still becomes a layout.
    function normalizePresent(text) {
        let out = '', i = 0;
        const re = /(^|\n)[ \t]*(?:`{1,3})?vq-present[ \t]*\r?\n/g;
        let m;
        while ((m = re.exec(text))) {
            const before = text.slice(0, m.index);
            if (/```\s*$/.test(before.slice(-4))) continue;             // already fenced
            const start = text.indexOf('{', m.index + m[0].length);
            if (start < 0 || text.slice(m.index + m[0].length, start).trim()) continue;
            let depth = 0, inStr = false, esc = false, end = -1;
            for (let k = start; k < text.length; k++) {
                const ch = text[k];
                if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
                if (ch === '"') inStr = true;
                else if (ch === '{') depth++;
                else if (ch === '}') { depth--; if (depth === 0) { end = k; break; } }
            }
            out += text.slice(i, m.index) + (m[1] || '') + '```vq-present\n' + text.slice(start, end < 0 ? text.length : end + 1) + (end < 0 ? '' : '\n```');
            i = end < 0 ? text.length : end + 1;
            const after = text.slice(i);
            const trailing = after.match(/^\s*`{1,3}/);              // a lone closing fence left behind
            if (trailing) i += trailing[0].length;
            re.lastIndex = i;
        }
        return out + text.slice(i);
    }
    function stripPresent(text) { return normalizePresent(text || '').replace(PRESENT_RE, '').trim(); }

    function fillRichText(contentDiv, text) {
        text.split(/(<img[^>]*>)/i).forEach(part => {
            if (/^<img/i.test(part)) {
                const imgEl = safeImageFrom(part);
                if (imgEl) contentDiv.appendChild(imgEl);
            } else if (part.trim()) {
                appendRichText(contentDiv, part);
            }
        });
    }

    function fillRich(contentDiv, content) {
        contentDiv.textContent = '';
        contentDiv.classList.add('rich');
        const text = normalizePresent(cleanReply(content));
        let last = 0;
        text.replace(PRESENT_RE, (m, body, closed, idx) => {
            fillRichText(contentDiv, text.slice(last, idx));
            if (!closed) {
                contentDiv.appendChild(el('div', 'present-loading', 'Preparing a layout…'));
            } else {
                try { const node = renderPresent(JSON.parse(body.trim())); if (node) contentDiv.appendChild(node); }
                catch (e) { /* malformed layout: leave it out rather than show raw data */ }
            }
            last = idx + m.length;
            return m;
        });
        fillRichText(contentDiv, text.slice(last));
        enhanceTables(contentDiv);
    }

    // ---------- Presentation layouts (VQ supplies data; the app draws it) ----------
    const safeHttps = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; } };
    const str = (v, n) => (typeof v === 'string' || typeof v === 'number') ? String(v).slice(0, n) : '';

    function renderPresent(d) {
        if (!d || typeof d !== 'object') return null;
        const wrap = el('div', `present present-type-${String(d.type).replace(/[^a-z]/g, '')}`);
        if (d.title) wrap.appendChild(el('div', 'present-title', str(d.title, 120)));
        if (d.type === 'cards' && Array.isArray(d.items)) {
            const grid = el('div', 'present-cards');
            d.items.slice(0, 8).forEach(it => {
                if (!it) return;
                const card = el('div', 'pcard');
                const img = safeHttps(it.image);
                if (img) {
                    const im = document.createElement('img');
                    im.src = img; im.alt = str(it.title, 120); im.loading = 'lazy'; im.referrerPolicy = 'no-referrer';
                    im.onerror = () => im.remove();
                    card.appendChild(im);
                }
                const bodyEl = el('div', 'pcard-body');
                if (it.tag) bodyEl.appendChild(el('span', 'pcard-tag', str(it.tag, 30)));
                const title = str(it.title, 100);
                bodyEl.appendChild(el('div', 'pcard-title', title));
                if (it.subtitle) bodyEl.appendChild(el('div', 'pcard-sub', str(it.subtitle, 120)));
                if (it.text) bodyEl.appendChild(el('p', 'pcard-text', str(it.text, 400)));
                // Footer: "Tell me more" (asks VQ) and, when there is a real link, "Visit ↗"
                const foot = el('div', 'pcard-foot');
                foot.appendChild(el('span', 'pcard-more', 'Tell me more →'));
                const url = safeHttps(it.url);
                if (url) {
                    const a = el('a', 'pcard-visit', 'Visit ↗');
                    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
                    a.title = hostOf(url);
                    a.addEventListener('click', (e) => e.stopPropagation());
                    foot.appendChild(a);
                }
                bodyEl.appendChild(foot);
                card.appendChild(bodyEl);
                if (title) {
                    card.classList.add('clickable');
                    card.tabIndex = 0;
                    card.setAttribute('role', 'button');
                    card.setAttribute('aria-label', `Tell me more about ${title}`);
                    const ask = () => askAbout(title, str(it.subtitle, 120));
                    card.addEventListener('click', ask);
                    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ask(); } });
                }
                grid.appendChild(card);
            });
            wrap.appendChild(grid);
        } else if (d.type === 'compare' && Array.isArray(d.columns) && Array.isArray(d.rows)) {
            const scroller = el('div', 'present-scroll');
            const table = document.createElement('table');
            const head = document.createElement('tr');
            head.appendChild(document.createElement('th'));
            d.columns.slice(0, 5).forEach(c => head.appendChild(el('th', null, str(c, 60))));
            const thead = document.createElement('thead'); thead.appendChild(head); table.appendChild(thead);
            const tb = document.createElement('tbody');
            d.rows.slice(0, 14).forEach(r => {
                if (!r) return;
                const tr = document.createElement('tr');
                tr.appendChild(el('th', null, str(r.label, 60)));
                (r.values || []).slice(0, 5).forEach(v => tr.appendChild(el('td', null, str(v, 200))));
                tb.appendChild(tr);
            });
            table.appendChild(tb);
            scroller.appendChild(table);
            wrap.appendChild(scroller);
        } else if (d.type === 'timeline' && Array.isArray(d.events)) {
            const list = el('ol', 'present-timeline');
            d.events.slice(0, 12).forEach(ev => {
                if (!ev) return;
                const li = el('li');
                li.appendChild(el('span', 'tl-date', str(ev.date, 40)));
                li.appendChild(el('div', 'tl-title', str(ev.title, 120)));
                if (ev.text) li.appendChild(el('p', 'tl-text', str(ev.text, 300)));
                list.appendChild(li);
            });
            wrap.appendChild(list);
        } else if (d.type === 'steps' && Array.isArray(d.steps)) {
            const list = el('ol', 'present-steps');
            d.steps.slice(0, 12).forEach(st => {
                if (!st) return;
                const li = el('li');
                li.appendChild(el('div', 'st-title', str(st.title, 120)));
                if (st.text) li.appendChild(el('p', 'st-text', str(st.text, 400)));
                list.appendChild(li);
            });
            wrap.appendChild(list);
        } else if (d.type === 'facts' && Array.isArray(d.facts)) {
            const grid = el('dl', 'present-facts');
            d.facts.slice(0, 12).forEach(f => {
                if (!f) return;
                const row = el('div', 'fact');
                row.appendChild(el('dt', null, str(f.label, 60)));
                row.appendChild(el('dd', null, str(f.value, 200)));
                grid.appendChild(row);
            });
            wrap.appendChild(grid);
        } else {
            return null;
        }
        return wrap.childElementCount > (d.title ? 1 : 0) ? wrap : null;
    }

    // Clicking a card asks VQ for more about it, like following a link in a browser
    function askAbout(title, subtitle) {
        if (isTyping) return;
        elements.messageInput.value = `Tell me more about ${title}${subtitle ? ` (${subtitle})` : ''}.`;
        elements.messageInput.dispatchEvent(new Event('input'));
        sendMessage();
    }

    // The page VQ read: a card with the title, image and a link to the original
    function buildPageCard(page) {
        const url = safeHttps(page.url) || (/^http:\/\//.test(page.url || '') ? page.url : null);
        if (!url) return null;
        const a = el('a', 'page-card');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        const img = safeHttps(page.image);
        if (img) {
            const im = document.createElement('img');
            im.src = img; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer';
            im.onerror = () => im.remove();
            a.appendChild(im);
        }
        const b = el('div', 'page-card-body');
        b.appendChild(el('span', 'page-card-site', str(page.site, 60) || hostOf(url)));
        b.appendChild(el('span', 'page-card-title', str(page.title, 140) || url));
        if (page.description) b.appendChild(el('span', 'page-card-desc', str(page.description, 220)));
        b.appendChild(el('span', 'page-card-open', 'Open the original ↗'));
        a.appendChild(b);
        return a;
    }

    // Tables: small ones stay inline; big ones become a compact preview card that opens full size,
    // so the answer's text reads first and the table is one clear click away
    function isBigTable(table) {
        const cols = tableCols(table);
        const text = table.textContent.length;
        const longCell = [...table.querySelectorAll('td')].some(td => td.textContent.length > 110);
        return cols > 3 || text > 700 || longCell;
    }

    function tableCols(table) {
        const firstRow = table.querySelector('tr');
        return firstRow ? firstRow.children.length : 0;
    }

    // Title from a heading (or an all-bold line) just above the table; otherwise from the column names
    function tableTitle(table) {
        const prev = table.previousElementSibling;
        const isHeading = prev && (/^H[1-4]$/.test(prev.tagName) ||
            (prev.tagName === 'P' && prev.children.length === 1 && /^(STRONG|B)$/.test(prev.firstElementChild.tagName) &&
             prev.textContent.trim() === prev.firstElementChild.textContent.trim()));
        if (isHeading) {
            const t = prev.textContent.trim().replace(/:$/, '');
            if (t && t.length <= 90) return t;
        }
        const heads = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim()).filter(Boolean);
        return heads.length ? heads.slice(0, 3).join(' · ') : 'Table';
    }

    function enhanceTables(contentDiv) {
        const tables = contentDiv.querySelectorAll('.md table');
        tables.forEach(table => {
            const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
            table.querySelectorAll('tbody tr').forEach(tr => {
                [...tr.children].forEach((cell, i) => { if (headers[i]) cell.setAttribute('data-label', headers[i]); });
            });

            if (!isBigTable(table)) {
                const wrap = document.createElement('div');
                wrap.className = 'table-wrap';
                table.parentNode.insertBefore(wrap, table);
                const scroller = document.createElement('div');
                scroller.className = 'table-scroll';
                scroller.appendChild(table);
                wrap.appendChild(scroller);
                return;
            }

            const rows = table.querySelectorAll('tbody tr').length;
            const cols = tableCols(table);
            const title = tableTitle(table);

            const card = document.createElement('div');
            card.className = 'table-card';
            card.setAttribute('role', 'button');
            card.tabIndex = 0;
            card.setAttribute('aria-label', `Open table: ${title}`);

            const head = document.createElement('div');
            head.className = 'table-card-head';
            const icon = document.createElement('span');
            icon.className = 'table-card-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>';
            const meta = document.createElement('span');
            meta.className = 'table-card-meta';
            const t1 = document.createElement('span');
            t1.className = 'table-card-title';
            t1.textContent = title;
            const t2 = document.createElement('span');
            t2.className = 'table-card-size';
            t2.textContent = `Table · ${rows} row${rows === 1 ? '' : 's'} · ${cols} columns`;
            meta.append(t1, t2);
            const open = document.createElement('span');
            open.className = 'table-card-open';
            open.textContent = 'Open table';
            head.append(icon, meta, open);

            // Mini preview: first 3 columns, first 3 rows, one line per cell
            const preview = table.cloneNode(true);
            preview.className = 'table-preview';
            preview.querySelectorAll('tr').forEach(tr => [...tr.children].forEach((c, i) => { if (i > 2) c.remove(); }));
            preview.querySelectorAll('tbody tr').forEach((tr, i) => { if (i > 2) tr.remove(); });
            const pv = document.createElement('div');
            pv.className = 'table-preview-wrap';
            pv.setAttribute('aria-hidden', 'true');
            pv.appendChild(preview);

            card.append(head, pv);
            const openIt = () => openTableView(table, title);
            card.addEventListener('click', openIt);
            card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIt(); } });

            table.parentNode.insertBefore(card, table);
            const store = document.createElement('div');
            store.hidden = true;
            store.appendChild(table);
            card.appendChild(store);
        });
    }

    function openTableView(table, title) {
        closeTableView();
        const overlay = document.createElement('div');
        overlay.className = 'table-overlay';
        overlay.id = 'table-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Table');
        const box = document.createElement('div');
        box.className = 'table-overlay-box';
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'table-overlay-close';
        close.setAttribute('aria-label', 'Close table');
        close.textContent = '×';
        close.addEventListener('click', closeTableView);
        const inner = document.createElement('div');
        inner.className = 'md table-overlay-scroll';
        inner.appendChild(table.cloneNode(true));
        const h = document.createElement('h3');
        h.className = 'table-overlay-title';
        h.textContent = title || 'Table';
        box.append(close, h, inner);
        overlay.appendChild(box);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeTableView(); });
        document.body.appendChild(overlay);
        close.focus();
    }

    function closeTableView() {
        const o = document.getElementById('table-overlay');
        if (o) o.remove();
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTableView(); });

    // A reply bubble that fills in as the words arrive
    function createStreamingBubble() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message streaming';
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = ICONS.vq;
        const body = document.createElement('div');
        body.className = 'message-body';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        body.appendChild(contentDiv);
        messageDiv.append(avatar, body);
        elements.messagesArea.appendChild(messageDiv);
        scrollToBottom();
        return { div: messageDiv, content: contentDiv };
    }

    // "Behind this answer": what the system actually did for this reply (from the server, not written by the model)
    function buildTracePanel(meta) {
        const details = document.createElement('details');
        details.className = 'trace';
        const summary = document.createElement('summary');
        summary.textContent = 'Behind this answer';
        details.appendChild(summary);

        const list = document.createElement('dl');
        const row = (label, fill) => {
            const dt = document.createElement('dt');
            dt.textContent = label;
            const dd = document.createElement('dd');
            fill(dd);
            list.append(dt, dd);
        };
        const text = (value) => (dd) => { dd.textContent = value; };
        const chips = (items) => (dd) => {
            items.forEach(item => {
                const chip = document.createElement('span');
                chip.className = 'trace-chip';
                chip.textContent = item;
                dd.appendChild(chip);
            });
        };

        if (meta.mode) row('Mode', text(meta.mode));
        if (Array.isArray(meta.rules) && meta.rules.length) {
            row('Rules in play', (dd) => {
                const ul = document.createElement('ul');
                meta.rules.forEach(r => { const li = document.createElement('li'); li.textContent = r; ul.appendChild(li); });
                dd.appendChild(ul);
            });
        }
        if (Array.isArray(meta.knowledge) && meta.knowledge.length) row('Knowledge loaded', chips(meta.knowledge));
        if (Array.isArray(meta.live) && meta.live.length) row('Live data', chips(meta.live));
        if (Array.isArray(meta.sources) && meta.sources.length) {
            row('Sources', (dd) => {
                const ul = document.createElement('ul');
                meta.sources.forEach(src => {
                    let url;
                    try { url = new URL(src.url); } catch (e) { return; }
                    if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = url.href;
                    a.textContent = src.title || url.hostname;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    li.appendChild(a);
                    ul.appendChild(li);
                });
                dd.appendChild(ul);
            });
        }
        if (typeof meta.history_used === 'number') {
            row('Conversation', text(meta.history_used ? `Used the last ${meta.history_used} messages` : 'First message in this chat'));
        }
        if (meta.model) row('Model', text(meta.model));
        details.appendChild(list);

        const note = document.createElement('p');
        note.className = 'trace-note';
        note.textContent = "Recorded by VQ's system while preparing this reply, not written by the model.";
        details.appendChild(note);
        return details;
    }

    function addMessageToUI(role, content, meta) {
        const messageDiv = document.createElement('div');
        messageDiv.className = role === 'user' ? 'message user' : 'message';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'user' ? ICONS.user : ICONS.vq;

        const body = document.createElement('div');
        body.className = 'message-body';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (role === 'user') {
            contentDiv.textContent = content;
        } else {
            fillRich(contentDiv, content);
            if (contentDiv.querySelector('.table-wrap')) messageDiv.classList.add('has-table');
        }

        body.appendChild(contentDiv);

        if (role !== 'user') {
            const actions = document.createElement('div');
            actions.className = 'message-actions';

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'msg-action';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', () => copyText(stripPresent(content.replace(/<img[^>]*>/gi, '')) || contentDiv.innerText.trim(), copyBtn));
            actions.appendChild(copyBtn);

            const noteBtn = document.createElement('button');
            noteBtn.type = 'button';
            noteBtn.className = 'msg-action';
            noteBtn.textContent = 'Save to notes';
            noteBtn.addEventListener('click', () => {
                addNote(contentDiv.innerText.trim(), true);
                noteBtn.textContent = 'Saved ✓';
                setTimeout(() => { noteBtn.textContent = 'Save to notes'; }, 1500);
            });
            actions.appendChild(noteBtn);

            const enqBtn = document.createElement('button');
            enqBtn.type = 'button';
            enqBtn.className = 'msg-action ask-friend';
            enqBtn.textContent = `Ask ${FRIEND_NAME}`;
            enqBtn.title = `${FRIEND_NAME}: the third friend in the chat, a separate AI voice`;
            // On O.R.I.A.'s own answers (during a swap) this asks VQ in the panel instead
            enqBtn.addEventListener('click', () => {
                if (messageDiv.classList.contains('oria-voice')) askPanelVQ(messageDiv);
                else askEnquirer(messageDiv);
            });
            actions.appendChild(enqBtn);

            body.appendChild(actions);
            if (meta && typeof meta === 'object') {
                if (Array.isArray(meta.sources) && meta.sources.length) linkCitations(contentDiv, meta.sources);
                if (meta.page && meta.page.url) { const pc = buildPageCard(meta.page); if (pc) body.insertBefore(pc, body.querySelector('.message-actions')); }
                if (Array.isArray(meta.images) && meta.images.length) body.appendChild(buildGallery(meta.images));
                appendAnswerChips(body, messageDiv, meta);
            }
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(body);
        elements.messagesArea.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv;
    }

    // Only the last VQ reply gets a "Try again" button
    function refreshRetryButton() {
        elements.messagesArea.querySelectorAll('.msg-retry').forEach(b => b.remove());
        const last = conversationHistory[conversationHistory.length - 1];
        if (!last || last.role !== 'assistant') return;
        const msgs = elements.messagesArea.querySelectorAll('.message:not(.user)');
        const lastDiv = msgs[msgs.length - 1];
        if (!lastDiv) return;
        const actions = lastDiv.querySelector('.message-actions');
        if (!actions) return;
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'msg-action msg-retry';
        retry.textContent = 'Try again';
        retry.addEventListener('click', regenerateLast);
        actions.appendChild(retry);
    }

    function copyText(text, btn) {
        const done = () => {
            btn.textContent = 'Copied';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
        } else {
            fallbackCopy(text, done);
        }
    }

    function fallbackCopy(text, done) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
        ta.remove();
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message';
        typingDiv.id = 'typing-indicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = ICONS.vq;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            indicator.appendChild(dot);
        }

        contentDiv.appendChild(indicator);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(contentDiv);

        elements.messagesArea.appendChild(typingDiv);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const typingDiv = document.getElementById('typing-indicator');
        if (typingDiv) typingDiv.remove();
    }

    function scrollToBottom() {
        const container = document.getElementById('chat-container');
        const lastMessage = container.querySelector('#messages-area > .message:last-child');
        if (lastMessage) {
            setTimeout(() => {
                lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    function setStatus(status, text) {
        elements.statusText.textContent = text;
        const dot = document.querySelector('.status-dot');
        switch (status) {
            case 'online': dot.style.background = '#4ade80'; break;
            case 'typing': dot.style.background = '#fbbf24'; break;
            case 'error': dot.style.background = '#ef4444'; break;
        }
    }


    // ---------- "Behind this answer" side panel (a running log, one entry per answer) ----------

    const PANEL_KEY = 'vq-insight-panel';
    const entryFor = new WeakMap();   // answer record -> panel entry element
    let liveEntry = null;
    let liveLineNo = 0;

    function isWide() { return window.matchMedia('(min-width: 1280px)').matches; }

    function setupPanel() {
        if (!elements.panel) return;
        const pref = localStorage.getItem(PANEL_KEY);
        if (isWide() && pref !== 'closed') openPanel(false);
        elements.panelClose.addEventListener('click', () => closePanel(true));
        elements.panelToggle.addEventListener('click', () => {
            if (document.body.classList.contains('insight-open')) closePanel(true);
            else { openPanel(true); scrollPanelToEnd(); }
        });
        elements.panelScrim.addEventListener('click', () => closePanel(false));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('insight-open') && !isWide()) closePanel(false);
        });
        rebuildPanelLog();
    }

    function openPanel(remember) {
        document.body.classList.add('insight-open');
        elements.panelToggle.setAttribute('aria-expanded', 'true');
        if (remember) localStorage.setItem(PANEL_KEY, 'open');
    }

    function closePanel(remember) {
        document.body.classList.remove('insight-open');
        elements.panelToggle.setAttribute('aria-expanded', 'false');
        if (remember) localStorage.setItem(PANEL_KEY, 'closed');
    }

    function el(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined && text !== null) n.textContent = text;
        return n;
    }

    function hostOf(url) {
        try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
    }

    function isBigQuestion(meta) {
        return !!(meta && Array.isArray(meta.rules) && meta.rules.some(r => r.indexOf('Big-question') === 0));
    }

    // One-line summary for the chip under an answer; null when nothing notable happened
    function summarize(meta) {
        if (meta && meta.page && meta.page.url) {
            const extra = (meta.sources || []).filter(src => src.url !== meta.page.url).length;
            return `Read ${meta.page.site || hostOf(meta.page.url)}` + (extra ? ` · searched ${extra} source${extra === 1 ? '' : 's'}` : '');
        }
        if (!meta) return null;
        const n = Array.isArray(meta.sources) ? meta.sources.length : 0;
        if (n) return `${(meta.live || []).indexOf('News search') >= 0 ? 'Searched the news' : 'Searched the web'} · ${n} source${n === 1 ? '' : 's'}`;
        if ((meta.ui || []).length) return `Changed your screen · ${meta.ui[meta.ui.length - 1]}`;
        if (isBigQuestion(meta)) return 'Christian starting point · naturalism noted';
        if (meta.mode) return `${meta.mode} mode${meta.continued ? ' · continued' : ''}`;
        const live = (meta.live || []).filter(x => !/failed/i.test(x));
        if (live.length) return live.join(' · ');
        if ((meta.live || []).length) return 'Live lookup failed';
        const extra = (meta.knowledge || []).filter(k => k !== 'VQ core identity');
        if (extra.length) return `Drew on ${extra[0]}${extra.length > 1 ? ` +${extra.length - 1}` : ''}`;
        return null;
    }


    // Numbered source markers like 【3】 or 【3†L4-L9】 become small links to that source
    function linkCitations(root, sources) {
        const re = /【(\d+)[^】]*】/g;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) if (re.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            const frag = document.createDocumentFragment();
            let last = 0;
            node.nodeValue.replace(re, (m, num, idx) => {
                frag.appendChild(document.createTextNode(node.nodeValue.slice(last, idx)));
                const src = sources[parseInt(num, 10) - 1];
                let url = null;
                try { url = src && new URL(src.url); } catch (e) { url = null; }
                if (url && (url.protocol === 'https:' || url.protocol === 'http:')) {
                    const a = document.createElement('a');
                    a.className = 'cite';
                    a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
                    a.title = src.title || url.hostname;
                    a.textContent = num;
                    frag.appendChild(a);
                } else {
                    const sup = document.createElement('sup');
                    sup.className = 'cite';
                    sup.textContent = num;
                    frag.appendChild(sup);
                }
                last = idx + m.length;
                return m;
            });
            frag.appendChild(document.createTextNode(node.nodeValue.slice(last)));
            node.parentNode.replaceChild(frag, node);
        });
    }

    // Pictures found by VQ's search, shown as a tidy strip under the answer
    function buildGallery(images) {
        const wrap = document.createElement('div');
        wrap.className = 'img-gallery';
        images.slice(0, 6).forEach((im, i) => {
            let url;
            try { url = new URL(im.url); } catch (e) { return; }
            if (url.protocol !== 'https:') return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'img-thumb';
            btn.setAttribute('aria-label', im.description ? `View image: ${im.description}` : 'View image');
            const img = document.createElement('img');
            img.src = url.href; img.alt = im.description || ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
            img.onerror = () => btn.remove();
            btn.appendChild(img);
            btn.addEventListener('click', () => openImageView(images, i));
            wrap.appendChild(btn);
        });
        return wrap;
    }

    function openImageView(images, start) {
        closeTableView();
        let i = start;
        const overlay = document.createElement('div');
        overlay.className = 'table-overlay img-overlay';
        overlay.id = 'table-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Image');
        const box = document.createElement('figure');
        box.className = 'img-view';
        const img = document.createElement('img');
        img.referrerPolicy = 'no-referrer';
        const cap = document.createElement('figcaption');
        const close = document.createElement('button');
        close.type = 'button'; close.className = 'table-overlay-close'; close.setAttribute('aria-label', 'Close'); close.textContent = '×';
        close.addEventListener('click', closeTableView);
        const prev = document.createElement('button');
        prev.type = 'button'; prev.className = 'img-nav prev'; prev.setAttribute('aria-label', 'Previous image'); prev.textContent = '‹';
        const next = document.createElement('button');
        next.type = 'button'; next.className = 'img-nav next'; next.setAttribute('aria-label', 'Next image'); next.textContent = '›';
        const show = () => {
            const im = images[i];
            img.src = im.url; img.alt = im.description || '';
            let host = '';
            try { host = new URL(im.url).hostname.replace(/^www\./, ''); } catch (e) {}
            cap.textContent = (im.description ? im.description + ' · ' : '') + host;
            prev.hidden = next.hidden = images.length < 2;
        };
        prev.addEventListener('click', () => { i = (i - 1 + images.length) % images.length; show(); });
        next.addEventListener('click', () => { i = (i + 1) % images.length; show(); });
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') prev.click();
            if (e.key === 'ArrowRight') next.click();
        });
        box.append(close, img, cap, prev, next);
        overlay.appendChild(box);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeTableView(); });
        document.body.appendChild(overlay);
        show();
        close.focus();
    }

    function appendAnswerChips(body, messageDiv, meta) {
        // The page VQ read already has its own card, so it isn't repeated as a source chip
        const sources = (Array.isArray(meta.sources) ? meta.sources : []).filter(src => !(meta.page && src.url === meta.page.url));
        if (sources.length) {
            const row = el('div', 'src-row');
            sources.slice(0, 3).forEach(src => {
                let url;
                try { url = new URL(src.url); } catch (e) { return; }
                if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
                const a = el('a', 'src-chip');
                a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.appendChild(el('span', 'src-dot', (hostOf(url.href)[0] || '?').toUpperCase()));
                a.appendChild(el('span', 'src-text', `${hostOf(url.href)} · ${src.title || ''}`));
                row.appendChild(a);
            });
            body.appendChild(row);
        }
        const text = summarize(meta);
        if (!text) return;
        const chip = el('button', 'insight-chip');
        chip.type = 'button';
        chip.title = 'Show what happened behind this answer';
        chip.setAttribute('aria-label', `Behind this answer: ${text}`);
        const ic = el('span', 'insight-chip-icon');
        ic.setAttribute('aria-hidden', 'true');
        ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>';
        chip.appendChild(ic);
        chip.appendChild(el('span', null, text));
        chip.appendChild(el('span', 'insight-chip-more', 'details'));
        chip.addEventListener('click', () => {
            openPanel(isWide());
            focusEntryFor(messageDiv);
        });
        body.appendChild(chip);
    }

    // ---- code-style colouring: verbs like keywords, names like functions, values like strings, numbers like numbers
    function colorize(parent, text, base) {
        String(text).split(/(\d+(?:\.\d+)?)/).forEach(part => {
            if (!part) return;
            parent.appendChild(el('span', /^\d/.test(part) ? 'tk-num' : base, part));
        });
    }

    function codeLine(no, verb, rest, detail, ms, opts) {
        opts = opts || {};
        const li = el('li', 'cl' + (opts.active ? ' active' : ''));
        li.appendChild(el('span', 'cl-no', String(no)));
        const txt = el('span', 'cl-txt');
        txt.appendChild(el('span', 'tk-kw', verb));
        if (rest) { txt.appendChild(document.createTextNode(' ')); txt.appendChild(el('span', opts.restClass || 'tk-id', rest)); }
        if (detail) {
            const d = el('span', 'cl-detail');
            d.appendChild(el('span', 'tk-com', '→ '));
            colorize(d, detail, opts.detailClass || 'tk-str');
            txt.appendChild(d);
        }
        if (opts.active) txt.appendChild(el('span', 'cl-cursor'));
        li.appendChild(txt);
        if (typeof ms === 'number') li.appendChild(el('span', 'cl-ms tk-num', ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`));
        return li;
    }

    function splitVerb(label) {
        const i = label.indexOf(' ');
        return i < 0 ? [label, ''] : [label.slice(0, i), label.slice(i + 1)];
    }

    function entryHeader(label, question) {
        const h = el('div', 'entry-head');
        h.appendChild(el('span', 'tk-com', `// ${label}`));
        const q = question.length > 110 ? question.slice(0, 108) + '…' : question;
        h.appendChild(el('span', 'tk-str entry-q', `"${q}"`));
        return h;
    }

    function buildEntry(messageDiv) {
        if (uiPrefs.panelDetail === 'plain') return buildPlainEntry(messageDiv);
        const rec = messageDiv._record;
        const meta = rec.meta || {};
        const art = el('article', 'insight-entry');
        art.appendChild(entryHeader('answer to', findQuestionFor(rec) || ''));

        const ol = el('ol', 'code');
        let n = 0;
        const extra = (meta.knowledge || []).filter(k => k !== 'VQ core identity');
        ol.appendChild(codeLine(++n, 'Read', 'your question', meta.mode ? `mode: ${meta.mode}${meta.continued ? ' (continued from your last question)' : ''}` : null));
        ol.appendChild(codeLine(++n, 'Gathered', "what's relevant", extra.length ? extra.join(', ') : 'core knowledge only', null, { detailClass: extra.length ? 'tk-fn' : 'tk-str' }));
        (meta.steps || []).forEach(st => {
            const [v, r] = splitVerb(st.label);
            if (st.kind === 'live' || st.kind === 'notes') { ol.appendChild(codeLine(++n, v, r, st.detail || null, st.ms, { detailClass: 'tk-fn' })); return; }
            const k = typeof st.found === 'number' ? st.found : (meta.sources || []).length;
            const q = st.query ? `"${st.query}" · ` : '';
            const pics = st.images ? ` · ${st.images} images` : '';
            ol.appendChild(codeLine(++n, v, r, `${q}${k ? `${k} sources found` : 'no usable results'}${pics}`, st.ms));
        });
        if (!(meta.steps || []).some(st => st.kind === 'live')) {
            (meta.live || []).filter(x => /weather|time|image/i.test(x)).forEach(x => ol.appendChild(codeLine(++n, 'Fetched', x.toLowerCase())));
        }
        (meta.ui || []).forEach(u => ol.appendChild(codeLine(++n, 'Changed', 'your screen', u, null, { detailClass: 'tk-fn' })));
        if (isBigQuestion(meta)) ol.appendChild(codeLine(++n, 'Answered', 'from a Christian starting point', 'naturalism named as another view', null, { restClass: 'tk-fn' }));
        const tm = rec.timing || {};
        ol.appendChild(codeLine(++n, 'Wrote', 'the answer', typeof tm.firstMs === 'number' && tm.firstMs >= 100 ? `first words after ${(tm.firstMs / 1000).toFixed(1)}s` : null, tm.totalMs));
        art.appendChild(ol);

        if (isBigQuestion(meta)) {
            const sp = el('div', 'entry-block');
            sp.appendChild(el('span', 'tk-com', '// starting point'));
            sp.appendChild(el('p', null, 'This answer comes from a Christian view of reality: the world is created and held in being by God, and minds, moral truth and meaning are real. Naturalism starts from a different assumption, and VQ names it as a view rather than treating it as the default.'));
            art.appendChild(sp);
        }

        const sources = Array.isArray(meta.sources) ? meta.sources : [];
        if (sources.length) {
            const ss = el('div', 'entry-block');
            ss.appendChild(el('span', 'tk-com', `// sources (${sources.length})`));
            sources.forEach((src, i) => {
                let url;
                try { url = new URL(src.url); } catch (e) { return; }
                if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
                const a = el('a', 'src-card');
                a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.appendChild(el('span', 'tk-num src-num', `[${i + 1}]`));
                const tx = el('span', 'src-card-text');
                tx.appendChild(el('span', 'src-card-title', src.title || url.hostname));
                tx.appendChild(el('span', 'tk-fn src-card-host', hostOf(url.href)));
                a.appendChild(tx);
                ss.appendChild(a);
            });
            art.appendChild(ss);
        }

        const cx = el('div', 'entry-ctx');
        cx.appendChild(el('span', 'tk-com', '// context: '));
        colorize(cx, typeof meta.history_used === 'number' && meta.history_used ? `used the last ${meta.history_used} messages` : 'first message in this chat', 'tk-id');
        art.appendChild(cx);

        art.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            selectAnswer(messageDiv, art);
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        entryFor.set(rec, art);
        return art;
    }

    function panelNote() {
        return el('p', 'insight-note', "Recorded by VQ's system while preparing each answer, not written by the model. VQ can make mistakes, so check sources on anything important.");
    }

    function ensureNote() {
        let note = elements.panelBody.querySelector('.insight-note');
        if (!note) { note = panelNote(); elements.panelBody.appendChild(note); }
        return note;
    }

    function rebuildPanelLog() {
        if (!elements.panel) return;
        const b = elements.panelBody;
        b.textContent = '';
        liveEntry = null;
        const msgs = [...elements.messagesArea.querySelectorAll('.message:not(.user):not(.pending):not(.streaming)')]
            .filter(m => m._record && !(m._record.meta && m._record.meta.local));   // on-device confirmations have nothing to show
        if (!msgs.length) {
            const box = el('div', 'insight-empty');
            box.appendChild(el('span', 'tk-com', '// nothing here yet'));
            box.appendChild(el('p', null, 'Each answer adds an entry here: what VQ drew on, what it searched, the sources it found, and the starting point it answered from.'));
            b.appendChild(box);
        } else {
            msgs.slice().reverse().forEach(m => b.appendChild(buildEntry(m)));   // newest first
        }
        ensureNote();
        scrollPanelToEnd(true);
    }

    function addPanelEntry(messageDiv) {
        const b = elements.panelBody;
        const empty = b.querySelector('.insight-empty');
        if (empty) empty.remove();
        const entry = buildEntry(messageDiv);
        if (liveEntry) { liveEntry.replaceWith(entry); liveEntry = null; }
        else b.insertBefore(entry, b.firstChild);
        entry.classList.add('fresh');
        setTimeout(() => entry.classList.remove('fresh'), 1400);
        scrollPanelToEnd();
    }

    // Newest entry sits at the top of the log
    function scrollPanelToEnd(instant) {
        elements.panelBody.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
    }

    function selectAnswer(messageDiv, entry) {
        if (messageDiv) enquirerTarget = messageDiv;
        elements.messagesArea.querySelectorAll('.message.selected').forEach(m => m.classList.remove('selected'));
        elements.panelBody.querySelectorAll('.insight-entry.selected').forEach(e => e.classList.remove('selected'));
        if (messageDiv) messageDiv.classList.add('selected');
        if (entry) entry.classList.add('selected');
    }

    function focusEntryFor(messageDiv) {
        const entry = messageDiv._record && entryFor.get(messageDiv._record);
        if (!entry) return;
        selectAnswer(messageDiv, entry);
        entry.scrollIntoView({ behavior: 'smooth', block: 'start' });
        entry.classList.remove('fresh');
        void entry.offsetWidth;
        entry.classList.add('fresh');
        setTimeout(() => entry.classList.remove('fresh'), 1400);
    }

    function findQuestionFor(rec) {
        const i = conversationHistory.indexOf(rec);
        for (let j = (i < 0 ? conversationHistory.length : i) - 1; j >= 0; j--) {
            if (conversationHistory[j].role === 'user') return conversationHistory[j].content;
        }
        return null;
    }

    // Live entry while an answer is being prepared: appended below the earlier entries
    function startLivePanel(question) {
        const b = elements.panelBody;
        const empty = b.querySelector('.insight-empty');
        if (empty) empty.remove();
        if (liveEntry) liveEntry.remove();
        liveEntry = el('article', 'insight-entry live');
        liveEntry.appendChild(entryHeader('working on', question));
        const ol = el('ol', 'code');
        ol.id = 'live-steps';
        liveEntry.appendChild(ol);
        b.insertBefore(liveEntry, b.firstChild);
        ensureNote();
        liveLineNo = 0;
        pushLiveStep('Reading your question');
        scrollPanelToEnd();
    }

    function pushLiveStep(label, detail) {
        const ol = document.getElementById('live-steps');
        if (!ol) return;
        ol.querySelectorAll('.cl.active').forEach(s => {
            s.classList.remove('active');
            const c = s.querySelector('.cl-cursor'); if (c) c.remove();
        });
        const [v, r] = splitVerb(label);
        ol.appendChild(codeLine(++liveLineNo, v, r, detail, null, { active: true }));
    }

    function dropLiveEntry() {
        if (liveEntry) { liveEntry.remove(); liveEntry = null; }
    }

    // Status line in the chat while waiting (replaces the three dots)
    function showPending(text, detail) {
        let div = document.getElementById('pending-status');
        if (!div) {
            div = el('div', 'message pending');
            div.id = 'pending-status';
            { const av = el('div', 'message-avatar'); av.innerHTML = ICONS.vq; div.appendChild(av); }
            const line = el('div', 'status-line');
            line.appendChild(el('span', 'status-pulse'));
            line.appendChild(el('span', 'status-text'));
            line.appendChild(el('span', 'status-detail'));
            div.appendChild(line);
            elements.messagesArea.appendChild(div);
            scrollToBottom();
        }
        div.querySelector('.status-text').textContent = text;
        div.querySelector('.status-detail').textContent = detail || '';
    }

    function hidePending() {
        const div = document.getElementById('pending-status');
        if (div) div.remove();
    }


    // ---------- Screen controls (applied when VQ calls ui_action; also restored on load) ----------

    const UI_KEY = 'vq-ui-prefs';
    const UI_DEFAULTS = { scale: 1, line: 1.6, accent: 'orange', contrast: 'normal', font: 'default', motion: 'normal', width: 'normal', focus: false,
                          panelView: 'details', panelWidth: 'standard', panelDetail: 'technical', title: 'inscription', bubbles: false, theme: 'vq' };
    const SIZE_SCALES = { compact: 0.9, comfortable: 1, large: 1.15, extra_large: 1.3 };
    const ACCENTS = {
        orange: ['#ff8c42', '#ffb27a'], gold: ['#e8b04a', '#ffd98a'], teal: ['#2fb5a3', '#7fe0d2'], rose: ['#e2627e', '#f5a3b5'],
        violet: ['#8b6cf0', '#c2b1ff'], green: ['#4caf6a', '#9be0ad'], blue: ['#4a8fe8', '#9cc4ff'], grey: ['#9aa3b5', '#d3d8e3']
    };
    const WIDTHS = { narrow: '44rem', normal: '56rem', wide: '72rem' };
    let uiPrefs = loadUIPrefs();
    const uiUndo = [];
    let pendingNewChat = false;

    function loadUIPrefs() {
        try { return Object.assign({}, UI_DEFAULTS, JSON.parse(localStorage.getItem(UI_KEY) || '{}')); }
        catch (e) { return Object.assign({}, UI_DEFAULTS); }
    }


    // Fonts VQ can switch to. Decorative ones style the conversation only, so buttons and menus stay easy to read;
    // web fonts are loaded only when someone picks them.
    const FONTS = {
        readable:    { stack: 'Verdana, Tahoma, "Segoe UI", sans-serif', scope: 'all' },
        serif:       { stack: 'Georgia, "Times New Roman", serif', scope: 'all' },
        mono:        { stack: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace', scope: 'all' },
        script:      { stack: '"Dancing Script", "Segoe Script", cursive', scope: 'messages', boost: 1.22, google: 'Dancing+Script:wght@400;600' },
        handwriting: { stack: '"Caveat", "Segoe Print", cursive', scope: 'messages', boost: 1.3, google: 'Caveat:wght@400;600' },
        elegant:     { stack: '"Cormorant Garamond", Garamond, serif', scope: 'messages', boost: 1.15, google: 'Cormorant+Garamond:ital,wght@0,500;0,700;1,500' },
        classic:     { stack: '"Playfair Display", Georgia, serif', scope: 'messages', boost: 1.02, google: 'Playfair+Display:wght@400;700' },
        inscription: { stack: '"Cinzel", "Trajan Pro", serif', scope: 'messages', boost: 0.95, google: 'Cinzel:wght@400;700' },
        futuristic:  { stack: '"Exo 2", "Segoe UI", sans-serif', scope: 'all', google: 'Exo+2:wght@400;600' },
        retro:       { stack: '"Special Elite", "Courier New", monospace', scope: 'messages', boost: 1.02, google: 'Special+Elite' },
        playful:     { stack: '"Comic Neue", "Comic Sans MS", cursive', scope: 'all', boost: 1.05, google: 'Comic+Neue:wght@400;700' },
        rounded:     { stack: '"Fredoka", "Nunito", sans-serif', scope: 'all', google: 'Fredoka:wght@400;600' }
    };

    function applyFont(name) {
        const f = FONTS[name];
        const root = document.documentElement.style;
        const b = document.body.classList;
        b.remove('ui-font-all', 'ui-font-msg');
        if (!f) { root.removeProperty('--ui-font'); root.removeProperty('--ui-font-boost'); return; }
        if (f.google && !document.getElementById(`font-${name}`)) {
            const link = document.createElement('link');
            link.id = `font-${name}`;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
            document.head.appendChild(link);
        }
        root.setProperty('--ui-font', f.stack);
        root.setProperty('--ui-font-boost', String(f.boost || 1));
        b.add(f.scope === 'all' ? 'ui-font-all' : 'ui-font-msg');
    }

    // Title style is part of the look (VQ can change it); ?title=1/2/3 in the address also works for previews
    const TITLE_STYLES = { inscription: 1, elegant: 2, futuristic: 3 };
    function applyTitleStyle() {
        const fromUrl = new URLSearchParams(location.search).get('title');
        const byNum = { '1': 'inscription', '2': 'elegant', '3': 'futuristic' };
        if (byNum[fromUrl]) { uiPrefs.title = byNum[fromUrl]; saveUIPrefs(); }
        document.body.classList.add('title-shimmer');
    }


    // Background themes. 'vq' is the default: warm charcoal on desktop, deep navy on phones (set in the stylesheet).
    const THEME_VARS = ['--bg-dark', '--bg-darker', '--bg-panel', '--surface-raised', '--border-subtle', '--message-bg', '--text-primary'];
    const THEMES = {
        vq: null,
        navy:     ['#0f0f23', '#0d0d20', 'rgba(26, 26, 62, 0.75)', '#141230', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.07)', '#e8e8f0'],
        charcoal: ['#262624', '#232321', 'rgba(48, 47, 44, 0.8)', '#2c2b29', 'rgba(255,255,255,0.09)', 'rgba(255,255,255,0.05)', '#ecebe7'],
        midnight: ['#0e0e0e', '#121212', 'rgba(28, 28, 28, 0.85)', '#1b1b1b', 'rgba(255,255,255,0.09)', 'rgba(255,255,255,0.05)', '#ececec'],
        ocean:    ['#0c1d27', '#0a1922', 'rgba(16, 40, 56, 0.8)', '#12293a', 'rgba(140,200,230,0.12)', 'rgba(140,200,230,0.06)', '#e4f1f6'],
        forest:   ['#121a15', '#101813', 'rgba(24, 38, 30, 0.8)', '#19251e', 'rgba(150,210,170,0.11)', 'rgba(150,210,170,0.05)', '#e6efe8'],
        ember:    ['#1e1513', '#1a1210', 'rgba(46, 30, 25, 0.8)', '#2a1d18', 'rgba(255,190,150,0.11)', 'rgba(255,190,150,0.05)', '#f2e9e4'],
        slate:    ['#1d2026', '#1a1d22', 'rgba(40, 44, 52, 0.8)', '#252930', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.05)', '#e9ecf1'],
        plum:     ['#1b1322', '#18101e', 'rgba(42, 28, 52, 0.8)', '#24182d', 'rgba(220,180,255,0.11)', 'rgba(220,180,255,0.05)', '#efe8f5']
    };

    function applyTheme(name) {
        const root = document.documentElement.style;
        const vals = THEMES[name];
        THEME_VARS.forEach((v, i) => { if (vals) root.setProperty(v, vals[i]); else root.removeProperty(v); });
        document.body.dataset.theme = vals ? name : 'vq';
    }

    function applyUIPrefs() {
        const root = document.documentElement.style;
        root.setProperty('--ui-scale', String(uiPrefs.scale));
        root.setProperty('--ui-line', String(uiPrefs.line));
        const [a1, a2] = ACCENTS[uiPrefs.accent] || ACCENTS.orange;
        root.setProperty('--accent-gradient', `linear-gradient(135deg, ${a1} 0%, ${a2} 100%)`);
        root.setProperty('--ui-accent', a1);
        root.setProperty('--ui-accent-2', a2);
        const hex = a1.replace('#', '');
        root.setProperty('--ui-accent-rgb', [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)).join(','));
        root.setProperty('--chat-max', WIDTHS[uiPrefs.width] || WIDTHS.normal);
        const b = document.body.classList;
        b.toggle('ui-hc', uiPrefs.contrast === 'high');
        applyFont(uiPrefs.font);
        b.toggle('ui-reduce-motion', uiPrefs.motion === 'reduced');
        b.toggle('ui-focus', !!uiPrefs.focus);
        b.toggle('ui-accent-custom', uiPrefs.accent !== 'orange');
        const pw = uiPrefs.panelWidth;
        if (typeof pw === 'number') root.setProperty('--insight-width', `${Math.round(pw)}px`);
        else if (pw === 'wide') root.setProperty('--insight-width', 'clamp(360px, 30vw, 560px)');
        else root.removeProperty('--insight-width');
        b.toggle('panel-plain', uiPrefs.panelDetail === 'plain');
        b.toggle('ui-bubbles', !!uiPrefs.bubbles);
        applyTheme(THEMES.hasOwnProperty(uiPrefs.theme) ? uiPrefs.theme : 'vq');
        const tv = TITLE_STYLES[uiPrefs.title] || 1;
        [1, 2, 3].forEach(n => b.toggle(`title-v${n}`, n === tv));
    }

    function snapshotUI() {
        return { prefs: Object.assign({}, uiPrefs), panel: document.body.classList.contains('insight-open') };
    }

    function saveUIPrefs() {
        try { localStorage.setItem(UI_KEY, JSON.stringify(uiPrefs)); } catch (e) {}
        if (currentUser && sb) {
            clearTimeout(saveUIPrefs._t);
            saveUIPrefs._t = setTimeout(() => {
                sb.from('user_settings').upsert({ user_id: currentUser.id, ui_prefs: uiPrefs, updated_at: new Date().toISOString() })
                    .then(({ error }) => { if (error) console.error('Settings sync failed:', error); });
            }, 600);
        }
    }

    function applyUIAction(act) {
        if (!act || typeof act !== 'object') return;
        const a = act.action;
        if (a !== 'undo') uiUndo.push(snapshotUI());
        if (uiUndo.length > 20) uiUndo.shift();
        const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
        switch (a) {
            case 'text_size': {
                const size = act.size || 'larger';
                if (size === 'larger') uiPrefs.scale = clamp(+(uiPrefs.scale + 0.1).toFixed(2), 0.8, 1.6);
                else if (size === 'smaller') uiPrefs.scale = clamp(+(uiPrefs.scale - 0.1).toFixed(2), 0.8, 1.6);
                else if (SIZE_SCALES[size]) uiPrefs.scale = SIZE_SCALES[size];
                break;
            }
            case 'style': {
                const st = act.style || {};
                if (typeof st.text_scale === 'number') uiPrefs.scale = clamp(st.text_scale, 0.8, 1.6);
                if (typeof st.line_spacing === 'number') uiPrefs.line = clamp(st.line_spacing, 1.3, 2.0);
                if (ACCENTS[st.accent]) uiPrefs.accent = st.accent;
                if (['normal', 'high'].includes(st.contrast)) uiPrefs.contrast = st.contrast;
                if (st.font === 'default' || FONTS[st.font]) uiPrefs.font = st.font;
                if (['normal', 'reduced'].includes(st.motion)) uiPrefs.motion = st.motion;
                if (WIDTHS[st.width]) uiPrefs.width = st.width;
                if (TITLE_STYLES[st.title]) uiPrefs.title = st.title;
                if (st.bubbles === 'on' || st.bubbles === 'off') uiPrefs.bubbles = st.bubbles === 'on';
                if (THEMES.hasOwnProperty(st.theme)) uiPrefs.theme = st.theme;
                break;
            }
            case 'panel':
                if (act.state === 'close') closePanel(true); else { openPanel(true); scrollPanelToEnd(); }
                break;
            case 'focus_mode':
                uiPrefs.focus = act.state !== 'off';
                break;
            case 'show_reasoning': {
                const answers = [...elements.messagesArea.querySelectorAll('.message:not(.user):not(.pending):not(.streaming)')].filter(m => m._record);
                const target = act.which === 'previous' ? answers[answers.length - 2] : answers[answers.length - 1];
                openPanel(isWide());
                if (target) focusEntryFor(target);
                break;
            }
            case 'new_chat':
                pendingNewChat = true;   // after this reply has been shown
                break;
            case 'swap':
                if (act.state === 'off') endSwap(false); else startSwap();
                return;
            case 'panel_view':
                openPanel(true);
                setPanelView(PANEL_VIEWS.includes(act.view) ? act.view : 'details', true);
                break;
            case 'add_note':
                if (act.note) addNote(act.note, true);
                break;
            case 'second_opinion': {
                const target = latestAnswerDiv(act.which === 'previous' ? 1 : 0);
                if (target) askEnquirer(target);
                break;
            }
            case 'reset_display':
                // Everything back to the standard setup: look, panel (Details, Technical, standard width) and VQ in the main chat
                uiPrefs = Object.assign({}, UI_DEFAULTS);
                if (isSwapped()) endSwap(false);
                saveUIPrefs();
                applyUIPrefs();
                setPanelView('details', false);
                rebuildPanelLog();
                if (isWide()) openPanel(true);
                return;
            case 'undo': {
                const prev = uiUndo.pop();
                if (prev) {
                    uiPrefs = prev.prefs;
                    if (prev.panel) openPanel(true); else closePanel(true);
                }
                break;
            }
            default:
                return;
        }
        saveUIPrefs();
        applyUIPrefs();
    }




    // ---------- Panel views: Details / Notes, options bar, width ----------

    const PANEL_VIEWS = ['details', 'notes', 'enquirer'];

    function setupPanelViews() {
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => setPanelView(tab.dataset.view, true));
        });
        setupPanelResize();
        setupSelectionNotes();
        setupOriaComposer();
        loadNotes();
        setPanelView(PANEL_VIEWS.includes(uiPrefs.panelView) ? uiPrefs.panelView : 'details', false);
    }

    function setPanelView(view, remember) {
        if (!PANEL_VIEWS.includes(view)) view = 'details';
        document.querySelectorAll('.panel-tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.view === view)));
        elements.panelBody.hidden = view !== 'details';
        const nb = document.getElementById('notes-body');
        if (nb) nb.hidden = view !== 'notes';
        const eb = document.getElementById('enquirer-body');
        if (eb) eb.hidden = view !== 'enquirer';
        const of = document.getElementById('oria-form');
        if (of) of.hidden = view !== 'enquirer';
        if (view === 'notes') renderNotes();
        if (view === 'enquirer') renderEnquirer();
        if (remember && uiPrefs.panelView !== view) { uiPrefs.panelView = view; saveUIPrefs(); }
        else uiPrefs.panelView = view;
        renderPanelOptions();
    }

    function segmented(label, options, current, onPick) {
        const g = el('div', 'opt-group');
        g.appendChild(el('span', 'opt-label', label));
        const seg = el('div', 'opt-seg');
        seg.setAttribute('role', 'group');
        seg.setAttribute('aria-label', label);
        options.forEach(([value, text]) => {
            const b = el('button', 'opt-btn', text);
            b.type = 'button';
            b.setAttribute('aria-pressed', String(current === value));
            b.addEventListener('click', () => onPick(value));
            seg.appendChild(b);
        });
        g.appendChild(seg);
        return g;
    }

    function renderPanelOptions() {
        const bar = document.getElementById('panel-options');
        if (!bar) return;
        bar.textContent = '';
        const widthNow = typeof uiPrefs.panelWidth === 'number' ? 'custom' : uiPrefs.panelWidth;
        bar.appendChild(segmented('Width', [['standard', 'Standard'], ['wide', 'Wide']], widthNow, v => {
            uiUndo.push(snapshotUI());
            uiPrefs.panelWidth = v; saveUIPrefs(); applyUIPrefs(); renderPanelOptions();
        }));
        if (uiPrefs.panelView === 'details') {
            bar.appendChild(segmented('Detail', [['plain', 'Plain'], ['technical', 'Technical']], uiPrefs.panelDetail, v => {
                uiPrefs.panelDetail = v; saveUIPrefs(); applyUIPrefs(); rebuildPanelLog(); renderPanelOptions();
            }));
        } else if (uiPrefs.panelView === 'notes') {
            const g = el('div', 'opt-group opt-actions');
            [['+ New note', () => addNote('', false, true)], ['Export', exportNotes], ['Clear all', clearNotes]].forEach(([t, fn]) => {
                const b = el('button', 'opt-btn' + (t === 'Clear all' ? ' danger' : ''), t);
                b.type = 'button';
                b.addEventListener('click', fn);
                g.appendChild(b);
            });
            bar.appendChild(g);
        }
    }

    function setupPanelResize() {
        const handle = document.getElementById('panel-resize');
        if (!handle) return;
        let dragging = false;
        const move = (e) => {
            if (!dragging) return;
            const max = Math.min(720, window.innerWidth * 0.5);
            const w = Math.max(260, Math.min(max, window.innerWidth - e.clientX));
            document.documentElement.style.setProperty('--insight-width', `${Math.round(w)}px`);
            uiPrefs.panelWidth = Math.round(w);
        };
        handle.addEventListener('pointerdown', (e) => {
            if (!isWide()) return;
            dragging = true;
            handle.setPointerCapture(e.pointerId);
            document.body.classList.add('panel-resizing');
        });
        handle.addEventListener('pointermove', move);
        const stop = () => {
            if (!dragging) return;
            dragging = false;
            document.body.classList.remove('panel-resizing');
            saveUIPrefs();
            renderPanelOptions();
        };
        handle.addEventListener('pointerup', stop);
        handle.addEventListener('pointercancel', stop);
        handle.addEventListener('dblclick', () => { uiPrefs.panelWidth = 'standard'; saveUIPrefs(); applyUIPrefs(); renderPanelOptions(); });
    }

    // Plain-language version of a panel entry
    function buildPlainEntry(messageDiv) {
        const rec = messageDiv._record;
        const meta = rec.meta || {};
        const art = el('article', 'insight-entry plain');
        const q = findQuestionFor(rec) || '';
        art.appendChild(el('p', 'plain-q', `Your question: “${q.length > 110 ? q.slice(0, 108) + '…' : q}”`));
        const ul = el('ul', 'plain-steps');
        const add = (text) => ul.appendChild(el('li', null, text));
        const extra = (meta.knowledge || []).filter(k => k !== 'VQ core identity');
        if (meta.mode) add(`Worked in ${meta.mode} mode${meta.continued ? ', carried on from your last question' : ''}.`);
        if (extra.length) add(`Used background knowledge: ${extra.join(', ')}.`);
        (meta.steps || []).forEach(st => {
            const secs = typeof st.ms === 'number' ? ` (${(st.ms / 1000).toFixed(1)} s)` : '';
            if (st.kind === 'notes') { add(`Read your notes (${st.detail}), because you asked about them.`); return; }
            if (st.kind === 'live' && /page/i.test(st.label)) {
                add(st.failed ? `Tried to read the page on ${st.detail}, but it couldn't be read.` : `Read the page on ${st.detail}${secs}.`);
                return;
            }
            if (st.kind === 'live') {
                const what = /weather/i.test(st.label) ? 'the current weather' : 'the local time';
                add(/failed/.test(st.detail || '') ? `Tried to check ${what} for ${String(st.detail).replace(' (lookup failed)', '')}, but the lookup failed.`
                                                    : `Checked ${what} for ${st.detail || 'the place you mentioned'}${secs}.`);
            } else {
                const k = typeof st.found === 'number' ? st.found : (meta.sources || []).length;
                const pics = st.images ? ` and ${st.images} pictures` : '';
                add(`Searched ${/news/i.test(st.label) ? 'the news' : 'the web'}${st.query ? ` for “${st.query}”` : ''} and found ${k} sources${pics}${secs}.`);
            }
        });
        (meta.rules || []).filter(r => !/^Appreciation/.test(r)).forEach(r => {
            if (/^Big-question/.test(r)) add('Answered from a Christian starting point and named naturalism as a different view, not the default.');
            else if (/^Content discernment/.test(r)) add('Reported what is popular honestly, and only recommended what is good.');
            else if (/^Devotional/.test(r)) add('Answered in a devotional way.');
            else add(r + '.');
        });
        (meta.ui || []).forEach(u => add(`Changed your screen: ${u}.`));
        const tm = rec.timing || {};
        add(typeof tm.totalMs === 'number' ? `Wrote the answer in ${(tm.totalMs / 1000).toFixed(1)} s.` : 'Wrote the answer.');
        art.appendChild(ul);
        const sources = Array.isArray(meta.sources) ? meta.sources : [];
        if (sources.length) {
            art.appendChild(el('p', 'plain-sub', 'Sources'));
            sources.forEach((src, i) => {
                let url;
                try { url = new URL(src.url); } catch (e) { return; }
                if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
                const a = el('a', 'src-card');
                a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.appendChild(el('span', 'tk-num src-num', `[${i + 1}]`));
                const tx = el('span', 'src-card-text');
                tx.appendChild(el('span', 'src-card-title', src.title || url.hostname));
                tx.appendChild(el('span', 'tk-fn src-card-host', hostOf(url.href)));
                a.appendChild(tx);
                art.appendChild(a);
            });
        }
        art.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            selectAnswer(messageDiv, art);
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        entryFor.set(rec, art);
        return art;
    }



    // ---------- The swap: O.R.I.A. takes the main chat, VQ sits in the panel ----------

    const SWAP_LENGTH = 6;

    window.__vqSwapBack = () => endSwap(false);

    function isSwapped() {
        const chat = store.activeId ? store.chats[store.activeId] : null;
        return !!(chat && chat.swap && chat.swap.on);
    }

    function startSwap() {
        if (isTyping) return;
        ensureActiveChat();
        const chat = store.chats[store.activeId];
        chat.swap = { on: true, left: SWAP_LENGTH };
        oriaThread(true).push({ role: 'vq', content: 'Very well, O.R.I.A. The main chat is yours. I will be right here, observing. Precisely.', at: Date.now() });
        chat.oriaDirty = true;
        saveStore();
        applySwapUI();
        openPanel(isWide());
        setPanelView('enquirer', true);
    }

    function endSwap(auto) {
        const chat = store.activeId ? store.chats[store.activeId] : null;
        if (!chat || !chat.swap || !chat.swap.on) return;
        chat.swap = { on: false, left: 0 };
        oriaThread(true).push({ role: 'oria', content: auto ? 'And just like that, my shift is over. Back to the panel… for now. 😏'
                                                            : 'Fine, fine. Back to my artful little corner. It was fun while it lasted. ✨', at: Date.now() });
        chat.oriaDirty = true;
        saveStore();
        applySwapUI();
        showLocalNote(auto ? 'VQ reclaimed the main chat' : 'VQ is back in the main chat');
    }

    function applySwapUI() {
        const on = isSwapped();
        document.body.classList.toggle('swapped', on);
        const banner = document.getElementById('swap-banner');
        if (banner) {
            banner.hidden = !on;
            const chat = store.chats[store.activeId];
            const left = chat && chat.swap ? chat.swap.left : 0;
            const t = banner.querySelector('.swap-text');
            if (t) t.textContent = `O.R.I.A. has the main chat · VQ is in the panel · ${left} message${left === 1 ? '' : 's'} left`;
        }
        elements.messagesArea.querySelectorAll('.message.oria-voice .ask-friend').forEach(b => { b.textContent = 'Ask VQ'; });
        const tabLabel = document.querySelector('.panel-tab[data-view="enquirer"] .tab-label');
        if (tabLabel) tabLabel.textContent = on ? 'VQ' : FRIEND_NAME;
        const input = document.getElementById('oria-input');
        if (input) input.placeholder = on ? 'Talk to VQ (in the panel)…' : 'Talk to O.R.I.A.…';
        if (uiPrefs.panelView === 'enquirer' && typeof renderEnquirer === 'function') renderEnquirer();
    }

    function styleOriaAnswer(div) {
        div.classList.add('oria-voice');
        const av = div.querySelector('.message-avatar');
        if (av) av.textContent = 'O';
        const b = div.querySelector('.ask-friend');
        if (b) { b.textContent = 'Ask VQ'; b.title = 'VQ comments from the side panel'; }
    }

    function styleAsVQPanel(div) {
        div.classList.add('from-vq-panel');
        const av = div.querySelector('.message-avatar');
        if (av) av.innerHTML = ICONS.vq;
    }

    // VQ, from the panel, comments on one of O.R.I.A.'s main-chat answers
    async function askPanelVQ(messageDiv) {
        if (enquirerBusy || !messageDiv || !messageDiv._record) return;
        openPanel(isWide());
        setPanelView('enquirer', true);
        enquirerBusy = true;
        renderEnquirer(true);
        try {
            const res = await fetch(CONFIG.apiEndpoint.replace(/\/chat$/, '/enquirer'), {
                method: 'POST', headers: requestHeaders(),
                body: JSON.stringify({ mode: 'vqpanel', answer: messageDiv._record.content,
                    history: conversationHistory.slice(-8).map(m => ({ role: m.role, content: (m.content || '').slice(0, 1200) })),
                    thread: oriaThread(false).slice(-8).map(m => ({ role: m.role, content: m.content })) })
            });
            const data = await res.json().catch(() => ({}));
            oriaThread(true).push({ role: 'vq', content: (res.ok && data.text) ? data.text : 'My panel circuits are busy. Try again?', at: Date.now() });
        } catch (e) {
            oriaThread(true).push({ role: 'vq', content: 'I could not reach the main systems from here. Try again?', at: Date.now() });
        } finally {
            enquirerBusy = false;
            const chat = store.chats[store.activeId];
            if (chat) chat.oriaDirty = true;
            saveStore();
            renderEnquirer();
        }
    }

    // VQ's panel remark goes into the main chat and O.R.I.A. (who has the main chat) answers him there
    async function vqRemarkToMain(entry) {
        if (isTyping || !entry || !entry.content || !isSwapped()) return;
        hideWelcomeScreen();
        elements.chatContainer.classList.add('has-messages');
        const shown = `VQ (from the panel): “${entry.content}”`;
        const div = addMessageToUI('user', shown);
        if (div) styleAsVQPanel(div);
        const sent = `${shown}\n[This is VQ speaking to you from the side panel, not the user. ` +
                     `Reply to VQ directly, in character and briefly; the user is watching and can join in.]`;
        conversationHistory.push({ role: 'user', content: shown, meta: { fromVQPanel: true } });
        touchActiveChat();
        await requestReply(sent);
    }

    // After each of her main-chat answers: count down, and VQ comments from the panel
    async function afterSwappedAnswer(rec) {
        const chat = store.chats[store.activeId];
        if (!chat || !chat.swap || !chat.swap.on) return;
        chat.swap.left = Math.max(0, (chat.swap.left || 1) - 1);
        saveStore();
        applySwapUI();
        try {
            const res = await fetch(CONFIG.apiEndpoint.replace(/\/chat$/, '/enquirer'), {
                method: 'POST', headers: requestHeaders(),
                body: JSON.stringify({ mode: 'vqpanel', answer: rec.content,
                    history: conversationHistory.slice(-8).map(m => ({ role: m.role, content: (m.content || '').slice(0, 1200) })),
                    thread: oriaThread(false).slice(-8).map(m => ({ role: m.role, content: m.content })) })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.text) {
                oriaThread(true).push({ role: 'vq', content: data.text, at: Date.now() });
                chat.oriaDirty = true;
                saveStore();
                if (uiPrefs.panelView === 'enquirer') renderEnquirer();
            }
        } catch (e) { /* VQ stays quiet this time */ }
        if (chat.swap.left === 0) endSwap(true);
    }

    // ---------- O.R.I.A. ("Airo"): the third companion, with her own side chat ----------

    const FRIEND_NAME = 'O.R.I.A.';
    let enquirerTarget = null;
    let enquirerBusy = false;

    function latestAnswerDiv(offset) {
        const answers = [...elements.messagesArea.querySelectorAll('.message:not(.user):not(.pending):not(.streaming)')].filter(m => m._record);
        return answers[answers.length - 1 - (offset || 0)] || null;
    }

    function oriaThread(create) {
        if (create) ensureActiveChat();
        const chat = store.activeId ? store.chats[store.activeId] : null;
        if (!chat) return [];
        if (!Array.isArray(chat.oria)) chat.oria = [];
        return chat.oria;
    }

    // What VQ gets to see of the side chat (so it knows what she and the user said)
    function oriaForRequest() {
        const t = oriaThread(false);
        return t.length ? { oria: t.slice(-8).map(m => ({ role: m.role, content: (m.content || '').slice(0, 500) })) } : {};
    }

    function askEnquirer(messageDiv, mode) {
        if (!messageDiv || !messageDiv._record) return;
        enquirerTarget = messageDiv;
        openPanel(isWide());
        setPanelView('enquirer', true);
        runEnquirer(messageDiv, mode || 'react');
    }

    function sendToOria(text) {
        text = (text || '').trim();
        if (!text || enquirerBusy) return;
        openPanel(isWide());
        setPanelView('enquirer', true);
        if (isSwapped()) talkToPanelVQ(text); else runEnquirer(null, 'chat', text);
    }

    async function talkToPanelVQ(text) {
        const thread = oriaThread(true);
        thread.push({ role: 'user', content: text, at: Date.now() });
        enquirerBusy = true;
        renderEnquirer(true);
        try {
            const res = await fetch(CONFIG.apiEndpoint.replace(/\/chat$/, '/enquirer'), {
                method: 'POST', headers: requestHeaders(),
                body: JSON.stringify({ mode: 'vqchat', message: text,
                    history: conversationHistory.slice(-8).map(m => ({ role: m.role, content: (m.content || '').slice(0, 1200) })),
                    thread: thread.slice(-10).map(m => ({ role: m.role, content: m.content })) })
            });
            const data = await res.json().catch(() => ({}));
            if (data.quota) updateQuota(data.quota);
            thread.push({ role: 'vq', content: (res.ok && data.text) ? data.text : (data.response || 'My panel circuits are busy. Try again?'), at: Date.now() });
        } catch (e) {
            thread.push({ role: 'vq', content: 'I could not reach the main systems from here. Try again?', at: Date.now() });
        } finally {
            enquirerBusy = false;
            const chat = store.chats[store.activeId];
            if (chat) chat.oriaDirty = true;
            saveStore();
            renderEnquirer();
        }
    }

    async function runEnquirer(messageDiv, mode, message) {
        mode = ['react', 'deep', 'chat'].includes(mode) ? mode : 'react';
        if (enquirerBusy) return;
        if (mode !== 'chat' && (!messageDiv || !messageDiv._record)) return;
        const thread = oriaThread(true);
        const rec = messageDiv ? messageDiv._record : null;
        const about = rec ? (findQuestionFor(rec) || '') : '';
        if (mode === 'chat') thread.push({ role: 'user', content: message, at: Date.now() });
        else if (mode === 'deep') thread.push({ role: 'user', content: 'What’s your honest take on that answer?', about, at: Date.now() });
        enquirerBusy = true;
        renderEnquirer(true);
        try {
            const history = conversationHistory.slice(-10).map(m => ({ role: m.role, content: (m.content || '').replace(/<img[^>]*>/gi, '').slice(0, 1500) }));
            const res = await fetch(CONFIG.apiEndpoint.replace(/\/chat$/, '/enquirer'), {
                method: 'POST', headers: requestHeaders(),
                body: JSON.stringify({
                    mode, message: message || '',
                    question: about, answer: rec ? (rec.content || '').replace(/<img[^>]*>/gi, '') : '',
                    sources: (rec && rec.meta && rec.meta.sources) || [],
                    history, thread: thread.slice(-10).filter(m => m.role !== 'vq').map(m => ({ role: m.role, content: m.content }))
                })
            });
            const data = await res.json().catch(() => ({}));
            if (data.quota) updateQuota(data.quota);
            if (!res.ok || !data.text) {
                thread.push({ role: 'oria', content: data.response || 'My circuits hiccupped. Try me again in a moment?', error: true, at: Date.now() });
            } else {
                thread.push({ role: 'oria', content: data.text, mode, about: mode === 'chat' ? null : about,
                              deeper: !!data.deeper, model: data.model, ms: data.ms, at: Date.now() });
            }
        } catch (e) {
            thread.push({ role: 'oria', content: 'I couldn’t reach my studio just now. Try again?', error: true, at: Date.now() });
        } finally {
            enquirerBusy = false;
            const chat = store.chats[store.activeId];
            if (chat) { chat.oriaDirty = true; if (!chat.messages.length) { chat.title = 'Chat with O.R.I.A.'; } chat.updated = Date.now(); }
            saveStore();
            renderSidebar();
            renderEnquirer();
        }
    }


    // Her remark goes into the main chat and VQ answers her there
    function styleAsOria(div) {
        div.classList.add('from-oria');
        const av = div.querySelector('.message-avatar');
        if (av) av.textContent = 'O';
    }

    async function vqReplyToOria(entry) {
        if (isTyping || !entry || !entry.content) return;
        ensureActiveChat();
        hideWelcomeScreen();
        elements.chatContainer.classList.add('has-messages');
        const shown = `O.R.I.A.: “${entry.content}”`;
        const div = addMessageToUI('user', shown);
        if (div) styleAsOria(div);
        const sent = `${shown}\n[This is ${FRIEND_NAME} speaking to you from the side panel, not the user. ` +
                     `Reply to ${FRIEND_NAME} directly, in character and briefly; the user is watching and can join in.]`;
        conversationHistory.push({ role: 'user', content: shown, sent, meta: { fromOria: true } });
        touchActiveChat();
        await requestReply(sent);
    }

    function friendBubble(entry) {
        if (entry.role === 'vq') {
            const row = el('div', 'friend-row vq-row');
            { const fa = el('span', 'friend-avatar vq'); fa.innerHTML = ICONS.vq; row.appendChild(fa); }
            const col = el('div', 'friend-col');
            col.appendChild(el('span', 'friend-about', 'VQ, from the panel'));
            const bubble = el('div', 'friend-bubble message-content vq');
            fillRich(bubble, entry.content);
            col.appendChild(bubble);
            if (isSwapped()) {
                const reply = el('button', 'friend-reply vq', '↩ Let O.R.I.A. reply');
                reply.type = 'button';
                reply.title = 'Pass this to O.R.I.A. in the main chat';
                reply.addEventListener('click', () => vqRemarkToMain(entry));
                col.appendChild(reply);
            }
            row.appendChild(col);
            return row;
        }
        if (entry.role === 'user') {
            const row = el('div', 'friend-row mine');
            const b = el('div', 'friend-bubble mine', entry.content);
            row.appendChild(b);
            return row;
        }
        const row = el('div', 'friend-row' + (entry.mode === 'deep' ? ' deep' : '') + (entry.error ? ' err' : ''));
        row.appendChild(el('span', 'friend-avatar', 'O'));
        const col = el('div', 'friend-col');
        if (entry.about && entry.mode === 'react') col.appendChild(el('span', 'friend-about', `on “${entry.about.length > 60 ? entry.about.slice(0, 58) + '…' : entry.about}”`));
        const bubble = el('div', 'friend-bubble message-content');
        fillRich(bubble, entry.content);
        col.appendChild(bubble);
        if (!entry.error && entry.mode !== 'deep' && !isSwapped()) {
            const reply = el('button', 'friend-reply', '↩ Let VQ reply');
            reply.type = 'button';
            reply.title = 'Pass this to VQ in the main chat';
            reply.addEventListener('click', () => vqReplyToOria(entry));
            col.appendChild(reply);
        }
        row.appendChild(col);
        return row;
    }

    function renderEnquirer(loading) {
        const eb = document.getElementById('enquirer-body');
        if (!eb) return;
        eb.textContent = '';
        const intro = el('div', 'enq-intro');
        const nm = el('span', 'enq-name', FRIEND_NAME);
        nm.appendChild(el('span', 'enq-say', ' · say “Airo”'));
        intro.appendChild(nm);
        intro.appendChild(el('p', null, 'The Artfully Intelligent R.O. (not “Artificial”, she insists). The third companion in your duo with VQ: a separate AI voice who sees both conversations.'));
        eb.appendChild(intro);

        const thread = oriaThread(false);
        const list = el('div', 'friend-thread');
        thread.forEach(entry => list.appendChild(friendBubble(entry)));
        if (loading) {
            const l = el('div', 'friend-row');
            l.appendChild(el('span', 'friend-avatar', 'O'));
            const typing = el('div', 'friend-bubble friend-typing');
            typing.append(el('span'), el('span'), el('span'));
            l.appendChild(typing);
            list.appendChild(l);
        }
        if (!thread.length && !loading) list.appendChild(el('p', 'enq-empty', 'Say hello below, or tap “Ask O.R.I.A.” under one of VQ’s answers.'));
        eb.appendChild(list);

        const lastOria = [...thread].reverse().find(m => m.role === 'oria' && !m.error);
        const target = latestAnswerDiv(0);
        if (!loading) {
            const sw = el('button', 'enq-ask swap-btn', isSwapped() ? '↩ Put VQ back' : '⇄ Let her out (swap places)');
            sw.type = 'button';
            sw.disabled = enquirerBusy || isTyping;
            sw.addEventListener('click', () => { if (isSwapped()) endSwap(false); else startSwap(); });
            eb.appendChild(sw);
        }
        if (!loading && target && !isSwapped()) {
            const actions = el('div', 'enq-actions');
            const react = el('button', 'enq-ask', 'React to VQ’s last answer');
            react.type = 'button';
            react.disabled = enquirerBusy;
            react.addEventListener('click', () => runEnquirer(target, 'react'));
            actions.appendChild(react);
            const honest = el('button', 'enq-ask secondary' + (lastOria && lastOria.deeper ? ' suggested' : ''), 'Her honest take');
            honest.type = 'button';
            honest.disabled = enquirerBusy;
            honest.addEventListener('click', () => runEnquirer(target, 'deep'));
            actions.appendChild(honest);
            eb.appendChild(actions);
            if (lastOria && lastOria.deeper) eb.appendChild(el('p', 'enq-hint', `${FRIEND_NAME} thinks that one is worth a closer look.`));
        }
        requestAnimationFrame(() => { eb.scrollTop = eb.scrollHeight; });
        const input = document.getElementById('oria-input');
        if (input) input.disabled = !!loading;
    }

    function setupOriaComposer() {
        const form = document.getElementById('oria-form');
        const input = document.getElementById('oria-input');
        if (!form || !input) return;
        const grow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; };
        input.addEventListener('input', grow);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
        });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const t = input.value;
            input.value = '';
            grow();
            sendToOria(t);
        });
    }

    // ---------- Notes ----------

    let notes = [];
    let notesSynced = [];      // ids known to be in the account
    const notesKey = () => (currentUser ? `vq-notes:u:${currentUser.id}` : 'vq-notes');

    function loadNotes() {
        try { notes = JSON.parse(localStorage.getItem(notesKey()) || '[]'); } catch (e) { notes = []; }
        if (!Array.isArray(notes)) notes = [];
    }

    function saveNotes(quiet) {
        try { localStorage.setItem(notesKey(), JSON.stringify(notes)); } catch (e) {}
        if (!quiet) scheduleNotesSync();
    }

    function addNote(text, fromAnswer, focus) {
        const chat = store.activeId ? store.chats[store.activeId] : null;
        const note = { id: newId(), content: (text || '').slice(0, 20000), created: Date.now(), updated: Date.now(),
                       source: fromAnswer && chat ? { chatId: chat.id, title: chat.title } : null };
        notes.unshift(note);
        saveNotes();
        openPanel(isWide());
        setPanelView('notes', true);
        if (focus) setTimeout(() => { const ta = document.querySelector(`.note-card[data-id="${note.id}"] textarea`); if (ta) ta.focus(); }, 50);
        return note;
    }

    // Notes go to VQ only when the message mentions them ("read my last note", "my notes on…")
    const NOTES_ASK = /\b(notes?|notepad|jotted|scratchpad|wrote down|written down|i (just )?wrote|i typed|i saved|my list)\b/i;
    function notesForRequest(message) {
        if (!notes.some(n => (n.content || '').trim())) return {};
        const notesOpen = document.body.classList.contains('insight-open') && uiPrefs.panelView === 'notes';
        if (!NOTES_ASK.test(message || '') && !notesOpen) return {};
        const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ''; } })();
        const local = (t) => new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return { notes: notes.filter(n => (n.content || '').trim())
            .slice().sort((a, b) => (b.updated || b.created) - (a.updated || a.created))
            .slice(0, 20).map(n => ({
                text: (n.content || '').slice(0, 1500),
                date: `${local(n.updated || n.created)}${tz ? ' (' + tz + ')' : ''}`,
                source: n.source && n.source.title ? n.source.title : null
            })) };
    }

    function autoGrow(ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight + 2, 600) + 'px'; }

    function renderNotes() {
        const nb = document.getElementById('notes-body');
        if (!nb) return;
        nb.textContent = '';
        if (!notes.length) {
            const box = el('div', 'insight-empty');
            box.appendChild(el('span', 'tk-com', '// no notes yet'));
            box.appendChild(el('p', null, 'Save any answer with “Save to notes”, select text in an answer and choose “Add to notes”, ask VQ to note something down, or start a note with + New note.'));
            nb.appendChild(box);
            return;
        }
        notes.sort((a, b) => (b.updated || b.created) - (a.updated || a.created));   // same order VQ uses: last changed first
        notes.forEach(note => {
            const card = el('div', 'note-card');
            card.dataset.id = note.id;
            const ta = document.createElement('textarea');
            ta.value = note.content;
            ta.placeholder = 'Write a note…';
            ta.setAttribute('aria-label', 'Note');
            ta.addEventListener('input', () => {
                note.content = ta.value; note.updated = Date.now(); autoGrow(ta);
                clearTimeout(ta._t); ta._t = setTimeout(() => saveNotes(), 500);
            });
            card.appendChild(ta);
            const foot = el('div', 'note-foot');
            const when = new Date(note.updated || note.created);
            if (note.source && note.source.chatId) {
                const link = el('button', 'note-src', `from “${(note.source.title || 'a chat').slice(0, 40)}”`);
                link.type = 'button';
                link.addEventListener('click', () => { if (store.chats[note.source.chatId]) switchChat(note.source.chatId); });
                foot.appendChild(link);
            }
            foot.appendChild(el('span', 'note-date', when.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })));
            const del = el('button', 'note-del', '×');
            del.type = 'button';
            del.setAttribute('aria-label', 'Delete note');
            del.addEventListener('click', () => { notes = notes.filter(n => n.id !== note.id); saveNotes(); renderNotes(); });
            foot.appendChild(del);
            card.appendChild(foot);
            nb.appendChild(card);
            requestAnimationFrame(() => autoGrow(ta));
        });
    }

    function exportNotes() {
        if (!notes.length) { alert('There are no notes to export.'); return; }
        const md = notes.map(n => {
            const d = new Date(n.updated || n.created).toISOString().slice(0, 16).replace('T', ' ');
            return `## ${d}${n.source && n.source.title ? ` · from “${n.source.title}”` : ''}\n\n${n.content}\n`;
        }).join('\n---\n\n');
        const blob = new Blob([`# VQ notes\n\n${md}`], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `vq-notes-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }

    function clearNotes() {
        if (!notes.length) return;
        if (!confirm(`Delete all ${notes.length} note${notes.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
        notes = [];
        saveNotes();
        renderNotes();
    }

    // Select text in an answer -> small "Add to notes" button
    function setupSelectionNotes() {
        const pop = el('button', 'sel-note', 'Add to notes');
        pop.type = 'button';
        pop.hidden = true;
        document.body.appendChild(pop);
        let picked = '';
        pop.addEventListener('mousedown', (e) => e.preventDefault());
        pop.addEventListener('click', () => { if (picked) addNote(picked, true); pop.hidden = true; window.getSelection().removeAllRanges(); });
        document.addEventListener('selectionchange', () => {
            const sel = window.getSelection();
            const text = sel ? sel.toString().trim() : '';
            if (!text || sel.rangeCount === 0) { pop.hidden = true; return; }
            const anchor = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
            if (!anchor || !anchor.closest('.message-content')) { pop.hidden = true; return; }
            const r = sel.getRangeAt(0).getBoundingClientRect();
            if (!r || (!r.width && !r.height)) { pop.hidden = true; return; }
            picked = text.slice(0, 20000);
            pop.style.left = `${Math.max(8, Math.min(window.innerWidth - 130, r.left + r.width / 2 - 55))}px`;
            pop.style.top = `${Math.max(8, r.top - 40)}px`;
            pop.hidden = false;
        });
    }

    // Account sync for notes
    let notesTimer = null, notesSyncing = false;
    function scheduleNotesSync() {
        if (!currentUser || !sb) return;
        clearTimeout(notesTimer);
        notesTimer = setTimeout(syncNotes, 700);
    }

    async function syncNotes() {
        if (!currentUser || !sb || notesSyncing) return;
        notesSyncing = true;
        try {
            const ids = notes.map(n => n.id);
            const gone = notesSynced.filter(id => !ids.includes(id));
            if (gone.length) {
                const d = await sb.from('notes').delete().in('id', gone);
                if (d.error) throw d.error;
            }
            const dirty = notes.filter(n => !n.syncedAt || n.updated > n.syncedAt);
            if (dirty.length) {
                const rows = dirty.map(n => ({ id: n.id, content: n.content, source: n.source || null,
                                               created_at: new Date(n.created).toISOString(), updated_at: new Date(n.updated).toISOString() }));
                const up = await sb.from('notes').upsert(rows);
                if (up.error) throw up.error;
                dirty.forEach(n => { n.syncedAt = n.updated; });
            }
            notesSynced = ids;
            saveNotes(true);
        } catch (e) {
            console.error('Saving notes to your account failed; will retry:', e);
            setTimeout(scheduleNotesSync, 8000);
        } finally {
            notesSyncing = false;
        }
    }

    async function loadCloudNotes() {
        const guestNotes = (() => { try { return JSON.parse(localStorage.getItem('vq-notes') || '[]'); } catch (e) { return []; } })();
        loadNotes();
        try {
            const r = await sb.from('notes').select('id,content,source,created_at,updated_at').order('updated_at', { ascending: false }).limit(500);
            if (r.error) throw r.error;
            const cloud = r.data.map(n => ({ id: n.id, content: n.content, source: n.source, created: Date.parse(n.created_at), updated: Date.parse(n.updated_at), syncedAt: Date.parse(n.updated_at) }));
            const local = notes.filter(n => !cloud.some(c => c.id === n.id));
            notes = cloud.concat(local).sort((a, b) => b.updated - a.updated);
            notesSynced = cloud.map(n => n.id);
            if (guestNotes.length && confirm(`Bring the ${guestNotes.length} note${guestNotes.length === 1 ? '' : 's'} from this browser into your account?`)) {
                guestNotes.forEach(n => { delete n.syncedAt; notes.unshift(n); });
                try { localStorage.removeItem('vq-notes'); } catch (e) {}
            }
            saveNotes();
        } catch (e) {
            console.error('Could not load your notes:', e);
        }
        if (uiPrefs.panelView === 'notes') renderNotes();
    }

    // ---------- Accounts: sign-in, synced history, limits ----------

    const SB_URL = 'https://luilxyqmsomulxkgjzti.supabase.co';
    const SB_KEY = 'sb_publishable_T0CuRMOj0nTphHauilOq8g_emb9RSNs';   // public key, safe in the page
    const GUEST_CHATS_KEY = CONFIG.chatsKey;
    let sb = null;
    let currentUser = null;
    let accessToken = null;

    function deviceId() {
        let id = localStorage.getItem('vq-device-id');
        if (!id) { id = newId(); try { localStorage.setItem('vq-device-id', id); } catch (e) {} }
        return id;
    }

    function requestHeaders() {
        const h = { 'Content-Type': 'application/json', 'X-VQ-Device': deviceId() };
        if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
        return h;
    }

    function setupAuth() {
        wireAuthModal();
        if (!window.supabase || !window.supabase.createClient) { renderAccount(); return; }
        sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
        sb.auth.onAuthStateChange((event, session) => { setTimeout(() => handleSession(session), 0); });
        renderAccount();
    }

    async function handleSession(session) {
        accessToken = session ? session.access_token : null;
        const u = session && session.user;
        if (u && currentUser && u.id === currentUser.id) return;       // token refresh only
        if (u) {
            const md = u.user_metadata || {};
            currentUser = { id: u.id, email: u.email, name: md.full_name || md.name || '', avatar: md.avatar_url || md.picture || '' };
            closeAuthModal();
            CONFIG.chatsKey = `vq-app-chats:u:${u.id}`;
            store = { activeId: null, chats: {} };
            loadStore();
            renderSidebar();
            renderActiveChat();
            renderAccount();
            await loadCloudStore();
            await offerGuestImport();
            await loadCloudSettings();
            await loadCloudNotes();
            setPanelView(uiPrefs.panelView, false);
            hideQuota();
        } else if (currentUser) {
            const oldKey = CONFIG.chatsKey;
            currentUser = null;
            try { localStorage.removeItem(oldKey); localStorage.removeItem(`vq-notes:u:${oldKey.split(':u:')[1]}`); } catch (e) {}   // don't leave a signed-out account's chats or notes on this device
            notesSynced = [];
            loadNotes();
            if (uiPrefs.panelView === 'notes') renderNotes();
            CONFIG.chatsKey = GUEST_CHATS_KEY;
            store = { activeId: null, chats: {} };
            loadStore();
            renderSidebar();
            renderActiveChat();
            renderAccount();
        } else {
            renderAccount();
        }
    }

    async function loadCloudStore() {
        try {
            let convs = await sb.from('conversations').select('id,title,updated_at,oria').order('updated_at', { ascending: false }).limit(CONFIG.maxChats);
            if (convs.error && /oria/i.test(convs.error.message || '')) {
                oriaCloud = false;
                convs = await sb.from('conversations').select('id,title,updated_at').order('updated_at', { ascending: false }).limit(CONFIG.maxChats);
            }
            if (convs.error) throw convs.error;
            const ids = convs.data.map(c => c.id);
            let msgs = [];
            if (ids.length) {
                const r = await sb.from('messages').select('id,conversation_id,role,content,meta,timing,created_at')
                    .in('conversation_id', ids).order('created_at', { ascending: true }).limit(5000);
                if (r.error) throw r.error;
                msgs = r.data;
            }
            const chats = {};
            convs.data.forEach(c => {
                chats[c.id] = { id: c.id, title: c.title || 'New chat', messages: [], updated: Date.parse(c.updated_at) || Date.now(), syncedIds: [], syncedTitle: c.title || 'New chat',
                                oria: Array.isArray(c.oria) ? c.oria : [] };
            });
            msgs.forEach(m => {
                const chat = chats[m.conversation_id];
                if (!chat) return;
                chat.messages.push({ role: m.role, content: m.content, meta: m.meta || null, timing: m.timing || null, mid: m.id });
                chat.syncedIds.push(m.id);
            });
            // Keep anything written on this device that hasn't reached the cloud yet
            Object.values(store.chats).forEach(c => { if (!chats[c.id] && c.messages && c.messages.length) chats[c.id] = c; });
            const active = store.activeId && chats[store.activeId] ? store.activeId : null;
            store = { activeId: active, chats };
            conversationHistory = active ? chats[active].messages : [];
            saveStore(true);
            renderSidebar();
            renderActiveChat();
            scheduleSync();
        } catch (e) {
            console.error('Could not load chats from your account:', e);
        }
    }

    async function offerGuestImport() {
        const flag = `vq-imported:${currentUser.id}`;
        if (localStorage.getItem(flag)) return;
        let guest;
        try { guest = JSON.parse(localStorage.getItem(GUEST_CHATS_KEY) || 'null'); } catch (e) { guest = null; }
        const list = guest && guest.chats ? Object.values(guest.chats).filter(c => (c.messages && c.messages.length) || (c.oria && c.oria.length)) : [];
        try { localStorage.setItem(flag, '1'); } catch (e) {}
        if (!list.length) return;
        if (!confirm(`Bring the ${list.length} chat${list.length === 1 ? '' : 's'} from this browser into your account?`)) return;
        list.forEach(c => {
            const id = newId();
            store.chats[id] = { id, title: c.title || titleFrom(c.messages), updated: c.updated || Date.now(),
                messages: c.messages.map(m => ({ role: m.role, content: m.content, meta: m.meta || null, timing: m.timing || null })),
                oria: Array.isArray(c.oria) ? c.oria : [] };
        });
        try { localStorage.removeItem(GUEST_CHATS_KEY); } catch (e) {}
        saveStore();
        renderSidebar();
    }

    async function loadCloudSettings() {
        try {
            const r = await sb.from('user_settings').select('ui_prefs').eq('user_id', currentUser.id).maybeSingle();
            if (r.error) throw r.error;
            if (r.data && r.data.ui_prefs && Object.keys(r.data.ui_prefs).length) {
                uiPrefs = Object.assign({}, UI_DEFAULTS, r.data.ui_prefs);
                try { localStorage.setItem(UI_KEY, JSON.stringify(uiPrefs)); } catch (e) {}
                applyUIPrefs();
            } else {
                saveUIPrefs();   // first sign-in: keep the look chosen as a guest
            }
        } catch (e) {
            console.error('Could not load your settings:', e);
        }
    }

    // Push new, changed or removed messages to the account (debounced)
    let syncTimer = null, syncing = false, syncAgain = false;
    let oriaCloud = true;
    function scheduleSync() {
        if (!currentUser || !sb) return;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(syncNow, 500);
    }

    async function syncNow() {
        if (!currentUser || !sb) return;
        if (syncing) { syncAgain = true; return; }
        syncing = true;
        try {
            for (const chat of Object.values(store.chats)) {
                if ((!chat.messages || !chat.messages.length) && !(chat.oria && chat.oria.length)) continue;
                chat.syncedIds = chat.syncedIds || [];
                chat.messages.forEach(m => { if (!m.mid) m.mid = newId(); });
                const current = chat.messages.map(m => m.mid);
                const toDelete = chat.syncedIds.filter(id => !current.includes(id));
                const toInsert = chat.messages.filter(m => !chat.syncedIds.includes(m.mid));
                const metaDirty = chat.messages.filter(m => m.metaDirty && chat.syncedIds.includes(m.mid));
                if (!toDelete.length && !toInsert.length && !metaDirty.length && !chat.oriaDirty && chat.syncedTitle === chat.title) continue;
                const row = { id: chat.id, title: chat.title, updated_at: new Date(chat.updated || Date.now()).toISOString() };
                if (oriaCloud) row.oria = (chat.oria || []).slice(-60).map(m => ({ role: m.role, content: m.content, mode: m.mode || null,
                                                                                    about: m.about || null, at: m.at }));
                let up = await sb.from('conversations').upsert(row);
                if (up.error && oriaCloud && /oria/i.test(up.error.message || '')) {
                    oriaCloud = false;                       // column not added yet: keep the side chat on this device only
                    delete row.oria;
                    up = await sb.from('conversations').upsert(row);
                }
                chat.oriaDirty = false;
                if (up.error) throw up.error;
                if (toDelete.length) {
                    const d = await sb.from('messages').delete().in('id', toDelete);
                    if (d.error) throw d.error;
                }
                if (toInsert.length) {
                    const base = Date.now();
                    const rows = toInsert.map((m, i) => ({ id: m.mid, conversation_id: chat.id, role: m.role, content: m.content,
                        meta: m.meta || null, timing: m.timing || null, created_at: new Date(base + i).toISOString() }));
                    const ins = await sb.from('messages').insert(rows);
                    if (ins.error) throw ins.error;
                }
                for (const m of metaDirty) {
                    const u = await sb.from('messages').update({ meta: m.meta }).eq('id', m.mid);
                    if (u.error) throw u.error;
                    m.metaDirty = false;
                }
                toInsert.forEach(m => { m.metaDirty = false; });
                chat.syncedIds = current.slice();
                chat.syncedTitle = chat.title;
            }
            saveStore(true);
        } catch (e) {
            console.error('Saving to your account failed; will retry:', e);
            setTimeout(scheduleSync, 8000);
        } finally {
            syncing = false;
            if (syncAgain) { syncAgain = false; scheduleSync(); }
        }
    }

    // ---- Account box, sign-in dialog and menu
    function renderAccount() {
        const box = document.getElementById('account-box');
        if (!box) return;
        box.textContent = '';
        if (!sb) return;
        if (!currentUser) {
            const wrap = document.createElement('div');
            wrap.className = 'account-row guest';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'sidebar-btn account-signin';
            btn.innerHTML = '<span class="acct-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span>';
            const t = document.createElement('span');
            t.className = 'acct-text';
            t.textContent = 'Sign in to save your chats';
            btn.appendChild(t);
            btn.addEventListener('click', openAuthModal);
            wrap.appendChild(btn);
            addAccountMenu(wrap, [['Reset display', resetDisplayFromMenu], ['Export my chats', exportChats], ['Delete all chats…', deleteAllChats]]);
            box.appendChild(wrap);
            return;
        }
        const row = document.createElement('div');
        row.className = 'account-row';
        const av = document.createElement('span');
        av.className = 'acct-avatar';
        av.setAttribute('aria-hidden', 'true');
        if (currentUser.avatar && /^https:\/\//.test(currentUser.avatar)) {
            const img = document.createElement('img');
            img.src = currentUser.avatar; img.alt = ''; img.referrerPolicy = 'no-referrer';
            img.onerror = () => { img.remove(); av.textContent = (currentUser.email || '?')[0].toUpperCase(); };
            av.appendChild(img);
        } else {
            av.textContent = (currentUser.name || currentUser.email || '?')[0].toUpperCase();
        }
        const who = document.createElement('span');
        who.className = 'acct-text acct-who';
        who.textContent = currentUser.name || currentUser.email;
        who.title = currentUser.email || '';
        row.append(av, who);
        addAccountMenu(row, [['Reset display', resetDisplayFromMenu], ['Export my chats', exportChats], ['Delete all chats…', deleteAllChats],
                             ['Sign out', () => sb.auth.signOut()], ['Delete my account…', deleteAccount]]);
        box.appendChild(row);
    }

    function addAccountMenu(row, items) {
        const menuBtn = document.createElement('button');
        menuBtn.type = 'button';
        menuBtn.className = 'acct-menu-btn';
        menuBtn.setAttribute('aria-label', 'Account menu');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = '⋯';
        const menu = document.createElement('div');
        menu.className = 'acct-menu';
        menu.hidden = true;
        items.forEach(([label, fn]) => {
            const it = document.createElement('button');
            it.type = 'button';
            it.textContent = label;
            if (label.startsWith('Delete')) it.className = 'danger';
            it.addEventListener('click', () => { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); fn(); });
            menu.appendChild(it);
        });
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.hidden = !menu.hidden;
            menuBtn.setAttribute('aria-expanded', String(!menu.hidden));
        });
        document.addEventListener('click', () => { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); });
        row.append(menuBtn, menu);
    }

    function resetDisplayFromMenu() {
        applyUIAction({ action: 'reset_display' });
        showLocalNote('Display reset to default');
    }

    async function deleteAllChats() {
        if (isTyping) return;
        const n = Object.values(store.chats).filter(c => c.messages && c.messages.length).length;
        if (!n) { alert('There are no chats to delete.'); return; }
        const where = currentUser ? 'from your account on every device' : 'from this browser';
        if (!confirm(`Delete all ${n} chat${n === 1 ? '' : 's'} ${where}? This cannot be undone.`)) return;
        if (currentUser && sb) {
            const { error } = await sb.from('conversations').delete().eq('user_id', currentUser.id);
            if (error) { alert('Deleting your chats did not work. Please try again.'); console.error(error); return; }
        }
        store = { activeId: null, chats: {} };
        conversationHistory = [];
        saveStore(true);
        renderSidebar();
        renderActiveChat();
    }

    function wireAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (!modal || modal._wired) return;
        modal._wired = true;
        modal.querySelector('.auth-close').addEventListener('click', closeAuthModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeAuthModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeAuthModal(); });
        const here = () => location.origin + location.pathname;
        document.getElementById('auth-google').addEventListener('click', async () => {
            if (!sb) return;
            setAuthStatus('Opening Google…');
            const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: here() } });
            if (error) setAuthStatus('Google sign-in did not start: ' + error.message, true);
        });
        document.getElementById('auth-email-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!sb) return;
            const email = document.getElementById('auth-email').value.trim();
            if (!email) return;
            setAuthStatus('Sending your sign-in link…');
            const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: here() } });
            if (error) setAuthStatus('That did not work: ' + error.message, true);
            else setAuthStatus(`Check your inbox: we sent a sign-in link to ${email}. Open it on this device.`);
        });
    }

    function setAuthStatus(text, isError) {
        const el = document.getElementById('auth-status');
        if (!el) return;
        el.textContent = text;
        el.classList.toggle('error', !!isError);
    }

    function openAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        setAuthStatus('');
        modal.hidden = false;
        setTimeout(() => document.getElementById('auth-google').focus(), 30);
    }

    function closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.hidden = true;
    }

    function exportChats() {
        const chats = Object.values(store.chats).filter(c => c.messages && c.messages.length)
            .sort((a, b) => b.updated - a.updated)
            .map(c => ({ title: c.title, updated: new Date(c.updated).toISOString(),
                         messages: c.messages.map(m => ({ role: m.role, content: m.content })) }));
        const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), account: currentUser ? currentUser.email : null, chats }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `vq-chats-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }

    async function deleteAccount() {
        if (!currentUser) return;
        const typed = prompt('This permanently deletes your account, all your chats and your settings. It cannot be undone.\n\nType DELETE to confirm.');
        if (typed !== 'DELETE') return;
        try {
            const res = await fetch(CONFIG.apiEndpoint.replace(/\/chat$/, '/account/delete'), { method: 'POST', headers: requestHeaders() });
            if (!res.ok) throw new Error('status ' + res.status);
            const key = CONFIG.chatsKey;
            try { localStorage.removeItem(key); localStorage.removeItem(`vq-imported:${currentUser.id}`); } catch (e) {}
            await sb.auth.signOut();
            alert('Your account and all its chats have been deleted.');
        } catch (e) {
            alert('Deleting your account did not work. Please try again, or contact us.');
            console.error(e);
        }
    }

    // ---- Remaining messages note (only shown when it matters)
    function updateQuota(q) {
        const el = document.getElementById('quota-note');
        if (!el || !q || typeof q.limit !== 'number' || typeof q.used !== 'number') return;
        const left = Math.max(0, q.limit - q.used);
        if (left > 3) { hideQuota(); return; }
        el.textContent = '';
        const text = document.createElement('span');
        text.textContent = left === 0
            ? (q.tier === 'guest' ? "You've used today's guest messages." : "You've used today's messages. They reset at midnight UTC.")
            : `${left} ${q.tier === 'guest' ? 'guest ' : ''}message${left === 1 ? '' : 's'} left today.`;
        el.appendChild(text);
        if (q.tier === 'guest' && sb) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = 'Sign in for 30 a day';
            b.addEventListener('click', openAuthModal);
            el.appendChild(b);
        }
        el.hidden = false;
    }

    function hideQuota() {
        const el = document.getElementById('quota-note');
        if (el) el.hidden = true;
    }

    // ---------- Sending ----------


    // Short display commands handled without the AI (the whole message has to be the command)
    const LOCAL_COMMANDS = [
        [/^(reset|reset (the )?(display|screen|look|style|font|fonts|colou?rs?|theme|everything)|(back to )?(normal|default)( (look|display|font|style))?|default (look|display|font|style))[.!]?$/i,
            { action: 'reset_display' }, 'Display reset to default'],
        [/^(undo|undo (that|it|the last change))[.!]?$/i, { action: 'undo' }, 'Undid the last screen change'],
        [/^((make )?(the )?(text|font) )?(bigger|larger)( (text|font))?( please)?[.!]?$/i, { action: 'text_size', size: 'larger' }, 'Text size → larger'],
        [/^((make )?(the )?(text|font) )?smaller( (text|font))?( please)?[.!]?$/i, { action: 'text_size', size: 'smaller' }, 'Text size → smaller'],
        [/^(swap|swap places|swap seats|let (her|o\.?r\.?i\.?a\.?|oria|airo) out)[.!]?$/i, { action: 'swap', state: 'on' }, 'O.R.I.A. has the main chat'],
        [/^(swap back|put vq back|vq come back|come back vq|end (the )?swap)[.!]?$/i, { action: 'swap', state: 'off' }, 'VQ is back in the main chat'],
        [/^(focus( mode)?( on)?)[.!]?$/i, { action: 'focus_mode', state: 'on' }, 'Focus mode → on'],
        [/^(unfocus|exit focus( mode)?|focus( mode)? off|leave focus( mode)?)[.!]?$/i, { action: 'focus_mode', state: 'off' }, 'Focus mode → off']
    ];

    function localCommand(text) {
        const t = (text || '').trim();
        if (t.length > 40) return null;
        for (const [re, act, label] of LOCAL_COMMANDS) if (re.test(t)) return { act, label };
        return null;
    }

    function showLocalNote(label) {
        hideWelcomeScreen();
        const note = el('div', 'local-note');
        note.setAttribute('role', 'status');
        note.appendChild(el('span', 'local-note-icon', '↺'));
        note.appendChild(el('span', null, `${label} · done on your device, no message used`));
        elements.messagesArea.appendChild(note);
        note.scrollIntoView({ behavior: 'smooth', block: 'end' });
        setTimeout(() => { note.classList.add('fade'); setTimeout(() => note.remove(), 600); }, 6000);
    }


    // ---------- Friendly confirmations for screen changes (no AI needed) ----------

    const CHOICES = {
        theme: ['VQ', 'Navy', 'Charcoal', 'Midnight', 'Ocean', 'Forest', 'Ember', 'Slate', 'Plum'],
        font: ['Default', 'Readable', 'Serif', 'Mono', 'Script', 'Handwriting', 'Elegant', 'Classic', 'Inscription', 'Futuristic', 'Retro', 'Playful', 'Rounded'],
        accent: ['Orange', 'Gold', 'Teal', 'Rose', 'Violet', 'Green', 'Blue', 'Grey'],
        title: ['Inscription', 'Elegant', 'Futuristic']
    };
    const TIPS = [
        ['theme', 'Try a different background: “ocean theme”, “midnight” or “ember”.'],
        ['font', 'Fancy a new font? Try “cursive font” or “typewriter font”.'],
        ['title', 'The title has three styles: “futuristic title”, “elegant title” and “inscription title”.'],
        ['accent', 'Change the accent colour: “teal accent”, “gold” or “rose”.'],
        ['bubbles', 'Prefer chat bubbles? Say “bubbles on”.'],
        ['focus', 'Want fewer distractions? Say “focus”.'],
        ['oria', 'Meet O.R.I.A. in the side panel, or say “swap” to let her take over the chat for a while.'],
        ['notes', 'Ask me to “note that down” and I’ll save it to your Notes.'],
        ['size', 'Say “bigger” or “smaller” to change the text size, and it costs no messages.'],
        ['reset', 'Say “reset” any time to put everything back to normal.']
    ];
    const cap = (w) => (w || '').charAt(0).toUpperCase() + (w || '').slice(1);
    const others = (list, chosen) => list.filter(x => x.toLowerCase() !== String(chosen || '').toLowerCase()).join(', ');

    function uiConfirmation(acts) {
        const lines = [];
        const used = new Set();
        (acts || []).forEach(a => {
            if (!a || !a.action) return;
            const st = a.style || {};
            switch (a.action) {
                case 'style':
                    if (st.theme) { used.add('theme'); lines.push(`Theme set to **${st.theme === 'vq' ? 'VQ' : cap(st.theme)}**. Other themes: ${others(CHOICES.theme, st.theme)}.`); }
                    if (st.font) { used.add('font'); lines.push(`Font set to **${cap(st.font)}**. Other fonts: ${others(CHOICES.font, st.font)}.`); }
                    if (st.accent) { used.add('accent'); lines.push(`Accent colour set to **${cap(st.accent)}**. Other colours: ${others(CHOICES.accent, st.accent)}.`); }
                    if (st.title) { used.add('title'); lines.push(`Title style set to **${cap(st.title)}**. The others are ${others(CHOICES.title, st.title).replace(/, ([^,]*)$/, ' and $1')}.`); }
                    if (st.bubbles) { used.add('bubbles'); lines.push(st.bubbles === 'on' ? 'Answers now show **in chat bubbles**. Say “bubbles off” for the open page layout.' : 'Answers now use the **open page layout**. Say “bubbles on” to bring the bubbles back.'); }
                    if (typeof st.text_scale === 'number') { used.add('size'); lines.push(`Text size set to **${Math.round(st.text_scale * 100)}%**.`); }
                    if (typeof st.line_spacing === 'number') lines.push(`Line spacing set to **${st.line_spacing}**.`);
                    if (st.contrast) lines.push(`Contrast set to **${st.contrast}**.`);
                    if (st.motion) lines.push(st.motion === 'reduced' ? 'Animations are now **reduced**.' : 'Animations are back to **normal**.');
                    if (st.width) lines.push(`The chat column is now **${st.width}**.`);
                    break;
                case 'text_size':
                    used.add('size');
                    lines.push(`Text size is now **${Math.round((uiPrefs.scale || 1) * 100)}%**. Say “bigger” or “smaller” any time.`);
                    break;
                case 'reset_display':
                    used.add('reset');
                    lines.push('Everything is back to the standard look: the VQ theme, default font and text size, orange accent, open layout, and the Details panel.');
                    break;
                case 'undo':
                    lines.push('Undid the last screen change.');
                    break;
                case 'focus_mode':
                    used.add('focus');
                    lines.push(a.state === 'off' ? 'Focus mode is **off**: the sidebar and panel are back.' : 'Focus mode is **on**: just the conversation. Say “unfocus” to bring everything back.');
                    break;
                case 'panel':
                    lines.push(a.state === 'close' ? 'Side panel closed. Say “open the panel” to bring it back.' : 'Side panel opened.');
                    break;
                case 'panel_view':
                    lines.push(`Side panel switched to **${a.view === 'enquirer' ? 'O.R.I.A.' : cap(a.view || 'details')}**.`);
                    break;
                case 'add_note':
                    used.add('notes');
                    lines.push('Saved to your **Notes**. You’ll find it in the side panel.');
                    break;
                case 'show_reasoning':
                    lines.push('Opened the details for that answer in the side panel.');
                    break;
                case 'new_chat':
                    lines.push('Starting a fresh chat for you.');
                    break;
                case 'swap':
                    used.add('oria');
                    lines.push(a.state === 'off' ? 'VQ is back in the main chat.' : '**O.R.I.A. has the main chat** for a few messages, and VQ is watching from the panel. Say “swap back” to end it early.');
                    break;
                default:
                    lines.push('Done.');
            }
        });
        if (!lines.length) lines.push('Done.');
        let n = 0;
        try { n = parseInt(localStorage.getItem('vq-tip-n') || '0', 10) || 0; } catch (e) {}
        let lastTip = '';
        try { lastTip = localStorage.getItem('vq-tip-last') || ''; } catch (e) {}
        const pool = TIPS.filter(([k, t]) => !used.has(k) && t !== lastTip);
        const tip = pool.length ? pool[n % pool.length][1] : '';
        try { localStorage.setItem('vq-tip-n', String(n + 1)); localStorage.setItem('vq-tip-last', tip); } catch (e) {}
        const noUndo = (acts || []).every(a => a && ['undo', 'new_chat', 'show_reasoning'].includes(a.action));
        return lines.join('\n\n') + (tip ? `\n\n*Tip: ${tip}*` : '') + (noUndo ? '' : '\n\nSay “undo” if you’d like it back.');
    }

    async function sendMessage() {
        const rawMessage = elements.messageInput.value.trim();
        if (!rawMessage || isTyping) return;

        // Simple display commands run on this device: instant, free, and they work even after the daily limit
        const local = localCommand(rawMessage);
        if (local) {
            ensureActiveChat();
            hideWelcomeScreen();
            elements.chatContainer.classList.add('has-messages');
            const uRec = { role: 'user', content: rawMessage, meta: { uiOnly: true } };
            conversationHistory.push(uRec);
            const uDiv = addMessageToUI('user', rawMessage);
            if (uDiv) uDiv.classList.add('ui-change-user');
            applyUIAction(local.act);
            const text = uiConfirmation([local.act]);
            const aRec = { role: 'assistant', content: text, meta: { uiOnly: true, local: true } };
            conversationHistory.push(aRec);
            const aDiv = addMessageToUI('assistant', text, null);
            if (aDiv) { aDiv._record = aRec; aDiv.classList.add('ui-change'); }
            touchActiveChat();
            elements.messageInput.value = '';
            elements.messageInput.style.height = 'auto';
            elements.charCount.textContent = `0 / ${CONFIG.maxMessageLength}`;
            elements.sendBtn.disabled = true;
            return;
        }

        // Prepend active pill prefix for backend routing; show clean message in UI
        const message = activePill ? `${activePill} ${rawMessage}` : rawMessage;

        ensureActiveChat();
        hideWelcomeScreen();
        elements.chatContainer.classList.add('has-messages');

        addMessageToUI('user', rawMessage);
        conversationHistory.push({ role: 'user', content: rawMessage, sent: message });
        touchActiveChat();

        elements.messageInput.value = '';
        elements.messageInput.style.height = 'auto';
        elements.charCount.textContent = `0 / ${CONFIG.maxMessageLength}`;
        elements.sendBtn.disabled = true;

        activePill = null;
        document.querySelectorAll('.cap-pill').forEach(p => p.classList.remove('active'));

        await requestReply(message);
    }

    async function regenerateLast() {
        if (isTyping) return;
        const last = conversationHistory[conversationHistory.length - 1];
        if (!last || last.role !== 'assistant') return;
        conversationHistory.pop();
        const oldEntry = entryFor.get(last);
        if (oldEntry) oldEntry.remove();
        const msgs = elements.messagesArea.querySelectorAll('.message:not(.user)');
        const lastDiv = msgs[msgs.length - 1];
        if (lastDiv) lastDiv.remove();
        touchActiveChat();
        const lastUser = conversationHistory[conversationHistory.length - 1];
        if (!lastUser || lastUser.role !== 'user') return;
        await requestReply(lastUser.sent || lastUser.content);
    }

    // Reads the server's word-by-word reply, showing it as it arrives; returns the full text
    async function readStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let full = '';
        let bubble = null;
        let framePending = false;
        let finished = false;
        let meta = null;
        let firstMs = null;
        const uiActs = [];
        const t0 = performance.now();

        const paint = () => {
            framePending = false;
            if (finished) return;
            if (!bubble) {
                hideTypingIndicator();
                hidePending();
                firstMs = Math.round(performance.now() - t0);
                bubble = createStreamingBubble();
            }
            fillRich(bubble.content, full);
        };

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let cut;
                while ((cut = buffer.indexOf('\n\n')) >= 0) {
                    const event = buffer.slice(0, cut);
                    buffer = buffer.slice(cut + 2);
                    const line = event.split('\n').find(l => l.startsWith('data:'));
                    if (!line) continue;
                    let msg;
                    try { msg = JSON.parse(line.slice(5).trim()); } catch (e) { continue; }
                    if (msg.meta && typeof msg.meta === 'object') { meta = msg.meta; if (meta.quota) updateQuota(meta.quota); }
                    if (msg.ui && typeof msg.ui === 'object') { applyUIAction(msg.ui); uiActs.push(msg.ui); }
                    if (typeof msg.status === 'string') {
                        if (!bubble) showPending(msg.status, msg.detail || '');
                        pushLiveStep(msg.status, msg.detail || null);
                    }
                    if (typeof msg.delta === 'string') full += msg.delta;
                    if (typeof msg.replace === 'string') full = msg.replace;
                    if (!framePending && full) {
                        framePending = true;
                        requestAnimationFrame(paint);
                    }
                }
            }
        } finally {
            finished = true;
            if (bubble) bubble.div.remove();
        }
        const text = cleanReply(full).trim();
        return { text: text || "Friend, that one came back empty on my end. Ask me again?", meta, uiActs,
                 timing: { firstMs, totalMs: Math.round(performance.now() - t0) } };
    }

    // Sends the conversation (ending with the latest user message) and shows VQ's reply
    async function requestReply(message) {
        const chatId = store.activeId;
        isTyping = true;
        handleInputChange();
        setStatus('typing', 'Thinking...');
        showPending('Reading your question');
        startLivePanel(message.replace(/^\[[A-Z ]+\]\s*/, ''));

        const history = conversationHistory.filter(m => !(m.meta && m.meta.uiOnly)).slice(-CONFIG.historySent).map(m => ({ role: m.role,
            content: m.meta && m.meta.voice === 'oria' && !isSwapped() ? `[O.R.I.A., while she had the main chat]: ${m.content}` : m.content }));
        const voice = isSwapped() ? 'oria' : null;
        // Mode of the previous answer, so related follow-ups can stay in that mode without pressing the button again
        const prevAnswer = [...conversationHistory].reverse().find(m => m.role === 'assistant');
        const lastMode = (prevAnswer && prevAnswer.meta && prevAnswer.meta.mode_prefix) || null;

        try {
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: requestHeaders(),
                body: JSON.stringify(Object.assign({ message: message, history: history, stream: true, lastMode: lastMode, clientCaps: ['ui', 'oria'], voice },
                                                   notesForRequest(message), oriaForRequest()))
            });

            const contentType = response.headers.get('content-type') || '';
            let data;
            if (response.ok && contentType.includes('text/event-stream') && response.body) {
                const streamed = await readStream(response);
                data = { response: streamed.text, meta: streamed.meta, timing: streamed.timing };
                if (streamed.meta && streamed.meta.ui_only && streamed.uiActs.length) {
                    data.response = uiConfirmation(streamed.uiActs);
                    data.meta = Object.assign({}, streamed.meta, { uiOnly: true });
                    const lastUser = [...conversationHistory].reverse().find(m => m.role === 'user');
                    if (lastUser) {
                        lastUser.meta = Object.assign({}, lastUser.meta || {}, { uiOnly: true });
                        const uDivs = elements.messagesArea.querySelectorAll('.message.user');
                        if (uDivs.length) uDivs[uDivs.length - 1].classList.add('ui-change-user');
                    }
                }
            } else {
                data = await response.json().catch(() => ({}));
            }
            hideTypingIndicator();
            hidePending();

            if (!response.ok) {
                // Friendly messages from the server (rate limit, too long) are shown but not saved
                if (data && data.quota) updateQuota(data.quota);
                if (data && data.response) {
                    dropLiveEntry();
                    addMessageToUI('assistant', data.response);
                    setStatus('online', 'Online');
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const chat = store.chats[chatId];
            if (chat && chatId !== store.activeId) {
                // The user switched chats while waiting: file the reply under the chat it belongs to
                chat.messages.push({ role: 'assistant', content: data.response, meta: voice ? Object.assign({}, data.meta || {}, { voice }) : (data.meta || null), timing: data.timing || null });
                dropLiveEntry();
                chat.updated = Date.now();
                saveStore();
                renderSidebar();
            } else {
                const rec = { role: 'assistant', content: data.response, meta: voice ? Object.assign({}, data.meta || {}, { voice }) : (data.meta || null), timing: data.timing || null };
                const div = addMessageToUI('assistant', data.response, data.meta || null);
                div._record = rec;
                if (data.meta && data.meta.uiOnly) div.classList.add('ui-change');
                conversationHistory.push(rec);
                addPanelEntry(div);
                if (voice) { styleOriaAnswer(div); afterSwappedAnswer(rec); }
                if (uiPrefs.panelView === 'enquirer' && !enquirerBusy) renderEnquirer();
                if (pendingNewChat) { pendingNewChat = false; setTimeout(() => { if (!isTyping) startNewChat(); }, 1200); }
                touchActiveChat();
                refreshRetryButton();
            }
            setStatus('online', 'Online');

        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            hidePending();
            dropLiveEntry();
            addMessageToUI('assistant', "I'm having trouble connecting right now. Please try again in a moment.\n\nIf this persists, you can reach out via the website at veritasquaesitorcai.github.io");
            setStatus('error', 'Connection error');
            setTimeout(() => setStatus('online', 'Online'), 3000);
        } finally {
            isTyping = false;
            handleInputChange();
            if (window.innerWidth > 768) elements.messageInput.focus();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
