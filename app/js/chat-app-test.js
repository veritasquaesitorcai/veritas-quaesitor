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
        applyUIPrefs();
        renderActiveChat();
        setupPanel();
        setupAuth();
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
        enhanceTables(contentDiv);
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
            const k = typeof st.found === 'number' ? st.found : (meta.sources || []).length;
            const q = st.query ? `"${st.query}" · ` : '';
            ol.appendChild(codeLine(++n, v, r, `${q}${k ? `${k} sources found` : 'no usable results'}`, st.ms));
        });
        (meta.live || []).filter(x => /weather|time|image/i.test(x)).forEach(x => ol.appendChild(codeLine(++n, 'Fetched', x.toLowerCase())));
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
        const msgs = [...elements.messagesArea.querySelectorAll('.message:not(.user):not(.pending):not(.streaming)')].filter(m => m._record);
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


    // ---------- Screen controls (applied when VQ calls ui_action; also restored on load) ----------

    const UI_KEY = 'vq-ui-prefs';
    const UI_DEFAULTS = { scale: 1, line: 1.6, accent: 'orange', contrast: 'normal', font: 'default', motion: 'normal', width: 'normal', focus: false };
    const SIZE_SCALES = { compact: 0.9, comfortable: 1, large: 1.15, extra_large: 1.3 };
    const ACCENTS = {
        orange: ['#ff8c42', '#ffb27a'], gold: ['#e8b04a', '#ffd98a'], teal: ['#2fb5a3', '#7fe0d2'], rose: ['#e2627e', '#f5a3b5'],
        violet: ['#8b6cf0', '#c2b1ff'], green: ['#4caf6a', '#9be0ad'], blue: ['#4a8fe8', '#9cc4ff']
    };
    const WIDTHS = { narrow: '44rem', normal: '56rem', wide: '72rem' };
    let uiPrefs = loadUIPrefs();
    const uiUndo = [];
    let pendingNewChat = false;

    function loadUIPrefs() {
        try { return Object.assign({}, UI_DEFAULTS, JSON.parse(localStorage.getItem(UI_KEY) || '{}')); }
        catch (e) { return Object.assign({}, UI_DEFAULTS); }
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
        ['readable', 'serif', 'mono'].forEach(f => b.toggle(`ui-font-${f}`, uiPrefs.font === f));
        b.toggle('ui-reduce-motion', uiPrefs.motion === 'reduced');
        b.toggle('ui-focus', !!uiPrefs.focus);
        b.toggle('ui-accent-custom', uiPrefs.accent !== 'orange');
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
                if (['default', 'readable', 'serif', 'mono'].includes(st.font)) uiPrefs.font = st.font;
                if (['normal', 'reduced'].includes(st.motion)) uiPrefs.motion = st.motion;
                if (WIDTHS[st.width]) uiPrefs.width = st.width;
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
            case 'reset_display':
                uiPrefs = Object.assign({}, UI_DEFAULTS);
                break;
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
            hideQuota();
        } else if (currentUser) {
            const oldKey = CONFIG.chatsKey;
            currentUser = null;
            try { localStorage.removeItem(oldKey); } catch (e) {}   // don't leave a signed-out account's chats on this device
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
            const convs = await sb.from('conversations').select('id,title,updated_at').order('updated_at', { ascending: false }).limit(CONFIG.maxChats);
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
                chats[c.id] = { id: c.id, title: c.title || 'New chat', messages: [], updated: Date.parse(c.updated_at) || Date.now(), syncedIds: [], syncedTitle: c.title || 'New chat' };
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
        const list = guest && guest.chats ? Object.values(guest.chats).filter(c => c.messages && c.messages.length) : [];
        try { localStorage.setItem(flag, '1'); } catch (e) {}
        if (!list.length) return;
        if (!confirm(`Bring the ${list.length} chat${list.length === 1 ? '' : 's'} from this browser into your account?`)) return;
        list.forEach(c => {
            const id = newId();
            store.chats[id] = { id, title: c.title || titleFrom(c.messages), updated: c.updated || Date.now(),
                messages: c.messages.map(m => ({ role: m.role, content: m.content, meta: m.meta || null, timing: m.timing || null })) };
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
                if (!chat.messages || !chat.messages.length) continue;
                chat.syncedIds = chat.syncedIds || [];
                chat.messages.forEach(m => { if (!m.mid) m.mid = newId(); });
                const current = chat.messages.map(m => m.mid);
                const toDelete = chat.syncedIds.filter(id => !current.includes(id));
                const toInsert = chat.messages.filter(m => !chat.syncedIds.includes(m.mid));
                if (!toDelete.length && !toInsert.length && chat.syncedTitle === chat.title) continue;
                const up = await sb.from('conversations').upsert({ id: chat.id, title: chat.title, updated_at: new Date(chat.updated || Date.now()).toISOString() });
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
            addAccountMenu(wrap, [['Export my chats', exportChats], ['Delete all chats…', deleteAllChats]]);
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
        addAccountMenu(row, [['Export my chats', exportChats], ['Delete all chats…', deleteAllChats],
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
                    if (msg.meta && typeof msg.meta === 'object') { meta = msg.meta; if (meta.quota) updateQuota(meta.quota); }
                    if (msg.ui && typeof msg.ui === 'object') applyUIAction(msg.ui);
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
        // Mode of the previous answer, so related follow-ups can stay in that mode without pressing the button again
        const prevAnswer = [...conversationHistory].reverse().find(m => m.role === 'assistant');
        const lastMode = (prevAnswer && prevAnswer.meta && prevAnswer.meta.mode_prefix) || null;

        try {
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: requestHeaders(),
                body: JSON.stringify({ message: message, history: history, stream: true, lastMode: lastMode, clientCaps: ['ui'] })
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
