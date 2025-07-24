// service/AIModel.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    googleSearch: {},
  },
];

const generationConfig = {};
const modelName = 'gemini-2.0-flash';

export async function generateAIResponse(chatHistory, systemPrompt) {
  try {
    const aiModel = genAI.getGenerativeModel({ model: modelName });

    // --- ENHANCED DEBUG LOG ADDED HERE ---
    console.log("System Prompt received by generateAIResponse:", systemPrompt);
    // --- END ENHANCED DEBUG LOG ---

    // Construct the full conversation history for the AI model
    // Ensure each part has a 'text' field for text-based messages
    const contentsForAI = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }] // System prompt as a user part
      },
      {
        role: 'model',
        parts: [{ text: "Okay, I'm ready to assist you with React development ideas!" }] // AI's initial acknowledgment
      },
      // Map the chatHistory from frontend to the correct format for Gemini
      ...chatHistory.map(message => ({
        role: message.role, // 'user' or 'ai' (model)
        parts: message.parts.map(part => ({
          text: part.text // Ensure 'text' property is used for text content
        }))
      }))
    ];

    // --- DEBUG LOG (already present) ---
    console.log("Contents sent to Gemini API:", JSON.stringify(contentsForAI, null, 2));
    // --- END DEBUG LOG ---

    const result = await aiModel.generateContent({
      contents: contentsForAI,
      tools,
      generationConfig,
    });

    const response = await result.response;
    const text = response.text();

    return text;

  } catch (error) {
    console.error('Error generating AI response:', error);
    // Re-throw or return a specific error message to be handled by the calling route
    throw new Error(`AI generation failed: ${error.message}`);
  }
}
