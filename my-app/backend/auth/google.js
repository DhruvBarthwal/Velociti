import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config(); // ✅ This is required here

import User from "../model/user.js"; // Adjust path if needed

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // ✅ This was undefined before
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
    },
    // Inside your GoogleStrategy callback in your backend
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google Profile Photos:", profile.photos); // <--- Add this line
      try {
        const existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
          // You should also update the picture URL for existing users here
          // in case their stored URL is old/http.
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
          picture: profile.photos[0].value, // This is where the URL comes from
        });

        await newUser.save();
        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id); // ✅ Save MongoDB ID to session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
