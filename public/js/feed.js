document.addEventListener('DOMContentLoaded', async () => {
  const feed = document.querySelector('#feed');
  if (!feed) return;
  const form = document.querySelector('#post-form');
  try {
    const { posts } = await api('/api/posts/feed');
    feed.innerHTML = posts.length ? posts.map(renderPost).join('') : '<div class="empty">Your feed is quiet for now. Find people or share the first post.</div>';
  } catch (error) {
    feed.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) return window.location.assign('/login.html');
    const message = form.querySelector('.message');
    const data = new FormData(form);
    try {
      await api('/api/posts', { method: 'POST', body: data });
      window.location.reload();
    } catch (error) {
      showMessage(message, error.message);
    }
  });
});
