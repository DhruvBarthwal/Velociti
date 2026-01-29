import { generateAIResponse } from '@/service/AIModel'; 
import { NextResponse } from 'next/server';
import CHAT_PROMPT_DATA from '@/data/Prompt'; 

export async function POST(req) {
    try {
        const { chatHistory } = await req.json();

        if (!chatHistory || !Array.isArray(chatHistory)) {
            return NextResponse.json({ error: 'Invalid chat history provided.' }, { status: 400 });
        }

        const aiResponseText = await generateAIResponse(chatHistory, CHAT_PROMPT_DATA.CHAT_PROMPT);

        return NextResponse.json({ text: aiResponseText });

    } catch (e) {
        console.error("Error in /api/ai-chat route:", e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
