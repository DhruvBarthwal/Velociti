import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import cors from "cors";
import { Octokit } from '@octokit/rest';
import axios from 'axios'; 

// --- Import your custom modules ---
import authRoutes from "./routes/authRoutes.js";
import "./auth/google.js"; 
import ChatSession from "./model/ChatSession.js";

// Import AI generation specific modules
import { generateAIResponse } from "./service/AIModel.js";
import { CHAT_PROMPT, CODE_PROMPT } from "./data/Prompt.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
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
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);

// --- Authentication Routes ---
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

// 🚀 Corrected GitHub authentication initiation route
app.get('/auth/github', (req, res, next) => {
    if (req.query.workspaceId) {
      req.session.workspaceId = req.query.workspaceId;
    }
    // Ensure the 'repo' scope is requested for file upload permissions
    passport.authenticate('github', { scope: ['repo', 'user:email'] })(req, res, next);
});

// ✅ The crucial route that handles the redirect from GitHub.
app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL}?auth_error=true`,
    session: true,
  }),
  (req, res) => {
    const workspaceId = req.session.workspaceId || 'new';
    delete req.session.workspaceId;
    res.redirect(`${process.env.CLIENT_URL}/workspace/${workspaceId}`);
  }
);


// --- Chat Completion Route (Unchanged) ---
app.post("/api/chat", async (req, res) => {
  try {
    const { chatHistory } = req.body;
    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res
        .status(400)
        .json({ message: "Invalid chat history provided." });
    }
    const aiResponseText = String(
      (await generateAIResponse(chatHistory, CHAT_PROMPT, false)) || ""
    );

    const fullMessages = [
      ...chatHistory.map((msg) => ({
        role: msg.role,
        content: String(msg.parts?.[0]?.text ?? ""),
      })),
      {
        role: "model",
        content: aiResponseText,
      },
    ];

    const chatSession = new ChatSession({
      userId: req.user?.id || "anonymous",
      messages: fullMessages,
    });

    await chatSession.save();
    res.json({ text: aiResponseText, sessionId: chatSession._id });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generating AI response.", error: error.message });
  }
});

// --- Code Generator (Frontend Only) ---
app.post("/api/generate-code", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ message: "Topic must be a valid string." });
    }
    const history = [
      {
        role: "user",
        parts: [
          {
            text: `Generate React code for: ${topic}`,
          },
        ],
      },
    ];
    let aiRawResponse = String(
      (await generateAIResponse(history, CODE_PROMPT, true)) || ""
    ).trim();
    let generatedFiles = {};
    const fileRegex =
      /(?:```[\w\d]*\n)?\/\/ Filename: (\/?\.?\/?[\w\/\-\.]+\.(jsx|js|css))\n```(?:jsx|js|css)?\n([\s\S]*?)\n```/g;

    let match;
    fileRegex.lastIndex = 0;

    while ((match = fileRegex.exec(aiRawResponse)) !== null) {
      const filename = match[1];
      const codeContent = match[3].trim();
      generatedFiles[filename] = codeContent;
    }

    console.log(
      "\n--- server.js: Files parsed from AI raw response (before filtering) ---"
    );
    console.log(JSON.stringify(generatedFiles, null, 2));
    console.log("--- END server.js: Files parsed from AI raw response ---\n\n");

    const filteredFiles = {};
    const isBoilerplateContent = (content) => {
      const helloWorldRegex =
        /(<h1[^>]*>Hello\s*World<\/h1>|<div[^>]*>Hello\s*World<\/div>|return\s*<h1>Hello\s*world<\/h1>|return\s*<div>Hello\s*world<\/div>)/i;
      const shortBoilerplateRegex =
        /^\s*(import\s+React\s+from\s+'react';\s*)?(import\s+App\s+from\s+'\.\/App';\s*)?(import\s+'\.\/index\.css';\s*)?(\s*const\s+App\s*=\s*\(\)\s*=>\s*\{|\s*function\s+App\(\)\s*\{|\s*export\s+default\s+function\s+App\(\)\s*\{)\s*return\s*(<h1[^>]*>Hello\s*World<\/h1>|<div[^>]*>Hello\s*World<\/div>);?\s*\}\s*(export\s+default\s+App;)?\s*$/i;
      return (
        helloWorldRegex.test(content) ||
        (content.length < 200 && shortBoilerplateRegex.test(content))
      );
    };

    let appJsxContent = generatedFiles["/App.jsx"];
    let appJsContent = generatedFiles["/App.js"];
    let appJsxIsGood = false;

    if (appJsxContent) {
      appJsxContent = appJsxContent
        .replace(/^\s*(<!doctype html>|<html>|<body>|<head>)\s*/i, "")
        .replace(/\s*(<\/html>|<\/body>|<\/head>)\s*$/i, "")
        .trim();

      if (!isBoilerplateContent(appJsxContent)) {
        filteredFiles["/App.jsx"] = appJsxContent;
        appJsxIsGood = true;
        console.log(`✅ server.js: Keeping /App.jsx (looks like real code).`);
      } else {
        console.warn(
          `🗑️ server.js: /App.jsx detected as "Hello World" or boilerplate. Discarding for now.`
        );
      }
    }

    if (appJsxIsGood && appJsContent) {
      console.warn(
        `🗑️ server.js: Unconditionally removing /App.js because a valid /App.jsx is present.`
      );
      delete generatedFiles["/App.js"];
    } else if (!appJsxIsGood && appJsContent) {
      let cleanedAppJsContent = appJsContent
        .replace(/^\s*(<!doctype html>|<html>|<body>|<head>)\s*/i, "")
        .replace(/\s*(<\/html>|<\/body>|<\/head>)\s*$/i, "")
        .trim();

      if (!isBoilerplateContent(cleanedAppJsContent)) {
        filteredFiles["/App.js"] = cleanedAppJsContent;
        console.log(
          `✅ server.js: Keeping /App.js (looks like real code, as /App.jsx was not valid).`
        );
      } else {
        console.warn(
          `🗑️ server.js: /App.js detected as "Hello World" or boilerplate. Discarding.`
        );
      }
    }

    console.log(
      "\n--- server.js: Files after App.jsx/App.js prioritization ---"
    );
    console.log(JSON.stringify(filteredFiles, null, 2));
    console.log(
      "--- END server.js: Files after App.jsx/App.js prioritization ---\n\n"
    );

    for (const filename in generatedFiles) {
      const lowerFilename = filename.toLowerCase();
      let content = generatedFiles[filename];

      if (
        lowerFilename.includes("/app.jsx") ||
        lowerFilename.includes("/app.js")
      ) {
        continue;
      }

      if (lowerFilename.endsWith(".html") || lowerFilename.endsWith(".htm")) {
        console.warn(
          `🗑️ server.js: Filtering out unwanted HTML file (by extension): ${filename}`
        );
        continue;
      }

      if (lowerFilename.endsWith(".js") || lowerFilename.endsWith(".jsx")) {
        content = content
          .replace(/^\s*(<!doctype html>|<html>|<body>|<head>)\s*/i, "")
          .replace(/\s*(<\/html>|<\/body>|<\/head>)\s*$/i, "")
          .trim();
      }
      filteredFiles[filename] = content;
    }

    console.log("\n--- server.js: Files after processing all other files ---");
    console.log(JSON.stringify(filteredFiles, null, 2));
    console.log(
      "--- END server.js: Files after processing all other files ---\n\n"
    );

    if (Object.keys(filteredFiles).length === 0) {
      console.error(
        "No valid code blocks found in AI response after filtering or all were invalid:",
        aiRawResponse.substring(0, 500)
      );
      throw new Error(
        "AI did not return valid React code in the expected markdown block format or all valid files were filtered."
      );
    }

    const hasIndexFile = Object.keys(filteredFiles).some((file) =>
      file.includes("/index.")
    );
    const hasAppFileFinal = Object.keys(filteredFiles).some((file) =>
      file.includes("/App.")
    );

    if (!hasIndexFile || !hasAppFileFinal) {
      console.warn(
        "AI did not generate both index and App files. Providing basic React boilerplate fallback."
      );
      const fallbackIndexContent = `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`;
      const fallbackAppContent = `import React from 'react';\n\nconst App = () => {\n  return (\n    <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">\n      <h1 className="text-2xl font-bold">AI Generated Content Missing or Invalid.</h1>\n      <p className="mt-2 text-lg">Please try a more specific prompt or rephrase your request.</p>\n    </div>\n  );\n};\n\nexport default App;`;
      const fallbackCssContent = `@tailwind base;\n@tailwind components;\n@tailwind utilities;`;

      if (!hasIndexFile) {
        filteredFiles["/index.jsx"] = fallbackIndexContent;
      }
      if (!hasAppFileFinal) {
        filteredFiles["/App.jsx"] = fallbackAppContent;
      }
      if (
        !filteredFiles["/index.css"] &&
        !Object.keys(filteredFiles).some((file) => file.endsWith(".css"))
      ) {
        filteredFiles["/index.css"] = fallbackCssContent;
      }
    }

    console.log("\n--- server.js: FINAL FILES SENT TO FRONTEND ---");
    console.log(JSON.stringify(filteredFiles, null, 2));
    console.log("--- END server.js: FINAL FILES SENT TO FRONTEND ---\n");

    res.json({ files: filteredFiles });
  } catch (error) {
    console.error("❌ Backend code generation error:", error);
    res
      .status(500)
      .json({ message: `Code generation failed: ${error.message}` });
  }
});


// 🚀 This is the secure backend route for uploading files to GitHub using a bot token.
app.post('/api/upload-to-github', async (req, res) => {
  // 🚨 CRITICAL: We now check for a server-side bot token.
  const botAccessToken = process.env.GITHUB_BOT_TOKEN;

  if (!botAccessToken) {
    return res.status(500).json({ error: 'Server configuration error: GITHUB_BOT_TOKEN not found.' });
  }

  const { repoUrl, generatedFiles } = req.body;

  if (!repoUrl || !generatedFiles || generatedFiles.length === 0) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    // Parse the repo URL to get the owner and repo name
    const urlParts = repoUrl.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1].replace('.git', '');

    const octokit = new Octokit({ auth: botAccessToken });
    const branch = 'main';

    // 1. Get the latest commit SHA of the default branch
    const { data: { commit: { sha: latestSha } } } = await octokit.repos.getBranch({
      owner,
      repo,
      branch,
    });

    // 2. Create a new tree with the files to be uploaded
    const fileBlobs = await Promise.all(
      generatedFiles.map(file => octokit.git.createBlob({
        owner,
        repo,
        content: file.code,
        encoding: 'utf-8',
      }))
    );

    const tree = fileBlobs.map((blob, index) => ({
      path: generatedFiles[index].path,
      mode: '100644', // File mode for regular file
      type: 'blob',
      sha: blob.data.sha,
    }));

    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: latestSha,
      tree,
    });

    // 3. Create a new commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: 'Add new AI-generated files',
      tree: newTree.sha,
      parents: [latestSha],
    });

    // 4. Update the 'main' branch to point to the new commit
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    res.status(200).json({ message: 'Files uploaded successfully!' });

  } catch (error) {
    console.error('GitHub API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to upload files to GitHub.' });
  }
});

app.get("/api/chat/:sessionId", async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: "Chat session not found." });
    }
    res.json(session);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching chat session.", error: error.message });
  }
});


mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
