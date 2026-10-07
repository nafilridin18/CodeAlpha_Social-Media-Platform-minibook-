window.escapeHtml = function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
};
window.avatarHtml = function avatarHtml(user, size = '') {
  const name = user.display_name || user.username || '?';
  const image = user.avatar_path
    ? `<img class="avatar ${size}" src="${escapeHtml(user.avatar_path)}" alt="">`
    : `<span class="avatar ${size}" aria-hidden="true">${escapeHtml(name.slice(0, 1).toUpperCase())}</span>`;
  return `<a href="/profile.html?u=${encodeURIComponent(user.username)}">${image}</a>`;
};
window.renderPost = function renderPost(post) {
  const author = `<a class="post-author" href="/profile.html?u=${encodeURIComponent(post.username)}">${escapeHtml(post.display_name || post.username)}</a>`;
  const media = post.media_path
    ? (post.media_type === 'video'
      ? `<video class="post-media" controls src="${escapeHtml(post.media_path)}"></video>`
      : `<img class="post-media" src="${escapeHtml(post.media_path)}" alt="Post attachment">`)
    : '';
  const shared = post.shared_post ? `<div class="shared-post"><strong>Shared post by ${escapeHtml(post.shared_post.display_name || post.shared_post.username)}</strong><p>${escapeHtml(post.shared_post.content)}</p></div>` : '';
  const body = post.content ? `<p class="post-text">${escapeHtml(post.content)}</p>` : '';
  return `<article class="panel post-card" data-post-id="${post.id}">
    <div class="post-head">${avatarHtml({ username: post.username, display_name: post.display_name, avatar_path: post.author_avatar }, '')}<div class="post-identity">${author}<span class="post-meta">${escapeHtml(post.created_at)} · ${escapeHtml(post.visibility)}</span></div></div>
    ${body}${media}${shared}
    <div class="engagement-summary"><span><strong data-reaction-count>${post.reaction_count || 0}</strong> reactions</span><a href="/post.html?id=${post.id}" data-comment-count>${post.comment_count || 0} comments</a></div>
    <div class="post-actions">
      <select aria-label="Choose reaction" data-reaction-select><option value="like">👍 Like</option><option value="love">❤️ Love</option><option value="laugh">😂 Laugh</option><option value="wow">😮 Wow</option><option value="sad">😢 Sad</option><option value="angry">😠 Angry</option></select>
      <button type="button" class="react-button" data-react="${post.id}" data-target="post">${post.my_reaction ? escapeHtml(post.my_reaction) : 'React'}</button>
      <a href="/post.html?id=${post.id}">Comment</a>
      ${window.currentUser && window.currentUser.id !== post.author_id ? `<button type="button" data-share="${post.id}">Share</button>` : ''}
      ${window.currentUser && window.currentUser.id === post.author_id ? `<button type="button" class="danger-text" data-delete="${post.id}">Delete</button>` : ''}
    </div>
  </article>`;
};

window.refreshNotificationBadge = async function refreshNotificationBadge() {
  const badge = document.querySelector('[data-notification-badge]');
  if (!badge || !window.currentUser) return;
  try {
    const { unread_count: unreadCount } = await api('/api/notifications');
    badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    badge.classList.toggle('hidden', unreadCount === 0);
    badge.setAttribute('aria-label', `${unreadCount} unread notifications`);
  } catch (error) {
    console.error('Unable to refresh notifications:', error);
  }
};

window.refreshMessageBadge = async function refreshMessageBadge() {
  const badge = document.querySelector('[data-message-badge]');
  if (!badge || !window.currentUser) return;
  try {
    const { unread_count: unreadCount } = await api('/api/messages/unread-count');
    badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    badge.classList.toggle('hidden', unreadCount === 0);
    badge.setAttribute('aria-label', `${unreadCount} unread messages`);
  } catch (error) {
    console.error('Unable to refresh messages badge:', error);
  }
};

function navItem(href, icon, label, active) {
  return `<a class="bottom-nav-item${active ? ' is-active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}>
    <span class="nav-icon" aria-hidden="true">${icon}</span><span class="nav-label">${label}</span>
  </a>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const nav = document.querySelector('#navbar');
  if (!nav) return;
  try {
    const user = await loadCurrentUser();
    const currentPath = window.location.pathname;
    const themeIsDark = document.documentElement.dataset.theme === 'dark';
    const themeButton = `<button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to ${themeIsDark ? 'light' : 'dark'} mode" aria-pressed="${themeIsDark}">${themeIsDark ? '☀ <span>Light</span>' : '☾ <span>Dark</span>'}</button>`;
    const icons = {
      feed: '<svg viewBox="0 0 24 24" fill="none"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z"/></svg>',
      discover: '<svg viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.2 16.2 5 5M10.8 7v7.6M7 10.8h7.6"/></svg>',
      messages: '<svg viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8.5Z"/></svg>',
      notifications: '<svg viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 13h4"/></svg>',
      profile: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    };
    nav.innerHTML = `<a class="brand" href="/" aria-label="Minibook home">mini<span>book</span><i>.</i></a>${themeButton}`;
    nav.classList.add('app-header');
    if (user) {
      const bottomNav = document.createElement('nav');
      bottomNav.className = 'bottom-nav';
      bottomNav.setAttribute('aria-label', 'Main navigation');
      bottomNav.innerHTML = [
        navItem('/', icons.feed, 'Feed', currentPath === '/'),
        navItem('/search.html', icons.discover, 'Find people', currentPath === '/search.html'),
        navItem('/messages.html', icons.messages, 'Messages<span class="notification-badge hidden" data-message-badge></span>', currentPath === '/messages.html'),
        navItem('/notifications.html', icons.notifications, 'Notifications<span class="notification-badge hidden" data-notification-badge></span>', currentPath === '/notifications.html'),
        navItem(`/profile.html?u=${encodeURIComponent(user.username)}`, icons.profile, 'Profile', currentPath === '/profile.html'),
      ].join('');
      document.body.append(bottomNav);
      document.body.classList.add('has-bottom-nav');
    }
    nav.querySelector('.brand').addEventListener('click', (event) => {
      if (currentPath !== '/') return;
      event.preventDefault();
      window.location.reload();
    });
    if (user) {
      await Promise.all([
        window.refreshNotificationBadge(),
        window.refreshMessageBadge(),
      ]);
      window.setInterval(() => {
        window.refreshNotificationBadge();
        window.refreshMessageBadge();
      }, 15000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          window.refreshNotificationBadge();
          window.refreshMessageBadge();
        }
      });
    }
  } catch (error) {
    nav.innerHTML = '<a class="brand" href="/">mini<span>book</span><i>.</i></a><span class="message">Could not load your session.</span>';
  }
});

document.addEventListener('click', async (event) => {
  const logoutButton = event.target.closest('[data-logout]');
  if (!logoutButton) return;
  try {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.replace('/login.html');
  } catch (error) {
    alert(error.message);
  }
});

document.addEventListener('change', (event) => {
  const input = event.target.closest('input[type="file"]');
  if (!input) return;
  const picker = input.closest('.file-label, .file-picker');
  const name = picker?.querySelector('.file-name');
  const button = picker?.querySelector('.file-picker-button');
  if (!name) return;
  const file = input.files?.[0];
  name.textContent = file ? file.name : name.dataset.emptyLabel || 'No file selected';
  picker.classList.toggle('has-file', Boolean(file));
  if (button && file) {
    button.textContent = input.name === 'cover' ? 'Change cover' : input.name === 'avatar' ? 'Change photo' : 'Change media';
  } else if (button) {
    button.textContent = input.name === 'cover' ? 'Choose cover' : input.name === 'avatar' ? 'Choose photo' : 'Add photo/video';
  }
});

document.addEventListener('click', async (event) => {
  const shareButton = event.target.closest('[data-share]');
  if (shareButton) {
    try {
      await api(`/api/posts/${shareButton.dataset.share}/share`, { method: 'POST', body: { visibility: 'public' } });
      shareButton.textContent = 'Shared';
      shareButton.disabled = true;
    } catch (error) {
      alert(error.message);
    }
  }
  const deleteButton = event.target.closest('[data-delete]');
  if (deleteButton && confirm('Delete this post?')) {
    try {
      await api(`/api/posts/${deleteButton.dataset.delete}`, { method: 'DELETE' });
      deleteButton.closest('[data-post-id]')?.remove();
    } catch (error) {
      alert(error.message);
    }
  }
});
