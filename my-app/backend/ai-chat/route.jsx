// api/ai-chat/route.jsx (or route.js for standard Node.js)

import { generateAIResponse } from '@/service/AIModel'; // Import the exported function
import { NextResponse } from 'next/server';
import CHAT_PROMPT_DATA from '@/data/Prompt'; // Assuming this is your prompt file

export async function POST(req) {
    try {
        // The frontend (Chat.jsx) sends the full chat history
        const { chatHistory } = await req.json();

        if (!chatHistory || !Array.isArray(chatHistory)) {
            return NextResponse.json({ error: 'Invalid chat history provided.' }, { status: 400 });
        }

        // Call the generateAIResponse function from your AI Model Service
        // Pass the chatHistory and your system prompt
        const aiResponseText = await generateAIResponse(chatHistory, CHAT_PROMPT_DATA.CHAT_PROMPT);

        // Return the AI's response
        return NextResponse.json({ text: aiResponseText }); // Consistent with frontend expectation

    } catch (e) {
        console.error("Error in /api/ai-chat route:", e);
        // Return a more descriptive error message
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
