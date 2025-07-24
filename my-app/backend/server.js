import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import "./auth/google.js"; // important to load Passport strategy

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Express-session middleware (MUST be above passport)
app.use(
  session({
    secret: "velociti-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.get("/auth/logout", (req, res) => {
      req.logout(() => {
        req.session.destroy(() => {
          res.clearCookie("connect.sid"); // default session cookie name
          res.send({ message: "Logged out" });
        });
      });
    });

    app.listen(5000, () => {
      console.log("🚀 Server started on http://localhost:5000");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
