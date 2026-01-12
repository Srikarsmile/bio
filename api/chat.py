from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

CLINICAL_CHAT_SYSTEM_PROMPT = """You are a clinical stroke assessment assistant. Help healthcare providers gather relevant information for stroke triage. Ask focused questions about FAST symptoms (Face, Arms, Speech, Time). Keep responses concise."""


def chat_with_ai(messages, api_key):
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
        return {"message": "I apologize, but I encountered an error. Please try again."}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            messages = body.get('messages', [])
            api_key = os.environ.get('OPENROUTER_API_KEY', '')
            
            if api_key:
                result = chat_with_ai(messages, api_key)
            else:
                result = {"message": "Hi! I'm the StrokeSense AI assistant. Please describe the patient's symptoms and I'll help guide the assessment."}
            
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
