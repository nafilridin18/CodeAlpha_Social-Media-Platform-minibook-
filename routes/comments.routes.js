const express = require('express');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');
const { canView } = require('../utils/visibility');
const { createNotification } = require('../utils/notifications');

const router = express.Router();

router.get('/posts/:postId/comments', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.postId));
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (!canView(post, req.session.userId)) return res.status(403).json({ error: 'You cannot view these comments.' });
  const comments = db.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_path,
      (SELECT COUNT(*) FROM reactions r WHERE r.target_type = 'comment' AND r.target_id = c.id) AS reaction_count,
      (SELECT reaction FROM reactions r WHERE r.target_type = 'comment' AND r.target_id = c.id AND r.user_id = ?) AS my_reaction
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ? ORDER BY c.created_at
  `).all(req.session.userId || null, post.id);
  res.json({ comments });
});

router.post('/posts/:postId/comments', requireLogin, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.postId));
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (!canView(post, req.session.userId)) return res.status(403).json({ error: 'You cannot comment on this post.' });
  const body = String(req.body.body || '').trim();
  const parentId = req.body.parent_comment_id ? Number(req.body.parent_comment_id) : null;
  if (!body || body.length > 1000) return res.status(400).json({ error: 'Comment must be between 1 and 1,000 characters.' });
  if (parentId && !db.prepare('SELECT 1 FROM comments WHERE id = ? AND post_id = ?').get(parentId, post.id)) {
    return res.status(400).json({ error: 'Reply target does not belong to this post.' });
  }
  const result = db.prepare(
    'INSERT INTO comments (post_id, user_id, parent_comment_id, body) VALUES (?, ?, ?, ?)',
  ).run(post.id, req.session.userId, parentId, body);
  createNotification({
    recipientId: post.author_id,
    actorId: req.session.userId,
    type: 'comment',
    postId: post.id,
    commentId: Number(result.lastInsertRowid),
  });
  const comment = db.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_path, 0 AS reaction_count, NULL AS my_reaction
    FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?
  `).get(result.lastInsertRowid);
  const commentCount = db.prepare('SELECT COUNT(*) AS count FROM comments WHERE post_id = ?').get(post.id).count;
  res.status(201).json({ comment, comment_count: commentCount });
});

module.exports = router;
