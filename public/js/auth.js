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

  if (registerForm) {
    const pwdInput = registerForm.querySelector('input[name="password"]');
    const confirmInput = registerForm.querySelector('input[name="confirm_password"]');
    const matchHint = registerForm.querySelector('#password-match-hint');

    const updatePasswordMatchUI = () => {
      if (!pwdInput || !confirmInput) return;
      if (!confirmInput.value) {
        confirmInput.setCustomValidity('');
        if (matchHint) {
          matchHint.textContent = 'Please re-enter your password to confirm.';
          matchHint.className = 'field-hint';
        }
        return;
      }

      if (pwdInput.value !== confirmInput.value) {
        confirmInput.setCustomValidity('Passwords do not match.');
        if (matchHint) {
          matchHint.textContent = 'Passwords do not match.';
          matchHint.className = 'field-hint field-hint-error';
        }
      } else {
        confirmInput.setCustomValidity('');
        if (matchHint) {
          matchHint.textContent = '✓ Passwords match.';
          matchHint.className = 'field-hint field-hint-success';
        }
      }
    };

    if (pwdInput && confirmInput) {
      pwdInput.addEventListener('input', () => {
        if (confirmInput.value) updatePasswordMatchUI();
      });
      confirmInput.addEventListener('input', updatePasswordMatchUI);
    }
  }

  const form = loginForm || registerForm;
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.querySelector('.message');
    const data = Object.fromEntries(new FormData(form));

    if (registerForm && form === registerForm) {
      if (data.password !== data.confirm_password) {
        showMessage(message, 'Passwords do not match.');
        const confirmInput = registerForm.querySelector('input[name="confirm_password"]');
        if (confirmInput) confirmInput.focus();
        return;
      }
    }

    try {
      const result = await api(`/api/auth/${loginForm ? 'login' : 'register'}`, { method: 'POST', body: data });
      window.currentUser = result.user;
      window.location.replace(safeNext);
    } catch (error) {
      showMessage(message, error.message);
    }
  });
});
