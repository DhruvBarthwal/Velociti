// Filename: /routes/authRoutes.js
import express from 'express';
import passport from 'passport';

const router = express.Router();

// ✅ Step 1: Redirect user to Google for authentication
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// ✅ Step 2: Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/`,
  }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/`);
  }
);

// ✅ Step 3: Get current user
router.get('/me', (req, res) => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: 'Not Authenticated' });
  }
});

// ✅ Step 4: Initiate GitHub authentication
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

// ✅ Removed the redundant /github/callback route as it is defined in server.js.

// ✅ Step 5: Logout user
router.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.send({ message: "Logged out" });
    });
  });
});

export default router;
