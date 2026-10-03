window.currentUser = null;
window.loadCurrentUser = async function loadCurrentUser() {
  const { user } = await api('/api/auth/me');
  window.currentUser = user;
  return user;
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('#login-form');
  const registerForm = document.querySelector('#register-form');
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/';
  const crossLink = document.querySelector(loginForm ? '[data-register-link]' : '[data-login-link]');
  if (crossLink && next) {
    crossLink.href = `${loginForm ? '/register.html' : '/login.html'}?next=${encodeURIComponent(safeNext)}`;
  }
  const form = loginForm || registerForm;
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.querySelector('.message');
    const data = Object.fromEntries(new FormData(form));
    try {
      const result = await api(`/api/auth/${loginForm ? 'login' : 'register'}`, { method: 'POST', body: data });
      window.currentUser = result.user;
      window.location.replace(safeNext);
    } catch (error) {
      showMessage(message, error.message);
    }
  });
});
