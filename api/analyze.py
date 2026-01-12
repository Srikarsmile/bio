from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

STROKE_ANALYSIS_SYSTEM_PROMPT = """You are a specialized AI medical assistant trained in stroke triage. Analyze clinical notes to assist healthcare providers in rapid stroke identification. Focus on FAST (Face, Arms, Speech, Time) assessment."""

STROKE_ANALYSIS_USER_PROMPT = """Based on the following clinical presentation, provide a structured stroke triage assessment.

CLINICAL NOTES:
{note}

Respond with a valid JSON object containing:
{{
  "stroke_probability": <0-100 integer>,
  "classification": "HIGH" | "MEDIUM" | "LOW",
  "primary_impression": "<brief clinical impression>",
  "key_phrases": [],
  "stroke_indicators": ["<list of findings supporting stroke>"],
  "mimic_indicators": ["<list of findings suggesting stroke mimic>"],
  "tpa_assessment": {{"eligible": "unknown", "contraindications": [], "time_considerations": "<assessment>"}},
  "lkw_time": "<Last Known Well time if mentioned, else 'Not documented'>",
  "urgency_score": <1-5 integer>,
  "urgency_rationale": "<brief explanation>",
  "flags": [],
  "differential_diagnosis": [],
  "recommended_action": "STROKE_ALERT" | "URGENT_NEURO_CONSULT" | "ROUTINE_EVALUATION" | "OBSERVATION"
}}

Return ONLY valid JSON."""


def analyze_with_ai(note, api_key):
    try:
        data = json.dumps({
            "model": "google/gemini-flash-1.5",
            "messages": [
                {"role": "system", "content": STROKE_ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": STROKE_ANALYSIS_USER_PROMPT.format(note=note)}
            ],
            "temperature": 0.3,
            "max_tokens": 2000
        }).encode('utf-8')
        
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://strokesense.vercel.app",
                "X-Title": "StrokeSense AI"
            }
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            content = result['choices'][0]['message']['content']
            
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            return json.loads(content.strip())
    except Exception as e:
        return mock_analyze(note)


def mock_analyze(note):
    lower = note.lower()
    stroke_keywords = ['weakness', 'facial droop', 'slurred', 'numbness', 'vision', 'severe headache']
    mimic_keywords = ['fever', 'seizure', 'migraine', 'anxiety']
    
    stroke_count = sum(1 for k in stroke_keywords if k in lower)
    
    if stroke_count >= 2:
        prob, classification = 75, "HIGH"
    elif stroke_count >= 1:
        prob, classification = 50, "MEDIUM"
    else:
        prob, classification = 25, "LOW"
    
    return {
        "stroke_probability": prob,
        "classification": classification,
        "primary_impression": "Automated assessment based on keywords",
        "key_phrases": [],
        "stroke_indicators": [k for k in stroke_keywords if k in lower],
        "mimic_indicators": [k for k in mimic_keywords if k in lower],
        "tpa_assessment": {"eligible": "unknown", "contraindications": [], "time_considerations": "Verify LKW"},
        "lkw_time": "Not documented",
        "urgency_score": 3 if stroke_count >= 1 else 2,
        "urgency_rationale": "Based on keyword analysis",
        "flags": [],
        "differential_diagnosis": [],
        "recommended_action": "URGENT_NEURO_CONSULT" if stroke_count >= 1 else "ROUTINE_EVALUATION",
        "error": None
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            note = body.get('note', '')
            api_key = os.environ.get('OPENROUTER_API_KEY', '')
            
            if api_key:
                result = analyze_with_ai(note, api_key)
            else:
                result = mock_analyze(note)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
