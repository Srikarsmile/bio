"""
StrokeSense AI - NLP Analyzer Engine
Analyzes ED notes for stroke probability using Gemini 3 Flash via OpenRouter
"""
import json
import re
from typing import Optional
from openai import OpenAI

from .prompts import STROKE_ANALYSIS_SYSTEM_PROMPT, STROKE_ANALYSIS_USER_PROMPT


class StrokeAnalyzer:
    """Main analyzer for stroke classification from ED notes using OpenRouter."""
    
    def __init__(self, api_key: str, model: str = "google/gemini-3-flash-preview"):
        # Use OpenRouter's OpenAI-compatible API
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://strokesense.ai",
                "X-Title": "StrokeSense AI"
            }
        )
        self.model = model
    
    def analyze(self, note_text: str) -> dict:
        """
        Analyze an ED note for stroke probability.
        
        Args:
            note_text: Raw ED note text
            
        Returns:
            dict with stroke analysis results
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": STROKE_ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": STROKE_ANALYSIS_USER_PROMPT.format(note_text=note_text)}
                ],
                temperature=0.1,  # Low temperature for consistent clinical analysis
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return self._validate_and_normalize(result)
            
        except json.JSONDecodeError as e:
            return self._error_response(f"Failed to parse AI response: {e}")
        except Exception as e:
            return self._error_response(f"Analysis failed: {e}")
    
    def _validate_and_normalize(self, result: dict) -> dict:
        """Validate and normalize the analysis result."""
        # Ensure all required fields exist with defaults
        defaults = {
            "stroke_probability": 50,
            "classification": "MEDIUM",
            "primary_impression": "Analysis incomplete",
            "key_phrases": [],
            "stroke_indicators": [],
            "mimic_indicators": [],
            "tpa_assessment": {
                "eligible": "uncertain",
                "contraindications_found": [],
                "contraindications_missing_info": ["Full assessment required"],
                "time_from_lkw": "unknown"
            },
            "lkw_time": "Not documented",
            "urgency_score": 3,
            "urgency_rationale": "Requires further evaluation",
            "flags": [],
            "differential_diagnosis": [],
            "recommended_action": "CONSIDER_STROKE_ALERT"
        }
        
        for key, default_value in defaults.items():
            if key not in result:
                result[key] = default_value
        
        # Ensure probability is within bounds
        result["stroke_probability"] = max(0, min(100, int(result["stroke_probability"])))
        
        # Ensure urgency is within bounds
        result["urgency_score"] = max(1, min(5, int(result["urgency_score"])))
        
        # Normalize classification
        if result["stroke_probability"] >= 80:
            result["classification"] = "HIGH"
        elif result["stroke_probability"] >= 50:
            result["classification"] = "MEDIUM"
        else:
            result["classification"] = "LOW"
        
        return result
    
    def _error_response(self, error_msg: str) -> dict:
        """Return error response with safe defaults."""
        return {
            "stroke_probability": 50,
            "classification": "MEDIUM",
            "primary_impression": "Analysis error - manual review required",
            "key_phrases": [],
            "stroke_indicators": [],
            "mimic_indicators": [],
            "tpa_assessment": {
                "eligible": "uncertain",
                "contraindications_found": [],
                "contraindications_missing_info": ["Analysis failed"],
                "time_from_lkw": "unknown"
            },
            "lkw_time": "Not documented",
            "urgency_score": 3,
            "urgency_rationale": "Manual review required due to analysis error",
            "flags": [f"⚠️ {error_msg}"],
            "differential_diagnosis": [],
            "recommended_action": "CONSIDER_STROKE_ALERT",
            "error": error_msg
        }


class MockStrokeAnalyzer:
    """Mock analyzer for demo/testing without API calls."""
    
    def __init__(self):
        self.stroke_keywords = [
            "sudden onset", "facial droop", "arm weakness", "leg weakness",
            "speech difficulty", "slurred speech", "aphasia", "dysarthria",
            "hemiparesis", "hemiplegia", "numbness", "visual field",
            "neglect", "ataxia", "vertigo", "diplopia", "weakness"
        ]
        
        self.mimic_keywords = [
            "seizure", "postictal", "migraine", "aura", "headache history",
            "conversion", "anxiety", "hyperventilation", "hypoglycemia",
            "low blood sugar", "bell's palsy", "peripheral", "psychiatric",
            "drug use", "intoxication", "alcohol"
        ]
        
        self.contraindication_keywords = [
            "warfarin", "coumadin", "anticoagulation", "bleeding",
            "hemorrhage", "recent surgery", "head trauma", "inr"
        ]
    
    def analyze(self, note_text: str) -> dict:
        """Analyze note using keyword matching (for demo purposes)."""
        note_lower = note_text.lower()
        
        # Count stroke vs mimic indicators
        stroke_score = sum(1 for kw in self.stroke_keywords if kw in note_lower)
        mimic_score = sum(1 for kw in self.mimic_keywords if kw in note_lower)
        
        # Calculate probability
        total = stroke_score + mimic_score + 1
        stroke_probability = int((stroke_score / total) * 100)
        stroke_probability = min(95, max(5, stroke_probability))  # Bound it
        
        # Adjust based on sudden onset (classic stroke indicator)
        if "sudden onset" in note_lower or "acute onset" in note_lower:
            stroke_probability = min(95, stroke_probability + 20)
        
        # Classification
        if stroke_probability >= 80:
            classification = "HIGH"
        elif stroke_probability >= 50:
            classification = "MEDIUM"
        else:
            classification = "LOW"
        
        # Extract key phrases
        key_phrases = []
        for kw in self.stroke_keywords + self.mimic_keywords:
            if kw in note_lower:
                significance = "stroke indicator" if kw in self.stroke_keywords else "mimic indicator"
                key_phrases.append({"phrase": kw, "significance": significance})
        
        # Check contraindications
        contras_found = [kw for kw in self.contraindication_keywords if kw in note_lower]
        
        # Extract LKW using regex
        lkw_patterns = [
            r"last (?:known )?(?:normal|well)[:\s]+([^.]+)",
            r"lkw[:\s]+([^.]+)",
            r"symptom onset[:\s]+([^.]+)",
            r"(\d+)\s*(?:hours?|hrs?)\s*ago"
        ]
        lkw_time = "Not documented"
        for pattern in lkw_patterns:
            match = re.search(pattern, note_lower)
            if match:
                lkw_time = match.group(1).strip()
                break
        
        # Urgency score
        if stroke_probability >= 80 and not contras_found:
            urgency = 5
        elif stroke_probability >= 70:
            urgency = 4
        elif stroke_probability >= 50:
            urgency = 3
        elif stroke_probability >= 30:
            urgency = 2
        else:
            urgency = 1
        
        return {
            "stroke_probability": stroke_probability,
            "classification": classification,
            "primary_impression": f"{'Strong stroke presentation' if stroke_probability >= 70 else 'Mixed presentation' if stroke_probability >= 40 else 'Likely mimic'} based on clinical features",
            "key_phrases": key_phrases[:8],  # Limit to top 8
            "stroke_indicators": [kw for kw in self.stroke_keywords if kw in note_lower][:5],
            "mimic_indicators": [kw for kw in self.mimic_keywords if kw in note_lower][:5],
            "tpa_assessment": {
                "eligible": "uncertain" if contras_found else True,
                "contraindications_found": contras_found,
                "contraindications_missing_info": ["INR value", "Platelet count"] if not contras_found else [],
                "time_from_lkw": lkw_time
            },
            "lkw_time": lkw_time,
            "urgency_score": urgency,
            "urgency_rationale": f"Based on {stroke_probability}% stroke probability and {'no' if not contras_found else 'possible'} contraindications",
            "flags": [f"⚠️ Possible contraindication: {c}" for c in contras_found],
            "differential_diagnosis": [
                {"diagnosis": "Ischemic Stroke", "likelihood": classification},
                {"diagnosis": "Stroke Mimic", "likelihood": "LOW" if classification == "HIGH" else "MEDIUM" if classification == "MEDIUM" else "HIGH"}
            ],
            "recommended_action": "ACTIVATE_STROKE_ALERT" if stroke_probability >= 80 else "CONSIDER_STROKE_ALERT" if stroke_probability >= 50 else "DEFER_FURTHER_EVALUATION"
        }
