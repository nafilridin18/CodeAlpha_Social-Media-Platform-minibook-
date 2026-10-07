const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  display_name: user.display_name,
  bio: user.bio,
  avatar_path: user.avatar_path,
  created_at: user.created_at,
});

function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      req.session.save((saveError) => saveError ? reject(saveError) : resolve());
    });
  });
}

router.post('/register', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const displayName = String(req.body.display_name || username).trim();
    const password = String(req.body.password || '');
    const confirmPassword = req.body.confirm_password !== undefined ? String(req.body.confirm_password) : null;
    if (confirmPassword !== null && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3–24 characters using letters, numbers, or underscores.' });
    }
    if (displayName.length < 1 || displayName.length > 60 || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Enter a display name (up to 60 characters) and a password of 8–128 characters.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
    ).run(username, hash, displayName);
    const userId = Number(result.lastInsertRowid);
    await startSession(req, userId);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'That username is already taken.' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password_hash))) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }
    await startSession(req, user.id);
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireLogin, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  res.json({ user: user ? publicUser(user) : null });
});

module.exports = router;
