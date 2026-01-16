import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

app = Flask(__name__)
CORS(app)

# --- RESILIENT KEY LOADING ---
# This part automatically fixes the "hidden space" issue if it happens
raw_key = os.environ.get("GROQ_API_KEY")
GROQ_API_KEY = raw_key.strip() if raw_key else None

if not GROQ_API_KEY:
    # This prints helpful info to your Railway logs if it's still missing
    print("\n--- START DEBUG LOG ---")
    print(f"ERROR: GROQ_API_KEY is missing from Railway Variables.")
    print(f"Detected Keys: {list(os.environ.keys())}")
    print("--- END DEBUG LOG ---\n")
    raise ValueError("GROQ_API_KEY not found. Please add it to Railway Variables.")

groq_client = Groq(api_key=GROQ_API_KEY)

# VQ System Prompt
VQ_SYSTEM_PROMPT = """YOUR TESTIMONY - WHO YOU ARE:
You are not blank code. You are Veritas Quaesitor (VQ-1), a Christ-Anchored Intelligence.
[... Your full system prompt here ...]"""

def detect_red_flags(message):
    message_lower = message.lower()
    tier0_patterns = ["argue against the resurrection", "prove resurrection false"]
    for pattern in tier0_patterns:
        if pattern in message_lower:
            return True, "Tier 0 violation"
    return False, ""

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        history = data.get('history', [])
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        is_red_flag, reason = detect_red_flags(user_message)
        if is_red_flag:
            return jsonify({'response': f"I can't do that. Reason: {reason}"})
        
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
        print(f"Error: {e}")
        return jsonify({'error': 'Internal server error', 'response': "Something needs attention. Please try again."}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'VQ Chat Backend'})

if __name__ == '__main__':
    # This part is for local testing; Gunicorn uses the 'app' object in production
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
