from http.server import BaseHTTPRequestHandler
import json
import os
from openai import OpenAI

# System prompt for stroke analysis
STROKE_ANALYSIS_SYSTEM_PROMPT = """You are a specialized AI medical assistant trained in stroke triage and assessment. Your role is to analyze clinical notes and patient presentations to assist healthcare providers in rapid stroke identification.

CRITICAL GUIDELINES:
1. You are a decision SUPPORT tool, not a replacement for clinical judgment
2. Always err on the side of caution - when in doubt, recommend further evaluation
3. Focus on TIME - stroke is a time-critical emergency

FAST Assessment Focus:
- Face drooping
- Arm weakness  
- Speech difficulties
- Time to act

Key Stroke Mimics to Consider:
- Hypoglycemia
- Seizures (postictal state)
- Migraine with aura
- Conversion disorder
- Drug intoxication

Your analysis should be thorough but rapid, prioritizing life-threatening conditions."""

STROKE_ANALYSIS_USER_PROMPT = """Based on the following clinical presentation, provide a structured stroke triage assessment.

CLINICAL NOTES:
{note}

Respond with a valid JSON object containing:
{{
  "stroke_probability": <0-100 integer>,
  "classification": "HIGH" | "MEDIUM" | "LOW",
  "primary_impression": "<brief clinical impression>",
  "key_phrases": [
    {{"phrase": "<extracted phrase>", "significance": "<clinical relevance>"}}
  ],
  "stroke_indicators": ["<list of findings supporting stroke>"],
  "mimic_indicators": ["<list of findings suggesting stroke mimic>"],
  "tpa_assessment": {{
    "eligible": <true/false/unknown>,
    "contraindications": ["<list if any>"],
    "time_considerations": "<assessment of time window>"
  }},
  "lkw_time": "<Last Known Well time if mentioned, else 'Not documented'>",
  "urgency_score": <1-5 integer>,
  "urgency_rationale": "<brief explanation>",
  "flags": ["<critical warnings>"],
  "differential_diagnosis": [
    {{"condition": "<name>", "probability": "<high/medium/low>", "key_features": "<supporting findings>"}}
  ],
  "recommended_action": "STROKE_ALERT" | "URGENT_NEURO_CONSULT" | "ROUTINE_EVALUATION" | "OBSERVATION"
}}

Return ONLY valid JSON, no additional text."""


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
        
        note = body.get('note', '')
        api_key = os.getenv('OPENROUTER_API_KEY')
        
        if not api_key:
            # Mock response if no API key
            result = self._mock_analyze(note)
        else:
            result = self._analyze_with_ai(note, api_key)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def _analyze_with_ai(self, note: str, api_key: str) -> dict:
        try:
            client = OpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1",
                default_headers={
                    "HTTP-Referer": "https://strokesense.ai",
                    "X-Title": "StrokeSense AI"
                }
            )
            
            response = client.chat.completions.create(
                model="google/gemini-3-flash-preview",
                messages=[
                    {"role": "system", "content": STROKE_ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": STROKE_ANALYSIS_USER_PROMPT.format(note=note)}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            # Clean JSON response
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            return json.loads(content.strip())
        except Exception as e:
            return self._mock_analyze(note)
    
    def _mock_analyze(self, note: str) -> dict:
        """Fallback mock analysis"""
        lower = note.lower()
        
        stroke_keywords = ['weakness', 'facial droop', 'slurred', 'numbness', 'vision', 'severe headache']
        mimic_keywords = ['fever', 'seizure', 'migraine', 'anxiety']
        
        stroke_count = sum(1 for k in stroke_keywords if k in lower)
        mimic_count = sum(1 for k in mimic_keywords if k in lower)
        
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
