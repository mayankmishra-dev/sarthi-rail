const API = '/api';

// If already logged in, skip straight to the dashboard.
if (localStorage.getItem('sr_token')) {
  window.location.href = 'dashboard.html';
}

const loginView = document.getElementById('loginView');
const registerView = document.getElementById('registerView');

document.getElementById('toRegister').addEventListener('click', () => {
  loginView.style.display = 'none';
  registerView.style.display = 'block';
});
document.getElementById('toLogin').addEventListener('click', () => {
  registerView.style.display = 'none';
  loginView.style.display = 'block';
});

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.add('show');
}
function hideError(id) {
  document.getElementById(id).classList.remove('show');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError('loginError');
  const btn = document.getElementById('loginSubmit');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed.');

    localStorage.setItem('sr_token', data.token);
    localStorage.setItem('sr_user', JSON.stringify(data.user));
    window.location.href = 'dashboard.html';
  } catch (err) {
    showError('loginError', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log in';
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError('registerError');
  const btn = document.getElementById('registerSubmit');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('regName').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        password: document.getElementById('regPassword').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed.');

    localStorage.setItem('sr_token', data.token);
    localStorage.setItem('sr_user', JSON.stringify(data.user));
    window.location.href = 'dashboard.html';
  } catch (err) {
    showError('registerError', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create account';
  }
});
