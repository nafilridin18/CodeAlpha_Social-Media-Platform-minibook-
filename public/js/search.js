document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#search-form');
  const results = document.querySelector('#results');
  const search = async (query) => {
    if (!query.trim()) {
      results.innerHTML = '<div class="empty">Search for someone by their name or username.</div>';
      return;
    }
    try {
      const { users } = await api(`/api/users/search?q=${encodeURIComponent(query)}`);
      results.innerHTML = users.length ? users.map((user) => {
        const avatar = user.avatar_path ? `<img class="avatar" src="${escapeHtml(user.avatar_path)}" alt="">` : `<span class="avatar">${escapeHtml(user.display_name.slice(0, 1).toUpperCase())}</span>`;
        return `<a class="person-card" href="/profile.html?u=${encodeURIComponent(user.username)}">${avatar}<div><strong>${escapeHtml(user.display_name)}</strong><p>@${escapeHtml(user.username)}${user.bio ? ` · ${escapeHtml(user.bio)}` : ''}</p></div></a>`;
      }).join('') : '<div class="empty">No matching people found.</div>';
    } catch (error) {
      results.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    }
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    search(form.elements.q.value);
  });
  const initial = new URLSearchParams(location.search).get('q');
  if (initial) {
    form.elements.q.value = initial;
    search(initial);
  } else {
    search('');
  }
});
