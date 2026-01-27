(function() {
    'use strict';

    const CONFIG = {
        apiEndpoint: 'https://veritas-quaesitor-production.up.railway.app/chat',
        maxMessageLength: 2000,
        storageKey: 'vq-app-conversation',
        sidebarStateKey: 'vq-sidebar-state'
    };

    let conversationHistory = [];
    let isTyping = false;

    const elements = {
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebar-toggle'),
        newChatBtn: document.getElementById('new-chat-btn'),
        messagesArea: document.getElementById('messages-area'),
        welcomeScreen: document.getElementById('welcome-screen'),
        messageInput: document.getElementById('message-input'),
        sendBtn: document.getElementById('send-btn'),
        attachBtn: document.getElementById('attach-btn'),
        helpBtn: document.getElementById('help-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        infoModal: document.getElementById('info-modal'),
        closeModal: document.getElementById('close-modal'),
        charCount: document.getElementById('char-count'),
        statusText: document.getElementById('status-text')
    };

    function init() {
        loadSidebarState();
        loadConversation();
        randomizeRotatingCard();
        attachEventListeners();
        
        if (conversationHistory.length === 0) {
            showWelcomeScreen();
        } else {
            hideWelcomeScreen();
        }
        
        elements.messageInput.focus();
    }

    function attachEventListeners() {
        elements.sidebarToggle.addEventListener('click', toggleSidebar);
        elements.newChatBtn.addEventListener('click', startNewChat);
        elements.sendBtn.addEventListener('click', sendMessage);
        elements.helpBtn.addEventListener('click', () => showModal());
        
        elements.closeModal.addEventListener('click', () => hideModal());
        
        elements.infoModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                hideModal();
            }
        });

        elements.messageInput.addEventListener('input', handleInputChange);
        elements.messageInput.addEventListener('keydown', handleKeyDown);

        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                let prompt;
                if (card.classList.contains('fun-card-rotate')) {
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
            if (e.key === 'Escape' && !elements.infoModal.classList.contains('hidden')) {
                hideModal();
            }
        });

        if (window.innerWidth <= 768) {
            elements.sidebar.classList.add('minimized');
        }
    }

    function toggleSidebar() {
        elements.sidebar.classList.toggle('minimized');
        saveSidebarState();
    }

    function loadSidebarState() {
        const isMinimized = localStorage.getItem(CONFIG.sidebarStateKey) === 'minimized';
        if (isMinimized || window.innerWidth <= 768) {
            elements.sidebar.classList.add('minimized');
        }
    }

    function saveSidebarState() {
        const state = elements.sidebar.classList.contains('minimized') ? 'minimized' : 'expanded';
        localStorage.setItem(CONFIG.sidebarStateKey, state);
    }

    function randomizeRotatingCard() {
        // Card 1 - CAI topics rotation
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
        
        // Card 2 - CAI advanced topics rotation
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

    function showModal() {
        elements.infoModal.classList.remove('hidden');
    }

    function hideModal() {
        elements.infoModal.classList.add('hidden');
    }

    function startNewChat() {
        if (conversationHistory.length === 0) return;
        
        conversationHistory = [];
        elements.messagesArea.innerHTML = '';
        localStorage.removeItem(CONFIG.storageKey);
        
        showWelcomeScreen();
        elements.messageInput.value = '';
        elements.messageInput.focus();
    }

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
        const container = document.getElementById('chat-container');
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
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

        hideWelcomeScreen();
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
            
            const errorMessage = `I'm having trouble connecting right now. Please try again in a moment.\n\nIf this persists, you can reach out via the website at veritasquaesitorcai.github.io`;
            
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
