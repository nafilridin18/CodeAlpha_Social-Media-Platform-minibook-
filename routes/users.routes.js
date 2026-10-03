const express = require('express');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');
const { profileUpload } = require('../middleware/upload');
const { areFriends } = require('../utils/visibility');

const router = express.Router();

function profileData(user, viewerId) {
  const isSelf = Number(user.id) === Number(viewerId);
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    bio: user.bio,
    avatar_path: user.avatar_path,
    cover_path: user.cover_path,
    created_at: user.created_at,
    is_self: isSelf,
    are_friends: areFriends(user.id, viewerId),
    is_following: Boolean(viewerId && db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = ?').get(viewerId, user.id)),
    friend_request_sent: Boolean(viewerId && db.prepare(
      "SELECT 1 FROM friend_requests WHERE requester_id = ? AND recipient_id = ? AND status = 'pending'",
    ).get(viewerId, user.id)),
    friend_request_received: Boolean(viewerId && db.prepare(
      "SELECT 1 FROM friend_requests WHERE requester_id = ? AND recipient_id = ? AND status = 'pending'",
    ).get(user.id, viewerId)),
    counts: {
      posts: db.prepare('SELECT COUNT(*) AS count FROM posts WHERE author_id = ?').get(user.id).count,
      friends: db.prepare('SELECT COUNT(*) AS count FROM friendships WHERE user_low_id = ? OR user_high_id = ?').get(user.id, user.id).count,
      followers: db.prepare('SELECT COUNT(*) AS count FROM follows WHERE followed_id = ?').get(user.id).count,
    },
  };
}

router.get('/search', (req, res) => {
  const query = String(req.query.q || '').trim().slice(0, 60);
  if (!query) return res.json({ users: [] });
  const wildcard = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
  const users = db.prepare(
    "SELECT id, username, display_name, bio, avatar_path FROM users WHERE username LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\' ORDER BY username LIMIT 30",
  ).all(wildcard, wildcard);
  res.json({ users });
});

router.get('/:username', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: profileData(user, req.session.userId) });
});

router.patch('/me/profile', requireLogin, profileUpload, (req, res, next) => {
  try {
    const displayName = String(req.body.display_name || '').trim();
    const bio = String(req.body.bio || '').trim();
    if (displayName.length < 1 || displayName.length > 60 || bio.length > 280) {
      return res.status(400).json({ error: 'Display name is required (up to 60 characters); bio may be up to 280 characters.' });
    }
    const avatarFile = req.files?.avatar?.[0];
    const coverFile = req.files?.cover?.[0];
    const avatarPath = avatarFile ? `/uploads/avatars/${avatarFile.filename}` : null;
    const coverPath = coverFile ? `/uploads/covers/${coverFile.filename}` : null;
    db.prepare(`
      UPDATE users SET display_name = ?, bio = ?,
        avatar_path = COALESCE(?, avatar_path),
        cover_path = COALESCE(?, cover_path)
      WHERE id = ?
    `).run(displayName, bio, avatarPath, coverPath, req.session.userId);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
    res.json({ user: profileData(user, req.session.userId) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
