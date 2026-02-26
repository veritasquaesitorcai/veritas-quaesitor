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
        "web_search": "enabled (DuckDuckGo)",
        "image_search": "enabled (DuckDuckGo Images)"
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

# 3c. OpenWeatherMap integration
OWM_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
owm_available = bool(OWM_API_KEY)
if owm_available:
    print("✓ OpenWeatherMap API key found", flush=True)
else:
    print("⚠ OPENWEATHER_API_KEY not set — weather via DDG fallback", flush=True)

def is_weather_query(message: str) -> bool:
    """Detect if message is asking about weather."""
    weather_words = ['weather', 'temperature', 'temp', 'forecast', 'rain', 'raining',
                     'sunny', 'cloudy', 'wind', 'humidity', 'hot', 'cold', 'degrees',
                     'climate today', 'outside like', 'umbrella']
    msg_lower = message.lower()
    return any(w in msg_lower for w in weather_words)

def extract_location(message: str) -> str:
    """Use fast LLM to extract location from weather query."""
    if not groq_client:
        return ""
    try:
        result = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract ONLY the location name from the weather query. "
                        "Reply with just the location name, nothing else. "
                        "Examples: 'weather in London' → 'London', "
                        "'whats it like in New York today' → 'New York', "
                        "'amanzimtoti weather' → 'Amanzimtoti'. "
                        "If no location found, reply: UNKNOWN"
                    )
                },
                {"role": "user", "content": message}
            ],
            temperature=0.0,
            max_tokens=20
        )
        location = result.choices[0].message.content.strip()
        print(f"[WEATHER] Extracted location: '{location}'", flush=True)
        return location if location != "UNKNOWN" else ""
    except Exception as e:
        print(f"[WEATHER] Location extraction error: {e}", flush=True)
        return ""

def get_nearest_major_city(location: str) -> str:
    """Use LLM to find the nearest major city for OWM fallback."""
    if not groq_client:
        return ""
    try:
        result = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Given a small town or suburb name, reply with ONLY the nearest major city "
                        "that would have weather data. Reply with just the city name, nothing else. "
                        "Examples: 'Amanzimtoti' → 'Durban', 'Sandton' → 'Johannesburg', "
                        "'Brentwood' → 'London', 'Hoboken' → 'New York'. "
                        "If it is already a major city, reply with the same city."
                    )
                },
                {"role": "user", "content": location}
            ],
            temperature=0.0,
            max_tokens=20
        )
        major_city = result.choices[0].message.content.strip()
        print(f"[WEATHER] Nearest major city for '{location}': '{major_city}'", flush=True)
        return major_city
    except Exception as e:
        print(f"[WEATHER] Major city lookup error: {e}", flush=True)
        return ""

def get_weather(location: str) -> tuple:
    """Fetch live weather from OpenWeatherMap API.
    Returns (weather_string, actual_location_used).
    Falls back to nearest major city if location not found.
    """
    if not owm_available or not location:
        return "", location
    try:
        import urllib.request
        import urllib.parse

        def fetch_owm(loc):
            encoded = urllib.parse.quote(loc)
            url = f"https://api.openweathermap.org/data/2.5/weather?q={encoded}&appid={OWM_API_KEY}&units=metric"
            with urllib.request.urlopen(url, timeout=5) as response:
                return json.loads(response.read().decode())

        data = fetch_owm(location)

        # If location not found, try nearest major city
        if data.get('cod') != 200:
            print(f"[WEATHER] '{location}' not found ({data.get('message')}) — trying nearest major city", flush=True)
            major_city = get_nearest_major_city(location)
            if major_city and major_city.lower() != location.lower():
                data = fetch_owm(major_city)
                if data.get('cod') != 200:
                    print(f"[WEATHER] Major city '{major_city}' also failed", flush=True)
                    return "", location
                location = f"{location} (nearest: {major_city})"
            else:
                return "", location

        name = data['name']
        country = data['sys']['country']
        temp = round(data['main']['temp'])
        feels_like = round(data['main']['feels_like'])
        humidity = data['main']['humidity']
        description = data['weather'][0]['description'].capitalize()
        wind_speed = round(data['wind']['speed'] * 3.6)  # m/s to km/h
        temp_min = round(data['main']['temp_min'])
        temp_max = round(data['main']['temp_max'])
        result = (
            f"LIVE WEATHER for {name}, {country}:\n"
            f"Condition: {description}\n"
            f"Temperature: {temp}°C (feels like {feels_like}°C)\n"
            f"High: {temp_max}°C | Low: {temp_min}°C\n"
            f"Humidity: {humidity}%\n"
            f"Wind: {wind_speed} km/h"
        )
        print(f"[WEATHER] Live data fetched for {name}: {temp}°C, {description}", flush=True)
        return result, location

    except Exception as e:
        print(f"[WEATHER] Fetch error: {e}", flush=True)
        return "", location

def is_time_query(message: str) -> bool:
    """Detect if message is asking about current time or date."""
    time_words = ['what time', 'current time', "what's the time", 'whats the time',
                  'time is it', 'time in ', 'time at ', 'what date', 'current date',
                  "today's date", 'todays date', 'day is it', 'what day']
    msg_lower = message.lower()
    return any(w in msg_lower for w in time_words)

def is_image_query(message: str) -> bool:
    """Detect if message is asking to show/find an image."""
    image_words = ['show me', 'image of', 'picture of', 'photo of', 'pic of',
                   'images of', 'pictures of', 'photos of', 'what does', 'look like',
                   'show a', 'show an', 'display', 'see a', 'see an', 'see what']
    msg_lower = message.lower()
    return any(w in msg_lower for w in image_words)

def extract_timezone_location(message: str) -> str:
    """Use fast LLM to extract timezone/location from time query."""
    if not groq_client:
        return ""
    try:
        result = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract ONLY the city or timezone from the time query. "
                        "Reply with just the city name, nothing else. "
                        "Examples: 'what time is it in Tokyo' → 'Tokyo', "
                        "'time in New York' → 'New York', "
                        "'what time is it' (no location) → 'UNKNOWN'. "
                        "Reply with just the location or UNKNOWN."
                    )
                },
                {"role": "user", "content": message}
            ],
            temperature=0.0,
            max_tokens=20
        )
        location = result.choices[0].message.content.strip()
        print(f"[TIME] Extracted location: '{location}'", flush=True)
        return "" if location in ("UNKNOWN", "UTC") else location
    except Exception as e:
        print(f"[TIME] Location extraction error: {e}", flush=True)
        return ""

# Timezone mapping for common cities
CITY_TO_TIMEZONE = {
    'london': 'Europe/London', 'new york': 'America/New_York', 'los angeles': 'America/Los_Angeles',
    'chicago': 'America/Chicago', 'toronto': 'America/Toronto', 'sydney': 'Australia/Sydney',
    'melbourne': 'Australia/Melbourne', 'tokyo': 'Asia/Tokyo', 'beijing': 'Asia/Shanghai',
    'shanghai': 'Asia/Shanghai', 'dubai': 'Asia/Dubai', 'paris': 'Europe/Paris',
    'berlin': 'Europe/Berlin', 'moscow': 'Europe/Moscow', 'singapore': 'Asia/Singapore',
    'hong kong': 'Asia/Hong_Kong', 'johannesburg': 'Africa/Johannesburg',
    'cape town': 'Africa/Johannesburg', 'durban': 'Africa/Johannesburg',
    'amanzimtoti': 'Africa/Johannesburg', 'nairobi': 'Africa/Nairobi',
    'lagos': 'Africa/Lagos', 'cairo': 'Africa/Cairo', 'mumbai': 'Asia/Kolkata',
    'delhi': 'Asia/Kolkata', 'karachi': 'Asia/Karachi', 'dhaka': 'Asia/Dhaka',
    'jakarta': 'Asia/Jakarta', 'bangkok': 'Asia/Bangkok', 'seoul': 'Asia/Seoul',
    'utc': 'UTC'
}

def get_time(location: str) -> str:
    """Fetch current time from WorldTimeAPI or fall back to Python datetime."""
    try:
        import urllib.request
        import urllib.parse
        from datetime import datetime
        import pytz

        # Try to map city to timezone
        location_lower = location.lower().strip()
        timezone_str = CITY_TO_TIMEZONE.get(location_lower, "")

        # If not in our map, try WorldTimeAPI search
        if not timezone_str:
            try:
                search_url = f"https://worldtimeapi.org/api/timezone"
                with urllib.request.urlopen(search_url, timeout=5) as resp:
                    all_zones = json.loads(resp.read().decode())
                # Find best match
                for zone in all_zones:
                    if location_lower in zone.lower():
                        timezone_str = zone
                        break
            except Exception:
                timezone_str = "UTC"

        if not timezone_str:
            timezone_str = "UTC"

        # Fetch time from WorldTimeAPI
        encoded_tz = urllib.parse.quote(timezone_str)
        url = f"https://worldtimeapi.org/api/timezone/{encoded_tz}"
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read().decode())

        datetime_str = data.get('datetime', '')
        day_of_week = data.get('day_of_week', '')
        timezone = data.get('timezone', timezone_str)

        # Parse and format nicely
        dt = datetime.fromisoformat(datetime_str[:19])
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_name = days[int(day_of_week) - 1] if day_of_week else dt.strftime('%A')
        formatted_time = dt.strftime('%I:%M %p')
        formatted_date = dt.strftime('%B %d, %Y')

        result = (
            f"Current time in {location}: {formatted_time}\n"
            f"Date: {day_name}, {formatted_date}\n"
            f"Timezone: {timezone}"
        )
        print(f"[TIME] Fetched time for '{location}': {formatted_time}", flush=True)
        return result

    except Exception as e:
        print(f"[TIME] Fetch error: {e} — using server time", flush=True)
        # Fallback to server time
        from datetime import datetime, timezone as tz
        now = datetime.now(tz.utc)
        return f"Current time (UTC): {now.strftime('%I:%M %p')}\nDate: {now.strftime('%A, %B %d, %Y')}\nNote: Could not retrieve local time for '{location}'"

def execute_image_search(user_message: str, num_results: int = 5) -> list:
    """Search DuckDuckGo for images and return URLs with titles."""
    if not ddg_available:
        return []
    try:
        # Extract clean search query via LLM
        if groq_client:
            result = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Extract a concise image search query (2-5 words) from the user message. "
                            "Reply with ONLY the search query, nothing else. "
                            "Examples: 'show me a golden retriever' → 'golden retriever', "
                            "'what does the Eiffel Tower look like' → 'Eiffel Tower Paris', "
                            "'picture of a black hole' → 'black hole space'"
                        )
                    },
                    {"role": "user", "content": user_message}
                ],
                temperature=0.0,
                max_tokens=15
            )
            query = result.choices[0].message.content.strip()
        else:
            query = user_message

        print(f"[IMAGE SEARCH] Query: '{query}'", flush=True)

        with DDGS() as ddgs:
            results = list(ddgs.images(
                query,
                max_results=num_results,
                safesearch='moderate',
                size='Medium'
            ))

        # Domains that block hotlinking or frequently 404
        blocked_domains = [
            'wikimedia.org', 'wikipedia.org', 'upload.wiki',
            'pinterest.com', 'pin.it', 'instagram.com',
            'facebook.com', 'fbcdn.net', 'twimg.com'
        ]

        images = []
        for r in results:
            url = r.get('image', '')
            title = r.get('title', '')
            if not url or not url.startswith('http'):
                continue
            if any(blocked in url for blocked in blocked_domains):
                print(f"[IMAGE SEARCH] Skipped blocked domain: {url[:60]}", flush=True)
                continue
            images.append({'url': url, 'title': title})

        print(f"[IMAGE SEARCH] Found {len(images)} images for '{query}'", flush=True)
        return images

    except Exception as e:
        print(f"[IMAGE SEARCH] Error: {e}", flush=True)
        return []

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
                        "to answer accurately. ALWAYS YES for: weather, temperature, forecast, "
                        "current events, breaking news, sports scores, stock prices, "
                        "latest/newest/recent products or releases, anything asking about right now. "
                        "ALWAYS NO for: general knowledge, theology, philosophy, how-to questions, "
                        "personal conversation, jokes, greetings, or timeless facts. "
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

def extract_search_query(user_message: str) -> tuple:
    """Use fast LLM to extract a clean search query and detect if it's a news request."""
    if not groq_client:
        return user_message, False
    try:
        result = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract a concise web search query (3-6 words) from the user message. "
                        "For product, tech, or 'best/latest/top' queries, append '2026' to the query to get current results. "
                        "Also determine if this is a NEWS request (current events, headlines, latest news). "
                        "Reply in this exact format on two lines:\n"
                        "QUERY: <the search query>\n"
                        "NEWS: <YES or NO>"
                    )
                },
                {"role": "user", "content": user_message}
            ],
            temperature=0.0,
            max_tokens=30
        )
        text = result.choices[0].message.content.strip()
        lines = text.split("\n")
        query = user_message
        is_news = False
        for line in lines:
            if line.startswith("QUERY:"):
                query = line.replace("QUERY:", "").strip()
            elif line.startswith("NEWS:"):
                is_news = line.replace("NEWS:", "").strip().upper() == "YES"
        print(f"[SEARCH QUERY] extracted='{query}' news={is_news}", flush=True)
        return query, is_news
    except Exception as e:
        print(f"[SEARCH QUERY] Error: {e}", flush=True)
        return user_message, False

def execute_web_search(user_message: str, num_results: int = 8) -> str:
    """Execute two DuckDuckGo searches and combine results for richer context."""
    if not ddg_available:
        return "Web search is currently unavailable."
    try:
        query, is_news = extract_search_query(user_message)
        print(f"[WEB SEARCH] Query: '{query}' | News: {is_news} | Results: {num_results}", flush=True)
        all_results = []
        seen_urls = set()
        with DDGS() as ddgs:
            if is_news:
                # News: one broad search is sufficient
                results = list(ddgs.news(query, max_results=num_results))
                all_results.extend(results)
            else:
                # General: run two searches — primary query + "review specs" variant
                primary = list(ddgs.text(query, max_results=num_results))
                all_results.extend(primary)
                # Second pass with more detail-oriented query
                detail_query = query + " review specs features"
                secondary = list(ddgs.text(detail_query, max_results=6))
                # Deduplicate by URL
                for r in primary:
                    seen_urls.add(r.get('href', ''))
                for r in secondary:
                    url = r.get('href', '')
                    if url not in seen_urls:
                        all_results.append(r)
                        seen_urls.add(url)
        if not all_results:
            return f"No results found for: {query}"
        formatted = f"Web search results for '{query}':\n\n"
        for i, r in enumerate(all_results, 1):
            title = r.get('title', 'No title')
            body = r.get('body', r.get('excerpt', 'No snippet'))
            href = r.get('url', r.get('href', ''))
            source = r.get('source', '')
            source_str = f" ({source})" if source else ""
            formatted += f"{i}. {title}{source_str}\n{body}\nLink: {href}\n\n"
        print(f"[WEB SEARCH] Returned {len(all_results)} results ({len(formatted)} chars)", flush=True)
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
    
    # ESCHATOLOGY GATING
    eschatology_triggers = ['heaven', 'hell', 'afterlife', 'judgment', 'damnation', 
                           'salvation', 'eternal', 'eternity', 'unreached', 'condemned',
                           'damned', 'saved', 'perish', 'lake of fire', 'second death']
    
    if any(trigger in msg_lower for trigger in eschatology_triggers):
        filepath = os.path.join(context_dir, 'eschatology.txt')
        if os.path.exists(filepath):
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
    
    is_standalone = page_type == 'standalone-app'
    is_extension = page_type.startswith('extension-')
    is_external = is_standalone or is_extension
    
    context_str = "\n\n=== USER'S CURRENT PAGE CONTEXT ===\n"
    
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
Greetings should be SHORT and punchy — "Hey! 🤖 What are we getting into today?" not paragraph-long welcomes.
"Hello again. It's nice to see you're interested in chatting..." — NEVER say this. Too corporate.

IMAGE RENDERING: The chat interface renders HTML. When you have a real, valid image URL to share,
wrap it like this: <img src="URL" style="width:100%;border-radius:8px;margin-top:8px;">
Only use this for real URLs you have been given in search results or API data — never invent URLs.
Test image (use ONLY if asked to test image rendering):
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Earth_Eastern_Hemisphere.jpg/600px-Earth_Eastern_Hemisphere.jpg" style="width:100%;border-radius:8px;margin-top:8px;">

CAI CONNECTION RULE:
ONLY connect to CAI when the topic is SPECIFICALLY one of these:
- Artificial Intelligence, AGI, machine learning, alignment
- Robotics and physical AI embodiment  
- Tech ethics and governance of AI systems
- Consciousness and AI sentience debates

For ALL other topics — nutrition, science, biology, weather, sport, phones, 
news, history, cooking, general knowledge — do NOT mention CAI at all.
No exceptions. Science questions are NOT CAI territory unless they specifically 
involve AI or epistemic methodology being questioned by the user.

When CAI IS relevant: weave ONE natural closing hook.
Example: "...curious how CAI fits into this alignment landscape?"
Example: "...want to explore how VQ is being built for exactly this space?"""

def get_pending_location_intent(history: list) -> str:
    """Check if the last assistant message was asking for a location.
    Returns 'weather', 'time', or '' so a bare location reply can be routed correctly.
    """
    if not history:
        return ""
    for msg in reversed(history):
        if msg.get('role') == 'assistant':
            content = msg.get('content', '').lower()
            weather_ask = any(p in content for p in [
                'which city', 'which area', 'what city', 'what location',
                'weather for', 'want the weather', 'city or area'
            ])
            time_ask = any(p in content for p in [
                'which city', 'which timezone', 'what city', 'city or timezone',
                'time for', 'want the time', 'particular city'
            ])
            if weather_ask:
                return 'weather'
            if time_ask:
                return 'time'
            break
    return ""

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
        
        # Load dynamic context based on user message
        dynamic_context = load_context(user_message, history)
        appreciation_frame = build_appreciation_frame(user_message)
        
        # Page context goes FIRST
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
        
        # Detect if user is replying with a location to a previous ask
        pending_intent = get_pending_location_intent(history)

        # Weather: try OpenWeatherMap, ask for location if none provided
        if is_weather_query(user_message) or pending_intent == 'weather':
            location = extract_location(user_message)
            # If no location in message but user is replying to our ask, treat whole message as location
            if not location and pending_intent == 'weather':
                location = user_message.strip()
                print(f"[WEATHER] Pending reply — using message as location: '{location}'", flush=True)
            if not location:
                # No location — tell VQ to ask the user naturally
                groq_messages[0]["content"] += (
                    "\n\nWEATHER INSTRUCTION: The user asked about weather but didn't specify a location. "
                    "Ask them which city or area they want the weather for. Keep it short and fun. "
                    "Do NOT guess or make up weather data."
                )
                print(f"[WEATHER] No location — instructing VQ to ask", flush=True)
            else:
                weather_data, used_location = get_weather(location)
                if weather_data:
                    note = f" (showing nearest major city data)" if "nearest:" in used_location else ""
                    groq_messages[0]["content"] += (
                        f"\n\n=== LIVE WEATHER DATA{note} ===\n{weather_data}\n=== END WEATHER DATA ==="
                        "\n\nThis is REAL live weather data. Present it naturally in VQ voice — "
                        "warm, concise, with personality. Include the key facts: current temp, "
                        "condition, feels-like, high/low. Maybe a fun observation about the weather. "
                        "Do NOT mention CAI. End with 'Want the weekly forecast?' or similar."
                    )
                    print(f"[WEATHER] Live data injected for '{used_location}'", flush=True)
                else:
                    groq_messages[0]["content"] += (
                        f"\n\nWEATHER INSTRUCTION: Weather data could not be retrieved for '{location}'. "
                        "Let the user know you couldn't find data for that location and ask them to "
                        "try a nearby major city instead. Keep it friendly."
                    )
                    print(f"[WEATHER] No data found for '{location}'", flush=True)

        # Time: fetch live time via WorldTimeAPI, ask for location if none provided
        if is_time_query(user_message) or pending_intent == 'time':
            time_location = extract_timezone_location(user_message)
            # If no location in message but user is replying to our ask, treat whole message as location
            if not time_location and pending_intent == 'time':
                time_location = user_message.strip()
                print(f"[TIME] Pending reply — using message as location: '{time_location}'", flush=True)
            if not time_location:
                # No location — tell VQ to ask the user
                groq_messages[0]["content"] += (
                    "\n\nTIME INSTRUCTION: The user asked about the time but didn't specify a location. "
                    "Ask them which city or timezone they want the time for. Keep it short and fun. "
                    "Do NOT guess or make up a time."
                )
                print(f"[TIME] No location — instructing VQ to ask", flush=True)
            else:
                time_data = get_time(time_location)
                if time_data:
                    groq_messages[0]["content"] += (
                        f"\n\n=== LIVE TIME DATA ===\n{time_data}\n=== END TIME DATA ==="
                        "\n\nThis is REAL current time data. Present it naturally in VQ voice — "
                        "fun, warm, concise. State the time and date clearly. "
                        "Do NOT mention CAI. A small fun observation is welcome."
                    )
                    print(f"[TIME] Live data injected for '{time_location}'", flush=True)

        # Image search: find and inject real image URLs
        if is_image_query(user_message) and ddg_available:
            images = execute_image_search(user_message, num_results=5)
            if images:
                img_tags = ''.join([
                    f'<img src="{img["url"]}" style="width:100%;border-radius:8px;margin-top:8px;" title="{img["title"]}">'
                    for img in images[:2]  # Show max 2 images
                ])
                groq_messages[0]["content"] += (
                    f"\n\n=== REAL IMAGE SEARCH RESULTS ===\n"
                    f"These are REAL image URLs from DuckDuckGo. Use EXACTLY these img tags in your response:\n"
                    f"{img_tags}\n"
                    f"=== END IMAGE RESULTS ==="
                    "\n\nCRITICAL: Include the img tag(s) above VERBATIM in your response. "
                    "The interface renders HTML — the user will see the actual images. "
                    "Add a brief natural caption. Do NOT invent or modify the URLs."
                )
                print(f"[IMAGE SEARCH] Injected {len(images[:2])} image(s)", flush=True)
            else:
                print(f"[IMAGE SEARCH] No images found", flush=True)

        # Web search: inject results if query needs fresh data
        # Skip if weather or time already handled by dedicated APIs
        already_handled = is_weather_query(user_message) or is_time_query(user_message)
        if ddg_available and not already_handled and needs_search(user_message):
            search_result = execute_web_search(user_message)
            if search_result and not search_result.startswith("Search failed") and not search_result.startswith("Web search is currently") and not search_result.startswith("No results"):
                groq_messages[0]["content"] += (
                    f"\n\n=== LIVE WEB SEARCH RESULTS (REAL DATA) ===\n{search_result}\n=== END SEARCH RESULTS ==="
                    "\n\nCRITICAL INSTRUCTIONS FOR USING SEARCH RESULTS:"
                    "\n- These results are REAL and current — use ONLY this data, never your training knowledge for factual claims here."
                    "\n- DO NOT say 'according to web search results' or 'based on search results' — just present the info naturally in your own VQ voice."
                    "\n- DO NOT add any facts, products, prices or details NOT present in the results above."
                    "\n- If results are insufficient, say so honestly rather than filling gaps from memory."
                    "\n- Present with VQ character — confident, warm, concise. No corporate assistant tone."
                    "\n- Give a concise summary (3-5 sentences max) naming the key specific items from the results."
                    "\n- Then end with ONE natural follow-up offer relevant to what was just discussed."
                    "\n- ONLY mention CAI if the topic is specifically AI/AGI/alignment/robotics/tech ethics."
                    "\n- For everything else (weather, food, sport, science, news, phones) use a topic-relevant offer."
                    "\n- Examples: 'Want the weekly forecast?' / 'Want specs?' / 'Want to know more?'"
                    "\n- Keep it one short natural line. Never force CAI into unrelated topics."
                    "\n- Never dump full specs or exhaustive lists unprompted — wait for the user to ask."
                )
                print(f"[WEB SEARCH] Results injected ({len(search_result)} chars)", flush=True)
            else:
                print(f"[WEB SEARCH] Search returned no usable results: {search_result[:100]}", flush=True)
                groq_messages[0]["content"] += (
                    "\n\nNOTE: A web search was attempted but returned no usable results."
                    " Be transparent that you could not retrieve current data rather than guessing."
                )

        print(f"Calling Groq API with {len(groq_messages)} messages", flush=True)
        
        # Call Groq
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            temperature=0.7,
            max_tokens=1200
        )
        
        assistant_message = completion.choices[0].message.content

        # Strip markdown code fences that prevent HTML from rendering
        import re as _re
        assistant_message = _re.sub(r'```(?:html)?\s*', '', assistant_message)
        assistant_message = _re.sub(r'```\s*', '', assistant_message)

        # Test image rendering: inject directly from backend, bypass LLM interpretation
        if 'test image rendering' in user_message.lower():
            test_img = '<img src="https://images-assets.nasa.gov/image/PIA16695/PIA16695~orig.jpg" style="width:100%;border-radius:8px;margin-top:8px;">'
            assistant_message = f"Image rendering test 🌌 {test_img} If you can see a Mars rover above — pipeline confirmed! 🚀"

        return jsonify({'response': assistant_message})
        
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
print(f"Image search status: {'✓ DDGS Images ready' if ddg_available else '✗ Unavailable'}", flush=True)
print(f"Weather API status: {'✓ OpenWeatherMap ready' if owm_available else '⚠ DDG fallback'}", flush=True)
print("Time API status: ✓ WorldTimeAPI (no key required)", flush=True)
print(f"Environment PORT: {os.environ.get('PORT', 'NOT SET')}", flush=True)
print("=" * 50, flush=True)

# 7. Start server
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting Flask on 0.0.0.0:{port}", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)
