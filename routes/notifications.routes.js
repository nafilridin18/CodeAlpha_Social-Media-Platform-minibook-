const express = require('express');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

router.get('/', (req, res) => {
  const recipientId = req.session.userId;
  const notifications = db.prepare(`
    SELECT n.id, n.type, n.post_id, n.comment_id, n.is_read, n.created_at,
      u.username AS actor_username, u.display_name AS actor_display_name,
      u.avatar_path AS actor_avatar, p.content AS post_preview
    FROM notifications n
    JOIN users u ON u.id = n.actor_id
    JOIN posts p ON p.id = n.post_id
    WHERE n.recipient_id = ?
    ORDER BY n.created_at DESC, n.id DESC
    LIMIT 100
  `).all(recipientId);
  const unreadCount = db.prepare(
    'SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ? AND is_read = 0',
  ).get(recipientId).count;
  res.json({ notifications, unread_count: unreadCount });
});

router.post('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0')
    .run(req.session.userId);
  res.json({ ok: true, unread_count: 0 });
});

router.post('/:notificationId/read', (req, res) => {
  const notificationId = Number(req.params.notificationId);
  if (!Number.isSafeInteger(notificationId) || notificationId < 1) {
    return res.status(400).json({ error: 'Invalid notification.' });
  }
  const result = db.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?',
  ).run(notificationId, req.session.userId);
  if (!result.changes) return res.status(404).json({ error: 'Notification not found.' });
  res.json({ ok: true });
});

module.exports = router;
