(function() {
    'use strict';

    // Drawn icons (replace emoji, which look different on every device)
    const ICONS = {"vq": "<svg class=\"ic vq-mark\" viewBox=\"0 0 32 32\" aria-hidden=\"true\"><line class=\"l vq-antenna\" x1=\"16\" y1=\"4.2\" x2=\"16\" y2=\"8\"/><circle class=\"vq-light\" cx=\"16\" cy=\"3.4\" r=\"2.1\"/><rect class=\"f vq-head\" x=\"5.5\" y=\"8\" width=\"21\" height=\"16.5\" rx=\"6.5\"/><rect class=\"l\" x=\"5.5\" y=\"8\" width=\"21\" height=\"16.5\" rx=\"6.5\"/><rect class=\"vq-visor\" x=\"8.6\" y=\"11.6\" width=\"14.8\" height=\"7.6\" rx=\"3.8\"/><circle class=\"vq-eye\" cx=\"12.6\" cy=\"15.4\" r=\"2\"/><circle class=\"vq-eye\" cx=\"19.4\" cy=\"15.4\" r=\"2\"/><circle class=\"vq-glint\" cx=\"13.2\" cy=\"14.8\" r=\"0.6\"/><circle class=\"vq-glint\" cx=\"20\" cy=\"14.8\" r=\"0.6\"/><path class=\"l vq-mouth\" d=\"M13 21.6c1.9 1 4.1 1 6 0\"/><rect class=\"a vq-ear\" x=\"2.6\" y=\"13.6\" width=\"2.6\" height=\"5.2\" rx=\"1.3\"/><rect class=\"a vq-ear\" x=\"26.8\" y=\"13.6\" width=\"2.6\" height=\"5.2\" rx=\"1.3\"/></svg>", "user": "<svg class=\"ic\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle class=\"f\" cx=\"12\" cy=\"8.6\" r=\"3.9\"/><path class=\"f\" d=\"M4.8 20.2a7.2 7.2 0 0 1 14.4 0z\"/><circle class=\"l\" cx=\"12\" cy=\"8.6\" r=\"3.9\"/><path class=\"l\" d=\"M4.8 20.2a7.2 7.2 0 0 1 14.4 0\"/></svg>", "chat": "<svg class=\"ic\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path class=\"f\" d=\"M20.2 11.8a8.2 8.2 0 0 1-11.9 7.3L4 20.2l1.1-4.2a8.2 8.2 0 1 1 15.1-4.2z\"/><path class=\"l\" d=\"M20.2 11.8a8.2 8.2 0 0 1-11.9 7.3L4 20.2l1.1-4.2a8.2 8.2 0 1 1 15.1-4.2z\"/><circle class=\"a\" cx=\"8.6\" cy=\"12\" r=\"1\"/><circle class=\"a\" cx=\"12.2\" cy=\"12\" r=\"1\"/><circle class=\"a\" cx=\"15.8\" cy=\"12\" r=\"1\"/></svg>"};

    // Live skies: Vanta.js effects (MIT), bundled in lib/vanta and loaded only when chosen
    const LIVE_SKIES = {
        livefog: { label: 'Living fog', fx: 'fog', words: ['fog sky', 'flowing fog', 'live fog'], opts: a => ({ highlightColor: a, midtoneColor: 0x1b2a4a, lowlightColor: 0x0b0f19, baseColor: 0x0b0f19, blurFactor: 0.6, speed: 1.1 }) },
        lowpolysea: { label: 'Low-poly sea', k: 0.8, fx: 'waves', words: ['low poly sea', 'polygon waves', '3d waves'], opts: a => ({ color: mixInt(a, 0x0b0f19, 0.75), shininess: 30, waveHeight: 15, zoom: 0.9 }) },
        cloudsky: { label: '3D clouds', k: 0.55, fx: 'clouds', words: ['3d cloud', 'cloudscape', 'fluffy clouds', 'live clouds'], opts: () => ({ skyColor: 0x2a4a6a, cloudColor: 0x6a7fa0, sunColor: 0xff9919, sunGlareColor: 0xff6633, sunlightColor: 0xff9933, speed: 0.8 }) },
        flock: { label: 'Flock', fx: 'birds', words: ['flock of birds', 'bird flock', 'flocking birds'], opts: a => ({ backgroundColor: 0x0b0f19, color1: a, color2: 0x88ccff, quantity: 3 }) },
        network: { label: 'Network', fx: 'net', words: ['neural net', 'web of points'], opts: a => ({ color: a, backgroundColor: 0x0b0f19, points: 9, maxDistance: 20, spacing: 17 }) },
        cells: { label: 'Cells', fx: 'cells', words: ['living cells', 'cell sky'], opts: a => ({ color1: 0x0b2a33, color2: a, size: 1.5, speed: 0.6 }) },
        dotfield: { label: 'Dot field', fx: 'dots', words: ['dot grid'], opts: a => ({ color: a, color2: 0x88ccff, backgroundColor: 0x0b0f19, size: 3, spacing: 35, showLines: false }) },
        globe: { label: 'Globe', fx: 'globe', words: ['wire globe', 'world globe'], opts: a => ({ color: a, color2: 0xffffff, backgroundColor: 0x0b0f19, size: 1 }) },
        halo: { label: 'Halo', fx: 'halo', words: ['glowing halo', 'light ring'], opts: () => ({ baseColor: 0x001a59, backgroundColor: 0x0b0f19, amplitudeFactor: 1, size: 1.2 }) },
        rings: { label: 'Rings', fx: 'rings', words: ['colour rings', 'color rings', 'orbit rings'], opts: a => ({ backgroundColor: 0x0b0f19, color: a }) },
        ripple: { label: 'Ripple', fx: 'ripple', words: ['ripples', 'water ripple'], opts: a => ({ color1: 0x0b2a33, color2: a, backgroundColor: 0x0b0f19 }) },
        flowlines: { label: 'Flow lines', fx: 'topology', words: ['topology', 'flow field', 'flowing lines'], opts: a => ({ color: a, backgroundColor: 0x0b0f19 }) },
        threads: { label: 'Threads', fx: 'trunk', words: ['thread circle', 'spun threads'], opts: a => ({ color: a, backgroundColor: 0x0b0f19, spacing: 0, chaos: 1 }) }
    };
    const SKY_KEYS = ['mist', 'clouds', 'sunset', 'night', 'seaday', 'seanight', 'storm', 'none', ...Object.keys(LIVE_SKIES)];
    function mixInt(a, b, t) {
        const ch = (x, s) => (x >> s) & 255, m = s => Math.round(ch(a, s) * (1 - t) + ch(b, s) * t) << s;
        return m(16) | m(8) | m(0);
    }

    const PARTICLE_SHAPES = ['circle', 'star', 'square', 'triangle', 'hexagon', 'line', 'glyph'];
    const PARTICLE_DIRS = ['none', 'up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right', 'outward'];
    const PARTICLE_POINTER = ['none', 'repulse', 'attract', 'grab', 'bubble', 'connect'];
    const PARTICLE_FROM = ['bottom', 'top', 'left', 'right', 'center', 'random'];
    const PARTICLE_BUILTINS = {
        starfield:     { label: 'Starfield', shape: 'circle', colors: ['#ffffff', '#cfe3ff', '#ffe9c4'], count: 140, size: [0.5, 2], opacity: [0.3, 1], speed: 0.12, twinkle: 0.7 },
        constellations:{ label: 'Constellations', shape: 'circle', colors: ['accent', '#ffffff'], count: 60, size: [1, 2.5], opacity: [0.5, 1], speed: 0.5, links: { distance: 140, opacity: 0.22 }, pointer: 'grab' },
        embers:        { label: 'Embers', shape: 'circle', colors: ['#ffb347', '#ff7a2a', '#ffd27a'], count: 55, size: [1, 3], opacity: [0.3, 1], speed: 1.1, direction: 'up', drift: 0.6, twinkle: 0.6, glow: 0.6 },
        fireflies:     { label: 'Fireflies', shape: 'circle', colors: ['#fff3a0', '#d4ff7a', '#ffe680'], count: 32, size: [1.5, 3.2], opacity: [0.1, 1], speed: 0.55, drift: 0.5, twinkle: 1, glow: 0.9, pointer: 'bubble' },
        snowfall:      { label: 'Snowfall', shape: 'circle', colors: ['#ffffff', '#e6f0ff'], count: 140, size: [1, 4], opacity: [0.4, 0.95], speed: 1, direction: 'down', drift: 0.5 },
        bubbles:       { label: 'Bubbles', shape: 'circle', colors: ['#bfe9ff', '#8fd3ff', '#ffffff'], count: 30, size: [3, 12], opacity: [0.12, 0.4], speed: 0.9, direction: 'up', drift: 0.4, pointer: 'repulse' },
        dust:          { label: 'Dust in the light', shape: 'circle', colors: ['#fff4dc', '#ffe2b0'], count: 90, size: [0.5, 1.8], opacity: [0.1, 0.6], speed: 0.2, drift: 0.3, twinkle: 0.4 },
        orbs:          { label: 'Glow orbs', shape: 'circle', colors: ['accent', '#6aa8ff', '#c38bff'], count: 14, size: [18, 50], opacity: [0.05, 0.18], speed: 0.35, glow: 0.4 },
        warp:          { label: 'Warp speed', shape: 'line', colors: ['#ffffff', '#cfe3ff', 'accent'], count: 0, size: [1, 2], opacity: [0.4, 1], speed: 9, direction: 'outward', emit: { from: 'center', rate: 12 } },
        geometry:      { label: 'Geometry', shape: 'triangle', colors: ['accent', '#ffffff'], count: 40, size: [2, 5], opacity: [0.3, 0.8], speed: 0.6, spin: 0.4, links: { distance: 150, opacity: 0.18 } },
        hearts:        { label: 'Hearts', shape: 'glyph', glyph: '♥', colors: ['#ff6b8a', '#ff9fb3', '#ffd0dc'], count: 26, size: [8, 18], opacity: [0.3, 0.85], speed: 0.8, direction: 'up', drift: 0.6 },
        starlight:     { label: 'Starlight', shape: 'star', colors: ['#ffe58a', '#fff6cf', 'accent'], count: 40, size: [2, 5], opacity: [0.2, 1], speed: 0.3, spin: 0.3, twinkle: 0.8, glow: 0.5 }
    };
    const PARTICLE_WORDS = {};
    Object.entries(PARTICLE_BUILTINS).forEach(([k, v]) => [k, v.label.toLowerCase()].forEach(w => { PARTICLE_WORDS[w] = k; }));
    Object.assign(PARTICLE_WORDS, { stars: 'starfield', 'star field': 'starfield', sparks: 'embers', 'rising sparks': 'embers', snow: 'snowfall', motes: 'dust', 'dust motes': 'dust',
        bokeh: 'orbs', orbs: 'orbs', hyperspace: 'warp', triangles: 'geometry', 'love hearts': 'hearts', 'golden stars': 'starlight' });

    const CONFIG = {
        apiEndpoint: 'https://veritas-quaesitor-production.up.railway.app/chat',
        maxMessageLength: 2000,
        chatsKey: 'vq-app-chats',
        legacyKey: 'vq-app-conversation',
        sidebarStateKey: 'vq-sidebar-state',
        maxChats: 50,
        historySent: 20
    };
    const ICON_VQ_SVG = ICONS.vq;
    Object.defineProperty(ICONS, 'vq', { get: () => (window.VQPortraits && window.VQPortraits.get) ? window.VQPortraits.get('idle', { size: 40 }) : ICON_VQ_SVG });


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
        const continued = importHandoff();
        randomizeRotatingCard();
        attachEventListeners();
        renderSidebar();
        applyTitleStyle();
        applyUIPrefs();
        if (!document.querySelector('.vq-mist')) {
            const mist = el('div', 'vq-mist');
            mist.setAttribute('aria-hidden', 'true');
            mist.innerHTML = '<span class="m1"></span><span class="m2"></span><span class="m3"></span><span class="m4"></span>';
            document.body.appendChild(mist);
            setTimeout(() => mist.classList.add('vq-mist-settled'), 11500);   // after its strong arrival, it stays settled
        }
        if (!document.querySelector('.vq-scene')) {
            const sc = el('div', 'vq-scene');
            sc.setAttribute('aria-hidden', 'true');
            const clouds = Array.from({ length: 7 }, (_, i) => `<span class="cloud c${i + 1}"></span>`).join('');
            sc.innerHTML = `<div class="stars"></div><div class="moon-wrap"><span class="moon-halo"></span><span class="moon"></span></div>` +
                `<div class="sun-wrap"><span class="sun-rays r1"></span><span class="sun-rays r2"></span><span class="sun-halo"></span><span class="sun"></span><span class="horizon"></span></div>` +
                `<div class="sea"><div class="sea-sky"></div><span class="day-sun"></span><div class="glitter"></div><div class="moon-path"></div><svg class="wave w1" viewBox="0 0 400 40" preserveAspectRatio="none"><path class="body" d="M0 18 Q 25 6 50 18 T 100 18 T 150 18 T 200 18 T 250 18 T 300 18 T 350 18 T 400 18 V40 H0Z"/><path class="crest" d="M0 18 Q 25 6 50 18 T 100 18 T 150 18 T 200 18 T 250 18 T 300 18 T 350 18 T 400 18"/></svg><svg class="wave w2" viewBox="0 0 400 40" preserveAspectRatio="none"><path class="body" d="M0 18 Q 25 6 50 18 T 100 18 T 150 18 T 200 18 T 250 18 T 300 18 T 350 18 T 400 18 V40 H0Z"/><path class="crest" d="M0 18 Q 25 6 50 18 T 100 18 T 150 18 T 200 18 T 250 18 T 300 18 T 350 18 T 400 18"/></svg><svg class="wave w3" viewBox="0 0 400 40" preserveAspectRatio="none"><path class="body" d="M0 18 Q 25 6 50 18 T 100 18 T 150 18 T 200 18 T 250 18 T 300 18 T 350 18 T 400 18 V40 H0Z"/><path class="crest" d="M0 18 Q 25 6 50 18 T 100 18 T 150 18 T 200 18 T 250 18 T 300 18 T 350 18 T 400 18"/></svg><svg class="gulls" viewBox="0 0 120 40"><path d="M10 20 q6 -7 12 0 q6 -7 12 0"/><path d="M60 10 q5 -6 10 0 q5 -6 10 0"/><path d="M92 26 q4 -5 8 0 q4 -5 8 0"/></svg></div><div class="clouds">${clouds}</div><div class="rain"></div><div class="flash"></div><svg class="bolt" preserveAspectRatio="none"></svg>`;
            buildRays(sc);
            document.body.appendChild(sc);
            applyScene();
        }
        const signinArrival = new URLSearchParams(location.search).get('signin');
        playIntro(!!(continued || signinArrival));
        renderActiveChat();
        setupPanel();
        setupPanelViews();
        setupAuth();
        // Arriving from the website bubble's "Sign in" button: open the sign-in window once the account check has run
        if (new URLSearchParams(location.search).get('signin')) {
            try { history.replaceState(null, '', location.pathname); } catch (e) {}
            setTimeout(() => { if (!currentUser) openAuthModal(); }, 1500);
        }
        if (window.innerWidth > 768) elements.messageInput.focus();
        const tb = document.getElementById('tour-btn');
        if (tb) tb.addEventListener('click', () => { offerTours('use'); if (window.innerWidth <= 768) document.getElementById('sidebar-scrim')?.click(); });
        headerPortrait('idle'); updateFavicon();
        // the welcome screen's big face is VQ's portrait too (gently alive)
        const wa = document.querySelector('.welcome-avatar, .welcome-icon');
        if (wa && hasPortraits()) { wa.innerHTML = portraitSVG('happy', 96); wa.classList.add('vq-alive', 'has-portrait'); }
        setTimeout(() => { personaReady = true; syncPersonaToSky(); }, 900);
        elements.chatContainer && elements.chatContainer.addEventListener('scroll', personaGuardSoon, { passive: true });
        if (continued) setTimeout(() => showLocalNote('Continued from the website chat'), 700);
        else setTimeout(showFeaturePrompt, sessionStorage.getItem('vq-app-intro-just-played') ? 5200 : 1800);
        // If this tab is already open, a conversation sent from the website bubble arrives live
        window.addEventListener('storage', (e) => {
            if (e.key !== 'vq-handoff' || !e.newValue) return;
            if (importHandoff()) {
                renderSidebar();
                renderActiveChat();
                showLocalNote('Continued from the website chat');
            }
        });
    }

    // A conversation handed over from the website chat bubble ("Open in VQ Chat") becomes a new chat here
    function importHandoff() {
        let h = null;
        try { h = JSON.parse(localStorage.getItem('vq-handoff') || 'null'); localStorage.removeItem('vq-handoff'); } catch (e) { return false; }
        if (!h || !Array.isArray(h.messages) || Date.now() - (h.ts || 0) > 30 * 60 * 1000) return false;
        const msgs = h.messages
            .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
            .slice(-40)
            .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
        if (!msgs.some(m => m.role === 'user')) return false;
        const id = newId();
        store.chats[id] = { id, title: titleFrom(msgs), messages: msgs, updated: Date.now() };
        store.activeId = id;
        conversationHistory = msgs;
        saveStore();
        return true;
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
        store.chats[id] = { id, title: 'New chat', messages: [], created: Date.now(), updated: Date.now() };
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
        elements.charCount.classList.toggle('show', length > CONFIG.maxMessageLength * 0.75);   // phones show it only near the limit
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
                ALLOWED_ATTR: ['href', 'title', 'class'],
                ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i
            });
            const block = document.createElement('div');
            block.className = 'md';
            block.innerHTML = clean;
            // classes are only kept for a code block's language
            block.querySelectorAll('[class]').forEach(n => {
                const lang = n.tagName === 'CODE' && (n.className.match(/\blanguage-[a-z0-9+#-]{1,20}\b/i) || [])[0];
                if (lang) n.className = lang; else n.removeAttribute('class');
            });
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
        return (text || '').replace(/```html\s*([\s\S]*?)```/gi, (m, body) => (/<img/i.test(body) && !/<(script|style|!doctype|body|div|button)/i.test(body)) ? body : m);
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
        enhanceCode(contentDiv);
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
                if (!img && it.url) setTimeout(() => fillCardImage(card, it.url), 0);
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
                // Expanded part: VQ's extra detail plus the actions (no AI call just for opening it)
                const more = el('div', 'pcard-extra');
                if (it.more) more.appendChild(el('p', 'pcard-more-text', str(it.more, 900)));
                const actions = el('div', 'pcard-actions');
                const url = safeHttps(it.url);
                if (url) {
                    const a = el('a', 'pcard-visit', `Visit ${hostOf(url)} ↗`);
                    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
                    a.addEventListener('click', (e) => e.stopPropagation());
                    actions.appendChild(a);
                }
                if (title) {
                    const ask = el('button', 'pcard-ask', 'Ask VQ about this');
                    ask.type = 'button';
                    ask.addEventListener('click', (e) => { e.stopPropagation(); askAbout(title, str(it.subtitle, 120)); });
                    actions.appendChild(ask);
                }
                more.appendChild(actions);
                bodyEl.appendChild(more);
                const toggle = el('span', 'pcard-toggle', 'More ▾');
                bodyEl.appendChild(toggle);
                card.appendChild(bodyEl);
                card.classList.add('clickable');
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.setAttribute('aria-expanded', 'false');
                card.setAttribute('aria-label', `${title}: show more`);
                const flip = () => {
                    const open = !card.classList.contains('expanded');
                    card.classList.toggle('expanded', open);
                    card.setAttribute('aria-expanded', String(open));
                    toggle.textContent = open ? 'Less ▴' : 'More ▾';
                };
                card.addEventListener('click', flip);
                card.addEventListener('keydown', (e) => { if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flip(); } });
                addCardCast(card, title);
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




    // ---------- Opening sequence: VQ powers up, then the app materializes (once per visit, skippable) ----------
    function playIntro(skip) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (skip || reduce || sessionStorage.getItem('vq-app-intro')) { typeWelcomeTitle(true); return; }
        sessionStorage.setItem('vq-app-intro', '1');
        sessionStorage.setItem('vq-app-intro-just-played', '1');
        const o = el('div', 'vq-intro');
        o.setAttribute('aria-hidden', 'true');
        o.innerHTML = `
            <div class="vq-intro-core">
                <div class="vq-intro-ring"><span class="vq-intro-face">${hasPortraits() ? portraitSVG('happy', 128) : ICONS.vq}</span></div>
                <div class="vq-intro-word"><span class="vq-intro-name">Veritas Quaesitor</span><span class="vq-intro-badge">CAI</span></div>
                <div class="vq-intro-line"></div>
            </div>
            <div class="vq-intro-scan"></div><div class="vq-intro-crt"></div>
            <button type="button" class="vq-intro-skip">Skip</button>`;
        document.body.appendChild(o);
        document.body.classList.add('vq-intro-playing');
        // On desktop, VQ himself materialises and waves inside the ring
        let introVQ = null;
        if (window.VQEmbodiment && window.innerWidth > 900) {
            try {
                const stage = el('div', 'vq-intro-vq');
                o.querySelector('.vq-intro-ring').appendChild(stage);
                introVQ = window.VQEmbodiment.mount({ root: stage, src: './vq-full-body.html', mode: 'badge', accent: personaAccent() });
                Promise.resolve(introVQ.play('arrive')).then(r => { if (r && r.ok !== false) o.classList.add('vq-intro-live'); });
                setTimeout(() => o.classList.add('vq-intro-live'), 600);   // the arrival starts invisible, so it can take over straight away
            } catch (e) { introVQ = null; }
        }
        const line = o.querySelector('.vq-intro-line');
        const tagline = 'Anchored in Christ. Same standard for every view.';
        let i = 0, typer = null, done = false;
        const timers = [];
        const finish = () => {
            if (done) return;
            done = true;
            timers.forEach(clearTimeout); clearInterval(typer);
            o.classList.add('vq-intro-out');
            document.body.classList.remove('vq-intro-playing');
            document.body.classList.add('vq-intro-reveal');
            setTimeout(() => { try { if (introVQ) introVQ.dispose(); } catch (e) {} o.remove(); document.body.classList.remove('vq-intro-reveal'); }, 1300);
            typeWelcomeTitle(false);
        };
        timers.push(setTimeout(() => {
            typer = setInterval(() => {
                i++; line.textContent = tagline.slice(0, i);
                if (i >= tagline.length) clearInterval(typer);
            }, 32);
        }, 1150));
        timers.push(setTimeout(finish, 3400));
        o.querySelector('.vq-intro-skip').addEventListener('click', finish);
        o.addEventListener('click', finish);
        document.addEventListener('keydown', finish, { once: true });
    }

    // The welcome title types itself once the app has appeared
    function typeWelcomeTitle(instant) {
        const t = document.querySelector('.welcome-title');
        const ws = document.getElementById('welcome-screen');
        if (!t || !ws || ws.style.display === 'none' || ws.classList.contains('hidden')) return;
        const full = t.textContent;
        if (instant) return;
        t.textContent = '';
        t.classList.add('vq-typing-title');
        let i = 0;
        setTimeout(() => {
            const iv = setInterval(() => {
                i++; t.textContent = full.slice(0, i);
                if (i >= full.length) { clearInterval(iv); setTimeout(() => t.classList.remove('vq-typing-title'), 900); }
            }, 70);
        }, 700);
    }


    // ---------- Two guided tours: "Using VQ Chat" and "Customise your screen" ----------
    // Previews change the look for a moment only; the person's own settings are never saved over.
    const FT_TOURS = {
        use: { name: 'Using VQ Chat', other: 'custom', otherLabel: 'Customise tour', steps: [
            { sel: '#message-input', title: 'Ask anything',
              text: 'Everyday questions, writing, planning, research, or the biggest questions of all. VQ answers from its anchor and holds every view to the same standard. A few short commands work instantly on your device and never use a message.',
              tips: ['bigger', 'smaller', 'focus', 'undo', 'reset'] },
            { sel: '#insight-panel', title: 'Every answer shows its work', panel: true,
              text: 'The Details panel records each answer: what VQ drew on, what it searched and how long it took, how many results the content filter hid, and the standard it applied. Choose Plain for everyday wording or Technical for the full trace, at the bottom of the panel.' },
            { sel: '.suggestion-grid', title: 'Answers in the right shape',
              text: 'Ask for news, books, videos, scholarly papers or a Bible verse and they arrive as cards you can open, with links to the source. Comparisons, timelines, step-by-step guides and quick facts get their own layouts.',
              tips: ['news on AI regulation', 'books on the resurrection', 'what does John 3:16 say?', 'compare the iPhone and Pixel'] },
            { sel: '#input-area', title: 'Paste a link',
              text: 'Paste any web address and VQ reads the page for you: a short explanation in its own words, a card with the page’s title and picture, and a link to the original.',
              tips: ['summarise https://…', 'what’s the catch in this article?'] },
            { sel: '.panel-tab[data-view="notes"]', title: 'Your notes', panel: true,
              text: 'Keep anything worth keeping. Use “Save to notes” under an answer, highlight text to save just that part, or ask VQ. Notes can be edited, are timestamped, sync to your account, and can be exported.',
              tips: ['note that down', 'show my notes'] },
            { sel: '#chat-history', title: 'Your chats',
              text: 'Every conversation is kept here. Start a fresh one with New Chat, come back to any earlier chat, and use the ⋯ menu to export or delete your chats.' },
            { sel: '#account-box', title: 'Keep everything',
              text: 'Sign in free with Google or your email for 30 messages a day (10 as a guest), with your chats, notes and settings saved across all your devices.' },
            { sel: null, title: 'VQ on the website too',
              text: 'On every page of the website, the “Ask VQ” bubble finds things for you and takes you straight to the right page and section. When a conversation grows, “Open in VQ Chat” carries it over to here.' },
            { sel: null, title: 'That’s how it works', end: true,
              text: 'Ask “what can you do?” any time for the full list. Ready to make VQ Chat look your own?' }
        ]},
        custom: { name: 'Customise your screen', other: 'use', otherLabel: 'Using VQ Chat tour', demo: true, steps: [
            { sel: null, title: 'Make it yours',
              text: 'Everything here works by simply asking, in your own words: no settings menus. A sample conversation is on screen so you can see each change happen. Nothing is saved; your own look comes back at the end.' },
            { sel: null, title: 'Living mist', cycle: [['mist', false], ['mist', true]], every: 2000,
              text: 'A soft mist drifts through the background, always in your accent colour. It arrives strong, then settles into gentle, ever-changing wisps. Prefer a still screen? Switch it off.',
              tips: ['mist off', 'mist on'] },
            { sel: null, title: 'Nine themes', every: 2400, cycle: [['theme', 'ocean'], ['theme', 'ember'], ['theme', 'forest'], ['theme', 'plum'], ['theme', 'navy']],
              text: 'Each theme changes the background, panels, icons and glow, and brings a matching accent colour. Watch the mist: it sweeps through in each new theme’s colours. You can still pick a different accent afterwards.',
              tips: ['ocean theme', 'ember', 'forest', 'plum', 'midnight', 'slate', 'charcoal', 'navy', 'classic'] },
            { sel: '.ft-demo', title: 'Accent colours', cycle: [['accent', 'teal'], ['accent', 'rose'], ['accent', 'gold'], ['accent', 'violet']],
              text: 'The accent colours your messages, buttons, highlights and the CAI badge.',
              tips: ['teal accent', 'rose', 'gold', 'violet', 'green', 'blue', 'grey', 'orange'] },
            { sel: '.ft-demo', title: 'Fonts', cycle: [['font', 'script'], ['font', 'retro'], ['font', 'rounded'], ['font', 'classic']],
              text: 'Thirteen fonts for the conversation, from easy-reading to playful. Tables and code stay plain so they remain easy to read.',
              tips: ['readable font', 'cursive font', 'typewriter font', 'rounded font', 'serif', 'handwriting'] },
            { sel: '.ft-demo', title: 'Text size and spacing', cycle: [['scale', 1.25], ['scale', 0.9], ['scale', 1.1], []],
              text: '“Bigger” and “smaller” work instantly and never use a message. You can also ask for more line spacing, a wider chat column, higher contrast, or less motion.',
              tips: ['bigger', 'smaller', 'more line spacing', 'wider chat', 'high contrast', 'reduce motion'] },
            { sel: '.ft-demo', title: 'Bubbles or open layout', cycle: [['bubbles', true], ['bubbles', false]],
              text: 'By default, answers read like a page, with your messages marked by a soft gradient. Prefer classic chat bubbles on both sides? Switch any time.',
              tips: ['bubbles on', 'bubbles off'] },
            { sel: '.ft-demo', title: 'Icon glow', cycle: [['glow', false], ['glow', true]],
              text: 'A soft light sits around the icons and VQ’s avatar, in each theme’s own colour. Turn it off for clean, flat icons.',
              tips: ['glow off', 'glow on'] },
            { sel: null, title: 'Focus mode', every: 2000, cycle: [['focus', true], ['focus', false]],
              text: 'Hides the sidebar, panel and extras, leaving just the conversation. Free, and instant.',
              tips: ['focus', 'unfocus'] },
            { sel: '#panel-options', title: 'The side panel', panel: true,
              cycle: [['panelWidth', 'wide'], []],
              text: 'Make the panel Standard or Wide, or drag its left edge to any width (double-click the edge to reset). Choose Plain or Technical detail for the Details view.',
              tips: ['open the panel', 'wide panel', 'plain details'] },
            { sel: '.ft-demo', title: 'Undo and reset', every: 1500,
              cycle: [['font', 'retro'], []],
              text: 'Changed your mind? “Undo” steps back one change at a time. “Reset” returns everything to the standard look. Both are free. When you’re signed in, your look follows you to every device.',
              tips: ['undo', 'reset'] },
            { sel: null, title: 'Back to your own look', end: true,
              text: 'Everything is exactly as it was. Ask “what can you change?” any time for the full list.' }
        ]}
    };
    let ftKind = null, ftIndex = -1, ftLayer = null, ftSnapshot = null, ftCycle = null;

    const ftPairs = (entry) => !entry.length ? [] : Array.isArray(entry[0]) ? entry : [entry];
    function ftApply(pairs) {
        pairs.forEach(([k, v]) => { uiPrefs[k] = v; if (k === 'theme' && THEME_ACCENT[v]) uiPrefs.accent = THEME_ACCENT[v]; });
        applyUIPrefs();
    }

    function ftDemo(on) {
        const area = elements.messagesArea;
        const old = area.querySelector('.ft-demo');
        if (old) old.remove();
        if (!on) { if (!conversationHistory.length) showWelcomeScreen(); return; }
        hideWelcomeScreen();
        const box = el('div', 'ft-demo');
        const mk = (role, text) => {
            const m = el('div', role === 'user' ? 'message user' : 'message');
            const av = el('div', 'message-avatar'); av.innerHTML = role === 'user' ? ICONS.user : ICONS.vq;
            const body = el('div', 'message-body');
            const c = el('div', 'message-content rich');
            if (role === 'user') c.textContent = text; else c.innerHTML = text;
            body.appendChild(c); m.append(av, body); return m;
        };
        box.appendChild(mk('user', 'What is hope?'));
        box.appendChild(mk('assistant', '<p>Hope is confident expectation: trusting that the dark never gets the last word.</p><ul><li>It looks forward</li><li>It holds steady under pressure</li></ul>'));
        area.appendChild(box);
    }

    function startFeatureTour(kind) {
        if (ftLayer) endFeatureTour(true);
        ftKind = FT_TOURS[kind] ? kind : 'use';
        hideFeaturePrompt();
        elements.messagesArea.querySelectorAll('.ft-offer').forEach(o => o.remove());   // the offer has done its job
        try { localStorage.setItem('vq-feature-tour-seen', '1'); } catch (e) {}
        ftSnapshot = { prefs: JSON.parse(JSON.stringify(uiPrefs)), panelOpen: document.body.classList.contains('insight-open') };
        if (FT_TOURS[ftKind].demo) ftDemo(true);
        ftLayer = el('div', 'ft-layer');
        ftLayer.innerHTML = '<div class="ft-spot"></div><div class="ft-card" role="dialog" aria-live="polite"><div class="ft-step"></div><h3 class="ft-title"></h3><p class="ft-text"></p>' +
            '<div class="ft-extra"></div><div class="ft-dots"></div><div class="ft-nav"><button type="button" class="ft-skip">Skip</button><span></span><button type="button" class="ft-back">Back</button><button type="button" class="ft-next">Next</button></div></div>';
        document.body.appendChild(ftLayer);
        ftLayer.querySelector('.ft-skip').addEventListener('click', () => endFeatureTour());
        ftLayer.querySelector('.ft-back').addEventListener('click', () => showFtStep(ftIndex - 1));
        ftLayer.querySelector('.ft-next').addEventListener('click', () => ftIndex >= FT_TOURS[ftKind].steps.length - 1 ? endFeatureTour() : showFtStep(ftIndex + 1));
        document.addEventListener('keydown', ftKeys);
        window.addEventListener('resize', ftPlace);
        showFtStep(0);
    }

    function ftKeys(e) {
        if (!ftLayer) return;
        if (e.key === 'Escape') endFeatureTour();
        else if (e.key === 'ArrowRight') ftLayer.querySelector('.ft-next').click();
        else if (e.key === 'ArrowLeft' && ftIndex > 0) showFtStep(ftIndex - 1);
    }

    function restoreLook() {
        clearInterval(ftCycle); ftCycle = null;
        Object.keys(uiPrefs).forEach(k => { if (!(k in ftSnapshot.prefs)) delete uiPrefs[k]; });
        Object.assign(uiPrefs, JSON.parse(JSON.stringify(ftSnapshot.prefs)));
        applyUIPrefs();
    }

    function showFtStep(i) {
        const tour = FT_TOURS[ftKind];
        if (i < 0 || i >= tour.steps.length) return;
        ftIndex = i;
        const step = tour.steps[i];
        restoreLook();                                   // every preview starts from the person's own look
        if (step.panel && !document.body.classList.contains('insight-open')) openPanel(false);
        if (!step.panel && !ftSnapshot.panelOpen && document.body.classList.contains('insight-open') && step.sel !== '#panel-options') closePanel(false);
        if (step.set) ftApply(step.set);
        if (step.cycle) {
            let k = 0;
            ftApply(ftPairs(step.cycle[0]));
            ftCycle = setInterval(() => { k = (k + 1) % step.cycle.length; restoreLookKeepCycle(); ftApply(ftPairs(step.cycle[k])); setTimeout(ftPlace, 80); }, step.every || 1700);
        }
        ftLayer.querySelector('.ft-step').textContent = `${tour.name} · ${i + 1} of ${tour.steps.length}`;
        ftLayer.querySelector('.ft-title').textContent = step.title;
        ftLayer.querySelector('.ft-text').textContent = step.text;
        const extra = ftLayer.querySelector('.ft-extra');
        extra.innerHTML = '';
        if (step.tips) {
            const t = el('div', 'ft-tips');
            t.appendChild(el('span', 'ft-tips-label', 'Try saying'));
            step.tips.forEach(x => t.appendChild(el('span', 'ft-tip', `“${x}”`)));
            extra.appendChild(t);
        }
        if (step.end) {
            const b = el('button', 'ft-other', `${tour.otherLabel} →`);
            b.type = 'button';
            b.addEventListener('click', () => startFeatureTour(tour.other));
            extra.appendChild(b);
        }
        ftLayer.querySelector('.ft-back').style.visibility = i === 0 ? 'hidden' : 'visible';
        ftLayer.querySelector('.ft-next').textContent = i === tour.steps.length - 1 ? 'Done' : 'Next';
        ftLayer.querySelector('.ft-dots').innerHTML = tour.steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
        setTimeout(ftPlace, 60);
        setTimeout(ftPlace, 520);          // again once a panel has finished sliding in
        ftLayer.querySelector('.ft-next').focus();
    }
    function restoreLookKeepCycle() {
        Object.assign(uiPrefs, JSON.parse(JSON.stringify(ftSnapshot.prefs)));
    }

    function ftPlace() {
        if (!ftLayer) return;
        const step = FT_TOURS[ftKind].steps[ftIndex];
        const spot = ftLayer.querySelector('.ft-spot'), card = ftLayer.querySelector('.ft-card');
        const target = step.sel ? [...document.querySelectorAll(step.sel)].find(n => n.offsetParent !== null && n.getBoundingClientRect().width > 0) : null;
        const vw = window.innerWidth, vh = window.innerHeight;
        ftLayer.classList.toggle('ft-open', !target);
        // The card is docked in a corner, so it never jumps around or slides off screen
        const narrow = vw <= 640;
        let corner = narrow ? 'bottom' : 'bottom-right';
        if (target) {
            const r = target.getBoundingClientRect(), pad = 8;
            const x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad);
            const w = Math.min(vw - x - 4, r.width + pad * 2), h = Math.min(vh - y - 4, r.height + pad * 2);
            spot.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
            const cardW = Math.min(380, vw - 32), cardH = Math.min(card.offsetHeight || 260, vh - 32);
            const overlaps = (cx, cy) => !(cx + cardW < x || cx > x + w || cy + cardH < y || cy > y + h);
            if (narrow) corner = overlaps(12, vh - cardH - 12) ? 'top' : 'bottom';
            else if (overlaps(vw - cardW - 24, vh - cardH - 24)) corner = overlaps(vw - cardW - 24, 24) ? 'bottom-left' : 'top-right';
        } else {
            spot.style.cssText = `left:${vw / 2}px;top:${vh / 2}px;width:0;height:0;`;
        }
        card.dataset.corner = corner;
    }

    function endFeatureTour(switching) {
        if (!ftLayer) return;
        restoreLook();
        ftDemo(false);
        if (!ftSnapshot.panelOpen && document.body.classList.contains('insight-open')) closePanel(false);
        ftLayer.remove(); ftLayer = null; ftIndex = -1;
        document.removeEventListener('keydown', ftKeys);
        window.removeEventListener('resize', ftPlace);
    }

    // First visit: a small invitation offering both tours (once per device)
    function showFeaturePrompt() {
        if (localStorage.getItem('vq-feature-tour-seen') || document.querySelector('.ft-prompt')) return;
        const p = el('div', 'ft-prompt');
        p.setAttribute('role', 'status');
        p.innerHTML = '<span><b>New here?</b> Two quick tours:</span><button type="button" class="ft-go" data-k="use">Using VQ Chat</button>' +
            '<button type="button" class="ft-go ft-go-alt" data-k="custom">Customise</button><button type="button" class="ft-no" aria-label="Not now">✕</button>';
        p.querySelectorAll('.ft-go').forEach(b => b.addEventListener('click', () => startFeatureTour(b.dataset.k)));
        p.querySelector('.ft-no').addEventListener('click', () => { hideFeaturePrompt(); try { localStorage.setItem('vq-feature-tour-seen', '1'); } catch (e) {} });
        document.body.appendChild(p);
    }
    function hideFeaturePrompt() { const p = document.querySelector('.ft-prompt'); if (p) p.remove(); }

    // A small card in the chat offering the tours; nothing starts until the person chooses
    function tourButtons(preferred) {
        const row = el('div', 'ft-choice');
        const order = preferred === 'custom' ? ['custom', 'use'] : ['use', 'custom'];
        order.forEach((k, i) => {
            const b = el('button', i === 0 ? 'ft-choice-main' : 'ft-choice-alt', k === 'use' ? 'Using VQ Chat tour' : 'Customise tour');
            b.type = 'button';
            b.addEventListener('click', () => startFeatureTour(k));
            row.appendChild(b);
        });
        return row;
    }
    function offerTours(preferred) {
        elements.messagesArea.querySelectorAll('.ft-offer').forEach(o => o.remove());   // only one offer at a time
        hideWelcomeScreen();
        elements.chatContainer.classList.add('has-messages');
        const box = el('div', 'ft-offer');
        box.setAttribute('role', 'status');
        box.appendChild(el('div', 'ft-offer-title', preferred === 'custom' ? 'Want a quick tour of customising your screen?' : 'Want a quick tour of how VQ Chat works?'));
        box.appendChild(el('div', 'ft-offer-text', 'About a minute, with live previews. Nothing is changed or saved; your own look comes back at the end.'));
        box.appendChild(tourButtons(preferred));
        const no = el('button', 'ft-offer-no', 'Not now'); no.type = 'button';
        no.addEventListener('click', () => { box.remove(); if (!conversationHistory.length) showWelcomeScreen(); });
        box.appendChild(no);
        elements.messagesArea.appendChild(box);
        box.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }



    // ---------- Code blocks: Copy, and Run in the side panel (VQ Run: sandboxed, on this device only) ----------
    const RUN_LANG = { html: 'html', xml: null, css: 'css', javascript: 'javascript', js: 'javascript', python: 'python', py: 'python', json: 'json', csv: 'csv' };
    let runner = null;
    function disposeRunner() { try { if (runner) runner.dispose(); } catch (e) {} runner = null; }
    function enhanceCode(contentDiv) {
        contentDiv.querySelectorAll('pre > code').forEach(code => {
            const pre = code.parentElement;
            if (pre.querySelector('.code-actions')) return;
            const lang = ((code.className.match(/language-([a-z0-9+#-]+)/i) || [])[1] || '').toLowerCase();
            const bar = el('div', 'code-actions');
            if (lang) bar.appendChild(el('span', 'code-lang', lang));
            const copy = el('button', 'code-btn', 'Copy'); copy.type = 'button';
            copy.addEventListener('click', () => navigator.clipboard?.writeText(code.textContent).then(() => { copy.textContent = 'Copied'; setTimeout(() => copy.textContent = 'Copy', 1400); }));
            bar.appendChild(copy);
            const runLang = RUN_LANG[lang];
            if (runLang && window.VQRun) {
                const run = el('button', 'code-btn code-run', '▶ Run'); run.type = 'button';
                run.title = runLang === 'python' ? 'Runs in your browser. The first Python run downloads about 26 MB once.' : 'Runs safely in your browser, shown in the side panel';
                run.addEventListener('click', () => runCode(runLang, code.textContent));
                bar.appendChild(run);
            }
            pre.prepend(bar);
        });
    }
    function runCode(language, source) {
        castInto(`Running ${language === 'javascript' ? 'JavaScript' : language === 'python' ? 'Python' : language.toUpperCase()}`, (stage) => {
            disposeRunner();
            const box = el('div', 'run-box');
            stage.appendChild(box);
            try {
                runner = window.VQRun.create({ root: box });
                runner.run({ language, code: source }).then(r => { if (r && !r.ok && r.error) console.warn('Run:', r.error); });
            } catch (e) { box.textContent = 'This code couldn’t be run here: ' + e.message; }
        });
    }

    // ---------- Cast to panel: watch a video, browse pictures or keep a card open beside the chat ----------
    const CAST_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6"/><path d="M3 13a6 6 0 0 1 6 6M3 17a2 2 0 0 1 2 2"/></svg>';
    function castButton(onCast, label) {
        const b = el('button', 'cast-btn');
        b.type = 'button';
        b.innerHTML = CAST_ICON;
        b.title = label || 'Show in the side panel';
        b.setAttribute('aria-label', label || 'Show in the side panel');
        b.addEventListener('click', (e) => { e.stopPropagation(); onCast(); });
        return b;
    }

    function castInto(title, buildContent) {
        disposeRunner();
        const body = document.getElementById('cast-body');
        const tab = document.querySelector('.cast-tab');
        if (!body || !tab) return;
        body.innerHTML = '';
        const head = el('div', 'cast-head');
        head.appendChild(el('span', 'cast-title', title));
        const stop = el('button', 'cast-stop', 'Stop showing');
        stop.type = 'button';
        stop.addEventListener('click', stopCasting);
        head.appendChild(stop);
        body.appendChild(head);
        const stage = el('div', 'cast-stage');
        body.appendChild(stage);
        buildContent(stage);
        tab.hidden = false;
        document.body.classList.add('casting');
        if (!document.body.classList.contains('insight-open')) openPanel(false);
        setPanelView('cast', false);
        setTimeout(() => personaPoint(document.getElementById('insight-panel')), 350);
    }

    function stopCasting() {
        disposeRunner();
        const body = document.getElementById('cast-body');
        if (body) body.innerHTML = '';                   // also stops any playing video
        const tab = document.querySelector('.cast-tab');
        if (tab) tab.hidden = true;
        document.body.classList.remove('casting', 'casting-view');
        setPanelView('details', false);
    }

    function castVideo(v) {
        castInto(str(v.title, 120), (stage) => {
            const frame = el('div', 'cast-video');
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`;
            iframe.title = str(v.title, 120);
            iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            frame.appendChild(iframe);
            stage.appendChild(frame);
            const meta = el('div', 'cast-meta');
            meta.appendChild(el('div', 'cast-sub', [str(v.channel, 60), str(v.published, 10)].filter(Boolean).join(' · ')));
            if (v.description) meta.appendChild(el('p', 'cast-text', str(v.description, 300)));
            const a = el('a', 'pcard-visit', 'Watch on YouTube ↗');
            a.href = `https://www.youtube.com/watch?v=${v.id}`; a.target = '_blank'; a.rel = 'noopener noreferrer';
            meta.appendChild(a);
            stage.appendChild(meta);
        });
    }

    function castGallery(images, start) {
        const list = images.filter(im => { try { return new URL(im.url).protocol === 'https:'; } catch (e) { return false; } });
        if (!list.length) return;
        castInto('Pictures', (stage) => {
            let i = Math.min(start || 0, list.length - 1);
            const view = el('div', 'cast-photo');
            const img = document.createElement('img');
            img.referrerPolicy = 'no-referrer';
            const cap = el('div', 'cast-sub');
            const prev = el('button', 'cast-nav prev', '‹'), next = el('button', 'cast-nav next', '›');
            prev.type = next.type = 'button';
            prev.setAttribute('aria-label', 'Previous picture'); next.setAttribute('aria-label', 'Next picture');
            const strip = el('div', 'cast-strip');
            const show = (k) => {
                i = (k + list.length) % list.length;
                img.src = list[i].url; img.alt = list[i].description || '';
                cap.textContent = [list[i].description, hostOf(list[i].url)].filter(Boolean).join(' · ');
                strip.querySelectorAll('button').forEach((b, n) => b.classList.toggle('on', n === i));
            };
            prev.addEventListener('click', () => show(i - 1));
            next.addEventListener('click', () => show(i + 1));
            list.forEach((im, n) => {
                const t = el('button', 'cast-thumb'); t.type = 'button';
                const ti = document.createElement('img'); ti.src = im.url; ti.alt = ''; ti.loading = 'lazy'; ti.referrerPolicy = 'no-referrer';
                ti.onerror = () => t.remove();
                t.appendChild(ti); t.addEventListener('click', () => show(n));
                strip.appendChild(t);
            });
            view.append(img, prev, next);
            stage.append(view, cap, strip);
            show(i);
        });
    }

    // Any card (film, book, news, paper, layout card) can be pinned open in the panel
    function castCard(card, title) {
        castInto(title || 'Pinned card', (stage) => {
            const copy = card.cloneNode(true);
            copy.classList.add('expanded', 'cast-card');
            copy.querySelectorAll('.cast-btn, .pcard-toggle').forEach(n => n.remove());
            copy.removeAttribute('tabindex'); copy.removeAttribute('role');
            // cloned buttons lose their handlers: re-attach the ones that matter
            copy.querySelectorAll('.pcard-ask').forEach(b => {
                if (b.tagName === 'BUTTON') b.addEventListener('click', () => askAbout(title || '', ''));
            });
            copy.querySelectorAll('button.pcard-visit').forEach(b => b.addEventListener('click', () => askAbout(`the trailer for ${title}`, '')));
            stage.appendChild(copy);
        });
    }
    function addCardCast(card, titleText) {
        card.appendChild(castButton(() => castCard(card, titleText), 'Pin this card in the side panel'));
    }

    // ---------- News, Scripture and scholarly-paper cards ----------
    function expandable(card, toggleEl) {
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-expanded', 'false');
        const flip = () => {
            const open = !card.classList.contains('expanded');
            card.classList.toggle('expanded', open);
            card.setAttribute('aria-expanded', String(open));
            toggleEl.textContent = open ? 'Less ▴' : 'More ▾';
        };
        card.addEventListener('click', flip);
        card.addEventListener('keydown', (e) => { if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flip(); } });
    }
    function cardActions(url, linkLabel, askTitle, askSub) {
        const actions = el('div', 'pcard-actions');
        const u = safeHttps(url);
        if (u) {
            const a = el('a', 'pcard-visit', linkLabel);
            a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
            a.addEventListener('click', (e) => e.stopPropagation());
            actions.appendChild(a);
        }
        const ask = el('button', 'pcard-ask', 'Ask VQ about this');
        ask.type = 'button';
        ask.addEventListener('click', (e) => { e.stopPropagation(); askAbout(askTitle, askSub); });
        actions.appendChild(ask);
        return actions;
    }
    function friendlyDate(d) {
        const t = Date.parse(d || '');
        return isNaN(t) ? '' : new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function buildNewsRow(items) {
        const wrap = el('div', 'media-row');
        wrap.appendChild(el('div', 'present-title', 'News'));
        const grid = el('div', 'news-grid');
        items.slice(0, 6).forEach(n => {
            if (!n || !n.title) return;
            const card = el('div', 'news-card');
            // The article's own image, or a quiet themed placeholder so every card in the row lines up
            const placeholder = () => {
                const ph = el('div', 'news-img news-img-none');
                ph.appendChild(el('span', null, (str(n.source, 40) || 'News').replace(/\..*$/, '')));
                return ph;
            };
            const img = safeHttps(n.image);
            if (img) {
                const im = document.createElement('img');
                im.className = 'news-img'; im.src = img; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer';
                im.onerror = () => im.replaceWith(placeholder());
                card.appendChild(im);
            } else {
                card.appendChild(placeholder());
            }
            const top = el('div', 'news-top');
            top.appendChild(el('span', 'news-source', str(n.source, 60)));
            const d = friendlyDate(n.date);
            if (d) top.appendChild(el('span', 'news-date', d));
            card.appendChild(top);
            card.appendChild(el('div', 'news-title', str(n.title, 200)));
            const extra = el('div', 'news-extra');
            if (n.summary) extra.appendChild(el('p', 'pcard-more-text', str(n.summary, 420)));
            extra.appendChild(cardActions(n.url, `Read on ${str(n.source, 40) || 'the site'} ↗`, str(n.title, 120), str(n.source, 60)));
            card.appendChild(extra);
            const toggle = el('span', 'pcard-toggle', 'More ▾');
            card.appendChild(toggle);
            expandable(card, toggle);
            addCardCast(card, str(n.title, 120));
            grid.appendChild(card);
        });
        wrap.appendChild(grid);
        return wrap;
    }

    function buildVerseCards(items) {
        const wrap = el('div', 'media-row verse-row');
        items.slice(0, 3).forEach(v => {
            if (!v || !v.text) return;
            const card = el('figure', 'verse-card');
            card.appendChild(el('blockquote', 'verse-text', str(v.text, 2400)));
            const cap = el('figcaption', 'verse-ref');
            cap.appendChild(el('span', 'verse-name', str(v.reference, 60)));
            cap.appendChild(el('span', 'verse-tr', str(v.translation, 60)));
            const u = safeHttps(v.url);
            if (u) {
                const a = el('a', 'verse-link', 'Read in context ↗');
                a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
                cap.appendChild(a);
            }
            card.appendChild(cap);
            wrap.appendChild(card);
        });
        return wrap;
    }

    function buildPaperRow(items) {
        const wrap = el('div', 'media-row');
        wrap.appendChild(el('div', 'present-title', 'Scholarly sources'));
        const list = el('div', 'paper-list');
        items.slice(0, 6).forEach(p => {
            if (!p || !p.title) return;
            const card = el('div', 'paper-card');
            card.appendChild(el('div', 'paper-title', str(p.title, 220)));
            const meta = [str(p.authors, 140), str(p.year, 4), str(p.venue, 100)].filter(Boolean).join(' · ');
            card.appendChild(el('div', 'paper-meta', meta));
            if (p.cited) card.appendChild(el('span', 'paper-cited', `Cited ${Number(p.cited).toLocaleString()} times`));
            const extra = el('div', 'news-extra');
            if (p.abstract) extra.appendChild(el('p', 'pcard-more-text', str(p.abstract, 600) + (String(p.abstract).length > 590 ? '…' : '')));
            extra.appendChild(cardActions(p.url, 'Open the paper ↗', str(p.title, 120), str(p.authors, 80)));
            card.appendChild(extra);
            const toggle = el('span', 'pcard-toggle', 'More ▾');
            card.appendChild(toggle);
            expandable(card, toggle);
            addCardCast(card, str(p.title, 120));
            list.appendChild(card);
        });
        wrap.appendChild(list);
        return wrap;
    }


    // ---------- Films and TV (TMDB): poster cards with the official age rating ----------
    function buildMovieRow(items) {
        const wrap = el('div', 'media-row');
        wrap.appendChild(el('div', 'present-title', 'Films and shows'));
        const grid = el('div', 'movie-grid');
        items.slice(0, 6).forEach(m => {
            if (!m || !m.title) return;
            const card = el('div', 'movie-card');
            const pv = el('div', 'movie-poster');
            const src = safeHttps(m.poster);
            if (src) {
                const im = document.createElement('img');
                im.src = src; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer';
                im.onerror = () => { im.remove(); pv.textContent = str(m.title, 40); pv.classList.add('none'); };
                pv.appendChild(im);
            } else { pv.textContent = str(m.title, 40); pv.classList.add('none'); }
            if (m.cert) pv.appendChild(el('span', 'movie-cert', str(m.cert, 8)));
            card.appendChild(pv);
            const body = el('div', 'movie-body');
            body.appendChild(el('div', 'movie-title', str(m.title, 120)));
            const meta = [str(m.year, 4), m.runtime ? `${m.runtime} min` : '', m.rating ? `★ ${m.rating}` : ''].filter(Boolean).join(' · ');
            if (meta) body.appendChild(el('div', 'movie-meta', meta));
            if (m.genres) body.appendChild(el('div', 'movie-genres', str(m.genres, 80)));
            const extra = el('div', 'news-extra');
            if (m.overview) extra.appendChild(el('p', 'pcard-more-text', str(m.overview, 700)));
            const actions = el('div', 'pcard-actions');
            const tr = el('button', 'pcard-visit', 'Watch the trailer');
            tr.type = 'button';
            tr.addEventListener('click', (e) => { e.stopPropagation(); askAbout(`the trailer for ${str(m.title, 100)}${m.year ? ' (' + m.year + ')' : ''}`); });
            actions.appendChild(tr);
            const u = safeHttps(m.url);
            if (u) {
                const a = el('a', 'pcard-ask', 'Details ↗');
                a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.addEventListener('click', (e) => e.stopPropagation());
                actions.appendChild(a);
            }
            extra.appendChild(actions);
            body.appendChild(extra);
            const toggle = el('span', 'pcard-toggle', 'More ▾');
            body.appendChild(toggle);
            card.appendChild(body);
            expandable(card, toggle);
            addCardCast(card, str(m.title, 120));
            grid.appendChild(card);
        });
        wrap.appendChild(grid);
        wrap.appendChild(el('div', 'movie-credit', 'Film data and posters from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.'));
        return wrap;
    }

    // Cards from the web without a picture: ask the backend for the linked page's preview image
    const previewCache = {};
    function fillCardImage(card, url) {
        const u = safeHttps(url);
        if (!u) return;
        const apply = (img) => {
            if (!img || card.querySelector('img')) return;
            const im = document.createElement('img');
            im.src = img; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer';
            im.onerror = () => im.remove();
            card.insertBefore(im, card.firstChild);
        };
        if (u in previewCache) { previewCache[u].then(apply); return; }
        previewCache[u] = fetch(CONFIG.apiEndpoint.replace(/\/chat$/, '/preview-image') + '?url=' + encodeURIComponent(u))
            .then(r => r.ok ? r.json() : {}).then(d => safeHttps(d.image || '')).catch(() => null);
        previewCache[u].then(apply);
    }

    // ---------- YouTube videos and Google Books as cards ----------
    function buildVideoRow(videos) {
        const wrap = el('div', 'media-row');
        wrap.appendChild(el('div', 'present-title', 'Videos'));
        const grid = el('div', 'video-grid');
        videos.slice(0, 6).forEach(v => {
            if (!v || !/^[A-Za-z0-9_-]{6,20}$/.test(v.id || '')) return;
            const card = el('button', 'video-card');
            card.type = 'button';
            card.setAttribute('aria-label', `Play: ${str(v.title, 120)}`);
            const th = el('div', 'video-thumb');
            const img = document.createElement('img');
            img.src = safeHttps(v.thumbnail) || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
            img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
            th.appendChild(img);
            th.appendChild(el('span', 'video-play', '▶'));
            card.appendChild(th);
            const b = el('div', 'video-body');
            b.appendChild(el('span', 'video-title', str(v.title, 120)));
            b.appendChild(el('span', 'video-meta', [str(v.channel, 60), str(v.published, 10)].filter(Boolean).join(' · ')));
            card.appendChild(b);
            card.addEventListener('click', () => (window.innerWidth >= 1100 ? castVideo(v) : openVideo(v)));
            th.appendChild(castButton(() => castVideo(v), 'Play in the side panel'));
            grid.appendChild(card);
        });
        wrap.appendChild(grid);
        return wrap;
    }

    function openVideo(v) {
        closeTableView();
        const overlay = el('div', 'table-overlay video-overlay');
        overlay.id = 'table-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', str(v.title, 120));
        const box = el('div', 'video-view');
        const close = el('button', 'table-overlay-close', '×');
        close.type = 'button'; close.setAttribute('aria-label', 'Close');
        close.addEventListener('click', closeTableView);
        const frameWrap = el('div', 'video-frame');
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`;
        iframe.title = str(v.title, 120);
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        frameWrap.appendChild(iframe);
        const cap = el('div', 'video-caption');
        cap.appendChild(el('span', 'video-title', str(v.title, 160)));
        const watch = el('a', 'pcard-visit', 'Watch on YouTube ↗');
        watch.href = `https://www.youtube.com/watch?v=${v.id}`; watch.target = '_blank'; watch.rel = 'noopener noreferrer';
        cap.appendChild(watch);
        box.append(close, frameWrap, cap);
        overlay.appendChild(box);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeTableView(); });
        document.body.appendChild(overlay);
        close.focus();
    }

    function buildBookRow(books) {
        const wrap = el('div', 'media-row');
        wrap.appendChild(el('div', 'present-title', 'Books'));
        const grid = el('div', 'book-grid');
        books.slice(0, 6).forEach(bk => {
            if (!bk || !bk.title) return;
            const card = el('div', 'book-card');
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-expanded', 'false');
            const cover = safeHttps(bk.cover);
            const cv = el('div', 'book-cover');
            if (cover) {
                const img = document.createElement('img');
                img.src = cover; img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
                img.onerror = () => { img.remove(); cv.textContent = '📖'; };
                cv.appendChild(img);
            } else { cv.textContent = '📖'; }
            card.appendChild(cv);
            const b = el('div', 'book-body');
            b.appendChild(el('span', 'book-title', str(bk.title, 160)));
            b.appendChild(el('span', 'book-meta', [str(bk.authors, 100), str(bk.year, 4)].filter(Boolean).join(' · ')));
            const extra = el('div', 'book-extra');
            if (bk.description) extra.appendChild(el('p', 'pcard-more-text', str(bk.description, 700)));
            const actions = el('div', 'pcard-actions');
            const url = safeHttps(bk.url);
            if (url) {
                const a = el('a', 'pcard-visit', 'View on Google Books ↗');
                a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.addEventListener('click', (e) => e.stopPropagation());
                actions.appendChild(a);
            }
            const ask = el('button', 'pcard-ask', 'Ask VQ about this book');
            ask.type = 'button';
            ask.addEventListener('click', (e) => { e.stopPropagation(); askAbout(str(bk.title, 120), str(bk.authors, 80)); });
            actions.appendChild(ask);
            extra.appendChild(actions);
            b.appendChild(extra);
            const toggle = el('span', 'pcard-toggle', 'More ▾');
            b.appendChild(toggle);
            card.appendChild(b);
            const flip = () => {
                const open = !card.classList.contains('expanded');
                card.classList.toggle('expanded', open);
                card.setAttribute('aria-expanded', String(open));
                toggle.textContent = open ? 'Less ▴' : 'More ▾';
            };
            card.addEventListener('click', flip);
            card.addEventListener('keydown', (e) => { if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flip(); } });
            addCardCast(card, str(bk.title, 120));
            grid.appendChild(card);
        });
        wrap.appendChild(grid);
        return wrap;
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
                if (Array.isArray(meta.videos) && meta.videos.length) body.insertBefore(buildVideoRow(meta.videos), body.querySelector('.message-actions'));
                if (Array.isArray(meta.books) && meta.books.length) body.insertBefore(buildBookRow(meta.books), body.querySelector('.message-actions'));
                if (Array.isArray(meta.verses) && meta.verses.length) body.insertBefore(buildVerseCards(meta.verses), body.querySelector('.message-actions'));
                if (Array.isArray(meta.news) && meta.news.length) body.insertBefore(buildNewsRow(meta.news), body.querySelector('.message-actions'));
                if (Array.isArray(meta.papers) && meta.papers.length) body.insertBefore(buildPaperRow(meta.papers), body.querySelector('.message-actions'));
                if (Array.isArray(meta.movies) && meta.movies.length) body.insertBefore(buildMovieRow(meta.movies), body.querySelector('.message-actions'));
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
        if (isBigQuestion(meta)) return 'Anchor stated · same standard for every view';
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
        if (wrap.childElementCount) wrap.appendChild(castButton(() => castGallery(images, 0), 'Show these pictures in the side panel'));
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
            const unit = /YouTube/.test(st.label) ? 'videos' : /Books/.test(st.label) ? 'books' : /news/i.test(st.label) ? 'articles'
                       : /papers/i.test(st.label) ? 'papers' : /Scripture/.test(st.label) ? 'passage' : /films/i.test(st.label) ? 'titles' : 'sources';
            const filt = st.filtered ? ` · ${st.filtered} hidden by the content filter` : '';
            ol.appendChild(codeLine(++n, v, r, `${q}${k ? `${k} ${k === 1 ? unit.replace(/s$/, '') : unit} found` : 'no usable results'}${pics}${filt}`, st.ms));
        });
        if (!(meta.steps || []).some(st => st.kind === 'live')) {
            (meta.live || []).filter(x => /weather|time|image/i.test(x)).forEach(x => ol.appendChild(codeLine(++n, 'Fetched', x.toLowerCase())));
        }
        (meta.ui || []).forEach(u => ol.appendChild(codeLine(++n, 'Changed', 'your screen', u, null, { detailClass: 'tk-fn' })));
        if (isBigQuestion(meta)) ol.appendChild(codeLine(++n, 'Answered', 'with the anchor stated openly', 'naturalism named as a view, not the default', null, { restClass: 'tk-fn' }));
        const tm = rec.timing || {};
        ol.appendChild(codeLine(++n, 'Wrote', 'the answer', typeof tm.firstMs === 'number' && tm.firstMs >= 100 ? `first words after ${(tm.firstMs / 1000).toFixed(1)}s` : null, tm.totalMs));
        art.appendChild(ol);

        if (isBigQuestion(meta)) {
            const sp = el('div', 'entry-block');
            sp.appendChild(el('span', 'tk-com', '// the anchor'));
            sp.appendChild(el('p', null, 'VQ states its anchor openly: reality is created and held in being by God, a conclusion CAI reaches because the evidence, weighed by the same standard as any other view, supports it. Naturalism is a view too, and VQ names it rather than treating it as the neutral default.'));
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
            box.appendChild(el('p', null, 'Each answer adds an entry here: what VQ drew on, what it searched, the sources it found, and the standard it applied.'));
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
                          panelView: 'details', panelWidth: 'standard', panelDetail: 'technical', title: 'inscription', bubbles: false, theme: 'vq', glow: true };
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
        // Default: the original near-black Midnight look
        vq:       ['#0e0e0e', '#121212', 'rgba(28, 28, 28, 0.85)', '#1b1b1b', 'rgba(255,255,255,0.09)', 'rgba(255,255,255,0.05)', '#ececec'],
        // The previous default: warm charcoal on desktop, deep navy on phones (from the stylesheet)
        classic:  null,
        navy:     ['#0d0e2b', '#0b0c26', 'rgba(26, 28, 78, 0.78)', '#151640', 'rgba(150,160,255,0.13)', 'rgba(150,160,255,0.07)', '#e8e9fb'],
        charcoal: ['#2a2622', '#26221e', 'rgba(58, 50, 42, 0.82)', '#332d27', 'rgba(255,220,180,0.11)', 'rgba(255,220,180,0.05)', '#efe9e2'],
        midnight: ['#0b0b10', '#0f0f15', 'rgba(26, 26, 36, 0.86)', '#1a1a24', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.05)', '#ececf2'],
        ocean:    ['#06202e', '#051b27', 'rgba(10, 50, 72, 0.82)', '#0b2c40', 'rgba(110,210,240,0.16)', 'rgba(110,210,240,0.07)', '#e2f3f8'],
        forest:   ['#0d1f14', '#0b1a11', 'rgba(20, 52, 33, 0.82)', '#14301f', 'rgba(140,225,165,0.15)', 'rgba(140,225,165,0.06)', '#e4f2e8'],
        ember:    ['#25130d', '#20100a', 'rgba(62, 28, 18, 0.82)', '#361c12', 'rgba(255,170,120,0.15)', 'rgba(255,170,120,0.06)', '#f6e8e1'],
        slate:    ['#1a2030', '#171c2a', 'rgba(38, 48, 70, 0.82)', '#232b3d', 'rgba(170,190,230,0.14)', 'rgba(170,190,230,0.06)', '#e8edf6'],
        plum:     ['#1f1030', '#1b0d2a', 'rgba(50, 24, 74, 0.82)', '#2b1742', 'rgba(225,175,255,0.15)', 'rgba(225,175,255,0.06)', '#f1e7f8']
    };
    // Each theme comes with an accent colour that complements it (the user can still pick another accent afterwards)
    const THEME_ACCENT = { vq: 'orange', classic: 'orange', navy: 'gold', charcoal: 'teal', midnight: 'rose', ocean: 'orange',
                           forest: 'gold', ember: 'teal', slate: 'violet', plum: 'rose' };


    // ---------- VQ's own themes: designed from a description, checked for readability, saved and shareable ----------
    const hexRgb = (h) => { h = String(h || '').replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0); };
    const rgbHex = (c) => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    const mixHex = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };
    const lumOf = (h) => { const c = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const contrastOf = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const isHex = (v) => typeof v === 'string' && /^#?[0-9a-f]{6}$/i.test(v.trim());

    // Make any design readable: a dark background, clearly readable text, visible accents and icons
    function fixTheme(raw) {
        const fixes = [];
        const s = {};
        s.name = String(raw.name || 'My theme').replace(/[^\w '\-&]/g, '').slice(0, 28).trim() || 'My theme';
        s.background = isHex(raw.background) ? '#' + raw.background.replace('#', '').toLowerCase() : '#101418';
        let guard = 0;
        while (lumOf(s.background) > 0.035 && guard++ < 40) s.background = mixHex(s.background, '#000000', 0.12);
        if (guard > 0) fixes.push('darkened the background');
        s.surface = isHex(raw.surface) ? '#' + raw.surface.replace('#', '').toLowerCase() : mixHex(s.background, '#ffffff', 0.07);
        guard = 0; while (lumOf(s.surface) > 0.07 && guard++ < 40) s.surface = mixHex(s.surface, '#000000', 0.12);
        if (contrastOf(s.surface, s.background) < 1.08) s.surface = mixHex(s.background, '#ffffff', 0.07);
        const lift = (key, fallback, min, label) => {
            let c = isHex(raw[key]) ? '#' + raw[key].replace('#', '').toLowerCase() : fallback;
            let g = 0, changed = false;
            while (contrastOf(c, s.background) < min && g++ < 40) { c = mixHex(c, '#ffffff', 0.12); changed = true; }
            if (changed && isHex(raw[key])) fixes.push(label);
            s[key] = c;
        };
        lift('text', '#ececec', 7, 'brightened the text');
        lift('accent', '#ff8c42', 3.2, 'brightened the accent');
        lift('accent2', mixHex(s.accent, '#ffffff', 0.35), 4.5, 'brightened the second accent');
        lift('icon', s.accent2, 4.5, 'brightened the icons');
        if (SKY_KEYS.includes(raw.scene)) s.scene = raw.scene;
        if (raw.particles) { const pc = cleanParticles(raw.particles); if (pc) s.particles = pc; }
        const fxIn = Array.isArray(raw.effects) ? raw.effects : String(raw.effects || '').split(',');
        s.effects = [...new Set(fxIn.map(x => String(x).trim().toLowerCase()).filter(x => FX_LIST.includes(x)))].slice(0, 4);
        const okParam = (k, v) => /^[a-z]{2,14}$/i.test(k) && (typeof v === 'number' && isFinite(v) || typeof v === 'boolean' || (typeof v === 'string' && v.length <= 12));
        s.art = (Array.isArray(raw.art) ? raw.art : []).filter(e => e && ART_TYPES.includes(e.type)).slice(0, 8).map(e => {
            const o = { type: e.type };
            ['species', 'style', 'kind', 'area'].forEach(k => { if (typeof e[k] === 'string' && /^[a-z\-]{2,20}$/.test(e[k])) o[k] = e[k]; });
            ['count', 'size', 'speed', 'density'].forEach(k => { if (typeof e[k] === 'number' && isFinite(e[k])) o[k] = e[k]; });
            if (Array.isArray(e.colors) && e.type !== 'assembly') o.colors = e.colors.filter(isHex).slice(0, 6).map(c => '#' + c.replace('#', ''));
            if (['near', 'mid', 'far', 'auto'].includes(e.depth)) o.depth = e.depth;
            // Arranged by hand: where each one stands (fractions of the scene)
            if (Array.isArray(e.positions)) o.positions = e.positions.slice(0, 80).map(p => Array.isArray(p) && p.length === 2 && p.every(v => typeof v === 'number' && v >= 0 && v <= 1) ? [p[0], p[1]] : null);
            if (e.type === 'assembly') {   // an animal from the parts kit: the scene engine checks the recipe in full
                if (typeof e.name === 'string') o.name = e.name.replace(/[^\w '\-]/g, '').slice(0, 40) || 'animal';
                if (e.social && typeof e.social === 'object' && ['chase', 'flee', 'follow', 'play', 'herd'].includes(e.social.kind))
                    o.social = { kind: e.social.kind, target: String(e.social.target || '').slice(0, 40), style: e.social.style === 'hunt' ? 'hunt' : 'playful' };
                if (e.pointer === 'chase' || e.pointer === 'flee') o.pointer = e.pointer;
                ['rig', 'motion', 'posture', 'gait', 'material'].forEach(k => { if (typeof e[k] === 'string' && /^[a-z_\-]{2,20}$/.test(e[k])) o[k] = e[k]; });
                if (typeof e.recipeVersion === 'number') o.recipeVersion = e.recipeVersion;
                ['parts', 'colors', 'pattern'].forEach(k => { if (e[k] && typeof e[k] === 'object') o[k] = JSON.parse(JSON.stringify(e[k])); });
                delete o.species; delete o.style; delete o.kind;
                if (!o.colors || !o.name) return null;
            }
            if (e.type === 'custom') {   // one of VQ's drawings: its shapes are checked again by the scene engine before drawing
                if (typeof e.name === 'string') o.name = e.name.replace(/[^\w '\-]/g, '').slice(0, 40) || 'drawing';
                if (typeof e.what === 'string') o.what = e.what.slice(0, 240);
                if (Array.isArray(e.parts) && e.parts.length && e.parts.length <= 40) o.parts = JSON.parse(JSON.stringify(e.parts));
                if (e.path && typeof e.path === 'object' && typeof e.path.kind === 'string') o.path = { kind: e.path.kind, amount: +e.path.amount || 0.5, speed: +e.path.speed || 1 };
                if (typeof e.spawn === 'string') o.spawn = e.spawn;
                if (!o.parts || !o.name) return null;
            }
            return o;
        }).filter(Boolean);
        s.layers = (Array.isArray(raw.layers) ? raw.layers : []).filter(l => l && TK_TYPES.includes(l.type)).slice(0, 4).map(l => ({
            type: l.type,
            params: Object.fromEntries(Object.entries(l.params && typeof l.params === 'object' ? l.params : {}).filter(([k, v]) => okParam(k, v)).slice(0, 10))
        }));
        return { spec: s, fixes };
    }

    function themeVars(s) {
        const t = hexRgb(s.text).join(',');
        const panel = hexRgb(mixHex(s.background, s.surface, 0.6));
        return [s.background, mixHex(s.background, '#000000', 0.18), `rgba(${panel.join(',')}, 0.84)`, s.surface,
                `rgba(${t},0.11)`, `rgba(${t},0.055)`, s.text];
    }
    function customSpec(id) { return (uiPrefs.customThemes || {})[id] || null; }
    const ICON_VARS = ['--ic-tile', '--ic-line', '--ic-fill', '--ic-accent', '--vq-eye', '--vq-light', '--vq-ear', '--ic-glow-color', '--fx-rgb', '--fx-text-rgb', '--vq-avatar-bg'];
    function applyCustomIcons(s) {
        const b = document.body.style;
        if (!s) { ICON_VARS.forEach(v => b.removeProperty(v)); return; }
        const ic = hexRgb(s.icon).join(','), ac = hexRgb(s.accent2).join(',');
        b.setProperty('--ic-tile', `rgba(${ic},0.10)`); b.setProperty('--ic-line', s.icon); b.setProperty('--ic-fill', `rgba(${ic},0.18)`);
        b.setProperty('--ic-accent', s.accent2); b.setProperty('--vq-eye', s.icon); b.setProperty('--vq-light', s.icon); b.setProperty('--vq-ear', s.accent2);
        b.setProperty('--ic-glow-color', `rgba(${ic},0.6)`);
        b.setProperty('--fx-rgb', ic); b.setProperty('--fx-text-rgb', hexRgb(s.text).join(','));
        b.setProperty('--vq-avatar-bg', `radial-gradient(circle at 50% 40%, ${mixHex(s.surface, '#ffffff', 0.06)}, ${mixHex(s.background, '#000000', 0.5)})`);
    }

    function themeCode(s) {
        const short = { n: s.name, b: s.background, u: s.surface, t: s.text, a: s.accent, a2: s.accent2, i: s.icon, s: s.scene || '', e: (s.effects || []).join(','), l: s.layers && s.layers.length ? s.layers : undefined, r: s.art && s.art.length ? s.art : undefined };
        return 'VQT1-' + btoa(unescape(encodeURIComponent(JSON.stringify(short)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function parseThemeCode(code) {
        try {
            const b64 = code.replace(/^VQT1-/, '').replace(/-/g, '+').replace(/_/g, '/');
            const o = JSON.parse(decodeURIComponent(escape(atob(b64))));
            return { name: o.n, background: o.b, surface: o.u, text: o.t, accent: o.a, accent2: o.a2, icon: o.i, scene: o.s, effects: o.e || '', layers: o.l || [], art: o.r || [] };
        } catch (e) { return null; }
    }

    // Save (or update) a theme and switch to it. Returns { id, spec, fixes }.
    function installTheme(raw) {
        const { spec, fixes } = fixTheme(raw || {});
        uiPrefs.customThemes = Object.assign({}, uiPrefs.customThemes || {});
        const existing = Object.keys(uiPrefs.customThemes).find(k => uiPrefs.customThemes[k].name.toLowerCase() === spec.name.toLowerCase());
        const id = existing || ('custom-' + spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-3));
        uiPrefs.customThemes = { [id]: spec };   // just the current custom look; no saved library for now
        uiPrefs.theme = id;
        uiPrefs.accent = 'theme';
        if (spec.scene) { uiPrefs.scene = spec.scene; uiPrefs.mist = spec.scene !== 'none'; }
        uiPrefs.particles = spec.particles || null;   // a new look brings its own particles, or none
        return { id, spec, fixes };
    }

    function themeShareLink(s) { return `${location.origin}${location.pathname}?theme=${themeCode(s)}`; }



    // ---------- Theme effects: building blocks VQ can add to its own themes, drawn in the theme's colours ----------
    const FX_LIST = ['trees', 'grass', 'mountains', 'stars', 'comet', 'planet', 'aurora', 'fireflies', 'snow', 'leaves', 'static', 'crt', 'tvset'];
    // One small tile of TV noise, made once and reused (shifted around to make it shimmer)
    let noiseTile = null;
    // Pixel dissolve: an element breaks into square pixels that blink out, or blink in, in random order (no movement)
    function pixelFade(node, dir = 'in', ms = 260, cell = 14) {
        return new Promise(res => {
            if (!node || matchMedia('(prefers-reduced-motion: reduce)').matches) { node && (node.style.opacity = dir === 'out' ? '0' : ''); return res(); }
            const r = node.getBoundingClientRect(), w = Math.max(1, Math.ceil(r.width / cell)), h = Math.max(1, Math.ceil(r.height / cell));
            const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
            const rank = Array.from({ length: w * h }, () => Math.random());
            const frames = 7, urls = [];
            for (let f = 0; f <= frames; f++) {
                const k = dir === 'in' ? f / frames : 1 - f / frames; g.clearRect(0, 0, w, h); g.fillStyle = '#000';
                rank.forEach((v, i) => { if (v < k) g.fillRect(i % w, (i / w) | 0, 1, 1); });
                urls.push(cv.toDataURL());
            }
            node.style.opacity = '';
            const set = u => { node.style.webkitMaskImage = node.style.maskImage = `url(${u})`; node.style.webkitMaskSize = node.style.maskSize = '100% 100%'; };
            let i = 0; set(urls[0]);
            const step = () => { i++; if (i > frames) { node.style.webkitMaskImage = node.style.maskImage = ''; if (dir === 'out') node.style.opacity = '0'; return res(); } set(urls[i]); setTimeout(step, ms / frames); };
            setTimeout(step, ms / frames);
        });
    }
    function staticUrl() {
        if (staticUrl.v) return staticUrl.v;
        try { const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'), img = x.createImageData(160, 160);
            for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
            x.putImageData(img, 0, 0); staticUrl.v = `url(${c.toDataURL()})`; } catch (e) { staticUrl.v = 'none'; }
        return staticUrl.v;
    }
    setTimeout(() => document.documentElement.style.setProperty('--tv-static', staticUrl()), 50);
    function getNoiseTile() {
        if (noiseTile) return noiseTile;
        const c = document.createElement('canvas'); c.width = c.height = 192;
        const ctx = c.getContext('2d'), img = ctx.createImageData(192, 192);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = Math.random() * 255;                         // overall brightness: reads as grey from a distance
            const tint = Math.random() < 0.55 ? 1 : 0;             // up close, many specks carry their own colour
            for (let k = 0; k < 3; k++) img.data[i + k] = Math.max(0, Math.min(255, v + (Math.random() - 0.5) * 210 * tint));
            img.data[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        return (noiseTile = c.toDataURL('image/png'));
    }
    let cometTimer = null;
    const rnd = (a, b) => a + Math.random() * (b - a);

    function renderFx(spec) {
        let layer = document.querySelector('.vq-fx');
        if (!layer) { layer = el('div', 'vq-fx'); layer.setAttribute('aria-hidden', 'true'); document.body.appendChild(layer); }
        const want = (spec && Array.isArray(spec.effects) ? spec.effects.filter(f => FX_LIST.includes(f)) : []).slice(0, 4);
        const key = want.join(',') + '|' + (spec ? spec.name : '');
        clearTimeout(cometTimer);
        if (layer.dataset.key === key) { if (want.includes('comet')) scheduleComet(layer); return; }
        layer.dataset.key = key;
        layer.innerHTML = '';
        document.body.classList.toggle('fx-has-planet', want.includes('planet'));
        document.body.classList.toggle('fx-crt', want.includes('crt'));
        applyNoise((want.includes('static') ? 0.16 : 0) + (want.includes('crt') ? 0.09 : 0));
        document.body.classList.toggle('fx-tv', want.includes('tvset'));
        const oldControls = document.querySelector('.tv-controls');
        if (oldControls) oldControls.remove();
        if (want.includes('tvset')) buildTvControls();
        if (!want.length) return;
        const W = 1600, H = 300;
        want.forEach(fx => {
            if (fx === 'trees') {
                let svg = `<svg class="fx-trees" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">`;
                for (let x = -20; x < W + 40; x += rnd(38, 70)) {
                    const h = rnd(90, 230), w = h * rnd(0.32, 0.42), base = H, far = Math.random() < 0.45;
                    const tiers = 3 + Math.round(Math.random());
                    let path = '';
                    for (let t = 0; t < tiers; t++) {
                        const top = base - h + t * h / (tiers + 0.6), bot = top + h / (tiers - 0.4), ww = w * (0.45 + t * 0.22);
                        path += `M${x} ${top.toFixed(0)} L${(x - ww / 2).toFixed(0)} ${bot.toFixed(0)} L${(x + ww / 2).toFixed(0)} ${bot.toFixed(0)}Z `;
                    }
                    path += `M${x - 4} ${base - h * 0.18} h8 V${base} h-8Z`;
                    svg += `<path class="${far ? 'far' : 'near'}" d="${path}" style="transform-origin:${x}px ${base}px;animation-duration:${rnd(5, 9).toFixed(1)}s;animation-delay:-${rnd(0, 8).toFixed(1)}s"/>`;
                }
                layer.insertAdjacentHTML('beforeend', svg + '</svg>');
            } else if (fx === 'grass') {
                let svg = `<svg class="fx-grass" viewBox="0 0 ${W} 120" preserveAspectRatio="xMidYMax slice">`;
                for (let x = 0; x < W; x += rnd(5, 11)) {
                    const h = rnd(30, 95), lean = rnd(-14, 14);
                    svg += `<path d="M${x} 120 Q${(x + lean / 2).toFixed(0)} ${(120 - h / 2).toFixed(0)} ${(x + lean).toFixed(0)} ${(120 - h).toFixed(0)} Q${(x + lean / 2 + 3).toFixed(0)} ${(120 - h / 2).toFixed(0)} ${x + 5} 120Z" style="transform-origin:${x}px 120px;animation-duration:${rnd(3, 6).toFixed(1)}s;animation-delay:-${rnd(0, 5).toFixed(1)}s"/>`;
                }
                layer.insertAdjacentHTML('beforeend', svg + '</svg>');
            } else if (fx === 'mountains') {
                const ridge = (y0, amp, step) => { let d = `M0 ${H}`; for (let x = 0; x <= W; x += step) d += ` L${x} ${(y0 + Math.sin(x / 140) * amp * 0.4 + rnd(-amp, amp)).toFixed(0)}`; return d + ` L${W} ${H}Z`; };
                layer.insertAdjacentHTML('beforeend', `<svg class="fx-mountains" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice"><path class="m-back" d="${ridge(120, 60, 60)}"/><path class="m-front" d="${ridge(190, 40, 45)}"/></svg>`);
            } else if (fx === 'stars') {
                const s = el('div', 'fx-stars');
                for (let i = 0; i < 70; i++) {
                    const d = el('span');
                    d.style.cssText = `left:${rnd(0, 100).toFixed(1)}%;top:${rnd(0, 70).toFixed(1)}%;width:${rnd(1, 2.6).toFixed(1)}px;height:auto;animation-duration:${rnd(2.5, 7).toFixed(1)}s;animation-delay:-${rnd(0, 7).toFixed(1)}s`;
                    s.appendChild(d);
                }
                layer.appendChild(s);
            } else if (fx === 'comet') {
                layer.insertAdjacentHTML('beforeend', '<div class="fx-comet"><span></span></div>');
                scheduleComet(layer);
            } else if (fx === 'planet') {
                layer.insertAdjacentHTML('beforeend', '<div class="fx-planet"><span class="ring back"></span><span class="ball"></span><span class="ring front"></span></div>');
            } else if (fx === 'aurora') {
                layer.insertAdjacentHTML('beforeend', '<div class="fx-aurora"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div>');
            } else if (fx === 'fireflies') {
                const f = el('div', 'fx-fireflies');
                for (let i = 0; i < 18; i++) {
                    const d = el('span');
                    d.style.cssText = `left:${rnd(2, 98).toFixed(1)}%;top:${rnd(45, 95).toFixed(1)}%;--dx:${rnd(-60, 60).toFixed(0)}px;--dy:${rnd(-50, 30).toFixed(0)}px;animation-duration:${rnd(6, 12).toFixed(1)}s,${rnd(1.8, 4).toFixed(1)}s;animation-delay:-${rnd(0, 10).toFixed(1)}s,-${rnd(0, 4).toFixed(1)}s`;
                    f.appendChild(d);
                }
                layer.appendChild(f);
            } else if (fx === 'static') {
                /* drawn by applyNoise(), inside the app */
            } else if (fx === 'crt') {
                // the old-TV screen: scanlines, a rolling bar, curved glass with a dark bezel, and a power-on line
                layer.insertAdjacentHTML('beforeend', '<div class="fx-crt-lines"></div><div class="fx-crt-roll"></div><div class="fx-crt-glass"></div><div class="fx-crt-on"></div>');
            } else if (fx === 'snow') {
                layer.insertAdjacentHTML('beforeend', '<div class="fx-snow s1"></div><div class="fx-snow s2"></div>');
            } else if (fx === 'leaves') {
                const lv = el('div', 'fx-leaves');
                for (let i = 0; i < 12; i++) {
                    const d = el('span');
                    d.innerHTML = '<svg viewBox="0 0 20 20"><path d="M10 1 C 16 5 18 12 10 19 C 2 12 4 5 10 1Z M10 3 L10 18"/></svg>';
                    d.style.cssText = `left:${rnd(0, 100).toFixed(1)}%;--sway:${rnd(-80, 80).toFixed(0)}px;animation-duration:${rnd(11, 20).toFixed(1)}s;animation-delay:-${rnd(0, 20).toFixed(1)}s;transform:scale(${rnd(0.7, 1.3).toFixed(2)})`;
                    lv.appendChild(d);
                }
                layer.appendChild(lv);
            }
        });
    }



    // TV static lives inside the app: one layer under the chat text, and (unless the text is set to clear) a fainter one over it
    let noiseStrength = 0;
    function applyNoise(strength) {
        if (typeof strength === 'number') noiseStrength = strength;
        const host = document.getElementById('app-container');
        if (!host) return;
        host.querySelectorAll('.app-noise').forEach(n => n.remove());
        const mode = ['full', 'reduced', 'clear'].includes(uiPrefs.textStatic) ? uiPrefs.textStatic : 'reduced';
        document.body.classList.toggle('noise-under-text', noiseStrength > 0 && mode !== 'full');
        if (!noiseStrength) return;
        const add = (cls, op) => {
            const n = el('div', 'app-noise ' + cls);
            n.setAttribute('aria-hidden', 'true');
            n.style.backgroundImage = `url(${getNoiseTile()})`;
            n.style.setProperty('--noise-op', op.toFixed(3));
            host.appendChild(n);
        };
        if (mode === 'full') add('over', noiseStrength);                 // one layer over everything, text included
        else {
            add('under', noiseStrength * (mode === 'reduced' ? 0.8 : 1));  // under the chat text
            if (mode === 'reduced') add('over', noiseStrength * 0.3);     // a light touch over the text too
        }
    }


    // ---------- Visual Toolkit layers: canvas effects (galaxy, nebula, matrix, grid, vortex…) chosen by VQ for a theme ----------
    const TK_TYPES = ['mist', 'clouds', 'storm', 'stars', 'constellations', 'galaxy', 'nebula', 'aurora', 'waves', 'seashore', 'matrix',
                      'orbits', 'vortex', 'tunnel', 'grid', 'circuit', 'comets', 'ripples', 'grain'];
    let tkStudio = null, tkKey = '';
    function applyToolkitLayers(spec) {
        const list = (spec && Array.isArray(spec.layers) ? spec.layers : []).filter(l => l && TK_TYPES.includes(l.type)).slice(0, 4);
        const key = JSON.stringify(list) + '|' + (spec ? spec.icon + spec.accent2 : '');
        if (key === tkKey) return;
        tkKey = key;
        let host = document.querySelector('.vq-visual-host');
        if (!list.length) { if (tkStudio) { try { tkStudio.run('vq_effect_clear', {}); } catch (e) {} } if (host) host.hidden = true; return; }
        if (!window.VQVisualToolkit) return;
        if (!host) { host = el('div', 'vq-visual-host'); host.setAttribute('aria-hidden', 'true'); document.body.appendChild(host); }
        host.hidden = false;
        try {
            if (!tkStudio) tkStudio = window.VQVisualToolkit.create({ root: host, persist: false });
            tkStudio.run('vq_effect_clear', {});
            list.forEach((l, i) => {
                const params = Object.assign({ color: spec.icon, secondary: spec.accent2 }, l.params || {});
                let r = tkStudio.run('vq_effect_add', { layer: { id: `vq-layer-${i}`, type: l.type, params } });
                if (!r || !r.ok) r = tkStudio.run('vq_effect_add', { layer: { id: `vq-layer-${i}`, type: l.type, params: { color: spec.icon, secondary: spec.accent2 } } });
                if (!r || !r.ok) console.warn('Effect layer skipped:', l.type, r && r.error);
            });
        } catch (e) { console.warn('Visual toolkit unavailable:', e.message); host.hidden = true; }
    }




    // ---------- VQ's portraits: the static face everywhere the live robot isn't (avatars, header, favicon) ----------
    const hasPortraits = () => !!(window.VQPortraits && window.VQPortraits.get);
    function portraitSVG(name, size) {
        try { return window.VQPortraits.get(name, { size }); } catch (e) { return ICON_VQ_SVG; }
    }
    // The newest VQ avatar shows what VQ is doing: thinking, speaking, then back to idle
    function setPortrait(av, name) {
        if (!av || !hasPortraits()) return;
        if (av.dataset.portrait === name) return;
        av.dataset.portrait = name;
        av.innerHTML = portraitSVG(name, 40);
    }
    function headerPortrait(name) {
        const av = document.querySelector('#app-header .app-avatar-small');
        if (!av || !hasPortraits() || av.classList.contains('has-persona')) return;
        let box = av.querySelector('.vq-portrait-box');
        if (!box) { av.querySelectorAll(':scope > svg').forEach(s => s.remove()); box = el('span', 'vq-portrait-box vq-alive'); av.prepend(box); }
        if (box.dataset.portrait !== name) { box.dataset.portrait = name; box.innerHTML = portraitSVG(name, 40); }
    }
    function livePortraits(name) {
        headerPortrait(name);
        const avs = elements.messagesArea ? elements.messagesArea.querySelectorAll('.message:not(.user) .message-avatar') : [];
        const last = avs[avs.length - 1];
        if (last) setPortrait(last, name);
    }
    // The browser-tab icon: VQ's small face, eyes in the current theme's colour
    function updateFavicon() {
        if (!hasPortraits()) return;
        let eye = getComputedStyle(document.body).getPropertyValue('--vq-eye').trim();
        if (!/^#[0-9a-f]{6}$/i.test(eye)) eye = '#23dcdd';
        const svg = portraitSVG('idle', 24).replace(/var\(--vq-eye[^)]*\)/g, eye);
        let link = document.querySelector('link[rel="icon"]');
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    // ---------- VQ's embodiment: the robot, in the panel, the header or walking along the bottom ----------
    let persona = null, personaMode = null, personaSaid = 0, personaUnbind = null;
    function personaAccent() {
        const cs = customSpec(uiPrefs.theme);
        const v = getComputedStyle(document.body).getPropertyValue('--vq-eye').trim();
        const c = cs ? cs.icon : (/^#[0-9a-f]{6}$/i.test(v) ? v : '#23DCDD');
        return /^#[0-9a-f]{6}$/i.test(c) ? c.toUpperCase() : '#23DCDD';
    }
    function personaHost(mode) {
        if (mode === 'panel') {
            let host = document.getElementById('persona-body');
            const tab = document.querySelector('.persona-tab');
            if (tab) tab.hidden = false;
            if (!document.body.classList.contains('insight-open')) openPanel(false);
            setPanelView('persona', false);
            return host;
        }
        if (mode === 'badge') {
            const av = document.querySelector('#app-header .app-avatar-small');
            if (!av) return null;
            let host = av.querySelector('.persona-badge');
            if (!host) { host = el('div', 'persona-badge'); av.appendChild(host); }
            av.classList.add('has-persona');
            return host;
        }
        if (mode === 'moon' || mode === 'fly') {
            let host = document.getElementById('persona-sky');
            if (!host) { host = el('div'); host.id = 'persona-sky'; document.body.appendChild(host); }
            return host;
        }
        let host = document.getElementById('persona-roam');
        if (!host) { host = el('div'); host.id = 'persona-roam'; host.style.cssText = 'position:fixed;pointer-events:none;z-index:411'; document.body.appendChild(host); }
        return host;
    }
    // While flying, VQ keeps clear of what you're reading and where you type, and stays inside the conversation area
    function personaGuard() {
        if (!persona || !['fly', 'moon'].includes(personaMode)) return;
        const avoid = [document.getElementById('input-area'), document.getElementById('app-header')]
            .concat([...document.querySelectorAll('.message .message-content')].filter(n => { const r = n.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.height > 0; }).slice(-6))
            .filter(Boolean).slice(0, 8);
        try { persona.setAvoid(avoid); } catch (e) {}
        if (personaMode === 'fly') { const area = document.getElementById('chat-container'); if (area) try { persona.setArea(area); } catch (e) {} }
    }
    let guardTimer = null;
    function personaGuardSoon() { clearTimeout(guardTimer); guardTimer = setTimeout(personaGuard, 120); }
    // VQ points at something he has just changed or shown (only where his body can point)
    function personaPoint(target, say) {
        if (!persona || !target || !['fly', 'roam', 'panel'].includes(personaMode)) return;
        try { persona.pointAt(target, say ? { say } : undefined); } catch (e) {}
    }
    function startPersona(mode) {
        stopPersona(true);
        if (!window.VQEmbodiment) { showLocalNote('VQ’s body isn’t available here'); return false; }
        const root = personaHost(mode);
        if (!root) return false;
        try {
            // v2: a real walking surface sized to the conversation column (turns into the walk, proper gait)
            if (mode === 'roam') fitRoam();
            persona = window.VQEmbodiment.mount({ root, src: './vq-full-body.html', mode: { roam: 'walking', fly: 'roaming' }[mode] || mode, accent: personaAccent() });
            personaMode = mode;
            personaUnbind = persona.bindComposer(elements.messageInput);
            persona.mood('warm');
            if (mode === 'roam') { fitRoam(); roamWander(); }
            if (mode === 'moon') { try { persona.activity('fishing'); } catch (e) {} }
            document.body.classList.toggle('persona-moon', mode === 'moon');
            if (mode === 'fly' || mode === 'moon') setTimeout(personaGuard, 400);
            return true;
        } catch (e) { console.warn('Embodiment failed:', e.message); persona = null; personaMode = null; return false; }
    }
    function stopPersona(silent) {
        clearTimeout(roamTimer);
        try { if (personaUnbind) personaUnbind(); } catch (e) {}
        try { if (persona) persona.dispose(); } catch (e) {}
        persona = null; personaUnbind = null;
        if (personaMode === 'panel') { const tab = document.querySelector('.persona-tab'); if (tab) tab.hidden = true; setPanelView('details', false); }
        if (personaMode === 'badge') { const av = document.querySelector('#app-header .app-avatar-small'); if (av) { av.classList.remove('has-persona'); av.querySelector('.persona-badge')?.remove(); headerPortrait('idle'); } }
        if (personaMode === 'roam') document.getElementById('persona-roam')?.remove();
        if (personaMode === 'moon' || personaMode === 'fly') document.getElementById('persona-sky')?.remove();
        document.body.classList.remove('persona-moon');
        personaMode = null;
    }
    // The walking area is the whole conversation column, just above where you type (not a corner box)
    function fitRoam() {
        const host = document.getElementById('persona-roam');
        const chat = document.getElementById('chat-container'), inp = document.getElementById('input-area');
        if (!host || !chat) return;
        const r = chat.getBoundingClientRect(), top = inp ? inp.getBoundingClientRect().top : r.bottom;
        Object.assign(host.style, { left: r.left + 'px', width: r.width + 'px', right: 'auto', bottom: Math.max(0, window.innerHeight - top) + 'px', height: Math.min(300, Math.max(180, (top - r.top) * 0.55)) + 'px' });
    }
    window.addEventListener('resize', () => { if (personaMode === 'roam') fitRoam(); personaGuardSoon(); });
    // When walking, VQ strolls to a new spot now and then, and stays put while answering
    let roamTimer = null, personaBusy = false, roamX = 0;
    function roamWander() {
        clearTimeout(roamTimer);
        roamTimer = setTimeout(() => {
            if (persona && personaMode === 'roam' && !personaBusy && !document.hidden) {
                // a proper stroll: usually to the other side, sometimes a shorter wander nearby
                const far = Math.random() < 0.65;
                roamX = far ? (roamX > 0 ? -1 : 1) * (0.45 + Math.random() * 0.25) : Math.max(-0.7, Math.min(0.7, roamX + (Math.random() - 0.5) * 0.6));
                persona.moveTo(+roamX.toFixed(2));
            }
            if (personaMode === 'roam') roamWander();
        }, 4500 + Math.random() * 5500);
    }
    // A light mood cue from the question itself (VQ's body follows the tone of the conversation)
    function personaMoodFor(text) {
        const t = String(text || '').toLowerCase();
        if (/\b(died|death|dying|grief|grieving|funeral|loss|lost my|pray|prayer|cross|crucifi|resurrection|worship|holy)\b/.test(t)) return 'reverent';
        if (/\b(joke|funny|laugh|haha|lol|great news|celebrat|birthday|thank you|thanks)\b/.test(t)) return 'joyful';
        if (/\b(why|how does|how do|what if|wonder|curious|explain)\b/.test(t)) return 'curious';
        if (/\b(problem|error|wrong|risk|danger|urgent|serious)\b/.test(t)) return 'serious';
        return 'warm';
    }
    // ---------- VQ's character face (two styles: VQ's robot, with O.R.I.A., or the human face), in the panel or as a background ----------
    const FACE_SRC = { robot: 'vq-face-robot.html?embed', human: 'vq-face-human.html?embed' };
    let facePanel = null, faceBg = null, faceSaid = 0;
    const faceStyle = () => (uiPrefs.faceStyle === 'human' ? 'human' : 'robot');
    function faceFrames() { return [facePanel, faceBg].filter(f => f && f.contentWindow && f.contentWindow.VQFace); }
    function faceCall(fn, ...args) { faceFrames().forEach(f => { try { const api = f.contentWindow.VQFace; if (typeof api[fn] === 'function') api[fn](...args); } catch (e) {} }); }
    function faceColour(f) {
        // the faces follow your accent: mint for teal and green, amber for orange and gold, ice for blue and violet, white for grey
        try {
            const sel = f.contentDocument.getElementById('colour'); if (!sel) return;
            const a = uiPrefs.accent === 'theme' ? 'teal' : uiPrefs.accent;
            sel.value = { orange: 'amber', gold: 'amber', rose: 'amber', teal: 'mint', green: 'mint', blue: 'ice', violet: 'ice', grey: 'mono' }[a] || 'mint';
            sel.dispatchEvent(new Event('change'));
        } catch (e) {}
    }
    function makeFaceFrame(cls) {
        const f = document.createElement('iframe');
        f.className = cls; f.title = 'VQ’s face'; f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
        f.src = FACE_SRC[faceStyle()];
        f.addEventListener('load', () => faceColour(f));
        return f;
    }
    function mountPanelFace() {
        const host = document.getElementById('face-body');
        if (!host) return;
        if (facePanel && host.contains(facePanel) && facePanel.dataset.style === faceStyle()) return;
        host.textContent = '';
        facePanel = makeFaceFrame('face-frame'); facePanel.dataset.style = faceStyle();
        const bar = el('div', 'face-bar');
        [['VQ robot', 'robot face'], ['Human face', 'human face'], [uiPrefs.faceBg ? 'Background off' : 'As background', uiPrefs.faceBg ? 'face background off' : 'face background']].forEach(([l, c]) => {
            const b = el('button', 'look-btn', l); b.type = 'button'; b.addEventListener('click', () => runFreeCommand(c)); bar.appendChild(b);
        });
        host.append(facePanel, bar);
    }
    function unmountPanelFace() { if (facePanel) { facePanel.remove(); facePanel = null; } const h = document.getElementById('face-body'); if (h) h.textContent = ''; }
    function applyFaceBg() {
        const want = !!uiPrefs.faceBg;
        if (!want) { if (faceBg) { faceBg.remove(); faceBg = null; } return; }
        if (faceBg && faceBg.dataset.style === faceStyle()) return;
        if (faceBg) faceBg.remove();
        faceBg = makeFaceFrame('vq-face-bg'); faceBg.dataset.style = faceStyle();
        document.body.appendChild(faceBg);
    }
    // In the background the face sits behind everything, so pass the pointer through to it: its eyes follow you around the screen
    let faceMoveT = 0;
    window.addEventListener('pointermove', (ev) => {
        if (!faceBg || !faceBg.contentDocument || performance.now() - faceMoveT < 40) return;
        faceMoveT = performance.now();
        try {
            const c = faceBg.contentDocument.getElementById('portrait'); if (!c) return;
            c.dispatchEvent(new faceBg.contentWindow.PointerEvent('pointermove', { clientX: ev.clientX, clientY: ev.clientY, bubbles: true }));
        } catch (e) {}
    }, { passive: true });
    function faceThinking() { faceSaid = 0; faceCall('setSpeaker', 'vq'); faceCall('setState', 'thinking'); }
    function faceStream(full) {
        const text = String(full || '');
        if (text.length <= faceSaid) return;
        faceFrames().forEach(f => {
            const api = f.contentWindow.VQFace;
            try {
                if (api.beginResponse) { if (faceSaid === 0) api.beginResponse({ speaker: 'vq' }); api.appendText(text.slice(faceSaid)); }
                else if (faceSaid === 0) api.setState('speaking');
            } catch (e) {}
        });
        faceSaid = text.length;
    }
    function faceDone() {
        const spoke = faceSaid > 0;   // no answer text (a limit, an error, a stopped reply): just go back to rest
        faceFrames().forEach(f => { const api = f.contentWindow.VQFace; try { if (spoke && api.endResponse) api.endResponse(); else api.setState('idle'); } catch (e) {} });
        faceSaid = 0;
    }
    function faceOria(text) {   // O.R.I.A. answers: the robot face becomes hers for that reply, then returns to VQ
        faceFrames().forEach(f => {
            const api = f.contentWindow.VQFace;
            try { if (api.respond) api.respond({ speaker: 'oria', text: String(text || '').slice(0, 1200) }).then(() => { try { api.setSpeaker('vq'); } catch (e) {} }); } catch (e) {}
        });
    }
    function personaThinking(question) {
        faceThinking();
        if (!persona) return;
        personaBusy = true; personaSaid = 0;
        try { persona.mood(personaMoodFor(question)); persona.state('thinking'); } catch (e) {}
    }
    function personaStream(full) {
        faceStream(full);
        if (!persona) return;
        const plain = String(full || '');
        if (plain.length <= personaSaid) return;
        const delta = plain.slice(personaSaid);
        try { persona.speak({ text: delta, start: personaSaid === 0 }); } catch (e) {}
        personaSaid = plain.length;
    }
    function personaDone() {
        faceDone();
        personaBusy = false;
        if (!persona) return;
        try { if (personaSaid > 0) persona.end(); else persona.state('idle'); } catch (e) {}
        personaSaid = 0;
    }

    // ---------- VQ Art: animated flowers, butterflies, trees and more, added one at a time ----------
    const ART_TYPES = ['flower', 'butterfly', 'tree', 'fern', 'bush', 'reeds', 'bird', 'falling-petals', 'custom', 'assembly'];
    // Animals built from the coder's parts kit (VQ Art v5): free, instant presets; VQ can assemble others from the same parts
    const ANIMALS = {"tiger":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"feline","ears":"round","eyes":"simple","extras":["whiskers"]},"body":{"shape":"barrel","length":1.2},"legs":{"length":0.45},"tail":{"length":0.9}},"colors":{"base":"#E8892E","underside":"#F7EFE2","detail":"#29251F","eyes":"#354A31"},"pattern":{"kind":"stripes","density":0.7},"motion":"idle","type":"assembly","name":"tiger","size":145},"lion":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"feline","ears":"round","extras":["mane","whiskers"]},"body":{"shape":"barrel"},"legs":{"length":0.55},"tail":{"type":"tufted","length":1}},"colors":{"base":"#CCA35C","underside":"#F0D9A2","detail":"#81562F","eyes":"#493928"},"motion":"idle","type":"assembly","name":"lion","size":150},"giraffe":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"bovine","ears":"pointed","muzzle":"snout","width":0.72,"extras":["ossicones"]},"neck":{"length":1.65,"thickness":0.85},"body":{"shape":"slender"},"legs":{"type":"hoofed","length":1,"thickness":0.75},"tail":{"type":"tufted"}},"colors":{"base":"#E1B961","underside":"#F3DFAB","detail":"#86532A","eyes":"#2F2923"},"pattern":{"kind":"patches","density":1,"scale":1.2},"motion":"idle","type":"assembly","name":"giraffe","size":200},"zebra":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"equine","ears":"pointed","muzzle":"snout","extras":["crest"]},"neck":{"length":0.5,"thickness":1.2},"body":{"shape":"barrel"},"legs":{"type":"hoofed","length":0.7},"tail":{"type":"tufted"}},"colors":{"base":"#EAE7DA","underside":"#F4EFDF","detail":"#323438","eyes":"#292B30"},"pattern":{"kind":"stripes","density":0.8,"scale":0.9,"contrast":1},"motion":"idle","type":"assembly","name":"zebra","size":160},"elephant":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"round","ears":"big","muzzle":"trunk","width":1.15,"extras":["tusks"]},"neck":{"length":0,"thickness":1.5},"body":{"shape":"barrel","width":1.35,"length":1.3},"legs":{"length":0.6,"thickness":1.6},"tail":{"type":"tufted","length":0.55}},"colors":{"base":"#91A2A9","underside":"#D8D1B4","detail":"#445764","eyes":"#24303C"},"motion":"idle","type":"assembly","name":"elephant","size":190},"horse":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"equine","ears":"pointed","muzzle":"snout","extras":["neck-mane"],"length":1.35},"neck":{"length":0.85,"thickness":1.3,"arch":0.85},"body":{"shape":"barrel","length":1.15},"legs":{"type":"hoofed","length":0.8,"thickness":0.75},"tail":{"type":"bushy","length":1.2,"curve":-0.7,"width":1.35}},"colors":{"base":"#936447","underside":"#DECBAA","detail":"#382D2C","eyes":"#28241F"},"motion":"idle","type":"assembly","name":"horse","size":165},"cow":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"bovine","ears":"sideways","muzzle":"snout","extras":["short-horns"]},"neck":{"length":0.2,"thickness":1.35},"body":{"shape":"barrel","width":1.15,"length":1.2,"udder":"small"},"legs":{"type":"hoofed","length":0.55},"tail":{"type":"tufted"}},"colors":{"base":"#E9E1CD","underside":"#D2AC9B","detail":"#3B3937","eyes":"#272927"},"pattern":{"kind":"patches","density":0.4,"scale":2,"contrast":1},"motion":"idle","type":"assembly","name":"cow","size":160},"cat":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"feline","ears":"pointed","extras":["whiskers"],"eyes":"cartoon"},"body":{"shape":"slender"},"legs":{"length":0.45,"thickness":0.75},"tail":{"type":"thin","length":1.15,"curve":0.9}},"colors":{"base":"#B59070","underside":"#EEE0C1","detail":"#614B3A","eyes":"#698457"},"pattern":{"kind":"stripes","density":0.4},"motion":"idle","type":"assembly","name":"cat","size":105},"dog":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"canine","ears":"floppy","muzzle":"snout","size":0.76,"width":0.92},"neck":{"length":0.15},"body":{"shape":"long","length":1.22},"legs":{"length":0.45},"tail":{"type":"thin","curve":0.7}},"colors":{"base":"#AF7950","underside":"#EBDDCC","detail":"#523E33","eyes":"#302A25"},"pattern":{"kind":"patches","density":0.25,"scale":2},"motion":"idle","type":"assembly","name":"dog","size":125},"fox":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"canine","ears":"pointed","muzzle":"snout","length":0.85},"body":{"shape":"slender"},"legs":{"length":0.5,"thickness":0.65},"tail":{"type":"bushy","length":1.35,"width":1.4,"curve":-0.5}},"colors":{"base":"#BF6736","underside":"#EDE2CE","detail":"#483A35","eyes":"#41372B"},"motion":"idle","type":"assembly","name":"fox","size":110},"rabbit":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"rodent","ears":"long","muzzle":"small","extras":["whiskers"]},"body":{"shape":"round","length":0.9,"width":1.15},"legs":{"length":0.25,"thickness":1.25},"tail":{"type":"fluffy","length":0.2}},"colors":{"base":"#B6A291","underside":"#E9DFCD","detail":"#786556","eyes":"#3F3531"},"pattern":{"kind":"fur","density":0.7},"motion":"idle","posture":"crouch","type":"assembly","name":"rabbit","size":95},"bear":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"ursine","ears":"round","muzzle":"snout","width":1.2},"neck":{"length":0,"thickness":1.6},"body":{"shape":"barrel","width":1.2},"legs":{"type":"clawed","length":0.35,"thickness":1.5},"tail":{"type":"fluffy","width":0.65,"length":0.1}},"colors":{"base":"#76533C","underside":"#B0956B","detail":"#40372D","eyes":"#282721"},"pattern":{"kind":"fur","density":0.65},"motion":"idle","type":"assembly","name":"bear","size":165},"deer":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"oval","ears":"pointed","muzzle":"snout","width":0.8,"extras":["antlers"]},"neck":{"length":0.6,"thickness":0.65},"body":{"shape":"slender"},"legs":{"type":"hoofed","length":0.85,"thickness":0.6},"tail":{"type":"fluffy","width":0.65,"length":0.15}},"colors":{"base":"#AA7F4B","underside":"#EBD8AD","detail":"#66503A","eyes":"#363024"},"pattern":{"kind":"spots","color":"#F5E6BF","density":0.3},"motion":"idle","type":"assembly","name":"deer","size":150},"pig":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"round","ears":"floppy","muzzle":"snout","length":0.9},"body":{"shape":"barrel","width":1.2},"legs":{"type":"hoofed","length":0.25,"thickness":1.2},"tail":{"type":"curly","length":0.3}},"colors":{"base":"#DDA69A","underside":"#F1C8B0","detail":"#9A675F","eyes":"#503C38"},"motion":"idle","type":"assembly","name":"pig","size":115},"sheep":{"rig":"quadruped","recipeVersion":1,"parts":{"head":{"shape":"oval","ears":"floppy","muzzle":"small","extras":["spiral-horns"],"width":0.8},"body":{"shape":"round","length":1.25,"width":1.15},"legs":{"type":"hoofed","length":0.4,"thickness":0.7},"tail":{"type":"fluffy","length":0.15}},"colors":{"base":"#DFD7BD","underside":"#F0E9D5","detail":"#8C8066","eyes":"#3A3B34"},"pattern":{"kind":"fur","density":1,"scale":1.5},"motion":"idle","type":"assembly","name":"sheep","size":115},"owl":{"type":"assembly","recipeVersion":1,"rig":"bird","name":"owl","parts":{"head":{"shape":"owl","eyes":"cartoon","muzzle":"beak-hooked","extras":["tuft"],"size":1.2},"body":{"shape":"upright","width":1.2,"length":1.1},"legs":{"length":0.2},"wings":{"type":"feathered"},"tail":{"type":"fan","length":0.3},"neck":{"length":0,"thickness":0.7}},"colors":{"base":"#92704A","underside":"#D9C69A","detail":"#57472F","eyes":"#403325"},"motion":"perch","pattern":{"kind":"feathers","density":0.4},"size":100},"eagle":{"type":"assembly","recipeVersion":1,"rig":"bird","name":"eagle","parts":{"head":{"shape":"raptor","muzzle":"beak-hooked"},"body":{"shape":"slender","width":0.85},"wings":{"type":"feathered","length":1.15},"legs":{"length":0.5}},"colors":{"base":"#785338","underside":"#EDE5CF","detail":"#B18C43","eyes":"#272B2A"},"motion":"fly","size":140},"parrot":{"type":"assembly","recipeVersion":1,"rig":"bird","name":"parrot","parts":{"head":{"shape":"bird","muzzle":"beak-hooked","extras":[]},"body":{"shape":"slender"},"tail":{"type":"long-feathers","length":1.3},"wings":{"type":"feathered"}},"colors":{"base":"#51A891","underside":"#EBCF83","detail":"#416F9D","eyes":"#273330"},"motion":"perch","size":100},"duck":{"type":"assembly","recipeVersion":1,"rig":"bird","name":"duck","parts":{"head":{"shape":"bird","muzzle":"beak-flat"},"body":{"shape":"long","width":0.75},"neck":{"length":0.1},"legs":{"type":"webbed","length":0.2},"wings":{"type":"feathered"}},"colors":{"base":"#699680","underside":"#E7DEBF","detail":"#C69A51","eyes":"#273834"},"motion":"perch","size":100},"penguin":{"type":"assembly","recipeVersion":1,"rig":"bird","name":"penguin","parts":{"head":{"shape":"bird","muzzle":"beak-short"},"body":{"shape":"upright","width":1.05},"neck":{"length":0},"legs":{"type":"webbed","length":0.2},"wings":{"type":"feathered","pose":"folded","length":0.65,"width":0.55},"tail":{"type":"none"}},"colors":{"base":"#364555","underside":"#ECE8D5","detail":"#CC9758","eyes":"#18232D"},"motion":"perch","size":110},"flamingo":{"type":"assembly","recipeVersion":1,"rig":"bird","name":"flamingo","parts":{"head":{"shape":"bird","width":0.7,"length":0.85,"muzzle":"beak-hooked"},"neck":{"length":0.6,"thickness":0.65},"body":{"shape":"slender","width":0.7,"length":1.15},"legs":{"length":1,"thickness":0.6},"wings":{"type":"feathered"}},"colors":{"base":"#D8A29C","underside":"#F0CEAF","detail":"#625164","eyes":"#31313A"},"motion":"perch","size":145},"hummingbird":{"type":"assembly","recipeVersion":1,"rig":"bird","name":"hummingbird","parts":{"head":{"shape":"bird","muzzle":"beak-needle","size":0.7},"body":{"shape":"slender","width":0.8,"length":0.8},"wings":{"type":"feathered","length":1.35,"width":0.6},"tail":{"type":"fan"},"legs":{"length":0.2}},"colors":{"base":"#61998D","underside":"#C2C095","detail":"#524E72","eyes":"#233C3B"},"motion":"fly","size":70},"bee":{"type":"assembly","recipeVersion":1,"rig":"insect","name":"bee","parts":{"body":{"shape":"segmented","length":1,"width":1.15},"wings":{"type":"clear","length":0.65,"width":0.65},"tail":{"type":"stinger"},"head":{"size":0.65,"eyes":"simple"}},"colors":{"base":"#D4AD55","underside":"#E3EDDC","detail":"#4B4033","eyes":"#252B29"},"motion":"fly","pattern":{"kind":"bands","color":"#3D3934","density":0.8,"contrast":0.85},"size":60},"ladybird":{"type":"assembly","recipeVersion":1,"rig":"insect","name":"ladybird","parts":{"body":{"shape":"wing-case"},"wings":{"type":"clear","pose":"folded"},"head":{"extras":["antennae"]}},"colors":{"base":"#C57060","underside":"#DCCB9A","detail":"#3A3935","eyes":"#253231"},"motion":"crawl","pattern":{"kind":"spots","density":0.65,"scale":1.25},"size":60},"dragonfly":{"type":"assembly","recipeVersion":1,"rig":"insect","name":"dragonfly","parts":{"body":{"shape":"slender","length":1.3},"wings":{"type":"clear","length":1.25,"width":0.65},"head":{"extras":["antennae"],"eyes":"cartoon"}},"colors":{"base":"#679D9A","underside":"#DAE8D8","detail":"#3A6070","eyes":"#2E3941"},"motion":"fly","size":80},"butterfly":{"type":"assembly","recipeVersion":1,"rig":"insect","name":"butterfly","parts":{"body":{"shape":"slender","length":1,"width":1},"wings":{"type":"butterfly","length":1.15},"head":{"extras":["antennae"],"size":0.65,"eyes":"simple"},"tail":{"type":"none"}},"colors":{"base":"#718CAF","underside":"#D4CBA5","detail":"#354456","eyes":"#222F3D"},"motion":"fly","size":80},"ant":{"type":"assembly","recipeVersion":1,"rig":"insect","name":"ant","parts":{"body":{"shape":"segmented","length":0.85,"width":0.75},"wings":{"type":"none"},"head":{"extras":["antennae"]}},"colors":{"base":"#936A50","underside":"#BC9675","detail":"#5A4335","eyes":"#282723"},"motion":"crawl","size":55},"goldfish":{"type":"assembly","recipeVersion":1,"rig":"fish","name":"goldfish","parts":{"head":{"shape":"fish","muzzle":"smile"},"body":{"shape":"round"},"fins":{"dorsal":"rounded","pectoral":"rounded","tail":"fan","size":1.15}},"colors":{"base":"#D7A04D","underside":"#ECD8A8","detail":"#BE7A43","eyes":"#393735"},"motion":"swim","pattern":{"kind":"scales","density":0.45},"size":90},"shark":{"type":"assembly","recipeVersion":1,"rig":"fish","name":"shark","parts":{"head":{"shape":"shark"},"body":{"shape":"streamlined","length":1.1},"fins":{"dorsal":"tall","pectoral":"pointed","tail":"lunate"}},"colors":{"base":"#829DA7","underside":"#DCE2D2","detail":"#586E7B","eyes":"#28373C"},"motion":"swim","size":190},"whale":{"type":"assembly","recipeVersion":1,"rig":"fish","name":"whale","parts":{"head":{"shape":"whale","eyes":"simple","muzzle":"none"},"body":{"shape":"long","length":1.6,"width":1.3},"tail":{"type":"whale-fluke"},"fins":{"dorsal":"none","pectoral":"flipper","tail":"fluke","size":1.3}},"colors":{"base":"#668C9B","underside":"#C9D8CC","detail":"#415E72","eyes":"#233340"},"motion":"swim","size":260},"dolphin":{"type":"assembly","recipeVersion":1,"rig":"fish","name":"dolphin","parts":{"head":{"shape":"dolphin"},"body":{"shape":"streamlined","width":0.8},"tail":{"type":"whale-fluke"},"fins":{"dorsal":"triangle","pectoral":"flipper","tail":"fluke"}},"colors":{"base":"#8CA6AE","underside":"#DBE0CF","detail":"#607E91","eyes":"#263943"},"motion":"swim","size":160},"reef fish":{"type":"assembly","recipeVersion":1,"rig":"fish","name":"reef fish","parts":{"head":{"shape":"fish"},"body":{"shape":"round","length":0.85},"fins":{"dorsal":"rounded","pectoral":"rounded","tail":"fan"}},"colors":{"base":"#709F9E","underside":"#EBDBC0","detail":"#D6C09D","eyes":"#26393D"},"motion":"swim","pattern":{"kind":"bands","color":"#EBDBC0","density":0.7},"size":90},"turtle":{"type":"assembly","recipeVersion":1,"rig":"turtle","name":"turtle","parts":{"head":{"shape":"reptile","muzzle":"smile"},"body":{"shape":"shell"},"legs":{"type":"flippers"},"tail":{"type":"reptile","length":0.2}},"colors":{"base":"#83A085","underside":"#D0CBA2","detail":"#546D5B","eyes":"#293C34"},"motion":"swim","pattern":{"kind":"scales","density":0.25},"size":130},"octopus":{"type":"assembly","recipeVersion":1,"rig":"octopus","name":"octopus","parts":{"body":{"shape":"octopus"},"head":{"eyes":"cartoon"},"tentacles":{"type":"curled","length":1.1}},"colors":{"base":"#B98792","underside":"#E2B9AE","detail":"#815C71","eyes":"#342B3B"},"motion":"swim","pattern":{"kind":"spots","density":0.2},"size":120},"crab":{"type":"assembly","recipeVersion":1,"rig":"crab","name":"crab","parts":{"body":{"shape":"carapace"},"head":{"eyes":"cartoon"},"claws":{"type":"pointed","size":1.15}},"colors":{"base":"#BB8265","underside":"#E9C4A1","detail":"#885940","eyes":"#39302B"},"motion":"walk","size":90},"snake":{"type":"assembly","recipeVersion":1,"rig":"serpent","name":"snake","parts":{"head":{"shape":"reptile","muzzle":"forked-tongue"},"body":{"shape":"serpentine"},"tail":{"type":"reptile"}},"colors":{"base":"#88A084","underside":"#D1CE9F","detail":"#506D56","eyes":"#2C362F"},"motion":"slither","pattern":{"kind":"scales","density":0.65},"size":150},"dragon":{"type":"assembly","recipeVersion":1,"rig":"biped","name":"dragon","parts":{"head":{"shape":"dragon","eyes":"cartoon","muzzle":"smile","ears":"pointed","extras":["short-horns"]},"body":{"shape":"upright"},"wings":{"type":"bat","pose":"open","length":1.15},"tail":{"type":"reptile","length":1},"arms":{"type":"clawed"}},"colors":{"base":"#7DA89C","underside":"#E0CEA5","detail":"#466878","eyes":"#283940"},"motion":"idle","pattern":{"kind":"scales","density":0.3},"size":160},"flying dragon":{"rig":"biped","recipeVersion":1,"parts":{"head":{"shape":"dragon","eyes":"cartoon","muzzle":"smile","ears":"pointed","extras":["short-horns"]},"body":{"shape":"upright"},"wings":{"type":"bat","pose":"open","length":1.15},"tail":{"type":"reptile","length":1},"arms":{"type":"clawed"}},"colors":{"base":"#7DA89C","underside":"#E0CEA5","detail":"#466878","eyes":"#283940"},"pattern":{"kind":"scales","density":0.3},"motion":"fly","type":"assembly","name":"flying dragon","size":170},"car":{"type":"assembly","recipeVersion":1,"rig":"vehicle_land","colors":{"base":"#AD6558","underside":"#D8D5C0","detail":"#394955","eyes":"#F4D295"},"parts":{"body":{"shape":"sedan"}},"motion":"drive","name":"car","size":150},"bus":{"type":"assembly","recipeVersion":1,"rig":"vehicle_land","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"bus","length":1.1}},"motion":"drive","name":"bus","size":190},"train":{"type":"assembly","recipeVersion":1,"rig":"vehicle_land","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"locomotive"},"wheels":{"type":"spokes"},"fittings":{"type":"headlights","carriages":2}},"motion":"drive","name":"train","size":240},"bicycle":{"type":"assembly","recipeVersion":1,"rig":"vehicle_land","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"bicycle"},"wheels":{"type":"spokes"},"glazing":{"type":"none"},"fittings":{"type":"none"}},"motion":"drive","name":"bicycle","size":110},"tractor":{"type":"assembly","recipeVersion":1,"rig":"vehicle_land","colors":{"base":"#AD6558","underside":"#D8D5C0","detail":"#394955","eyes":"#F4D295"},"parts":{"body":{"shape":"tractor"},"wheels":{"type":"solid"}},"motion":"drive","name":"tractor","size":150},"plane":{"type":"assembly","recipeVersion":1,"rig":"vehicle_air","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"fuselage"},"propulsion":{"type":"propeller"}},"motion":"fly","name":"plane","size":170},"jet":{"type":"assembly","recipeVersion":1,"rig":"vehicle_air","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"jet"},"wings":{"type":"delta"},"propulsion":{"type":"jet"},"fittings":{"type":"contrail"}},"motion":"fly","name":"jet","size":180},"helicopter":{"type":"assembly","recipeVersion":1,"rig":"vehicle_air","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"helicopter"},"wings":{"type":"none"},"propulsion":{"type":"rotor"}},"motion":"fly","name":"helicopter","size":170},"rocket":{"type":"assembly","recipeVersion":1,"rig":"vehicle_air","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"rocket"},"wings":{"type":"none"},"propulsion":{"type":"thruster"},"fittings":{"type":"none"}},"motion":"takeoff","name":"rocket","size":150},"hot-air balloon":{"type":"assembly","recipeVersion":1,"rig":"vehicle_air","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"balloon"},"wings":{"type":"none"},"propulsion":{"type":"burner"},"fittings":{"type":"none"}},"motion":"hover","name":"hot-air balloon","size":170},"airship":{"type":"assembly","recipeVersion":1,"rig":"vehicle_air","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"airship"},"wings":{"type":"none"},"propulsion":{"type":"propeller"},"fittings":{"type":"none"}},"motion":"fly","name":"airship","size":220},"sailboat":{"type":"assembly","recipeVersion":1,"rig":"vessel","colors":{"base":"#94765F","underside":"#B9CED0","detail":"#42515B","eyes":"#EBE2AC"},"parts":{"body":{"shape":"sailboat"},"cabin":{"type":"none"}},"motion":"sail","name":"sailboat","size":170},"ship":{"type":"assembly","recipeVersion":1,"rig":"vessel","colors":{"base":"#94765F","underside":"#B9CED0","detail":"#42515B","eyes":"#EBE2AC"},"parts":{"body":{"shape":"ship"},"sail":{"type":"none"}},"motion":"sail","name":"ship","size":220},"rowing boat":{"type":"assembly","recipeVersion":1,"rig":"vessel","colors":{"base":"#94765F","underside":"#B9CED0","detail":"#42515B","eyes":"#EBE2AC"},"parts":{"body":{"shape":"rowing-boat"},"sail":{"type":"none"},"cabin":{"type":"oars"},"flag":{"type":"none"}},"motion":"sail","name":"rowing boat","size":140},"submarine":{"type":"assembly","recipeVersion":1,"rig":"vessel","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"submarine"},"sail":{"type":"none"},"cabin":{"type":"periscope"},"flag":{"type":"none"},"fittings":{"type":"bubbles"}},"motion":"dive","name":"submarine","size":170},"cottage":{"type":"assembly","recipeVersion":1,"rig":"building","colors":{"base":"#958C7B","underside":"#E1DFCC","detail":"#625F5C","eyes":"#F2C879"},"parts":{"body":{"shape":"cottage"},"walls":{"type":"brick"},"details":{"type":"chimney"},"tower":{"type":"none"}},"motion":"idle","name":"cottage","size":170},"castle":{"type":"assembly","recipeVersion":1,"rig":"building","colors":{"base":"#958C7B","underside":"#E1DFCC","detail":"#625F5C","eyes":"#F2C879"},"parts":{"body":{"shape":"castle"},"walls":{"type":"stone"},"roof":{"type":"flat"},"openings":{"type":"arched","windows":2},"details":{"type":"battlements"},"tower":{"type":"square"}},"motion":"idle","name":"castle","size":240},"lighthouse":{"type":"assembly","recipeVersion":1,"rig":"building","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"lighthouse"},"walls":{"type":"plaster"},"roof":{"type":"flat"},"openings":{"type":"round","windows":2},"details":{"type":"lighthouse-lamp"},"tower":{"type":"none"}},"night":true,"motion":"idle","name":"lighthouse","size":230},"windmill":{"type":"assembly","recipeVersion":1,"rig":"building","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"windmill"},"walls":{"type":"wood"},"roof":{"type":"hip"},"details":{"type":"windmill-sails"},"tower":{"type":"none"}},"motion":"idle","name":"windmill","size":210},"church":{"type":"assembly","recipeVersion":1,"rig":"building","colors":{"base":"#958C7B","underside":"#E1DFCC","detail":"#625F5C","eyes":"#F2C879"},"parts":{"body":{"shape":"church"},"walls":{"type":"stone"},"roof":{"type":"spire"},"openings":{"type":"arched","windows":2},"details":{"type":"steps"},"tower":{"type":"square"}},"motion":"idle","name":"church","size":220},"barn":{"type":"assembly","recipeVersion":1,"rig":"building","colors":{"base":"#AD6558","underside":"#D8D5C0","detail":"#394955","eyes":"#F4D295"},"parts":{"body":{"shape":"barn"},"walls":{"type":"wood"},"roof":{"type":"gable"},"openings":{"type":"square","windows":1},"details":{"type":"fence"},"tower":{"type":"none"}},"motion":"idle","name":"barn","size":200},"bridge":{"type":"assembly","recipeVersion":1,"rig":"landmark","colors":{"base":"#94765F","underside":"#B9CED0","detail":"#42515B","eyes":"#EBE2AC"},"parts":{"body":{"shape":"bridge"},"surface":{"type":"wood"},"water":{"type":"river"},"foliage":{"type":"none"}},"motion":"idle","name":"bridge","size":260},"tent":{"type":"assembly","recipeVersion":1,"rig":"building","colors":{"base":"#5F8D95","underside":"#D9DFC8","detail":"#344A55","eyes":"#F4CE80"},"parts":{"body":{"shape":"tent"},"walls":{"type":"fabric"},"roof":{"type":"gable"},"openings":{"type":"arched","windows":0},"details":{"type":"none"},"tower":{"type":"none"}},"motion":"idle","name":"tent","size":140},"snowy mountain":{"type":"assembly","recipeVersion":1,"rig":"landmark","colors":{"base":"#958C7B","underside":"#E1DFCC","detail":"#625F5C","eyes":"#F2C879"},"parts":{"body":{"shape":"mountain"},"surface":{"type":"snow"},"water":{"type":"none"},"foliage":{"type":"none"}},"motion":"idle","name":"snowy mountain","size":320},"waterfall":{"type":"assembly","recipeVersion":1,"rig":"landmark","colors":{"base":"#718078","underside":"#A5CED7","detail":"#435A55","eyes":"#E9F3DC"},"parts":{"body":{"shape":"waterfall"},"surface":{"type":"stone"},"water":{"type":"cascade"},"foliage":{"type":"none"}},"motion":"idle","name":"waterfall","size":280},"palm island":{"type":"assembly","recipeVersion":1,"rig":"landmark","colors":{"base":"#527F63","underside":"#C8CEAA","detail":"#826A50","eyes":"#78AEBD"},"parts":{"body":{"shape":"island"},"surface":{"type":"sand"},"water":{"type":"pool"},"foliage":{"type":"palms"}},"motion":"idle","name":"palm island","size":220},"forest edge":{"type":"assembly","rig":"landmark","parts":{"body":{"shape":"forest-edge"},"surface":{"color":"#6f9460"}},"colors":{"base":"#326553","underside":"#87a96a","detail":"#3a4e58","eyes":"#ffeaa4"},"night":false,"motion":"idle","name":"forest edge","size":300},"hills":{"type":"assembly","rig":"landmark","parts":{"body":{"shape":"hills"},"surface":{"color":"#add98b"}},"colors":{"base":"#659b66","underside":"#accf85","detail":"#3a4e58","eyes":"#ffeaa4"},"night":false,"motion":"idle","name":"hills","size":320},"lake":{"type":"assembly","rig":"landmark","parts":{"body":{"shape":"lake"},"surface":{"color":"#72a7b6"}},"colors":{"base":"#317eac","underside":"#9bd7dc","detail":"#3a4e58","eyes":"#ffeaa4"},"night":false,"motion":"idle","name":"lake","size":300},"desert dunes":{"type":"assembly","rig":"landmark","parts":{"body":{"shape":"desert-dunes"},"surface":{"color":"#f2c579"}},"colors":{"base":"#d89e62","underside":"#f4d9a1","detail":"#3a4e58","eyes":"#ffeaa4"},"night":false,"motion":"idle","name":"desert dunes","size":320},"city skyline":{"type":"assembly","rig":"landmark","parts":{"body":{"shape":"city-skyline"},"surface":{"color":"#354b66"}},"colors":{"base":"#273346","underside":"#536784","detail":"#3a4e58","eyes":"#ffeaa4"},"night":true,"motion":"idle","name":"city skyline","size":340},"moon":{"type":"assembly","rig":"landmark","parts":{"body":{"shape":"moon"},"surface":{"color":"#ffe9b5"}},"colors":{"base":"#eddcb3","underside":"#fff1cc","detail":"#3a4e58","eyes":"#ffeaa4"},"night":false,"motion":"idle","name":"moon","size":150},"planet":{"type":"assembly","rig":"landmark","parts":{"body":{"shape":"planet"},"surface":{"color":"#9dabd8"}},"colors":{"base":"#6462aa","underside":"#e0b777","detail":"#3a4e58","eyes":"#ffeaa4"},"night":false,"motion":"idle","name":"planet","size":170},"person":{"type":"assembly","rig":"figure","motion":"wave","colors":{"base":"#d4a279","underside":"#f1d7b0","detail":"#2d4659","eyes":"#172b3b"},"parts":{"shirt":{"type":"jacket","color":"#306d8e","color2":"#e6d3a7"},"trousers":{"color":"#344951"},"hair":{"type":"curly","color":"#5a382a"},"legs":{"color":"#b48369","color2":"#374250"}},"name":"person","size":130},"robot friend":{"type":"assembly","rig":"figure","motion":"point","colors":{"base":"#dce2da","underside":"#9ce4df","detail":"#344855","eyes":"#24aacc"},"parts":{"body":{"shape":"robot"},"shirt":{"color":"#e1e7e2"},"helmet":{"type":"round","color":"#c2d2d5"}},"name":"robot friend","size":130},"sailor":{"type":"assembly","rig":"figure","motion":"ride","colors":{"base":"#d4a279","underside":"#f1d7b0","detail":"#2d4659","eyes":"#172b3b"},"parts":{"helmet":{"type":"cap","color":"#e9e5d7"},"shirt":{"color":"#e9e5d7","pattern":{"kind":"stripes","color":"#23537b","density":0.6}},"trousers":{"color":"#284b72"}},"name":"sailor","size":130}};
    const ANIMAL_WORDS = { tiger: 'tigers?', lion: 'lions?|lioness', giraffe: 'giraffes?', zebra: 'zebras?', elephant: 'elephants?', horse: 'horses?|ponies|pony', cow: 'cows?|cattle',
        cat: 'cats?|kittens?|kitty', dog: 'dogs?|pupp(y|ies)|doggy', fox: 'fox(es)?', rabbit: 'rabbits?|bunn(y|ies)|hares?', bear: 'bears?', deer: 'deer|stags?|fawns?', pig: 'pigs?|piglets?', sheep: 'sheep|lambs?|rams?',
        owl: 'owls?', eagle: 'eagles?|hawks?|falcons?', parrot: 'parrots?|macaws?', duck: 'ducks?|ducklings?', penguin: 'penguins?', flamingo: 'flamingos?|flamingoes', hummingbird: 'hummingbirds?',
        bee: 'bees?|bumblebees?', ladybird: 'ladybirds?|ladybugs?', dragonfly: 'dragonfl(y|ies)', ant: 'ants?', 'reef fish': 'reef fish|tropical fish|clownfish|striped fish',
        goldfish: 'goldfish|fish(es)?', shark: 'sharks?', whale: 'whales?', dolphin: 'dolphins?', turtle: 'turtles?|tortoises?', octopus: 'octop(us|uses|i)', crab: 'crabs?',
        snake: 'snakes?|serpents?', 'flying dragon': 'flying dragons?', dragon: 'dragons?',
        'forest edge': 'forest edges?|forests?|woods', hills: 'hills|rolling hills', lake: 'lakes?|ponds?', 'desert dunes': 'desert(?: dunes)?|sand dunes|dunes', 'city skyline': 'city skyline|skyline|city', moon: 'moon|the moon|full moon',
        planet: 'planets?', person: 'person|people|figures?|man|woman|kid|child', 'robot friend': 'robot friends?|robots?|friendly robots?', sailor: 'sailors?',
        car: 'cars?', bus: 'bus(es)?', train: 'trains?|steam trains?|locomotives?', bicycle: 'bicycles?|bikes?', tractor: 'tractors?', plane: 'planes?|aeroplanes?|airplanes?|propeller planes?',
        jet: 'jets?|jet planes?', helicopter: 'helicopters?', rocket: 'rockets?', 'hot-air balloon': 'hot[- ]air balloons?|balloons?', airship: 'airships?|blimps?|zeppelins?',
        sailboat: 'sail ?boats?|yachts?', ship: 'ships?|steamers?|ferr(y|ies)', 'rowing boat': 'rowing boats?|row ?boats?', submarine: 'submarines?',
        cottage: 'cottages?|little houses?|houses?', castle: 'castles?', lighthouse: 'lighthouses?', windmill: 'windmills?', church: 'churche?s?|chapels?', barn: 'barns?',
        bridge: 'bridges?', tent: 'tents?', 'snowy mountain': 'snowy mountains?|snow[- ]capped mountains?|mountain peaks?', waterfall: 'waterfalls?', 'palm island': 'palm islands?|islands?' };
    const RIG_MOTIONS = { quadruped: ['idle', 'walk', 'graze', 'sit', 'run', 'play'], bird: ['perch', 'hop', 'fly', 'run', 'play'], fish: ['swim', 'idle', 'play'],
        insect: ['crawl', 'fly', 'idle', 'run', 'play'], serpent: ['slither', 'idle', 'play'], biped: ['idle', 'walk', 'fly', 'sit', 'run', 'play'],
        turtle: ['walk', 'swim', 'idle', 'play'], octopus: ['swim', 'idle', 'play'], crab: ['walk', 'idle', 'run', 'play'],
        figure: ['idle', 'walk', 'wave', 'sit', 'ride', 'point'], vehicle_land: ['drive', 'idle'], vehicle_air: ['fly', 'hover', 'takeoff', 'land', 'idle'], vessel: ['sail', 'idle', 'dive'], building: ['idle'], landmark: ['idle'] };
    // Plain words → a motion the creature's body can do ("walk" for a fish becomes "swim"; "stand still" becomes its resting pose)
    function motionFor(rig, word) {
        const m = RIG_MOTIONS[rig] || RIG_MOTIONS.quadruped, w = String(word || '').toLowerCase();
        const mach = /drive|driv|ride|roll/.test(w) ? 'drive' : /sail|cruise/.test(w) ? 'sail' : /dive|submerge/.test(w) ? 'dive' : /hover/.test(w) ? 'hover' : /take ?off|launch|lift ?off/.test(w) ? 'takeoff' : /land/.test(w) ? 'land' : null;
        if (mach && m.includes(mach)) return mach;
        if (mach && m.includes('fly') && mach !== 'land') return 'fly';
        const want = /run|race|sprint|gallop|dash/.test(w) ? 'run' : /play|frolic|romp/.test(w) ? 'play' : /graze|eat/.test(w) ? 'graze' : /sit/.test(w) ? 'sit'
            : /swim/.test(w) ? 'swim' : /fly|soar/.test(w) ? 'fly' : /hop|jump/.test(w) ? 'hop' : /crawl/.test(w) ? 'crawl' : /slither/.test(w) ? 'slither'
            : /perch/.test(w) ? 'perch' : /walk|roam|wander|move/.test(w) ? 'walk' : 'rest';
        if (m.includes(want)) return want;
        if (want === 'walk') return ['walk', 'swim', 'crawl', 'slither', 'hop'].find(x => m.includes(x)) || null;
        if (want === 'rest') return ['idle', 'perch'].find(x => m.includes(x)) || null;
        return null;
    }
    let artEngine = null, artKey = '', artIdIndex = {}, artFit = null;
    // Nature keeps its own colours whatever the theme: roses red, sunflowers yellow, leaves green
    const NATURAL = {
        flower: { daisy: ['#4f8a4a', '#f7f5ee', '#f2c230'], tulip: ['#4a8a45', '#e2394a', '#ffd27a'], rose: ['#3f7a3e', '#c8102e', '#7a0a1c'],
                  poppy: ['#4d8a42', '#e8442e', '#1d1d1d'], lavender: ['#5f8a5a', '#9b7fd4', '#7a5fc0'], sunflower: ['#4a7d36', '#f5c518', '#5a3a1a'],
                  wildflower: ['#558b4a', '#e88fb8', '#f3d34a', '#8fb4e8'], lily: ['#4a8a4a', '#f8f1f4', '#f2a3b5', '#e8b04a'], any: ['#4f8a4a', '#f7f5ee', '#f2c230'] },
        butterfly: { monarch: ['#2a2622', '#f08a24', '#1d1d1d', '#ffffff'], blue: ['#2a2a3a', '#3a8ee8', '#1a3a7a', '#e8f4ff'],
                     swallowtail: ['#2a2622', '#f5d64a', '#1d1d1d', '#5a8ae8'], moth: ['#5a4a3a', '#c9b48f', '#7a6a55', '#efe6d2'], any: ['#2a2622', '#f08a24', '#1d1d1d', '#ffffff'] },
        tree: { pine: ['#5a3f2a', '#2f6b3a', '#3f8a4a'], oak: ['#6b4a2f', '#4f8a3f', '#6fa84f'], birch: ['#e8e4dc', '#7fb85a', '#3a3a3a'],
                palm: ['#8a6a45', '#3f9a4a', '#6bbf5a'], willow: ['#6b5240', '#7fae5a', '#a6c97a'], 'cherry-blossom': ['#6e5242', '#f2a7c3', '#f8c9da', '#ffffff'],
                any: ['#6b4a2f', '#4f8a3f', '#6fa84f'] },
        fern: { any: ['#3f7a42', '#5fa85a', '#7fbf6f'] }, bush: { any: ['#3f6b3a', '#5f9a4f', '#e2394a'] },
        reeds: { any: ['#7d8f5a', '#a9b77d', '#6b4a2f'] }, bird: { any: ['#e8e8ee', '#3a3a44'] },
        'falling-petals': { any: ['#f8c9da', '#f2a7c3', '#ffffff'] }
    };
    function artPalette(e) {
        const t = NATURAL[e.type] || {};
        return t[e.species || e.style || e.kind] || t.any || ['#4f8a4a', '#f7f5ee', '#f2c230'];
    }
    function applyArt(spec) {
        const all = spec && Array.isArray(spec.art) ? spec.art : [];
        const listIdx = all.map((e, i) => i).filter(i => all[i] && ART_TYPES.includes(all[i].type)).slice(0, 8);
        const list = listIdx.map(i => all[i]);
        const key = JSON.stringify(list) + '|' + (spec ? spec.accent + spec.icon : '') + '|' + (uiPrefs.scene || '') + '|' + (uiPrefs.fx || '');
        if (key === artKey) return;
        artKey = key;
        let host = document.querySelector('.vq-art-host');
        document.body.classList.toggle('has-art', list.length > 0);
        if (!list.length) { if (artEngine) artEngine.clear(); if (host) host.hidden = true; if (arranging) setArrange(false); return; }
        if (!window.VQArt) return;
        // Drawn inside the app, behind the chat text, the composer, the sidebar and the panel, so nothing hides what you read or type
        if (!host) {
            host = el('div', 'vq-art-host'); host.setAttribute('aria-hidden', 'true');
            (document.getElementById('app-container') || document.body).appendChild(host);
            // The scene fills the conversation area (above the composer, between the sidebar and panel), so plants grow
            // up from just above where you type instead of hiding behind it
            const fit = artFit = () => {
                const g = fitGround();
                if (g) Object.assign(host.style, { left: g.left + 'px', top: g.top + 'px', width: g.width + 'px', height: g.height + 'px', right: 'auto', bottom: 'auto' });
            };
            fit();
            if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ['chat-container', 'input-area', 'app-container'].forEach(id => { const n = document.getElementById(id); if (n) ro.observe(n); }); }
            window.addEventListener('resize', fit);
        }
        host.hidden = false;
        try {
            const fresh = !artEngine;
            if (!artEngine) artEngine = window.VQArt.create({ root: host });
            const seen = {};
            // Plants share the ground: trees stand behind, shrubs in the middle, flowers in front, and each type
            // gets a modest number (fewer when several types share the space) so nothing smothers the rest
            const PLANTS = ['tree', 'bush', 'fern', 'reeds', 'flower'];
            const plantTypes = list.filter(e => PLANTS.includes(e.type)).length || 1;
            const DEPTH = { tree: 'far', bush: 'mid', fern: 'mid', reeds: 'mid', flower: 'near', assembly: 'mid' };
            const BASE = { flower: 12, tree: 4, fern: 8, bush: 5, reeds: 14, butterfly: 6, bird: 10, 'falling-petals': 28 };
            const share = (type) => PLANTS.includes(type) ? Math.max(type === 'tree' ? 2 : 4, Math.round(BASE[type] / Math.sqrt(plantTypes))) : BASE[type];
            let seedN = 0;
            artIdIndex = {};
            const elements = list.map((e, li) => {
                seedN++;
                e = Object.assign({}, e);
                delete e.what; delete e.social; delete e.pointer;   // VQ's own description of a drawing: kept for the theme, not for the engine
                if (Array.isArray(e.positions) && typeof e.count === 'number') e.positions = e.positions.slice(0, e.count);
                const variant = (e.type === 'custom' || e.type === 'assembly') ? String(e.name || e.type).toLowerCase() : (e.species || e.style || e.kind || 'any');
                const base = `${e.type}-${variant}`.replace(/[^a-zA-Z0-9_-]/g, '-');
                seen[base] = (seen[base] || 0) + 1;
                const flying = ['butterfly', 'bird', 'falling-petals', 'custom'].includes(e.type);
                artIdIndex['a' + base + (seen[base] > 1 ? '-' + seen[base] : '')] = listIdx[li];
                return Object.assign({
                    count: share(e.type) || undefined,
                    depth: DEPTH[e.type] || 'auto',
                    size: e.type === 'tree' ? 150 : undefined,
                    seed: 1000 + seedN * 7919,
                    id: 'a' + base + (seen[base] > 1 ? '-' + seen[base] : ''),
                    colors: (e.type === 'custom' || e.type === 'assembly') ? undefined : artPalette(e),
                    spawn: 'grow',
                    // the scene responds to VQ: a soft glow while thinking, a gentle pulse while answering
                    react: e.type === 'assembly' ? undefined : flying ? { onThink: { kind: 'glow', amount: 0.35, speed: 0.7 }, onSpeak: { kind: 'pulse', amount: 0.15, speed: 1 } }
                                  : { onThink: { kind: 'glow', amount: 0.25, speed: 0.6 }, onSpeak: { kind: 'sway', amount: 0.25, speed: 1.2 } }
                }, e);
            }).map(o => { Object.keys(o).forEach(k => o[k] === undefined && delete o[k]); return o; }).map(o => placeDrawing(o, host));
            // Keep creatures to a number that stays smooth (the engine allows 24, but 12 is kinder to phones): trim the biggest groups first
            const CREATURE_CAP = 12;
            const herdOf = () => elements.filter(o => o.type === 'assembly');
            let total = herdOf().reduce((n, o) => n + (o.count == null ? 1 : o.count), 0);
            while (total > CREATURE_CAP) {
                const big = herdOf().sort((x, y) => (y.count || 1) - (x.count || 1))[0];
                if (!big || (big.count || 1) <= 1) break;
                big.count = (big.count || 1) - 1;
                if (Array.isArray(big.positions)) big.positions = big.positions.slice(0, big.count);
                total--;
            }
            // Creatures that chase, flee, follow, herd or play with each other (by name), or chase or shy away from the pointer
            list.forEach((src, li) => {
                const el = elements[li];
                if (!el || src.type !== 'assembly') return;
                const so = src.social;
                if (so && so.kind === 'herd') el.behaviours = { herd: true };
                else if (so && so.target) {
                    const ti = list.findIndex((x, j) => j !== li && x.type === 'assembly' && String(x.name || '').toLowerCase() === String(so.target).toLowerCase());
                    if (ti >= 0) {
                        const tid = elements[ti].id;
                        el.behaviours = so.kind === 'chase' ? { chase: { target: tid, style: so.style === 'hunt' ? 'hunt' : 'playful' } }
                            : so.kind === 'flee' ? { flee: { from: tid } } : so.kind === 'follow' ? { follow: { target: tid } } : { playWith: tid };
                    }
                }
                if (src.pointer === 'chase' || src.pointer === 'flee') el.react = { onPointer: src.pointer, onThink: { kind: 'glow', amount: 0.25, speed: 0.6 } };
            });
            // Light comes from the sky's own light source; detail follows the effects-strength setting
            const LIGHT = { sunset: { angle: 160, strength: 0.75 }, night: { angle: -135, strength: 0.4 }, seanight: { angle: -135, strength: 0.4 },
                            seaday: { angle: -120, strength: 0.7 }, storm: { angle: -90, strength: 0.35 }, clouds: { angle: -90, strength: 0.5 } };
            const MACHINE = ['vehicle_land', 'vehicle_air', 'vessel', 'building', 'landmark'];
            const darkSky = ['night', 'seanight', 'storm'].includes(uiPrefs.scene) || (LIVE_SKIES[uiPrefs.scene] && uiPrefs.scene !== 'cloudsky');
            elements.forEach(o => { if (o.type === 'assembly' && MACHINE.includes(o.rig) && o.night === undefined) o.night = !!darkSky; });   // windows and headlights glow after dark
            const root = { elements, style: 'soft', light: LIGHT[uiPrefs.scene] || { angle: -45, strength: 0.65 } };
            if (uiPrefs.fx === 'low') root.quality = 'low'; else if (uiPrefs.fx === 'medium') root.quality = 'medium';   // high: the engine picks for the device
            let r = fresh ? artEngine.render(root) : artEngine.update(root);
            if (!r.ok && root.style) { delete root.style; r = fresh ? artEngine.render(root) : artEngine.update(root); }
            if (!r.ok) r = fresh ? artEngine.render({ elements }) : artEngine.update({ elements });   // an older engine without light/quality
            if (!r.ok) {   // an older engine, or a setting it doesn't know: try without the extras
                const plain = elements.map(({ react, spawn, id, ...rest }) => rest);
                r = artEngine.render({ elements: plain });
                if (r.ok) elements.splice(0, elements.length, ...plain);
            }
            if (!r.ok) {   // keep whichever elements are valid on their own
                const good = elements.filter(e => { const t = window.VQArt.create({ root: document.createElement('div') }); const ok = t.render({ elements: [e] }).ok; t.dispose(); return ok; });
                r = artEngine.render({ elements: good });
                console.warn('Some scene elements were skipped:', r.error || '');
            }
        } catch (e) { console.warn('Art engine unavailable:', e.message); host.hidden = true; }
    }

    // VQ's drawings are placed by their centre: keep the whole drawing inside the scene (sky things up high,
    // ground things standing on the ground), unless the user has already placed them by hand
    function placeDrawing(o, host) {
        if (o.type !== 'custom' || !host) return o;
        const r = host.getBoundingClientRect();
        if (!(r.width > 40 && r.height > 40)) return o;
        const n = Math.max(0, Math.min(60, o.count == null ? 1 : o.count));
        const scale = { near: 1.12, mid: 1, far: 0.66 }[o.depth] || 1;
        const half = (o.size || 100) * scale / 2;
        const hx = Math.min(0.45, half / r.width), hy = Math.min(0.45, half / r.height);
        let seed = 0; for (const ch of String(o.name || o.id || '')) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
        const rand = (i, k) => { let t = (seed + i * 7919 + k * 104729) >>> 0; t = Math.imul(t ^ (t >>> 15), 2246822507) >>> 0; t = Math.imul(t ^ (t >>> 13), 3266489909) >>> 0; return ((t ^ (t >>> 16)) >>> 0) / 4294967296; };
        const area = o.area || 'full', have = Array.isArray(o.positions) ? o.positions : [];
        const pos = [];
        for (let i = 0; i < n; i++) {
            if (have[i]) { pos.push(have[i]); continue; }
            const x = hx + ((i + rand(i, 1)) / Math.max(1, n)) * (1 - 2 * hx);   // spread across, never off the edge
            let y;
            if (area === 'bottom') y = 1 - hy - 0.01;                                       // standing on the ground
            else if (area === 'top') y = hy + rand(i, 2) * Math.max(0, 0.42 - hy);          // up in the sky
            else y = hy + rand(i, 2) * Math.max(0, 1 - 2 * hy);
            pos.push([+Math.min(1, Math.max(0, x)).toFixed(4), +Math.min(1, Math.max(0, y)).toFixed(4)]);
        }
        o.positions = pos;
        o.area = 'full';   // the positions above already keep each drawing in its part of the scene
        return o;
    }

    // One shared "ground" for everything that grows from the bottom (flowers, trees, grass, mountains):
    // the conversation area, just above where you type
    function fitGround() {
        const chat = document.getElementById('chat-container'), inp = document.getElementById('input-area');
        if (!chat) return null;
        // The ground is the bottom of the screen (the message box stays readable on top), or just above the message box
        const r = chat.getBoundingClientRect(), boxTop = inp ? inp.getBoundingClientRect().top : r.bottom;
        const bottom = uiPrefs.ground === 'box' ? boxTop : Math.max(boxTop, innerHeight);
        const g = { left: r.left, top: r.top, width: r.width, height: Math.max(80, bottom - r.top) };
        const st = document.body.style;
        st.setProperty('--ground-left', g.left + 'px'); st.setProperty('--ground-width', g.width + 'px');
        st.setProperty('--ground-bottom', Math.max(0, innerHeight - bottom) + 'px');
        return g;
    }
    window.addEventListener('resize', fitGround);
    setTimeout(() => {
        fitGround();
        if (window.ResizeObserver) { const ro = new ResizeObserver(fitGround); ['chat-container', 'input-area'].forEach(id => { const n = document.getElementById(id); if (n) ro.observe(n); }); }
    }, 300);

    function runFreeCommand(cmd) { if (!elements.messageInput) return; elements.messageInput.value = cmd; sendMessage(); }
    function updateLookTools() {
        const u = document.getElementById('look-undo'); if (u) u.hidden = !uiUndo.length;
        const a = document.getElementById('look-arrange'); if (a) { a.hidden = false; a.classList.toggle('dim', !document.body.classList.contains('has-art')); a.setAttribute('aria-pressed', String(arranging)); }
    }
    setTimeout(() => {
        document.getElementById('look-undo')?.addEventListener('click', () => runFreeCommand('undo'));
        document.getElementById('look-reset')?.addEventListener('click', () => runFreeCommand('reset'));
        document.getElementById('look-arrange')?.addEventListener('click', () => setArrange(!arranging));
        setInterval(updateLookTools, 700);
    }, 400);

    function artSignal(cue) { try { if (artEngine) artEngine.signal(cue); } catch (e) {} }

    // ---------- Arrange: drag scene elements around, drop them on the bin to remove them ----------
    let arranging = false, arrangeHeld = null, arrangeBar = null, arrangeBin = null, arrangeWired = false;
    // Save one element's edit into the current theme (a fresh copy, so Undo can restore the previous layout)
    function saveArtEdit(id, patch) {
        const themeId = uiPrefs.theme, cs = customSpec(themeId), idx = artIdIndex[id];
        if (!cs || idx == null || !cs.art || !cs.art[idx]) return false;
        uiUndo.push(snapshotUI());
        if (uiUndo.length > 20) uiUndo.shift();
        const sp = JSON.parse(JSON.stringify(cs));
        Object.assign(sp.art[idx], patch);
        uiPrefs.customThemes = { [themeId]: sp };
        saveUIPrefs();
        applyArt(sp);
        return true;
    }
    function setArrange(on) {
        const host = document.querySelector('.vq-art-host');
        if (on && (!host || host.hidden || !artEngine)) { showLocalNote('There’s nothing to arrange yet. Add something first, e.g. “add red tulips” or “draw a hot-air balloon”'); return false; }
        arranging = !!on;
        document.body.classList.toggle('arranging', arranging);
        if (!arranging) { if (arrangeHeld) { try { artEngine.drop(); } catch (e) {} arrangeHeld = null; } return true; }
        if (!arrangeBar) {
            arrangeBar = el('div', 'arrange-bar');
            arrangeBar.setAttribute('role', 'status');
            arrangeBar.innerHTML = '<span>✥ Drag anything to move it. Drop it on the bin to remove it.</span>';
            const undo = el('button', 'look-btn', '↶ Undo'); undo.type = 'button';
            undo.addEventListener('click', () => { applyUIAction({ action: 'undo' }); });
            const done = el('button', 'look-btn arrange-done', 'Done'); done.type = 'button';
            done.addEventListener('click', () => setArrange(false));
            arrangeBar.append(undo, done);
            document.body.appendChild(arrangeBar);
        }
        if (!arrangeBin || !host.contains(arrangeBin)) {
            arrangeBin = el('div', 'arrange-bin');
            arrangeBin.setAttribute('aria-label', 'Bin: drop here to remove');
            arrangeBin.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            host.appendChild(arrangeBin);
        }
        if (!arrangeWired) { arrangeWired = true; wireArrange(host); }
        const hr = host.getBoundingClientRect();   // the instruction bar sits at the top of the scene, centred over it
        document.body.style.setProperty('--arrange-x', (hr.left + hr.width / 2) + 'px');
        document.body.style.setProperty('--arrange-top', (hr.top + 12) + 'px');
        return true;
    }
    // Elements normally keep to their part of the scene (plants on the ground, flyers in the sky). While you arrange,
    // they can go anywhere: every instance of the element is pinned where it stands now, then the element is freed to
    // the whole scene, so its siblings don't move and the one in your hand can be carried anywhere and take root there.
    let freeHeld = null;
    function freeDrag(id) {
        try {
            const nodes = (artEngine && Array.isArray(artEngine.nodes) ? artEngine.nodes : []).filter(n => n && n.e && n.e.id === id);
            if (!nodes.length) return null;
            const pos = artEngine.getPositions(id) || [];
            nodes.forEach(n => { if (!n.position && pos[n.index]) n.position = pos[n.index].slice(); });
            const e = nodes[0].e, was = e.area;
            e.area = 'full';
            return { id, was };
        } catch (err) { return null; }
    }
    function wireArrange(host) {
        let grab = [0, 0], pointer = null;
        const point = ev => { const r = host.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
        const overBin = ev => { if (!arrangeBin) return false; const b = arrangeBin.getBoundingClientRect(); return ev.clientX >= b.left - 12 && ev.clientX <= b.right + 12 && ev.clientY >= b.top - 12 && ev.clientY <= b.bottom + 12; };
        host.addEventListener('pointerdown', ev => {
            if (!arranging || pointer !== null || ev.button !== 0 || !artEngine) return;
            if (arrangeBin && arrangeBin.contains(ev.target)) return;
            const [x, y] = point(ev), hit = artEngine.hitTest(x, y);
            if (!hit || hit.ok === false) return;
            let lifted = artEngine.lift(hit.id, hit.index, { free: true });   // milestone 4: drag anywhere, supported
            const native = lifted && lifted.ok && typeof artEngine.pinPositions === 'function';
            if (!lifted || !lifted.ok) { lifted = artEngine.lift(hit.id, hit.index); if (!lifted.ok) return; }
            freeHeld = native ? { id: hit.id, native: true } : freeDrag(hit.id);
            const pos = (artEngine.getPositions(hit.id) || [])[hit.index] || [0.5, 0.5];
            const r = host.getBoundingClientRect();
            grab = [x - pos[0] * r.width, y - pos[1] * r.height];
            arrangeHeld = hit; pointer = ev.pointerId;
            host.classList.add('dragging');
            try { host.setPointerCapture(pointer); } catch (e) {}
            ev.preventDefault();
        });
        host.addEventListener('pointermove', ev => {
            if (ev.pointerId !== pointer || !arrangeHeld) return;
            const [x, y] = point(ev);
            const r = host.getBoundingClientRect(), ty = Math.min(1, Math.max(0, (y - grab[1]) / Math.max(1, r.height)));
            if (freeHeld && !freeHeld.native && artEngine.lifted && artEngine.lifted.e && artEngine.lifted.e.id === arrangeHeld.id) artEngine.lifted.groundCenter = ty;   // plants and animals take root wherever you carry them
            artEngine.dragTo(x - grab[0], y - grab[1]);
            if (arrangeBin) arrangeBin.classList.toggle('hot', overBin(ev));
        });
        const finish = ev => {
            if (ev.pointerId !== pointer) return;
            const id = pointer; pointer = null;
            host.classList.remove('dragging');
            const hit = arrangeHeld; arrangeHeld = null;
            const binned = ev.type === 'pointerup' && overBin(ev);
            if (arrangeBin) arrangeBin.classList.remove('hot');
            try { if (host.hasPointerCapture(id)) host.releasePointerCapture(id); } catch (e) {}
            if (!hit || !artEngine) return;
            const d = artEngine.drop();
            if (!d || !d.ok) return;
            const free = freeHeld && !freeHeld.native ? { area: 'full' } : {};
            freeHeld = null;
            if (binned) {
                const r = artEngine.removeInstance(hit.id, hit.index);
                if (r && r.ok) saveArtEdit(hit.id, Object.assign({ count: r.count, density: 1, positions: artEngine.getPositions(hit.id) }, free));
            } else {
                const pos = artEngine.getPositions(hit.id);
                if (Array.isArray(pos)) saveArtEdit(hit.id, Object.assign({ count: pos.length, density: 1, positions: pos }, free));
            }
        };
        host.addEventListener('pointerup', finish);
        host.addEventListener('pointercancel', finish);
        host.addEventListener('lostpointercapture', finish);
        document.addEventListener('keydown', ev => { if (arranging && ev.key === 'Escape') setArrange(false); });
    }

    // ---------- VQ's own drawings: an SVG he writes, turned into an animated scene element ----------
    // The drawing is cleaned (no scripts, links or images), then each shape becomes one engine part, so it gets the
    // same light, depth, wind, dragging, bin and undo as the flowers. Groups marked data-anim move on their own.
    const DRAW_ANIMS = { spin: { amount: 0.6, speed: 1.6 }, rotate: { amount: 0.35, speed: 0.8 }, sway: { amount: 0.35, speed: 0.8 },
        flap: { amount: 0.8, speed: 1.4 }, flutter: { amount: 0.5, speed: 1.4 }, bob: { amount: 0.3, speed: 0.7 }, pulse: { amount: 0.3, speed: 1 },
        glow: { amount: 0.18, speed: 0.8 }, twinkle: { amount: 0.4, speed: 1.2 }, wobble: { amount: 0.3, speed: 1 }, breathe: { amount: 0.25, speed: 0.6 },
        blink: { amount: 0.6, speed: 0.6 } };
    const DRAW_MOTION = {
        fly:    { path: { kind: 'arc', amount: 0.15, speed: 0.9 }, area: 'top' },
        float:  { path: { kind: 'wander', amount: 0.3, speed: 0.45 }, area: 'top', anim: { kind: 'bob', amount: 0.25, speed: 0.5 } },
        drift:  { path: { kind: 'zigzag', amount: 0.1, speed: 0.45 } },
        wander: { path: { kind: 'wander', amount: 0.4, speed: 0.75 } },
        swim:   { path: { kind: 'wander', amount: 0.4, speed: 0.7 }, anim: { kind: 'wobble', amount: 0.15, speed: 0.8 } },
        sway:   { anim: { kind: 'sway', amount: 0.22, speed: 0.6, pivot: [50, 98] } },
        bob:    { anim: { kind: 'bob', amount: 0.3, speed: 0.6 } },
        spin:   { anim: { kind: 'spin', amount: 0.15, speed: 0.3 } },
        still:  {}
    };
    function cssHex(c, alpha) {
        const m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)/.exec(c || '');
        if (!m) return null;
        let a = m[4] == null ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]);
        a *= alpha;
        if (a <= 0.02) return null;
        const h = v => Math.max(0, Math.min(255, Math.round(+v))).toString(16).padStart(2, '0');
        return '#' + h(m[1]) + h(m[2]) + h(m[3]) + (a < 0.98 ? h(a * 255) : '');
    }
    function paintOf(svgRoot, value, alpha) {
        if (!value || value === 'none') return null;
        const u = /url\(["']?#([^"')]+)["']?\)/.exec(value);
        if (u) {   // a gradient: use its middle colour
            const g = svgRoot.querySelector('#' + CSS.escape(u[1]));
            const stops = g ? [...g.querySelectorAll('stop')] : [];
            if (!stops.length) return null;
            const st = getComputedStyle(stops[Math.floor((stops.length - 1) / 2)]);
            return cssHex(st.stopColor, alpha * (parseFloat(st.stopOpacity) || 1));
        }
        return cssHex(value, alpha);
    }
    // A line of width w as a filled outline; a closed line becomes a ring (outer and inner edges wound opposite ways)
    function ribbon(pts, w, closed) {
        let P = pts.slice();
        if (closed && P.length > 2 && Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 1e-3) P.pop();
        const n = P.length, h = w / 2, L = [], R = [];
        for (let i = 0; i < n; i++) {
            const a = P[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = P[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
            let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
            L.push([P[i][0] - dy * h, P[i][1] + dx * h]); R.push([P[i][0] + dy * h, P[i][1] - dx * h]);
        }
        if (!closed) return L.concat(R.reverse());
        return L.concat([L[0]], [R[0]], R.slice(1).reverse(), [R[0]]);
    }
    function rdp(pts, tol) {
        if (pts.length < 4) return pts.slice();
        // A closed outline starts and ends on the same point: split it at its farthest point and simplify each half
        const [sx, sy] = pts[0], [ex, ey] = pts[pts.length - 1];
        if (Math.hypot(ex - sx, ey - sy) < 1e-6) {
            let k = 1, best = -1;
            for (let i = 1; i < pts.length - 1; i++) { const d = Math.hypot(pts[i][0] - sx, pts[i][1] - sy); if (d > best) { best = d; k = i; } }
            if (best <= 0) return [pts[0]];
            return rdp(pts.slice(0, k + 1), tol).concat(rdp(pts.slice(k), tol).slice(1));
        }
        const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
        const stack = [[0, pts.length - 1]];
        while (stack.length) {
            const [a, b] = stack.pop(); let best = -1, bi = -1;
            const [x1, y1] = pts[a], [x2, y2] = pts[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1e-9;
            for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / L; if (d > best) { best = d; bi = i; } }
            if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
        }
        return pts.filter((p, i) => keep[i]);
    }
    function svgToCustom(svgText, opts) {
        opts = opts || {};
        if (!window.DOMPurify) return { ok: false, error: 'the drawing tools did not load' };
        const clean = window.DOMPurify.sanitize(String(svgText || ''), { USE_PROFILES: { svg: true }, ADD_ATTR: ['data-anim', 'data-pivot'],
            FORBID_TAGS: ['image', 'text', 'use', 'foreignObject', 'style', 'a', 'script', 'tspan', 'textPath', 'animate', 'animateTransform', 'animateMotion', 'set'] });
        const holder = document.createElement('div');
        holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:100px;height:100px;opacity:0;pointer-events:none;';
        holder.innerHTML = clean;
        document.body.appendChild(holder);
        try {
            const svg = holder.querySelector('svg');
            if (!svg) return { ok: false, error: 'the drawing came back empty' };
            svg.setAttribute('width', '100'); svg.setAttribute('height', '100');
            svg.removeAttribute('x'); svg.removeAttribute('y'); svg.removeAttribute('style');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            // Fit the drawing to its content, whatever box it was drawn in
            let bb = null;
            try { bb = svg.getBBox(); } catch (e) {}
            if (!bb || !(bb.width > 0) || !(bb.height > 0)) return { ok: false, error: 'the drawing had no visible shapes' };
            const side = Math.max(bb.width, bb.height) * 1.06, cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
            svg.setAttribute('viewBox', `${cx - side / 2} ${cy - side / 2} ${side} ${side}`);
            const skip = 'defs, clipPath, mask, pattern, linearGradient, radialGradient, symbol, marker';
            const shapes = [...svg.querySelectorAll('path, circle, ellipse, rect, polygon, polyline, line')].filter(n => !n.closest(skip));
            const clampP = v => Math.max(0, Math.min(100, +v.toFixed(2)));
            const raw = [];   // {kind, pts|box, fill, stroke, closed, group, area}
            for (const n of shapes) {
                const cs = getComputedStyle(n);
                if (cs.display === 'none' || cs.visibility === 'hidden') continue;
                let alpha = 1;
                for (let a = n; a && a !== svg.parentNode; a = a.parentNode) if (a.nodeType === 1) alpha *= parseFloat(getComputedStyle(a).opacity) || (getComputedStyle(a).opacity === '0' ? 0 : 1);
                const sw = parseFloat(cs.strokeWidth) || 0;
                const fill = ['line', 'polyline'].includes(n.tagName) ? null : paintOf(svg, cs.fill, alpha * (parseFloat(cs.fillOpacity) || (cs.fillOpacity === '0' ? 0 : 1)));
                const stroke = sw > 0 ? paintOf(svg, cs.stroke, alpha * (parseFloat(cs.strokeOpacity) || (cs.strokeOpacity === '0' ? 0 : 1))) : null;
                if (!fill && !stroke) continue;
                const m = n.getCTM();
                if (!m) continue;
                const T = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
                const group = n.closest('[data-anim]');
                const base = { fill, stroke, group: group && svg.contains(group) ? group : null, sw: stroke ? sw * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 0 };
                const tag = n.tagName.toLowerCase();
                const upright = Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6;
                if ((tag === 'circle' || tag === 'ellipse') && upright) {
                    const ccx = n.cx.baseVal.value, ccy = n.cy.baseVal.value;
                    const rx = (tag === 'circle' ? n.r.baseVal.value : n.rx.baseVal.value) * Math.abs(m.a), ry = (tag === 'circle' ? n.r.baseVal.value : n.ry.baseVal.value) * Math.abs(m.d);
                    const [x, y] = T(ccx, ccy);
                    if (!(rx > 0.05 && ry > 0.05)) continue;
                    raw.push(Object.assign({ kind: 'ellipse', box: [[clampP(x - rx), clampP(y - ry)], [clampP(x + rx), clampP(y + ry)]], area: rx * ry * Math.PI }, base));
                    continue;
                }
                let polys = [], closed = true;
                if (tag === 'line') { polys = [[T(n.x1.baseVal.value, n.y1.baseVal.value), T(n.x2.baseVal.value, n.y2.baseVal.value)]]; closed = false; }
                else if ((tag === 'polygon' || tag === 'polyline') && n.points) { polys = [[...n.points].map(p => T(p.x, p.y))]; closed = tag === 'polygon'; }
                else if (tag === 'rect' && !(n.rx.baseVal.value || n.ry.baseVal.value)) {
                    const x = n.x.baseVal.value, y = n.y.baseVal.value, w = n.width.baseVal.value, h = n.height.baseVal.value;
                    if (!(w > 0 && h > 0)) continue;
                    polys = [[T(x, y), T(x + w, y), T(x + w, y + h), T(x, y + h)]];
                } else {
                    // Curves: sample densely along the outline, splitting where the pen jumps (separate sub-shapes)
                    let len = 0; try { len = n.getTotalLength(); } catch (e) {}
                    if (!(len > 0)) continue;
                    const N = Math.max(24, Math.min(320, Math.round(len * 3))), step = len / N;
                    let cur = [], prev = null;
                    for (let i = 0; i <= N; i++) {
                        const p = n.getPointAtLength(Math.min(len, i * step)), q = [p.x, p.y];
                        if (prev && Math.hypot(q[0] - prev[0], q[1] - prev[1]) > step * 3.5) { if (cur.length > 1) polys.push(cur); cur = []; }
                        cur.push(q); prev = q;
                    }
                    if (cur.length > 1) polys.push(cur);
                    polys = polys.map(pl => pl.map(([x, y]) => T(x, y)));
                    if (tag === 'path') closed = !!fill || /z\s*$/i.test(n.getAttribute('d') || '');
                }
                for (const pl of polys) {
                    const pts = pl.map(([x, y]) => [clampP(x), clampP(y)]);
                    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
                    const area = (Math.max(...xs) - Math.min(...xs) + 0.5) * (Math.max(...ys) - Math.min(...ys) + 0.5);
                    raw.push(Object.assign({ kind: closed && fill ? 'polygon' : (closed ? 'polygon' : 'path'), dense: pts, area }, base));
                }
            }
            // Thick lines (bike frames, ropes, legs, rims) become real shapes at their true width; the engine's own
            // strokes are hairlines, which would make them vanish
            for (let i = 0; i < raw.length; i++) {
                const p = raw[i];
                if (!p.stroke || p.sw < 0.9) continue;
                let line = p.dense, closed = p.kind === 'polygon';
                if (p.kind === 'ellipse') {
                    const [[x0, y0], [x1, y1]] = p.box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
                    line = Array.from({ length: 48 }, (_, k) => [cx + rx * Math.cos(k / 48 * 2 * Math.PI), cy + ry * Math.sin(k / 48 * 2 * Math.PI)]);
                    line.push(line[0].slice()); closed = true;
                } else if (closed && line && line.length > 2) line = line.concat([line[0].slice()]);
                if (!line || line.length < 2) continue;
                const rib = { kind: 'ribbon', dense: line, closed, w: Math.min(p.sw, 14), fill: p.stroke, stroke: null, group: p.group, area: p.area };
                if (p.fill) { p.stroke = null; raw.splice(i + 1, 0, rib); i++; } else raw[i] = rib;
            }
            if (!raw.length) return { ok: false, error: 'the drawing had no shapes I could use' };
            // Budget: the engine takes up to 40 parts (one is the invisible body that carries the whole-drawing motion)
            let parts = raw;
            if (parts.length > 39) {
                const keep = new Set(parts.map((p, i) => [p.area, i]).sort((a, b) => b[0] - a[0]).slice(0, 39).map(x => x[1]));
                parts = parts.filter((p, i) => keep.has(i));
            }
            // ...and 300 points in total: simplify the outlines until they fit, keeping corners and curves
            let tol = 0.1, total = Infinity;
            for (let k = 0; k < 14 && total > 290; k++, tol *= 1.45) {
                total = 2;
                for (const p of parts) {
                    if (p.kind === 'ribbon') { p.pts = rdp(p.dense, tol); total += p.pts.length * 2 + 2; }
                    else if (p.dense) { p.pts = rdp(p.dense, tol); if (p.kind === 'polygon' && p.pts.length > 3 && Math.hypot(p.pts[0][0] - p.pts[p.pts.length - 1][0], p.pts[0][1] - p.pts[p.pts.length - 1][1]) < 0.3) p.pts.pop(); total += p.pts.length; }
                    else total += 2;
                }
            }
            parts = parts.filter(p => !p.dense || (p.kind === 'polygon' ? p.pts.length >= 3 : p.pts.length >= 2));
            for (const p of parts) if (p.kind === 'ribbon') { p.pts = ribbon(p.pts, p.w, p.closed).map(([x, y]) => [clampP(x), clampP(y)]); p.kind = 'polygon'; }
            if (total > 300) return { ok: false, error: 'the drawing was too detailed' };
            // Joints: the invisible body first, then each animated group hangs from its first shape
            const motion = DRAW_MOTION[opts.motion] || DRAW_MOTION.still;
            const out = [{ id: 'body', shape: 'circle', points: [[50, 50], [50.5, 50]], fill: '#00000000' }];
            if (motion.anim) out[0].animate = Object.assign({ pivot: [50, 50] }, motion.anim);
            const groups = new Map(); let gN = 0;
            for (const p of parts) {
                const part = { shape: p.kind === 'ellipse' ? 'ellipse' : p.kind, points: p.kind === 'ellipse' ? p.box : p.pts };
                if (p.kind === 'ellipse' && Math.abs((p.box[1][0] - p.box[0][0]) - (p.box[1][1] - p.box[0][1])) < 0.05) {
                    const r = (p.box[1][0] - p.box[0][0]) / 2, c = [+(p.box[0][0] + r).toFixed(2), +(p.box[0][1] + r).toFixed(2)];
                    part.shape = 'circle'; part.points = [c, [+(c[0] + r).toFixed(2), c[1]]];
                }
                if (p.fill) part.fill = p.fill;
                if (p.stroke) part.stroke = p.stroke;
                const kind = p.group && String(p.group.getAttribute('data-anim') || '').toLowerCase().trim();
                if (kind && DRAW_ANIMS[kind]) {
                    if (!groups.has(p.group)) {
                        gN++;
                        part.id = 'g' + gN; part.parent = 'body';
                        let pivot = null;
                        const pv = /(-?[\d.]+)[ ,]+(-?[\d.]+)/.exec(p.group.getAttribute('data-pivot') || '');
                        const gm = p.group.getCTM && p.group.getCTM();
                        if (pv && gm) pivot = [clampP(gm.a * +pv[1] + gm.c * +pv[2] + gm.e), clampP(gm.b * +pv[1] + gm.d * +pv[2] + gm.f)];
                        if (!pivot) {   // the centre of everything in the group
                            const pts = parts.filter(q => q.group === p.group).flatMap(q => q.pts || q.box);
                            const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
                            pivot = [clampP((Math.min(...xs) + Math.max(...xs)) / 2), clampP((Math.min(...ys) + Math.max(...ys)) / 2)];
                        }
                        part.animate = Object.assign({ kind, pivot }, DRAW_ANIMS[kind]);
                        groups.set(p.group, part.id);
                    } else part.parent = groups.get(p.group);
                } else part.parent = 'body';
                out.push(part);
            }
            const name = String(opts.name || 'drawing').replace(/[^\w '\-]/g, '').trim().slice(0, 40) || 'drawing';
            const place = { sky: 'top', ground: 'bottom', anywhere: 'full' }[opts.place];
            const element = { type: 'custom', name, parts: out, count: Math.max(1, Math.min(6, +opts.count || 1)),
                size: Math.max(40, Math.min(260, +opts.size || (opts.place === 'ground' ? 170 : 140))), depth: opts.depth || 'mid',
                area: place || motion.area || 'full', spawn: 'grow' };
            if (motion.path) element.path = Object.assign({}, motion.path);
            // Check it the way the scene will draw it
            const probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;left:-10000px;top:0;width:300px;height:200px;';
            document.body.appendChild(probe);
            try {
                const t = window.VQArt ? window.VQArt.create({ root: probe }) : null;
                const r = t ? t.render({ elements: [element] }) : { ok: true };
                if (t) t.dispose();
                if (!r.ok) {
                    console.warn('Drawing rejected by the scene engine:', r.error);
                    return { ok: false, error: 'the scene couldn’t use that drawing (' + String(r.error || '').slice(0, 120) + ')' };
                }
            } finally { probe.remove(); }
            return { ok: true, element, parts: out.length - 1, points: total };
        } catch (e) {
            console.warn('Drawing conversion failed:', e);
            return { ok: false, error: 'the drawing couldn’t be converted' };
        } finally { holder.remove(); }
    }
    // ---------- Sizing any scene element: flowers, trees, animals, drawings ----------
    let lastArtWord = '';   // what "it" means: the last thing added or changed in the scene
    const SIZE_WORDS = [
        [/^(?:much|a lot|way) (?:bigger|larger)$|^(?:much|a lot) more big$/, { mul: 1.7 }], [/^(?:a bit|a little|slightly|bit) (?:bigger|larger)$/, { mul: 1.15 }],
        [/^(?:bigger|larger|big|large-?r)$/, { mul: 1.3 }], [/^(?:much|a lot|way) smaller$/, { mul: 1 / 1.7 }], [/^(?:a bit|a little|slightly|bit) smaller$/, { mul: 1 / 1.15 }],
        [/^smaller$/, { mul: 1 / 1.3 }], [/^(?:double(?: size| the size)?|twice as big|twice the size|2x)$/, { mul: 2 }], [/^(?:half(?: size| the size)?|half as big)$/, { mul: 0.5 }],
        [/^(?:triple(?: size)?|three times as big|3x)$/, { mul: 3 }],
        [/^(?:tiny|very small)$/, { abs: 0.45 }], [/^small$/, { abs: 0.7 }], [/^(?:medium|normal|normal size|regular|default size|original size)$/, { abs: 1 }],
        [/^large$/, { abs: 1.5 }], [/^(?:huge|giant|enormous|massive|very big|very large)$/, { abs: 2.4 }],
        [/^(?:fill the scene|fill the screen|as big as the screen|full screen|as big as possible|maximum|max)$/, { screen: 0.85 }],
        [/^(?:half the scene|half the screen|half screen)$/, { screen: 0.5 }], [/^(?:a quarter of the (?:scene|screen)|quarter screen)$/, { screen: 0.25 }]
    ];
    function sizeChange(word) {
        const w = String(word || '').toLowerCase().trim();
        const pct = /^(\d{2,3})\s*%$/.exec(w);
        if (pct) return { abs: +pct[1] / 100 };
        for (const [re, v] of SIZE_WORDS) if (re.test(w)) return v;
        return null;
    }
    function defaultArtSize(e) {
        try { const d = window.VQArt.capabilities().shared.size.defaults; if (d && d[e.type]) return d[e.type]; } catch (err) {}
        return { assembly: 140, custom: 120, tree: 150, flower: 60 }[e.type] || 80;
    }
    function findArtTarget(art, words) {
        let w = String(words || '').toLowerCase().replace(/\b(the|my|those|these|all the|all|size of the|size of)\b/g, ' ').replace(/\s+/g, ' ').trim();
        if (/^(it|them|that|this|those|these|one)$/.test(w) || !w) w = lastArtWord;
        if (!w) return -1;
        const d = findDrawing(art, w);
        if (d >= 0) return d;
        const it = parseItem(w);
        if (!it || it.kind !== 'art') return -1;
        const vk = (e) => (e.type === 'assembly' || e.type === 'custom') ? String(e.name || '').toLowerCase() : (e.species || e.style || e.kind || '');
        const want = vk(it.item);
        let i = art.findIndex(e => e.type === it.item.type && (!want || vk(e) === want));
        if (i < 0) i = art.findIndex(e => e.type === it.item.type);
        return i;
    }
    // Resize one element; returns { name, size, capped } or null
    function resizeArt(sp, words, how) {
        const ch = sizeChange(how);
        const i = ch ? findArtTarget(sp.art || [], words) : -1;
        if (i < 0) return null;
        const e = sp.art[i], base = defaultArtSize(e), cur = e.size || base;
        const host = document.querySelector('.vq-art-host');
        const H = host ? host.getBoundingClientRect().height : innerHeight;
        let next = ch.screen ? H * ch.screen : ch.abs ? base * ch.abs : cur * ch.mul;
        const capped = next > 1000 || next < 8;
        delete e.sizeRelative; delete e.scale;
        e.size = Math.round(Math.max(8, Math.min(1000, next)));
        const name = e.name || e.species || e.style || e.kind || e.type;
        lastArtWord = name;
        return { name, size: e.size, capped, smaller: e.size < cur };
    }
    // Creatures together: chase, flee, follow, play, herd, pointer; or stop. Edits sp in place; returns a note, or null if it doesn't apply.
    function socialEdit(sp, soc) {
        const art = sp.art || [];
        const ai = (w) => { const i = findArtTarget(art, w); return i >= 0 && art[i].type === 'assembly' ? i : -1; };
        const wi = ai(soc.who), ti = soc.target ? ai(soc.target) : -2;
        if (wi < 0 || ti === -1 || ti === wi) return null;
        const a = art[wi], b = ti >= 0 ? art[ti] : null;
        let note;
        if (soc.kind === 'stop') { delete a.social; delete a.pointer; if (['run', 'play'].includes(a.motion)) a.motion = motionFor(a.rig, 'walk') || a.motion; note = `The ${a.name} stopped`; }
        else if (soc.kind === 'pointer-chase' || soc.kind === 'pointer-flee') { a.pointer = soc.kind === 'pointer-chase' ? 'chase' : 'flee'; note = soc.kind === 'pointer-chase' ? `The ${a.name} will chase your pointer` : `The ${a.name} will shy away from your pointer`; }
        else if (soc.kind === 'herd') { a.social = { kind: 'herd' }; a.motion = motionFor(a.rig, 'graze') || motionFor(a.rig, 'walk') || a.motion; if ((a.count || 1) < 3) a.count = 4; note = `The ${a.name} are keeping together`; }
        else if (['chase', 'flee', 'follow', 'play'].includes(soc.kind) && b) {
            a.social = { kind: soc.kind, target: b.name, style: soc.style || 'playful' };
            const mv = motionFor(a.rig, soc.kind === 'follow' ? 'walk' : soc.kind === 'play' ? 'play' : 'run');
            if (mv) a.motion = mv;
            if (soc.both || soc.kind === 'play') { b.social = { kind: 'play', target: a.name }; const mb = motionFor(b.rig, 'play'); if (mb) b.motion = mb; }
            note = { chase: `The ${a.name} is chasing the ${b.name}`, flee: `The ${a.name} runs away from the ${b.name}`, follow: `The ${a.name} follows the ${b.name}`, play: `The ${a.name} and the ${b.name} are playing` }[soc.kind];
        } else return null;
        lastArtWord = a.name;
        return note;
    }
    window.VQScene = { results: () => showResultsStage(), history: (o) => showHistory(o), moment: (m) => startMoment(m), endMoment: () => endMoment(), engine: () => artEngine, ids: () => Object.assign({}, artIdIndex), arrange: (on) => setArrange(on !== false), convert: svgToCustom,
        particles: (r) => { setParticles(typeof r === 'string' ? { preset: r } : r); saveUIPrefs(); return applyParticles(); }, particleBox: () => particleBox, celebrate: (k) => celebrate(k) };   // for testing and tinkering
    // An animal VQ assembled from the parts kit: checked by the scene engine, then added like any other element
    function addCreature(act) {
        const r = act.recipe && typeof act.recipe === 'object' ? JSON.parse(JSON.stringify(act.recipe)) : null;
        if (!r) return { ok: false, name: act.name || 'that animal', error: 'the recipe was missing' };
        const el2 = Object.assign({ type: 'assembly', rig: 'quadruped', recipeVersion: 1, count: 1, size: 150, motion: 'idle' }, r, { type: 'assembly' });
        el2.name = String(el2.name || act.name || 'animal').replace(/[^\w '\-]/g, '').slice(0, 40) || 'animal';
        if (window.VQArt) {
            const probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;left:-10000px;top:0;width:300px;height:200px;';
            document.body.appendChild(probe);
            try {
                const t = window.VQArt.create({ root: probe }), res = t.render({ elements: [Object.assign({ id: 'probe' }, el2)] });
                t.dispose();
                if (!res.ok) return { ok: false, name: el2.name, error: 'its recipe didn’t fit my parts (' + String(res.error || '').slice(0, 140) + ')' };
            } finally { probe.remove(); }
        }
        const sp = currentThemeSpec();
        sp.art = sp.art || [];
        const same = sp.art.findIndex(e => e.type === 'assembly' && String(e.name || '').toLowerCase() === el2.name.toLowerCase());
        if (same >= 0) sp.art[same] = el2;
        else if (sp.art.length >= 8) return { ok: false, full: true, name: el2.name };
        else sp.art.push(el2);
        const inst = installTheme(sp);
        lastArtWord = el2.name;
        return { ok: true, name: el2.name, theme: inst.spec.name, count: el2.count, creature: true };
    }
    // Put a drawing into the current theme (replacing an earlier drawing of the same name)
    function addDrawing(act) {
        const conv = svgToCustom(act.svg, { name: act.name, motion: act.motion, place: act.place, count: act.count, size: act.draw_size });
        if (!conv.ok) return { ok: false, name: act.name || 'that drawing', error: conv.error };
        const sp = currentThemeSpec();
        sp.art = sp.art || [];
        const el2 = Object.assign({}, conv.element, act.what ? { what: String(act.what).slice(0, 240) } : {});
        const same = sp.art.findIndex(e => e.type === 'custom' && String(e.name || '').toLowerCase() === el2.name.toLowerCase());
        if (same >= 0) sp.art[same] = el2;
        else if (sp.art.length >= 8) return { ok: false, full: true, name: el2.name };
        else sp.art.push(el2);
        const r = installTheme(sp);
        lastArtWord = el2.name;
        return { ok: true, name: el2.name, theme: r.spec.name, count: el2.count };
    }
    // Find one of VQ's drawings by the words the user uses ("the plane", "balloons")
    function findDrawing(art, words) {
        const w = String(words || '').toLowerCase().replace(/\b(the|a|an|my|your|some|all)\b/g, ' ').replace(/[^a-z0-9 \-']/g, ' ').trim();
        if (!w) return -1;
        const stem = s => s.replace(/(es|s)$/, '');
        return (art || []).findIndex(e => e && (e.type === 'custom' || e.type === 'assembly') && (() => {
            const n = String(e.name || '').toLowerCase();
            return n === w || stem(n) === stem(w) || n.split(/\s+/).some(t => t.length > 2 && w.split(/\s+/).some(u => stem(u) === stem(t)));
        })());
    }

    // Plain words → one element, e.g. "red tulips", "6 monarch butterflies", "cherry blossom trees", "a galaxy"
    const COLOR_WORDS = { red: '#e0484f', pink: '#f28cb8', yellow: '#f5d04a', orange: '#f59a45', purple: '#a06cdc', violet: '#8b6cf0',
        blue: '#5a9cf0', white: '#f4f1ea', gold: '#e8b04a', golden: '#e8b04a', green: '#5fae6e', black: '#2a2622', lilac: '#c7a6f0', coral: '#ff7f6b' };
    function parseItem(text) {
        let t = ' ' + String(text || '').toLowerCase().replace(/[^a-z0-9 \-]/g, ' ').replace(/\s+/g, ' ') + ' ';
        const num = (t.match(/ (\d{1,2}) /) || [])[1];
        const colors = Object.keys(COLOR_WORDS).filter(c => t.includes(' ' + c + ' ')).map(c => COLOR_WORDS[c]);
        const has = (w) => new RegExp(`\\b(${w})\\b`).test(t);
        const named = (type, extra) => { if (!colors.length) return {}; const nat = artPalette(Object.assign({ type }, extra || {})).slice(); nat[1] = colors[0]; if (colors[1] && nat.length > 2) nat[2] = colors[1]; return { colors: nat }; };
        const art = (type, extra) => ({ kind: 'art', item: Object.assign({ type }, extra || {}, num ? { count: +num } : {}, named(type, extra)) });
        const animal = Object.keys(ANIMAL_WORDS).find(k => has(ANIMAL_WORDS[k]));
        if (animal) {
            const item = JSON.parse(JSON.stringify(ANIMALS[animal]));
            if (num) item.count = Math.max(1, Math.min(6, +num));
            const mw = (t.match(/\b(walking|walk|roaming|grazing|graze|eating|sitting|sit|running|run|playing|play|swimming|swim|flying|fly|hopping|hop|crawling|crawl|perching|perched)\b/) || [])[1];
            const mo = mw && motionFor(item.rig, mw);
            if (mo) item.motion = mo;
            return { kind: 'art', item };
        }
        const species = ['daisy', 'tulip', 'rose', 'poppy', 'lavender', 'sunflower', 'wildflower', 'lily'];
        const sp = species.find(x => has(x + '|' + x + 's|' + x.replace(/y$/, 'ies')));
        if (sp || has('flowers?|blooms?|blossoms') && !has('cherry')) return art('flower', sp ? { species: sp } : {});
        const bstyle = ['monarch', 'blue', 'swallowtail', 'moth'].find(x => has(x + 's?'));
        if (has('butterfl(y|ies)|moths?')) return art('butterfly', bstyle ? { style: bstyle } : {});
        if (has('petals?')) return art('falling-petals');
        const kind = has('cherry') ? 'cherry-blossom' : ['pine', 'oak', 'birch', 'palm', 'willow'].find(x => has(x + 's?|' + x + 'es'));
        if (has('trees?|forest|woods') || kind) return art('tree', kind ? { kind } : {});
        if (has('ferns?')) return art('fern');
        if (has('bush(es)?|shrubs?|hedges?')) return art('bush');
        if (has('reeds?|rushes|cattails?')) return art('reeds');
        if (has('birds?|flock|seagulls?|gulls?')) return art('bird');
        const fx = [['grass', 'grass|meadow'], ['mountains', 'mountains?|hills?'], ['comet', 'comet'], ['planet', 'planets?|saturn'], ['aurora', 'aurora|northern lights'],
            ['fireflies', 'fireflies|firefly'], ['snow', 'snow|snowflakes?'], ['leaves', 'leaves|leaf'], ['static', 'static|tv noise|noise'], ['crt', 'crt|old tv screen|scanlines'],
            ['tvset', 'tv set|tv cabinet|television|knobs'], ['stars', 'stars|starfield|star field']];
        for (const [type, words] of fx) if (has(words)) return { kind: 'fx', type };
        const tk = [['galaxy', 'galax(y|ies)'], ['nebula', 'nebulae?'], ['constellations', 'constellations?'], ['waves', 'waves'], ['seashore', 'surf'], ['matrix', 'matrix|falling code|code rain'],
            ['orbits', 'orbits?|rings'], ['vortex', 'vortex|whirlpool'], ['tunnel', 'tunnel'], ['grid', 'grid|synthwave'], ['circuit', 'circuits?|circuit traces'], ['comets', 'comets'],
            ['ripples', 'ripples?'], ['grain', 'grain|film grain'], ['mist', 'mist|fog|haze'], ['clouds', 'clouds?']];
        for (const [type, words] of tk) if (has(words)) return { kind: 'tk', type };
        return null;
    }

    // Edit the current theme one element at a time. A built-in theme becomes "yours" (a copy) on the first edit.
    function currentThemeSpec() {
        const cs = customSpec(uiPrefs.theme);
        if (cs) return JSON.parse(JSON.stringify(cs));
        const v = THEMES[uiPrefs.theme] || THEMES.vq;
        const [a1, a2] = ACCENTS[uiPrefs.accent] || ACCENTS[THEME_ACCENT[uiPrefs.theme]] || ACCENTS.orange;
        const name = (uiPrefs.theme === 'vq' ? 'VQ' : cap(uiPrefs.theme || 'VQ')) + ' (yours)';
        return { name, background: v[0], surface: v[3], text: v[6], accent: a1, accent2: a2, icon: a2, effects: [], layers: [], art: [] };
    }
    function editTheme(edit) {
        edit = Object.assign({}, edit);
        const sp = currentThemeSpec();
        sp.effects = sp.effects || []; sp.layers = sp.layers || []; sp.art = sp.art || [];
        const out = { added: null, removed: null, missing: null, full: false };
        const skyAdd = edit.add && !parseItem(edit.add) && skyFrom(edit.add);
        if (skyAdd) { setSky(skyAdd); out.added = SKY_LABEL[skyAdd] + ' sky'; edit = Object.assign({}, edit, { add: null }); }
        if (edit.add) {
            const it = parseItem(edit.add);
            const dIdx = !it ? findDrawing(sp.art, edit.add) : -1;
            if (dIdx >= 0) {   // one of VQ's drawings: more (or fewer) of it
                if (edit.count) { sp.art[dIdx].count = Math.max(1, Math.min(6, edit.count)); delete sp.art[dIdx].positions; }
                out.added = sp.art[dIdx].name;
            } else if (!it) out.missing = edit.add;
            else if (it.kind === 'art') {
                if (edit.count) it.item.count = edit.count;
                const vkey = (e) => (e.type === 'assembly' || e.type === 'custom') ? String(e.name || '').toLowerCase() : (e.species || e.style || e.kind || '');
                const same = sp.art.findIndex(e => e.type === it.item.type && vkey(e) === vkey(it.item));
                if (same >= 0) sp.art[same] = Object.assign(sp.art[same], it.item);
                else if (sp.art.length >= 8) out.full = true; else sp.art.push(it.item);
                out.added = edit.add;
            } else if (it.kind === 'fx') {
                if (!sp.effects.includes(it.type)) { if (sp.effects.length >= 4) out.full = true; else sp.effects.push(it.type); }
                out.added = edit.add;
            } else {
                if (!sp.layers.some(l => l.type === it.type)) { if (sp.layers.length >= 4) out.full = true; else sp.layers.push({ type: it.type, params: {} }); }
                out.added = edit.add;
            }
        }
        if (edit.remove) {
            const it = parseItem(edit.remove);
            const before = sp.art.length + sp.effects.length + sp.layers.length;
            const dIdx = it ? -1 : findDrawing(sp.art, edit.remove);
            if (dIdx >= 0) sp.art.splice(dIdx, 1);
            if (it && it.kind === 'art' && it.item.type === 'assembly') sp.art = sp.art.filter(e => !(e.type === 'assembly' && String(e.name).toLowerCase() === it.item.name));
            else if (it && it.kind === 'art') sp.art = sp.art.filter(e => e.type !== it.item.type || (it.item.species && e.species !== it.item.species) || (it.item.style && e.style !== it.item.style) || (it.item.kind && e.kind !== it.item.kind));
            if (it && it.kind === 'fx') sp.effects = sp.effects.filter(e => e !== it.type);
            if (it && it.kind === 'tk') sp.layers = sp.layers.filter(l => l.type !== it.type);
            if (sp.art.length + sp.effects.length + sp.layers.length < before) out.removed = edit.remove;
            else if (/\b(storm|rain|sunset|night|moon|seashore|beach|sea|clouds|mist|sky)\b/i.test(edit.remove)) { uiPrefs.scene = 'none'; uiPrefs.mist = false; out.removed = edit.remove; }
            if (!out.removed) out.missing = out.missing || edit.remove;
        }
        if (edit.who && edit.does) {
            const d = String(edit.does).toLowerCase();
            if (['chase', 'hunt', 'flee', 'follow', 'play', 'herd', 'stop', 'pointer-chase', 'pointer-flee'].includes(d)) {
                const n = socialEdit(sp, { who: edit.who, kind: d === 'hunt' ? 'chase' : d, target: edit.target, style: d === 'hunt' ? 'hunt' : 'playful' });
                if (n) out.did = n; else out.missing = out.missing || edit.who;
            } else {
                const i = findArtTarget(sp.art || [], edit.who), a = i >= 0 ? sp.art[i] : null;
                const mo = a && a.type === 'assembly' ? motionFor(a.rig, d) : null;
                if (mo) { a.motion = mo; out.did = `The ${a.name} is now ${{ walk: 'walking', run: 'running', play: 'playing', graze: 'grazing', sit: 'sitting', idle: 'resting', swim: 'swimming', fly: 'flying', hop: 'hopping', crawl: 'crawling', slither: 'slithering', perch: 'perched' }[mo]}`; lastArtWord = a.name; }
                else out.missing = out.missing || edit.who;
            }
        }
        if (edit.resize && edit.size) {
            const r = resizeArt(sp, edit.resize, edit.size);
            if (r) out.resized = r; else out.missing = out.missing || edit.resize;
        }
        if (out.added) lastArtWord = String(out.added);
        if (edit.shade === 'darker') sp.background = mixHex(sp.background, '#000000', 0.35);
        if (edit.shade === 'lighter') sp.background = mixHex(sp.background, '#ffffff', 0.12);
        if (edit.accent_hex) { sp.accent = edit.accent_hex; sp.accent2 = mixHex(edit.accent_hex, '#ffffff', 0.35); }
        const r = installTheme(sp);
        out.name = r.spec.name;
        return out;
    }

    // ---------- The wooden TV set: a cabinet around the app with working knobs ----------
    function buildTvControls() {
        const c = el('div', 'tv-controls');
        const ticks = Array.from({ length: 12 }, (_, i) => `<i style="transform:rotate(${i * 30}deg)"><b style="transform:rotate(${-i * 30}deg)">${i + 2}</b></i>`).join('');
        c.innerHTML = `<div class="tv-brand">VQ</div>
            <button type="button" class="tv-knob tv-channel" aria-label="Turn the channel dial"><span class="tv-dial">${ticks}</span><span class="tv-cap"><span class="tv-pointer"></span></span></button>
            <button type="button" class="tv-knob tv-volume" aria-label="Turn the volume knob"><span class="tv-cap small"><span class="tv-pointer"></span></span></button>
            <div class="tv-grille">${'<span></span>'.repeat(9)}</div>
            <button type="button" class="tv-power" aria-label="Power button"><span class="tv-led"></span></button>
            <div class="tv-osd" aria-hidden="true"></div>`;
        document.body.appendChild(c);
        let ch = 0, vol = 6;
        const osd = c.querySelector('.tv-osd');
        const showOsd = (txt) => { osd.textContent = txt; osd.classList.remove('show'); void osd.offsetWidth; osd.classList.add('show'); };
        c.querySelector('.tv-channel').addEventListener('click', () => {
            ch = (ch + 1) % 12;
            c.querySelector('.tv-channel .tv-cap').style.transform = `rotate(${ch * 30}deg)`;
            const host = document.getElementById('app-container');
            if (host) { host.classList.remove('tv-burst'); void host.offsetWidth; host.classList.add('tv-burst'); }
            showOsd(`CH ${String(ch + 2).padStart(2, '0')}`);
        });
        c.querySelector('.tv-volume').addEventListener('click', () => {
            vol = (vol + 1) % 11;
            c.querySelector('.tv-volume .tv-cap').style.transform = `rotate(${vol * 27 - 135}deg)`;
            showOsd(`VOLUME ${'▮'.repeat(vol)}${'▯'.repeat(10 - vol)}`);
        });
        c.querySelector('.tv-power').addEventListener('click', () => {
            document.body.classList.remove('tv-off'); void document.body.offsetWidth;
            document.body.classList.add('tv-off');
            setTimeout(() => {
                document.body.classList.remove('tv-off');
                const on = document.querySelector('.fx-crt-on');
                if (on) { on.style.animation = 'none'; void on.offsetWidth; on.style.animation = ''; }
            }, 1500);
        });
    }

    // A comet crosses the sky every 12-25 seconds, on a slightly different path each time
    function scheduleComet(layer) {
        clearTimeout(cometTimer);
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches || uiPrefs.motion === 'reduced';
        if (calm) return;
        cometTimer = setTimeout(() => {
            const c = layer.querySelector('.fx-comet');
            if (!c || !document.body.contains(c)) return;
            if (!document.hidden) {
                c.style.top = rnd(4, 30).toFixed(1) + 'vh';
                c.style.setProperty('--ang', rnd(12, 26).toFixed(1) + 'deg');
                c.classList.remove('fly'); void c.offsetWidth; c.classList.add('fly');
            }
            scheduleComet(layer);
        }, rnd(12000, 25000));
    }


    // ---------- The complete customisation catalogue: always accurate, free, and every chip works ----------
    const SKY_WORDS = { storm: 'storm', stormy: 'storm', thunderstorm: 'storm', sunset: 'sunset', dusk: 'sunset', night: 'night', 'night sky': 'night',
        moon: 'night', moonlight: 'night', starry: 'night', clouds: 'clouds', cloudy: 'clouds', mist: 'mist', 'seashore': 'seaday', beach: 'seaday',
        'seashore day': 'seaday', 'seashore at night': 'seanight', 'beach at night': 'seanight', 'moonlit sea': 'seanight', 'night sea': 'seanight',
        'no sky': 'none', 'still background': 'none', 'clear sky': 'none' };
    Object.entries(LIVE_SKIES).forEach(([k, v]) => [k, v.label.toLowerCase(), ...v.words].forEach(w => { SKY_WORDS[w] = k; }));
    function skyFrom(text) {
        const t = String(text || '').toLowerCase().replace(/\b(the|a|an|sky|effect|scene|background|please|turn on|make it|show me)\b/g, ' ').replace(/\s+/g, ' ').trim();
        if (SKY_WORDS[t]) return SKY_WORDS[t];
        const two = String(text || '').toLowerCase();
        for (const k of ['seashore at night', 'beach at night', 'moonlit sea', 'night sea', 'night sky', 'no sky', 'still background']) if (two.includes(k)) return SKY_WORDS[k];
        for (const [k, v] of Object.entries(LIVE_SKIES)) if ([v.label.toLowerCase(), ...v.words].some(w => w.includes(' ') && two.includes(w))) return k;
        return null;
    }
    function setSky(sky) {
        uiPrefs.scene = sky; uiPrefs.mist = sky !== 'none';
        setTimeout(syncPersonaToSky, 50);
    }
    function wantedPersona() {
        const pref = uiPrefs.persona;
        const night = ['night', 'seanight'].includes(uiPrefs.scene);
        const canLive = innerWidth > 900 && !matchMedia('(prefers-reduced-motion: reduce)').matches && uiPrefs.motion !== 'reduced';
        if (pref === 'off') return null;
        if (night && canLive && pref !== 'panel') return 'moon';
        if (pref) return pref === 'moon' && !night ? 'badge' : pref;
        return canLive ? 'badge' : null;
    }
    let personaReady = false;
    function syncPersonaToSky() {
        if (!personaReady) return;
        const want = wantedPersona();
        if (want === personaMode) return;
        if (!want) { stopPersona(); return; }
        startPersona(want);
    }
    const SKY_LABEL = { mist: 'Mist', clouds: 'Clouds', sunset: 'Sunset', night: 'Night sky', seaday: 'Seashore', seanight: 'Seashore at night', storm: 'Storm', none: 'Still (no sky)' };
    Object.keys(LIVE_SKIES).forEach(k => { SKY_LABEL[k] = LIVE_SKIES[k].label; });

    // ---------- The customisation catalogue: grouped, searchable, collapsible cards; every chip works ----------
    const CAT_ICONS = {
        robot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16h5"/>',
        face: '<circle cx="12" cy="12" r="8"/><path d="M9 10h.01M15 10h.01M8.5 14.5c1.8 1.6 5.2 1.6 7 0"/>',
        sky: '<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.3 1.6A3.2 3.2 0 0 0 7 18z"/>',
        live: '<path d="M3 15c3-4 6 4 9 0s6 4 9 0M3 10c3-4 6 4 9 0s6 4 9 0"/>',
        sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
        party: '<path d="M4 20l5-13 8 8z"/><path d="M14 4v2M19 9h2M17.5 5.5l1.5-1.5M13 9c1-1 2.5-1.5 4-1"/>',
        flower: '<circle cx="12" cy="9" r="2.2"/><path d="M12 6.8c0-2.5 3-2.5 3 0M12 11.2c0 2.5-3 2.5-3 0M9.8 9c-2.5 0-2.5-3 0-3M14.2 9c2.5 0 2.5 3 0 3M12 11.5V21M12 17c-2-2-4-2-5-1"/>',
        paw: '<circle cx="7" cy="10" r="1.6"/><circle cx="10.5" cy="6.5" r="1.6"/><circle cx="14.5" cy="6.5" r="1.6"/><circle cx="18" cy="10" r="1.6"/><path d="M12.5 11c-3 0-5.5 4-4.5 6.5 1 2 3 1 4.5 1s3.5 1 4.5-1c1-2.5-1.5-6.5-4.5-6.5z"/>',
        bird: '<path d="M3 13c4 0 6-3 9-3 2 0 3 1 4 2l5-1-4 3c-1 3-4 5-8 5-3 0-5-2-6-6z"/><path d="M11 10l2-5 2 4"/>',
        fish: '<path d="M3 12c3-4 9-6 13-2l4-3v10l-4-3c-4 4-10 2-13-2z"/><path d="M8 11h.01"/>',
        motion: '<path d="M4 12h12M12 7l5 5-5 5M4 7h4M4 17h4"/>',
        pencil: '<path d="M4 20l1-4 11-11 3 3-11 11z"/><path d="M14 7l3 3"/>',
        move: '<path d="M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>',
        layers: '<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
        galaxy: '<circle cx="12" cy="12" r="1.8"/><path d="M12 4c5 0 8 3 7 6M12 20c-5 0-8-3-7-6M4.5 9.5C6 5 10 4 12 4M19.5 14.5C18 19 14 20 12 20"/>',
        eraser: '<path d="M4 16l8-8 6 6-5 5H8z"/><path d="M13 19h7"/>',
        gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/>',
        drop: '<path d="M12 3c3.5 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6.5 6-11z"/>',
        palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-1 1.4-2-.6-1.4.2-2.6 1.7-2.6H17a4 4 0 0 0 4-4c0-5-4-9.4-9-9.4z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>',
        type: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
        layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
        glow: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
        panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
        code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
        undo: '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12h-2" transform="translate(0 -6)"/>',
        search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
        chevron: '<path d="M8 10l4 4 4-4"/>'
    };
    const catIcon = (name, cls = 'cat-ic') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${CAT_ICONS[name] || ''}</svg>`;
    const SKY_SWATCH = { mist: 'linear-gradient(135deg,#2a2a33,#5a5560)', clouds: 'linear-gradient(135deg,#3b4b63,#8b9bb3)', sunset: 'linear-gradient(135deg,#3a1d3d,#ff8c42)',
        night: 'radial-gradient(circle at 70% 30%,#e8e4c8 0 18%,#0d1530 22%)', seaday: 'linear-gradient(180deg,#7fb6e0 0 50%,#1f6f99 50%)', seanight: 'linear-gradient(180deg,#0d1530 0 50%,#1d3a66 50%)',
        storm: 'linear-gradient(135deg,#1b1f2a,#4a5468)', none: 'linear-gradient(135deg,#151515,#262626)',
        livefog: 'radial-gradient(circle at 30% 30%,#ff6a3d,#1b2a4a 70%)', lowpolysea: 'conic-gradient(from 30deg,#0d3a4a,#1f6f8b,#0b2530,#2a8aa8,#0d3a4a)', cloudsky: 'linear-gradient(180deg,#5a7fa8,#c9d4e6)',
        flock: 'radial-gradient(circle at 60% 40%,#88ccff 0 14%,#0b0f19 18%)', network: 'repeating-linear-gradient(45deg,#ff3f81 0 1px,#23153c 1px 5px)', cells: 'radial-gradient(circle at 35% 35%,#2bb5a6,#0b2a33 65%)',
        dotfield: 'radial-gradient(circle,#ff8820 0 22%,#202020 26%)', globe: 'radial-gradient(circle at 40% 40%,#ff3f81,#23153c 70%)', halo: 'radial-gradient(circle,#0b0f19 0 30%,#7a5cff 40%,#2ad1ff 55%,#0b0f19 70%)',
        rings: 'repeating-radial-gradient(circle,#88ff00 0 1.5px,#202428 1.5px 4px)', ripple: 'repeating-radial-gradient(circle,#2bb5a6 0 1px,#0b2a33 1px 4px)', flowlines: 'repeating-linear-gradient(120deg,#89964e 0 1px,#002222 1px 4px)',
        threads: 'repeating-radial-gradient(circle,#98465f 0 1px,#222426 1px 3px)' };
    const catOpenKey = 'vq-catalog-open';
    function catOpenGet() { try { return new Set(JSON.parse(localStorage.getItem(catOpenKey) || '[]')); } catch (e) { return new Set(); } }
    function catOpenSet(set) { try { localStorage.setItem(catOpenKey, JSON.stringify([...set])); } catch (e) { } }

    // What's switched on right now, so the matching chips show as selected
    function catActive() {
        const on = new Set();
        const lc = v => String(v || '').toLowerCase();
        on.add(`${lc(uiPrefs.theme)} theme`);
        if (uiPrefs.accent !== 'theme') on.add(`${lc(uiPrefs.accent)} accent`);
        on.add(`${lc(uiPrefs.font || 'default')} font`);
        on.add(`effects ${uiPrefs.fx || 'high'}`);
        const sk = uiPrefs.scene || 'mist';
        on.add({ mist: 'mist', clouds: 'clouds', sunset: 'sunset', night: 'night sky', seaday: 'seashore', seanight: 'seashore at night', storm: 'storm', none: 'no sky' }[sk] || (SKY_LABEL[sk] || '').toLowerCase() + ' sky');
        on.add(uiPrefs.skyColours === 'original' ? 'sky colours original' : 'sky colours accent');
        const p = uiPrefs.particles; if (p && p.preset && PARTICLE_BUILTINS[p.preset] && !p.name) on.add(PARTICLE_BUILTINS[p.preset].label.toLowerCase() + ' particles');
        if (p && p.preset && PARTICLE_BUILTINS[p.preset] && p.name === PARTICLE_BUILTINS[p.preset].label) on.add(PARTICLE_BUILTINS[p.preset].label.toLowerCase() + ' particles');
        if (!p) on.add('particles off');
        on.add(uiPrefs.ground === 'box' ? 'ground above the message box' : 'ground at the bottom');
        on.add(uiPrefs.bubbles ? 'bubbles on' : 'bubbles off');
        on.add(uiPrefs.glow === false ? 'glow off' : 'glow on');
        on.add(`text static ${uiPrefs.textStatic || 'reduced'}`);
        on.add(uiPrefs.skyColours === 'original' ? 'sky colours original' : 'sky colours accent');
        return on;
    }

    // ---------- Your chats, presented: VQ opens a full-screen gallery of the conversation history ----------
    const HIST_STOP = new Set('the a an and or but of to in on for with is are was were be been it this that what which who how why when where do does did can could would should will i you he she we they me my your our their about from as at by if not no so than then there these those just also into more most some any all very really please tell explain show give make let get'.split(' '));
    function chatFacts(c) {
        const msgs = c.messages || [];
        const users = msgs.filter(m => m.role === 'user'), vq = msgs.filter(m => m.role !== 'user');
        const strip = t => String(t || '').replace(/```[\s\S]*?```/g, ' [code] ').replace(/[#*_>`\[\]()]/g, '').replace(/\s+/g, ' ').trim();
        const words = {};
        users.forEach(m => strip(m.content).toLowerCase().split(/[^a-zÀ-ɏ'-]+/).forEach(w => { if (w.length > 3 && !HIST_STOP.has(w)) words[w] = (words[w] || 0) + 1; }));
        const topics = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w]) => w);
        const chars = msgs.reduce((n, m) => n + String(m.content || '').length, 0);
        return {
            id: c.id, title: c.title || 'Untitled chat', created: c.created || null, updated: c.updated || 0,
            count: msgs.length, asked: users.length, answered: vq.length, minutes: Math.max(1, Math.round(chars / 1100)),
            first: strip(users[0] && users[0].content).slice(0, 220),
            questions: users.slice(0, 6).map(m => strip(m.content).slice(0, 140)),
            last: strip(vq.length ? vq[vq.length - 1].content : '').slice(0, 360),
            code: msgs.some(m => /```/.test(m.content || '')), topics, active: c.id === store.activeId
        };
    }
    function histWhen(t) {
        if (!t) return 'Earlier';
        const d = new Date(t), now = new Date(), day = 864e5;
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (t >= start) return 'Today';
        if (t >= start - day) return 'Yesterday';
        if (t >= start - 6 * day) return 'This week';
        if (t >= start - 30 * day) return 'This month';
        return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    const histDate = t => t ? new Date(t).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not recorded';
    const histAgo = t => { if (!t) return ''; const s = (Date.now() - t) / 1000; return s < 90 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago'; };


    // Any full-screen console can talk to VQ: what it can't handle itself goes into the chat as a normal message,
    // and the screen stays full: a thinking state, then VQ's answer (and any cards) fill the results stage.
    // New full-screen views register a closer here so they join in automatically.
    const FS_VIEWS = {
        guide: { open: () => !!guideOpen, close: (i) => closeGuide(i) },
        history: { open: () => !!histOpen, close: (i) => closeHistory(i) },
        moment: { open: () => document.body.classList.contains('moment-on'), close: (i) => endMoment(i) },
        results: { open: () => !!rsOpen, close: () => rsOpen && rsOpen.close() }
    };
    function fsAsk(text, from) {
        const before = Object.keys(FS_VIEWS).filter(k => FS_VIEWS[k].open());
        elements.messageInput.value = text; sendMessage();
        let tries = 0;
        const check = () => {
            if (isTyping) {                                         // VQ is answering: hand over to the results stage
                showResultsStage({ q: text, thinking: true });
                setTimeout(() => Object.keys(FS_VIEWS).forEach(k => k !== 'results' && FS_VIEWS[k].open() && FS_VIEWS[k].close(true)), 750);
                return;
            }
            const opened = Object.keys(FS_VIEWS).filter(k => FS_VIEWS[k].open() && !before.includes(k));
            if (opened.length) { if (from && !opened.includes(from) && FS_VIEWS[from]) setTimeout(() => FS_VIEWS[from].close(true), 700); return; }   // a local command opened another full screen
            if (++tries < 12) setTimeout(check, 50);
        };
        setTimeout(check, 30);
    }
    // ---------- Results stage: search cards (news, films, books, papers, videos, layouts) full screen, live-synced with the chat ----------
    // The stage is a window onto the chat, not a copy of it: what you type here is sent as a normal chat message,
    // new answers and cards in the chat appear here as they arrive, and card buttons press the real buttons in the chat.
    const RS_CARD = '.pcard, .news-card, .movie-card, .paper-card, .book-card, .video-card, .verse-card';
    let rsOpen = null;
    function resultSets() {
        const area = elements.messagesArea || document; const sets = [];
        area.querySelectorAll('.message').forEach(m => {
            if (m.closest('.rs')) return;
            const rows = [...m.querySelectorAll('.media-row, .present')].filter(r => !r.parentElement.closest('.media-row, .present') && r.querySelector(RS_CARD));
            if (!rows.length) return;
            let q = '', prev = m.previousElementSibling;
            while (prev && !prev.classList.contains('user')) prev = prev.previousElementSibling;
            if (prev) q = (prev.querySelector('.message-content')?.innerText || '').trim();
            sets.push({ msg: m, rows, q });
        });
        return sets;
    }
    function lastExchange() {
        const ms = [...(elements.messagesArea || document).querySelectorAll('.message')].filter(m => !m.closest('.rs'));
        let i = ms.length - 1; while (i >= 0 && ms[i].classList.contains('user')) i--;
        const msg = ms[i]; let j = i - 1; while (j >= 0 && !ms[j].classList.contains('user')) j--;
        const q = j >= 0 ? (ms[j].querySelector('.message-content')?.innerText || '').trim() : '';
        const c = msg?.querySelector('.message-content');
        return { msg, q, html: c ? c.innerHTML : '', len: c ? c.textContent.length : 0 };
    }
    function lastReplyText() {
        const ms = [...(elements.messagesArea || document).querySelectorAll('.message.assistant, .message.vq, .message:not(.user)')].filter(m => !m.closest('.rs'));
        const m = ms[ms.length - 1]; if (!m) return '';
        const c = m.querySelector('.message-content')?.cloneNode(true); if (!c) return '';
        c.querySelectorAll('.media-row, .present, button, .cite').forEach(n => n.remove());
        return c.innerText.replace(/\s+/g, ' ').trim();
    }
    function showResultsStage(opts = {}) {
        if (rsOpen) { if (opts.thinking) rsOpen.think(opts.q); rsOpen.sync(true); return; }
        const ov = el('div', 'rs fs-iris'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Results, full screen');
        ov.innerHTML = `
          <div class="rs-glow" aria-hidden="true"></div>
          <header class="rs-top"><div><span class="hist-eyebrow">VQ · results</span><h2 class="rs-h"></h2></div><button type="button" class="hist-close" aria-label="Close">✕</button></header>
          <div class="rs-think" aria-live="polite"><div class="rs-think-q"></div><div class="rs-think-scan"><i></i></div><div class="rs-think-t">VQ is thinking<span>.</span><span>.</span><span>.</span></div></div>
          <div class="rs-sets"></div>
          <div class="rs-lens" aria-hidden="true"></div>
          <form class="rs-bar vq-console" autocomplete="off"><div class="vc-log" role="log" aria-live="polite"></div><label class="vc-prompt"><span aria-hidden="true">VQ&gt;</span><input type="text" maxlength="2000" aria-label="Talk to VQ" placeholder="ask anything — it goes into your chat · “zoom in on 2” · “close”"><i class="vc-caret" aria-hidden="true"></i></label></form>
          <div class="vq-stage-hint rs-hint">Esc or “close” to return to the chat</div>`;
        document.body.appendChild(ov); document.body.classList.add('rs-on');
        const setsEl = ov.querySelector('.rs-sets'), log = ov.querySelector('.vc-log'), inp = ov.querySelector('.rs-bar input'), head = ov.querySelector('.rs-h');
        let zoomed = null, sig = '', cards = [], wasTyping = false;
        const think = (q) => { ov.classList.add('thinking'); log.textContent = 'VQ is thinking…'; ov.querySelector('.rs-think-q').textContent = q ? '“' + str(q, 160) + '”' : ''; head.textContent = q ? str(q, 140) : head.textContent; };
        if (opts.thinking) think(opts.q);
        const say = (t) => { log.textContent = t; };
        const pressOriginal = (clone, orig, target) => {
            const sel = 'button, a, .pcard-toggle';
            const i = [...clone.querySelectorAll(sel)].indexOf(target), o = [...orig.querySelectorAll(sel)][i];
            if (o) o.click();
        };
        const fish = (on) => cards.forEach(c => {
            if (!on || c === zoomed) { c.style.removeProperty('--fe'); c.style.removeProperty('--fb'); c.style.removeProperty('--fl'); return; }
            const r = c.getBoundingClientRect(), cx = innerWidth / 2, cy = innerHeight / 2;
            const dx = (r.left + r.width / 2 - cx) / cx, dy = (r.top + r.height / 2 - cy) / cy, d = Math.min(1, Math.hypot(dx, dy) / 1.4);
            c.style.setProperty('--fe', `translate(${(-dx * 40 * d).toFixed(1)}px, ${(-dy * 30 * d).toFixed(1)}px) perspective(900px) rotateY(${(dx * 26).toFixed(1)}deg) rotateX(${(-dy * 20).toFixed(1)}deg) scale(${(1.12 - 0.4 * d * d).toFixed(3)})`);
            c.style.setProperty('--fb', (0.6 + d * 3).toFixed(2) + 'px'); c.style.setProperty('--fl', (0.72 - d * 0.32).toFixed(2));
        });
        const zoom = async (card) => {
            if (zoomed === card) return unzoom();
            ov.classList.add('snap');
            const others = cards.filter(c => c !== card);
            await Promise.all([pixelFade(card, 'out', 150), ...(zoomed ? [] : others.map(c => pixelFade(c, 'out', 150)))]);
            if (zoomed) { zoomed.classList.remove('zoom', 'expanded'); zoomed._ph?.remove(); }
            const ph = el('div', 'rs-ph'); ph.style.height = card.offsetHeight + 'px'; card.before(ph); card._ph = ph;
            zoomed = card; card.classList.add('zoom', 'expanded'); ov.classList.add('zooming'); fish(true);
            await Promise.all([pixelFade(card, 'in', 260, 18), ...others.map(c => pixelFade(c, 'in', 220))]);
            say(`Zoomed in on “${card._t}”. Say “back” to see them all, or ask me about it.`);
        };
        const unzoom = () => {
            if (!zoomed) return false; const c = zoomed; zoomed = null;
            Promise.all(cards.map(n => pixelFade(n, 'out', 140))).then(() => {
                fish(false); c.classList.remove('zoom', 'expanded'); c._ph?.remove(); ov.classList.remove('zooming');
                return Promise.all(cards.map(n => pixelFade(n, 'in', 220)));
            });
            return true;
        };
        const build = (sets) => {
            zoomed = null; ov.classList.remove('zooming'); setsEl.innerHTML = ''; cards = [];
            const ex = lastExchange();
            if (ex.q && !(sets.length && sets[sets.length - 1].msg === ex.msg)) {
                // the latest answer has no cards: it gets the stage itself, earlier cards sit below it
                head.textContent = str(ex.q, 140);
                const a = el('section', 'rs-answer'); a.appendChild(el('div', 'rs-row-t', 'VQ'));
                const body = el('div', 'rs-answer-body'); body.innerHTML = ex.html; body.querySelectorAll('.message-actions, button, .media-row, .present').forEach(n => n.remove());
                a.appendChild(body); setsEl.appendChild(a);
                if (!sets.length) return;
            } else if (!sets.length) { head.textContent = 'No cards in this chat yet'; setsEl.appendChild(el('p', 'rs-empty', 'Ask for news, films, books, papers or videos below and they’ll appear here as cards.')); return; }
            const latest = sets[sets.length - 1];
            if (!setsEl.querySelector('.rs-answer')) head.textContent = latest.q ? str(latest.q, 140) : 'Your results';
            const answerShown = !!setsEl.querySelector('.rs-answer');
            sets.slice().reverse().forEach((set, si) => {
                si += answerShown ? 1 : 0;
                const sec = el('section', 'rs-set' + (si ? ' older' : ''));
                if (si) sec.appendChild(el('div', 'rs-q', set.q ? '“' + str(set.q, 120) + '”' : 'Earlier'));
                set.rows.forEach(row => {
                    const tEl = row.querySelector(':scope > .present-title')?.cloneNode(true); tEl?.querySelector('.rs-open')?.remove(); const title = tEl ? tEl.textContent.trim() : '';
                    if (title) sec.appendChild(el('div', 'rs-row-t', title));
                    const grid = el('div', 'rs-grid');
                    row.querySelectorAll(RS_CARD).forEach(orig => {
                        const c = orig.cloneNode(true); c.classList.remove('expanded'); c.classList.add('rs-card');
                        c.querySelectorAll('.cast-btn, .rs-open').forEach(n => n.remove());
                        c.removeAttribute('role'); c.tabIndex = 0;
                        c._t = (orig.querySelector('.pcard-title, .news-title, .movie-title, .paper-title, .book-title, .video-title, h3, h4, strong')?.textContent || 'this card').trim();
                        c.addEventListener('click', (e) => {
                            const t = e.target.closest('button, a, .pcard-toggle');
                            if (t && t.tagName === 'A' && t.getAttribute('href')) return;          // real links open as normal
                            e.preventDefault(); e.stopPropagation();
                            if (t && !t.classList.contains('pcard-toggle')) { pressOriginal(c, orig, t); if (t.classList.contains('pcard-ask')) say(`Asking about “${c._t}” in your chat…`); return; }
                            zoom(c);
                        });
                        c.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === c) { e.preventDefault(); zoom(c); } });
                        grid.appendChild(c); cards.push(c);
                    });
                    sec.appendChild(grid);
                });
                setsEl.appendChild(sec);
            });
            cards.forEach((c, i) => c.dataset.n = i + 1);
        };
        // Live sync with the chat
        let lastText = '';
        const sync = (force) => {
            const sets = resultSets();
            if (isTyping) { if (!wasTyping) { wasTyping = true; think(lastExchange().q); } }
            const ex = lastExchange();
            const s2 = sets.map(x => x.rows.map(r => r.querySelectorAll(RS_CARD).length).join(',')).join('|') + ':' + sets.length + ':' + (isTyping ? 'T' : ex.len);
            if (isTyping) { sig = s2; return; }
            if (force || s2 !== sig || wasTyping) {
                const fresh = (sig !== '' && s2 !== sig) || wasTyping; sig = s2; build(sets);
                if (wasTyping || ov.classList.contains('thinking')) { wasTyping = false; ov.classList.remove('thinking'); }
                if (fresh) { pixelFade(setsEl, 'in', 360, 16); setsEl.scrollTo({ top: 0 }); }
            }
            const t = isTyping ? 'VQ is thinking…' : lastReplyText();
            if (t !== lastText) { lastText = t; if (t) say(str(t, 420) + (t.length > 420 ? '…' : '')); }
        };
        let tm = 0; const mo = new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(() => sync(false), 200); });
        mo.observe(elements.messagesArea || document.body, { childList: true, subtree: true, characterData: true });
        const typingPoll = setInterval(() => sync(false), 700);
        sync(true);
        if (!lastText) say('These are the cards from this chat. Ask anything — it goes into your chat and new cards land here.');
        const close = () => {
            if (!rsOpen) return; rsOpen = null; mo.disconnect(); clearInterval(typingPoll);
            document.removeEventListener('keydown', key); document.body.classList.remove('rs-on');
            ov.classList.remove('in'); setTimeout(() => ov.remove(), 650);
            setTimeout(() => elements.messagesArea?.scrollTo?.({ top: elements.messagesArea.scrollHeight, behavior: 'smooth' }), 300);
        };
        const key = (e) => { if (e.key === 'Escape') { if (!unzoom()) close(); } };
        document.addEventListener('keydown', key);
        ov.querySelector('.hist-close').addEventListener('click', close);
        ov.querySelector('.rs-lens').addEventListener('click', unzoom);
        ov.querySelector('.rs-bar').addEventListener('submit', (e) => {
            e.preventDefault(); const raw = inp.value.trim(); if (!raw) return; inp.value = '';
            const q = raw.toLowerCase().replace(/[.!?]+$/, '').replace(/^(?:(?:please|pls|can you|could you)\s+)+/, '').replace(/\s+please$/, '');
            if (/^(?:close|exit|done|back to (?:the )?chat|leave|quit|small screen|exit full ?screen)$/.test(q)) return close();
            if (/^(?:back|zoom out|show (?:them )?all|all cards|unzoom)$/.test(q)) { if (!unzoom()) say('Already showing them all.'); return; }
            const zm = q.match(/^(?:zoom(?: in)?(?: on)?|open|show(?: me)?|expand|look at)\s+(?:the\s+|card\s+|number\s+|#)?(.+)$/);
            if (zm) {
                const w = zm[1].replace(/^(?:first|1st)( one)?$/, '1').replace(/^(?:second|2nd)( one)?$/, '2').replace(/^(?:third|3rd)( one)?$/, '3').replace(/^(?:last)( one)?$/, String(cards.length)).replace(/ one$/, '');
                const hit = /^\d+$/.test(w) ? cards[+w - 1] : cards.find(c => c._t.toLowerCase().includes(w));
                if (hit) { hit.scrollIntoView({ block: 'center' }); setTimeout(() => zoom(hit), 120); return; }
            }
            // Everything else is a normal chat message: same chat, same history, same answer
            const ask = zoomed && /\b(?:this|it|that one|this one)\b/.test(q) ? `${raw} (about “${zoomed._t}”)` : raw;
            say('Sent to your chat: “' + str(raw, 120) + '”');
            elements.messageInput.value = ask; sendMessage();
        });
        rsOpen = { ov, sync, close, think };
        ov.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('in')));
        setTimeout(() => inp.focus({ preventScroll: true }), 500);
    }
    // A ⤢ button on every card row in the chat opens the stage
    function addStageButtons(root) {
        (root || document).querySelectorAll('.media-row > .present-title, .present > .present-title').forEach(t => {
            if (t.closest('.rs') || t.querySelector('.rs-open') || !t.parentElement.querySelector(RS_CARD)) return;
            const b = el('button', 'rs-open', '⤢ Full screen'); b.type = 'button'; b.title = 'Show these cards full screen (or say “full screen”)';
            b.addEventListener('click', (e) => { e.stopPropagation(); showResultsStage(); });
            t.appendChild(b);
        });
    }
    let rsAutoSig = 0;
    setTimeout(() => {
        const area = elements.messagesArea; if (!area) return;
        let t = 0;
        new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => {
            addStageButtons(area);
            if (uiPrefs.autoStage && !rsOpen && !isTyping) { const n = resultSets().length; if (n > rsAutoSig && rsAutoSig !== -1) showResultsStage(); rsAutoSig = n; }
        }, 250); }).observe(area, { childList: true, subtree: true });
        addStageButtons(area); rsAutoSig = resultSets().length;
    }, 600);

    let histOpen = null;
    function showHistory(opts = {}) {
        closeHistory(true);
        const all = Object.values(store.chats || {}).filter(c => (c.messages || []).length).map(chatFacts).sort((a, b) => b.updated - a.updated);
        const ov = el('div', 'hist fs-iris'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Your chats');
        const totalQ = all.reduce((n, c) => n + c.asked, 0);
        const oldest = all.reduce((m, c) => Math.min(m, c.created || c.updated || Infinity), Infinity);
        const topicCount = {}; all.forEach(c => c.topics.forEach(t => topicCount[t] = (topicCount[t] || 0) + 1));
        const topTopics = Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
        ov.innerHTML = `
          <div class="hist-glow" aria-hidden="true"></div>
          <header class="hist-top">
            <div class="hist-brand"><span class="hist-eyebrow">VQ · your conversations</span><h2>${all.length ? 'Here’s everything we’ve talked about' : 'No conversations yet'}</h2></div>
            <button type="button" class="hist-close" aria-label="Close">✕</button>
          </header>
          <div class="hist-stats">
            <div class="hist-stat"><b>${all.length}</b><span>chats</span></div>
            <div class="hist-stat"><b>${totalQ}</b><span>questions asked</span></div>
            <div class="hist-stat"><b>${all.reduce((n, c) => n + c.minutes, 0)}</b><span>minutes of reading</span></div>
            <div class="hist-stat"><b>${isFinite(oldest) ? new Date(oldest).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '–'}</b><span>since</span></div>
          </div>
          <div class="hist-tools">
            <label class="hist-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input type="search" placeholder="Search titles, questions and answers…" aria-label="Search your chats"></label>
            <div class="hist-topics">${topTopics.map(t => `<button type="button" class="hist-topic" data-t="${t}">${t}</button>`).join('')}</div>
          </div>
          <div class="hist-body">
            <div class="hist-list" role="list"></div>
            <aside class="hist-detail" aria-live="polite"><div class="hist-empty-detail">Pick a chat to see its details.</div></aside>
          </div>
          <form class="hist-console vq-console" autocomplete="off">
            <div class="hist-log" role="log" aria-live="polite"></div>
            <label class="hist-prompt"><span aria-hidden="true">VQ&gt;</span><input type="text" maxlength="400" placeholder="ask about your chats: “open the python one”, “when did I ask about Bayes?”" aria-label="Ask VQ about your chats"><i class="hist-caret" aria-hidden="true"></i></label>
          </form>`;
        const list = ov.querySelector('.hist-list'), detail = ov.querySelector('.hist-detail'), input = ov.querySelector('.hist-search input');
        let selected = null, topic = '';
        const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const showDetail = (c) => {
            if (selected !== c.id) requestAnimationFrame(() => pixelFade(detail, 'in', 240));
            selected = c.id;
            list.querySelectorAll('.hist-card').forEach(x => x.classList.toggle('sel', x.dataset.id === c.id));
            detail.innerHTML = `
              <div class="hist-d-head"><span class="hist-when">${histWhen(c.updated)}${c.active ? ' · <em>open now</em>' : ''}</span><h3>${esc(c.title)}</h3></div>
              <dl class="hist-meta">
                <div><dt>Started</dt><dd>${esc(histDate(c.created))}</dd></div>
                <div><dt>Last active</dt><dd>${esc(histDate(c.updated))} <small>${histAgo(c.updated)}</small></dd></div>
                <div><dt>Messages</dt><dd>${c.count} <small>(${c.asked} from you, ${c.answered} from VQ)</small></dd></div>
                <div><dt>Reading time</dt><dd>about ${c.minutes} min${c.code ? ' · includes code' : ''}</dd></div>
              </dl>
              ${c.topics.length ? `<div class="hist-d-topics">${c.topics.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
              <div class="hist-sec"><h4>You asked</h4><ol>${c.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ol>${c.asked > c.questions.length ? `<p class="hist-more">and ${c.asked - c.questions.length} more</p>` : ''}</div>
              ${c.last ? `<div class="hist-sec"><h4>VQ’s last answer</h4><blockquote>${esc(c.last)}${c.last.length >= 360 ? '…' : ''}</blockquote></div>` : ''}
              <div class="hist-actions">
                <button type="button" class="hist-open">Open this chat</button>
                <button type="button" class="hist-sum" title="VQ reads the chat and writes a short summary (uses a message)">✦ Ask VQ to summarise</button>
                <button type="button" class="hist-del" title="Delete this chat">Delete</button>
              </div>`;
            detail.querySelector('.hist-open').addEventListener('click', () => { closeHistory(); switchChat(c.id); });
            detail.querySelector('.hist-sum').addEventListener('click', () => {
                closeHistory(); switchChat(c.id);
                setTimeout(() => { elements.messageInput.value = 'Please give me a short summary of this conversation so far: the main questions, your key answers, and anything left open.'; sendMessage(); }, 250);
            });
            detail.querySelector('.hist-del').addEventListener('click', () => { const before = Object.keys(store.chats).length; deleteChat(c.id); if (Object.keys(store.chats).length < before) showHistory(); });
            if (innerWidth < 760) ov.classList.add('reading');
        };
        const render = () => {
            const q = input.value.trim().toLowerCase();
            list.textContent = '';
            let last = '', n = 0, col = list;
            all.forEach((c, i) => {
                const hay = (c.title + ' ' + c.questions.join(' ') + ' ' + c.last + ' ' + c.topics.join(' ')).toLowerCase();
                if (q && !hay.includes(q)) return;
                if (topic && !c.topics.includes(topic)) return;
                const g = histWhen(c.updated);
                if (g !== last) { last = g; col = el('div', 'hist-col'); col.appendChild(el('div', 'hist-group', g)); list.appendChild(col); }
                const card = el('button', 'hist-card' + (c.active ? ' active' : '')); card.type = 'button'; card.dataset.id = c.id; card.setAttribute('role', 'listitem');
                card.style.animationDelay = Math.min(n, 14) * 35 + 'ms';
                card.innerHTML = `<span class="hist-c-title"><span class="hist-ic" aria-hidden="true">${ICONS.chat}</span>${esc(c.title)}</span><span class="hist-c-first">${esc(c.first || '…')}</span>
                  <span class="hist-c-meta"><span>${histAgo(c.updated)}</span><span>${c.count} messages</span>${c.code ? '<span>code</span>' : ''}${c.active ? '<span class="hist-now">open now</span>' : ''}</span>`;
                card.addEventListener('click', () => showDetail(c));
                card.addEventListener('dblclick', () => { closeHistory(); switchChat(c.id); });
                col.appendChild(card); n++;
            });
            if (!n) list.appendChild(el('div', 'hist-none', all.length ? 'Nothing matches that search.' : 'Start a conversation and it will appear here.'));
        };
        input.addEventListener('input', render);
        // The console: ask VQ to find, open or explain a chat. Simple "open …" requests are matched here for free;
        // anything else goes to VQ (one message), who answers in the same console.
        const con = ov.querySelector('.hist-console'), log = ov.querySelector('.hist-log'), cin = ov.querySelector('.hist-prompt input');
        const say = (text, cls) => new Promise(res => {
            const line = el('div', 'hist-line ' + (cls || 'vq'));
            log.appendChild(line); log.scrollTop = log.scrollHeight;
            if (cls === 'you' || matchMedia('(prefers-reduced-motion: reduce)').matches) { line.textContent = text; log.scrollTop = log.scrollHeight; return res(); }
            let i = 0; const step = () => { i = Math.min(text.length, i + 2 + Math.floor(Math.random() * 3)); line.textContent = text.slice(0, i); log.scrollTop = log.scrollHeight; if (i < text.length) setTimeout(step, 14); else res(); };
            step();
        });
        const tokens = t => String(t).toLowerCase().split(/[^a-z0-9\u00c0-\u024f]+/).filter(w => w.length > 2 && !HIST_STOP.has(w) && !['open', 'chat', 'chats', 'conversation', 'one', 'show', 'about', 'continue', 'take', 'back'].includes(w));
        const best = q => {
            const qs = tokens(q); if (!qs.length) return null;
            const scored = all.map(c => { const hay = (c.title + ' ' + c.questions.join(' ') + ' ' + c.topics.join(' ')).toLowerCase(); return [c, qs.reduce((n, w) => n + (c.title.toLowerCase().includes(w) ? 3 : hay.includes(w) ? 1 : 0), 0)]; })
                .filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
            return scored.length && (scored.length === 1 || scored[0][1] > scored[1][1]) ? scored[0][0] : null;
        };
        const go = (c, msg) => { showDetail(c); list.querySelector(`.hist-card[data-id="${c.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return say(msg || `Found it: “${c.title}”. Opening…`).then(() => setTimeout(() => { closeHistory(); switchChat(c.id); }, 900)); };
        let busy = false;
        con.addEventListener('submit', async (e) => {
            e.preventDefault();
            const q = cin.value.trim(); if (!q || busy) return;
            cin.value = ''; busy = true; con.classList.add('busy');
            await say('> ' + q, 'you');
            try {
                const local = /^(?:open|show|go to|continue|take me to|resume)\b/i.test(q) ? best(q) : null;
                if (local) { await go(local); return; }
                const aboutChats = /\b(?:chats?|conversations?|talked|discussed|spoke|asked|said|mentioned|history|last time|earlier|yesterday|when did|which one|that one|the one)\b/i.test(q);
                if (!aboutChats || !all.length) { await say('Asking VQ…', 'sys'); fsAsk(q, 'history'); return; }
                const index = all.map((c, i) => ({ n: i + 1, title: c.title, created: c.created ? new Date(c.created).toISOString().slice(0, 16) : 'unknown', updated: new Date(c.updated).toISOString().slice(0, 16),
                    count: c.count, questions: c.questions, last: c.last.slice(0, 200) }));
                const wait = el('div', 'hist-line sys', 'searching your chats'); log.appendChild(wait);
                const dots = setInterval(() => { wait.textContent = wait.textContent.length > 26 ? 'searching your chats' : wait.textContent + '.'; }, 260);
                let data = {};
                try {
                    const res = await fetch(CONFIG.apiEndpoint.replace(/\/chat$/, '/history-ask'), { method: 'POST', headers: requestHeaders(), body: JSON.stringify({ question: q, index }) });
                    data = await res.json().catch(() => ({}));
                    if (!res.ok && res.status !== 429) data = { error: true };
                } catch (err) { data = { error: true }; }
                clearInterval(dots); wait.remove();
                if (!data.text || data.error) {
                    // VQ couldn't be reached: answer from the chats on this device instead
                    const ws = tokens(q), hits = all.filter(c => ws.some(w => (c.title + ' ' + c.questions.join(' ') + ' ' + c.last).toLowerCase().includes(w)));
                    data = { text: hits.length ? `Offline search: ${hits.length} chat${hits.length > 1 ? 's' : ''} match.\n` + hits.slice(0, 5).map(c => `#${all.indexOf(c) + 1} ${c.title} (${histAgo(c.updated)})`).join('\n') + (hits.length === 1 ? '' : '\nSay “open” and a name to open one.')
                        : '', open: hits.length === 1 && /^(?:open|show|go to|continue)/i.test(q) ? all.indexOf(hits[0]) + 1 : null };
                }
                if (!data.text) { await say('Nothing in your chats matches. Asking VQ…', 'sys'); fsAsk(q, 'history'); return; }
                const target = data.open && all[data.open - 1];
                await say(data.text);
                if (target) await go(target, `Opening “${target.title}”…`);
            } finally { busy = false; con.classList.remove('busy'); cin.focus(); }
        });
        say(all.length ? `${all.length} chats on file. Ask me to open one, or ask about what we discussed.` : 'No chats on file yet.', 'sys');
        ov.querySelectorAll('.hist-topic').forEach(b => b.addEventListener('click', () => { topic = topic === b.dataset.t ? '' : b.dataset.t; ov.querySelectorAll('.hist-topic').forEach(x => x.classList.toggle('on', x.dataset.t === topic)); render(); }));
        ov.querySelector('.hist-close').addEventListener('click', () => { if (ov.classList.contains('reading')) ov.classList.remove('reading'); else closeHistory(); });
        const key = (e) => { if (e.key === 'Escape') { if (ov.classList.contains('reading')) ov.classList.remove('reading'); else closeHistory(); } };
        document.addEventListener('keydown', key);
        render();
        // Match the sidebar's chat list exactly, whatever theme or accent is on
        try {
            const side = document.querySelector('.chat-history-item.active') || document.querySelector('.chat-history-item');
            const ic = document.querySelector('.chat-history-item .chat-item-icon');
            const rgba = (c) => (c || '').match(/[\d.]+/g)?.map(Number) || null;
            const bg = side && rgba(getComputedStyle(side).backgroundColor), icc = ic && rgba(getComputedStyle(ic).color);
            if (bg && (bg[3] === undefined || bg[3] > 0.02)) {
                const al = bg[3] === undefined ? 1 : bg[3];
                ov.style.setProperty('--hc-active', `rgba(${bg[0]},${bg[1]},${bg[2]},${Math.min(0.9, al * 1.1)})`);
                ov.style.setProperty('--hc-bg', `rgba(${bg[0]},${bg[1]},${bg[2]},${(al * 0.45).toFixed(3)})`);
                ov.style.setProperty('--hc-line', `rgba(${bg[0]},${bg[1]},${bg[2]},${Math.min(0.9, al * 1.6).toFixed(3)})`);
                ov.style.setProperty('--hc-line-strong', `rgba(${bg[0]},${bg[1]},${bg[2]},${Math.min(1, al * 3).toFixed(3)})`);
            }
            if (icc) { ov.style.setProperty('--hc-icon', `rgb(${icc[0]},${icc[1]},${icc[2]})`); ov.style.setProperty('--hc-icon-soft', `rgba(${icc[0]},${icc[1]},${icc[2]},0.35)`); }
        } catch (e) {}
        document.body.appendChild(ov);
        document.body.classList.add('hist-on');
        void ov.offsetWidth; requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('in')));
        const pick = (opts.select && all.find(c => c.id === opts.select)) || (innerWidth >= 760 && all[0]);
        if (pick) showDetail(pick);
        setTimeout(() => (innerWidth >= 760 ? cin : input).focus({ preventScroll: true }), 300);
        histOpen = { ov, key };
        return all.length;
    }
    function closeHistory(instant) {
        if (!histOpen) return;
        const { ov, key } = histOpen; histOpen = null;
        document.removeEventListener('keydown', key);
        document.body.classList.remove('hist-on');
        ov.classList.remove('in');
        setTimeout(() => ov.remove(), instant ? 0 : 320);
    }

    // ---------- "Just say it": VQ teaches the app in words people can type (and, later, speak) ----------
    const GUIDE = [
        { k: 'results search cards news films movies books papers videos full screen big', more: ['zoom in on 2', 'tell me more about this one', 'always open results full screen', 'close'], t: 'New: search cards, full screen', d: 'News, films, books, papers and videos fill the screen. Keep talking in the box: it is your chat, and new cards land as they arrive.', say: ['full screen', 'show the results full screen'], free: true, isNew: true },
        { k: 'chats history conversations past', more: ['continue the python chat', 'when did I ask about the empty tomb?', 'which chat had the plotting stuff?'], t: 'New: your chats, full screen', d: 'All your conversations as cards with dates, questions and VQ’s last answer, plus a console to ask about them.', say: ['show my chats', 'chat history', 'open the bayes one'], free: true, isNew: true },
        { k: 'moments celebrate celebration fireworks confetti full screen', more: ['fireworks', 'confetti rain', 'stardust moment', 'face moment', 'moment: elephant'], t: 'New: full-screen moments', d: 'VQ takes the whole screen until you click.', say: ['celebrate', 'night show moment', 'moment: castle', 'a moment with a giant dragon under the stars'], isNew: true },
        { k: 'particles embers snow stars sparkles', more: ['starfield particles', 'constellations particles', 'blue snow drifting sideways', 'a star map that reacts to my pointer'], t: 'New: particles VQ designs', d: 'A layer of light behind everything; ask for any kind.', say: ['embers particles', 'slow golden embers rising', 'particles off'], isNew: true },
        { k: 'vehicles buildings cars planes boats castles landscapes machines', more: ['add a plane', 'add a lighthouse', 'add a waterfall', 'the plane takes off', 'add a sailboat'], t: 'New: vehicles and buildings', d: 'Cars, planes, boats, castles, waterfalls; animals can chase them.', say: ['add a castle', 'add a car', 'the dog chases the car'], free: true, isNew: true },
        { k: 'skies sky themes theme look background', more: ['storm', 'seashore at night', 'flock sky', 'sky colours original', 'ember theme'], t: 'Skies and themes', d: 'One moving sky at a time, or a whole new look.', say: ['night sky', 'living fog sky', 'ocean theme', 'make me a theme like a quiet forest at dawn'] },
        { k: 'scene animals flowers creatures plants elements', more: ['add a giraffe', 'the dog chases the cat', 'make the whale fill the scene', 'draw a hot-air balloon', 'remove the tiger'], t: 'Scene and animals', d: 'Add things one at a time; tell them what to do.', say: ['add 6 red tulips', 'add a tiger', 'make the dog run', 'arrange'] },
        { k: 'reading layout text font size spacing', more: ['smaller', 'more line spacing', 'wider chat', 'handwriting font', 'unfocus'], t: 'Reading and layout', d: 'Size, spacing, fonts, focus.', say: ['bigger', 'serif font', 'focus', 'bubbles on'], free: true },
        { k: 'settings effects motion glow ground toggles', more: ['effects high', 'normal motion', 'glow on', 'ground above the message box', 'text static clear'], t: 'Settings that affect everything', d: 'Or tap ⚙ Settings under the message box.', say: ['effects low', 'reduce motion', 'glow off', 'ground at the bottom'], free: true },
        { k: 'vq himself robot face body', more: ['robot face', 'human face', 'vq on the moon', 'hide vq'], t: 'VQ himself', d: 'His robot body and his face.', say: ['show the face', 'face background', 'let vq fly'], free: true },
        { k: 'undo reset back', more: [], t: 'Undo anything', d: 'Every change can be taken back.', say: ['undo', 'reset'], free: true }
    ];
    let guideOpen = null;
    function showGuide(onlyNew, from) {
        closeGuide(true); document.body.classList.add('guide-on');
        const ov = el('div', 'gd'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Just say it');
        // the reveal grows out of wherever it was asked from: the message box, or a tapped button
        const src = { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };   // every full-screen view opens from the centre of the display
        ov.style.setProperty('--ox', Math.round(src.left + src.width / 2) + 'px');
        ov.style.setProperty('--oy', Math.round(src.top + src.height / 2) + 'px');
        const items = GUIDE.filter(g => !onlyNew || g.isNew);
        ov.innerHTML = `<div class="gd-aura" aria-hidden="true"></div>
          <header class="gd-top"><div><span class="hist-eyebrow">VQ · ${onlyNew ? 'what’s new' : 'how to use me'}</span><h2>Just say it</h2>
            <p>Everything works by typing what you want in plain words, the way you’d say it out loud. Tap a phrase to put it in the message box, or ▶ to do it now. <b>Free</b> ones cost no messages.</p></div>
            <button type="button" class="hist-close gd-close" aria-label="Close">✕</button></header>
          <div class="gd-grid"></div>
          <div class="gd-lens" aria-hidden="true"></div>
          <form class="gd-bar vq-console" autocomplete="off"><div class="vc-log" role="log" aria-live="polite">Ask me to zoom in on any card, or say what you want to do.</div><label class="vc-prompt"><span aria-hidden="true">VQ&gt;</span><input type="text" maxlength="300" aria-label="Say or type what you want" placeholder="“zoom in on moments”, “show my chats”, or anything you want"><i class="vc-caret" aria-hidden="true"></i></label></form>
          <footer class="gd-foot">${onlyNew ? 'Say <kbd>help</kbd> for everything' : 'Say <kbd>what’s new</kbd> for the latest'} · <kbd>show all customisations</kbd> for the full list · or just ask me <kbd>how do I …?</kbd></footer>`;
        const grid = ov.querySelector('.gd-grid');
        items.forEach((g, i) => {
            const card = el('section', 'gd-card' + (g.isNew ? ' new' : ''));
            card.style.setProperty('--i', i);
            const h = el('div', 'guide-h'); h.appendChild(el('span', null, g.t.replace(/^New: (.)/, (m, c) => c.toUpperCase()))); if (g.isNew) h.appendChild(el('span', 'gd-new', 'new')); if (g.free) h.appendChild(el('span', 'guide-free', 'free'));
            card.append(h, el('div', 'guide-d', g.d));
            const row = el('div', 'guide-says');
            g.say.forEach(ph => {
                const chip = el('span', 'guide-say');
                const q = el('button', 'guide-q', '“' + ph + '”'); q.type = 'button'; q.title = 'Put this in the message box';
                q.addEventListener('click', () => { closeGuide(); elements.messageInput.value = ph; elements.messageInput.focus(); try { elements.messageInput.dispatchEvent(new Event('input')); } catch (e) { } });
                const go = el('button', 'guide-go', '▶'); go.type = 'button'; go.title = 'Do it now'; go.setAttribute('aria-label', 'Do it now: ' + ph);
                go.addEventListener('click', () => { closeGuide(true); elements.messageInput.value = ph; sendMessage(); });
                chip.append(q, go); row.appendChild(chip);
            });
            card.appendChild(row);
            if (g.more && g.more.length) {
                const ex = el('div', 'gd-more');
                ex.appendChild(el('div', 'gd-more-h', 'More you can say'));
                const r2 = el('div', 'guide-says');
                g.more.forEach(ph => { const c2 = el('span', 'guide-say'); const q2 = el('button', 'guide-q', '“' + ph + '”'); q2.type = 'button'; q2.addEventListener('click', () => { closeGuide(); elements.messageInput.value = ph; elements.messageInput.focus(); }); const g2 = el('button', 'guide-go', '▶'); g2.type = 'button'; g2.setAttribute('aria-label', 'Do it now: ' + ph); g2.addEventListener('click', () => { closeGuide(true); elements.messageInput.value = ph; sendMessage(); }); c2.append(q2, g2); r2.appendChild(c2); });
                ex.appendChild(r2); card.appendChild(ex);
            }
            card._g = g; card.tabIndex = 0;
            card.addEventListener('click', (e) => { if (e.target.closest('button')) return; zoom(card); });
            card.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); zoom(card); } });
            grid.appendChild(card);
        });
        // Zoom one card forward; the rest drop back behind a glass lens
        let zoomed = null;
        const zoom = async (card) => {
            if (zoomed === card) return unzoom();
            ov.classList.add('snap');
            const others = [ov.querySelector('.gd-top'), ...grid.children].filter(n => n && n !== card && !n.classList.contains('gd-ph'));
            await Promise.all([pixelFade(card, 'out', 150), ...(zoomed ? [] : others.map(n => pixelFade(n, 'out', 150)))]);
            if (zoomed) { zoomed.classList.remove('zoom'); zoomed._ph?.remove(); }
            const r = card.getBoundingClientRect();
            const ph = el('div', 'gd-ph'); ph.style.height = r.height + 'px'; card.before(ph); card._ph = ph;
            zoomed = card; card.classList.add('zoom'); ov.classList.add('zooming');
            fisheye(card);
            await Promise.all([pixelFade(card, 'in', 260, 18), ...others.map(n => pixelFade(n, 'in', 220))]);
            card.querySelector('.guide-q')?.focus({ preventScroll: true });
        };
        // Fish-eye: the cards behind bulge as if seen through a wide lens: larger and nearer towards the middle,
        // curving away and squeezed towards the edges of the screen
        const fisheye = (except) => {
            const cx = innerWidth / 2, cy = innerHeight / 2, R = Math.hypot(cx, cy);
            [ov.querySelector('.gd-top'), ...grid.children].forEach(n => {
                if (!n || n === except || n.classList.contains('gd-ph')) return;
                const r = n.getBoundingClientRect(), dx = (r.left + r.width / 2 - cx) / cx, dy = (r.top + r.height / 2 - cy) / cy;
                const d = Math.min(1, Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy) / R);
                const bulge = 1.18 - 0.42 * d * d;                       // magnified near the centre, shrunk at the rim
                const push = 1 - 0.35 * d;                                // pulled inwards: the lens compresses the edges
                const tx = (r.left + r.width / 2 - cx) * (push - 1), ty = (r.top + r.height / 2 - cy) * (push - 1);
                n.style.setProperty('--fe', `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) perspective(900px) rotateY(${(dx * 28).toFixed(1)}deg) rotateX(${(-dy * 22).toFixed(1)}deg) scale(${bulge.toFixed(3)})`);
                n.style.setProperty('--fb', (0.6 + d * 3.2).toFixed(2) + 'px');
                n.style.setProperty('--fl', (0.75 - d * 0.35).toFixed(2));
            });
        };
        const unfish = () => [ov.querySelector('.gd-top'), ...grid.children].forEach(n => n && n.style && (n.style.removeProperty('--fe'), n.style.removeProperty('--fb'), n.style.removeProperty('--fl')));
        const unzoom = () => {
            if (!zoomed) return false; const c = zoomed; zoomed = null;
            const all = [ov.querySelector('.gd-top'), ...grid.children].filter(n => n && !n.classList.contains('gd-ph'));
            Promise.all(all.map(n => pixelFade(n, 'out', 140))).then(() => {
                unfish(); c.classList.remove('zoom'); c._ph?.remove(); ov.classList.remove('zooming');
                return Promise.all(all.map(n => pixelFade(n, 'in', 220)));
            }).then(() => c.focus({ preventScroll: true }));
            return true;
        };
        ov.querySelector('.gd-lens').addEventListener('click', unzoom);
        // The text box (and later, the voice): zoom by name, close, or just do what was said
        const bar = ov.querySelector('.gd-bar'), bin = bar.querySelector('input');
        const cards = [...grid.children];
        bar.addEventListener('submit', (e) => {
            e.preventDefault();
            const raw = bin.value.trim(); if (!raw) return;
            const q = raw.toLowerCase().replace(/[.!?]+$/, '').replace(/^(?:(?:please|can you|could you)\s+)+/, '');
            bin.value = '';
            const reply = (t) => { const lg = bar.querySelector('.vc-log'); if (lg) lg.textContent = t; };
            if (/^(?:back|zoom out|show all|all cards|go back)$/.test(q)) { unzoom(); reply('Back to all cards.'); return; }
            if (/^(?:close|exit|done|close (?:this|the guide)|never ?mind)$/.test(q)) { closeGuide(); return; }
            const zq = q.replace(/^(?:zoom(?: in)?(?: on| to)?|show(?: me)?|open|tell me about|more (?:on|about)|explain|what about|look at)\s+(?:the\s+)?/, '').replace(/\s+(?:card|section|one)$/, '');
            const words = zq.split(/\s+/).filter(w => w.length > 2);
            const hit = cards.map(c => [c, words.reduce((n, w) => n + ((c._g.t + ' ' + (c._g.k || '')).toLowerCase().includes(w) ? 1 : 0), 0)]).sort((a, b) => b[1] - a[1])[0];
            const zoomish = zq !== q || words.length <= 3;
            if (hit && hit[1] > 0 && zoomish && !GUIDE.some(g => g.say.concat(g.more || []).some(p => p.toLowerCase() === q))) { zoom(hit[0]); reply(`Zoomed in on “${hit[0]._g.t.replace(/^New: /, '')}”. Say “back” for all cards.`); return; }
            reply('Asking VQ…'); fsAsk(raw, 'guide');
        });
        const key = (e) => { if (e.key === 'Escape') { if (!unzoom()) closeGuide(); } };
        ov.querySelector('.gd-close').addEventListener('click', () => closeGuide());
        document.addEventListener('keydown', key);
        document.body.appendChild(ov);
        document.body.classList.add('hist-on');
        requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('in')));
        guideOpen = { ov, key };
        setTimeout(() => bin.focus({ preventScroll: true }), 650);
    }
    function closeGuide(instant) {
        if (!guideOpen) return;
        const { ov, key } = guideOpen; guideOpen = null; document.body.classList.remove('guide-on');
        document.removeEventListener('keydown', key);
        if (!histOpen) document.body.classList.remove('hist-on');
        ov.classList.remove('in'); ov.classList.add('out');
        setTimeout(() => ov.remove(), instant ? 0 : 520);
    }

    // ---------- Quick settings: the switches that affect everything ----------
    const QUICK = [
        ['Effects', [['High', 'effects high'], ['Medium', 'effects medium'], ['Low', 'effects low']]],
        ['Motion', [['Normal', 'normal motion'], ['Reduced', 'reduce motion']]],
        ['Live sky colours', [['Accent', 'sky colours accent'], ['Original', 'sky colours original']]],
        ['Ground', [['Screen bottom', 'ground at the bottom'], ['Above typing', 'ground above the message box']]],
        ['Icon glow', [['On', 'glow on'], ['Off', 'glow off']]],
        ['Static on text', [['Clear', 'text static clear'], ['Reduced', 'text static reduced'], ['Full', 'text static full']]],
        ['Background', [['Particles off', 'particles off'], ['No sky', 'no sky'], ['Face background', 'face background'], ['Face off', 'face background off']]]
    ];
    function buildQuickSettings(after, openNow) {
        const wrap = el('details', 'quick-set'); wrap.open = !!openNow;
        const sum = el('summary', 'quick-title', 'Quick settings'); sum.appendChild(el('span', 'quick-hint', 'effects, motion, ground, glow'));
        wrap.appendChild(sum);
        const rows = el('div', 'quick-rows');
        QUICK.forEach(([label, opts]) => {
            const row = el('div', 'quick-row');
            row.appendChild(el('span', 'quick-label', label));
            const seg = el('div', 'quick-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', label);
            opts.forEach(([t, cmd]) => {
                const b = el('button', 'quick-opt', t); b.type = 'button'; b._cmd = cmd;
                b.addEventListener('click', () => { runFreeCommand(cmd); setTimeout(() => { syncQuick(wrap); after && after(); }, 350); });
                seg.appendChild(b);
            });
            row.appendChild(seg); rows.appendChild(row);
        });
        wrap.appendChild(rows);
        syncQuick(wrap);
        return wrap;
    }
    function syncQuick(wrap) {
        const on = catActive();
        on.add(uiPrefs.motion === 'reduced' ? 'reduce motion' : 'normal motion');
        if (uiPrefs.faceBg) on.add('face background'); else on.add('face background off');
        if ((uiPrefs.scene || 'mist') === 'none') on.add('no sky');
        wrap.querySelectorAll('.quick-opt').forEach(b => { const a = on.has(b._cmd); b.classList.toggle('on', a); b.setAttribute('aria-pressed', String(a)); });
    }
    // The ⚙ button under the message box opens the same switches as a small sheet
    function toggleQuickSheet(force) {
        let sh = document.querySelector('.quick-sheet');
        if (sh && force !== true) { sh.remove(); document.getElementById('look-settings')?.setAttribute('aria-expanded', 'false'); return; }
        if (sh) sh.remove();
        sh = el('div', 'quick-sheet'); sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', 'Quick settings');
        const x = el('button', 'quick-close', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', () => toggleQuickSheet());
        sh.append(x, buildQuickSettings(null, true));
        const more = el('button', 'quick-more', 'Everything you can customise ›'); more.type = 'button';
        more.addEventListener('click', () => { toggleQuickSheet(); openPanel(true); setPanelView('customise', true); });
        sh.appendChild(more);
        document.body.appendChild(sh);
        document.getElementById('look-settings')?.setAttribute('aria-expanded', 'true');
        const away = (ev) => { if (!sh.contains(ev.target) && ev.target.id !== 'look-settings') { sh.remove(); document.removeEventListener('pointerdown', away, true); document.getElementById('look-settings')?.setAttribute('aria-expanded', 'false'); } };
        setTimeout(() => document.addEventListener('pointerdown', away, true), 0);
    }
    setTimeout(() => { document.getElementById('look-settings')?.addEventListener('click', () => toggleQuickSheet()); document.getElementById('hist-launch')?.addEventListener('click', (e) => { e.stopPropagation(); showHistory(); }); }, 400);

    // host: the side panel's Customise tab; without one, the list opens in the chat
    function showCatalog(host) {
        if (!host) {
            elements.messagesArea.querySelectorAll('.ft-offer').forEach(o => o.remove());
            hideWelcomeScreen();
            elements.chatContainer.classList.add('has-messages');
        }
        const run = (cmd) => { elements.messageInput.value = cmd; sendMessage(); };
        const suggest = (text) => { elements.messageInput.value = text; elements.messageInput.focus(); try { elements.messageInput.dispatchEvent(new Event('input')); } catch (e) { } };
        const active = catActive();
        const accentHex = a => (ACCENTS[String(a).toLowerCase()] || ['#888'])[0];
        const S = [];   // sections: { id, group, icon, title, tag, note, cost, items:[[label, cmd, swatch?, fontStack?]] }
        const add = (o) => S.push(o);

        add({ id: 'skies', group: 'Backgrounds', icon: 'sky', title: 'Skies', tag: `${SKY_KEYS.length} moving skies, painted or live 3D`, cost: 'free',
            note: 'One sky at a time, behind everything. The live skies (from Living fog on) are 3D and glow through the app.',
            items: SKY_KEYS.map(k => [SKY_LABEL[k], { mist: 'mist', clouds: 'clouds', sunset: 'sunset', night: 'night sky', seaday: 'seashore', seanight: 'seashore at night', storm: 'storm', none: 'no sky' }[k] || SKY_LABEL[k].toLowerCase() + ' sky',
                SKY_SWATCH[k] || (LIVE_SKIES[k] ? `linear-gradient(135deg,#0b0f19, rgb(var(--ui-accent-rgb)))` : null)]) });
        add({ id: 'particles', group: 'Backgrounds', icon: 'sparkles', title: 'Particles', tag: 'A layer of light VQ designs himself', cost: 'mixed',
            note: 'These twelve are free. Or ask VQ for any particle effect and he designs it: “slow golden embers rising”, “blue snow drifting sideways”, “a star map that reacts to my pointer” (uses a message).',
            items: Object.entries(PARTICLE_BUILTINS).map(([k, v]) => [v.label, v.label.toLowerCase() + ' particles', `linear-gradient(135deg, ${v.colors.map(c => c === 'accent' ? 'rgb(var(--ui-accent-rgb))' : c).concat(v.colors.length < 2 ? [v.colors[0] === 'accent' ? 'rgb(var(--ui-accent-rgb))' : v.colors[0]] : []).join(',')})`])
                .concat([['Particles off', 'particles off'], ['“golden embers rising slowly”', null], ['“a star map that reacts to my pointer”', null]]) });
        add({ id: 'effects', group: 'Backgrounds', icon: 'layers', title: 'Effects', tag: 'Drawn in your theme’s colours', cost: 'free',
            items: [['Grass', 'add grass'], ['Mountains', 'add mountains'], ['Stars', 'add stars'], ['Comet', 'add a comet'], ['Planet', 'add a planet'], ['Aurora', 'add an aurora'],
                ['Fireflies', 'add fireflies'], ['Snow', 'add snow'], ['Falling leaves', 'add leaves'], ['TV static', 'add static'], ['Old-TV screen', 'add crt'], ['TV set', 'add the tv set']] });
        add({ id: 'space', group: 'Backgrounds', icon: 'galaxy', title: 'Light and space', tag: 'Richer canvas layers', cost: 'free',
            items: [['Galaxy', 'add a galaxy'], ['Nebula', 'add a nebula'], ['Constellations', 'add constellations'], ['Comets', 'add comets'], ['Waves', 'add waves'], ['Surf', 'add surf'],
                ['Ripples', 'add ripples'], ['Falling code', 'add falling code'], ['Circuits', 'add circuits'], ['Retro grid', 'add a grid'], ['Tunnel', 'add a tunnel'], ['Vortex', 'add a vortex'],
                ['Orbits', 'add orbits'], ['Clouds layer', 'add clouds'], ['Mist layer', 'add mist'], ['Film grain', 'add film grain']] });
        add({ id: 'elements', group: 'Scene', icon: 'flower', title: 'Plants and flyers', tag: 'Flowers, trees, butterflies and birds', cost: 'free',
            note: 'Added one at a time. Name a colour or number too: “add 6 red tulips”.',
            items: [['Daisies', 'add daisies'], ['Tulips', 'add tulips'], ['Roses', 'add roses'], ['Poppies', 'add poppies'], ['Lavender', 'add lavender'], ['Sunflowers', 'add sunflowers'], ['Wildflowers', 'add wildflowers'], ['Lilies', 'add lilies'],
                ['Monarch butterflies', 'add monarch butterflies'], ['Blue butterflies', 'add blue butterflies'], ['Swallowtails', 'add swallowtail butterflies'], ['Moths', 'add moths'],
                ['Pine trees', 'add pine trees'], ['Oaks', 'add oak trees'], ['Birches', 'add birch trees'], ['Palms', 'add palm trees'], ['Willows', 'add willow trees'], ['Cherry blossom', 'add cherry blossom trees'],
                ['Ferns', 'add ferns'], ['Bushes', 'add bushes'], ['Reeds', 'add reeds'], ['Birds', 'add birds'], ['Falling petals', 'add falling petals']] });
        add({ id: 'animals', group: 'Scene', icon: 'paw', title: 'Animals', tag: 'Living creatures from VQ’s parts kit', cost: 'mixed',
            note: 'They breathe, blink and look around, and can walk, run, play, swim or fly. These are free; ask VQ for any other (“a wolf”, “a hippo”) and he builds one from the same parts.',
            items: [['Tiger', 'add a tiger'], ['Lion', 'add a lion'], ['Giraffe', 'add a giraffe'], ['Zebra', 'add a zebra'], ['Elephant', 'add an elephant'], ['Horse', 'add a horse'], ['Cow', 'add a cow'],
                ['Cat', 'add a cat'], ['Dog', 'add a dog'], ['Fox', 'add a fox'], ['Rabbit', 'add a rabbit'], ['Bear', 'add a bear'], ['Deer', 'add a deer'], ['Pig', 'add a pig'], ['Sheep', 'add a sheep']] });
        add({ id: 'birds', group: 'Scene', icon: 'bird', title: 'Birds, bugs and creatures', tag: 'Owls to dragons', cost: 'free',
            items: [['Owl', 'add an owl'], ['Eagle', 'add an eagle'], ['Parrot', 'add a parrot'], ['Duck', 'add a duck'], ['Penguin', 'add a penguin'], ['Flamingo', 'add a flamingo'], ['Hummingbird', 'add a hummingbird'],
                ['Bee', 'add a bee'], ['Ladybird', 'add a ladybird'], ['Dragonfly', 'add a dragonfly'], ['Ant', 'add an ant'], ['Snake', 'add a snake'], ['Dragon', 'add a dragon'], ['Flying dragon', 'add a flying dragon']] });
        add({ id: 'sea', group: 'Scene', icon: 'fish', title: 'Sea life', tag: 'Best with a seashore sky', cost: 'free',
            items: [['Goldfish', 'add a goldfish'], ['Reef fish', 'add a reef fish'], ['Shark', 'add a shark'], ['Whale', 'add a whale'], ['Dolphin', 'add a dolphin'], ['Turtle', 'add a turtle'], ['Octopus', 'add an octopus'], ['Crab', 'add a crab']] });
        add({ id: 'machines', group: 'Scene', icon: 'move', title: 'Vehicles, buildings and landscapes', tag: 'Cars, planes, boats, castles, waterfalls', cost: 'free',
            note: 'Built from the same parts kit: wheels turn, propellers spin, sails catch the wind, chimneys smoke and lighthouse beams sweep. Windows and headlights glow on night skies. A dog can even chase the car.',
            items: [['Car', 'add a car'], ['Bus', 'add a bus'], ['Train', 'add a train'], ['Bicycle', 'add a bicycle'], ['Tractor', 'add a tractor'], ['Plane', 'add a plane'], ['Jet', 'add a jet'],
                ['Helicopter', 'add a helicopter'], ['Rocket', 'add a rocket'], ['Hot-air balloon', 'add a hot-air balloon'], ['Airship', 'add an airship'], ['Sailboat', 'add a sailboat'], ['Ship', 'add a ship'],
                ['Rowing boat', 'add a rowing boat'], ['Submarine', 'add a submarine'], ['Cottage', 'add a cottage'], ['Castle', 'add a castle'], ['Lighthouse', 'add a lighthouse'], ['Windmill', 'add a windmill'],
                ['Church', 'add a church'], ['Barn', 'add a barn'], ['Bridge', 'add a bridge'], ['Tent', 'add a tent'], ['Snowy mountain', 'add a snowy mountain'], ['Waterfall', 'add a waterfall'], ['Palm island', 'add a palm island'], ['Forest edge', 'add a forest edge'], ['Hills', 'add hills'], ['Lake', 'add a lake'], ['Desert dunes', 'add desert dunes'], ['City skyline', 'add a city skyline'], ['Moon', 'add the moon'], ['Planet', 'add a planet'], ['Person', 'add a person'], ['Robot friend', 'add a robot friend'], ['Sailor', 'add a sailor'],
                ['“the dog chases the car”', null], ['“the plane takes off”', null]] });
        add({ id: 'doing', group: 'Scene', icon: 'motion', title: 'What they do', tag: 'Run, play, chase, herd, follow', cost: 'free',
            note: 'Say it with the animal’s name. Tap one to put it in the message box, then change the names.',
            items: [['“make the dog run”', null], ['“let the cat play”', null], ['“the cow should graze”', null], ['“the eagle should fly”', null], ['“the dog chases the cat”', null], ['“the rabbit runs away from the fox”', null],
                ['“the duck follows the cow”', null], ['“let the dog and the cat play”', null], ['“the sheep herd together”', null], ['“the cat chases my pointer”', null], ['“the dog stops chasing”', null],
                ['“make the whale fill the scene”', null], ['“make the shark huge”', null], ['“remove the snake”', null]] });
        add({ id: 'draw', group: 'Scene', icon: 'pencil', title: 'VQ draws his own', tag: 'Original designs with moving parts', cost: 'message',
            note: 'Ask for anything not in the lists. He designs his own version and its parts move: propellers spin, wings flap, lights twinkle. One drawing per request. No real people, known characters or brands, but he can make an original one of his own.',
            items: [['Kite', 'draw a kite'], ['Treehouse', 'draw a treehouse'], ['Robot friend', 'draw a friendly little robot'], ['Carousel', 'draw a carousel'],
                ['Fish', 'draw 3 fish swimming'], ['Lantern', 'draw a glowing lantern'], ['Your own dragon', 'draw a friendly dragon of your own design'],
                ['“remove the plane”', null], ['“2 more balloons”', null], ['“make the rocket bigger”', null]] });
        add({ id: 'arrange', group: 'Scene', icon: 'move', title: 'Arrange', tag: 'Drag anything anywhere; drop it on the bin', cost: 'free',
            note: 'Tap ✥ Arrange under the message box (or say “arrange”). Anything can go anywhere: carry a flower up a hill or a bird down to the ground. Every move can be undone; tap Done or press Esc when finished.',
            items: [['Arrange now', 'arrange'], ['Undo last move', 'undo'], ['Ground at the screen bottom', 'ground at the bottom'], ['Ground above the message box', 'ground above the message box']] });
        add({ id: 'remove', group: 'Scene', icon: 'eraser', title: 'Removing things', tag: 'One at a time, by name', cost: 'free',
            items: [['“remove the comet”', null], ['“remove butterflies”', null], ['No sky', 'no sky'], ['Particles off', 'particles off']] });

        add({ id: 'moments', group: 'Moments', icon: 'party', title: 'Celebrations', tag: 'Fireworks and confetti over everything', cost: 'free',
            note: 'The app fades away and the celebration fills the whole screen until you click.',
            items: [['Celebrate', 'celebrate'], ['Fireworks', 'fireworks'], ['Confetti', 'confetti'], ['Confetti rain', 'confetti rain']] });
        add({ id: 'shows', group: 'Moments', icon: 'sparkles', title: 'Full-screen moments', tag: 'VQ takes the whole screen', cost: 'mixed',
            note: 'Skies, particles, giant creatures and buildings, and VQ’s face speaking, all at once, until you click. These are free; ask VQ for your own (“a moment with a giant dragon under the stars”) and he composes one (uses a message).',
            items: [['Night show', 'night show moment'], ['Stardust', 'stardust moment'], ['Giant whale', 'giant moment'], ['VQ’s face', 'face moment'],
                ['Giant castle', 'moment: castle'], ['Giant elephant', 'moment: elephant'], ['Rocket', 'moment: rocket'], ['“a moment with a giant dragon under the stars”', null]] });
        add({ id: 'vq', group: 'VQ', icon: 'robot', title: 'VQ himself', tag: 'His animated robot body', cost: 'free',
            note: 'He looks at you, follows the conversation, thinks, speaks and shows moods. On a night sky he sits on the moon and fishes.',
            items: [['In the header', 'vq in the header'], ['In the side panel', 'show vq'], ['Walking around', 'let vq walk around'], ['Flying', 'let vq fly'], ['On the moon, fishing', 'vq on the moon'], ['Hide VQ', 'hide vq']] });
        add({ id: 'face', group: 'VQ', icon: 'face', title: 'VQ’s face', tag: 'A living face made of text characters', cost: 'free',
            note: 'It thinks while VQ works, speaks as his answer streams in, blinks and follows your pointer. The robot style becomes O.R.I.A. when she speaks.',
            items: [['Face in the panel', 'show the face'], ['As the background', 'face background'], ['Background off', 'face background off'], ['VQ robot style', 'robot face'], ['Human style', 'human face']] });

        add({ id: 'themes', group: 'Look', icon: 'palette', title: 'Themes', tag: 'Ten built-in looks, or one VQ designs', cost: 'mixed',
            note: 'Each comes with matching icons and accent. Or ask VQ to design a new one from any description, sky and particles included: “a theme like a quiet night by the sea, with fireflies” (uses a message).',
            items: CHOICES.theme.map(t => { const k = t.toLowerCase(), th = THEMES[k]; return [t, `${k} theme`, th ? `linear-gradient(135deg, ${th[0]} 0 55%, ${accentHex(THEME_ACCENT[k] || 'orange')} 55%)` : `linear-gradient(135deg,#1f1b18 0 55%,#ff8c42 55%)`]; }) });
        add({ id: 'accent', group: 'Look', icon: 'drop', title: 'Accent colour', tag: 'Buttons, highlights and live skies', cost: 'free',
            items: CHOICES.accent.map(a => [a, `${a.toLowerCase()} accent`, accentHex(a)]) });
        add({ id: 'fonts', group: 'Look', icon: 'type', title: 'Fonts', tag: 'Thirteen styles for the conversation', cost: 'free',
            items: CHOICES.font.map(f => [f, `${f.toLowerCase()} font`, null, (FONTS[f.toLowerCase()] || {}).stack]) });
        add({ id: 'text', group: 'Look', icon: 'layout', title: 'Text and layout', tag: 'Size, spacing, width, bubbles, focus', cost: 'free',
            items: [['Bigger', 'bigger'], ['Smaller', 'smaller'], ['More line spacing', 'more line spacing'], ['Wider chat', 'wider chat'], ['Narrower chat', 'narrower chat'],
                ['Bubbles on', 'bubbles on'], ['Bubbles off', 'bubbles off'], ['Focus', 'focus'], ['Unfocus', 'unfocus'], ['High contrast', 'high contrast'], ['Less motion', 'reduce motion']] });
        add({ id: 'panel', group: 'Panel and tools', icon: 'panel', title: 'Side panel', tag: 'Open, width, detail and notes', cost: 'free',
            note: 'Videos, pictures and cards can also be shown here with their cast button (⧉).',
            items: [['Your chats, full screen', 'show my chats'], ['Open', 'open the panel'], ['Close', 'close the panel'], ['Wide', 'wide panel'], ['Standard', 'standard panel'], ['Plain details', 'plain details'], ['Technical details', 'technical details'], ['Notes', 'show my notes']] });
        add({ id: 'code', group: 'Panel and tools', icon: 'code', title: 'Code', tag: 'Copy and ▶ Run inside the app', cost: 'message',
            note: 'Run shows web pages, Python results and charts, and data charts in the side panel, safely on your device.',
            items: [['“make me a small web page with a button”', null], ['“plot a sine wave in Python”', null]] });
        add({ id: 'undo', group: 'Panel and tools', icon: 'undo', title: 'Undo and reset', tag: 'Step back, or start fresh', cost: 'free',
            items: [['Undo', 'undo'], ['Reset everything', 'reset']] });

        const COST = { free: ['Free', 'free'], mixed: ['Free + ask VQ', 'mixed'], message: ['Uses a message', 'paid'] };
        const box = el('div', 'ft-offer catalog cat2' + (host ? ' in-panel' : ''));
        const head = el('div', 'cat-head');
        head.innerHTML = `<div class="cat-head-text"><div class="ft-offer-title">Customise</div><div class="cat-sub">${S.reduce((n, s) => n + s.items.filter(i => i[1]).length, 0)} things to try. Tap a heading to open it, then tap any option. Hold anywhere to see through this list.</div></div>`;
        box.appendChild(head);
        const tools = el('div', 'cat-tools');
        const searchWrap = el('label', 'cat-search');
        searchWrap.innerHTML = catIcon('search', 'cat-search-ic');
        const search = document.createElement('input');
        search.type = 'search'; search.placeholder = 'Search: sky, dog, gold, font…'; search.setAttribute('aria-label', 'Search the customisations');
        searchWrap.appendChild(search);
        const toggleAll = el('button', 'cat-toggle-all', 'Open all'); toggleAll.type = 'button';
        tools.append(searchWrap, toggleAll);
        if (host) [['↶', 'undo', 'Undo'], ['⟲', 'reset', 'Reset look']].forEach(([l, c, t]) => { const b = el('button', 'cat-tool-btn', l); b.type = 'button'; b.title = t; b.setAttribute('aria-label', t); b.addEventListener('click', () => runFreeCommand(c)); tools.appendChild(b); });
        box.appendChild(tools);

        // Quick settings: the switches that change everything at once, always one tap away
        box.appendChild(buildQuickSettings(() => refreshCatalogState(box)));
        // Two levels: pick a category, then open a card. Search looks across everything.
        const GROUPS = [['Backgrounds', 'sky', 'Skies, particles, effects'], ['Scene', 'paw', 'Plants, animals, vehicles, drawings'], ['Moments', 'party', 'Full-screen celebrations'],
            ['VQ', 'robot', 'His body and his face'], ['Look', 'palette', 'Themes, colours, fonts, layout'], ['Panel and tools', 'panel', 'Side panel, code, undo']];
        const tiles = el('div', 'cat-tiles');
        const panes = {};
        const viewKey = 'vq-catalog-view';
        const setView = (g) => {
            box.dataset.view = g || '';
            try { localStorage.setItem(viewKey, g || ''); } catch (e) { }
            if (g && panes[g]) { const t = panes[g].querySelector('.cat-back'); if (t) t.focus({ preventScroll: true }); (host || box).scrollTop = 0; if (!host) box.scrollIntoView({ block: 'start' }); }
        };
        GROUPS.forEach(([g, ic, tag]) => {
            const n = S.filter(x => x.group === g).reduce((k, x) => k + x.items.filter(i => i[1]).length, 0);
            const t = el('button', 'cat-tile'); t.type = 'button';
            t.innerHTML = `<span class="cat-card-ic">${catIcon(ic)}</span><span class="cat-tile-title">${g}</span><span class="cat-tile-tag">${tag}</span><span class="cat-tile-n">${n}</span>`;
            t.addEventListener('click', () => setView(g));
            tiles.appendChild(t);
            const pane = el('div', 'cat-pane'); pane.dataset.g = g;
            const ph = el('div', 'cat-pane-head');
            const back = el('button', 'cat-back'); back.type = 'button'; back.innerHTML = '‹ All'; back.setAttribute('aria-label', 'Back to all categories');
            back.addEventListener('click', () => setView(''));
            ph.append(back, el('div', 'cat-group', g));
            pane.appendChild(ph);
            panes[g] = pane;
        });
        box.appendChild(tiles);
        GROUPS.forEach(([g]) => box.appendChild(panes[g]));
        let startView = ''; try { startView = localStorage.getItem(viewKey) || ''; } catch (e) { }
        box.dataset.view = panes[startView] ? startView : '';
        const open = catOpenGet();
        const cards = [];
        S.forEach(sec => {
            const card = el('section', 'cat-card');
            card.dataset.id = sec.id;
            const bodyId = 'cat-body-' + sec.id + (host ? '-p' : '-c');
            const hd = el('button', 'cat-card-head'); hd.type = 'button';
            hd.setAttribute('aria-controls', bodyId);
            const nOn = sec.items.filter(i => i[1] && active.has(i[1])).length;
            hd.innerHTML = `<span class="cat-card-ic">${catIcon(sec.icon)}</span><span class="cat-card-text"><span class="cat-card-title">${sec.title}</span><span class="cat-card-tag">${sec.tag}</span></span>`
                + `<span class="cat-badge ${COST[sec.cost][1]}">${COST[sec.cost][0]}</span><span class="cat-count">${sec.items.length}</span>${catIcon('chevron', 'cat-chev')}`;
            const body = el('div', 'cat-card-body'); body.id = bodyId; body.setAttribute('role', 'region');
            const inner = el('div', 'cat-card-inner');
            if (sec.note) inner.appendChild(el('div', 'cat-note', sec.note));
            const row = el('div', 'cat-chips');
            sec.items.forEach(([label, cmd, swatch, font]) => {
                const b = el('button', 'cat-chip' + (cmd ? '' : ' example')); b.type = 'button';
                if (swatch) { const d = el('span', 'cat-sw'); d.style.background = swatch; b.appendChild(d); }
                const t = el('span', 'cat-chip-label', label); if (font) t.style.fontFamily = font; b.appendChild(t);
                b.dataset.search = (label + ' ' + (cmd || '') + ' ' + sec.title + ' ' + sec.tag).toLowerCase();
                b._cmd = cmd;
                if (cmd) {
                    const isOn = active.has(cmd);
                    if (isOn) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
                    b.addEventListener('click', () => { run(cmd); setTimeout(() => refreshCatalogState(box), 450); });
                } else {
                    b.title = 'Put this in the message box to edit and send';
                    b.addEventListener('click', () => suggest(label.replace(/^[“"]|[”"]$/g, '').replace(/\s*\(.*\)\s*$/, '')));
                }
                row.appendChild(b);
            });
            inner.appendChild(row);
            body.appendChild(inner);
            card.append(hd, body);
            const setOpen = (on, save = true) => {
                card.classList.toggle('open', on); hd.setAttribute('aria-expanded', String(on));
                if (save) { if (on) open.add(sec.id); else open.delete(sec.id); catOpenSet(open); }
            };
            setOpen(open.has(sec.id), false);
            hd.addEventListener('click', () => setOpen(!card.classList.contains('open')));
            card._setOpen = setOpen;
            if (nOn) card.classList.add('has-on');
            cards.push(card);
            (panes[sec.group] || box).appendChild(card);
        });
        const empty = el('div', 'cat-empty', 'Nothing matches. Try another word, or just ask VQ: he can design skies, particles, creatures and drawings that aren’t in the list.');
        empty.hidden = true;
        box.appendChild(empty);

        const syncToggle = () => { toggleAll.textContent = cards.every(c => c.classList.contains('open')) ? 'Close all' : 'Open all'; };
        toggleAll.addEventListener('click', () => { const to = !cards.every(c => c.classList.contains('open')); cards.forEach(c => c._setOpen(to)); syncToggle(); });
        cards.forEach(c => c.querySelector('.cat-card-head').addEventListener('click', syncToggle));
        syncToggle();
        // Search: show only matching options, open the cards that have them, hide group headings with nothing left
        search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            box.classList.toggle('searching', !!q);
            let any = false;
            cards.forEach(c => {
                let hits = 0;
                c.querySelectorAll('.cat-chip').forEach(ch => { const m = !q || ch.dataset.search.includes(q); ch.hidden = !m; if (m) hits++; });
                c.hidden = !!q && !hits;
                if (q) c.classList.toggle('open', hits > 0); else c.classList.toggle('open', open.has(c.dataset.id));
                c.querySelector('.cat-card-head').setAttribute('aria-expanded', String(c.classList.contains('open')));
                if (hits) any = true;
            });
            Object.values(panes).forEach(pn => { pn.hidden = !!q && ![...pn.querySelectorAll('.cat-card')].some(c => !c.hidden); });
            empty.hidden = !q || any;
        });

        if (host) {
            host.textContent = '';
            host.appendChild(box);
            enablePeek(box);
            return;
        }
        const no = el('button', 'ft-offer-no', 'Close'); no.type = 'button';
        no.addEventListener('click', () => { box.remove(); if (!conversationHistory.length) showWelcomeScreen(); });
        box.appendChild(no);
        elements.messagesArea.appendChild(box);
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        enablePeek(box);
    }
    // After a chip is used, move the "selected" marks to whatever is now switched on
    function refreshCatalogState(box) {
        if (!box || !box.isConnected) return;
        box.querySelectorAll('.quick-set').forEach(syncQuick);
        const active = catActive();
        box.querySelectorAll('.cat-card').forEach(card => {
            let n = 0;
            card.querySelectorAll('.cat-chip:not(.example)').forEach(ch => {
                const on = active.has(ch._cmd);
                ch.classList.toggle('on', on); if (on) { ch.setAttribute('aria-pressed', 'true'); n++; } else ch.removeAttribute('aria-pressed');
            });
            card.classList.toggle('has-on', n > 0);
        });
    }

    // Press and hold anywhere on a card to see through it (the scene behind), without closing it
    function enablePeek(box) {
        let timer = null, peeked = false, sx = 0, sy = 0;
        const end = () => { clearTimeout(timer); timer = null; box.classList.remove('peek'); };
        box.addEventListener('pointerdown', (e) => {
            if (e.button && e.button !== 0) return;
            peeked = false; sx = e.clientX; sy = e.clientY;
            timer = setTimeout(() => { peeked = true; box.classList.add('peek'); }, 280);
        });
        box.addEventListener('pointermove', (e) => { if (timer && !peeked && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { clearTimeout(timer); timer = null; } });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => box.addEventListener(t, end));
        // a hold is a peek, not a tap: don't trigger the chip underneath on release
        box.addEventListener('click', (e) => { if (peeked) { e.stopPropagation(); e.preventDefault(); peeked = false; } }, true);
        box.addEventListener('contextmenu', (e) => { if (peeked) e.preventDefault(); });
    }

    function showMyThemes() {
        elements.messagesArea.querySelectorAll('.ft-offer').forEach(o => o.remove());
        hideWelcomeScreen();
        elements.chatContainer.classList.add('has-messages');
        const box = el('div', 'ft-offer my-themes');
        const list = Object.entries(uiPrefs.customThemes || {});
        box.appendChild(el('div', 'ft-offer-title', list.length ? 'Your themes' : 'No saved themes yet'));
        box.appendChild(el('div', 'ft-offer-text', list.length ? 'Tap one to use it, or copy its code to share it.' : 'Ask VQ to design one, for example: “make me a theme like a sunrise over the ocean”.'));
        list.reverse().forEach(([id, t]) => {
            const row = el('div', 'mt-row');
            const sw = el('span', 'mt-swatch');
            sw.style.background = `linear-gradient(135deg, ${t.background} 0 45%, ${t.accent} 45% 70%, ${t.icon} 70%)`;
            const use = el('button', 'mt-use', t.name); use.type = 'button';
            use.addEventListener('click', () => { uiUndo.push(snapshotUI()); uiPrefs.theme = id; uiPrefs.accent = 'theme'; if (t.scene) { uiPrefs.scene = t.scene; uiPrefs.mist = t.scene !== 'none'; } saveUIPrefs(); applyUIPrefs(); showLocalNote(`Switched to “${t.name}”`); });
            const copy = el('button', 'mt-copy', 'Copy code'); copy.type = 'button';
            copy.addEventListener('click', () => { navigator.clipboard?.writeText(themeCode(t)).then(() => { copy.textContent = 'Copied'; setTimeout(() => copy.textContent = 'Copy code', 1500); }); });
            const link = el('button', 'mt-copy', 'Copy link'); link.type = 'button';
            link.addEventListener('click', () => { navigator.clipboard?.writeText(themeShareLink(t)).then(() => { link.textContent = 'Copied'; setTimeout(() => link.textContent = 'Copy link', 1500); }); });
            row.append(sw, use, copy, link);
            box.appendChild(row);
        });
        const no = el('button', 'ft-offer-no', 'Close'); no.type = 'button';
        no.addEventListener('click', () => { box.remove(); if (!conversationHistory.length) showWelcomeScreen(); });
        box.appendChild(no);
        elements.messagesArea.appendChild(box);
        box.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    function applyTheme(name) {
        const root = document.documentElement.style;
        const cs = customSpec(name);
        const vals = cs ? themeVars(cs) : THEMES[name];
        THEME_VARS.forEach((v, i) => { if (vals) root.setProperty(v, vals[i]); else root.removeProperty(v); });
        applyCustomIcons(cs);
        renderFx(cs);
        applyToolkitLayers(cs);
        applyArt(cs);
        setTimeout(updateFavicon, 50);
        if (persona) { try { persona.accent(personaAccent()); } catch (e) {} }
        const before = document.body.dataset.theme;
        document.body.dataset.theme = cs ? 'custom' : vals ? name : 'classic';
        if (cs) document.body.dataset.customTheme = name; else delete document.body.dataset.customTheme;
        if (before && before !== document.body.dataset.theme) mistSurge();
    }


    // ---------- Sky scenes: mist (default), drifting clouds, a sunset, or a sci-fi storm ----------
    let stormTimer = null;
    function applyScene() {
        const sc = document.querySelector('.vq-scene');
        if (!sc) return;
        const scene = ['clouds', 'sunset', 'storm', 'night', 'seaday', 'seanight'].includes(uiPrefs.scene) ? uiPrefs.scene : '';
        sc.dataset.scene = scene;
        if (typeof syncPersonaToSky === 'function') setTimeout(syncPersonaToSky, 0);
        clearTimeout(stormTimer);
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches || uiPrefs.motion === 'reduced';
        if (scene === 'storm' && !calm) scheduleLightning(sc);
        applyLiveSky();
        applyParticles();
    }
    // A live sky runs behind the app like the face background; one at a time, destroyed when you switch away
    let liveSky = null, liveKey = '', liveLoading = '';
    const liveScripts = {};
    function loadScript(src) {
        return liveScripts[src] || (liveScripts[src] = new Promise((ok, no) => {
            const t = document.createElement('script'); t.src = src; t.onload = ok; t.onerror = () => { delete liveScripts[src]; no(new Error(src)); };
            document.head.appendChild(t);
        }));
    }
    function liveAccent() {
        const a = getComputedStyle(document.documentElement).getPropertyValue('--ui-accent').trim().replace('#', '');
        return /^[0-9a-f]{6}$/i.test(a) ? parseInt(a, 16) : 0x2bb5a6;
    }
    function stopLiveSky() {
        if (liveSky) { try { liveSky.destroy(); } catch (e) { } liveSky = null; }
        liveKey = '';
        const h = document.querySelector('.vq-live-sky'); if (h) { h.hidden = true; h.innerHTML = ''; }
    }
    async function applyLiveSky() {
        const key = LIVE_SKIES[uiPrefs.scene] ? uiPrefs.scene : '';
        const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || uiPrefs.motion === 'reduced';
        const orig = uiPrefs.skyColours === 'original';
        const want = key && !calm ? key + '|' + (orig ? 'original' : liveAccent()) : '';
        if (want === liveKey || (want && want === liveLoading)) return;     // already showing, or already on its way
        stopLiveSky();
        liveLoading = '';
        if (!want) return;
        const def = LIVE_SKIES[key];
        liveLoading = want;
        try {
            await loadScript(def.fx === 'topology' || def.fx === 'trunk' ? 'lib/vanta/p5.min.js' : 'lib/vanta/three.r134.min.js');
            await loadScript(`lib/vanta/vanta.${def.fx}.min.js`);
        } catch (e) { console.warn('Live sky failed to load', e); liveLoading = ''; return; }
        if (liveLoading !== want) return;          // you switched again while it loaded
        liveLoading = '';
        let host = document.querySelector('.vq-live-sky');
        if (!host) { host = document.createElement('div'); host.className = 'vq-live-sky'; host.setAttribute('aria-hidden', 'true'); document.body.prepend(host); }
        host.hidden = false;
        host.style.setProperty('--live-k', String(def.k || 1));
        const fn = window.VANTA && window.VANTA[def.fx.toUpperCase()];
        if (!fn) return;
        try {
            liveSky = fn(Object.assign({ el: host, mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200, minWidth: 200,
                scale: 1, scaleMobile: 1 }, orig ? {} : def.opts(liveAccent())));
            liveKey = want;
        } catch (e) { console.warn('Live sky failed to start', e); stopLiveSky(); }
    }

    // ---------- Particle layer: VQ designs these himself from parts (shape, colour, motion, links, glow, emitters) ----------
    // A recipe is small, checked data; the app turns it into tsParticles options (MIT, bundled in lib/tsparticles).
    // The built-ins below are only starting points: VQ can change any field, or write a new recipe from scratch.
    // Check a recipe from VQ (or a built-in) and keep only what's safe and sensible; returns null if nothing usable
    function cleanParticles(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const num = (v, lo, hi, d) => { const n = +v; return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
        const range = (v, lo, hi, d) => { const a = Array.isArray(v) ? v : (v != null ? [v, v] : d); const x = num(a[0], lo, hi, d[0]), y = num(a[1], lo, hi, d[1]); return [Math.min(x, y), Math.max(x, y)]; };
        const pick = (v, list, d) => list.includes(v) ? v : d;
        const base = typeof raw.preset === 'string' && PARTICLE_BUILTINS[raw.preset] ? PARTICLE_BUILTINS[raw.preset] : {};
        const r = Object.assign({}, base, raw);
        const o = {};
        o.name = String(r.name || r.label || (raw.preset && base.label) || 'Particles').replace(/[<>]/g, '').slice(0, 40);
        if (raw.preset && base.label) o.preset = raw.preset;
        o.shape = pick(r.shape, PARTICLE_SHAPES, 'circle');
        if (o.shape === 'glyph') { const g = String(r.glyph || '').replace(/[<>&"'\s]/g, '').slice(0, 2); if (g) o.glyph = g; else o.shape = 'circle'; }
        const cols = (Array.isArray(r.colors) ? r.colors : [r.colors]).filter(c => c === 'accent' || isHex(c)).slice(0, 6).map(c => c === 'accent' ? c : '#' + String(c).replace('#', '').toLowerCase());
        o.colors = cols.length ? cols : ['#ffffff'];
        o.count = Math.round(num(r.count, 0, 200, 60));
        o.size = range(r.size, 0.5, 60, [1, 3]);
        o.opacity = range(r.opacity, 0.03, 1, [0.3, 0.9]);
        o.speed = num(r.speed, 0, 12, 0.6);
        o.direction = pick(r.direction, PARTICLE_DIRS, 'none');
        ['drift', 'twinkle', 'glow', 'spin'].forEach(k => { const v = num(r[k], 0, 1, 0); if (v) o[k] = v; });
        const g = num(r.gravity, -2, 3, 0); if (g) o.gravity = g;
        if (r.links) { const l = typeof r.links === 'object' ? r.links : {}; o.links = { distance: num(l.distance, 40, 260, 130), opacity: num(l.opacity, 0.04, 0.6, 0.2) }; if (isHex(l.color) || l.color === 'accent') o.links.color = l.color === 'accent' ? 'accent' : '#' + l.color.replace('#', ''); }
        o.pointer = pick(r.pointer, PARTICLE_POINTER, 'none');
        if (r.emit && typeof r.emit === 'object') o.emit = { from: pick(r.emit.from, PARTICLE_FROM, 'bottom'), rate: num(r.emit.rate, 1, 30, 6) };
        if (!o.count && !o.emit) o.count = 40;
        return o;
    }

    // Turn a checked recipe into tsParticles options; fewer particles and no glow on lower effect levels and small screens
    function particleOptions(rc) {
        const fx = uiPrefs.fx || 'high', small = innerWidth < 700;
        const k = (fx === 'low' ? 0.4 : fx === 'medium' ? 0.7 : 1) * (small ? 0.6 : 1);
        const acc = getComputedStyle(document.documentElement).getPropertyValue('--ui-accent').trim() || '#2bb5a6';
        const col = c => c === 'accent' ? acc : c;
        const DIR = { none: 'none', up: 'top', down: 'bottom', left: 'left', right: 'right', 'up-left': 'top-left', 'up-right': 'top-right', 'down-left': 'bottom-left', 'down-right': 'bottom-right', outward: 'none' };
        const shape = rc.shape === 'triangle' ? { type: 'polygon', options: { polygon: { sides: 3 } } }
            : rc.shape === 'hexagon' ? { type: 'polygon', options: { polygon: { sides: 6 } } }
            : rc.shape === 'glyph' ? { type: 'text', options: { text: { value: [rc.glyph || '•'], font: 'system-ui, sans-serif', weight: '400' } } }
            : { type: rc.shape };
        const glowOn = rc.glow && fx === 'high' && !small;
        const opts = {
            fullScreen: { enable: false }, background: { color: { value: 'transparent' } }, detectRetina: true,
            fpsLimit: small || fx !== 'high' ? 40 : 60, pauseOnBlur: true, pauseOnOutsideViewport: true,
            particles: {
                number: { value: Math.round(rc.count * k), density: { enable: true, width: 1600, height: 900 } },
                paint: rc.shape === 'line' ? { stroke: { width: Math.max(1, rc.size[0]), color: { value: rc.colors.map(col) } }, fill: { enable: false } }
                       : { fill: { enable: true, color: { value: rc.colors.map(col) } } },
                shape,
                opacity: { value: { min: rc.opacity[0], max: rc.opacity[1] }, animation: { enable: !!rc.twinkle, speed: 0.3 + rc.twinkle * 1.6, sync: false } },
                size: { value: { min: rc.size[0], max: rc.size[1] } },
                move: { enable: rc.speed > 0, speed: rc.speed, direction: DIR[rc.direction], random: rc.direction === 'none', straight: rc.direction !== 'none' && !rc.drift,
                        outModes: { default: 'out' }, gravity: rc.gravity ? { enable: true, acceleration: rc.gravity * 4 } : { enable: false } },
                links: rc.links ? { enable: true, distance: rc.links.distance, opacity: rc.links.opacity, width: 1, color: { value: col(rc.links.color || rc.colors[0]) } } : { enable: false },
                rotate: rc.spin ? { value: { min: 0, max: 360 }, direction: 'random', animation: { enable: true, speed: 2 + rc.spin * 18 } } : { value: 0 },
                wobble: rc.drift ? { enable: true, distance: 4 + rc.drift * 16, speed: { min: -2, max: 2 } } : { enable: false },
                effect: glowOn ? { type: 'shadow', options: { shadow: { blur: 4 + rc.glow * 14, color: col(rc.colors[0]) } } } : undefined
            },
            interactivity: {
                detectsOn: 'window',
                events: { onHover: { enable: rc.pointer !== 'none', mode: rc.pointer === 'connect' ? 'connect' : rc.pointer }, onClick: { enable: false } },
                modes: { grab: { distance: 160, links: { opacity: 0.45 } }, repulse: { distance: 110, duration: 0.6 }, attract: { distance: 180 },
                         bubble: { distance: 140, size: rc.size[1] * 1.8, opacity: 1, duration: 1 }, connect: { distance: 90, radius: 160, links: { opacity: 0.3 } } }
            }
        };
        if (rc.shape === 'line') { opts.particles.size = { value: { min: rc.size[0] * 6, max: rc.size[1] * 10 } }; opts.particles.rotate = { path: true }; }
        if (!opts.particles.effect) delete opts.particles.effect;
        if (rc.direction === 'outward' && !rc.emit) opts.particles.move.direction = 'outside';
        if (rc.emit) {
            const at = { bottom: { x: 50, y: 102 }, top: { x: 50, y: -2 }, left: { x: -2, y: 50 }, right: { x: 102, y: 50 }, center: { x: 50, y: 50 }, random: undefined }[rc.emit.from];
            const wide = rc.emit.from === 'top' || rc.emit.from === 'bottom' ? { width: 100, height: 0 } : rc.emit.from === 'center' ? { width: 4, height: 4 } : rc.emit.from === 'random' ? { width: 100, height: 100 } : { width: 0, height: 100 };
            opts.emitters = { position: at, size: wide, rate: { quantity: 1, delay: 1 / Math.max(1, rc.emit.rate * k) }, life: { count: 0 } };
            opts.particles.number.value = Math.round((rc.count || 0) * k);
            opts.particles.move.outModes = { default: 'destroy' };
            if (rc.direction === 'outward') { opts.particles.move.direction = 'outside'; opts.particles.move.random = false; opts.particles.move.straight = true; opts.particles.move.outModes = { default: 'destroy' }; }
        }
        return opts;
    }

    let particleBox = null, particleKey = '', particleLoading = '';
    function currentParticles() {
        const p = uiPrefs.particles;
        return p && typeof p === 'object' ? p : null;
    }
    async function applyParticles() {
        const rc = cleanParticles(currentParticles());
        const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || uiPrefs.motion === 'reduced';
        const want = rc && !calm ? JSON.stringify(rc) + '|' + (uiPrefs.fx || 'high') + '|' + getComputedStyle(document.documentElement).getPropertyValue('--ui-accent').trim() : '';
        if (want === particleKey || (want && want === particleLoading)) return;
        if (particleBox) { try { particleBox.destroy(); } catch (e) { } particleBox = null; }
        particleKey = '';
        let host = document.getElementById('vq-particles');
        if (!want) { if (host) host.hidden = true; particleLoading = ''; return; }
        particleLoading = want;
        try {
            await loadScript('lib/tsparticles/tsparticles.bundle.min.js');
            await loadScript('lib/tsparticles/tsparticles.effect.shadow.min.js').catch(() => null);   // the soft glow; optional
            if (!applyParticles.full) applyParticles.full = (async () => { await loadFull(tsParticles); if (window.loadShadowEffect) await loadShadowEffect(tsParticles); })();
            await applyParticles.full;
        }
        catch (e) { console.warn('Particles failed to load', e); particleLoading = ''; return; }
        if (particleLoading !== want) return;
        particleLoading = '';
        if (!host) { host = document.createElement('div'); host.id = 'vq-particles'; host.className = 'vq-particles'; host.setAttribute('aria-hidden', 'true'); document.body.prepend(host); }
        host.hidden = false;
        try {
            particleBox = await tsParticles.load({ id: 'vq-particles', element: host, options: particleOptions(rc) });
            particleKey = want;
        } catch (e) { console.warn('Particles failed to start', e); host.hidden = true; }
    }
    function setParticles(recipe) {
        const rc = recipe ? cleanParticles(recipe) : null;
        uiPrefs.particles = rc;
        return rc;
    }
    function particlesFrom(text) {
        const t = String(text || '').toLowerCase().replace(/\b(the|a|an|some|particles?|effect|layer|please|add|show|turn on|give me)\b/g, ' ').replace(/\s+/g, ' ').trim();
        return PARTICLE_WORDS[t] || null;
    }

    // ---------- Moments: a few seconds of fireworks or confetti, then gone (MIT, bundled in lib/tsparticles) ----------
    // ---------- Moments: VQ takes the whole screen until you click ----------
    // The app fades nearly clear and stops catching taps; VQ composes layers from all his parts (sky, particles,
    // fireworks or confetti, a giant creature, vehicle or building, his face speaking a line); a click, tap or Esc
    // ends it and everything returns exactly as it was.
    const MOMENT_TEMPLATES = {
        celebrate: { burst: 'fireworks', particles: { preset: 'starlight', count: 70 }, face: { line: 'Well done!', expression: 'happy' } },
        fireworks: { burst: 'fireworks' },
        confetti: { burst: 'confetti' },
        'confetti-rain': { burst: 'confetti-rain' },
        'night show': { sky: 'night', burst: 'fireworks', hero: { name: 'castle', size: 0.62 }, particles: { preset: 'fireflies', count: 50 } },
        stardust: { sky: 'flock', particles: { preset: 'constellations', pointer: 'grab', count: 90 }, face: { line: 'Look how far we have come.' } },
        'giant': { hero: { name: 'whale', size: 0.75, motion: 'swim' }, particles: { preset: 'bubbles', count: 60 } },
        'face': { face: { line: 'Hello! It is good to see you.' } }
    };
    let moment = null;
    function cleanMoment(raw) {
        const r = raw && typeof raw === 'object' ? raw : {};
        const base = typeof r.template === 'string' && MOMENT_TEMPLATES[r.template] ? MOMENT_TEMPLATES[r.template] : {};
        const m = Object.assign({}, base, r);
        const o = { title: String(m.title || '').replace(/[<>]/g, '').slice(0, 60) };
        if (SKY_KEYS.includes(m.sky) && m.sky !== 'mist') o.sky = m.sky;
        if (m.particles) o.particles = cleanParticles(typeof m.particles === 'string' ? { preset: m.particles } : m.particles);
        if (['fireworks', 'confetti', 'confetti-rain'].includes(m.burst)) o.burst = m.burst;
        const heroes = (Array.isArray(m.heroes) ? m.heroes : m.hero ? [m.hero] : []).slice(0, 3);
        o.heroes = heroes.map(h => {
            const name = String((h && h.name) || h || '').toLowerCase().trim();
            const key = ANIMALS[name] ? name : Object.keys(ANIMAL_WORDS).find(k => new RegExp('^(' + ANIMAL_WORDS[k] + ')$', 'i').test(name));
            if (!key) return null;
            return { key, size: Math.min(1.4, Math.max(0.15, +h.size || 0.55)), motion: h.motion, x: Math.min(0.95, Math.max(0.05, h.x == null ? 0.5 : +h.x)), y: Math.min(0.98, Math.max(0.1, h.y == null ? 0.9 : +h.y)) };
        }).filter(Boolean);
        if (m.face) { const f = typeof m.face === 'object' ? m.face : {}; o.face = { line: String(f.line || '').replace(/[<>]/g, '').slice(0, 160), style: f.style === 'human' ? 'human' : 'robot', expression: String(f.expression || '').slice(0, 20) }; }
        if (!o.sky && !o.particles && !o.burst && !o.heroes.length && !o.face) o.burst = 'fireworks';
        return o;
    }
    function burstFrame(kind) {
        const acc = (getComputedStyle(document.documentElement).getPropertyValue('--ui-accent').trim() || '#ff8c42').replace(/[^#0-9a-fA-F]/g, '');
        const colors = JSON.stringify([acc, '#ffffff', '#ffd27a', '#7fd0ff', '#ff7ab6']);
        const lib = new URL('lib/tsparticles/', location.href).href;
        const run = kind === 'fireworks'
            ? `<script src="${lib}tsparticles.fireworks.bundle.min.js"><\/script><script>fireworks({colors:${colors},sounds:false,rate:{min:2,max:4},background:'transparent'});<\/script>`
            : kind === 'confetti-rain'
            ? `<script src="${lib}tsparticles.confetti.bundle.min.js"><\/script><script>const go=()=>confetti({count:40,angle:270,spread:180,startVelocity:6,gravity:0.55,drift:Math.random()-0.5,ticks:400,position:{x:8+Math.random()*84,y:-5},colors:${colors}});go();setInterval(go,500);<\/script>`
            : `<script src="${lib}tsparticles.confetti.bundle.min.js"><\/script><script>const go=()=>{confetti({count:80,angle:60,spread:60,startVelocity:55,position:{x:0,y:80},colors:${colors}});confetti({count:80,angle:120,spread:60,startVelocity:55,position:{x:100,y:80},colors:${colors}});};go();setInterval(go,2600);<\/script>`;
        const f = document.createElement('iframe');
        f.className = 'vq-moment'; f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
        f.srcdoc = `<!doctype html><html><head><style>html,body{margin:0;height:100%;background:transparent;overflow:hidden}</style></head><body>${run}</body></html>`;
        return f;
    }
    function startMoment(raw) {
        const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || uiPrefs.motion === 'reduced';
        if (calm) return { ok: false, reason: 'motion' };
        endMoment(true);
        const m = cleanMoment(raw);
        const saved = { scene: uiPrefs.scene, particles: uiPrefs.particles };
        const stage = el('div', 'vq-stage fs-iris'); stage.setAttribute('role', 'dialog'); stage.setAttribute('aria-label', 'VQ moment: click or press Escape to exit');
        const layers = el('div', 'vq-stage-layers');
        stage.appendChild(layers);
        // sky and particles: borrowed for the moment, put back afterwards
        if (m.sky) { uiPrefs.scene = m.sky; }
        if (m.particles) { uiPrefs.particles = m.particles; }
        if (m.sky || m.particles) applyScene();
        if (m.burst) layers.appendChild(burstFrame(m.burst));
        let eng = null;
        if (m.heroes.length && window.VQArt) {
            const host = el('div', 'vq-stage-heroes');
            layers.appendChild(host);
            setTimeout(() => {
                try {
                    eng = window.VQArt.create({ root: host });
                    const elems = m.heroes.map((h, i) => {
                        const base = Object.assign({}, ANIMALS[h.key]); delete base.size;
                        const mo = h.motion && motionFor(base.rig, h.motion);
                        const ent = ['building', 'landmark'].includes(base.rig) ? 'rise' : ['vehicle_air', 'bird', 'insect'].includes(base.rig) || base.motion === 'fly' ? 'fly-in' : ['fish', 'octopus'].includes(base.rig) ? 'grow' : (i % 2 ? 'walk-in-right' : 'walk-in-left');
                        return Object.assign(base, { enter: { kind: ent, duration: 1.6 }, id: 'hero' + i, area: 'full', sizeRelative: h.size, depth: 'near', positions: [[h.x, h.y]], count: 1, seed: 77 + i, motion: mo || base.motion,
                            night: ['night', 'seanight', 'storm'].includes(uiPrefs.scene) || undefined });
                    }).map(o => { Object.keys(o).forEach(k => o[k] === undefined && delete o[k]); return o; });
                    let r = eng.render({ elements: elems, style: 'soft', quality: innerWidth < 700 ? 'medium' : 'high', bloom: { strength: 0.3 } });
                    if (!r.ok) { elems.forEach(e => delete e.enter); r = eng.render({ elements: elems, quality: 'medium' }); }
                    if (!r.ok) console.warn('Moment hero:', r.error);
                } catch (e) { console.warn('Moment hero failed', e); }
            }, 60);
        }
        let face = null;
        if (m.face) {
            face = document.createElement('iframe');
            face.className = 'vq-stage-face'; face.src = FACE_SRC[m.face.style]; face.setAttribute('aria-hidden', 'true'); face.tabIndex = -1;
            face.addEventListener('load', () => {
                try { faceColour(face); } catch (e) { }
                setTimeout(() => { try { const api = face.contentWindow.VQFace; if (m.face.expression) api.setExpression && api.setExpression(m.face.expression); if (m.face.line) api.speakText(m.face.line); } catch (e) { } }, 400);
            });
            layers.appendChild(face);
        }
        if (m.title) stage.appendChild(el('div', 'vq-stage-title', m.title));
        const hint = el('div', 'vq-stage-hint', 'Click to exit');
        stage.appendChild(hint);
        // a text box even here: type (or later say) what to do next without leaving the moment
        const bar = document.createElement('form'); bar.className = 'gd-bar stage-bar'; bar.autocomplete = 'off';
        bar.className = 'gd-bar stage-bar vq-console';
        bar.innerHTML = '<div class="vc-log" role="log" aria-live="polite">Click outside to exit, or tell me what to do next.</div><label class="vc-prompt"><span aria-hidden="true">VQ&gt;</span><input type="text" maxlength="300" aria-label="Say or type what you want" placeholder="“more fireworks”, “exit”, or anything"><i class="vc-caret" aria-hidden="true"></i></label>';
        bar.addEventListener('click', e => e.stopPropagation());
        bar.addEventListener('submit', (e) => {
            e.preventDefault(); e.stopPropagation();
            const raw = bar.querySelector('input').value.trim(); if (!raw) return;
            const q = raw.toLowerCase().replace(/[.!?]+$/, '');
            bar.querySelector('input').value = '';
            if (/^(?:exit|close|stop|done|back|enough|that'?s enough|end)$/.test(q)) { endMoment(); return; }
            if (/^(?:more |again|another )?(fireworks|confetti|confetti rain)(?: again)?$/.test(q)) { const k = q.match(/fireworks|confetti rain|confetti/)[0].replace(' ', '-'); layers.appendChild(burstFrame(k)); bar.querySelector('.vc-log').textContent = 'More ' + k.replace('-', ' ') + '!'; return; }
            bar.querySelector('.vc-log').textContent = 'Asking VQ…'; fsAsk(raw, 'moment');
        });
        stage.appendChild(bar);
        document.body.appendChild(stage);
        document.body.classList.add('moment-on');
        void stage.offsetWidth; requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('in')));
        const exit = (ev) => { if (ev && ev.type === 'keydown' && ev.key !== 'Escape') return; endMoment(); };
        stage.addEventListener('click', exit);
        document.addEventListener('keydown', exit);
        moment = { stage, eng, saved, exit, m };
        return { ok: true, moment: m };
    }
    function endMoment(instant) {
        if (!moment) return;
        const { stage, eng, saved, exit, m } = moment; moment = null;
        document.removeEventListener('keydown', exit);
        document.body.classList.remove('moment-on');
        if (m.sky) uiPrefs.scene = saved.scene;
        if (m.particles) uiPrefs.particles = saved.particles;
        if (m.sky || m.particles) applyScene();
        stage.classList.remove('in');
        setTimeout(() => { try { eng && eng.dispose(); } catch (e) { } stage.remove(); }, instant ? 0 : 450);
    }
    // the short celebrations are now moments too: they stay until you click
    function celebrate(kind) { return startMoment(kind === 'celebrate' ? { template: 'celebrate' } : { burst: ['fireworks', 'confetti', 'confetti-rain'].includes(kind) ? kind : 'fireworks' }).ok; }
    // Uneven sun rays (crepuscular): random widths, gaps and strengths, so they never look like a pinwheel
    function buildRays(sc) {
        sc.querySelectorAll('.sun-rays').forEach((r, layer) => {
            let a = Math.random() * 20, stops = [];
            while (a < 360) {
                const gap = 4 + Math.random() * (layer ? 26 : 18);
                const w = 0.6 + Math.random() * (layer ? 6 : 3.5);
                const al = (layer ? 0.05 : 0.08) + Math.random() * (layer ? 0.08 : 0.14);
                stops.push(`transparent ${a.toFixed(1)}deg`, `rgba(255,${190 + Math.round(Math.random() * 40)},${120 + Math.round(Math.random() * 50)},${al.toFixed(3)}) ${(a + w / 2).toFixed(1)}deg`, `transparent ${(a + w).toFixed(1)}deg`);
                a += w + gap;
            }
            r.style.background = `conic-gradient(from ${Math.round(Math.random() * 360)}deg, ${stops.join(', ')})`;
        });
    }

    // Natural lightning: a jagged, branching bolt drawn fresh each time, lighting up the clouds near it.
    // Gentle by design: at most one strike every few seconds, a soft tinted glow, never a hard white flash.
    function boltPath(x, y, len, spread, depth, out) {
        let px = x, py = y, d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
        const steps = Math.max(4, Math.round(len / 16));
        for (let i = 1; i <= steps; i++) {
            px += (Math.random() - 0.5) * spread + (Math.random() - 0.5) * 6;
            py += len / steps * (0.7 + Math.random() * 0.6);
            d += ` L${px.toFixed(1)} ${py.toFixed(1)}`;
            if (depth < 2 && Math.random() < (depth ? 0.12 : 0.28)) boltPath(px, py, len * (0.25 + Math.random() * 0.35), spread * 0.8, depth + 1, out);
        }
        out.push({ d, depth });
        return out;
    }
    function scheduleLightning(sc) {
        stormTimer = setTimeout(() => {
            if (sc.dataset.scene !== 'storm' || document.hidden) { scheduleLightning(sc); return; }
            strike(sc);
            scheduleLightning(sc);
        }, 6000 + Math.random() * 9000);
    }
    function strike(sc) {
        const vw = window.innerWidth, vh = window.innerHeight;
        const x = vw * (0.12 + Math.random() * 0.76), top = vh * (0.04 + Math.random() * 0.1), len = vh * (0.35 + Math.random() * 0.3);
        const svg = sc.querySelector('.bolt');
        svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
        const paths = boltPath(x, top, len, 34, 0, []);
        svg.innerHTML = paths.map(p => `<path class="glow d${p.depth}" d="${p.d}"/><path class="core d${p.depth}" d="${p.d}"/>`).join('');
        sc.style.setProperty('--fx', `${(x / vw * 100).toFixed(1)}%`);
        sc.style.setProperty('--fy', `${(top / vh * 100 + 8).toFixed(1)}%`);
        // light the clouds by how close they are to the strike
        sc.querySelectorAll('.cloud').forEach(c => {
            const r = c.getBoundingClientRect();
            const dx = (r.left + r.width / 2 - x) / vw, dy = (r.top + r.height / 2 - top) / vh;
            const near = Math.max(0, 1 - Math.hypot(dx, dy) * 2.2);
            c.style.setProperty('--lit', (1 + near * 2.4).toFixed(2));
        });
        sc.classList.remove('strike'); void sc.offsetWidth; sc.classList.add('strike');
        setTimeout(() => sc.classList.remove('strike'), 1400);
    }

    function mistSurge() {
        const m = document.querySelector('.vq-mist');
        if (!m) return;
        m.classList.remove('vq-mist-surge');
        m.classList.add('vq-mist-settled');       // a wave never replays the arrival
        void m.offsetWidth;                       // restart the animation
        m.classList.add('vq-mist-surge');
        clearTimeout(mistSurge.t);
        mistSurge.t = setTimeout(() => m.classList.remove('vq-mist-surge'), 1700);
    }

    function applyUIPrefs() {
        const root = document.documentElement.style;
        root.setProperty('--ui-scale', String(uiPrefs.scale));
        root.setProperty('--ui-line', String(uiPrefs.line));
        const ct = customSpec(uiPrefs.theme);
        const [a1, a2] = (uiPrefs.accent === 'theme' && ct) ? [ct.accent, ct.accent2] : (ACCENTS[uiPrefs.accent] || ACCENTS.orange);
        root.setProperty('--accent-gradient', `linear-gradient(135deg, ${a1} 0%, ${a2} 100%)`);
        root.setProperty('--ui-accent', a1);
        root.setProperty('--ui-accent-2', a2);
        const hex = a1.replace('#', '');
        root.setProperty('--ui-accent-rgb', [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)).join(','));
        const hex2 = a2.replace('#', '');
        root.setProperty('--ui-accent2-rgb', [0, 2, 4].map(i => parseInt(hex2.slice(i, i + 2), 16)).join(','));
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
        b.toggle('no-glow', uiPrefs.glow === false);
        b.toggle('no-mist', uiPrefs.mist === false || (['clouds', 'sunset', 'storm', 'night', 'seaday', 'seanight', 'none'].includes(uiPrefs.scene) || !!LIVE_SKIES[uiPrefs.scene]));
        document.body.dataset.fx = ['low', 'medium', 'high'].includes(uiPrefs.fx) ? uiPrefs.fx : 'high';
        b.toggle('ground-screen', uiPrefs.ground !== 'box');
        if (typeof applyFaceBg === 'function') applyFaceBg();
        if (typeof faceColour === 'function') [facePanel, faceBg].forEach(f => f && faceColour(f));
        document.documentElement.style.setProperty('--face-bg-opacity', String({ low: 0.18, medium: 0.26, high: 0.34 }[uiPrefs.fx] || 0.34));
        if (typeof fitGround === 'function') { fitGround(); if (artFit) artFit(); }
        if (typeof applyArt === 'function' && customSpec(uiPrefs.theme)) applyArt(customSpec(uiPrefs.theme));
        if (document.getElementById('app-container') && noiseStrength) applyNoise();
        applyScene();
        applyTheme(THEMES.hasOwnProperty(uiPrefs.theme) || customSpec(uiPrefs.theme) ? uiPrefs.theme : 'vq');
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
                if (THEMES.hasOwnProperty(st.theme)) {
                    uiPrefs.theme = st.theme;
                    if (!ACCENTS[st.accent] && THEME_ACCENT[st.theme]) uiPrefs.accent = THEME_ACCENT[st.theme];
                }
                if (st.glow === 'on' || st.glow === 'off') uiPrefs.glow = st.glow === 'on';
                if (st.mist === 'on' || st.mist === 'off') { uiPrefs.mist = st.mist === 'on'; if (st.mist === 'on') uiPrefs.scene = 'mist'; }
                if (['low', 'medium', 'high'].includes(st.effects)) uiPrefs.fx = st.effects;
                if (['full', 'reduced', 'clear'].includes(st.text_static)) uiPrefs.textStatic = st.text_static;
                if (SKY_KEYS.includes(st.scene)) { uiPrefs.scene = st.scene; uiPrefs.mist = st.scene !== 'none'; }
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
            case 'create_theme': {
                act._installed = installTheme(act.theme || {});
                break;
            }
            case 'theme_edit': {
                act._edit = editTheme(act.edit || {});
                break;
            }
            case 'particles': {
                act._particles = act.state === 'off' ? setParticles(null) : setParticles(act.particles || (act.preset ? { preset: act.preset } : null));
                break;
            }
            case 'history': {
                uiUndo.pop();
                setTimeout(() => showHistory(), 400);
                act._hist = Object.values(store.chats || {}).filter(c => (c.messages || []).length).length;
                break;
            }
            case 'moment': {
                uiUndo.pop();
                act._moment = startMoment(act.moment_spec || { template: act.template }).ok;
                break;
            }
            case 'celebrate': {
                uiUndo.pop();   // nothing to undo: it's over in a few seconds
                act._moment = celebrate(['fireworks', 'confetti', 'confetti-rain'].includes(act.moment) ? act.moment : 'fireworks');
                break;
            }
            case 'creature': {
                act._draw = addCreature(act);
                if (!act._draw.ok) uiUndo.pop();
                break;
            }
            case 'draw': {
                act._draw = addDrawing(act);
                if (!act._draw.ok) uiUndo.pop();   // nothing changed, so nothing to undo
                break;
            }
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
                uiPrefs = Object.assign({}, UI_DEFAULTS, uiPrefs.customThemes ? { customThemes: uiPrefs.customThemes } : {});   // your saved themes survive a reset
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

    const PANEL_VIEWS = ['details', 'notes', 'customise', 'enquirer', 'cast', 'persona', 'face'];

    function setupPanelViews() {
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => setPanelView(tab.dataset.view, true));
        });
        setupPanelResize();
        setupSelectionNotes();
        setupOriaComposer();
        loadNotes();
        setPanelView(PANEL_VIEWS.includes(uiPrefs.panelView) && !['cast', 'persona'].includes(uiPrefs.panelView) ? uiPrefs.panelView : 'details', false);
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
        const cb = document.getElementById('cast-body');
        if (cb) cb.hidden = view !== 'cast';
        const pb = document.getElementById('persona-body');
        if (pb) pb.hidden = view !== 'persona';
        const fb = document.getElementById('face-body');
        if (fb) { fb.hidden = view !== 'face'; if (view === 'face') mountPanelFace(); else unmountPanelFace(); }
        const cu = document.getElementById('customise-body');
        if (cu) { cu.hidden = view !== 'customise'; if (view === 'customise') { if (!cu.firstChild) showCatalog(cu); else refreshCatalogState(cu.firstChild); } }
        document.body.classList.toggle('casting-view', view === 'cast' && document.body.classList.contains('casting'));
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
                const where = /YouTube/.test(st.label) ? 'YouTube' : /Books/.test(st.label) ? 'Google Books' : /news/i.test(st.label) ? 'the news'
                            : /papers/i.test(st.label) ? 'scholarly papers' : /Scripture/.test(st.label) ? 'the Bible' : 'the web';
                const unit = /YouTube/.test(st.label) ? 'videos' : /Books/.test(st.label) ? 'books' : /news/i.test(st.label) ? 'articles'
                           : /papers/i.test(st.label) ? 'papers' : /Scripture/.test(st.label) ? 'passage' : 'sources';
                add(`Searched ${where}${st.query ? ` for “${st.query}”` : ''} and found ${k} ${k === 1 ? unit.replace(/s$/, '') : unit}${pics}${secs}${st.filtered ? `, hiding ${st.filtered} that didn’t pass the content filter` : ''}.`);
            }
        });
        (meta.rules || []).filter(r => !/^Appreciation/.test(r)).forEach(r => {
            if (/^Big-question/.test(r)) add('Stated its anchor openly and named naturalism as a view, not the neutral default.');
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
                faceOria(data.text);
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
        theme: ['VQ', 'Classic', 'Navy', 'Charcoal', 'Midnight', 'Ocean', 'Forest', 'Ember', 'Slate', 'Plum'],
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
                    if (st.theme) {
                        used.add('theme'); used.add('accent');
                        const pair = !st.accent && THEME_ACCENT[st.theme] ? ` with its matching **${cap(THEME_ACCENT[st.theme])}** accent` : '';
                        lines.push(`Theme set to **${st.theme === 'vq' ? 'VQ' : cap(st.theme)}**${pair}. Other themes: ${others(CHOICES.theme, st.theme)}. You can still pick any accent, for example “teal accent”.`);
                    }
                    if (st.font) { used.add('font'); lines.push(`Font set to **${cap(st.font)}**. Other fonts: ${others(CHOICES.font, st.font)}.`); }
                    if (st.accent) { used.add('accent'); lines.push(`Accent colour set to **${cap(st.accent)}**. Other colours: ${others(CHOICES.accent, st.accent)}.`); }
                    if (st.title) { used.add('title'); lines.push(`Title style set to **${cap(st.title)}**. The others are ${others(CHOICES.title, st.title).replace(/, ([^,]*)$/, ' and $1')}.`); }
                    if (st.bubbles) { used.add('bubbles'); lines.push(st.bubbles === 'on' ? 'Answers now show **in chat bubbles**. Say “bubbles off” for the open page layout.' : 'Answers now use the **open page layout**. Say “bubbles on” to bring the bubbles back.'); }
                    if (st.text_static) lines.push({ clear: 'The chat text now sits **clear on top** of the static.', reduced: 'The static on the chat text is now **lighter** than on the background.',
                        full: 'The chat text now gets the **full** static.' }[st.text_static] + ' Say “text static clear”, “reduced” or “full” any time, free.');
                    if (st.effects) lines.push({ low: 'Effects turned down to **low**: a gentle hint of movement.', medium: 'Effects set to **medium**.',
                        high: 'Effects at **full strength**.' }[st.effects] + ' Say “effects low”, “medium” or “high” any time, free.');
                    if (st.scene) lines.push(({ mist: 'The **living mist** is back.', clouds: 'Clouds now drift slowly across your screen.',
                        sunset: 'A **sunset** glows in the corner, with clouds drifting past the sun.', night: 'Night falls: a **moon** with drifting clouds and faint stars.', seaday: 'A **seashore by day**: rolling waves, sun sparkling on the water and gulls drifting by.',
                        seanight: 'A **seashore at night**: dark waves with silver crests and the moon’s path across the water.', storm: 'A gentle **sci-fi storm** rolls in: rain, drifting thunderheads and the odd soft flash of lightning.',
                        none: 'The background is now **still**: no mist or sky effects.' }[st.scene] || (LIVE_SKIES[st.scene] ? `A live **${LIVE_SKIES[st.scene].label.toLowerCase()}** sky now moves behind everything.` : 'Sky changed.')) + ' Other skies: mist, clouds, sunset, night, seashore by day or night, storm, or none, plus live skies: ' + Object.values(LIVE_SKIES).map(v => v.label.toLowerCase()).join(', ') + '.');
                    if (st.mist) lines.push(st.mist === 'on' ? 'The warm **mist** is back, drifting through the VQ theme.' : 'The warm mist is **off**: a still, clean background. Say “mist on” to bring it back.');
                    if (st.glow) lines.push(st.glow === 'on' ? 'Icon glow is **on**. Each theme glows in its own colour.' : 'Icon glow is **off**: clean, flat icons. Say “glow on” to bring it back.');
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
                case 'theme_edit': {
                    const r = a._edit || {};
                    used.add('theme');
                    if (r.added) lines.push(r.full ? `There’s no room for **${r.added}**: a theme holds up to 8 scene elements and 4 effects. Remove something first.` : `Added **${r.added}** to **${r.name}**.`);
                    if (r.removed) lines.push(`Removed **${r.removed}**.`);
                    if (r.did) lines.push(r.did + '.');
                    if (r.resized) lines.push(r.resized.capped ? `The **${r.resized.name}** is now as ${r.resized.smaller ? 'small' : 'big'} as it can go.` : `Made the **${r.resized.name}** ${r.resized.smaller ? 'smaller' : 'bigger'}.`);
                    if (r.missing) lines.push(`**${r.missing}** isn’t available yet, so I couldn’t add or remove it.`);
                    if ((a.edit || {}).shade) lines.push(`Background made **${a.edit.shade}**.`);
                    if ((a.edit || {}).accent_hex) lines.push('Accent colour changed.');
                    lines.push('Add or remove one thing at a time, for example “add butterflies” or “remove the comet”.');
                    break;
                }
                case 'particles': {
                    const r = a._particles;
                    lines.push(r ? `New particle layer: **${r.name}**. Say “particles off” to clear it, or ask me to change anything about it: colour, amount, size, speed, direction, glow, twinkle or lines between them.`
                        : 'Particles off.');
                    break;
                }
                case 'history':
                    lines.push(a._hist ? `Here are your ${a._hist} chats. Pick one to see its details, or search them.` : 'You have no saved chats yet.');
                    break;
                case 'moment':
                    lines.push(a._moment ? '✨ (click anywhere to return)' : 'Moments are paused while reduced motion is on.');
                    break;
                case 'celebrate':
                    lines.push(a._moment ? '🎉' : 'Celebrations are paused while reduced motion is on.');
                    break;
                case 'creature':
                case 'draw': {
                    const r = a._draw || {};
                    used.add('theme');
                    if (r.ok) {
                        lines.push(r.creature ? `I put together **${r.name}**${r.count > 1 ? ` (${r.count} of them)` : ''} from my animal parts and added it to **${r.theme}**. Say “make the ${r.name} walk”, “graze” or “sit” to change what it does.`
                            : `I drew **${r.name}**${r.count > 1 ? ` (${r.count} of them)` : ''} and added it to **${r.theme}**. It’s my own design, so it may look a little hand-made.`);
                        lines.push('Tap **✥ Arrange** under the message box (or say “arrange”) to drag it where you like, or drop it on the bin to remove it.');
                    } else if (r.full) lines.push(`There’s no room for **${r.name}**: a theme holds up to 8 scene elements. Remove something first.`);
                    else lines.push(`I tried to draw **${r.name || 'that'}**, but ${r.error || 'it didn’t work'}. Try describing it a little more simply.`);
                    break;
                }
                case 'create_theme': {
                    const r = a._installed || {};
                    const sp = r.spec || {};
                    used.add('theme'); used.add('accent');
                    const fxNames = { trees: 'swaying trees', grass: 'swaying grass', mountains: 'mountains', stars: 'twinkling stars', comet: 'a passing comet', planet: 'a ringed planet', aurora: 'an aurora', fireflies: 'fireflies', snow: 'falling snow', leaves: 'falling leaves', static: 'TV static', crt: 'an old-TV screen', tvset: 'a wooden TV set with working knobs' };
                    const tkNames = { mist: 'drifting mist', clouds: 'cloud banks', storm: 'a storm', stars: 'a star field', constellations: 'constellations', galaxy: 'a spiral galaxy',
                        nebula: 'a nebula', aurora: 'aurora curtains', waves: 'flowing waves', seashore: 'surf', matrix: 'falling code', orbits: 'orbital rings', vortex: 'a light vortex',
                        tunnel: 'a geometric tunnel', grid: 'a perspective grid', circuit: 'circuit traces', comets: 'comets', ripples: 'water ripples', grain: 'film grain' };
                    const fxText = (sp.effects || []).map(f => fxNames[f]).concat((sp.layers || []).map(l => tkNames[l.type])).concat(sp.particles ? [`a particle layer, **${sp.particles.name}**`] : []).filter(Boolean);
                    lines.push(`New theme **${sp.name || 'made for you'}** created${sp.scene && sp.scene !== 'none' ? `, with a matching **${sp.scene === 'seaday' ? 'seashore' : sp.scene === 'seanight' ? 'night seashore' : sp.scene}** sky` : ''}` +
                        (fxText.length ? `, and ${fxText.length > 1 ? fxText.slice(0, -1).join(', ') + ' and ' + fxText.slice(-1) : fxText[0]}` : '') + '.' +
                        (r.fixes && r.fixes.length ? ` For readability I ${r.fixes.join(', ')}.` : ''));

                    break;
                }
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
        const noUndo = (acts || []).every(a => a && (['undo', 'new_chat', 'show_reasoning'].includes(a.action) || (a.action === 'draw' && !(a._draw || {}).ok)));
        return lines.join('\n\n') + (tip ? `\n\n*Tip: ${tip}*` : '') + (noUndo ? '' : '\n\nSay “undo” if you’d like it back.');
    }

    async function sendMessage() {
        const rawMessage = elements.messageInput.value.trim();
        if (!rawMessage || isTyping) return;

        // Simple display commands run on this device: instant, free, and they work even after the daily limit
        const tourAsk = /^\s*(customi[sz](e|ation)( tour)?|personali[sz]e( tour)?|style tour|how (do|can) i change the look\??)\s*$/i.test(rawMessage) ? 'custom'
            : /^\s*(feature tour|usage tour|how (do i|to) use (this|vq chat|the app)\??|show me (the )?features|tour( the)? (app|features)|what can (this app|vq chat) do\??)\s*$/i.test(rawMessage) ? 'use' : null;
        // VQ's body: "show vq", "vq in the panel", "vq in the header", "let vq walk around", "hide vq"
        // Commands are plain sentences: polite wrappers are ignored, so "could you please show my chats for me" works like "show my chats"
        const pm = rawMessage.toLowerCase().trim().replace(/[.!?]+$/, '')
            .replace(/^(?:(?:hey|hi|ok|okay)\s+)?(?:vq[,:]?\s+)?(?:(?:please|pls|could you|can you|would you|will you|kindly|go ahead and|i want to|i'd like to|i would like to|let me|i wanna)\s+)*/, '')
            .replace(/(?:\s+(?:please|pls|for me|now|thanks|thank you|vq))+$/, '').trim();
        const personaAsk = /^(hide|remove|close|turn off) (vq|vq'?s body|the robot|your body)$|^(vq|robot) off$/.test(pm) ? 'off'
            : /^(?:show|put|move)? ?(?:vq|the robot|your body|yourself)? ?(?:in|into|to) (?:the )?header$|^(?:vq|robot) (?:badge|in the header)$/.test(pm) ? 'badge'
            : /^(?:put )?(?:vq|the robot)? ?on (?:the )?moon$|^(?:vq|robot) moon$|^(?:vq )?go fishing$|^let (?:vq|the robot) fish$/.test(pm) ? 'moon'
            : /^(?:let (?:vq|the robot) fly(?: around)?|(?:vq|robot) fly(?:ing)?(?: around)?|fly around)$/.test(pm) ? 'fly'
            : /^(?:let (?:vq|the robot) walk(?: around)?|(?:vq|robot) walk(?:ing)?(?: around)?|walk around|(?:vq|robot) roam(?:ing)?|let (?:vq|the robot) roam)$/.test(pm) ? 'roam'
            : /^(?:show|bring out|summon) (?:vq|the robot|your body|yourself)$|^(?:vq|robot) (?:in|into) (?:the )?panel$|^(?:vq|robot) on$|^show me vq$/.test(pm) ? 'panel' : null;
        if (personaAsk) {
            elements.messageInput.value = '';
            if (personaAsk === 'off') { stopPersona(); uiPrefs.persona = 'off'; saveUIPrefs(); showLocalNote('VQ’s body is hidden'); return; }
            if (startPersona(personaAsk)) { uiPrefs.persona = personaAsk; saveUIPrefs(); showLocalNote({ panel: 'VQ is here, in the side panel', badge: 'VQ is in the header', roam: 'VQ is walking along the bottom of the screen', moon: 'VQ is on the moon, fishing', fly: 'VQ is flying around (he keeps clear of what you’re reading)' }[personaAsk]); }
            return;
        }
        // Creatures together, free: "the dog chases the cat", "the sheep flee from the wolf", "the duck follows the cow",
        // "let the dog and cat play", "the sheep herd together", "the cat chases my pointer", "the dog stops chasing"
        const soc = (() => {
            const N = '(?:the |my |a )?([a-z][a-z \'\\-]{1,28}?)';
            let m;
            if ((m = pm.match(new RegExp(`^(?:make |let |have )?${N} (?:stops?|quit|quits) (?:chasing|following|fleeing|running away|playing|herding)(?: .*)?$`)))) return { who: m[1], kind: 'stop' };
            if ((m = pm.match(new RegExp(`^(?:make |let |have )?${N} (?:chases?|chasing|hunts?|hunting|goes? after|runs? after) (?:after )?(?:the |my )?(pointer|mouse|cursor|me)$`)))) return { who: m[1], kind: 'pointer-chase' };
            if ((m = pm.match(new RegExp(`^(?:make |let |have )?${N} (?:runs? away|flees?|hides?|shies away|is scared) (?:from )?(?:the |my )?(pointer|mouse|cursor|me)$`)))) return { who: m[1], kind: 'pointer-flee' };
            if ((m = pm.match(new RegExp(`^(?:make |let |have )?${N} (chases?|chasing|hunts?|hunting|goes? after|runs? after) ${N}$`)))) return { who: m[1], kind: 'chase', target: m[3], style: /hunt/.test(m[2]) ? 'hunt' : 'playful' };
            if ((m = pm.match(new RegExp(`^(?:make |let |have )?${N} (?:runs? away from|flees?(?: from)?|hides? from|is scared of|is afraid of|avoids?) ${N}$`)))) return { who: m[1], kind: 'flee', target: m[2] };
            if ((m = pm.match(new RegExp(`^(?:make |let |have )?${N} (?:follows?|goes? behind|walks? behind|tags? along (?:with|behind)) ${N}$`)))) return { who: m[1], kind: 'follow', target: m[2] };
            if ((m = pm.match(new RegExp(`^(?:make |let |have )?${N} (?:and|&) ${N} play(?: together| with each other)?$`)))) return { who: m[1], kind: 'play', target: m[2], both: true };
            if ((m = pm.match(new RegExp(`^(?:make |let |have )?${N} plays? with ${N}$`)))) return { who: m[1], kind: 'play', target: m[2], both: true };
            if ((m = pm.match(new RegExp(`^(?:make |let |have )?${N} (?:herd|flock|stay|stick|group|move) together$|^herd ${N}(?: together)?$`)))) return { who: m[1] || m[2], kind: 'herd' };
            return null;
        })();
        if (soc) {
            const sp = currentThemeSpec();
            const note = socialEdit(sp, soc);
            if (note) {
                elements.messageInput.value = '';
                uiUndo.push(snapshotUI());
                installTheme(sp); saveUIPrefs(); applyUIPrefs();
                showLocalNote(note);
                return;
            }
        }
        // VQ's character face: in the panel, as a background, robot or human style
        const faceAsk = /^(?:show |open )?(?:vq'?s |your |the )?(?:character )?face(?: in the panel| panel)?$|^(?:show|open) (?:the )?face (?:tab|view)$/.test(pm) ? 'panel'
            : /^(?:(?:vq'?s |your |the )?face (?:as )?(?:the )?(?:background|backdrop|wallpaper)|(?:use |put |set )?(?:vq'?s |your |the )?face (?:as|in) (?:the )?background|face background(?: on)?)$/.test(pm) ? 'bg-on'
            : /^(?:face background off|(?:remove|hide|turn off) (?:the )?face background|no face background)$/.test(pm) ? 'bg-off'
            : /^(?:robot face|vq robot face|face robot|robot style face)$/.test(pm) ? 'robot'
            : /^(?:human face|face human|human style face|the human face)$/.test(pm) ? 'human' : null;
        if (faceAsk) {
            elements.messageInput.value = '';
            if (faceAsk === 'panel') { openPanel(true); setPanelView('face', true); showLocalNote('VQ’s face is in the side panel'); return; }
            uiUndo.push(snapshotUI());
            if (faceAsk === 'bg-on') uiPrefs.faceBg = true;
            if (faceAsk === 'bg-off') uiPrefs.faceBg = false;
            if (faceAsk === 'robot' || faceAsk === 'human') uiPrefs.faceStyle = faceAsk;
            saveUIPrefs(); applyUIPrefs();
            if (uiPrefs.panelView === 'face') { unmountPanelFace(); mountPanelFace(); }
            showLocalNote({ 'bg-on': 'VQ’s face is now in the background', 'bg-off': 'Face background off', robot: 'Face style: VQ’s robot (O.R.I.A. appears when she speaks)', human: 'Face style: human' }[faceAsk]);
            return;
        }
        // Where the ground is: the bottom of the screen, or just above the message box
        const groundAsk = /^(?:(?:move |put |set )?(?:the )?(?:ground|scene|elements|everything|plants|animals)(?: level)? (?:down )?(?:to|at|on) (?:the )?(?:screen|bottom|screen bottom|bottom of the screen|screen level)|move (?:the )?(?:scene|everything|elements) down|lower the ground|ground at (?:the )?(?:bottom|screen))$/.test(pm) ? 'screen'
            : /^(?:(?:move |put |set )?(?:the )?(?:ground|scene|elements|everything|plants|animals)(?: level)? (?:up )?(?:above|over) (?:the )?(?:message|text|chat|input|typing) ?(?:box|area|bar)?|raise the ground|move (?:the )?(?:scene|everything|elements) up|ground above (?:the )?(?:message|text|chat) ?box)$/.test(pm) ? 'box' : null;
        if (groundAsk) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI());
            uiPrefs.ground = groundAsk; saveUIPrefs(); applyUIPrefs();
            showLocalNote(groundAsk === 'screen' ? 'The ground is now the bottom of the screen' : 'The ground is now just above the message box');
            return;
        }
        // Live sky colours: your accent, or each effect's own original colours
        const skyColAsk = /^(?:(?:live )?sky colou?rs? (?:original|default|normal)|(?:original|default) (?:live )?sky colou?rs?|live skies? (?:in )?(?:original|default) colou?rs?)$/.test(pm) ? 'original'
            : /^(?:(?:live )?sky colou?rs? (?:accent|my accent|theme)|accent (?:live )?sky colou?rs?|live skies? (?:in )?(?:my )?accent colou?rs?)$/.test(pm) ? 'accent' : null;
        if (skyColAsk) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI());
            uiPrefs.skyColours = skyColAsk; saveUIPrefs(); applyUIPrefs();
            showLocalNote(skyColAsk === 'original' ? 'Live skies now use their original colours' : 'Live skies now follow your accent colour');
            return;
        }
        // The spoken-style guide: "help", "what can you do", "what's new"
        if (/^(?:help|guide|tips|commands|what can (?:you|i) do|what can i (?:say|type|ask)|how do i use (?:this|the app|vq)|how does this work|show me (?:the )?(?:help|guide|tips))$/.test(pm)) { elements.messageInput.value = ''; showGuide(false); return; }
        if (/^(?:what'?s new|whats new|what is new|new features|show (?:me )?(?:the )?new features|anything new)$/.test(pm)) { elements.messageInput.value = ''; showGuide(true); return; }
        // Search cards, full screen (synced with this chat)
        if (/^(?:(?:show|open|put|make|view|see)(?: me)? )?(?:the |these |those |my |all )?(?:results?|cards?|search results?|news|films?|movies|books|papers|videos|it|them|this|that)? ?(?:in |on |to )?(?:full ?screen|big screen|the big screen|large|big)(?: mode)?$|^(?:results|cards) stage$/.test(pm) && pm.length > 2) {
            elements.messageInput.value = ''; showResultsStage(); return;
        }
        if (/^(?:always )?(?:open|show) (?:search )?(?:results|cards) (?:in )?full ?screen(?: automatically)?$|^auto(?:matic)? full ?screen(?: results)? on$/.test(pm)) { elements.messageInput.value = ''; uiPrefs.autoStage = true; saveUIPrefs(); showLocalNote('New search cards will open full screen'); return; }
        if (/^(?:stop|don'?t|do not) (?:auto(?:matically )?)?(?:opening|open|showing|show) (?:search )?(?:results|cards) (?:in )?full ?screen$|^auto(?:matic)? full ?screen(?: results)? off$/.test(pm)) { elements.messageInput.value = ''; uiPrefs.autoStage = false; saveUIPrefs(); showLocalNote('Search cards stay in the chat'); return; }
        // Your chats, presented full screen
        if (/^(?:(?:show|open|see|list|view)(?: me)? (?:my |all my |all |the )?(?:recent |past |previous |old |saved )?(?:chats|conversations|chat history|history)|(?:my )?(?:recent |past |previous )?(?:chats|conversations)|chat history|history)$/.test(pm)) {
            elements.messageInput.value = '';
            showHistory();
            return;
        }
        // Quick settings, free and instant
        const QUICK_SET = { 'effects high': ['fx', 'high'], 'effects medium': ['fx', 'medium'], 'effects low': ['fx', 'low'], 'normal motion': ['motion', 'normal'], 'reduce motion': ['motion', 'reduced'],
            'glow on': ['glow', true], 'glow off': ['glow', false], 'text static clear': ['textStatic', 'clear'], 'text static reduced': ['textStatic', 'reduced'], 'text static full': ['textStatic', 'full'] };
        const pq = pm.replace(/^(?:make|set|turn|switch|put)\s+(?:the\s+|my\s+)?/, '').replace(/\s+(?:to|on to)\s+/, ' ').replace(/^(?:effects?|animations?) (?:down|lower)$/, 'effects low').replace(/^(?:effects?|animations?) (?:up|higher|full)$/, 'effects high')
            .replace(/^(?:less|fewer|lower|calm(?:er)?) (?:effects?|animations?)$/, 'effects low').replace(/^(?:less|reduced?|calm(?:er)?) motion$|^stop (?:the )?animations?$/, 'reduce motion').replace(/^effect /, 'effects ').replace(/^(?:the )?/, '');
        const qk = QUICK_SET[pm] ? pm : QUICK_SET[pq] ? pq : null;
        if (qk) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI());
            const [k, v] = QUICK_SET[qk]; uiPrefs[k] = v; saveUIPrefs(); applyUIPrefs();
            showLocalNote({ fx: `Effects: ${v}`, motion: v === 'reduced' ? 'Motion reduced' : 'Normal motion', glow: v ? 'Icon glow on' : 'Icon glow off', textStatic: `Static on text: ${v}` }[k]);
            return;
        }
        // Particles: VQ's built-in particle designs by name, free; "particles off" clears them
        if (/^(?:particles? off|no particles|remove (?:the )?particles|clear (?:the )?particles|stop (?:the )?particles|turn off (?:the )?particles)$/.test(pm)) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI()); setParticles(null); saveUIPrefs(); applyUIPrefs();
            showLocalNote('Particles off'); return;
        }
        const partAsk = /^(?:(?:add|show|use|turn on|give me|switch to|set)\s+)?(?:the\s+|some\s+)?(.{3,30}?)\s+particles?$|^particles?[:\s]+(.{3,30})$/.exec(pm);
        const partName = partAsk && particlesFrom(partAsk[1] || partAsk[2]);
        if (partName) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI()); setParticles({ preset: partName }); saveUIPrefs(); applyUIPrefs();
            showLocalNote(`Particles: ${PARTICLE_BUILTINS[partName].label}`); return;
        }
        // Moments: a few seconds of fireworks or confetti
        const tplAsk = /^(?:(?:show me |start |play )?(?:a |the )?(night show|stardust|giant|face) moment|moment[:\s]+(.+))$/.exec(pm);
        if (tplAsk) {
            const k = (tplAsk[1] || tplAsk[2] || '').trim();
            elements.messageInput.value = '';
            const r = MOMENT_TEMPLATES[k] ? startMoment({ template: k }) : startMoment({ hero: { name: k, size: 0.7 } });
            if (!r.ok) showLocalNote('Moments are paused while reduced motion is on');
            return;
        }
        const momentAsk = /^(?:celebrate|let'?s celebrate|fireworks|set off (?:some )?fireworks|launch (?:some )?fireworks|show (?:me )?fireworks|party time)$/.test(pm) ? 'fireworks'
            : /^(?:confetti|throw (?:some )?confetti|confetti (?:burst|cannon|pop))$/.test(pm) ? 'confetti'
            : /^(?:confetti rain|rain(?:ing)? confetti|confetti shower|falling confetti)$/.test(pm) ? 'confetti-rain' : null;
        if (momentAsk) {
            elements.messageInput.value = '';
            if (!celebrate(momentAsk === 'fireworks' && /celebrat|party/.test(pm) ? 'celebrate' : momentAsk)) showLocalNote('Celebrations are paused while reduced motion is on');
            return;
        }
        // Arrange the scene: drag things around, drop them on the bin to remove them
        if (/^(?:arrange|rearrange|arrange mode|edit (?:the )?scene|move things(?: around)?|(?:arrange|rearrange|move) (?:the )?(?:scene|elements|things|flowers|drawings|plants)(?: around)?)$/.test(pm)) {
            elements.messageInput.value = '';
            if (setArrange(true)) showLocalNote('Arrange mode: drag anything to move it, drop it on the bin to remove it, and tap Done when you’re finished');
            return;
        }
        if (/^(?:done|done arranging|stop arranging|finish arranging)$/.test(pm) && arranging) {
            elements.messageInput.value = ''; setArrange(false); showLocalNote('Arrangement saved'); return;
        }
        // The complete list of customisations, on request
        if (/^\s*(?:please\s+)?(?:(?:show|list|give)(?: me)?(?: a| the)?(?: full| complete)?(?: list of)? (?:all )?(?:the |your )?(?:customi[sz]ations?|customi[sz]ation options|options|settings|visual effects|effects|themes and effects|things i can change)|what can (?:i|you) (?:change|customi[sz]e)(?: on screen)?|what (?:visual )?effects (?:are there|do you have|can you (?:add|do))|customi[sz]ation list|all customi[sz]ations)\s*\??\s*$/i.test(rawMessage)) {
            elements.messageInput.value = '';
            showCatalog();
            return;
        }
        const skyAsk = /^\s*(?:please\s+)?(?:set |use |show |turn on |make it |switch to |change to |give me )?(?:the |a |an )?([a-z0-9 \-]{3,24}?)(?: sky| effect| scene| background)?\s*(?:please)?[.!]?\s*$/i.exec(rawMessage);
        const skyName = skyAsk && skyFrom(skyAsk[1] + (/\bsky\b/i.test(rawMessage) && /night/i.test(skyAsk[1]) ? ' sky' : ''));
        if (skyName) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI());
            setSky(skyName); saveUIPrefs(); applyUIPrefs();
            showLocalNote(`Sky set to ${SKY_LABEL[skyName]}`);
            return;
        }
        // Built-in themes by name ("ocean theme", "forest"), free and instant: never redesigned
        const builtIn = rawMessage.match(/^\s*(?:please\s+)?(?:use |switch to |set |change to |go back to |back to )?(?:the |my )?(vq|classic|navy|charcoal|midnight|ocean|forest|ember|slate|plum|default|original)(?: theme)?\s*(?:please)?[.!]?\s*$/i);
        if (builtIn) {
            const name = { default: 'vq', original: 'vq' }[builtIn[1].toLowerCase()] || builtIn[1].toLowerCase();
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI());
            uiPrefs.theme = name; uiPrefs.accent = THEME_ACCENT[name] || 'orange';
            saveUIPrefs(); applyUIPrefs();
            showLocalNote(`Theme set to ${name === 'vq' ? 'VQ' : cap(name)}`);
            return;
        }
        // "add …" / "remove …": one element at a time, free and instant when the element is known
        const addM = rawMessage.match(/^\s*(?:please\s+)?(?:add|put|include|bring in|give me|draw|paint|sketch)\s+(?:some\s+|a few\s+|a\s+|an\s+|more\s+)?(.{2,40}?)\s*(?:to (?:the |my )?(?:theme|screen|background|scene))?\s*[.!]?\s*$/i);
        const remM = rawMessage.match(/^\s*(?:please\s+)?(?:remove|delete|hide|take away|get rid of|no more)\s+(?:the\s+|all\s+(?:the\s+)?|my\s+)?(.{2,40}?)\s*[.!]?\s*$/i);
        const drawnArt = (customSpec(uiPrefs.theme) || {}).art || [];
        // "make the tiger walk" / "let the giraffe graze" / "the lion should sit": how an animal moves, free
        const moveM = pm.match(/^(?:make |let |have )?(?:the |my )?(.{2,30}?) (?:should |can )?(walk|walk around|roam|wander|graze|eat|sit|sit down|stand|stand still|stop|stop moving|idle|rest|run|run around|race around|play|play around|swim|swim around|fly|fly around|hop|hop around|crawl|crawl around|slither|perch)(?: please)?$/);
        const moveIdx = moveM ? drawnArt.findIndex(e => e.type === 'assembly' && findDrawing([e], moveM[1]) === 0) : -1;
        if (moveM && moveIdx >= 0) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI());
            const sp = currentThemeSpec(), d = sp.art[moveIdx];
            const mo = motionFor(d.rig, moveM[2]);
            if (!mo) { uiUndo.pop(); showLocalNote(`A ${d.name} can't do that; it can ${(RIG_MOTIONS[d.rig] || []).join(', ')}`); return; }
            d.motion = mo;
            if (/stop/.test(moveM[2])) delete d.social;
            installTheme(sp); saveUIPrefs(); applyUIPrefs();
            showLocalNote(`The ${d.name} is ${{ walk: 'walking around', graze: 'grazing', sit: 'sitting', idle: 'resting', run: 'running', play: 'playing', swim: 'swimming', fly: 'flying', hop: 'hopping', crawl: 'crawling', slither: 'slithering', perch: 'perched' }[mo]}`);
            return;
        }
        // Resize anything in the scene, free: "make the tiger huge", "bigger roses", "increase the size of the balloon",
        // "make the plane 150%", "double the giraffe", "make it smaller" (the last thing added or changed)
        const SZ = '(much bigger|much larger|a lot bigger|way bigger|a bit bigger|a little bigger|slightly bigger|bit bigger|a bit larger|a little larger|bigger|larger|fill the scene|fill the screen|as big as the screen|full screen|half the scene|half the screen|a quarter of the scene|much smaller|a lot smaller|way smaller|a bit smaller|a little smaller|slightly smaller|bit smaller|smaller|tiny|very small|small|medium|normal size|normal|regular|original size|default size|large|huge|giant|enormous|massive|very big|very large|as big as possible|maximum|double the size|double size|twice as big|twice the size|half the size|half size|half as big|triple size|three times as big|\\d{2,3} ?%)';
        const rz = pm.match(new RegExp(`^(?:make|turn|set|resize|scale|can you make|please make)? ?(?:the |my |all the |those |these )?(.{1,30}?) (?:size )?(?:to |into |at )?${SZ}(?: please)?$`))
            || pm.match(new RegExp(`^(?:make |turn )?${SZ} (?:the |my )?(.{2,30})$`))
            || pm.match(/^(increase|enlarge|grow|scale up|enlarge the size of|increase the size of|decrease|reduce|shrink|scale down|decrease the size of|reduce the size of) (?:the |my )?(.{1,30}?)(?: a bit| a little| a lot| much)?$/);
        if (rz) {
            let words, how;
            if (/^(increase|enlarge|grow|scale up|decrease|reduce|shrink|scale down)/.test(rz[1])) { words = rz[2]; how = /increase|enlarge|grow|up/.test(rz[1]) ? (/ a lot| much$/.test(pm) ? 'much bigger' : / a bit| a little$/.test(pm) ? 'a bit bigger' : 'bigger') : (/ a lot| much$/.test(pm) ? 'much smaller' : / a bit| a little$/.test(pm) ? 'a bit smaller' : 'smaller'); }
            else if (sizeChange(rz[1]) && !sizeChange(rz[2])) { how = rz[1]; words = rz[2]; }
            else { words = rz[1]; how = rz[2]; }
            const sp0 = currentThemeSpec();
            const textOnly = /^(text|the text|font|letters|words|writing|everything|the screen|chat)$/.test(String(words).trim());
            if (!textOnly && findArtTarget(sp0.art || [], words) >= 0 && sizeChange(how)) {
                elements.messageInput.value = '';
                uiUndo.push(snapshotUI());
                const r = resizeArt(sp0, words, how);
                installTheme(sp0); saveUIPrefs(); applyUIPrefs();
                showLocalNote(r.capped ? `The ${r.name} is as ${r.smaller ? 'small' : 'big'} as it can go for now` : `Made the ${r.name} ${r.smaller ? 'smaller' : 'bigger'}`);
                return;
            }
        }
        if ((addM && (parseItem(addM[1]) || skyFrom(addM[1]))) || (remM && (parseItem(remM[1]) || findDrawing(drawnArt, remM[1]) >= 0 || /\b(storm|rain|sunset|night|moon|seashore|beach|sea|clouds|mist)\b/i.test(remM[1])))) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI());
            const r = editTheme(addM ? { add: addM[1] } : { remove: remM[1] });
            saveUIPrefs(); applyUIPrefs();
            showLocalNote(r.full ? 'No room: a theme holds up to 8 scene elements and 4 effects' : r.added ? `Added ${r.added}` : r.removed ? `Removed ${r.removed}` : `Couldn’t find ${r.missing} on screen`);
            return;
        }
        // How much TV static falls on the chat text, free and instant
        const tsAsk = (() => {
            const m = rawMessage.toLowerCase().trim().replace(/[.!?]+$/, '');
            if (/^(text static|static on (the )?text) (clear|off|none)$|^clear text$|^(no|remove) static on (the )?text$|^text (on top|above( the)? static)$/.test(m)) return 'clear';
            if (/^(text static|static on (the )?text) (reduced|low|less|lower|light)$|^less static on (the )?text$/.test(m)) return 'reduced';
            if (/^(text static|static on (the )?text) (full|high|normal|on)$/.test(m)) return 'full';
            return null;
        })();
        if (tsAsk) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI());
            uiPrefs.textStatic = tsAsk; saveUIPrefs(); applyUIPrefs(); applyNoise();
            showLocalNote({ clear: 'Chat text now sits clear on top of the static', reduced: 'Lighter static on the chat text', full: 'Full static on the chat text' }[tsAsk]);
            return;
        }
        // Effects strength, free and instant
        const fxAsk = (() => {
            const m = rawMessage.toLowerCase().trim().replace(/[.!?]+$/, '');
            if (/^(effects?|animations?|movement|background effects?) (low|subtle|gentle|minimal)$|^(less|fewer|softer|calmer) (effects?|animation|movement)$|^tone (it |the effects? |them )?down$/.test(m)) return 'low';
            if (/^(effects?|animations?|movement|background effects?) (medium|normal|middle)$/.test(m)) return 'medium';
            if (/^(effects?|animations?|movement|background effects?) (high|full|strong|max)$|^(more|stronger) (effects?|animation|movement)$/.test(m)) return 'high';
            return null;
        })();
        if (fxAsk) {
            elements.messageInput.value = '';
            uiUndo.push(snapshotUI());
            uiPrefs.fx = fxAsk; saveUIPrefs(); applyUIPrefs();
            showLocalNote(`Effects set to ${fxAsk === 'high' ? 'full strength' : fxAsk}`);
            return;
        }
        if (/^\s*(stop (casting|showing)|close (the )?(video|player|pictures)|stop the video)\s*$/i.test(rawMessage) && document.body.classList.contains('casting')) {
            elements.messageInput.value = '';
            stopCasting();
            showLocalNote('Stopped showing in the panel');
            return;
        }
        if (tourAsk) {
            elements.messageInput.value = '';
            offerTours(tourAsk);
            return;
        }
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
                artSignal('speak');
                bubble = createStreamingBubble();
                livePortraits('speaking');
            }
            fillRich(bubble.content, full);
            personaStream(bubble.content.innerText || full);
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
            // A reply that arrived all at once never got a paint frame: give VQ's body and face the complete text now
            if (full && typeof personaSaid === 'number' && personaSaid === 0) personaStream(full);
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
        artSignal('think');
        personaThinking(message);
        livePortraits('thinking');
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
                if (/\b(what (else )?can (you|i|vq) (change|do|customi[sz]e)|list (of |all )?(the |your )?features|what features|show me (all )?(your )?features|how (do|can) i (customi[sz]e|change the look))\b/i.test(message || '')) {
                    const tb = tourButtons(/change|customi/i.test(message) ? 'custom' : 'use');
                    tb.classList.add('ft-choice-inline');
                    (div.querySelector('.message-body') || div).insertBefore(tb, div.querySelector('.message-actions'));
                }
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
            artSignal('idle');
            personaDone();
            personaGuardSoon();
            setTimeout(() => livePortraits('idle'), 400);
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
