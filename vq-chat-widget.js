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
        apiEndpoint: 'https://your-backend-url.com/chat', // UPDATE THIS
        welcomeMessage: `Hey friend! 👋 Welcome to Veritas Quaesitor.

I'm VQ - your guide to exploring Christ-Anchored Intelligence through rigorous evidence and symmetric reasoning.

**What I can help with:**
• Explain CAI methodology and the Bayesian framework
• Answer questions about resurrection evidence
• Guide you to our Beta Tools (Resurrection Engine, CAI Crucible)
• Discuss AI alignment, truth-seeking, and the Safe Harbor Mandate
• Or just chat - I handle everything from casual questions to deep theology

What brings you here today? 🕊️`
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
            bottom: 30px;
            right: 30px;
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.2rem;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.6),
                        0 4px 16px rgba(0, 0, 0, 0.3),
                        0 0 0 0 rgba(102, 126, 234, 0.7);
            animation: vq-pulse 2s infinite;
            transition: transform 0.3s ease;
            z-index: 9998;
            border: 3px solid rgba(255, 255, 255, 0.3);
        }

        #vq-chat-bubble:hover {
            transform: scale(1.1);
        }

        @keyframes vq-pulse {
            0% {
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.6),
                            0 4px 16px rgba(0, 0, 0, 0.3),
                            0 0 0 0 rgba(102, 126, 234, 0.7);
            }
            50% {
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.8),
                            0 4px 16px rgba(0, 0, 0, 0.3),
                            0 0 0 20px rgba(102, 126, 234, 0);
            }
            100% {
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.6),
                            0 4px 16px rgba(0, 0, 0, 0.3),
                            0 0 0 0 rgba(102, 126, 234, 0);
            }
        }

        #vq-chat-label {
            position: fixed;
            right: 100px;
            bottom: 40px;
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
            bottom: 30px;
            right: 30px;
            width: 420px;
            height: 650px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4),
                        0 0 0 3px rgba(102, 126, 234, 0.3);
            overflow: hidden;
            display: none;
            flex-direction: column;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            animation: vq-slideUp 0.3s ease;
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

        #vq-chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #f8f9fa;
        }

        #vq-chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        #vq-chat-messages::-webkit-scrollbar-track {
            background: #f1f1f1;
        }

        #vq-chat-messages::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 3px;
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
            background: white;
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            color: #333;
            line-height: 1.6;
            max-width: 80%;
            white-space: pre-wrap;
        }

        .vq-message-content strong {
            color: #667eea;
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
            background: white;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 10px;
        }

        #vq-chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 24px;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        #vq-chat-input:focus {
            border-color: #667eea;
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

        /* Mobile Responsive */
        @media (max-width: 768px) {
            #vq-chat-panel {
                width: calc(100vw - 40px);
                height: calc(100vh - 100px);
                right: 20px;
                bottom: 20px;
            }

            #vq-chat-bubble {
                bottom: 20px;
                right: 20px;
            }

            #vq-chat-label {
                right: 90px;
                bottom: 30px;
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
            <button id="vq-chat-bubble">🕊️</button>
            <div id="vq-chat-label">Chat with VQ</div>
            
            <div id="vq-chat-panel">
                <div id="vq-chat-header">
                    <div id="vq-chat-avatar">🕊️</div>
                    <div id="vq-chat-info">
                        <h3>Veritas Quaesitor</h3>
                        <p>Truth Seeker • CAI v3.1</p>
                    </div>
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

        // Add welcome message
        addMessage('assistant', CONFIG.welcomeMessage);

        // Event listeners
        bubble.addEventListener('click', openChat);
        closeBtn.addEventListener('click', closeChat);
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        function openChat() {
            panel.classList.add('open');
            input.focus();
        }

        function closeChat() {
            panel.classList.remove('open');
        }

        function addMessage(role, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = role === 'user' ? 'vq-message vq-user-message' : 'vq-message';
            
            messageDiv.innerHTML = `
                <div class="vq-message-avatar">${role === 'user' ? '👤' : '🕊️'}</div>
                <div class="vq-message-content">${content}</div>
            `;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Add to history
            conversationHistory.push({ role, content });
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
