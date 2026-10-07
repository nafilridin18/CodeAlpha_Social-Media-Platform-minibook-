const bcrypt = require('bcryptjs');
const db = require('./db');

const seed = db.transaction(() => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (count > 0) {
    console.log('Database already has users; seed skipped.');
    return;
  }

  const passwordHash = bcrypt.hashSync('minibook123', 10);
  const addUser = db.prepare(
    'INSERT INTO users (username, password_hash, display_name, bio, avatar_path, cover_path) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const alice = Number(addUser.run('alice', passwordHash, 'Alice Morgan', 'Coffee, books, and small adventures.', '/uploads/avatars/alice.jpg', '/uploads/covers/alice-cover.jpg').lastInsertRowid);
  const ben = Number(addUser.run('ben', passwordHash, 'Ben Carter', 'Photographer and weekend hiker.', '/uploads/avatars/ben.jpg', '/uploads/covers/ben-cover.jpg').lastInsertRowid);
  const chloe = Number(addUser.run('chloe', passwordHash, 'Chloe Rivera', 'Always finding a new playlist.', '/uploads/avatars/chloe.jpg', '/uploads/covers/chloe-cover.jpg').lastInsertRowid);

  const friendship = [Math.min(alice, ben), Math.max(alice, ben)];
  db.prepare('INSERT INTO friendships (user_low_id, user_high_id) VALUES (?, ?)').run(...friendship);
  db.prepare("INSERT INTO friend_requests (requester_id, recipient_id, status) VALUES (?, ?, 'accepted')").run(alice, ben);
  db.prepare('INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)').run(chloe, alice);

  const addPost = db.prepare('INSERT INTO posts (author_id, content, media_path, media_type, visibility) VALUES (?, ?, ?, ?, ?)');
  const postId = Number(addPost.run(alice, 'Welcome to Minibook! Share a little moment with your friends.', null, null, 'public').lastInsertRowid);
  addPost.run(alice, 'Quiet mornings with good coffee and fresh pages ☕📖✨ Wishing everyone a gentle day ahead!', '/uploads/posts/alice-coffee.jpg', 'image', 'public');
  addPost.run(ben, 'Reached the high ridge just as the clouds parted over the Dolomites 🏔️📷 Nature never ceases to amaze me.', '/uploads/posts/ben-trail.jpg', 'image', 'public');
  addPost.run(ben, 'A quiet trail and a clear sky — exactly what I needed today.', null, null, 'friends');
  addPost.run(chloe, 'Golden hour spins and cozy sounds 🎶 Spinning some classic favorites this evening.', '/uploads/posts/chloe-vinyl.jpg', 'image', 'public');
  addPost.run(chloe, 'New here. Looking forward to connecting!', null, null, 'public');
  db.prepare('INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)').run(postId, ben, 'Happy to see you here!');
  db.prepare("INSERT INTO reactions (user_id, target_type, target_id, reaction) VALUES (?, 'post', ?, 'love')").run(ben, postId);
});

seed();
console.log('Seed complete. Demo password for alice, ben, and chloe: minibook123');
