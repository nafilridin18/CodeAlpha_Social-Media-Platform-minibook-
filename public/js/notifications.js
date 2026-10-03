function notificationDescription(notification) {
  if (notification.type === 'like') return 'loved your post';
  if (notification.type === 'comment') return 'left a comment on your post';
  return 'shared your post';
}

function notificationTimestamp(value) {
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.querySelector('#notifications');
  const readAll = document.querySelector('#read-all');
  if (!await loadCurrentUser()) return window.location.assign('/login.html');

  const loadNotifications = async () => {
    try {
      const { notifications } = await api('/api/notifications');
      list.innerHTML = notifications.length ? notifications.map((item) => {
        const avatar = item.actor_avatar
          ? `<img class="avatar" src="${escapeHtml(item.actor_avatar)}" alt="">`
          : `<span class="avatar" aria-hidden="true">${escapeHtml(item.actor_display_name.slice(0, 1).toUpperCase())}</span>`;
        return `
        <a class="notification-item ${item.is_read ? '' : 'unread'}"
          href="/post.html?id=${item.post_id}" data-notification-id="${item.id}">
          ${avatar}
          <span class="notification-copy">
            <span><strong>${escapeHtml(item.actor_display_name)}</strong> ${notificationDescription(item)}</span>
            ${item.type === 'comment' && item.post_preview
              ? `<span class="notification-preview">${escapeHtml(item.post_preview)}</span>`
              : ''}
            <time>${escapeHtml(notificationTimestamp(item.created_at))}</time>
          </span>
          ${item.is_read ? '' : '<span class="unread-dot" aria-label="Unread"></span>'}
        </a>`;
      }).join('') : '<div class="empty notification-empty">Nothing new just yet. When someone likes, comments on, or shares your post, you’ll find it here.</div>';
    } catch (error) {
      list.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    }
  };

  readAll.addEventListener('click', async () => {
    try {
      await api('/api/notifications/read-all', { method: 'POST' });
      await loadNotifications();
      window.refreshNotificationBadge?.();
    } catch (error) {
      alert(error.message);
    }
  });

  list.addEventListener('click', async (event) => {
    const item = event.target.closest('[data-notification-id]');
    if (!item || !item.classList.contains('unread')) return;
    event.preventDefault();
    try {
      await api(`/api/notifications/${item.dataset.notificationId}/read`, { method: 'POST' });
      window.location.assign(item.href);
    } catch (error) {
      alert(error.message);
    }
  });

  await loadNotifications();
});
