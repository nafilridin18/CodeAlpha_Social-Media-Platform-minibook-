const fs = require('fs');
const path = require('path');
const db = require('./db');

const brainDir = path.resolve('C:/Users/user/.gemini/antigravity-ide/brain/8603b1b1-7c1e-4e2e-a519-75f0bd225a23');
const files = fs.readdirSync(brainDir);

const findLatest = (prefix) => {
  const match = files.filter(f => f.startsWith(prefix) && f.endsWith('.jpg')).sort().pop();
  return match ? path.join(brainDir, match) : null;
};

const copySafe = (src, destRel) => {
  const dest = path.join(__dirname, '..', destRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (src && fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Copied', path.basename(src), '->', destRel);
  } else {
    console.warn('Source not found:', src);
  }
};

copySafe(findLatest('alice_avatar'), 'uploads/avatars/alice.jpg');
copySafe(findLatest('ben_avatar'), 'uploads/avatars/ben.jpg');
copySafe(findLatest('chloe_avatar'), 'uploads/avatars/chloe.jpg');

copySafe(findLatest('alice_cover'), 'uploads/covers/alice-cover.jpg');
copySafe(findLatest('ben_cover'), 'uploads/covers/ben-cover.jpg');
copySafe(findLatest('chloe_cover'), 'uploads/covers/chloe-cover.jpg');

copySafe(findLatest('alice_post1'), 'uploads/posts/alice-coffee.jpg');
copySafe(findLatest('ben_post1'), 'uploads/posts/ben-trail.jpg');
copySafe(findLatest('chloe_post1'), 'uploads/posts/chloe-vinyl.jpg');

// Update database profiles
db.prepare(`UPDATE users SET avatar_path = '/uploads/avatars/alice.jpg', cover_path = '/uploads/covers/alice-cover.jpg' WHERE username = 'alice'`).run();
db.prepare(`UPDATE users SET avatar_path = '/uploads/avatars/ben.jpg', cover_path = '/uploads/covers/ben-cover.jpg' WHERE username = 'ben'`).run();
db.prepare(`UPDATE users SET avatar_path = '/uploads/avatars/chloe.jpg', cover_path = '/uploads/covers/chloe-cover.jpg' WHERE username = 'chloe'`).run();

// Update existing posts or add rich image posts for each dummy account
const addPost = db.prepare('INSERT INTO posts (author_id, content, media_path, media_type, visibility) VALUES (?, ?, ?, ?, ?)');

const aliceUser = db.prepare("SELECT id FROM users WHERE username = 'alice'").get();
const benUser = db.prepare("SELECT id FROM users WHERE username = 'ben'").get();
const chloeUser = db.prepare("SELECT id FROM users WHERE username = 'chloe'").get();

if (aliceUser) {
  // Update alice's first post or insert a rich photo post
  addPost.run(aliceUser.id, 'Quiet mornings with good coffee and fresh pages ☕📖✨ Wishing everyone a gentle day ahead!', '/uploads/posts/alice-coffee.jpg', 'image', 'public');
}

if (benUser) {
  addPost.run(benUser.id, 'Reached the high ridge just as the clouds parted over the Dolomites 🏔️📷 Nature never ceases to amaze me.', '/uploads/posts/ben-trail.jpg', 'image', 'public');
}

if (chloeUser) {
  addPost.run(chloeUser.id, 'Golden hour spins and cozy sounds 🎶 Spinning some classic favorites this evening.', '/uploads/posts/chloe-vinyl.jpg', 'image', 'public');
}

// Add sample messages for testing
const addMessage = db.prepare("INSERT INTO messages (sender_id, recipient_id, content, media_path, media_type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))");

const msgCount = db.prepare('SELECT COUNT(*) AS count FROM messages').get().count;
if (msgCount === 0 && aliceUser && benUser) {
  // Messages between Alice and Ben
  addMessage.run(aliceUser.id, benUser.id, 'Hey Ben! Did you get any good shots from the hiking trail this weekend? 🌄', null, null, 1, '-2 hours');
  addMessage.run(benUser.id, aliceUser.id, 'Yes! The lighting at sunrise was unreal 📸 Check this out!', '/uploads/posts/ben-trail.jpg', 'image', 1, '-90 minutes');
  addMessage.run(aliceUser.id, benUser.id, 'That is breathtaking! 😍 Loved the misty ridges!', null, null, 1, '-75 minutes');
  addMessage.run(benUser.id, aliceUser.id, 'Thanks Alice! Let me know when you are free for coffee ☕', null, null, 0, '-30 minutes');

  if (chloeUser) {
    addMessage.run(chloeUser.id, aliceUser.id, 'Hey Alice! Found a relaxing acoustic playlist you might love 🎧✨', null, null, 0, '-45 minutes');
    addMessage.run(aliceUser.id, chloeUser.id, 'Ooh please share the link! Listening while reading today 📖', null, null, 1, '-20 minutes');
  }

  // Also check if any other user exists (e.g. xafil_01 or registered user) and send them a friendly hello message!
  const otherUsers = db.prepare("SELECT id, username FROM users WHERE username NOT IN ('alice', 'ben', 'chloe')").all();
  for (const u of otherUsers) {
    addMessage.run(aliceUser.id, u.id, 'Welcome to Minibook! Feel free to say hi or share a photo 🎉👋', '/uploads/posts/alice-coffee.jpg', 'image', 0, '-10 minutes');
    addMessage.run(benUser.id, u.id, 'Hey! Welcome aboard. Happy to connect 🏔️✌️', null, null, 0, '-5 minutes');
  }
}

console.log('Dummy accounts updated with avatars, covers, and uploaded pictures successfully!');

console.log(db.prepare('SELECT id, username, display_name, avatar_path, cover_path FROM users').all());
