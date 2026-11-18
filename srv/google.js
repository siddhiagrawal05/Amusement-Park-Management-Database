const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

module.exports = function google({ app, db, wrap, fail, sign, today }) {
  const CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const ready = CLIENT_ID.endsWith('.apps.googleusercontent.com');
  const client = ready ? new OAuth2Client(CLIENT_ID) : null;

  if (!ready) console.log('Google sign-in: OFF (GOOGLE_CLIENT_ID not set in .env)');

  app.get('/api/auth/google/config', (req, res) => res.json({ clientId: ready ? CLIENT_ID : '' }));

  app.post('/api/auth/google', wrap(async (req, res) => {
    if (!client) throw fail(503, 'Google sign-in is not set up on the server yet.');
    let p;
    try {
      const ticket = await client.verifyIdToken({ idToken: String(req.body.credential || ''), audience: CLIENT_ID });
      p = ticket.getPayload();
    } catch {
      throw fail(401, 'Google sign-in failed or expired. Please try again.');
    }
    if (!p || !p.email || !p.email_verified) throw fail(401, 'Your Google email address is not verified.');

    const email = p.email.toLowerCase();
    let [[u]] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (u && u.role !== 'visitor') throw fail(403, 'Admins must use the Admin Login page.');

    if (!u) {
      const phone = String(req.body.phone || '').trim();
      const name = String(p.name || email.split('@')[0]).trim().slice(0, 100);
      if (!/^\d{10}$/.test(phone)) return res.json({ needPhone: true, name, email, picture: p.picture || '' });
      const randomHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
      const [r] = await db.query(
        'INSERT INTO users (name, email, phone, password_hash, role, joined) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone, randomHash, 'visitor', today()]
      );
      [[u]] = await db.query('SELECT * FROM users WHERE id = ?', [r.insertId]);
    }

    res.json(sign(u));
  }));
};