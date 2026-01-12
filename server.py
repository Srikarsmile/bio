import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env.local (where the API key is)
load_dotenv(Path(__file__).parent / "nlp" / ".env.local")
load_dotenv()  # Also check .env as fallback

# Import existing analyzer logic
from nlp.analyzer import StrokeAnalyzer, MockStrokeAnalyzer

app = FastAPI(title="StrokeSense AI API")

# Path to the frontend build directory
FRONTEND_DIR = Path(__file__).parent / "frontend" / "dist"

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    note: str
    api_key: Optional[str] = None

class AnalysisResponse(BaseModel):
    stroke_probability: int
    classification: str
    primary_impression: str
    key_phrases: List[Dict[str, str]]
    stroke_indicators: List[str]
    mimic_indicators: List[str]
    tpa_assessment: Dict[str, Any]
    lkw_time: str
    urgency_score: int
    urgency_rationale: str
    flags: List[str]
    differential_diagnosis: List[Dict[str, Any]]
    recommended_action: str
    error: Optional[str] = None

def get_analyzer(api_key: Optional[str] = None):
    """Factory to get the appropriate analyzer."""
    # Prioritize request key, then env var
    key = api_key or os.getenv("OPENROUTER_API_KEY")
    
    if key:
        return StrokeAnalyzer(api_key=key)
    else:
        return MockStrokeAnalyzer()

@app.get("/api/health")
def health_check():
    """Health check endpoint moved to /api/health"""
    return {"status": "active", "version": "2.0.0"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_note(request: AnalyzeRequest):
    """Analyze a clinical note for stroke risk."""
    try:
        if not request.note or not request.note.strip():
            raise HTTPException(status_code=400, detail="Note content cannot be empty")
            
        analyzer = get_analyzer(request.api_key)
        result = analyzer.analyze(request.note)
        
        return result
    except Exception as e:
        # Fallback error handling
        raise HTTPException(status_code=500, detail=str(e))


# Chat endpoint models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    api_key: Optional[str] = None

class ChatResponse(BaseModel):
    message: str
    

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the clinical assistant."""
    from openai import OpenAI
    from nlp.prompts import CLINICAL_CHAT_SYSTEM_PROMPT
    
    key = request.api_key or os.getenv("OPENROUTER_API_KEY")
    
    if not key:
        # Return a mock response if no API key
        return ChatResponse(
            message="Hi! I'm the StrokeSense AI assistant. Please describe the patient's symptoms and I'll help guide the assessment. What symptoms is the patient experiencing?"
        )
    
    try:
        client = OpenAI(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://strokesense.ai",
                "X-Title": "StrokeSense AI"
            }
        )
        
        # Build messages with system prompt
        messages = [{"role": "system", "content": CLINICAL_CHAT_SYSTEM_PROMPT}]
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})
        
        response = client.chat.completions.create(
            model="google/gemini-3-flash-preview",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return ChatResponse(message=response.choices[0].message.content)
        
    except Exception as e:
        return ChatResponse(message=f"I apologize, but I encountered an error: {str(e)}. Please try again.")


# Serve static assets from the frontend build
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve the React SPA for all non-API routes."""
    # First check if it's a static file
    file_path = FRONTEND_DIR / full_path
    if file_path.is_file():
        return FileResponse(file_path)
    
    # Otherwise serve index.html for SPA routing
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    return {"error": "Frontend not built. Run 'npm run build' in the frontend directory."}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
