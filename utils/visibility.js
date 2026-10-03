const db = require('../database/db');

function areFriends(firstUserId, secondUserId) {
  if (!firstUserId || !secondUserId || Number(firstUserId) === Number(secondUserId)) return false;
  const low = Math.min(Number(firstUserId), Number(secondUserId));
  const high = Math.max(Number(firstUserId), Number(secondUserId));
  return Boolean(db.prepare('SELECT 1 FROM friendships WHERE user_low_id = ? AND user_high_id = ?').get(low, high));
}

function canView(post, viewerId) {
  if (post.visibility === 'public') return true;
  if (!viewerId) return false;
  if (Number(post.author_id) === Number(viewerId)) return true;
  return post.visibility === 'friends' && areFriends(post.author_id, viewerId);
}

module.exports = { areFriends, canView };
