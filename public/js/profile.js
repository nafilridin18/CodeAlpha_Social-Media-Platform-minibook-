document.addEventListener('DOMContentLoaded', async () => {
  const username = new URLSearchParams(location.search).get('u');
  const container = document.querySelector('#profile');
  const postsContainer = document.querySelector('#profile-posts');
  if (!username) {
    container.innerHTML = '<p>Select a profile from Discover.</p>';
    return;
  }
  try {
    const [{ user }, { posts }] = await Promise.all([
      api(`/api/users/${encodeURIComponent(username)}`),
      api(`/api/posts/user/${encodeURIComponent(username)}`),
    ]);
    const avatar = user.avatar_path
      ? `<img class="avatar large" src="${escapeHtml(user.avatar_path)}" alt="">`
      : `<span class="avatar large">${escapeHtml(user.display_name.slice(0, 1).toUpperCase())}</span>`;
    const cover = user.cover_path ? `<img class="profile-cover-image" src="${escapeHtml(user.cover_path)}" alt="">` : '';
    const editButton = user.is_self
      ? '<button type="button" class="icon-button profile-edit-trigger" data-open-profile-edit aria-label="Edit your profile" title="Edit profile"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg></button>'
      : '';
    container.innerHTML = `${editButton}<div class="profile-cover">${cover}</div><div class="profile-details">${avatar}<div class="profile-info"><p class="eyebrow">@${escapeHtml(user.username)}</p><h1>${escapeHtml(user.display_name)}</h1><p class="profile-bio">${escapeHtml(user.bio || 'No bio yet.')}</p><div class="profile-counts"><span><strong>${user.counts.posts}</strong> posts &amp; shares</span><span><strong>${user.counts.friends}</strong> friends</span><span><strong>${user.counts.followers}</strong> followers</span></div><div class="profile-buttons" id="profile-buttons"></div></div></div>`;
    postsContainer.innerHTML = posts.length ? posts.map(renderPost).join('') : '<div class="empty">No visible posts yet.</div>';
    const buttons = document.querySelector('#profile-buttons');
    if (user.is_self) {
      const edit = document.querySelector('#edit-profile');
      const editBackdrop = document.querySelector('#profile-edit-backdrop');
      const postForm = document.querySelector('#profile-post-form');
      postForm.classList.remove('hidden');
      edit.elements.display_name.value = user.display_name;
      edit.elements.bio.value = user.bio;
      container.querySelector('[data-open-profile-edit]').addEventListener('click', () => {
        editBackdrop.classList.remove('hidden');
        edit.elements.display_name.focus();
      });
      editBackdrop.querySelector('[data-close-profile-edit]').addEventListener('click', () => {
        editBackdrop.classList.add('hidden');
      });
      editBackdrop.addEventListener('click', (event) => {
        if (event.target === editBackdrop) editBackdrop.classList.add('hidden');
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') editBackdrop.classList.add('hidden');
      });
      edit.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await api('/api/users/me/profile', { method: 'PATCH', body: new FormData(edit) });
          location.reload();
        } catch (error) {
          showMessage(edit.querySelector('.message'), error.message);
        }
      });
      postForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await api('/api/posts', { method: 'POST', body: new FormData(postForm) });
          window.location.reload();
        } catch (error) {
          showMessage(postForm.querySelector('.message'), error.message);
        }
      });
    } else if (currentUser) {
      if (user.are_friends) {
        buttons.innerHTML = '<button class="button secondary" disabled>Friends</button><button class="button danger" id="remove-friend">Remove friend</button>';
        buttons.querySelector('#remove-friend').onclick = async () => {
          await api(`/api/friends/${user.id}`, { method: 'DELETE' });
          location.reload();
        };
      } else {
        buttons.innerHTML = `<button class="button" id="friend-action">${user.friend_request_received ? 'Accept request' : user.friend_request_sent ? 'Request sent' : 'Add friend'}</button>`;
        buttons.querySelector('#friend-action').onclick = async () => {
          try {
            await api(`/api/friends/requests/${user.id}`, { method: 'POST' });
            buttons.querySelector('#friend-action').textContent = 'Request sent';
            buttons.querySelector('#friend-action').disabled = true;
          } catch (error) { alert(error.message); }
        };
      }
      buttons.insertAdjacentHTML('beforeend', `<button class="button secondary" id="follow-action">${user.is_following ? 'Following' : 'Follow'}</button>`);
      buttons.querySelector('#follow-action').onclick = async (event) => {
        const following = user.is_following;
        await api(`/api/follows/${user.id}`, { method: following ? 'DELETE' : 'POST' });
        event.currentTarget.textContent = following ? 'Follow' : 'Following';
        user.is_following = !following;
      };
    }
  } catch (error) {
    container.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    postsContainer.replaceChildren();
  }
});
