import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import cors from "cors";
import ChatSession from './model/ChatSession.js';


// --- Import your custom modules ---
import authRoutes from "./routes/authRoutes.js"; // Your existing auth routes
import "./auth/google.js"; // Important to load Passport strategy (contains GoogleStrategy setup)

// Import AI generation specific modules
import { generateAIResponse} from './service/AIModel.js' ; // Adjust path relative to server.js
// Import both CHAT_PROMPT and CODE_PROMPT from the same file using a relative path
import { CHAT_PROMPT, CODE_PROMPT } from './data/Prompt.js';

dotenv.config();

const app = express();

// --- DEBUG LOGS FOR PROMPTS ---
console.log("DEBUG: CHAT_PROMPT imported:", CHAT_PROMPT);
console.log("DEBUG: CODE_PROMPT imported:", CODE_PROMPT);
// --- END DEBUG LOGS ---

// --- Middlewares ---
app.use(express.json()); // To parse JSON request bodies
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // Ensure this matches your Next.js frontend
    credentials: true,
  })
);

// Express-session middleware (MUST be above passport.initialize() and passport.session())
app.use(
  session({
    secret: process.env.SESSION_SECRET || "velociti-secret", // Use env variable, fallback to hardcoded
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Session lasts 1 day
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
      httpOnly: true, // Prevents client-side JavaScript from accessing cookies
      sameSite: 'lax', // Protects against CSRF attacks
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// --- Routes ---
// Your existing authentication routes
app.use("/auth", authRoutes);

// Logout route (defined directly in server.js as per your structure)
app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => { // Passport's logout method
    if (err) { return next(err); }
    req.session.destroy((err) => { // Destroy the session
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.clearCookie("connect.sid"); // default session cookie name
      res.json({ message: "Logged out" }); // Send JSON response
    });
  });
});

// --- AI Chat API Route ---
app.post('/api/chat', async (req, res) => {
  try {
    const { chatHistory } = req.body;

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ message: 'Invalid chat history provided.' });
    }

    console.log("📨 Received chat history:", chatHistory);

    // Use the CHAT_PROMPT for chat responses
    const aiResponseText = await generateAIResponse(chatHistory, CHAT_PROMPT);

    console.log("🤖 AI response:", aiResponseText);

    // Correctly map chatHistory to { role, content } format for DB save
    const fullMessages = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.parts?.[0]?.text || "",
    }));

    // Add AI model response as last message
    fullMessages.push({
      role: 'model',
      content: aiResponseText,
    });

    const chatSession = new ChatSession({
      userId: req.user?.id || 'anonymous',
      messages: fullMessages,
    });

    await chatSession.save();

    res.json({ text: aiResponseText, sessionId: chatSession._id });

  } catch (error) {
    console.error('❌ Backend /api/chat error:', error);
    res.status(500).json({ message: 'Error generating AI response.', error: error.message });
  }
});

// --- AI Code Generation API Route ---
app.post('/api/generate-code', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ message: 'Topic must be a valid string.' });
    }

    console.log("🛠️ Received code generation request for topic:", topic);

    // Prepare the prompt for code generation
    const codeGenerationChatHistory = [
      {
        role: 'user',
        parts: [{ text: CODE_PROMPT + `\n\nUser Request: ${topic}` }]
      }
    ];

    // Call the AI generation function. It should return a JSON string.
    let aiResponseJsonString = await generateAIResponse(codeGenerationChatHistory, ""); // Empty system prompt as it's in the history

    if (!aiResponseJsonString) {
      return res.status(500).json({ message: 'Empty response from AI model.' });
    }

    // --- NEW: Pre-process AI response to remove markdown code block wrappers ---
    // This is crucial if the AI still includes ```json and ```
    if (aiResponseJsonString.startsWith('```json')) {
        aiResponseJsonString = aiResponseJsonString.substring('```json'.length);
        if (aiResponseJsonString.endsWith('```')) {
            aiResponseJsonString = aiResponseJsonString.substring(0, aiResponseJsonString.length - '```'.length);
        }
        // Trim any leading/trailing whitespace or newlines that might remain
        aiResponseJsonString = aiResponseJsonString.trim();
    }
    // --- END NEW PRE-PROCESSING ---

    // Parse the JSON string received from the AI
    const generatedCode = JSON.parse(aiResponseJsonString);

    // Assuming AI returns { files: { '/App.js': '...', ... } }
    if (generatedCode && generatedCode.files && typeof generatedCode.files === 'object') {
      res.json({ files: generatedCode.files });
    } else {
      // Log the raw AI response for debugging if parsing fails
      console.error('AI did not return code in the expected JSON format:', aiResponseJsonString);
      throw new Error('AI did not return code in the expected JSON format (missing "files" property or malformed JSON).');
    }

  } catch (error) {
    console.error('❌ Backend /api/generate-code error:', error);
    // Provide a more specific error if JSON parsing failed
    if (error instanceof SyntaxError) {
        res.status(500).json({ message: 'Code generation failed: AI response was not valid JSON.', error: error.message });
    } else {
        res.status(500).json({ message: 'Code generation failed.', error: error.message });
    }
  }
});


app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Chat session not found.' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat session.', error: error.message });
  }
});



// --- Connect to MongoDB and start server ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.listen(process.env.PORT || 5000, () => { // Use PORT from .env or default to 5000
      console.log(`🚀 Server started on http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
