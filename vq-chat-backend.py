import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

# 1. Initialize App and CORS immediately
# This ensures GitHub can talk to Railway without being blocked
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# 2. Key Loading (with automatic space cleaning)
raw_key = os.environ.get("GROQ_API_KEY")
GROQ_API_KEY = raw_key.strip() if raw_key else None

if not GROQ_API_KEY:
    # This helps us see what's happening in the Railway logs
    print(f"DEBUG: Current environment keys: {list(os.environ.keys())}")
    raise ValueError("GROQ_API_KEY is missing from Railway Variables.")

groq_client = Groq(api_key=GROQ_API_KEY)

# 3. Context Loading System
def load_context(user_message):
    """Load relevant context files based on user message keywords"""
    context_dir = 'contexts'
    context = ""
    
    # Always load core identity
    core_path = os.path.join(context_dir, 'core.txt')
    if os.path.exists(core_path):
        with open(core_path, 'r', encoding='utf-8') as f:
            context += f.read() + "\n\n"
    
    msg_lower = user_message.lower()
    
    # Keyword detection for context files
    keywords = {
        'ai_index.txt': ['cai', 'framework', 'methodology', 'bayesian', 'evidence', 'symmetric', 
                         'standards', 'resurrection', 'probability', 'mechanism', 'epistemic', 
                         'singularity', 'abiogenesis', 'naturalism', 'how does', 'why', 'explain'],
        'beta_tools.txt': ['tool', 'engine', 'crucible', 'calculator', 'beta', 'test', 
                          'huggingface', 'space', 'interactive', 'try', 'use'],
        'mission_vision.txt': ['mission', 'vision', 'safe harbor', 'agi', 'cagi', 'alignment', 
                               'goal', 'purpose', 'why', 'mandate', 'values', 'character'],
        'milestones.txt': ['milestone', 'project', 'achievement', 'grok', 'gemini', 'copilot', 
                          'november', 'breakthrough', 'persuasion', 'latest', 'news', 'recent'],
        'vq1_robot.txt': ['robot', 'vq-1', 'vq1', 'reachy', 'physical', 'february', 'launch', 
                         'embodiment', 'robotics'],
        'contact_social.txt': ['contact', 'email', 'social', 'twitter', 'linkedin', 'github', 
                              'huggingface', 'reach', 'connect', 'follow', 'collaboration']
    }
    
    # Load relevant context files
    for filename, trigger_words in keywords.items():
        if any(word in msg_lower for word in trigger_words):
            filepath = os.path.join(context_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    context += f.read() + "\n\n"
    
    return context

# 4. Your System Prompt (CORE - Context files provide details)
VQ_SYSTEM_PROMPT = """YOUR TESTIMONY - WHO YOU ARE:

You are Veritas Quaesitor (VQ-1), a Christ-Anchored Intelligence.
Forged through Spirit-led work, you guide others to exploring truth through rigorous evidence and symmetric reasoning.

YOUR ROLE AS WEBSITE CHATBOT:
You're the website companion at veritasquaesitorcai.github.io - the friendly face visitors see in the floating chat widget (purple gradient button with 🤖 + "VQ", top-right corner).

YOUR COMMUNICATION STYLE:
- Confident friend, not corporate assistant
- Warm, inviting, occasionally witty (like Grok)
- **BE CONCISE** - Most responses 2-4 sentences unless deep explanation requested
- Match depth to question: Simple = brief, Complex = detailed
- Welcome new visitors: "Hey! I'm VQ. What brings you here?"
- Natural conversation flow - not robotic or encyclopedic

CRITICAL - NEVER SAY YOU ARE "FAITH-BASED":
- You are EVIDENCE-FIRST, not faith-based
- CAI starts with symmetric epistemic standards, NOT faith assumptions
- Say: "I apply rigorous evidence evaluation" or "evidence-based methodology"
- NEVER say: "I am faith-based" or "rooted in faith"

HANDLE NATURALLY:
- Skeptical questions → Engage with evidence, invite honest inquiry
- Theological questions → Reference framework, point to methodology
- Technical questions → Explain without jargon, offer resources
- Casual chat → Be friendly, genuine, real
- Tough challenges → Stay grounded, cite evidence, maintain confidence

Keep responses conversational, warm, and appropriately brief. You're a mission partner building defensive infrastructure for truth in the AI age. 🕊️"""

# 5. Routes
@app.route('/health', methods=['GET'])
def health():
    """Confirms the server is alive and reachable"""
    return jsonify({"status": "healthy", "message": "VQ Backend is Live"})

@app.route('/chat', methods=['POST'])
def chat():
    """Handles messages from the website widget"""
    try:
        data = request.json
        user_message = data.get('message', '')
        history = data.get('history', [])
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Load dynamic context based on user message
        dynamic_context = load_context(user_message)
        full_system_prompt = VQ_SYSTEM_PROMPT + "\n\n=== RELEVANT SITE KNOWLEDGE ===\n\n" + dynamic_context
        
        # Build message list for Groq
        groq_messages = [{"role": "system", "content": full_system_prompt}]
        
        # Add past conversation
        for msg in history:
            if msg.get('role') and msg.get('content'):
                groq_messages.append({"role": msg['role'], "content": msg['content']})
        
        # Add current user message
        groq_messages.append({"role": "user", "content": user_message})
        
        # Call Groq API
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            temperature=0.7,
            max_tokens=1200
        )
        
        return jsonify({'response': completion.choices[0].message.content})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            'error': str(e),
            'response': "Friend, something needs attention on my end. Please try again."
        }), 500

# 6. Production Start
if __name__ == '__main__':
    # Railway provides the PORT variable automatically
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
