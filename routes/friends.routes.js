const express = require('express');
const db = require('../database/db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

router.post('/requests/:userId', (req, res) => {
  const recipientId = Number(req.params.userId);
  if (!Number.isSafeInteger(recipientId) || recipientId === req.session.userId) {
    return res.status(400).json({ error: 'Choose another user to send a request.' });
  }
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(recipientId)) return res.status(404).json({ error: 'User not found.' });
  const low = Math.min(recipientId, req.session.userId);
  const high = Math.max(recipientId, req.session.userId);
  if (db.prepare('SELECT 1 FROM friendships WHERE user_low_id = ? AND user_high_id = ?').get(low, high)) {
    return res.status(409).json({ error: 'You are already friends.' });
  }

  const incoming = db.prepare(
    "SELECT id FROM friend_requests WHERE requester_id = ? AND recipient_id = ? AND status = 'pending'",
  ).get(recipientId, req.session.userId);
  if (incoming) {
    db.transaction(() => {
      db.prepare("UPDATE friend_requests SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(incoming.id);
      db.prepare('INSERT OR IGNORE INTO friendships (user_low_id, user_high_id) VALUES (?, ?)').run(low, high);
    })();
    return res.json({ status: 'friends' });
  }

  db.prepare(`
    INSERT INTO friend_requests (requester_id, recipient_id, status)
    VALUES (?, ?, 'pending')
    ON CONFLICT(requester_id, recipient_id) DO UPDATE SET status = 'pending', updated_at = datetime('now')
  `).run(req.session.userId, recipientId);
  res.status(201).json({ status: 'pending' });
});

router.get('/', (req, res) => {
  const id = req.session.userId;
  const friends = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.avatar_path, f.created_at
    FROM friendships f
    JOIN users u ON u.id = CASE WHEN f.user_low_id = ? THEN f.user_high_id ELSE f.user_low_id END
    WHERE f.user_low_id = ? OR f.user_high_id = ?
    ORDER BY u.username
  `).all(id, id, id);
  const incoming = db.prepare(`
    SELECT r.id AS request_id, r.created_at, u.id AS user_id, u.username, u.display_name, u.avatar_path
    FROM friend_requests r JOIN users u ON u.id = r.requester_id
    WHERE r.recipient_id = ? AND r.status = 'pending' ORDER BY r.created_at DESC
  `).all(id);
  const outgoing = db.prepare(`
    SELECT r.id AS request_id, r.created_at, u.id AS user_id, u.username, u.display_name, u.avatar_path
    FROM friend_requests r JOIN users u ON u.id = r.recipient_id
    WHERE r.requester_id = ? AND r.status = 'pending' ORDER BY r.created_at DESC
  `).all(id);
  res.json({ friends, incoming, outgoing });
});

router.post('/requests/:requestId/accept', (req, res) => {
  const request = db.prepare(
    "SELECT * FROM friend_requests WHERE id = ? AND recipient_id = ? AND status = 'pending'",
  ).get(Number(req.params.requestId), req.session.userId);
  if (!request) return res.status(404).json({ error: 'Pending request not found.' });
  db.transaction(() => {
    db.prepare("UPDATE friend_requests SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(request.id);
    db.prepare('INSERT OR IGNORE INTO friendships (user_low_id, user_high_id) VALUES (?, ?)').run(
      Math.min(request.requester_id, request.recipient_id),
      Math.max(request.requester_id, request.recipient_id),
    );
  })();
  res.json({ status: 'accepted' });
});

router.post('/requests/:requestId/reject', (req, res) => {
  const result = db.prepare(`
    UPDATE friend_requests SET status = 'rejected', updated_at = datetime('now')
    WHERE id = ? AND recipient_id = ? AND status = 'pending'
  `).run(Number(req.params.requestId), req.session.userId);
  if (!result.changes) return res.status(404).json({ error: 'Pending request not found.' });
  res.json({ status: 'rejected' });
});

router.delete('/:userId', (req, res) => {
  const otherId = Number(req.params.userId);
  if (!Number.isSafeInteger(otherId)) return res.status(400).json({ error: 'Invalid user.' });
  db.transaction(() => {
    db.prepare('DELETE FROM friendships WHERE user_low_id = ? AND user_high_id = ?').run(
      Math.min(otherId, req.session.userId), Math.max(otherId, req.session.userId),
    );
    db.prepare("UPDATE friend_requests SET status = 'rejected', updated_at = datetime('now') WHERE (requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?)").run(
      req.session.userId, otherId, otherId, req.session.userId,
    );
  })();
  res.json({ status: 'removed' });
});

module.exports = router;
