import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import cors from "cors";
import ChatSession from './model/ChatSession.js';

// --- Import your custom modules ---
import authRoutes from "./routes/authRoutes.js"; 
import "./auth/google.js"; 

// Import AI generation specific modules
import { generateAIResponse } from './service/AIModel.js'; 
import { CHAT_PROMPT, CODE_PROMPT } from './data/Prompt.js';

dotenv.config();

const app = express();

// --- Middlewares ---
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "velociti-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);

app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Failed to log out" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
});

// --- Chat Completion Route ---
app.post('/api/chat', async (req, res) => {
  try {
    const { chatHistory } = req.body;
    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ message: 'Invalid chat history provided.' });
    }

    const aiResponseText = String(await generateAIResponse(chatHistory, CHAT_PROMPT) || '');

    const fullMessages = [...chatHistory.map(msg => ({
      role: msg.role,
      content: String(msg.parts?.[0]?.text ?? ""),
    })), {
      role: 'model',
      content: aiResponseText,
    }];

    const chatSession = new ChatSession({
      userId: req.user?.id || 'anonymous',
      messages: fullMessages,
    });

    await chatSession.save();
    res.json({ text: aiResponseText, sessionId: chatSession._id });

  } catch (error) {
    res.status(500).json({ message: 'Error generating AI response.', error: error.message });
  }
});

// --- Code Generator (Frontend Only) ---
app.post('/api/generate-code', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ message: 'Topic must be a valid string.' });
    }

    const history = [{ role: 'user', parts: [{ text: CODE_PROMPT + `\n\nUser Request: ${topic}` }] }];

    let aiResponse = String(await generateAIResponse(history, "") || '').trim();
    if (aiResponse.startsWith('```json')) {
      aiResponse = aiResponse.replace(/```json\n?/, '').replace(/```$/, '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (err) {
      let cleaned = aiResponse
        .replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\')
        .replace(/(?<!\\)\n/g, '\\n')
        .replace(/(?<!\\)\r/g, '\\r');
      parsed = JSON.parse(cleaned);
    }

    if (parsed?.files && typeof parsed.files === 'object') {
      res.json({ files: parsed.files });
    } else {
      throw new Error('Expected structure: { files: { "filename": "code..." } }');
    }

  } catch (error) {
    res.status(500).json({ message: `frontend code generation failed.`, error: error.message });
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

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server started on http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });