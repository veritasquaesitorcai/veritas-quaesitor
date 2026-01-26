(function() {
    'use strict';

    const CONFIG = {
        apiEndpoint: 'https://veritas-quaesitor-production.up.railway.app/chat',
        welcomeMessage: `Hey! 👋 I'm VQ, your guide to exploring Christ-Anchored Intelligence.

I can help with CAI methodology, resurrection evidence, our Beta Tools, or just chat about AI and truth.

What brings you here?`,
        maxMessageLength: 2000,
        storageKey: 'vq-app-conversation'
    };

    let conversationHistory = [];
    let isTyping = false;

    const elements = {
        messagesArea: document.getElementById('messages-area'),
        messageInput: document.getElementById('message-input'),
        sendBtn: document.getElementById('send-btn'),
        clearBtn: document.getElementById('clear-btn'),
        infoBtn: document.getElementById('info-btn'),
        infoModal: document.getElementById('info-modal'),
        closeModal: document.getElementById('close-modal'),
        charCount: document.getElementById('char-count'),
        statusText: document.getElementById('status-text')
    };

    function init() {
        loadConversation();
        attachEventListeners();
        
        if (conversationHistory.length === 0) {
            addMessage('assistant', CONFIG.welcomeMessage);
        }
        
        elements.messageInput.focus();
    }

    function attachEventListeners() {
        elements.sendBtn.addEventListener('click', sendMessage);
        elements.clearBtn.addEventListener('click', clearConversation);
        elements.infoBtn.addEventListener('click', () => elements.infoModal.classList.remove('hidden'));
        elements.closeModal.addEventListener('click', () => elements.infoModal.classList.add('hidden'));
        
        elements.infoModal.addEventListener('click', (e) => {
            if (e.target === elements.infoModal) {
                elements.infoModal.classList.add('hidden');
            }
        });

        elements.messageInput.addEventListener('input', handleInputChange);
        elements.messageInput.addEventListener('keydown', handleKeyDown);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !elements.infoModal.classList.contains('hidden')) {
                elements.infoModal.classList.add('hidden');
            }
        });
    }

    function handleInputChange() {
        const length = elements.messageInput.value.length;
        elements.charCount.textContent = `${length} / ${CONFIG.maxMessageLength}`;
        
        elements.sendBtn.disabled = length === 0 || length > CONFIG.maxMessageLength || isTyping;
        
        autoResizeTextarea();
    }

    function autoResizeTextarea() {
        elements.messageInput.style.height = 'auto';
        elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 150) + 'px';
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!elements.sendBtn.disabled) {
                sendMessage();
            }
        }
    }

    function loadConversation() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);
            if (saved) {
                conversationHistory = JSON.parse(saved);
                conversationHistory.forEach(msg => {
                    addMessageToUI(msg.role, msg.content);
                });
            }
        } catch (e) {
            console.error('Failed to load conversation:', e);
            conversationHistory = [];
        }
    }

    function saveConversation() {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(conversationHistory));
        } catch (e) {
            console.error('Failed to save conversation:', e);
            if (conversationHistory.length > 30) {
                conversationHistory = conversationHistory.slice(-30);
                localStorage.setItem(CONFIG.storageKey, JSON.stringify(conversationHistory));
            }
        }
    }

    function clearConversation() {
        if (!confirm('Clear all messages? This cannot be undone.')) {
            return;
        }
        
        conversationHistory = [];
        elements.messagesArea.innerHTML = '';
        
        localStorage.removeItem(CONFIG.storageKey);
        
        addMessage('assistant', CONFIG.welcomeMessage);
        
        elements.messageInput.focus();
    }

    function addMessage(role, content) {
        addMessageToUI(role, content);
        
        conversationHistory.push({ role, content });
        saveConversation();
    }

    function addMessageToUI(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = role === 'user' ? 'message user' : 'message';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        elements.messagesArea.appendChild(messageDiv);
        scrollToBottom();
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
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        contentDiv.appendChild(indicator);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(contentDiv);
        
        elements.messagesArea.appendChild(typingDiv);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const typingDiv = document.getElementById('typing-indicator');
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    function scrollToBottom() {
        elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
    }

    function setStatus(status, text) {
        elements.statusText.textContent = text;
        const dot = document.querySelector('.status-dot');
        
        switch(status) {
            case 'online':
                dot.style.background = '#4ade80';
                break;
            case 'typing':
                dot.style.background = '#fbbf24';
                break;
            case 'error':
                dot.style.background = '#ef4444';
                break;
        }
    }

    async function sendMessage() {
        const message = elements.messageInput.value.trim();
        if (!message || isTyping) return;

        addMessage('user', message);
        
        elements.messageInput.value = '';
        elements.messageInput.style.height = 'auto';
        elements.charCount.textContent = '0 / 2000';
        elements.sendBtn.disabled = true;
        
        isTyping = true;
        setStatus('typing', 'Thinking...');
        showTypingIndicator();

        try {
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
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            hideTypingIndicator();
            addMessage('assistant', data.response);
            
            setStatus('online', 'Online');
            
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            
            const errorMessage = `I'm having trouble connecting right now. Please try again in a moment.

If this persists, you can reach out via the website at veritasquaesitorcai.github.io`;
            
            addMessage('assistant', errorMessage);
            setStatus('error', 'Connection error');
            
            setTimeout(() => {
                setStatus('online', 'Online');
            }, 3000);
            
        } finally {
            isTyping = false;
            elements.messageInput.focus();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
