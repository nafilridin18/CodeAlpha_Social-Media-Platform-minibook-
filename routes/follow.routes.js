const express = require('express');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.post('/:userId', requireLogin, (req, res) => {
  const targetId = Number(req.params.userId);
  if (!Number.isSafeInteger(targetId) || targetId === req.session.userId) {
    return res.status(400).json({ error: 'Choose another user to follow.' });
  }
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(targetId)) return res.status(404).json({ error: 'User not found.' });
  db.prepare('INSERT OR IGNORE INTO follows (follower_id, followed_id) VALUES (?, ?)').run(req.session.userId, targetId);
  res.json({ following: true });
});

router.delete('/:userId', requireLogin, (req, res) => {
  const targetId = Number(req.params.userId);
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND followed_id = ?').run(req.session.userId, targetId);
  res.json({ following: false });
});

module.exports = router;
