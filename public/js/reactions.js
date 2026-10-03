document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-react]');
  if (!button) return;
  if (!currentUser) return location.assign('/login.html');
  const card = button.closest('[data-post-id]');
  const select = card?.querySelector('[data-reaction-select]');
  try {
    const result = await api(`/api/reactions/${button.dataset.target}/${button.dataset.react}`, {
      method: 'POST', body: { reaction: select?.value || 'like' },
    });
    const reactionCount = card?.querySelector('[data-reaction-count]');
    if (reactionCount) reactionCount.textContent = result.reaction_count;
    button.textContent = result.reaction ? `${select?.selectedOptions[0]?.textContent || result.reaction}` : 'React';
  } catch (error) {
    alert(error.message);
  }
});
