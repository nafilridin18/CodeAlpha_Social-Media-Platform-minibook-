const db = require('../database/db');

function createNotification({ recipientId, actorId, type, postId, commentId = null }) {
  if (Number(recipientId) === Number(actorId)) return;
  db.prepare(`
    INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(recipientId, actorId, type, postId, commentId);
}

module.exports = { createNotification };
