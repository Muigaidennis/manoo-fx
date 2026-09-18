(() => {
  const API_BASE = 'https://api.derivws.com/trading/v1/options';
  const status = document.getElementById('status');
  const prompt = document.getElementById('login-prompt');
  const accountWrap = document.getElementById('account-card-wrap');
  const balance = document.getElementById('balance-amount');
  const badge = document.getElementById('account-badge');

  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const format = value => Number.isFinite(Number(value))
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 })
    : '—';
  const showLogin = message => {
    if (status) status.innerHTML = message || '';
    if (prompt) prompt.style.display = 'block';
  };
  const showError = message => showLogin(`<span class="err">${escapeHtml(message)}</span>`);

  async function fetchAccounts(token) {
    const response = await fetch(`${API_BASE}/accounts`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.errors?.[0]?.message || 'Unable to load Deriv accounts.');
    return Array.isArray(data.data) ? data.data.filter(Boolean) : [];
  }

  function renderAccount(account) {
    const isReal = account.account_type !== 'demo';
    if (balance) balance.textContent = `${format(account.balance)} ${account.currency || ''}`.trim();
    if (badge) {
      badge.textContent = isReal ? 'Real' : 'Demo';
      badge.className = `badge${isReal ? ' real' : ''}`;
    }
    if (accountWrap) accountWrap.innerHTML = `<div class="account-card">
      <p><strong>Account ID:</strong> ${escapeHtml(account.account_id)}</p>
      <p><strong>Currency:</strong> ${escapeHtml(account.currency)}</p>
      <p><strong>Account type:</strong> ${isReal ? 'Real money' : 'Demo (virtual funds)'}</p>
      <p><strong>Status:</strong> ${escapeHtml(account.status)}</p>
    </div>`;
    if (prompt) prompt.style.display = 'none';
    if (status) status.innerHTML = '<span class="ok">Account loaded ✓</span>';
  }

  async function loadAccount(token) {
    if (status) status.textContent = 'Loading your Deriv account…';
    try {
      const accounts = await fetchAccounts(token);
      if (!accounts.length) return showError('No Deriv accounts were returned.');
      sessionStorage.setItem('deriv_accounts', JSON.stringify(accounts));
      sessionStorage.setItem('deriv_access_token', token);
      const activeId = sessionStorage.getItem('deriv_active_account');
      const account = accounts.find(item => item.account_id === activeId)
        || accounts.find(item => item.account_type !== 'demo')
        || accounts[0];
      sessionStorage.setItem('deriv_active_account', account.account_id);
      renderAccount(account);
    } catch (error) {
      sessionStorage.removeItem('deriv_access_token');
      showError(error.message || 'Unable to load your Deriv account.');
    }
  }

  async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) return showError(`Deriv returned an error: ${params.get('error_description') || error}`);
    const code = params.get('code');
    if (!code) {
      const token = sessionStorage.getItem('deriv_access_token');
      return token ? loadAccount(token) : showLogin('<span>You\'re not logged in yet.</span>');
    }
    const state = sessionStorage.getItem('oauth_state');
    const verifier = sessionStorage.getItem('pkce_code_verifier');
    if (!state || !verifier || params.get('state') !== state) {
      return showError('Invalid OAuth session. Please start login again.');
    }
    if (status) status.textContent = 'Completing secure Deriv login…';
    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier: verifier })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.access_token) throw new Error(data.error || 'Token exchange failed.');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('pkce_code_verifier');
      window.history.replaceState({}, document.title, window.location.pathname);
      await loadAccount(data.access_token);
    } catch (error) {
      showError(error.message || 'Secure login could not be completed.');
    }
  }

  document.addEventListener('DOMContentLoaded', handleCallback);
})();
