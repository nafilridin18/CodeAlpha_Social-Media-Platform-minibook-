window.renderComments = function renderComments(comments, container, postId) {
  const roots = comments.filter((comment) => !comment.parent_comment_id);
  const render = (comment, depth = 0) => {
    const replies = comments.filter((reply) => Number(reply.parent_comment_id) === Number(comment.id));
    return `<article class="comment" style="margin-left:${Math.min(depth, 4) * 18}px" data-comment-id="${comment.id}">
      <div class="post-head">${avatarHtml(comment, 'small')}<div><a class="post-author" href="/profile.html?u=${encodeURIComponent(comment.username)}">${escapeHtml(comment.display_name)}</a><span class="post-meta">${escapeHtml(comment.created_at)}</span></div></div>
      <p>${escapeHtml(comment.body)}</p>
      <div class="post-actions"><select aria-label="Choose reaction"><option value="like">👍 Like</option><option value="love">❤️ Love</option><option value="laugh">😂 Laugh</option><option value="wow">😮 Wow</option><option value="sad">😢 Sad</option><option value="angry">😠 Angry</option></select><button type="button" data-react="${comment.id}" data-target="comment">React ${comment.reaction_count ? `· ${comment.reaction_count}` : ''}</button><button type="button" class="reply-link" data-reply="${comment.id}">Reply</button></div>
      <div class="reply-box hidden" data-reply-box="${comment.id}"><form><textarea maxlength="1000" rows="2" required placeholder="Write a reply…"></textarea><button class="button" type="submit">Reply</button></form></div>
      ${replies.map((reply) => render(reply, depth + 1)).join('')}
    </article>`;
  };
  container.innerHTML = roots.length ? roots.map((comment) => render(comment)).join('') : '<p class="empty">Start the conversation.</p>';
  container.onclick = (event) => {
    const button = event.target.closest('[data-reply]');
    if (!button) return;
    const box = container.querySelector(`[data-reply-box="${button.dataset.reply}"]`);
    box.classList.toggle('hidden');
  };
  container.querySelectorAll('[data-reply-box] form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!currentUser) return location.assign('/login.html');
      const parentId = form.closest('[data-reply-box]').dataset.replyBox;
      try {
        const { comment_count: commentCount } = await api(`/api/posts/${postId}/comments`, {
          method: 'POST', body: { body: form.querySelector('textarea').value, parent_comment_id: Number(parentId) },
        });
        form.reset();
        const loaded = await api(`/api/posts/${postId}/comments`);
        window.renderComments(loaded.comments, container, postId);
        const count = document.querySelector('[data-comment-count]');
        if (count) count.textContent = `${commentCount} comments`;
      } catch (error) {
        alert(error.message);
      }
    });
  });
};
