(function() {
    'use strict';

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
        renderActiveChat();
        setupPanel();
        if (window.innerWidth > 768) elements.messageInput.focus();
    }

    function attachEventListeners() {
        elements.sidebarToggle.addEventListener('click', toggleSidebar);
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

    function toggleSidebar() {
        elements.sidebar.classList.toggle('minimized');
        saveSidebarState();
    }

    function loadSidebarState() {
        const isMinimized = localStorage.getItem(CONFIG.sidebarStateKey) === 'minimized';
        if (isMinimized || window.innerWidth <= 768) elements.sidebar.classList.add('minimized');
    }

    function saveSidebarState() {
        const state = elements.sidebar.classList.contains('minimized') ? 'minimized' : 'expanded';
        localStorage.setItem(CONFIG.sidebarStateKey, state);
    }

    function renderSidebar() {
        const list = elements.chatHistoryList;
        list.textContent = '';
        const chats = Object.values(store.chats)
            .filter(c => c.messages && c.messages.length)
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
            icon.textContent = '💬';

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
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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

    function saveStore() {
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
        if (conversationHistory.length === 0) {
            if (elements.panel) rebuildPanelLog();
            showWelcomeScreen();
            elements.chatContainer.classList.remove('has-messages');
            return;
        }
        hideWelcomeScreen();
        elements.chatContainer.classList.add('has-messages');
        conversationHistory.forEach(msg => { const d = addMessageToUI(msg.role, msg.content, msg.meta); if (d && msg.role === 'assistant') d._record = msg; });
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
    function cleanReply(text) {
        return (text || '').replace(/```(?:html)?\s*/g, '').replace(/```\s*/g, '');
    }

    function fillRich(contentDiv, content) {
        contentDiv.textContent = '';
        contentDiv.classList.add('rich');
        cleanReply(content).split(/(<img[^>]*>)/i).forEach(part => {
            if (/^<img/i.test(part)) {
                const imgEl = safeImageFrom(part);
                if (imgEl) contentDiv.appendChild(imgEl);
            } else if (part.trim()) {
                appendRichText(contentDiv, part);
            }
        });
    }

    // A reply bubble that fills in as the words arrive
    function createStreamingBubble() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message streaming';
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
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
        avatar.textContent = role === 'user' ? '👤' : '🤖';

        const body = document.createElement('div');
        body.className = 'message-body';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (role === 'user') {
            contentDiv.textContent = content;
        } else {
            fillRich(contentDiv, content);
        }

        body.appendChild(contentDiv);

        if (role !== 'user') {
            const actions = document.createElement('div');
            actions.className = 'message-actions';

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'msg-action';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', () => copyText(content.replace(/<img[^>]*>/gi, '').trim(), copyBtn));
            actions.appendChild(copyBtn);

            body.appendChild(actions);
            if (meta && typeof meta === 'object') appendAnswerChips(body, messageDiv, meta);
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
        avatar.textContent = '🤖';

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

    function isWide() { return window.matchMedia('(min-width: 1100px)').matches; }

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
        if (!meta) return null;
        const n = Array.isArray(meta.sources) ? meta.sources.length : 0;
        if (n) return `${(meta.live || []).indexOf('News search') >= 0 ? 'Searched the news' : 'Searched the web'} · ${n} source${n === 1 ? '' : 's'}`;
        if (isBigQuestion(meta)) return 'Christian starting point · naturalism noted';
        if (meta.mode) return meta.mode;
        const extra = (meta.knowledge || []).filter(k => k !== 'VQ core identity');
        if (extra.length) return `Drew on ${extra[0]}${extra.length > 1 ? ` +${extra.length - 1}` : ''}`;
        if ((meta.live || []).length) return meta.live.join(' · ');
        return null;
    }

    function appendAnswerChips(body, messageDiv, meta) {
        const sources = Array.isArray(meta.sources) ? meta.sources : [];
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
        chip.appendChild(el('span', null, text));
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
        const rec = messageDiv._record;
        const meta = rec.meta || {};
        const art = el('article', 'insight-entry');
        art.appendChild(entryHeader('answer to', findQuestionFor(rec) || ''));

        const ol = el('ol', 'code');
        let n = 0;
        const extra = (meta.knowledge || []).filter(k => k !== 'VQ core identity');
        ol.appendChild(codeLine(++n, 'Read', 'your question', meta.mode ? `mode: ${meta.mode}` : null));
        ol.appendChild(codeLine(++n, 'Gathered', "what's relevant", extra.length ? extra.join(', ') : 'core knowledge only', null, { detailClass: extra.length ? 'tk-fn' : 'tk-str' }));
        (meta.steps || []).forEach(st => {
            const [v, r] = splitVerb(st.label);
            const k = (meta.sources || []).length;
            ol.appendChild(codeLine(++n, v, r, k ? `${k} sources found` : 'no usable results', st.ms));
        });
        (meta.live || []).filter(x => /weather|time|image/i.test(x)).forEach(x => ol.appendChild(codeLine(++n, 'Fetched', x.toLowerCase())));
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
        const msgs = [...elements.messagesArea.querySelectorAll('.message:not(.user):not(.pending):not(.streaming)')].filter(m => m._record);
        if (!msgs.length) {
            const box = el('div', 'insight-empty');
            box.appendChild(el('span', 'tk-com', '// nothing here yet'));
            box.appendChild(el('p', null, 'Each answer adds an entry here: what VQ drew on, what it searched, the sources it found, and the starting point it answered from.'));
            b.appendChild(box);
        } else {
            msgs.forEach(m => b.appendChild(buildEntry(m)));
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
        else b.insertBefore(entry, ensureNote());
        entry.classList.add('fresh');
        setTimeout(() => entry.classList.remove('fresh'), 1400);
        scrollPanelToEnd();
    }

    function scrollPanelToEnd(instant) {
        const b = elements.panelBody;
        const entries = b.querySelectorAll('.insight-entry');
        const last = entries[entries.length - 1];
        if (last) last.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
    }

    function selectAnswer(messageDiv, entry) {
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
        b.insertBefore(liveEntry, ensureNote());
        liveLineNo = 0;
        pushLiveStep('Reading your question');
        liveEntry.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            div.appendChild(el('div', 'message-avatar', '🤖'));
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

    // ---------- Sending ----------

    async function sendMessage() {
        const rawMessage = elements.messageInput.value.trim();
        if (!rawMessage || isTyping) return;

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
                    if (msg.meta && typeof msg.meta === 'object') meta = msg.meta;
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
        return { text: text || "Friend, that one came back empty on my end. Ask me again?", meta,
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

        const history = conversationHistory.slice(-CONFIG.historySent).map(m => ({ role: m.role, content: m.content }));

        try {
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, history: history, stream: true })
            });

            const contentType = response.headers.get('content-type') || '';
            let data;
            if (response.ok && contentType.includes('text/event-stream') && response.body) {
                const streamed = await readStream(response);
                data = { response: streamed.text, meta: streamed.meta, timing: streamed.timing };
            } else {
                data = await response.json().catch(() => ({}));
            }
            hideTypingIndicator();
            hidePending();

            if (!response.ok) {
                // Friendly messages from the server (rate limit, too long) are shown but not saved
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
                chat.messages.push({ role: 'assistant', content: data.response, meta: data.meta || null, timing: data.timing || null });
                dropLiveEntry();
                chat.updated = Date.now();
                saveStore();
                renderSidebar();
            } else {
                const rec = { role: 'assistant', content: data.response, meta: data.meta || null, timing: data.timing || null };
                const div = addMessageToUI('assistant', data.response, data.meta || null);
                div._record = rec;
                conversationHistory.push(rec);
                addPanelEntry(div);
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
