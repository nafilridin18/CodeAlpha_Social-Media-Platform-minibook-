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
    'INSERT INTO users (username, password_hash, display_name, bio) VALUES (?, ?, ?, ?)',
  );
  const alice = Number(addUser.run('alice', passwordHash, 'Alice Morgan', 'Coffee, books, and small adventures.').lastInsertRowid);
  const ben = Number(addUser.run('ben', passwordHash, 'Ben Carter', 'Photographer and weekend hiker.').lastInsertRowid);
  const chloe = Number(addUser.run('chloe', passwordHash, 'Chloe Rivera', 'Always finding a new playlist.').lastInsertRowid);

  const friendship = [Math.min(alice, ben), Math.max(alice, ben)];
  db.prepare('INSERT INTO friendships (user_low_id, user_high_id) VALUES (?, ?)').run(...friendship);
  db.prepare("INSERT INTO friend_requests (requester_id, recipient_id, status) VALUES (?, ?, 'accepted')").run(alice, ben);
  db.prepare('INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)').run(chloe, alice);

  const addPost = db.prepare('INSERT INTO posts (author_id, content, visibility) VALUES (?, ?, ?)');
  const postId = Number(addPost.run(alice, 'Welcome to Minibook! Share a little moment with your friends.', 'public').lastInsertRowid);
  addPost.run(ben, 'A quiet trail and a clear sky — exactly what I needed today.', 'friends');
  addPost.run(chloe, 'New here. Looking forward to connecting!', 'public');
  db.prepare('INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)').run(postId, ben, 'Happy to see you here!');
  db.prepare("INSERT INTO reactions (user_id, target_type, target_id, reaction) VALUES (?, 'post', ?, 'love')").run(ben, postId);
});

seed();
console.log('Seed complete. Demo password for alice, ben, and chloe: minibook123');
