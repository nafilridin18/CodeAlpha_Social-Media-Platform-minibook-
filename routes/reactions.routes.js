const express = require('express');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');
const { canView } = require('../utils/visibility');
const { createNotification } = require('../utils/notifications');

const router = express.Router();
const reactions = new Set(['like', 'love', 'laugh', 'wow', 'sad', 'angry']);

router.post('/reactions/:targetType/:targetId', requireLogin, (req, res) => {
  const { targetType } = req.params;
  const targetId = Number(req.params.targetId);
  const reaction = String(req.body.reaction || '');
  if (!['post', 'comment'].includes(targetType) || !Number.isSafeInteger(targetId) || !reactions.has(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction target or type.' });
  }
  const post = targetType === 'post'
    ? db.prepare('SELECT * FROM posts WHERE id = ?').get(targetId)
    : db.prepare('SELECT p.* FROM comments c JOIN posts p ON p.id = c.post_id WHERE c.id = ?').get(targetId);
  if (!post) return res.status(404).json({ error: 'Reaction target not found.' });
  if (!canView(post, req.session.userId)) return res.status(403).json({ error: 'You cannot react to this content.' });

  const existing = db.prepare('SELECT reaction FROM reactions WHERE user_id = ? AND target_type = ? AND target_id = ?')
    .get(req.session.userId, targetType, targetId);
  if (existing && existing.reaction === reaction) {
    db.prepare('DELETE FROM reactions WHERE user_id = ? AND target_type = ? AND target_id = ?')
      .run(req.session.userId, targetType, targetId);
    if (targetType === 'post') {
      db.prepare(`
        DELETE FROM notifications
        WHERE recipient_id = ? AND actor_id = ? AND type = 'like' AND post_id = ?
      `).run(post.author_id, req.session.userId, targetId);
    }
    const reactionCount = db.prepare(
      'SELECT COUNT(*) AS count FROM reactions WHERE target_type = ? AND target_id = ?',
    ).get(targetType, targetId).count;
    return res.json({ reaction: null, reaction_count: reactionCount });
  }
  db.prepare(`
    INSERT INTO reactions (user_id, target_type, target_id, reaction) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, target_type, target_id) DO UPDATE SET reaction = excluded.reaction, created_at = datetime('now')
  `).run(req.session.userId, targetType, targetId, reaction);
  if (targetType === 'post') {
    createNotification({
      recipientId: post.author_id,
      actorId: req.session.userId,
      type: 'like',
      postId: post.id,
    });
  }
  const reactionCount = db.prepare(
    'SELECT COUNT(*) AS count FROM reactions WHERE target_type = ? AND target_id = ?',
  ).get(targetType, targetId).count;
  res.json({ reaction, reaction_count: reactionCount });
});

router.get('/reactions/:targetType/:targetId', (req, res) => {
  const { targetType } = req.params;
  const targetId = Number(req.params.targetId);
  if (!['post', 'comment'].includes(targetType) || !Number.isSafeInteger(targetId)) {
    return res.status(400).json({ error: 'Invalid reaction target.' });
  }
  const post = targetType === 'post'
    ? db.prepare('SELECT * FROM posts WHERE id = ?').get(targetId)
    : db.prepare('SELECT p.* FROM comments c JOIN posts p ON p.id = c.post_id WHERE c.id = ?').get(targetId);
  if (!post) return res.status(404).json({ error: 'Reaction target not found.' });
  if (!canView(post, req.session.userId)) return res.status(403).json({ error: 'You cannot view these reactions.' });
  const counts = db.prepare(
    'SELECT reaction, COUNT(*) AS count FROM reactions WHERE target_type = ? AND target_id = ? GROUP BY reaction',
  ).all(targetType, targetId);
  res.json({ counts });
});

module.exports = router;
