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

const modelName = 'gemini-2.0-flash';

// Helper function for exponential backoff retry
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Check for specific errors that warrant a retry (e.g., 5xx, network errors, 429, parsing errors)
      const isRetryable = 
        (error.status && (error.status >= 500 || error.status === 429)) || // Server errors or Too Many Requests
        error.message.includes('network error') || 
        error.message.includes('timeout') ||
        error.message.includes('Empty response for code generation.') || // Custom error for empty code response
        error.message.includes('Empty response for chat.') || // Custom error for empty chat response
        error.message.includes('AI did not return code in the expected markdown block format.') || // Error for missing markdown blocks
        error.message.includes('AI model returned no candidates.'); // New error for no candidates

      // If it's a 429 and retryDelay is provided by the API, use that delay.
      const retryInfo = error.errorDetails?.find(detail => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
      const apiRetryDelaySeconds = retryInfo ? parseInt(retryInfo.retryDelay.replace('s', '')) : null;
      const effectiveDelay = apiRetryDelaySeconds ? apiRetryDelaySeconds * 1000 : delay;


      if (i < retries - 1 && isRetryable) {
        console.warn(`Attempt ${i + 1} failed, retrying in ${effectiveDelay / 1000}s...`, error.message);
        await new Promise(res => setTimeout(res, effectiveDelay));
        delay *= 2; // Exponential backoff for default delay
      } else {
        throw error; // Re-throw if not retryable or max retries reached
      }
    }
  }
};

// Modified generateAIResponse to accept an explicit isCodeRequest flag
export async function generateAIResponse(chatHistory, systemPrompt, isCodeRequestFlag = false) {
  const isCodeGenerationRequest = isCodeRequestFlag; 

  console.log(`[AIModel.js] generateAIResponse called. isCodeGenerationRequest: ${isCodeGenerationRequest}`);

  const currentGenerationConfig = { ...baseGenerationConfig };
  // DO NOT set responseMimeType for code generation, as we want markdown text output.
  // This is crucial for the AI to follow the prompt's markdown formatting.
  // For chat prompts, if you need structured responses, you would set it here.
  // For now, it's removed for code generation.
  // if (isCodeGenerationRequest) {
  //   currentGenerationConfig.responseMimeType = "application/json"; 
  // }

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: currentGenerationConfig,
    systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] }
  });

  const contentsForAI = chatHistory;

  try {
    const text = await retry(async () => {
      const result = await model.generateContent({
        contents: contentsForAI,
        tools
      });
      
      if (!result || !result.response) {
          throw new Error("AI model returned an invalid or empty response object.");
      }

      // Check if the AI generated any candidates (content)
      if (!result.response.candidates || result.response.candidates.length === 0) {
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
      
      // If responseText is empty, it's an issue for both chat and code generation
      if (!responseText.trim()) {
          const statusDetail = response.status !== undefined ? `Status: ${response.status}` : 'Status: undefined';
          const type = isCodeGenerationRequest ? 'code generation' : 'chat';
          throw new Error(`AI API responded with ${statusDetail}: Empty response for ${type}.`);
      }
      
      // Always return responseText if it's not empty.
      // The calling function (server.js) will handle specific format validation (markdown for code, plain text for chat).
      return responseText;
    });
    return text;
  } catch (error) {
    console.error('❌ AI generation failed:', error);
    const errorMessage = error.status 
      ? `AI generation failed (Status: ${error.status}, Message: ${error.message})`
      : `AI generation failed: ${error.message}`;
    throw new Error(errorMessage);
  }
}
