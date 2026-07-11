// /api/token.js
// Vercel Serverless Function — exchanges the authorization code for an access token.
// Deploy this at /api/token.js in your project root; Vercel auto-detects it.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, code_verifier } = req.body;

  if (!code || !code_verifier) {
    return res.status(400).json({ error: 'Missing code or code_verifier' });
  }

  const CLIENT_ID = '33NyIprKo3XAhtN4o99wt';
  const REDIRECT_URI = 'https://manoo-fx.vercel.app/dashboard.html';

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code: code,
      code_verifier: code_verifier,
      redirect_uri: REDIRECT_URI,
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
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
