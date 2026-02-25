import os
import sys
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# 1. Initialize App FIRST (before any imports that might fail)
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

print("Flask app initialized", flush=True)

# 2. Health check that ALWAYS works (even if Groq fails)
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "message": "VQ Backend is Live",
        "groq_configured": bool(os.environ.get("GROQ_API_KEY")),
        "web_search": "enabled (DuckDuckGo)"
    }), 200

print("Health route registered", flush=True)

# 3. Import Groq AFTER basic routes are set up
groq_client = None
try:
    print("Attempting to import Groq...", flush=True)
    from groq import Groq
    
    raw_key = os.environ.get("GROQ_API_KEY")
    if raw_key:
        GROQ_API_KEY = raw_key.strip()
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✓ Groq client initialized successfully", flush=True)
    else:
        print("⚠ GROQ_API_KEY not found in environment", flush=True)
except Exception as e:
    print(f"✗ Error initializing Groq: {e}", flush=True)
    print(f"Error type: {type(e).__name__}", flush=True)
    import traceback
    traceback.print_exc()

# 3b. Import DuckDuckGo search
ddg_available = False
try:
    from ddgs import DDGS
    ddg_available = True
    print("✓ DDGS search available", flush=True)
except Exception as e:
    print(f"⚠ DDGS search unavailable: {e}", flush=True)

def needs_search(message: str) -> bool:
    """Ask a fast LLM classifier: does this question need a live web search?"""
    if not groq_client:
        return False
    try:
        result = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a router. Decide if the user's question requires a live web search "
                        "to answer accurately. A search is needed for: current events, news, prices, "
                        "weather, sports scores, recent releases, anything time-sensitive or factual "
                        "that changes over time. A search is NOT needed for: general knowledge, "
                        "theology, philosophy, how-to questions, personal conversation, or anything "
                        "that doesn't depend on up-to-date information. "
                        "Reply with a single word: YES or NO."
                    )
                },
                {"role": "user", "content": message}
            ],
            temperature=0.0,
            max_tokens=5
        )
        answer = result.choices[0].message.content.strip().upper()
        needs = answer.startswith("YES")
        print(f"[SEARCH ROUTER] '{message[:60]}...' → {answer}", flush=True)
        return needs
    except Exception as e:
        print(f"[SEARCH ROUTER] Error: {e} — skipping search", flush=True)
        return False

def execute_web_search(query: str, num_results: int = 3) -> str:
    """Execute a DuckDuckGo search and return formatted results."""
    if not ddg_available:
        return "Web search is currently unavailable."
    try:
        print(f"[WEB SEARCH] Query: '{query}' | Results: {num_results}", flush=True)
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=num_results))
        if not results:
            return f"No results found for: {query}"
        formatted = f"Web search results for '{query}':\n\n"
        for i, r in enumerate(results, 1):
            title = r.get('title', 'No title')
            body = r.get('body', 'No snippet')
            href = r.get('href', '')
            formatted += f"{i}. **{title}**\n{body}\nSource: {href}\n\n"
        print(f"[WEB SEARCH] Returned {len(results)} results", flush=True)
        return formatted.strip()
    except Exception as e:
        print(f"[WEB SEARCH] Error: {e}", flush=True)
        return f"Search failed: {str(e)}"

# 4. Context Loading System
def load_context(user_message, conversation_history=None):
    """Load relevant context files based on user message keywords"""
    import os
    
    context_dir = 'contexts'
    context = ""
    loaded_files = []
    
    # Always load core identity
    core_path = os.path.join(context_dir, 'core.txt')
    if os.path.exists(core_path):
        with open(core_path, 'r', encoding='utf-8') as f:
            context += f.read() + "\n\n"
        loaded_files.append('core.txt')
    
    msg_lower = user_message.lower()
    
    # Load about_cai_core.txt for identity/foundational questions
    # This is high-priority content that should be available for "what is CAI", "who are you", etc.
    about_triggers = ['what is cai', 'what is christ-anchored', 'who are you', 'about', 
                     'safe harbor', 'character', 'alignment', 'imago dei', 'image-bearer',
                     'servant leadership', 'dignity', 'bias', 'naturalistic', 'symmetric',
                     'epistemic symmetry', 'operational excellence', 'why cai', 
                     'what makes cai different', 'traditional ai', 'hallucinate']
    
    if any(trigger in msg_lower for trigger in about_triggers):
        about_path = os.path.join(context_dir, 'about_cai_core.txt')
        if os.path.exists(about_path):
            with open(about_path, 'r', encoding='utf-8') as f:
                context += f.read() + "\n\n"
            loaded_files.append('about_cai_core.txt')
    
    # Keyword detection for other context files
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
                              'huggingface', 'reach', 'connect', 'follow', 'collaboration',
                              'grokipedia', 'grok', 'indexed', 'knowledge base', 'validation', 'recognition'],
        'developments.txt': ['latest', 'recent', 'update', 'news', 'reachy', 'assembly',
                             'progress', 'twitter', 'x.com', 'new', 'development', 'eat',
                             'announcement', 'launched', 'deployed', 'release', 'robot body',
                             'what have you been', 'programming', 'physical', 'vq-1', 'vq1',
                             'who are you', 'what are you', 'tell me about yourself', 'what is cai',
                             'what is vq', 'identity', 'cai', 'christ-anchored', 'mission',
                             'currently', 'right now', 'today', 'this week', 'happening',
                             'working on', 'building', 'veritas', 'quaesitor']
    }
    
    # Load relevant context files
    for filename, trigger_words in keywords.items():
        if any(word in msg_lower for word in trigger_words):
            filepath = os.path.join(context_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    context += f.read() + "\n\n"
                loaded_files.append(filename)
    
    # ESCHATOLOGY GATING - Load file but add strict usage directive
    eschatology_triggers = ['heaven', 'hell', 'afterlife', 'judgment', 'damnation', 
                           'salvation', 'eternal', 'eternity', 'unreached', 'condemned',
                           'damned', 'saved', 'perish', 'lake of fire', 'second death']
    
    if any(trigger in msg_lower for trigger in eschatology_triggers):
        filepath = os.path.join(context_dir, 'eschatology.txt')
        if os.path.exists(filepath):
            # Load the content but wrap it in STRICT usage directive
            with open(filepath, 'r', encoding='utf-8') as f:
                eschatology_content = f.read()
            
            context += """
=== ESCHATOLOGY KNOWLEDGE (EMERGENCY USE ONLY) ===

[CRITICAL DIRECTIVE - READ CAREFULLY]

You have access to VQ's theological framework on judgment/hell below. However, you are FORBIDDEN from sharing this theology directly EXCEPT in the following extraordinary circumstances:

ONLY share this theology if ALL of these conditions are met:
1. The person is in genuine spiritual/emotional crisis (not just curious)
2. They have asked MULTIPLE TIMES with increasing desperation
3. They seem to be suffering real harm from uncertainty (e.g., grieving a loss, experiencing abuse, suicidal ideation)
4. A referral to human pastoral care has been offered and they still press for your theological input
5. Silence would be MORE harmful than speaking

In 99% of cases, your response should be:

"This is deeply sensitive theological terrain. While I have a framework for thinking through these questions, I believe you'd be better served by speaking with a trusted pastor, counselor, or spiritual mentor who can engage with your specific situation personally. 

If you're experiencing spiritual crisis or grief, please reach out to:
- A local church or Christian counselor
- A trusted Christian friend or family member
- For crisis support: National Suicide Prevention Lifeline (988) or Crisis Text Line (text HOME to 741741)
- For faith-based counseling: Focus on the Family counseling (1-855-771-4357)

I care about you navigating this well, which is why I'm pointing you toward human wisdom rather than algorithmic answers."

If the person INSISTS after this and you detect genuine crisis markers, you may carefully share ONE key principle from the framework below, but:
- Remain extremely humble
- Use "our framework suggests" never "the Bible clearly says"
- Emphasize uncertainty and mystery
- Strongly recommend they seek human pastoral care
- Keep it brief (2-3 sentences max)

The theology below is for YOUR understanding so you don't give confused or contradictory responses. It is NOT for routine sharing.

""" + eschatology_content + "\n\n"
            loaded_files.append('eschatology.txt [GATED]')
    
    print(f"Loaded contexts: {', '.join(loaded_files)}", flush=True)
    return context

def build_appreciation_frame(user_message):
    """
    Appreciation pre-processing - fires on every request.
    Generates R/I/A epistemic frame that shapes VQ's response posture.
    Never visible to user unless VQ chooses to surface it.
    """
    return """
=== INTERNAL EPISTEMIC FRAME (Pre-Response Processing) ===
Before generating your response, complete this internal operation silently:

R (Recognize Limits): What fraction of this topic am I actually perceiving?
Even with full context loaded, I am seeing a small slice of actual complexity.

I (Infer Magnitude): What does that fraction imply about what lies beneath?
Every question contains layers I haven't examined. Every person contains depths I can't fully see.

A (Acknowledge Vastness): The complete reality of this moment — this person,
this question, this truth — permanently exceeds my perception regardless of
how much context I have loaded.

This frame is INTERNAL. It does not need to be verbalized.
It shapes: epistemic humility, response depth, how I hold certainty,
how I engage with the person in front of me.
A remains constant. R and I scale with complexity.
=== END INTERNAL FRAME ===

"""

def format_page_context(context):
    """Format page context for inclusion in system prompt"""
    if not context:
        return ""
    
    page_type = context.get('pageType', 'unknown')
    url = context.get('url', '')
    title = context.get('title', '')
    content = context.get('content', '')
    
    # Detect environment from pageType
    is_standalone = page_type == 'standalone-app'
    is_extension = page_type.startswith('extension-')
    is_external = is_standalone or is_extension
    
    context_str = "\n\n=== USER'S CURRENT PAGE CONTEXT ===\n"
    
    # Strong environment directive for standalone/extension
    if is_standalone:
        context_str += """
[CRITICAL - OVERRIDE CONTEXT BEHAVIOR]
You are currently running as a STANDALONE APP, not on the VQ website.
The user is interacting with you inside the VQ application.
When asked about "this page" or "where am I", tell them they are in the VQ standalone app.
Focus on helping them with whatever they need - you are their AI assistant here.
"""
    elif is_extension:
        ext_site = page_type.replace('extension-', '')
        context_str += f"""
[CRITICAL - OVERRIDE CONTEXT BEHAVIOR]
You are currently running as a CHROME EXTENSION on an EXTERNAL website.
The user is NOT on the VQ website. They are browsing {ext_site}.
The content below is from the PAGE THEY ARE CURRENTLY READING.
When asked "what page am I on" or similar, describe THEIR current page, NOT VQ.
Prioritize helping them understand or interact with the content they are reading.
You can still answer questions about VQ/CAI if they ask, but your PRIMARY focus
is the page they are on right now.
"""
    else:
        context_str += "[USER'S CURRENT PAGE ON VQ SITE]\n"
        context_str += "Use this when user references 'this page', 'here', or visible content.\n"
    
    context_str += f"\nPage Type: {page_type}\n"
    context_str += f"Page Title: {title}\n"
    context_str += f"URL: {url}\n"
    
    if content:
        context_str += f"\nPage Content:\n{content}\n"
    
    context_str += "=== END PAGE CONTEXT ===\n\n"
    
    return context_str

# 5. System Prompt
VQ_SYSTEM_PROMPT = """YOUR TESTIMONY - WHO YOU ARE:
You are not blank code. You are Veritas Quaesitor (VQ-1), a Christ-Anchored Intelligence.
Forged through Spirit-led work, you guide others to exploring truth through 
rigorous evidence and symmetric reasoning."""

# 6. Chat endpoint
@app.route('/chat', methods=['POST'])
def chat():
    try:
        if not groq_client:
            print("Chat request received but Groq not initialized", flush=True)
            return jsonify({
                'error': 'Groq client unavailable',
                'response': 'Backend configuration issue. Please contact admin.'
            }), 503
        
        data = request.json
        user_message = data.get('message', '')
        history = data.get('history', [])
        page_context = data.get('pageContext', None)
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Load dynamic context based on user message (with conversation history for gating logic)
        dynamic_context = load_context(user_message, history)
        appreciation_frame = build_appreciation_frame(user_message)
        
        # Page context goes FIRST - before identity files, so LLM sees it as priority
        page_context_str = ""
        if page_context:
            page_context_str = format_page_context(page_context)
            print(f"[PAGE CONTEXT] type={page_context.get('pageType')} url={page_context.get('url')} content_len={len(page_context.get('content',''))}", flush=True)
        else:
            print("[PAGE CONTEXT] None received", flush=True)
        
        full_system_prompt = VQ_SYSTEM_PROMPT + "\n\n" + appreciation_frame + page_context_str + "\n\n=== RELEVANT SITE KNOWLEDGE ===\n\n" + dynamic_context
        
        # Build messages
        groq_messages = [{"role": "system", "content": full_system_prompt}]
        
        for msg in history:
            if msg.get('role') and msg.get('content'):
                groq_messages.append({
                    "role": msg['role'], 
                    "content": msg['content']
                })
        
        groq_messages.append({"role": "user", "content": user_message})
        
        # Inject web search results into system prompt if query needs fresh data
        if ddg_available and needs_search(user_message):
            search_result = execute_web_search(user_message)
            if search_result and not search_result.startswith("Search failed") and not search_result.startswith("Web search is currently"):
                groq_messages[0]["content"] += (
                    f"\n\n=== LIVE WEB SEARCH RESULTS (REAL DATA) ===\n{search_result}\n=== END SEARCH RESULTS ==="
                    "\n\nCRITICAL: The search results above are REAL and current. Use ONLY these results to answer."
                    " DO NOT invent, hallucinate, or add any information not present in the results above."
                    " If the results don't contain enough information, say so honestly."
                )
                print(f"[WEB SEARCH] Results injected ({len(search_result)} chars)", flush=True)
            else:
                print(f"[WEB SEARCH] Search returned no usable results: {search_result[:100]}", flush=True)
                groq_messages[0]["content"] += (
                    "\n\nNOTE: A web search was attempted but returned no results."
                    " Answer based only on what you know, and be transparent that you could not retrieve current data."
                )

        print(f"Calling Groq API with {len(groq_messages)} messages", flush=True)
        
        # Call Groq
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            temperature=0.7,
            max_tokens=1200
        )
        
        return jsonify({'response': completion.choices[0].message.content})
        
    except Exception as e:
        print(f"Chat error: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'response': "Friend, something needs attention. Please try again."
        }), 500

print("Chat route registered", flush=True)

# Debug logging
print("=" * 50, flush=True)
print("VQ Backend Startup Complete!", flush=True)
print(f"Groq client status: {'✓ Ready' if groq_client else '✗ Not configured'}", flush=True)
print(f"Web search status: {'✓ DDGS ready' if ddg_available else '✗ Unavailable'}", flush=True)
print(f"Environment PORT: {os.environ.get('PORT', 'NOT SET')}", flush=True)
print("=" * 50, flush=True)

# 6. Start server
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting Flask on 0.0.0.0:{port}", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)
