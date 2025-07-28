// service/AIModel.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import { CHAT_PROMPT, CODE_PROMPT } from '../data/Prompt.js';

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
  maxOutputTokens: 8192,
};

// Consider trying 'gemini-1.5-pro-latest' if 'gemini-2.0-flash' struggles.
// 1.5 Pro is generally more capable for complex code generation.
const modelName = 'gemini-2.0-flash'; // Keep as is for now, but keep this in mind.

// Helper function for exponential backoff retry (No changes needed here)
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = 
        (error.status && (error.status >= 500 || error.status === 429)) || 
        error.message.includes('network error') || 
        error.message.includes('timeout') ||
        error.message.includes('Empty response for code generation.') || 
        error.message.includes('Empty response for chat.') || 
        error.message.includes('AI did not return code in the expected markdown block format.') || 
        error.message.includes('AI model returned no candidates.');

      const retryInfo = error.errorDetails?.find(detail => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
      const apiRetryDelaySeconds = retryInfo ? parseInt(retryInfo.retryDelay.replace('s', '')) : null;
      const effectiveDelay = apiRetryDelaySeconds ? apiRetryDelaySeconds * 1000 : delay;

      if (i < retries - 1 && isRetryable) {
        console.warn(`Attempt ${i + 1} failed, retrying in ${effectiveDelay / 1000}s...`, error.message);
        await new Promise(res => setTimeout(res, effectiveDelay));
        delay *= 2; 
      } else {
        throw error; 
      }
    }
  }
};

// Modified generateAIResponse
export async function generateAIResponse(chatHistory, systemPrompt, isCodeRequestFlag = false) {
  const isCodeGenerationRequest = isCodeRequestFlag; 

  console.log(`[AIModel.js] generateAIResponse called. isCodeGenerationRequest: ${isCodeGenerationRequest}`);

  const currentGenerationConfig = { ...baseGenerationConfig };

  // Prepare contents for AI based on request type
  let contentsForAI = [...chatHistory]; // Create a mutable copy

  if (isCodeGenerationRequest) {
    // For code requests, prepend the CODE_PROMPT to the *first user message*.
    // The chatHistory in this case should be `[{ role: 'user', parts: [{ text: "Generate React code for: ${topic}" }] }]`
    if (contentsForAI.length > 0 && contentsForAI[0].role === 'user' && contentsForAI[0].parts && contentsForAI[0].parts.length > 0) {
      // Prepend the CODE_PROMPT to the existing user's request.
      contentsForAI[0].parts[0].text = `${CODE_PROMPT.replace('{TOPIC}', chatHistory[0].parts[0].text.replace('Generate React code for: ', '').trim())}\n\nUSER REQUEST: ${chatHistory[0].parts[0].text.replace('Generate React code for: ', '').trim()}`;
      // Note: We are manually inserting the topic into the CODE_PROMPT string here.
      // This way, the AI sees the full, detailed code prompt as part of the direct user input.
    } else {
      // Fallback if chatHistory is not as expected for code generation
      contentsForAI = [{ role: 'user', parts: [{ text: CODE_PROMPT.replace('{TOPIC}', 'a basic React application') }] }];
    }
  } else {
    // For chat, still use the systemInstruction for the CHAT_PROMPT
    // This is already handled by the `model` instantiation below
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: currentGenerationConfig,
    // Only use systemInstruction for general chat guidance.
    // For code, we're putting the full prompt into the `contents` for better adherence.
    systemInstruction: isCodeGenerationRequest ? undefined : { role: 'system', parts: [{ text: systemPrompt }] } 
  });

  // --- CRUCIAL DEBUGGING LOGS ---
  console.log("[AIModel.js] Final contents being sent to AI:", JSON.stringify(contentsForAI, null, 2));

  try {
    const text = await retry(async () => {
      const result = await model.generateContent({
        contents: contentsForAI,
        tools
      });
      
      if (!result || !result.response) {
          throw new Error("AI model returned an invalid or empty response object.");
      }

      if (!result.response.candidates || result.response.candidates.length === 0) {
        // This log should tell you if the AI is failing to generate *any* response
        console.error("[AIModel.js] AI model returned no candidates for the given input.");
        throw new Error("AI model returned no candidates.");
      }

      const response = result.response;
      
      let responseText = '';
      try {
          responseText = await response.text();
      } catch (e) {
          console.warn("Could not read response body:", e);
          throw new Error(`Failed to read AI response body: ${e.message}`);
      }
      
      if (!responseText.trim()) {
          const statusDetail = response.status !== undefined ? `Status: ${response.status}` : 'Status: undefined';
          const type = isCodeGenerationRequest ? 'code generation' : 'chat';
          console.error(`[AIModel.js] AI API responded with ${statusDetail}: Empty response for ${type}. Raw response: '${responseText}'`);
          throw new Error(`AI API responded with ${statusDetail}: Empty response for ${type}.`);
      }
      
      // --- MODIFIED LOG HERE TO SHOW ENTIRE RESPONSE ---
      console.log("\n--- START RAW AI RESPONSE FROM AIModel.js ---");
      console.log(responseText); // Log the entire responseText
      console.log("--- END RAW AI RESPONSE FROM AIModel.js ---\n");
      return responseText;
    });
    return text;
  } catch (error) {
    console.error('❌ AI generation failed in AIModel.js:', error);
    const errorMessage = error.status 
      ? `AI generation failed (Status: ${error.status}, Message: ${error.message})`
      : `AI generation failed: ${error.message}`;
    throw new Error(errorMessage);
  }
}