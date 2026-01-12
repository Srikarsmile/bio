export const config = {
    runtime: 'edge',
};

const SYSTEM_PROMPT = `You are a clinical stroke assessment assistant. Help healthcare providers gather relevant information for stroke triage. Ask focused questions about FAST symptoms (Face, Arms, Speech, Time). Keep responses concise.`;

export default async function handler(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    try {
        const body = await request.json();
        const messages = body.messages || [];
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

            const data = await response.json();
            result = { message: data.choices?.[0]?.message?.content || 'I apologize, but I encountered an error.' };
        } else {
            result = { message: "Hi! I'm the StrokeSense AI assistant. Please describe the patient's symptoms and I'll help guide the assessment." };
        }

        return new Response(JSON.stringify(result), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, message: 'I apologize, but I encountered an error. Please try again.' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
