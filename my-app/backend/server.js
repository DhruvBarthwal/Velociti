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
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);

// ✅ Add this route to return the current authenticated user
app.get("/auth/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

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

    // Pass false for isCodeRequestFlag for chat prompts
    const aiResponseText = String(await generateAIResponse(chatHistory, CHAT_PROMPT, false) || '');

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

    // Construct history for the AI call, ensuring the prompt is clear for code generation
    const history = [{ role: 'user', parts: [{ text: `Generate React code for: ${topic}` }] }];

    // Pass true for isCodeRequestFlag for code generation prompts
    let aiRawResponse = String(await generateAIResponse(history, CODE_PROMPT, true) || '').trim();
    
    let generatedFiles = {};
    // Regex to capture Filename comments and the subsequent code block.
    // It looks for:
    // 1. Optional leading ```(language) (e.g., ```javascript)
    // 2. // Filename: /path/to/file.ext
    // 3. ```(language) (e.g., ```jsx, ```css)
    // 4. The actual code content (non-greedy match)
    // 5. ``` (closing fence)
    const fileRegex = /(?:```[\w\d]*\n)?\/\/ Filename: (\/[\w\d\-\.]+\.(jsx|js|css))\n```(?:jsx|js|css)?\n([\s\S]*?)\n```/g;
    let match;

    let foundCodeBlocks = false; // Flag to check if any code blocks were found

    // Reset regex lastIndex to ensure it searches from the beginning each time
    fileRegex.lastIndex = 0; 

    while ((match = fileRegex.exec(aiRawResponse)) !== null) {
      foundCodeBlocks = true;
      const filename = match[1];
      const codeContent = match[3].trim(); // match[3] captures the code content
      generatedFiles[filename] = codeContent;
    }

    // --- NEW: Enhanced filtering for HTML content in JS/JSX files ---
    const htmlContentRegex = /<\s*(html|head|body|!doctype|meta|title)\s*>/i; // Common HTML tags
    const htmlFileExtensions = ['.html', '.htm'];
    const jsLikeFileExtensions = ['.js', '.jsx'];

    for (const filename in generatedFiles) {
      const lowerFilename = filename.toLowerCase();
      const content = generatedFiles[filename];

      // 1. Filter out explicit HTML files
      if (htmlFileExtensions.some(ext => lowerFilename.endsWith(ext))) {
        console.warn(`🗑️ Filtering out unwanted HTML file: ${filename} (by extension)`);
        delete generatedFiles[filename];
        continue; // Move to the next file
      }

      // 2. Check content of JS/JSX files for HTML
      if (jsLikeFileExtensions.some(ext => lowerFilename.endsWith(ext))) {
        if (htmlContentRegex.test(content.substring(0, 500))) { // Check first 500 chars for efficiency
          console.warn(`🗑️ Filtering out unwanted HTML content in JS/JSX file: ${filename}`);
          delete generatedFiles[filename];
          continue; // Move to the next file
        }
      }
    }
    // --- END NEW ---

    if (!foundCodeBlocks || Object.keys(generatedFiles).length === 0) {
        console.error('No valid code blocks found in AI response after filtering:', aiRawResponse.substring(0, 500));
        throw new Error('AI did not return valid code in the expected markdown block format or all valid files were filtered.');
    }

    res.json({ files: generatedFiles });

  } catch (error) {
    console.error('❌ Backend code generation error:', error);
    // Propagate the specific error message from AIModel.js or parsing
    res.status(500).json({ message: `Code generation failed: ${error.message}` });
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
