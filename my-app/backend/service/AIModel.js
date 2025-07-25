// service/AIModel.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import { CHAT_PROMPT, CODE_PROMPT } from '../data/Prompt.js'; // Unified CODE_PROMPT

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    googleSearch: {},
  },
];

const baseGenerationConfig = {
  temperature: 0.1,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 8192, // Increased maxOutputTokens to allow for longer code generation
};

const modelName = 'gemini-2.0-flash';

export async function generateAIResponse(chatHistory, systemPrompt) {
  try {
    const isCodeGenerationRequest = systemPrompt === CODE_PROMPT;

    const currentGenerationConfig = { ...baseGenerationConfig };
    if (isCodeGenerationRequest) {
      currentGenerationConfig.responseMimeType = "application/json";
    }

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: currentGenerationConfig,
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] }
    });

    const contentsForAI = chatHistory;

    const result = await model.generateContent({
      contents: contentsForAI,
      tools
    });

    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('❌ AI generation failed:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}


