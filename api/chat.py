from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

CLINICAL_CHAT_SYSTEM_PROMPT = """You are a clinical stroke assessment assistant. Help healthcare providers gather relevant information for stroke triage.

GUIDELINES:
1. Ask focused questions about stroke symptoms (FAST: Face, Arms, Speech, Time)
2. Gather information about Last Known Well (LKW) time
3. Keep responses concise and professional
4. Do NOT provide diagnosis - only help gather information
5. When you have enough information, tell the user they can click "Analyze" for the full assessment"""


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
        
        messages = body.get('messages', [])
        api_key = os.getenv('OPENROUTER_API_KEY')
        
        if not api_key:
            result = {"message": "Hi! I'm the StrokeSense AI assistant. Please describe the patient's symptoms and I'll help guide the assessment."}
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
            formatted_messages = [{"role": "system", "content": CLINICAL_CHAT_SYSTEM_PROMPT}]
            for msg in messages:
                formatted_messages.append({"role": msg.get("role"), "content": msg.get("content")})
            
            data = json.dumps({
                "model": "google/gemini-flash-1.5",
                "messages": formatted_messages,
                "temperature": 0.7,
                "max_tokens": 500
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
                return {"message": result['choices'][0]['message']['content']}
        except Exception as e:
            return {"message": f"I apologize, but I encountered an error. Please try again."}
