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
        welcomeMessage: `Hey! 👋 I'm VQ, your VQ CAI guide.
        
I'm here to help. 

Where do we Start?`
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
            width: 140px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 1.8rem;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.7),
                        0 4px 16px rgba(0, 0, 0, 0.4),
                        0 0 0 0 rgba(102, 126, 234, 1);
            animation: vq-pulse 1.5s 2;
            transition: transform 0.3s ease;
            z-index: 9998;
            border: 3px solid rgba(255, 255, 255, 0.4);
            font-weight: 600;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        #vq-chat-bubble:hover {
            transform: scale(1.1);
        }

        @keyframes vq-pulse {
            0% {
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.7),
                            0 4px 16px rgba(0, 0, 0, 0.4),
                            0 0 0 0 rgba(102, 126, 234, 1);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.9),
                            0 4px 16px rgba(0, 0, 0, 0.4),
                            0 0 0 25px rgba(102, 126, 234, 0);
                transform: scale(1.05);
            }
            100% {
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.7),
                            0 4px 16px rgba(0, 0, 0, 0.4),
                            0 0 0 0 rgba(102, 126, 234, 0);
                transform: scale(1);
            }
        }

        #vq-chat-label {
            position: fixed;
            right: 180px;
            top: 115px;
            background: white;
            color: #1a1a3e;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            white-space: nowrap;
            z-index: 9997;
            opacity: 0;
            transform: translateX(10px);
            transition: opacity 0.3s, transform 0.3s;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        #vq-chat-bubble:hover + #vq-chat-label {
            opacity: 1;
            transform: translateX(0);
        }

        #vq-chat-panel {
            position: fixed;
            top: 170px;
            right: 30px;
            width: 420px;
            height: 650px;
            background: rgba(26, 26, 62, 0.75);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6),
                        0 0 0 1px rgba(102, 126, 234, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
            overflow: hidden;
            display: none;
            flex-direction: column;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            animation: vq-slideUp 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }

        #vq-chat-panel.open {
            display: flex;
        }

        #vq-chat-panel.expanded {
            top: 50%;
            left: 50%;
            right: auto;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 85vh;
            max-height: 900px;
        }

        @keyframes vq-slideUp {
            from {
                transform: translateY(50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        #vq-chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: white;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        #vq-chat-avatar {
            font-size: 2rem;
            background: rgba(255, 255, 255, 0.2);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #vq-chat-info h3 {
            font-size: 1.2rem;
            margin-bottom: 4px;
            font-weight: 600;
        }

        #vq-chat-info p {
            font-size: 0.85rem;
            opacity: 0.9;
        }

        #vq-chat-close {
            margin-left: auto;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.4rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
            line-height: 1;
        }

        #vq-chat-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        #vq-chat-clear {
            background: rgba(255, 255, 255, 0.15);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 16px;
            cursor: pointer;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background 0.2s;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            opacity: 0.8;
        }

        #vq-chat-clear:hover {
            background: rgba(255, 255, 255, 0.25);
            opacity: 1;
        }

        #vq-chat-expand {
            background: rgba(255, 255, 255, 0.15);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
            opacity: 0.8;
        }

        #vq-chat-expand:hover {
            background: rgba(255, 255, 255, 0.25);
            opacity: 1;
        }

        #vq-chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(15, 15, 35, 0.4);
        }

        #vq-chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        #vq-chat-messages::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }

        #vq-chat-messages::-webkit-scrollbar-thumb {
            background: rgba(102, 126, 234, 0.6);
            border-radius: 3px;
        }

        #vq-chat-messages::-webkit-scrollbar-thumb:hover {
            background: rgba(102, 126, 234, 0.8);
        }

        .vq-message {
            margin-bottom: 16px;
            display: flex;
            gap: 10px;
            animation: vq-fadeIn 0.3s ease;
        }

        @keyframes vq-fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .vq-message-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        .vq-message-content {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
                        0 0 0 1px rgba(102, 126, 234, 0.2);
            color: #e8e8f0;
            line-height: 1.6;
            max-width: 80%;
            white-space: pre-wrap;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .vq-message-content strong {
            color: #a5b4fc;
        }

        .vq-user-message {
            flex-direction: row-reverse;
        }

        .vq-user-message .vq-message-avatar {
            background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
        }

        .vq-user-message .vq-message-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        #vq-chat-input-area {
            padding: 16px;
            background: rgba(26, 26, 62, 0.6);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(102, 126, 234, 0.2);
            display: flex;
            gap: 10px;
        }

        #vq-chat-input {
            flex: 1;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 24px;
            font-size: 0.95rem;
            outline: none;
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #e8e8f0;
        }

        #vq-chat-input::placeholder {
            color: rgba(232, 232, 240, 0.5);
        }

        #vq-chat-input:focus {
            border-color: #667eea;
            background: rgba(255, 255, 255, 0.12);
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        #vq-chat-send {
            background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
            border: none;
            color: white;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
            box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3);
        }

        #vq-chat-send:hover:not(:disabled) {
            transform: scale(1.05);
        }

        #vq-chat-send:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .vq-typing-indicator {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
        }

        .vq-typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #667eea;
            animation: vq-typing 1.4s infinite;
        }

        .vq-typing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .vq-typing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes vq-typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.7;
            }
            30% {
                transform: translateY(-10px);
                opacity: 1;
            }
        }

        /* Mobile Responsive - HIDE WIDGET ON MOBILE */
        @media (max-width: 768px) {
            #vq-chat-widget {
                display: none !important;
            }
        }
    `;

    // Create and inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Create widget HTML
    const widgetHTML = `
        <div id="vq-chat-widget">
            <button id="vq-chat-bubble">🤖 VQ</button>
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
                    <button id="vq-chat-close">×</button>
                </div>
                
                <div id="vq-chat-messages"></div>
                
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
        
        // PERSISTENCE: Load saved state from localStorage
        const savedHistory = localStorage.getItem('vq-conversation-history');
        const wasOpen = localStorage.getItem('vq-widget-open') === 'true';
        
        if (savedHistory) {
            try {
                conversationHistory = JSON.parse(savedHistory);
                // Restore messages in UI
                conversationHistory.forEach(msg => {
                    addMessageToUI(msg.role, msg.content);
                });
            } catch (e) {
                console.error('Failed to load conversation history:', e);
                // Start fresh with welcome message
                addMessage('assistant', CONFIG.welcomeMessage);
            }
        } else {
            // First time - show welcome message
            addMessage('assistant', CONFIG.welcomeMessage);
        }
        
        // Restore open/closed state
        if (wasOpen) {
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

        function toggleChat() {
            if (panel.classList.contains('open')) {
                closeChat();
            } else {
                openChat();
            }
        }

        function openChat() {
            panel.classList.add('open');
            localStorage.setItem('vq-widget-open', 'true');
            input.focus();
        }

        function closeChat() {
            panel.classList.remove('open');
            localStorage.setItem('vq-widget-open', 'false');
        }
        
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
            // Clear localStorage
            localStorage.removeItem('vq-conversation-history');
            localStorage.setItem('vq-widget-open', 'true'); // Keep open
            
            // Clear UI
            messagesContainer.innerHTML = '';
            
            // Reset history
            conversationHistory = [];
            
            // Add welcome message
            addMessage('assistant', CONFIG.welcomeMessage);
        }
        
        function addMessageToUI(role, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = role === 'user' ? 'vq-message vq-user-message' : 'vq-message';
            
            messageDiv.innerHTML = `
                <div class="vq-message-avatar">${role === 'user' ? '👤' : '🕊️'}</div>
                <div class="vq-message-content">${content}</div>
            `;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function addMessage(role, content) {
            addMessageToUI(role, content);
            
            // Add to history
            conversationHistory.push({ role, content });
            
            // PERSISTENCE: Save to localStorage
            try {
                localStorage.setItem('vq-conversation-history', JSON.stringify(conversationHistory));
            } catch (e) {
                console.error('Failed to save conversation:', e);
                // If storage is full, keep only last 20 messages
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
            if (typingDiv) {
                typingDiv.remove();
            }
        }

        function getSmartPageContext() {
            const url = window.location.href;
            const pathname = window.location.pathname;
            
            // Detect which page we're on
            let pageType = 'unknown';
            let relevantContent = '';

            // --- ENVIRONMENT DETECTION (checked FIRST, before site pages) ---
            // Standalone app or Chrome extension sets window.VQ_APP_MODE before widget loads
            // If not set, falls through to normal VQ site detection below unchanged.
            
            if (window.VQ_APP_MODE === 'standalone' || pathname.includes('/app/')) {
                // Standalone app - grab whatever page content exists
                pageType = 'standalone-app';
                relevantContent = extractMainContent('main', '#app', '#root', 'body');
                
            } else if (window.VQ_APP_MODE === 'extension' || (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && !url.includes('veritasquaesitorcai.github.io')) || (!url.includes('veritasquaesitorcai.github.io') && !pathname.includes('/app/'))) {
                // Chrome extension - grab the HOST page content intelligently
                pageType = 'extension-' + detectExternalPageType();
                relevantContent = extractExternalPageContent();

            // --- EXISTING VQ SITE DETECTION (unchanged) ---
            } else if (pathname.includes('index-ai') || pathname.includes('ai-index')) {
                pageType = 'ai-index';
                relevantContent = extractMainContent('main', 'article', '.methodology');
                
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
                
            } else if (pathname.includes('index.html') || pathname === '/') {
                pageType = 'ai-index';
                relevantContent = extractMainContent('main', 'article', '.methodology');
            }
            
            return {
                url: url,
                pageType: pageType,
                title: document.title,
                content: relevantContent.substring(0, 1000) // Limit to 1000 chars
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
                if (title || desc) {
                    content += `${title}: ${desc}\n`;
                }
            });
            return content || extractMainContent('main');
        }

        // --- EXTENSION HELPERS ---
        // Detects what KIND of external page the extension is running on
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

        // Extracts relevant content from external pages intelligently
        function extractExternalPageContent() {
            const host = window.location.hostname;
            let content = '';

            // --- ALWAYS GRAB THESE (baseline for every external page) ---
            const title = document.title || '';
            const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
            const selectedText = window.getSelection()?.toString().trim() || '';

            // Selected text is PRIORITY - user highlighted something intentionally
            if (selectedText.length > 10) {
                content += `[USER SELECTED TEXT]: "${selectedText}"\n\n`;
            }

            content += `[PAGE TITLE]: ${title}\n`;
            if (metaDesc) content += `[PAGE DESCRIPTION]: ${metaDesc}\n`;
            content += '\n';

            // --- SITE-SPECIFIC EXTRACTION ---

            // Wikipedia: handle both main page and article pages
            if (host.includes('wikipedia')) {
                const article = document.querySelector('#mw-content-text .mw-parser-output');
                if (article) {
                    // Article page - grab heading + first paragraphs
                    const h1 = document.querySelector('h1#firstHeading')?.innerText || '';
                    content += `[ARTICLE]: ${h1}\n`;
                    const paragraphs = article.querySelectorAll('p');
                    paragraphs.forEach((p, i) => {
                        if (i < 3 && p.innerText.trim().length > 50) {
                            content += p.innerText.trim() + '\n';
                        }
                    });
                } else {
                    // Main page - grab visible sections
                    content += '[PAGE]: Wikipedia Main Page\n';
                    content += getVisibleText(300);
                }
            }
            // YouTube: multiple selector attempts (YouTube changes these often)
            else if (host.includes('youtube')) {
                const titleEl = document.querySelector('h1.ytd-video-title-renderer') 
                    || document.querySelector('h1[class*="title"]')
                    || document.querySelector('yt-formatted-string.ytd-video-title-renderer');
                const videoTitle = titleEl?.innerText || '';
                const channelEl = document.querySelector('.ytd-channel-name-renderer a')
                    || document.querySelector('[class*="channel-name"]');
                const channel = channelEl?.innerText || '';
                const descEl = document.querySelector('.ytd-text-expand-container')
                    || document.querySelector('[class*="description"]');
                const desc = descEl?.innerText || '';
                if (videoTitle) content += `[VIDEO]: ${videoTitle}\n`;
                if (channel) content += `[CHANNEL]: ${channel}\n`;
                if (desc) content += `[DESCRIPTION]: ${desc.substring(0, 400)}\n`;
            }
            // ArXiv: paper title + abstract
            else if (host.includes('arxiv')) {
                const paperTitle = document.querySelector('h1.title')?.innerText 
                    || document.querySelector('.abs-title')?.innerText || '';
                const abstract = document.querySelector('.abstract')?.innerText 
                    || document.querySelector('[class*="abstract"]')?.innerText || '';
                if (paperTitle) content += `[PAPER]: ${paperTitle}\n`;
                if (abstract) content += `[ABSTRACT]: ${abstract}\n`;
            }
            // Reddit: post title + body + top comments
            else if (host.includes('reddit')) {
                const postTitle = document.querySelector('h1[data-testid="post-title"]')?.innerText 
                    || document.querySelector('h1')?.innerText || '';
                const postBody = document.querySelector('[data-testid="post-content"]')?.innerText 
                    || document.querySelector('.self-text')?.innerText || '';
                if (postTitle) content += `[POST]: ${postTitle}\n`;
                if (postBody) content += `[BODY]: ${postBody.substring(0, 300)}\n`;
                // Grab top 2 comments
                const comments = document.querySelectorAll('[data-testid="comment"]');
                let commentCount = 0;
                comments.forEach(c => {
                    if (commentCount < 2) {
                        const text = c.querySelector('[class*="comment-content"]')?.innerText || c.innerText;
                        if (text && text.length > 20) {
                            content += `[COMMENT]: ${text.substring(0, 150)}\n`;
                            commentCount++;
                        }
                    }
                });
            }
            // Twitter/X: tweet content
            else if (host.includes('twitter') || host.includes('x.com')) {
                const tweets = document.querySelectorAll('[data-testid="tweet"] [data-testid="tweetText"]');
                let tweetCount = 0;
                tweets.forEach(t => {
                    if (tweetCount < 3) {
                        content += `[TWEET]: ${t.innerText}\n`;
                        tweetCount++;
                    }
                });
            }
            // GitHub: repo name + README or file content
            else if (host.includes('github.com')) {
                const repoName = document.querySelector('.repository-content h1')?.innerText
                    || document.querySelector('[data-testid="repository-title-link"]')?.innerText || '';
                const readme = document.querySelector('.markdown')?.innerText || '';
                const fileContent = document.querySelector('.code-view .Lines')?.innerText || '';
                if (repoName) content += `[REPO]: ${repoName}\n`;
                if (readme) content += `[README]: ${readme.substring(0, 400)}\n`;
                if (fileContent) content += `[FILE]: ${fileContent.substring(0, 400)}\n`;
            }
            // StackOverflow: question + top answer
            else if (host.includes('stackoverflow')) {
                const question = document.querySelector('.post-text[itemprop="text"]')?.innerText 
                    || document.querySelector('[class*="question-text"]')?.innerText || '';
                const answers = document.querySelectorAll('.answer .post-text');
                if (question) content += `[QUESTION]: ${question.substring(0, 300)}\n`;
                if (answers[0]) content += `[TOP ANSWER]: ${answers[0].innerText.substring(0, 300)}\n`;
            }
            // Generic fallback: grab visible text from viewport
            else {
                content += getVisibleText(500);
            }

            return content.substring(0, 1000);
        }

        // Gets text that is actually VISIBLE in the current viewport
        function getVisibleText(maxChars) {
            const viewportHeight = window.innerHeight;
            const elements = document.querySelectorAll('h1, h2, h3, p, li, td, th');
            let text = '';
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                // Only grab elements currently visible on screen
                if (rect.top >= 0 && rect.bottom <= viewportHeight && el.innerText.trim().length > 20) {
                    text += el.innerText.trim() + '\n';
                }
            });
            return text.substring(0, maxChars);
        }

        async function sendMessage() {
            const message = input.value.trim();
            if (!message) return;

            // Add user message
            addMessage('user', message);
            input.value = '';
            sendBtn.disabled = true;

            // Capture page context
            const pageContext = getSmartPageContext();

            // Show typing indicator
            showTypingIndicator();

            try {
                // Call backend API
                const response = await fetch(CONFIG.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        history: conversationHistory,
                        pageContext: pageContext
                    })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                
                // Hide typing indicator
                hideTypingIndicator();
                
                // Add bot response
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
