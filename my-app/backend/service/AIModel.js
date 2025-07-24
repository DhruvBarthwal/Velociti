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

    // --- DEBUG LOG: Verify systemPrompt value ---
    console.log("System Prompt received by generateAIResponse:", systemPrompt);
    // --- END DEBUG LOG ---

    // Construct the full conversation history for the AI model
    // Ensure each part has a 'text' field for text-based messages
    const contentsForAI = [];

    // Add the system prompt as the first 'user' turn if it exists
    // This is the critical part to ensure the system prompt is correctly formatted
    if (systemPrompt) {
      contentsForAI.push({
        role: 'user',
        parts: [{ text: systemPrompt }] // <--- THIS IS THE CRITICAL LINE
      });
      // Add a model response to balance the conversation if a system prompt is used
      // This helps Gemini understand the turn-taking.
      contentsForAI.push({
        role: 'model',
        parts: [{ text: "Okay, I'm ready to assist you!" }]
      });
    }


    // Map the chatHistory from frontend to the correct format for Gemini
    // Ensure roles are 'user' or 'model' and parts have 'text'
    chatHistory.forEach(message => {
      let role = message.role.toLowerCase();
      if (role === 'ai') role = 'model'; // Normalize 'ai' to 'model'
      else if (role !== 'user' && role !== 'model') role = 'user'; // Fallback for unexpected roles

      // Ensure parts are correctly formatted with 'text'
      const parts = message.parts.map(part => ({
        text: part.text || '' // Use text property, fallback to empty string
      }));

      contentsForAI.push({ role, parts });
    });


    // --- DEBUG LOG: Show final payload to Gemini ---
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
