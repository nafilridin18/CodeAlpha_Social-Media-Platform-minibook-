(() => {
  const savedTheme = localStorage.getItem('minibook-theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-theme-toggle]');
    if (!toggle) return;
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('minibook-theme', nextTheme);
    toggle.setAttribute('aria-pressed', String(nextTheme === 'dark'));
    toggle.setAttribute('aria-label', `Switch to ${nextTheme === 'dark' ? 'light' : 'dark'} mode`);
    toggle.innerHTML = nextTheme === 'dark' ? '☀ <span>Light</span>' : '☾ <span>Dark</span>';
  });
})();
