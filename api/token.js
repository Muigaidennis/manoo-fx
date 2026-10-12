// Vercel serverless function: exchanges the OAuth code (or refresh token) with Deriv.
// Optional env vars in Vercel: DERIV_CLIENT_SECRET (only if your app has one).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const raw = typeof req.body === 'string' ? req.body : new URLSearchParams(req.body || {}).toString();
    const form = new URLSearchParams(raw);
    if (process.env.DERIV_CLIENT_SECRET) form.set('client_secret', process.env.DERIV_CLIENT_SECRET);
    const r = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    });
    const text = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (e) {
    res.status(500).json({ error: 'server_error', error_description: String(e.message || e) });
  }
}
