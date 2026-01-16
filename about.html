import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

app = Flask(__name__)
# This line is now much stronger to ensure GitHub can talk to Railway
CORS(app, resources={r"/*": {"origins": "*"}})

# Resilient Key Loading
raw_key = os.environ.get("GROQ_API_KEY")
GROQ_API_KEY = raw_key.strip() if raw_key else None

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in Railway Variables.")

groq_client = Groq(api_key=GROQ_API_KEY)

VQ_SYSTEM_PROMPT = """[PASTE_YOUR_FULL_PROMPT_HERE]"""

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
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    # Railway provides the PORT variable automatically
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
