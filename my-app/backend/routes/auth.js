import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post('/google', async (req, res) => {
  const { name, email, picture, googleId } = req.body;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, picture, googleId });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  res.cookie('token', token, { httpOnly: true }).json({
    user: {
      name: user.name,
      email: user.email,
      picture: user.picture,
    },
  });
});

router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
