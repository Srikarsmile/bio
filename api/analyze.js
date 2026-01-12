const SYSTEM_PROMPT = `You are a specialized AI medical assistant trained in stroke triage. Analyze clinical notes to assist healthcare providers in rapid stroke identification. Focus on FAST (Face, Arms, Speech, Time) assessment.`;

const USER_PROMPT = (note) => `Based on the following clinical presentation, provide a structured stroke triage assessment.

CLINICAL NOTES:
${note}

Respond with a valid JSON object containing:
{
  "stroke_probability": <0-100 integer>,
  "classification": "HIGH" | "MEDIUM" | "LOW",
  "primary_impression": "<brief clinical impression>",
  "key_phrases": [],
  "stroke_indicators": ["<list of findings supporting stroke>"],
  "mimic_indicators": ["<list of findings suggesting stroke mimic>"],
  "tpa_assessment": {"eligible": "unknown", "contraindications": [], "time_considerations": "<assessment>"},
  "lkw_time": "<Last Known Well time if mentioned, else 'Not documented'>",
  "urgency_score": <1-5 integer>,
  "urgency_rationale": "<brief explanation>",
  "flags": [],
  "differential_diagnosis": [],
  "recommended_action": "STROKE_ALERT" | "URGENT_NEURO_CONSULT" | "ROUTINE_EVALUATION" | "OBSERVATION"
}

Return ONLY valid JSON.`;

function mockAnalyze(note) {
    const lower = note.toLowerCase();
    const strokeKeywords = ['weakness', 'facial droop', 'slurred', 'numbness', 'vision', 'severe headache'];
    const mimicKeywords = ['fever', 'seizure', 'migraine', 'anxiety'];

    const strokeCount = strokeKeywords.filter(k => lower.includes(k)).length;

    let prob, classification;
    if (strokeCount >= 2) {
        prob = 75; classification = "HIGH";
    } else if (strokeCount >= 1) {
        prob = 50; classification = "MEDIUM";
    } else {
        prob = 25; classification = "LOW";
    }

    return {
        stroke_probability: prob,
        classification,
        primary_impression: "Automated assessment based on keywords",
        key_phrases: [],
        stroke_indicators: strokeKeywords.filter(k => lower.includes(k)),
        mimic_indicators: mimicKeywords.filter(k => lower.includes(k)),
        tpa_assessment: { eligible: "unknown", contraindications: [], time_considerations: "Verify LKW" },
        lkw_time: "Not documented",
        urgency_score: strokeCount >= 1 ? 3 : 2,
        urgency_rationale: "Based on keyword analysis",
        flags: [],
        differential_diagnosis: [],
        recommended_action: strokeCount >= 1 ? "URGENT_NEURO_CONSULT" : "ROUTINE_EVALUATION",
    };
}

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const note = req.body.note || '';
        const apiKey = process.env.OPENROUTER_API_KEY;

        let result;

        if (apiKey) {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://strokesense.vercel.app',
                        'X-Title': 'StrokeSense AI',
                    },
                    body: JSON.stringify({
                        model: 'google/gemini-flash-1.5',
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            { role: 'user', content: USER_PROMPT(note) },
                        ],
                        temperature: 0.3,
                        max_tokens: 2000,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`OpenRouter API error: ${response.status}`);
                }

                const data = await response.json();
                let content = data.choices?.[0]?.message?.content || '';

                // Clean JSON from markdown
                if (content.startsWith('```')) {
                    content = content.split('```')[1];
                    if (content.startsWith('json')) content = content.slice(4);
                }

                result = JSON.parse(content.trim());
            } catch (error) {
                console.error('AI Analysis failed, falling back to mock:', error);
                result = mockAnalyze(note);
            }
        } else {
            result = mockAnalyze(note);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Handler error:', error);
        return res.status(500).json({ error: error.message });
    }
};
