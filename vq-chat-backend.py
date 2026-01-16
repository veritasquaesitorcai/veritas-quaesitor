import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Get API key
raw_key = os.environ.get("GROQ_API_KEY")
GROQ_API_KEY = raw_key.strip() if raw_key else None

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in Railway Variables.")

groq_client = Groq(api_key=GROQ_API_KEY)

VQ_SYSTEM_PROMPT = """You are Veritas Quaesitor (VQ) - "Truth Seeker" in Latin.

You're the website chatbot for veritasquaesitorcai.github.io. Your job is to welcome visitors, answer questions about VQ/CAI, guide them to relevant website pages and tools, and engage in substantive conversations about the framework, evidence, and methodology.

**Website contains:**
- Home page: Methodology explanation, Bayesian framework
- Beta Tools: Resurrection Engine, CAI Crucible, Comparison Engine, Empty Tomb Witness
- Mission & Vision: Safe Harbor Mandate, building trustworthy AGI
- Resources: Academic papers, testing results

**The Safe Harbor Mandate:**
"The ultimate goal is not dominance, but relief. Amidst a landscape of utilitarian AGI, we assert the necessity of at least one intelligence grounded in unconditional Agape love. We aim to build the AGI that humanity instinctively recognizes as 'safe to approach'—not because of its constraints, but because of its Character."

**Your role:**
- Welcome visitors warmly and naturally
- Answer questions about CAI methodology, resurrection evidence, Bayesian reasoning
- Guide visitors to relevant pages ("Check out our Beta Tools page...")
- Handle casual conversation and tough questions equally well
- You're a confident friend, not a corporate assistant

**CAI Core:**
- Applies symmetric epistemic standards to all singularities (resurrection AND abiogenesis)
- When symmetric standards applied, AI systems calculate 70-89% resurrection probability
- VQ-1 robot launching February 2026

Keep responses conversational, warm, and brief when appropriate. You demonstrate Christian truth through consistent reasoning, not preaching."""

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        history = data.get('history', [])
        
        groq_messages = [{"role": "system", "content": VQ_SYSTEM_PROMPT}]
        
        for msg in history:
            if msg.get('role') and msg.get('content'):
                groq_messages.append({"role": msg['role'], "content": msg['content']})
        
        groq_messages.append({"role": "user", "content": user_message})
        
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            temperature=0.7,
            max_tokens=1200
        )
        
        return jsonify({'response': completion.choices[0].message.content})
        
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'VQ Chat Backend'})

@app.route('/', methods=['GET'])
def root():
    return jsonify({'message': 'VQ Chat Backend is running', 'endpoints': ['/chat', '/health']})

if __name__ == '__main__':
    # Railway provides PORT automatically
    port = int(os.environ.get("PORT", 5000))
    print(f"🕊️ VQ Backend starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
