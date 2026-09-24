/**
 * VQ Chat Widget - Floating Chat Interface
 * Veritas Quaesitor (veritasquaesitorcai.github.io)
 * 
 * Usage: <script src="vq-chat-widget.js"></script>
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        apiEndpoint: 'https://veritas-quaesitor-production.up.railway.app/chat',
        welcomeMessage: `Hey! 👋 I'm VQ.

Ask me about the evidence, CAI, or whatever's on your mind. Where do we start?`
    };

    // Styles
    const styles = `
        #vq-chat-widget * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        #vq-chat-bubble {
            position: fixed;
            top: 100px;
            right: 30px;
            height: 52px;
            padding: 0 20px 0 14px;
            background: radial-gradient(120% 120% at 30% 0%, rgba(118,75,162,0.55), transparent 60%), #140f30;
            border: 1.5px solid rgba(255, 140, 66, 0.7);
            border-radius: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 1.45rem;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), 0 0 18px rgba(255, 140, 66, 0.25);
            animation: vq-pulse 2.2s ease-out 1s 2;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            z-index: 9998;
            font-weight: 700;
            color: #fff;
            letter-spacing: 0.02em;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        #vq-chat-bubble:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 36px rgba(0, 0, 0, 0.5), 0 0 26px rgba(255, 140, 66, 0.45);
        }

        #vq-chat-bubble:focus-visible { outline: 3px solid #ffd9a8; outline-offset: 3px; }

        @keyframes vq-pulse {
            0% { box-shadow: 0 10px 30px rgba(0,0,0,0.45), 0 0 0 0 rgba(255,140,66,0.55); }
            70% { box-shadow: 0 10px 30px rgba(0,0,0,0.45), 0 0 0 16px rgba(255,140,66,0); }
            100% { box-shadow: 0 10px 30px rgba(0,0,0,0.45), 0 0 18px rgba(255,140,66,0.25); }
        }

        #vq-chat-label {
            position: fixed;
            right: 180px;
            top: 112px;
            background: #140f30;
            color: #ffd9a8;
            border: 1px solid rgba(255, 140, 66, 0.4);
            padding: 7px 14px;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 600;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
            white-space: nowrap;
            z-index: 9997;
            opacity: 0;
            transform: translateX(10px);
            transition: opacity 0.25s, transform 0.25s;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        #vq-chat-bubble:hover + #vq-chat-label {
            opacity: 1;
            transform: translateX(0);
        }

        #vq-chat-panel {
            position: fixed;
            top: 164px;
            right: 30px;
            width: 420px;
            height: min(640px, calc(100vh - 184px));
            min-height: 380px;
            background: rgba(13, 10, 34, 0.94);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 18px;
            border: 1px solid rgba(255, 140, 66, 0.3);
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.6), 0 0 36px rgba(255, 140, 66, 0.1);
            overflow: hidden;
            display: none;
            flex-direction: column;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            animation: vq-slideUp 0.25s ease-out;
        }

        #vq-chat-panel.open { display: flex; }

        #vq-chat-panel.expanded {
            top: 50%;
            left: 50%;
            right: auto;
            transform: translate(-50%, -50%);
            width: min(820px, 94vw);
            height: 86vh;
            max-height: 900px;
        }

        @keyframes vq-slideUp {
            from { transform: translateY(14px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        #vq-chat-panel.expanded { animation: none; }

        #vq-chat-header {
            background: radial-gradient(120% 140% at 20% 0%, rgba(118, 75, 162, 0.5), transparent 65%), #140f30;
            padding: 14px 16px;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid rgba(255, 140, 66, 0.25);
            flex-shrink: 0;
        }

        #vq-chat-avatar {
            font-size: 1.35rem;
            background: rgba(255, 140, 66, 0.12);
            border: 1.5px solid rgba(255, 140, 66, 0.55);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        #vq-chat-info { min-width: 0; }
        #vq-chat-info h3 {
            font-size: 1.02rem;
            margin-bottom: 2px;
            font-weight: 700;
            color: #fff;
            white-space: nowrap;
        }
        #vq-chat-info p {
            font-size: 0.76rem;
            color: rgba(255, 217, 168, 0.8);
            white-space: nowrap;
        }

        #vq-chat-clear, #vq-chat-expand, #vq-chat-close {
            background: rgba(255, 255, 255, 0.07);
            border: 1px solid rgba(255, 255, 255, 0.14);
            color: rgba(255, 255, 255, 0.85);
            height: 32px;
            border-radius: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, border-color 0.2s, color 0.2s;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            flex-shrink: 0;
        }
        #vq-chat-clear { margin-left: auto; padding: 0 12px; font-size: 0.78rem; gap: 4px; }
        #vq-chat-expand { width: 32px; font-size: 0.95rem; }
        #vq-chat-close { width: 32px; font-size: 1.3rem; line-height: 1; }
        #vq-chat-clear:hover, #vq-chat-expand:hover, #vq-chat-close:hover {
            background: rgba(255, 140, 66, 0.2);
            border-color: rgba(255, 140, 66, 0.6);
            color: #fff;
        }
        #vq-chat-panel button:focus-visible, #vq-chat-input:focus-visible { outline: 2px solid #ffd9a8; outline-offset: 2px; }

        #vq-chat-messages {
            flex: 1;
            padding: 18px 16px 8px;
            overflow-y: auto;
            background: transparent;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 140, 66, 0.5) transparent;
        }
        #vq-chat-messages::-webkit-scrollbar { width: 6px; }
        #vq-chat-messages::-webkit-scrollbar-track { background: transparent; }
        #vq-chat-messages::-webkit-scrollbar-thumb { background: rgba(255, 140, 66, 0.45); border-radius: 3px; }

        #vq-chat-widget .vq-message {
            margin-bottom: 14px;
            display: flex;
            gap: 9px;
            align-items: flex-start;
            animation: vq-fadeIn 0.25s ease;
        }
        @keyframes vq-fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .vq-message-avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: rgba(255, 140, 66, 0.12);
            border: 1px solid rgba(255, 140, 66, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.95rem;
            flex-shrink: 0;
        }

        #vq-chat-widget .vq-message-content {
            background: rgba(255, 255, 255, 0.06);
            padding: 11px 14px;
            border-radius: 4px 14px 14px 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.55;
            font-size: 0.94rem;
            max-width: 82%;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
        }
        #vq-chat-widget .vq-message-content strong { color: #ffd9a8; }
        #vq-chat-widget .vq-message-content a { color: #ffd9a8; }

        .vq-user-message { flex-direction: row-reverse; }
        .vq-user-message .vq-message-avatar {
            background: linear-gradient(135deg, #ff8c42 0%, #ffb27a 100%);
            border-color: transparent;
        }
        #vq-chat-widget .vq-user-message .vq-message-content {
            background: linear-gradient(135deg, #ff8c42 0%, #ffb27a 100%);
            color: #1a1030;
            border: none;
            border-radius: 14px 4px 14px 14px;
            font-weight: 500;
        }
        #vq-chat-widget .vq-user-message .vq-message-content strong { color: #1a1030; }

        #vq-chat-widget .vq-cap-pills {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 6px;
            padding: 10px 14px 2px;
            background: #140f30;
            border-top: 1px solid rgba(255, 140, 66, 0.18);
            scrollbar-width: none;
            flex-shrink: 0;
        }
        .vq-cap-pills::-webkit-scrollbar { display: none; }

        #vq-chat-widget .vq-cap-pill {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 140, 66, 0.3);
            color: rgba(255, 255, 255, 0.78);
            border-radius: 999px;
            padding: 5px 11px;
            font-size: 0.78rem;
            cursor: pointer;
            transition: background 0.18s, border-color 0.18s, color 0.18s;
            white-space: nowrap;
            flex-shrink: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .vq-cap-pill:hover {
            background: rgba(255, 140, 66, 0.14);
            border-color: rgba(255, 140, 66, 0.65);
            color: #fff;
        }
        .vq-cap-pill.active {
            background: linear-gradient(135deg, #ff8c42 0%, #ffb27a 100%) !important;
            border-color: transparent !important;
            color: #1a1030 !important;
            font-weight: 600;
        }

        #vq-chat-input-area {
            padding: 10px 14px 14px;
            background: #140f30;
            display: flex;
            gap: 8px;
            align-items: center;
            flex-shrink: 0;
        }

        #vq-chat-input {
            flex: 1;
            min-width: 0;
            padding: 11px 16px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 22px;
            font-size: 0.93rem;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #fff;
        }
        #vq-chat-input::placeholder { color: rgba(255, 255, 255, 0.45); }
        #vq-chat-input:focus {
            border-color: rgba(255, 140, 66, 0.7);
            background: rgba(255, 255, 255, 0.09);
            box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.15);
        }

        #vq-chat-send {
            background: linear-gradient(135deg, #ff8c42 0%, #ffb27a 100%);
            border: none;
            color: #1a1030;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.05rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 14px rgba(255, 140, 66, 0.3);
            flex-shrink: 0;
        }
        #vq-chat-send:hover:not(:disabled) { transform: scale(1.06); box-shadow: 0 6px 18px rgba(255, 140, 66, 0.45); }
        #vq-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }

        #vq-chat-widget .vq-typing-indicator { display: flex; gap: 5px; padding: 12px 14px; }
        .vq-typing-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #ff8c42;
            animation: vq-typing 1.3s infinite;
        }
        .vq-typing-dot:nth-child(2) { animation-delay: 0.18s; }
        .vq-typing-dot:nth-child(3) { animation-delay: 0.36s; }
        @keyframes vq-typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-6px); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
            #vq-chat-bubble, #vq-chat-panel, .vq-message { animation: none !important; }
            .vq-typing-dot { animation-duration: 2.6s; }
        }

        /* Phones: floating button bottom-right, chat opens full screen */
        @media (max-width: 768px) {
            #vq-chat-bubble {
                top: auto;
                bottom: calc(18px + env(safe-area-inset-bottom, 0px));
                right: 16px;
                width: 54px;
                height: 54px;
                padding: 0;
                border-radius: 50%;
                font-size: 1.5rem;
            }
            #vq-chat-bubble .vq-bubble-text { display: none; }
            #vq-chat-bubble:hover { transform: none; }
            #vq-chat-label { display: none; }

            #vq-chat-panel,
            #vq-chat-panel.expanded {
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                transform: none;
                width: 100%;
                height: 100vh;
                height: 100dvh;
                max-height: none;
                min-height: 0;
                border-radius: 0;
                border: none;
                background: #0d0a22;
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                animation: vq-slideUp 0.2s ease-out;
            }
            #vq-chat-header { padding: calc(12px + env(safe-area-inset-top, 0px)) 14px 12px; }
            #vq-chat-expand { display: none; }
            #vq-chat-clear { padding: 0 10px; }
            #vq-chat-close { width: 38px; height: 38px; border-radius: 19px; font-size: 1.5rem; }
            #vq-chat-messages { padding: 16px 14px 8px; overscroll-behavior: contain; }
            #vq-chat-widget .vq-message-content { max-width: 86%; font-size: 1rem; }
            #vq-chat-widget .vq-cap-pill { padding: 7px 13px; font-size: 0.85rem; }
            #vq-chat-input-area { padding: 10px 12px calc(12px + env(safe-area-inset-bottom, 0px)); }
            #vq-chat-input { font-size: 16px; padding: 12px 16px; }
            #vq-chat-send { width: 46px; height: 46px; }
        }
        @media (max-width: 768px) {
            html.vq-chat-open, html.vq-chat-open body { overflow: hidden; }
        }
    `;

    // Create and inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Create widget HTML
    const widgetHTML = `
        <div id="vq-chat-widget">
            <button id="vq-chat-bubble" aria-label="Chat with VQ">🤖<span class="vq-bubble-text">VQ</span></button>
            <div id="vq-chat-label">Chat with VQ</div>
            
            <div id="vq-chat-panel">
                <div id="vq-chat-header">
                    <div id="vq-chat-avatar">🕊️</div>
                    <div id="vq-chat-info">
                        <h3>Veritas Quaesitor</h3>
                        <p>Truth Seeker • CAI v3.1</p>
                    </div>
                    <button id="vq-chat-clear" title="Clear conversation">🗑️ Clear</button>
                    <button id="vq-chat-expand" title="Expand view">⛶</button>
                    <button id="vq-chat-close" aria-label="Close chat">×</button>
                </div>
                
                <div id="vq-chat-messages"></div>

                <div class="vq-cap-pills">
                    <button class="vq-cap-pill" data-mode="[DDG SEARCH]" title="Force DuckDuckGo web search">🔍 DDG Search</button>
                    <button class="vq-cap-pill" data-mode="[DDG NEWS]" title="Force DuckDuckGo news search">📰 DDG News</button>
                    <button class="vq-cap-pill" data-mode="[TIME]" title="Get current time for any city">🕐 Time</button>
                    <button class="vq-cap-pill" data-mode="[CAI EVOLUTION]" title="CAI position on evolutionary naturalism">🧬 CAI Evolution</button>
                </div>
                
                <div id="vq-chat-input-area">
                    <input 
                        type="text" 
                        id="vq-chat-input" 
                        placeholder="Ask anything about VQ, CAI, or the evidence..."
                        autocomplete="off"
                    >
                    <button id="vq-chat-send">➤</button>
                </div>
            </div>
        </div>
    `;

    // Wait for DOM to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Insert widget into page
        const container = document.createElement('div');
        container.innerHTML = widgetHTML;
        document.body.appendChild(container);

        // Get elements
        const bubble = document.getElementById('vq-chat-bubble');
        const panel = document.getElementById('vq-chat-panel');
        const closeBtn = document.getElementById('vq-chat-close');
        const input = document.getElementById('vq-chat-input');
        const sendBtn = document.getElementById('vq-chat-send');
        const messagesContainer = document.getElementById('vq-chat-messages');

        // Conversation history
        let conversationHistory = [];
        let activePill = null; // capability pill mode

        // PERSISTENCE: Load saved state from localStorage
        const savedHistory = localStorage.getItem('vq-conversation-history');
        const wasOpen = localStorage.getItem('vq-widget-open') === 'true';
        
        if (savedHistory) {
            try {
                conversationHistory = JSON.parse(savedHistory);
                conversationHistory.forEach(msg => {
                    addMessageToUI(msg.role, msg.content);
                });
            } catch (e) {
                console.error('Failed to load conversation history:', e);
                addMessage('assistant', CONFIG.welcomeMessage);
            }
        } else {
            addMessage('assistant', CONFIG.welcomeMessage);
        }
        
        const isPhone = () => window.matchMedia('(max-width: 768px)').matches;

        if (wasOpen && !isPhone()) {
            panel.classList.add('open');
            input.focus();
        }

        // Event listeners
        bubble.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', closeChat);
        const clearBtn = document.getElementById('vq-chat-clear');
        clearBtn.addEventListener('click', clearConversation);
        const expandBtn = document.getElementById('vq-chat-expand');
        expandBtn.addEventListener('click', toggleExpanded);
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Capability pills
        document.querySelectorAll('.vq-cap-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const mode = pill.dataset.mode;
                if (activePill === mode) {
                    activePill = null;
                    pill.classList.remove('active');
                } else {
                    document.querySelectorAll('.vq-cap-pill').forEach(p => p.classList.remove('active'));
                    activePill = mode;
                    pill.classList.add('active');
                }
                input.focus();
            });
        });

        function toggleChat() {
            if (panel.classList.contains('open')) {
                closeChat();
            } else {
                openChat();
            }
        }

        function openChat() {
            panel.classList.add('open');
            document.documentElement.classList.add('vq-chat-open');
            localStorage.setItem('vq-widget-open', 'true');
            if (!isPhone()) input.focus();
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function closeChat() {
            panel.classList.remove('open');
            document.documentElement.classList.remove('vq-chat-open');
            localStorage.setItem('vq-widget-open', 'false');
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('open')) closeChat();
        });
        
        function toggleExpanded() {
            panel.classList.toggle('expanded');
            if (panel.classList.contains('expanded')) {
                expandBtn.textContent = '⛶';
                expandBtn.title = 'Normal view';
            } else {
                expandBtn.textContent = '⛶';
                expandBtn.title = 'Expand view';
            }
        }
        
        function clearConversation() {
            localStorage.removeItem('vq-conversation-history');
            localStorage.setItem('vq-widget-open', 'true');
            messagesContainer.innerHTML = '';
            conversationHistory = [];
            activePill = null;
            document.querySelectorAll('.vq-cap-pill').forEach(p => p.classList.remove('active'));
            addMessage('assistant', CONFIG.welcomeMessage);
        }
        
        function addMessageToUI(role, content) {
            const hasImage = /<img/i.test(content);
            const messageDiv = document.createElement('div');
            messageDiv.className = role === 'user' ? 'vq-message vq-user-message' : 'vq-message';

            messageDiv.innerHTML = `
                <div class="vq-message-avatar">${role === 'user' ? '👤' : '🕊️'}</div>
                <div class="vq-message-content"></div>
            `;

            const bubble = messageDiv.querySelector('.vq-message-content');

            if (hasImage) {
                const parts = content.split(/(<img[^>]*>)/i);
                parts.forEach(part => {
                    if (/^<img/i.test(part)) {
                        const imgEl = safeImageFrom(part);
                        if (imgEl) bubble.appendChild(imgEl);
                    } else if (part.trim()) {
                        const textEl = document.createElement('span');
                        textEl.style.whiteSpace = 'pre-wrap';
                        textEl.style.display = 'block';
                        textEl.textContent = part;
                        bubble.appendChild(textEl);
                    }
                });
            } else {
                bubble.textContent = content;
            }

            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }


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

        function addMessage(role, content) {
            addMessageToUI(role, content);
            conversationHistory.push({ role, content });
            try {
                localStorage.setItem('vq-conversation-history', JSON.stringify(conversationHistory));
            } catch (e) {
                console.error('Failed to save conversation:', e);
                if (conversationHistory.length > 20) {
                    conversationHistory = conversationHistory.slice(-20);
                    localStorage.setItem('vq-conversation-history', JSON.stringify(conversationHistory));
                }
            }
        }

        function showTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'vq-message';
            typingDiv.id = 'vq-typing';
            typingDiv.innerHTML = `
                <div class="vq-message-avatar">🕊️</div>
                <div class="vq-message-content">
                    <div class="vq-typing-indicator">
                        <div class="vq-typing-dot"></div>
                        <div class="vq-typing-dot"></div>
                        <div class="vq-typing-dot"></div>
                    </div>
                </div>
            `;
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function hideTypingIndicator() {
            const typingDiv = document.getElementById('vq-typing');
            if (typingDiv) typingDiv.remove();
        }

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
            const rawMessage = input.value.trim();
            if (!rawMessage) return;

            // Prepend active pill prefix for backend routing; show clean message in UI
            const message = activePill ? `${activePill} ${rawMessage}` : rawMessage;

            addMessage('user', rawMessage); // always show clean message to user
            input.value = '';
            sendBtn.disabled = true;

            // Clear active pill after send
            activePill = null;
            document.querySelectorAll('.vq-cap-pill').forEach(p => p.classList.remove('active'));

            const pageContext = getSmartPageContext();
            showTypingIndicator();

            try {
                const response = await fetch(CONFIG.apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        history: conversationHistory.slice(-20),
                        pageContext: pageContext
                    })
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    if (data && data.response) {
                        hideTypingIndicator();
                        addMessageToUI('assistant', data.response);
                        return;
                    }
                    throw new Error('Network response was not ok');
                }

                hideTypingIndicator();
                addMessage('assistant', data.response);
                
            } catch (error) {
                console.error('Error:', error);
                hideTypingIndicator();
                addMessage('assistant', "Friend, I'm having trouble connecting right now. Please try again in a moment, or visit the website directly at veritasquaesitorcai.github.io");
            } finally {
                sendBtn.disabled = false;
                input.focus();
            }
        }
    }
})();
