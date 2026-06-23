const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '請輸入完整的使用者名稱和密碼！' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密碼長度需至少 6 個字元！' });
  }

  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ error: '此使用者名稱已被註冊！' });
    }

    user = new User({ username, password });
    await user.save();

    res.status(201).json({ message: '註冊成功！請登入。' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試！' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '請輸入使用者名稱和密碼！' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: '使用者名稱或密碼錯誤！' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: '使用者名稱或密碼錯誤！' });
    }

    const payload = {
      id: user.id,
      username: user.username
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'localdevsecretkey12345',
      { expiresIn: '1d' }
    );

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ message: '登入成功！', username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試！' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user & clear cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: '登出成功！' });
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: '找不到該使用者' });
    }
    res.json(user);
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試！' });
  }
});

module.exports = router;
