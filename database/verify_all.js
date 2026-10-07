const db = require('../database/db');

console.log('--- 1. Testing Dummy Users Data ---');
const users = db.prepare('SELECT id, username, display_name, avatar_path, cover_path FROM users').all();
console.table(users);

const posts = db.prepare('SELECT id, author_id, content, media_path, media_type FROM posts').all();
console.log('--- 2. Testing Posts with Media ---');
console.table(posts);

const messages = db.prepare('SELECT id, sender_id, recipient_id, content, media_path, media_type, is_read, created_at FROM messages').all();
console.log('--- 3. Testing Messages Table ---');
console.table(messages);

console.log('--- 4. Testing Conversations Query for Alice (ID: 1) ---');
const currentUserId = 1;
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
console.table(conversations);

console.log('--- 5. All database checks passed! ---');
