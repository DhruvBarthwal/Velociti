// service/AIModel.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import { CHAT_PROMPT, CODE_PROMPT } from "../data/Prompt.js";

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
const modelName = "gemini-2.0-flash"; // Keep as is for now, but keep this in mind.

// Helper function for exponential backoff retry (No changes needed here)
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable =
        (error.status && (error.status >= 500 || error.status === 429)) ||
        error.message.includes("network error") ||
        error.message.includes("timeout") ||
        error.message.includes("Empty response for code generation.") ||
        error.message.includes("Empty response for chat.") ||
        error.message.includes(
          "AI did not return code in the expected markdown block format."
        ) ||
        error.message.includes("AI model returned no candidates.");

      const retryInfo = error.errorDetails?.find(
        (detail) =>
          detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
      );
      const apiRetryDelaySeconds = retryInfo
        ? parseInt(retryInfo.retryDelay.replace("s", ""))
        : null;
      const effectiveDelay = apiRetryDelaySeconds
        ? apiRetryDelaySeconds * 1000
        : delay;

      if (i < retries - 1 && isRetryable) {
        console.warn(
          `Attempt ${i + 1} failed, retrying in ${effectiveDelay / 1000}s...`,
          error.message
        );
        await new Promise((res) => setTimeout(res, effectiveDelay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
};

// Modified generateAIResponse
export async function generateAIResponse(
  chatHistory,
  systemPrompt,
  isCodeRequestFlag = false
) {
  const isCodeGenerationRequest = isCodeRequestFlag;

  console.log(
    `[AIModel.js] generateAIResponse called. isCodeGenerationRequest: ${isCodeGenerationRequest}`
  );

  const currentGenerationConfig = { ...baseGenerationConfig };

  let contentsForAI = []; // Start with an empty array

  if (isCodeGenerationRequest) {
    // For code requests, the 'chatHistory' will typically be just one user message
    // containing the topic. We'll extract that topic and embed it into CODE_PROMPT.
    const userTopic = chatHistory[0]?.parts?.[0]?.text
      ?.replace("Generate React code for: ", "")
      .trim();

    if (userTopic) {
      // Fill the {TOPIC} placeholder in CODE_PROMPT with the extracted user topic
      const finalCodePrompt = CODE_PROMPT.replace("{TOPIC}", userTopic); // The entire instruction for code generation (including topic and all rules) // becomes the single user message for the model.
      contentsForAI = [{ role: "user", parts: [{ text: finalCodePrompt }] }];
      console.log(`[AIModel.js] Code generation topic: "${userTopic}"`);
    } else {
      console.warn(
        "[AIModel.js] No valid topic found for code generation. Using default."
      );
      const defaultCodePrompt = CODE_PROMPT.replace(
        "{TOPIC}",
        "a basic React application"
      );
      contentsForAI = [{ role: "user", parts: [{ text: defaultCodePrompt }] }];
    }
  } else {
    // For chat requests, `chatHistory` already contains the correct messages.
    // We will use systemInstruction for the CHAT_PROMPT as you've done.
    contentsForAI = [...chatHistory];
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: currentGenerationConfig, // Use systemInstruction for CHAT_PROMPT. For CODE_PROMPT, it's embedded in `contentsForAI`.
    systemInstruction: isCodeGenerationRequest
      ? undefined
      : { role: "system", parts: [{ text: systemPrompt }] },
  }); // --- CRUCIAL DEBUGGING LOGS ---

  console.log(
    "[AIModel.js] Final contents being sent to AI:",
    JSON.stringify(contentsForAI, null, 2)
  );

  try {
    const text = await retry(async () => {
      const result = await model.generateContent({
        contents: contentsForAI,
        tools,
      });
      if (!result || !result.response) {
        throw new Error(
          "AI model returned an invalid or empty response object."
        );
      }

      if (
        !result.response.candidates ||
        result.response.candidates.length === 0
      ) {
        console.error(
          "[AIModel.js] AI model returned no candidates for the given input."
        );
        throw new Error("AI model returned no candidates.");
      }

      const response = result.response;
      let responseText = "";
      try {
        responseText = await response.text();
      } catch (e) {
        console.warn("Could not read response body:", e);
        throw new Error(`Failed to read AI response body: ${e.message}`);
      }
      if (!responseText.trim()) {
        const statusDetail =
          response.status !== undefined
            ? `Status: ${response.status}`
            : "Status: undefined";
        const type = isCodeGenerationRequest ? "code generation" : "chat";
        console.error(
          `[AIModel.js] AI API responded with ${statusDetail}: Empty response for ${type}. Raw response: '${responseText}'`
        );
        throw new Error(
          `AI API responded with ${statusDetail}: Empty response for ${type}.`
        );
      } // --- MODIFIED LOG HERE TO SHOW ENTIRE RESPONSE ---
      console.log("\n--- START RAW AI RESPONSE FROM AIModel.js ---");
      console.log(responseText); // Log the entire responseText
      console.log("--- END RAW AI RESPONSE FROM AIModel.js ---\n");
      return responseText;
    });
    return text;
  } catch (error) {
    console.error("❌ AI generation failed in AIModel.js:", error);
    const errorMessage = error.status
      ? `AI generation failed (Status: ${error.status}, Message: ${error.message})`
      : `AI generation failed: ${error.message}`;
    throw new Error(errorMessage);
  }
}
