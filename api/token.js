// Vercel Serverless Function — exchanges a Deriv authorization code for an access token.

const CLIENT_ID = '33NyIprKo3XAhtN4o99wt';
const REDIRECT_URIS = new Set([
  'https://manoo-fx.vercel.app/dashboard.html',
  'https://manoo-fx.vercel.app/oauth-bridge.html',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, code_verifier: codeVerifier, redirect_uri: requestedRedirect } = req.body || {};
  if (typeof code !== 'string' || typeof codeVerifier !== 'string' || !code || !codeVerifier) {
    return res.status(400).json({ error: 'Missing code or code_verifier' });
  }
  const redirectUri = REDIRECT_URIS.has(requestedRedirect)
    ? requestedRedirect
    : 'https://manoo-fx.vercel.app/dashboard.html';

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    });

    const derivRes = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await derivRes.json();
    if (!derivRes.ok) {
      return res.status(derivRes.status).json({ error: 'Token exchange failed', details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Unable to reach Deriv token service' });
  }
}
