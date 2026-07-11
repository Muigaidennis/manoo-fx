// ManooFX — Deriv OAuth 2.0 (Authorization Code + PKCE)
// ------------------------------------------------------
// Fill these in with your new app's real values:
const DERIV_CONFIG = {
  clientId: "33NyIprKo3XAhtN4o99wt",       // Manoofx app ID (developers.deriv.com)
  redirectUri: "https://manoo-fx.vercel.app/dashboard.html", // must match EXACTLY what's registered
  scope: "trade account_manage",
};

// Generates a random string for code_verifier / state
function randomString(length) {
  const array = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(array)
    .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
    .join('');
}

// Derives code_challenge from code_verifier using SHA-256
async function deriveCodeChallenge(verifier) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Call this when the "Login with Deriv" button is clicked
async function loginWithDeriv() {
  const codeVerifier = randomString(64);
  const codeChallenge = await deriveCodeChallenge(codeVerifier);
  const state = randomString(16);

  // Stash these — we need them again when Deriv redirects back
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: DERIV_CONFIG.clientId,
    redirect_uri: DERIV_CONFIG.redirectUri,
    scope: DERIV_CONFIG.scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `https://auth.deriv.com/oauth2/auth?${params.toString()}`;
}

// Attach to any element with id="deriv-login-btn"
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('deriv-login-btn');
  if (btn) btn.addEventListener('click', loginWithDeriv);
});