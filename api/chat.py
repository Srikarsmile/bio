from http.server import BaseHTTPRequestHandler
import json
import os
from openai import OpenAI

CLINICAL_CHAT_SYSTEM_PROMPT = """You are a clinical stroke assessment assistant. Your role is to help healthcare providers gather relevant information for stroke triage.

GUIDELINES:
1. Ask focused questions about stroke symptoms (FAST: Face, Arms, Speech, Time)
2. Gather information about Last Known Well (LKW) time
3. Ask about contraindications for tPA if relevant
4. Keep responses concise and professional
5. Do NOT provide diagnosis - only help gather information
6. When you have enough information, tell the user they can click "Analyze" for the full assessment

Key information to gather:
- Symptom onset time (LKW)
- FAST symptoms (facial droop, arm weakness, speech changes)
- Medical history (anticoagulants, recent surgery, bleeding disorders)
- Current medications
- Blood pressure and vitals if available"""


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
        
        messages = body.get('messages', [])
        api_key = os.getenv('OPENROUTER_API_KEY')
        
        if not api_key:
            # Mock response
            result = {"message": "Hi! I'm the StrokeSense AI assistant. Please describe the patient's symptoms and I'll help guide the assessment. What symptoms is the patient experiencing?"}
        else:
            result = self._chat_with_ai(messages, api_key)
        
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
    
    def _chat_with_ai(self, messages: list, api_key: str) -> dict:
        try:
            client = OpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1",
                default_headers={
                    "HTTP-Referer": "https://strokesense.ai",
                    "X-Title": "StrokeSense AI"
                }
            )
            
            formatted_messages = [{"role": "system", "content": CLINICAL_CHAT_SYSTEM_PROMPT}]
            for msg in messages:
                formatted_messages.append({"role": msg.get("role"), "content": msg.get("content")})
            
            response = client.chat.completions.create(
                model="google/gemini-3-flash-preview",
                messages=formatted_messages,
                temperature=0.7,
                max_tokens=500
            )
            
            return {"message": response.choices[0].message.content}
        except Exception as e:
            return {"message": f"I apologize, but I encountered an error. Please try again."}
