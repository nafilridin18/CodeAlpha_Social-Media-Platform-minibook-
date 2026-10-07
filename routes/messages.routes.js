const express = require('express');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');
const { messageUpload } = require('../middleware/upload');

const router = express.Router();
router.use(requireLogin);

// Get total unread messages count
router.get('/unread-count', (req, res) => {
  const currentUserId = req.session.userId;
  const row = db.prepare(
    'SELECT COUNT(*) AS count FROM messages WHERE recipient_id = ? AND is_read = 0',
  ).get(currentUserId);
  res.json({ unread_count: row ? row.count : 0 });
});

// List all conversations for the current user
router.get('/conversations', (req, res) => {
  const currentUserId = req.session.userId;
  const conversations = db.prepare(`
    WITH user_messages AS (
      SELECT
        CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS partner_id,
        id, sender_id, recipient_id, content, media_path, media_type, is_read, created_at,
        ROW_NUMBER() OVER (
          PARTITION BY (CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END)
          ORDER BY created_at DESC, id DESC
        ) as rn
      FROM messages
      WHERE sender_id = ? OR recipient_id = ?
    )
    SELECT
      u.id AS partner_id,
      u.username AS partner_username,
      u.display_name AS partner_display_name,
      u.avatar_path AS partner_avatar,
      m.id AS last_message_id,
      m.sender_id AS last_sender_id,
      m.content AS last_content,
      m.media_path AS last_media_path,
      m.media_type AS last_media_type,
      m.created_at AS last_created_at,
      (
        SELECT COUNT(*)
        FROM messages
        WHERE sender_id = u.id AND recipient_id = ? AND is_read = 0
      ) AS unread_count
    FROM user_messages m
    JOIN users u ON u.id = m.partner_id
    WHERE m.rn = 1
    ORDER BY m.created_at DESC, m.id DESC
  `).all(currentUserId, currentUserId, currentUserId, currentUserId, currentUserId);

  res.json({ conversations });
});

// Resolve partner info by username (for direct links like /messages.html?u=alice)
router.get('/user/:username', (req, res) => {
  const user = db.prepare(
    'SELECT id, username, display_name, avatar_path, bio FROM users WHERE username = ?',
  ).get(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.id === req.session.userId) {
    return res.status(400).json({ error: 'You cannot message yourself.' });
  }
  res.json({ user });
});

// Get message history with a specific user and mark incoming as read
router.get('/:userId', (req, res) => {
  const currentUserId = req.session.userId;
  const partnerId = Number(req.params.userId);

  if (!Number.isSafeInteger(partnerId) || partnerId === currentUserId) {
    return res.status(400).json({ error: 'Invalid user conversation.' });
  }

  const partner = db.prepare(
    'SELECT id, username, display_name, avatar_path, bio FROM users WHERE id = ?',
  ).get(partnerId);
  if (!partner) return res.status(404).json({ error: 'User not found.' });

  // Mark all unread messages from this partner as read
  db.prepare(
    'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND recipient_id = ? AND is_read = 0',
  ).run(partnerId, currentUserId);

  const messages = db.prepare(`
    SELECT m.id, m.sender_id, m.recipient_id, m.content, m.media_path, m.media_type, m.is_read, m.created_at,
           u.username AS sender_username, u.display_name AS sender_display_name, u.avatar_path AS sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE (m.sender_id = ? AND m.recipient_id = ?)
       OR (m.sender_id = ? AND m.recipient_id = ?)
    ORDER BY m.created_at ASC, m.id ASC
    LIMIT 200
  `).all(currentUserId, partnerId, partnerId, currentUserId);

  res.json({ partner, messages });
});

// Send a message to a specific user (supports text, emoji, photo, video)
router.post('/:userId', messageUpload, (req, res) => {
  const currentUserId = req.session.userId;
  const partnerId = Number(req.params.userId);

  if (!Number.isSafeInteger(partnerId) || partnerId === currentUserId) {
    return res.status(400).json({ error: 'You cannot message this user.' });
  }

  const partner = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(partnerId);
  if (!partner) return res.status(404).json({ error: 'User not found.' });

  const content = String(req.body.content || '').trim();
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Message text may be up to 2,000 characters.' });
  }

  const mediaFile = req.file;
  if (!content && !mediaFile) {
    return res.status(400).json({ error: 'Please enter a message or attach a photo/video.' });
  }

  const mediaPath = mediaFile ? `/uploads/messages/${mediaFile.filename}` : null;
  const mediaType = mediaFile ? (mediaFile.mimetype.startsWith('video/') ? 'video' : 'image') : null;

  const insertResult = db.prepare(`
    INSERT INTO messages (sender_id, recipient_id, content, media_path, media_type, is_read)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(currentUserId, partnerId, content, mediaPath, mediaType);

  const newMessage = db.prepare(`
    SELECT m.id, m.sender_id, m.recipient_id, m.content, m.media_path, m.media_type, m.is_read, m.created_at,
           u.username AS sender_username, u.display_name AS sender_display_name, u.avatar_path AS sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = ?
  `).get(insertResult.lastInsertRowid);

  res.status(201).json({ message: newMessage });
});

module.exports = router;
