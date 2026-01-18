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
        welcomeMessage: `Hey! 👋 I'm VQ, your guide to exploring Christ-Anchored Intelligence.

I can help with CAI methodology, resurrection evidence, our Beta Tools, or just chat about AI and truth.

What brings you here?`
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
        }

        #vq-chat-panel.open {
            display: flex;
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
        bubble.addEventListener('click', openChat);
        closeBtn.addEventListener('click', closeChat);
        const clearBtn = document.getElementById('vq-chat-clear');
        clearBtn.addEventListener('click', clearConversation);
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        function openChat() {
            panel.classList.add('open');
            localStorage.setItem('vq-widget-open', 'true');
            input.focus();
        }

        function closeChat() {
            panel.classList.remove('open');
            localStorage.setItem('vq-widget-open', 'false');
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

        async function sendMessage() {
            const message = input.value.trim();
            if (!message) return;

            // Add user message
            addMessage('user', message);
            input.value = '';
            sendBtn.disabled = true;

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
                        history: conversationHistory
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
