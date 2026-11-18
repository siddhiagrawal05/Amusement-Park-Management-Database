require('dotenv').config({ override: true });
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const db = require('./db');
const { sendBookingEmail } = require('./mailer');
const features = require('./features');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET;
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const rzp = KEY_ID && KEY_SECRET && !KEY_ID.includes('xxxx')
  ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
  : null;
const demoOrders = new Map();
function who(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(h.slice(7), SECRET);
  } catch {
    return 'bad';
  }
}
const auth = (role) => (req, res, next) => {
  const u = who(req);
  if (!u || u === 'bad') return res.status(401).json({ error: 'Please log in again.' });
  if (role && u.role !== role) return res.status(403).json({ error: 'You are not allowed to do this.' });
  req.user = u;
  next();
};
const fail = (status, message) => Object.assign(new Error(message), { status });
const DB_RULES = {
  1062: () => 'This already exists. Please use a different value.',
  1451: () => 'This record is used by other records, so it cannot be deleted.',
  1452: () => 'The linked record does not exist.',
  3819: (e) => `Not allowed by database rule ${(e.sqlMessage.match(/'([^']+)'/) || [])[1] || ''}.`,
};
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    if (!e.status && e.sqlState === '45000') e.status = 400;
    if (!e.status && DB_RULES[e.errno]) {
      e.status = 400;
      e.sqlMessage = DB_RULES[e.errno](e);
    }
    if (!e.status) console.error(e);
    res.status(e.status || 500).json({ error: e.sqlMessage || e.error?.description || e.message || 'Server error' });
  });

const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, joined: u.joined });
const sign = (u) => ({
  token: jwt.sign({ id: u.id, role: u.role, name: u.name }, SECRET, { expiresIn: '1d' }),
  user: safeUser(u),
});
const SEL = {
  ticketTypes: 'SELECT id, name, price, description AS `desc`, img FROM ticket_types ORDER BY id',
  rides: 'SELECT id, name, category, img, status, capacity, min_height AS minHeight, min_age AS minAge, duration, rules, description AS `desc` FROM rides ORDER BY id',
  schedules: "SELECT id, ride_id AS rideId, days, TIME_FORMAT(open_time, '%H:%i') AS `open`, TIME_FORMAT(close_time, '%H:%i') AS `close` FROM schedules ORDER BY ride_id, id",
  maintenance: 'SELECT id, ride_id AS rideId, maint_date AS `date`, description AS `desc`, status FROM maintenance ORDER BY id',
  employees: 'SELECT id, name, role, phone, email, ride_id AS rideId FROM employees ORDER BY id',
  users: 'SELECT id, name, email, phone, role, joined FROM users ORDER BY id',
  rideLogs: 'SELECT id, user_id AS userId, ride_id AS rideId, ride_date AS `date` FROM ride_logs ORDER BY id',
  supportRequests: "SELECT id, user_id AS userId, name, phone, email, topic, message, preferred_time AS preferredTime, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS createdAt FROM support_requests ORDER BY id DESC",
  plazaShows: 'SELECT id, name, description AS `desc`, place, duration, days, status, img FROM plaza_shows ORDER BY id',
  showTimes: "SELECT id, show_id AS showId, TIME_FORMAT(show_time, '%H:%i') AS `time` FROM plaza_show_times ORDER BY show_time",
  restaurants: "SELECT id, name, cuisine, TIME_FORMAT(open_time, '%H:%i') AS `open`, TIME_FORMAT(close_time, '%H:%i') AS `close`, rating, img FROM restaurants ORDER BY id",
  menuItems: 'SELECT id, restaurant_id AS restaurantId, name, price, veg FROM menu_items ORDER BY restaurant_id, id',
  shops: "SELECT id, name, description AS `desc`, price_range AS priceRange, TIME_FORMAT(open_time, '%H:%i') AS `open`, TIME_FORMAT(close_time, '%H:%i') AS `close`, img FROM shops ORDER BY id",
};
async function getBookings(userId) {
  const [list] = await db.query(
    `SELECT b.id, b.booking_code AS bookingId, b.user_id AS userId, b.visit_date AS visitDate, b.total, b.status,
            b.created_at AS createdAt, b.payment_id AS paymentId,
            COALESCE(d.subtotal, b.total) AS subtotal, COALESCE(d.pass_discount, 0) AS passDiscount,
            COALESCE(d.promo_discount, 0) AS promoDiscount, p.code AS promoCode
     FROM bookings b
     LEFT JOIN booking_discounts d ON d.booking_id = b.id
     LEFT JOIN promo_codes p ON p.id = d.promo_id
     ${userId ? 'WHERE b.user_id = ?' : ''} ORDER BY b.id`,
    userId ? [userId] : []
  );
  if (!list.length) return [];
  const [items] = await db.query(
    'SELECT booking_id AS bid, ticket_type_id AS typeId, name, price, qty FROM booking_items WHERE booking_id IN (?)',
    [list.map((b) => b.id)]
  );
  list.forEach((b) => {
    b.items = items.filter((i) => i.bid === b.id).map(({ bid, ...i }) => i);
  });
  return list;
}
async function priceItems(visitDate, items) {
  if (!visitDate || visitDate < today()) throw fail(400, 'Please choose a valid visit date.');
  const [types] = await db.query(SEL.ticketTypes);
  const lines = (items || [])
    .filter((i) => i.qty > 0 && i.qty <= 10)
    .map((i) => {
      const t = types.find((x) => x.id === i.typeId);
      return t && { typeId: t.id, name: t.name, price: t.price, qty: i.qty };
    })
    .filter(Boolean);
  if (!lines.length) throw fail(400, 'Please add at least one ticket.');
  return { lines, total: lines.reduce((s, l) => s + l.price * l.qty, 0) };
}
const extra = features({ app, db, auth, wrap, fail, who, today });
async function quote(userId, visitDate, items, promoCode) {
  const { lines, total: subtotal } = await priceItems(visitDate, items);
  const guests = lines.reduce((s, l) => s + l.qty, 0);
  const spotsLeft = await extra.spotsLeft(visitDate);
  if (guests > spotsLeft) {
    throw fail(400, spotsLeft > 0 ? `Only ${spotsLeft} tickets are left for this date.` : 'The park is full on this date. Please choose another day.');
  }
  const d = await extra.discounts(userId, visitDate, subtotal, promoCode);
  return { lines, subtotal, guests, spotsLeft, ...d };
}
app.get('/api', (req, res) => res.json({ ok: true, message: 'WonderWorld API is running' }));
app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !/^\d{10}$/.test(phone || '') || (password || '').length < 6) {
    return res.status(400).json({ error: 'Please fill all fields correctly.' });
  }
  const [found] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (found.length) return res.status(400).json({ error: 'This email is already registered.' });

  const hash = await bcrypt.hash(password, 10);
  const [r] = await db.query(
    'INSERT INTO users (name, email, phone, password_hash, role, joined) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, phone, hash, 'visitor', today()]
  );
  const [[u]] = await db.query('SELECT * FROM users WHERE id = ?', [r.insertId]);
  res.json(sign(u));
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password, role } = req.body;
  const [[u]] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
  if (u.role !== role) {
    return res.status(403).json({ error: role === 'admin' ? 'This is not an admin account.' : 'Admins must use the Admin Login page.' });
  }
  res.json(sign(u));
}));
app.get('/api/data', wrap(async (req, res) => {
  const u = who(req);
  if (u === 'bad') return res.status(401).json({ error: 'Session expired. Please log in again.' });

  const run = async (k) => (await db.query(SEL[k]))[0];
  const out = {
    ticketTypes: await run('ticketTypes'),
    rides: await run('rides'),
    schedules: await run('schedules'),
    plazaShows: await run('plazaShows'),
    showTimes: await run('showTimes'),
    restaurants: await run('restaurants'),
    menuItems: (await run('menuItems')).map((m) => ({ ...m, veg: !!m.veg })),
    shops: await run('shops'),
  };
  Object.assign(out, await extra.data(u));
  const logs = await run('rideLogs');

  if (u && u.role === 'admin') {
    out.rideLogs = logs;
    out.maintenance = await run('maintenance');
    out.employees = await run('employees');
    out.users = await run('users');
    out.bookings = await getBookings();
    out.supportRequests = await run('supportRequests');
  } else {
    out.rideLogs = logs.map(({ userId, ...l }) => l);
    if (u && u.role === 'visitor') out.bookings = await getBookings(u.id);
  }
  res.json(out);
}));
app.post('/api/support', wrap(async (req, res) => {
  const u = who(req);
  const { name, phone, email = '', topic = 'Other', message = '', preferredTime = 'Anytime' } = req.body;
  if (!name || !String(name).trim() || !/^\d{10}$/.test(phone || '')) {
    throw fail(400, 'Please enter your name and a 10-digit phone number.');
  }
  const [r] = await db.query(
    'INSERT INTO support_requests (user_id, name, phone, email, topic, message, preferred_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [u && u !== 'bad' ? u.id : null, String(name).trim(), phone, String(email).trim(), topic, String(message).trim().slice(0, 500), preferredTime, 'Open']
  );
  res.json({ id: r.insertId });
}));
app.post('/api/price', auth('visitor'), wrap(async (req, res) => {
  const { visitDate, items, promoCode } = req.body;
  const q = await quote(req.user.id, visitDate, items, promoCode);
  res.json({
    subtotal: q.subtotal, guests: q.guests, spotsLeft: q.spotsLeft,
    passName: q.passName, passDiscount: q.passDiscount,
    promo: q.promo && { code: q.promo.code, description: q.promo.description }, promoDiscount: q.promoDiscount,
    total: q.total,
  });
}));
app.post('/api/payments/order', auth('visitor'), wrap(async (req, res) => {
  const { visitDate, items, promoCode } = req.body;
  const { total } = await quote(req.user.id, visitDate, items, promoCode);
  const amount = total * 100;

  if (!rzp) {
    const orderId = 'order_demo_' + crypto.randomBytes(6).toString('hex');
    demoOrders.set(orderId, { userId: req.user.id, amount, created: Date.now() });
    return res.json({ mode: 'demo', orderId, amount, currency: 'INR' });
  }

  const order = await rzp.orders.create({
    amount,
    currency: 'INR',
    receipt: `ww_${req.user.id}_${Date.now()}`,
    notes: { userId: String(req.user.id), visitDate },
  });
  res.json({ mode: 'razorpay', orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID });
}));
const genCode = () => 'WW' + Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X');
app.post('/api/bookings', auth('visitor'), wrap(async (req, res) => {
  const { visitDate, items, payment = {}, promoCode } = req.body;
  const q = await quote(req.user.id, visitDate, items, promoCode);
  const { lines, total } = q;
  let paymentId;

  if (!rzp) {
    const o = demoOrders.get(payment.orderId);
    if (!o || o.userId !== req.user.id || o.amount !== total * 100 || Date.now() - o.created > 30 * 60 * 1000) {
      throw fail(400, 'Payment could not be verified. Please try again.');
    }
    demoOrders.delete(payment.orderId);
    paymentId = 'pay_demo_' + crypto.randomBytes(7).toString('hex');
  } else {
    const { orderId, signature } = payment;
    if (!orderId || !payment.paymentId || !signature) throw fail(400, 'Please complete the payment first.');
    const expected = crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${payment.paymentId}`).digest('hex');
    if (expected !== signature) throw fail(400, 'Payment could not be verified.');
    const order = await rzp.orders.fetch(orderId);
    if (String(order.notes?.userId) !== String(req.user.id) || Number(order.amount) !== total * 100) {
      throw fail(400, 'Payment does not match this booking.');
    }
    const [[used]] = await db.query('SELECT id FROM bookings WHERE payment_id = ?', [payment.paymentId]);
    if (used) throw fail(400, 'This payment has already been used.');
    paymentId = payment.paymentId;
  }
  const conn = await db.getConnection();
  let booking;
  try {
    await conn.beginTransaction();
    let code;
    for (;;) {
      code = genCode();
      const [[x]] = await conn.query('SELECT id FROM bookings WHERE booking_code = ?', [code]);
      if (!x) break;
    }
    const [r] = await conn.query(
      'INSERT INTO bookings (booking_code, user_id, visit_date, total, status, created_at, payment_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code, req.user.id, visitDate, total, 'Confirmed', today(), paymentId]
    );
    for (const l of lines) {
      await conn.query(
        'INSERT INTO booking_items (booking_id, ticket_type_id, name, price, qty) VALUES (?, ?, ?, ?, ?)',
        [r.insertId, l.typeId, l.name, l.price, l.qty]
      );
    }
    await conn.query(
      'INSERT INTO booking_discounts (booking_id, subtotal, pass_id, pass_discount, promo_id, promo_discount) VALUES (?, ?, ?, ?, ?, ?)',
      [r.insertId, q.subtotal, q.passId, q.passDiscount, q.promo ? q.promo.id : null, q.promoDiscount]
    );
    await conn.commit();
    booking = {
      id: r.insertId, bookingId: code, visitDate, total, items: lines, status: 'Confirmed', paymentId,
      subtotal: q.subtotal, passDiscount: q.passDiscount, promoDiscount: q.promoDiscount, promoCode: q.promo ? q.promo.code : null,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  const [[u]] = await db.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
  sendBookingEmail(u.email, u.name, booking).catch((e) => console.error('Email failed:', e.message));

  res.json(booking);
}));

app.put('/api/bookings/:id/cancel', auth('visitor'), wrap(async (req, res) => {
  const [[b]] = await db.query('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!b || b.status !== 'Confirmed' || b.visit_date <= today()) {
    return res.status(400).json({ error: 'This booking cannot be cancelled.' });
  }
  await db.query("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", [b.id]);
  res.json({ ok: true });
}));
app.post('/api/rides/:id/ride', auth('visitor'), wrap(async (req, res) => {
  const [[r]] = await db.query('SELECT status FROM rides WHERE id = ?', [req.params.id]);
  if (!r || r.status !== 'Open') return res.status(400).json({ error: 'This ride is not open right now.' });
  await db.query('INSERT INTO ride_logs (user_id, ride_id, ride_date) VALUES (?, ?, ?)', [req.user.id, req.params.id, today()]);
  res.json({ ok: true });
}));
const WRITE = {
  rides: { table: 'rides', cols: { name: 'name', category: 'category', img: 'img', status: 'status', capacity: 'capacity', minHeight: 'min_height', minAge: 'min_age', duration: 'duration', rules: 'rules', desc: 'description' } },
  schedules: { table: 'schedules', cols: { rideId: 'ride_id', days: 'days', open: 'open_time', close: 'close_time' } },
  maintenance: { table: 'maintenance', cols: { rideId: 'ride_id', date: 'maint_date', desc: 'description', status: 'status' } },
  employees: { table: 'employees', cols: { name: 'name', role: 'role', phone: 'phone', email: 'email', rideId: 'ride_id' } },
  rideLogs: { table: 'ride_logs', cols: { userId: 'user_id', rideId: 'ride_id', date: 'ride_date' } },
  supportRequests: { table: 'support_requests', cols: { status: 'status' } },
  ...extra.WRITE,
  plazaShows: { table: 'plaza_shows', cols: { name: 'name', desc: 'description', place: 'place', duration: 'duration', days: 'days', status: 'status', img: 'img' } },
  showTimes: { table: 'plaza_show_times', cols: { showId: 'show_id', time: 'show_time' } },
  restaurants: { table: 'restaurants', cols: { name: 'name', cuisine: 'cuisine', open: 'open_time', close: 'close_time', rating: 'rating', img: 'img' } },
  menuItems: { table: 'menu_items', cols: { restaurantId: 'restaurant_id', name: 'name', price: 'price', veg: 'veg' } },
  shops: { table: 'shops', cols: { name: 'name', desc: 'description', priceRange: 'price_range', open: 'open_time', close: 'close_time', img: 'img' } },
};

function pick(t, body) {
  const data = {};
  for (const [key, col] of Object.entries(WRITE[t].cols)) {
    if (body[key] !== undefined) data[col] = key === 'rideId' && body[key] === '' ? null : body[key];
  }
  return data;
}
async function afterWrite(t, id) {
  if (t !== 'maintenance') return;
  const [[m]] = await db.query('SELECT ride_id, status FROM maintenance WHERE id = ?', [id]);
  if (!m) return;
  if (m.status === 'In Progress') await db.query("UPDATE rides SET status = 'Under Maintenance' WHERE id = ?", [m.ride_id]);
  if (m.status === 'Completed') await db.query("UPDATE rides SET status = 'Open' WHERE id = ?", [m.ride_id]);
}

app.post('/api/:t', auth('admin'), wrap(async (req, res) => {
  const { t } = req.params;
  if (!WRITE[t]) return res.status(404).json({ error: 'Unknown table.' });
  const [r] = await db.query(`INSERT INTO ${WRITE[t].table} SET ?`, [pick(t, req.body)]);
  await afterWrite(t, r.insertId);
  res.json({ id: r.insertId });
}));

app.put('/api/:t/:id', auth('admin'), wrap(async (req, res) => {
  const { t, id } = req.params;
  if (!WRITE[t]) return res.status(404).json({ error: 'Unknown table.' });
  const data = pick(t, req.body);
  if (Object.keys(data).length) await db.query(`UPDATE ${WRITE[t].table} SET ? WHERE id = ?`, [data, id]);
  await afterWrite(t, id);
  res.json({ id: Number(id) });
}));

app.delete('/api/:t/:id', auth('admin'), wrap(async (req, res) => {
  const { t, id } = req.params;
  if (!WRITE[t]) return res.status(404).json({ error: 'Unknown table.' });
  await db.query(`DELETE FROM ${WRITE[t].table} WHERE id = ?`, [id]);
  res.json({ ok: true });
}));
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
db.query('SELECT 1')
  .then(() => console.log('MySQL connected'))
  .catch((e) => console.error('MySQL connection failed:', e.message));
console.log(rzp ? 'Payment: Razorpay (test mode)' : 'Payment: DEMO mode (no Razorpay keys needed)');