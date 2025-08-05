// Filename: auth/strategies.js

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import dotenv from "dotenv";

dotenv.config();

import User from "../model/user.js";

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.
// This code is fine as-is because it deals with the Mongoose ObjectId correctly.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Use the GoogleStrategy within Passport.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google Profile Photos:", profile.photos);
      try {
        const existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
          if (existingUser.picture !== profile.photos[0].value) {
            existingUser.picture = profile.photos[0].value;
            await existingUser.save();
            console.log(
              "Backend: Updated existing user's picture URL to:",
              existingUser.picture
            );
          }
          return done(null, existingUser);
        }

        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          picture: profile.photos[0].value,
        });

        await newUser.save();
        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Use the GitHubStrategy within Passport.
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 🚨 FIX: Find the user by a dedicated 'githubId' field to avoid CastError.
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          // If a user doesn't exist, create a new one.
          user = new User({
            githubId: profile.id, // Store the GitHub ID here
            displayName: profile.displayName,
            username: profile.username,
            // ✅ FIX: Save the accessToken to the user model
            accessToken: accessToken,
          });
          await user.save();
        } else {
          // 💡 OPTIONAL: Update the accessToken if it changes
          user.accessToken = accessToken;
          await user.save();
        }

        // Return the user object to Passport
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
