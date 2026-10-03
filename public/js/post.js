document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(location.search).get('id');
  const detail = document.querySelector('#post-detail');
  const comments = document.querySelector('#comments');
  const form = document.querySelector('#comment-form');
  if (!id) {
    detail.innerHTML = '<div class="empty">No post was selected.</div>';
    form.classList.add('hidden');
    return;
  }
  try {
    const [{ post }, commentData] = await Promise.all([
      api(`/api/posts/${encodeURIComponent(id)}`),
      api(`/api/posts/${encodeURIComponent(id)}/comments`),
    ]);
    detail.innerHTML = renderPost(post);
    window.renderComments(commentData.comments, comments, post.id);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!currentUser) return location.assign('/login.html');
      try {
        const { comment, comment_count: commentCount } = await api(`/api/posts/${post.id}/comments`, { method: 'POST', body: { body: form.elements.body.value } });
        form.reset();
        const updated = [...commentData.comments, comment];
        commentData.comments = updated;
        window.renderComments(updated, comments, post.id);
        const count = detail.querySelector('[data-comment-count]');
        if (count) count.textContent = `${commentCount} comments`;
      } catch (error) {
        showMessage(form.querySelector('.message'), error.message);
      }
    });
  } catch (error) {
    detail.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    form.classList.add('hidden');
  }
});
