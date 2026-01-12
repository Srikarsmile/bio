import { NextResponse } from 'next/server';
import { OpenRouter } from '@openrouter/sdk';

const SYSTEM_PROMPT = `You are a clinical stroke assessment assistant. Help healthcare providers gather relevant information for stroke triage. Ask focused questions about FAST symptoms (Face, Arms, Speech, Time). Keep responses concise.`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const messages = body.messages || [];
        const apiKey = process.env.OPENROUTER_API_KEY;

        let result;

        if (apiKey) {
            const openrouter = new OpenRouter({ apiKey });

            const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            ];

            try {
                const response = await openrouter.chat.send({
                    model: 'google/gemini-2.5-flash',
                    messages: formattedMessages,
                });

                const content = response.choices?.[0]?.message?.content;
                result = { message: content || 'I apologize, but I encountered an error.' };
            } catch (err: any) {
                console.error("OpenRouter SDK error:", err);
                result = { message: "I apologize, but I'm having trouble connecting to the AI service." };
            }
        } else {
            result = { message: "Hi! I'm the StrokeSense AI assistant. Please describe the patient's symptoms and I'll help guide the assessment." };
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Chat function error:', error);
        return NextResponse.json({ error: error.message, message: 'Internal Server Error' }, { status: 500 });
    }
}
