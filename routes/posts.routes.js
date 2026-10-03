const express = require('express');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');
const { postUpload } = require('../middleware/upload');
const { canView } = require('../utils/visibility');
const { createNotification } = require('../utils/notifications');

const router = express.Router();
const postSelect = `
  SELECT p.*, u.username, u.display_name, u.avatar_path AS author_avatar,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
    (SELECT COUNT(*) FROM reactions r WHERE r.target_type = 'post' AND r.target_id = p.id) AS reaction_count,
    (SELECT reaction FROM reactions r WHERE r.target_type = 'post' AND r.target_id = p.id AND r.user_id = ?) AS my_reaction
  FROM posts p JOIN users u ON u.id = p.author_id
`;

router.post('/', requireLogin, postUpload, (req, res) => {
  const content = String(req.body.content || '').trim();
  const visibility = String(req.body.visibility || 'public');
  if (content.length > 2000) return res.status(400).json({ error: 'Post text may be up to 2,000 characters.' });
  if (!['public', 'friends', 'private'].includes(visibility)) return res.status(400).json({ error: 'Invalid visibility.' });
  if (!content && !req.file) return res.status(400).json({ error: 'Write something or attach a photo/video.' });
  const mediaPath = req.file ? `/uploads/posts/${req.file.filename}` : null;
  const mediaType = req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : null;
  const result = db.prepare(
    'INSERT INTO posts (author_id, content, media_path, media_type, visibility) VALUES (?, ?, ?, ?, ?)',
  ).run(req.session.userId, content, mediaPath, mediaType, visibility);
  const post = db.prepare(`${postSelect} WHERE p.id = ?`).get(req.session.userId, result.lastInsertRowid);
  res.status(201).json({ post });
});

router.get('/feed', (req, res) => {
  const viewerId = req.session.userId || null;
  const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
  const candidates = db.prepare(`${postSelect}
    WHERE p.id < ? AND (p.visibility = 'public' OR p.author_id = ? OR (
      p.visibility = 'friends' AND EXISTS (
        SELECT 1 FROM friendships f WHERE
          f.user_low_id = MIN(p.author_id, COALESCE(?, 0)) AND f.user_high_id = MAX(p.author_id, COALESCE(?, 0))
      )
    ))
    ORDER BY p.id DESC LIMIT 50
  `).all(viewerId, before, viewerId, viewerId, viewerId);
  const posts = candidates.filter((post) => !post.shared_post_id || canView(
    db.prepare('SELECT * FROM posts WHERE id = ?').get(post.shared_post_id) || { visibility: 'private' },
    viewerId,
  ));
  res.json({ posts });
});

router.get('/:postId', (req, res) => {
  const post = db.prepare(`${postSelect} WHERE p.id = ?`).get(req.session.userId || null, Number(req.params.postId));
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (!canView(post, req.session.userId)) return res.status(403).json({ error: 'You cannot view this post.' });
  if (post.shared_post_id) {
    const original = db.prepare(`${postSelect} WHERE p.id = ?`).get(req.session.userId || null, post.shared_post_id);
    post.shared_post = original && canView(original, req.session.userId) ? original : null;
  }
  res.json({ post });
});

router.get('/user/:username', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const candidates = db.prepare(`${postSelect} WHERE p.author_id = ? ORDER BY p.id DESC LIMIT 100`)
    .all(req.session.userId || null, user.id);
  res.json({ posts: candidates.filter((post) => canView(post, req.session.userId)) });
});

router.post('/:postId/share', requireLogin, (req, res) => {
  const original = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.postId));
  if (!original) return res.status(404).json({ error: 'Post not found.' });
  if (!canView(original, req.session.userId)) return res.status(403).json({ error: 'You cannot share this post.' });
  const visibility = ['public', 'friends', 'private'].includes(req.body.visibility) ? req.body.visibility : 'public';
  const content = String(req.body.content || '').trim().slice(0, 2000);
  const result = db.prepare('INSERT INTO posts (author_id, content, visibility, shared_post_id) VALUES (?, ?, ?, ?)')
    .run(req.session.userId, content, visibility, original.id);
  createNotification({
    recipientId: original.author_id,
    actorId: req.session.userId,
    type: 'share',
    postId: original.id,
  });
  res.status(201).json({ post_id: Number(result.lastInsertRowid) });
});

router.delete('/:postId', requireLogin, (req, res) => {
  const result = db.prepare('DELETE FROM posts WHERE id = ? AND author_id = ?').run(Number(req.params.postId), req.session.userId);
  if (!result.changes) return res.status(404).json({ error: 'Post not found or you do not own it.' });
  res.json({ deleted: true });
});

module.exports = router;
