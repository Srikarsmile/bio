const SYSTEM_PROMPT = `You are a clinical stroke assessment assistant. Help healthcare providers gather relevant information for stroke triage. Ask focused questions about FAST symptoms (Face, Arms, Speech, Time). Keep responses concise.`;

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const messages = req.body.messages || [];
        const apiKey = process.env.OPENROUTER_API_KEY;

        let result;

        if (apiKey) {
            const formattedMessages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages.map(m => ({ role: m.role, content: m.content })),
            ];

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
                    messages: formattedMessages,
                    temperature: 0.7,
                    max_tokens: 500,
                }),
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status}`);
            }

            const data = await response.json();
            result = { message: data.choices?.[0]?.message?.content || 'I apologize, but I encountered an error.' };
        } else {
            result = { message: "Hi! I'm the StrokeSense AI assistant. Please describe the patient's symptoms and I'll help guide the assessment." };
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: error.message, message: 'I apologize, but I encountered an error. Please try again.' });
    }
};
