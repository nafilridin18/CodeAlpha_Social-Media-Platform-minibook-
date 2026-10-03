window.api = async function api(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
};
window.showMessage = function showMessage(element, text, success = false) {
  if (!element) return;
  element.textContent = text || '';
  element.classList.toggle('success', Boolean(success));
};
