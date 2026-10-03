function personLink(person) {
  const image = person.avatar_path
    ? `<img class="avatar" src="${escapeHtml(person.avatar_path)}" alt="">`
    : `<span class="avatar">${escapeHtml((person.display_name || person.username).slice(0, 1).toUpperCase())}</span>`;
  return `<a class="person-card" href="/profile.html?u=${encodeURIComponent(person.username)}">${image}<div><strong>${escapeHtml(person.display_name)}</strong><p>@${escapeHtml(person.username)}</p></div></a>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!await loadCurrentUser()) return location.assign('/login.html');
    const data = await api('/api/friends');
    document.querySelector('#friends').innerHTML = data.friends.length ? data.friends.map(personLink).join('') : '<div class="empty">Your friend list is ready for its first addition.</div>';
    document.querySelector('#outgoing').innerHTML = data.outgoing.length
      ? data.outgoing.map((person) => `<div class="person-card">${personLink(person)}<span class="post-meta">Pending</span></div>`).join('')
      : '<p>No sent requests.</p>';
    const incoming = document.querySelector('#incoming');
    incoming.innerHTML = data.incoming.length ? data.incoming.map((person) => `<div class="person-card">${personLink(person)}<span class="request-actions"><button class="button" data-accept="${person.request_id}">Accept</button><button class="button secondary" data-reject="${person.request_id}">Decline</button></span></div>`).join('') : '<p>No new requests.</p>';
    incoming.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-accept], [data-reject]');
      if (!button) return;
      const action = button.dataset.accept ? 'accept' : 'reject';
      await api(`/api/friends/requests/${button.dataset.accept || button.dataset.reject}/${action}`, { method: 'POST' });
      location.reload();
    });
  } catch (error) {
    document.querySelector('#friends').innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
});
