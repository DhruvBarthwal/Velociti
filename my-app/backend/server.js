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
import CHAT_PROMPT from './data/Prompt.js'; // <--- CHANGED THIS IMPORT

dotenv.config();

const app = express();

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

// --- AI Chat API Route (NEWLY ADDED) ---
app.post('/api/chat', async (req, res) => {
  try {
    const { chatHistory } = req.body;

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ message: 'Invalid chat history provided.' });
    }

    console.log("📨 Received chat history:", chatHistory);

    // Normalize roles: map 'ai' to 'model', force roles to 'user' or 'model' only
    const normalizedChatHistory = chatHistory.map(msg => {
      let role = msg.role.toLowerCase();
      if (role === 'ai') role = 'model';
      else if (role !== 'user' && role !== 'model') role = 'user'; // fallback

      // Flatten parts array to a single text string
      const content = msg.parts?.map(part => part.text).join(' ') || '';

      return { role, parts: [{ text: content }] };
    });

    // Call the AI with normalized chat history
    const aiResponseText = await generateAIResponse(normalizedChatHistory, CHAT_PROMPT.CHAT_PROMPT);

    console.log("🤖 AI response:", aiResponseText);

    // Prepare full messages for DB saving with normalized role and full text
    const fullMessages = normalizedChatHistory.map(msg => ({
      role: msg.role,
      content: msg.parts?.[0]?.text || '',
    }));

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
