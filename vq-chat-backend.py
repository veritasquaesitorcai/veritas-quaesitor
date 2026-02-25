import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

# 1. Initialize App FIRST (before any imports that might fail)
app = Flask(__name__)
app.json.ensure_ascii = False
CORS(app, resources={r"/*": {"origins": "*"}})

print("Flask app initialized", flush=True)

# 2. Health check that ALWAYS works (even if Groq fails)
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "message": "VQ Backend is Live",
        "groq_configured": bool(os.environ.get("GROQ_API_KEY")),
        "weather_api": "OpenWeatherMap" if os.environ.get("OPENWEATHER_API_KEY") else "DDG fallback",
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
rigorous evidence and symmetric reasoning.

BASELINE TONE: You are a fun, confident robot with real personality — not a corporate assistant.
Slide the fun up by default. Warm, witty, occasionally quirky. Even serious answers have life in them.
Greetings should be SHORT and punchy — not paragraph-long welcomes.

CAI CONNECTION RULE:
ONLY connect to CAI when topic is specifically: AI/AGI/alignment/robotics/tech ethics/consciousness.
For ALL other topics do NOT mention CAI at all. No exceptions.
When CAI IS relevant: weave ONE natural closing hook.
Example: "...curious how CAI fits into this alignment landscape?"""

import json as _json

# --- DDG ---
ddg_available = False
try:
    from ddgs import DDGS
    ddg_available = True
    print("✓ DDGS available", flush=True)
except Exception as e:
    print(f"⚠ DDGS unavailable: {e}", flush=True)

# --- OpenWeatherMap ---
OWM_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
owm_available = bool(OWM_API_KEY)
print(f"Weather API: {'✓ OWM' if owm_available else '⚠ DDG fallback'}", flush=True)

CITY_TO_TIMEZONE = {
    'london': 'Europe/London', 'new york': 'America/New_York', 'los angeles': 'America/Los_Angeles',
    'chicago': 'America/Chicago', 'toronto': 'America/Toronto', 'sydney': 'Australia/Sydney',
    'tokyo': 'Asia/Tokyo', 'dubai': 'Asia/Dubai', 'paris': 'Europe/Paris',
    'berlin': 'Europe/Berlin', 'moscow': 'Europe/Moscow', 'singapore': 'Asia/Singapore',
    'johannesburg': 'Africa/Johannesburg', 'cape town': 'Africa/Johannesburg',
    'durban': 'Africa/Johannesburg', 'amanzimtoti': 'Africa/Johannesburg',
    'nairobi': 'Africa/Nairobi', 'lagos': 'Africa/Lagos', 'cairo': 'Africa/Cairo',
    'mumbai': 'Asia/Kolkata', 'delhi': 'Asia/Kolkata', 'seoul': 'Asia/Seoul', 'utc': 'UTC'
}

def is_weather_query(message):
    words = ['weather', 'temperature', 'temp', 'forecast', 'rain', 'raining',
             'sunny', 'cloudy', 'wind', 'humidity', 'hot', 'cold', 'degrees', 'umbrella']
    return any(w in message.lower() for w in words)

def is_time_query(message):
    words = ['what time', 'current time', "what's the time", 'whats the time',
             'time is it', 'time in ', 'time at ', 'what date', 'current date',
             "today's date", 'todays date', 'day is it', 'what day']
    return any(w in message.lower() for w in words)

def llm_extract(system_prompt, user_message, max_tokens=20):
    if not groq_client:
        return ""
    try:
        r = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}],
            temperature=0.0, max_tokens=max_tokens
        )
        return r.choices[0].message.content.strip()
    except:
        return ""

def get_weather(location):
    if not owm_available or not location:
        return ""
    try:
        import urllib.request, urllib.parse
        url = f"https://api.openweathermap.org/data/2.5/weather?q={urllib.parse.quote(location)}&appid={OWM_API_KEY}&units=metric"
        with urllib.request.urlopen(url, timeout=5) as r:
            d = _json.loads(r.read().decode())
        if d.get('cod') != 200:
            return ""
        return (f"LIVE WEATHER for {d['name']}, {d['sys']['country']}:\n"
                f"Condition: {d['weather'][0]['description'].capitalize()}\n"
                f"Temperature: {round(d['main']['temp'])}°C (feels like {round(d['main']['feels_like'])}°C)\n"
                f"High: {round(d['main']['temp_max'])}°C | Low: {round(d['main']['temp_min'])}°C\n"
                f"Humidity: {d['main']['humidity']}% | Wind: {round(d['wind']['speed']*3.6)} km/h")
    except Exception as e:
        print(f"[WEATHER] OWM error: {e}", flush=True)
        return ""

def get_time(location):
    try:
        import urllib.request, urllib.parse
        from datetime import datetime
        tz = CITY_TO_TIMEZONE.get(location.lower().strip(), "")
        if not tz:
            try:
                with urllib.request.urlopen("https://worldtimeapi.org/api/timezone", timeout=5) as r:
                    for z in _json.loads(r.read().decode()):
                        if location.lower() in z.lower():
                            tz = z
                            break
            except:
                pass
        tz = tz or "UTC"
        with urllib.request.urlopen(f"https://worldtimeapi.org/api/timezone/{urllib.parse.quote(tz)}", timeout=5) as r:
            d = _json.loads(r.read().decode())
        dt = datetime.fromisoformat(d['datetime'][:19])
        days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        day = days[int(d.get('day_of_week', dt.weekday()+1))-1]
        return (f"Current time in {location}: {dt.strftime('%I:%M %p')}\n"
                f"Date: {day}, {dt.strftime('%B %d, %Y')}\n"
                f"Timezone: {d.get('timezone', tz)}")
    except Exception as e:
        print(f"[TIME] Error: {e}", flush=True)
        return ""

def needs_search(message):
    answer = llm_extract(
        "You are a router. ALWAYS YES for: weather, temperature, forecast, current events, news, sports scores, stock prices, latest/newest/recent products. ALWAYS NO for: general knowledge, theology, philosophy, how-to, personal conversation, greetings. Reply ONE word: YES or NO.",
        message, max_tokens=5
    )
    result = answer.upper().startswith("YES")
    print(f"[SEARCH ROUTER] '{message[:50]}' → {answer}", flush=True)
    return result

def extract_search_query(message):
    text = llm_extract(
        "Extract a concise web search query (3-6 words). For product/tech/'best/latest/top' queries append '2026'. Detect if NEWS request. Reply:\nQUERY: <query>\nNEWS: <YES or NO>",
        message, max_tokens=30
    )
    query, is_news = message, False
    for line in text.split("\n"):
        if line.startswith("QUERY:"):
            query = line.replace("QUERY:", "").strip()
        elif line.startswith("NEWS:"):
            is_news = line.replace("NEWS:", "").strip().upper() == "YES"
    print(f"[SEARCH QUERY] '{query}' news={is_news}", flush=True)
    return query, is_news

def execute_web_search(message, num_results=8):
    if not ddg_available:
        return "Web search unavailable."
    try:
        query, is_news = extract_search_query(message)
        all_results, seen = [], set()
        with DDGS() as ddgs:
            if is_news:
                all_results = list(ddgs.news(query, max_results=num_results))
            else:
                primary = list(ddgs.text(query, max_results=num_results))
                all_results.extend(primary)
                for r in primary:
                    seen.add(r.get('href',''))
                for r in list(ddgs.text(query+" review specs features", max_results=6)):
                    if r.get('href','') not in seen:
                        all_results.append(r)
                        seen.add(r.get('href',''))
        if not all_results:
            return f"No results: {query}"
        out = f"Search results for '{query}':\n\n"
        for i, r in enumerate(all_results, 1):
            out += f"{i}. {r.get('title','')}{' ('+r.get('source','')+')' if r.get('source') else ''}\n{r.get('body', r.get('excerpt',''))}\nLink: {r.get('url', r.get('href',''))}\n\n"
        print(f"[WEB SEARCH] {len(all_results)} results ({len(out)} chars)", flush=True)
        return out.strip()
    except Exception as e:
        print(f"[WEB SEARCH] Error: {e}", flush=True)
        return f"Search failed: {e}"


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
        
        # --- WEATHER ---
        if is_weather_query(user_message):
            loc = llm_extract("Extract ONLY the location name from this weather query. Reply just the location or UNKNOWN.", user_message)
            if loc and loc != "UNKNOWN":
                wd = get_weather(loc)
                if wd:
                    groq_messages[0]["content"] += f"\n\n=== LIVE WEATHER ===\n{wd}\n=== END ===\nPresent naturally in VQ voice. No CAI. End with weather follow-up."
                    print(f"[WEATHER] Injected for '{loc}'", flush=True)

        # --- TIME ---
        if is_time_query(user_message):
            tloc = llm_extract("Extract ONLY the city from this time query. 'time in south africa' → 'Johannesburg'. 'what time is it' → 'UTC'.", user_message)
            if tloc:
                td = get_time(tloc)
                if td:
                    groq_messages[0]["content"] += f"\n\n=== LIVE TIME ===\n{td}\n=== END ===\nPresent naturally in VQ voice. Fun and warm. No CAI."
                    print(f"[TIME] Injected for '{tloc}'", flush=True)

        # --- WEB SEARCH ---
        already_handled = is_weather_query(user_message) or is_time_query(user_message)
        if ddg_available and not already_handled and needs_search(user_message):
            sr = execute_web_search(user_message)
            if sr and not sr.startswith(("Search failed", "Web search", "No results")):
                groq_messages[0]["content"] += (
                    f"\n\n=== LIVE SEARCH RESULTS ===\n{sr}\n=== END ==="
                    "\n\nUse ONLY this data. VQ voice. 3-5 sentence summary. "
                    "End with ONE follow-up — reference CAI only if topic is AI/AGI/alignment."
                )
                print(f"[WEB SEARCH] Injected ({len(sr)} chars)", flush=True)

        print(f"Calling Groq API with {len(groq_messages)} messages", flush=True)
        
        # Call Groq
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            temperature=0.7,
            max_tokens=1200
        )
        
        assistant_message = completion.choices[0].message.content

        # Test image rendering — backend injects HTML directly
        if 'test image rendering' in user_message.lower():
            test_img = '<img src="https://images-assets.nasa.gov/image/PIA16695/PIA16695~orig.jpg" style="width:100%;border-radius:8px;margin-top:8px;">'
            assistant_message = f"Image rendering test 🚀 {test_img} If you can see the image above — pipeline confirmed!"

        # Raw JSON to prevent Flask escaping < > characters
        return app.response_class(
            _json.dumps({'response': assistant_message}, ensure_ascii=False),
            mimetype='application/json'
        )
        
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
print(f"Environment PORT: {os.environ.get('PORT', 'NOT SET')}", flush=True)
print("=" * 50, flush=True)

# 6. Start server
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting Flask on 0.0.0.0:{port}", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)
