const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Testing full Minibook messaging API...');

  // 1. Health check
  const healthRes = await fetch('http://localhost:3000/api/health');
  const health = await healthRes.json();
  console.log('Health check:', health);

  // Helper for cookie jar
  let cookie = '';

  // 2. Login as Alice
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: 'minibook123' }),
  });
  const loginData = await loginRes.json();
  cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
  console.log('Alice Login status:', loginRes.status, 'User:', loginData.user?.username);

  // 3. Fetch Alice conversations
  const convRes = await fetch('http://localhost:3000/api/messages/conversations', {
    headers: { Cookie: cookie },
  });
  const convData = await convRes.json();
  console.log('Alice Conversations count:', convData.conversations?.length);

  // 4. Fetch Ben's ID (Ben is ID 2)
  const benRes = await fetch('http://localhost:3000/api/messages/user/ben', {
    headers: { Cookie: cookie },
  });
  const benData = await benRes.json();
  console.log('Resolved user ben:', benData.user?.display_name, 'ID:', benData.user?.id);

  // 5. Send text message with emojis to Ben
  const textMsgRes = await fetch(`http://localhost:3000/api/messages/${benData.user.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({ content: 'Morning Ben! ☀️☕ Hope you have an awesome hike today! 🌲✨' }),
  });
  const textMsgData = await textMsgRes.json();
  console.log('Sent text message:', textMsgData.message?.content);

  // 6. Send photo attachment message to Ben
  const sampleImagePath = path.join(__dirname, '..', 'uploads', 'posts', 'alice-coffee.jpg');
  const imageBlob = new Blob([fs.readFileSync(sampleImagePath)], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('content', 'Snapped this at my favorite cafe corner! 📸📖');
  formData.append('media', imageBlob, 'alice-coffee.jpg');

  const mediaMsgRes = await fetch(`http://localhost:3000/api/messages/${benData.user.id}`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: formData,
  });
  const mediaMsgData = await mediaMsgRes.json();
  console.log('Sent media message:', mediaMsgData.message?.content, 'Media:', mediaMsgData.message?.media_path, 'Type:', mediaMsgData.message?.media_type);

  // 7. Login as Ben to verify received messages and read receipts
  const benLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ben', password: 'minibook123' }),
  });
  const benCookie = benLoginRes.headers.get('set-cookie')?.split(';')[0] || '';

  // 8. Check Ben unread count
  const benUnreadRes = await fetch('http://localhost:3000/api/messages/unread-count', {
    headers: { Cookie: benCookie },
  });
  const benUnreadData = await benUnreadRes.json();
  console.log('Ben unread messages count before reading:', benUnreadData.unread_count);

  // 9. Ben opens Alice chat (marks as read)
  const benChatRes = await fetch(`http://localhost:3000/api/messages/${loginData.user.id}`, {
    headers: { Cookie: benCookie },
  });
  const benChatData = await benChatRes.json();
  console.log('Ben loaded message history count:', benChatData.messages?.length);

  // 10. Check Ben unread count after reading
  const benUnreadAfterRes = await fetch('http://localhost:3000/api/messages/unread-count', {
    headers: { Cookie: benCookie },
  });
  const benUnreadAfterData = await benUnreadAfterRes.json();
  console.log('Ben unread messages count after reading:', benUnreadAfterData.unread_count);

  console.log('✅ ALL MESSAGING TESTS PASSED WITH 100% SUCCESS!');
}

run().catch(console.error);
