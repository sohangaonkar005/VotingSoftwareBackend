// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { ensureAuth } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// /user/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, age, email, mobile, address, aadharCardNumber, password, role } = req.body;
    if (!name || !age || !address || !aadharCardNumber || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const exists = await User.findOne({ aadharCardNumber: Number(aadharCardNumber) });
    if (exists) return res.status(409).json({ error: 'Aadhar already registered' });

    const user = new User({
      name, age, email, mobile, address,
      aadharCardNumber: Number(aadharCardNumber),
      password,
      role: role === 'admin' ? 'admin' : 'voter' // optionally create admin if role set (be careful)
    });
    await user.save();
    // don't return password
    const out = user.toObject();
    delete out.password;
    res.status(201).json({ message: 'User created', user: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// /user/login
router.post('/login', (req, res, next) => {
  // passport local expects fields aadharCardNumber and password in body
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Login failed' });
    req.logIn(user, (err) => {
      if (err) return next(err);
      const safe = { id: user._id, name: user.name, role: user.role, aadharCardNumber: user.aadharCardNumber, isVoted: user.isVoted };
      return res.json({ message: 'Logged in', user: safe });
    });
  })(req, res, next);
});

// /user/logout
router.post('/logout', (req, res) => {
  req.logout(() => {
    // callback for passport 0.6
    res.json({ message: 'Logged out' });
  });
});

// /user/profile (GET) - requires auth
router.get('/profile', ensureAuth, (req, res) => {
  const u = { id: req.user._id, name: req.user.name, aadharCardNumber: req.user.aadharCardNumber, role: req.user.role, isVoted: req.user.isVoted };
  res.json({ user: u });
});

// /user/profile/password (PUT) - change password
router.put('/profile/password', ensureAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Provide old and new password' });

    const user = await User.findById(req.user._id);
    const ok = await user.comparePassword(oldPassword);
    if (!ok) return res.status(401).json({ error: 'Old password incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
