const crypto = require('crypto');

const makeCode = (prefix, len) => prefix + crypto.randomBytes(8).toString('hex').toUpperCase().slice(0, len);
const addDays = (s, n) => {
  const d = new Date(s + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const WRITE = {
  promoCodes: { table: 'promo_codes', cols: { code: 'code', description: 'description', discountType: 'discount_type', discountValue: 'discount_value', minAmount: 'min_amount', validFrom: 'valid_from', validTo: 'valid_to', usageLimit: 'usage_limit', active: 'active' } },
  passPlans: { table: 'pass_plans', cols: { name: 'name', price: 'price', discountPct: 'discount_pct', validityDays: 'validity_days', freeParking: 'free_parking', perks: 'perks', active: 'active' } },
  passes: { table: 'passes', cols: { status: 'status' } },
  foodOrders: { table: 'food_orders', cols: { status: 'status' } },
  parking: { table: 'parking_bookings', cols: { status: 'status' } },
  shifts: { table: 'shifts', cols: { employeeId: 'employee_id', rideId: 'ride_id', date: 'shift_date', start: 'start_time', end: 'end_time', attendance: 'attendance' } },
  lostItems: { table: 'lost_items', cols: { name: 'name', phone: 'phone', item: 'item', desc: 'description', lostDate: 'lost_date', location: 'location', status: 'status', adminNote: 'admin_note' } },
  reviews: { table: 'reviews', cols: {} },
};

const SEL = {
  settings: 'SELECT name, value, label FROM settings ORDER BY name',
  promoCodes: 'SELECT id, code, description, discount_type AS discountType, discount_value AS discountValue, min_amount AS minAmount, valid_from AS validFrom, valid_to AS validTo, usage_limit AS usageLimit, used_count AS usedCount, active FROM promo_codes ORDER BY id',
  passPlans: 'SELECT id, name, price, discount_pct AS discountPct, validity_days AS validityDays, free_parking AS freeParking, perks, active FROM pass_plans ORDER BY price',
  passes: `SELECT p.id, p.pass_code AS passCode, p.user_id AS userId, u.name AS userName, u.email, p.plan_id AS planId, pl.name AS planName,
             pl.discount_pct AS discountPct, pl.free_parking AS freeParking, p.price, p.valid_from AS validFrom, p.valid_to AS validTo, p.status,
             CASE WHEN p.status = 'Cancelled' THEN 'Cancelled' WHEN CURDATE() > p.valid_to THEN 'Expired' ELSE 'Active' END AS currentStatus,
             DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS createdAt
           FROM passes p JOIN users u ON u.id = p.user_id JOIN pass_plans pl ON pl.id = p.plan_id`,
  foodOrders: `SELECT o.id, o.order_code AS orderCode, o.user_id AS userId, u.name AS userName, o.restaurant_id AS restaurantId, r.name AS restaurant,
                 o.total, o.status, o.note, DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') AS createdAt
               FROM food_orders o JOIN users u ON u.id = o.user_id JOIN restaurants r ON r.id = o.restaurant_id`,
  parking: `SELECT pk.id, pk.parking_code AS parkingCode, pk.booking_id AS bookingId, b.booking_code AS bookingCode, b.visit_date AS visitDate,
              u.name AS userName, pk.vehicle_type AS vehicleType, pk.vehicle_no AS vehicleNo, pk.fee, pk.status,
              DATE_FORMAT(pk.created_at, '%Y-%m-%d %H:%i') AS createdAt
            FROM parking_bookings pk JOIN bookings b ON b.id = pk.booking_id JOIN users u ON u.id = b.user_id`,
  shifts: "SELECT id, employee_id AS employeeId, ride_id AS rideId, shift_date AS `date`, TIME_FORMAT(start_time, '%H:%i') AS `start`, TIME_FORMAT(end_time, '%H:%i') AS `end`, attendance FROM shifts ORDER BY shift_date DESC, start_time",
  lostItems: "SELECT id, user_id AS userId, name, phone, item, description AS `desc`, lost_date AS lostDate, location, status, admin_note AS adminNote, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS createdAt FROM lost_items",
  foundItems: "SELECT id, item, lost_date AS lostDate, location FROM lost_items WHERE status = 'Found' ORDER BY id DESC",
  reviews: "SELECT rv.id, rv.ride_id AS rideId, rv.user_id AS userId, u.name AS userName, rv.rating, rv.comment, DATE_FORMAT(rv.created_at, '%Y-%m-%d') AS createdAt FROM reviews rv JOIN users u ON u.id = rv.user_id ORDER BY rv.id DESC",
};

const LAB = [
  { key: 'join', concept: 'INNER JOIN', title: 'Latest bookings with visitor names',
    sql: 'SELECT b.booking_code, u.name AS visitor, b.visit_date, b.total, b.status\nFROM bookings b\nINNER JOIN users u ON u.id = b.user_id\nORDER BY b.id DESC\nLIMIT 10' },
  { key: 'leftjoin', concept: 'LEFT JOIN', title: 'Every ride with its number of staff (including rides with none)',
    sql: 'SELECT r.name AS ride, r.category, COUNT(e.id) AS staff\nFROM rides r\nLEFT JOIN employees e ON e.ride_id = r.id\nGROUP BY r.id, r.name, r.category\nORDER BY staff DESC, r.name' },
  { key: 'having', concept: 'GROUP BY + HAVING', title: 'Visitors with more than 2 confirmed bookings',
    sql: "SELECT u.name, u.email, COUNT(*) AS bookings, SUM(b.total) AS spent\nFROM bookings b\nJOIN users u ON u.id = b.user_id\nWHERE b.status = 'Confirmed'\nGROUP BY u.id, u.name, u.email\nHAVING COUNT(*) > 2\nORDER BY spent DESC" },
  { key: 'aggregate', concept: 'Aggregate functions', title: 'Ticket sales by ticket type',
    sql: "SELECT bi.name AS ticket, SUM(bi.qty) AS tickets_sold, SUM(bi.qty * bi.price) AS revenue, ROUND(AVG(bi.qty), 2) AS avg_per_booking\nFROM booking_items bi\nJOIN bookings b ON b.id = bi.booking_id\nWHERE b.status = 'Confirmed'\nGROUP BY bi.name\nORDER BY revenue DESC" },
  { key: 'subquery', concept: 'Subquery', title: 'Rides used more than the average ride',
    sql: 'SELECT r.name, COUNT(l.id) AS times_ridden\nFROM rides r\nJOIN ride_logs l ON l.ride_id = r.id\nGROUP BY r.id, r.name\nHAVING COUNT(l.id) > (\n  SELECT AVG(cnt) FROM (SELECT COUNT(*) AS cnt FROM ride_logs GROUP BY ride_id) t\n)\nORDER BY times_ridden DESC' },
  { key: 'exists', concept: 'Correlated subquery (EXISTS)', title: 'Visitors who have booked but never written a review',
    sql: "SELECT u.name, u.email\nFROM users u\nWHERE u.role = 'visitor'\n  AND EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = u.id)\n  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.user_id = u.id)" },
  { key: 'window', concept: 'Window function (RANK)', title: 'Ride ranking inside each category',
    sql: 'SELECT category, name, times_ridden,\n       RANK() OVER (PARTITION BY category ORDER BY times_ridden DESC) AS rank_in_category\nFROM v_ride_stats\nORDER BY category, rank_in_category' },
  { key: 'union', concept: 'UNION ALL', title: 'All money coming in, by source (last 120 days)',
    sql: 'CALL sp_income_summary(?, ?)', params: [{ name: 'From', type: 'date', def: -120 }, { name: 'To', type: 'date', def: 0 }] },
  { key: 'view1', concept: 'VIEW', title: 'Ride popularity and ratings (v_ride_stats)',
    sql: 'SELECT * FROM v_ride_stats\nORDER BY times_ridden DESC' },
  { key: 'view2', concept: 'VIEW', title: 'Booking details with discounts (v_booking_details)',
    sql: 'SELECT booking_code, visitor, visit_date, guests, subtotal, discount, promo_code, total, status\nFROM v_booking_details\nORDER BY id DESC\nLIMIT 15' },
  { key: 'view3', concept: 'VIEW', title: 'Food court sales per restaurant (v_food_sales)',
    sql: 'SELECT * FROM v_food_sales\nORDER BY revenue DESC' },
  { key: 'view4', concept: 'VIEW', title: "Staff schedule (v_staff_schedule)",
    sql: 'SELECT shift_date, employee, role, start_time, end_time, hours, ride, attendance\nFROM v_staff_schedule\nORDER BY shift_date DESC, start_time' },
  { key: 'proc1', concept: 'STORED PROCEDURE', title: 'Revenue report between two dates',
    sql: 'CALL sp_revenue_report(?, ?)', params: [{ name: 'From', type: 'date', def: -30 }, { name: 'To', type: 'date', def: 0 }] },
  { key: 'proc2', concept: 'STORED PROCEDURE', title: 'Park occupancy for the coming days',
    sql: 'CALL sp_occupancy(?, ?)', params: [{ name: 'Start', type: 'date', def: 0 }, { name: 'Days', type: 'number', def: 7 }] },
  { key: 'proc3', concept: 'STORED PROCEDURE', title: 'Top rides',
    sql: 'CALL sp_top_rides(?)', params: [{ name: 'How many', type: 'number', def: 5 }] },
  { key: 'proc4', concept: 'STORED PROCEDURE', title: 'Full history of one visitor',
    sql: 'CALL sp_visitor_history(?)', params: [{ name: 'Email', type: 'text', def: 'demo@ww.com' }] },
  { key: 'func', concept: 'FUNCTION', title: 'Visitors and free spots for the next 3 days',
    sql: "SELECT d AS visit_date, fn_guests_on(d) AS guests, fn_spots_left(d) AS spots_left,\n       fn_parking_left(d, 'Car') AS car_slots_left, fn_parking_left(d, 'Bike') AS bike_slots_left\nFROM (SELECT CURDATE() AS d\n      UNION SELECT CURDATE() + INTERVAL 1 DAY\n      UNION SELECT CURDATE() + INTERVAL 2 DAY) days" },
  { key: 'audit', concept: 'TRIGGER output', title: 'Audit log written automatically by triggers',
    sql: 'SELECT id, table_name, record_id, action, details, changed_at\nFROM audit_log\nORDER BY id DESC\nLIMIT 25' },
  { key: 'triggers', concept: 'TRIGGER list', title: 'All triggers in the database',
    sql: 'SELECT trigger_name, action_timing, event_manipulation, event_object_table\nFROM information_schema.triggers\nWHERE trigger_schema = DATABASE()\nORDER BY event_object_table, trigger_name' },
  { key: 'objects', concept: 'Routines and views', title: 'All stored procedures, functions and views',
    sql: "SELECT routine_name AS name, routine_type AS type\nFROM information_schema.routines\nWHERE routine_schema = DATABASE()\nUNION ALL\nSELECT table_name, 'VIEW'\nFROM information_schema.views\nWHERE table_schema = DATABASE()\nORDER BY type, name" },
  { key: 'indexes', concept: 'INDEX', title: 'Indexes on the bookings table',
    sql: 'SHOW INDEX FROM bookings' },
  { key: 'explain', concept: 'EXPLAIN (index in use)', title: 'How MySQL finds bookings for a date',
    sql: "EXPLAIN SELECT * FROM bookings\nWHERE visit_date = CURDATE() AND status = 'Confirmed'" },
];

module.exports = function features({ app, db, auth, wrap, fail, who, today }) {
  const demoPassOrders = new Map();
  const num = async (sql, params) => Number(Object.values((await db.query(sql, params))[0][0])[0]);
  const spotsLeft = (date) => num('SELECT fn_spots_left(?) AS n', [date]);
  const setting = (name) => num('SELECT value FROM settings WHERE name = ?', [name]);

  async function activePass(userId, date) {
    const [[p]] = await db.query(
      `SELECT p.id, pl.name, pl.discount_pct AS pct, pl.free_parking AS freeParking
       FROM passes p JOIN pass_plans pl ON pl.id = p.plan_id
       WHERE p.user_id = ? AND p.status = 'Active' AND ? BETWEEN p.valid_from AND p.valid_to
       ORDER BY pl.discount_pct DESC LIMIT 1`,
      [userId, date]
    );
    return p || null;
  }

  async function discounts(userId, visitDate, subtotal, promoCode) {
    const pass = await activePass(userId, visitDate);
    const passDiscount = pass ? Math.round((subtotal * pass.pct) / 100) : 0;
    let promo = null;
    let promoDiscount = 0;
    const code = String(promoCode || '').trim().toUpperCase();
    if (code) {
      const [[p]] = await db.query('SELECT * FROM promo_codes WHERE code = ?', [code]);
      const t = today();
      if (!p || !p.active) throw fail(400, 'This promo code is not valid.');
      if (t < p.valid_from) throw fail(400, 'This promo code is not active yet.');
      if (t > p.valid_to) throw fail(400, 'This promo code has expired.');
      if (p.used_count >= p.usage_limit) throw fail(400, 'This promo code has reached its usage limit.');
      if (subtotal < p.min_amount) throw fail(400, `This code needs a minimum booking of ₹${p.min_amount.toLocaleString('en-IN')}.`);
      const base = subtotal - passDiscount;
      promoDiscount = p.discount_type === 'Percent' ? Math.round((base * p.discount_value) / 100) : Math.min(p.discount_value, base);
      promo = { id: p.id, code: p.code, description: p.description };
    }
    return {
      passId: pass ? pass.id : null,
      passName: pass ? pass.name : null,
      passDiscount,
      promo,
      promoDiscount,
      total: Math.max(subtotal - passDiscount - promoDiscount, 0),
    };
  }

  async function data(u) {
    const run = async (sql, params) => (await db.query(sql, params))[0];
    const out = {};
    const reviews = await run(SEL.reviews);
    const plans = await run(SEL.passPlans);
    out.foundItems = await run(SEL.foundItems);

    const withItems = async (orders) => {
      if (!orders.length) return orders;
      const [items] = await db.query('SELECT order_id AS orderId, menu_item_id AS menuItemId, name, price, qty FROM food_order_items WHERE order_id IN (?)', [orders.map((o) => o.id)]);
      return orders.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }));
    };

    if (u && u.role === 'admin') {
      out.reviews = reviews;
      out.passPlans = plans;
      out.settings = await run(SEL.settings);
      out.promoCodes = await run(SEL.promoCodes);
      out.passes = await run(SEL.passes + ' ORDER BY p.id DESC');
      out.foodOrders = await withItems(await run(SEL.foodOrders + ' ORDER BY o.id DESC'));
      out.parking = await run(SEL.parking + ' ORDER BY pk.id DESC');
      out.shifts = await run(SEL.shifts);
      out.lostItems = await run(SEL.lostItems + ' ORDER BY id DESC');
      return out;
    }

    out.passPlans = plans.filter((p) => p.active);
    out.reviews = reviews.map(({ userId, userName, ...r }) => ({ ...r, userName: userName.split(' ')[0], mine: !!u && u.id === userId }));
    if (u && u.role === 'visitor') {
      out.passes = await run(SEL.passes + ' WHERE p.user_id = ? ORDER BY p.id DESC', [u.id]);
      out.foodOrders = await withItems(await run(SEL.foodOrders + ' WHERE o.user_id = ? ORDER BY o.id DESC', [u.id]));
      out.parking = await run(SEL.parking + ' WHERE b.user_id = ? ORDER BY pk.id DESC', [u.id]);
      out.lostItems = await run(SEL.lostItems + ' WHERE user_id = ? ORDER BY id DESC', [u.id]);
    }
    return out;
  }

  app.get('/api/capacity', wrap(async (req, res) => {
    const date = String(req.query.date || today());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw fail(400, 'Invalid date.');
    const [[row]] = await db.query(
      "SELECT fn_setting('daily_capacity') AS capacity, fn_guests_on(?) AS booked, fn_spots_left(?) AS spotsLeft, fn_parking_left(?, 'Car') AS carLeft, fn_parking_left(?, 'Bike') AS bikeLeft, fn_setting('car_fee') AS carFee, fn_setting('bike_fee') AS bikeFee",
      [date, date, date, date]
    );
    const out = { date };
    for (const [k, v] of Object.entries(row)) out[k] = Number(v);
    res.json(out);
  }));

  app.post('/api/orders', auth('visitor'), wrap(async (req, res) => {
    const { restaurantId, items, note = '' } = req.body;
    const [[r]] = await db.query('SELECT id, name FROM restaurants WHERE id = ?', [restaurantId]);
    if (!r) throw fail(400, 'Please choose a restaurant.');
    const list = (items || []).filter((i) => Number.isInteger(i.qty) && i.qty >= 1 && i.qty <= 20);
    if (!list.length) throw fail(400, 'Your order is empty.');
    const [menu] = await db.query('SELECT id, name, price FROM menu_items WHERE restaurant_id = ? AND id IN (?)', [r.id, list.map((i) => i.menuItemId)]);
    const lines = list.map((i) => {
      const m = menu.find((x) => x.id === i.menuItemId);
      return m && { id: m.id, name: m.name, price: m.price, qty: i.qty };
    }).filter(Boolean);
    if (lines.length !== list.length) throw fail(400, 'Some items are not on this menu any more. Please refresh the page.');
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      let code;
      for (;;) {
        code = makeCode('FO', 5);
        const [[x]] = await conn.query('SELECT id FROM food_orders WHERE order_code = ?', [code]);
        if (!x) break;
      }
      const [o] = await conn.query(
        'INSERT INTO food_orders (order_code, user_id, restaurant_id, total, note) VALUES (?, ?, ?, ?, ?)',
        [code, req.user.id, r.id, total, String(note).trim().slice(0, 150)]
      );
      for (const l of lines) {
        await conn.query('INSERT INTO food_order_items (order_id, menu_item_id, name, price, qty) VALUES (?, ?, ?, ?, ?)', [o.insertId, l.id, l.name, l.price, l.qty]);
      }
      await conn.commit();
      res.json({ id: o.insertId, orderCode: code, restaurant: r.name, total, status: 'Placed', items: lines });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }));

  app.put('/api/orders/:id/cancel', auth('visitor'), wrap(async (req, res) => {
    const [r] = await db.query("UPDATE food_orders SET status = 'Cancelled' WHERE id = ? AND user_id = ? AND status = 'Placed'", [req.params.id, req.user.id]);
    if (!r.affectedRows) throw fail(400, 'This order can no longer be cancelled.');
    res.json({ ok: true });
  }));

  app.post('/api/reviews', auth('visitor'), wrap(async (req, res) => {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim().slice(0, 300);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw fail(400, 'Please choose 1 to 5 stars.');
    const [[ride]] = await db.query('SELECT id FROM rides WHERE id = ?', [req.body.rideId]);
    if (!ride) throw fail(400, 'Ride not found.');
    await db.query(
      'INSERT INTO reviews (user_id, ride_id, rating, comment) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP',
      [req.user.id, ride.id, rating, comment]
    );
    res.json({ ok: true });
  }));

  app.delete('/api/my-reviews/:id', auth('visitor'), wrap(async (req, res) => {
    await db.query('DELETE FROM reviews WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ ok: true });
  }));

  app.post('/api/parking', auth('visitor'), wrap(async (req, res) => {
    const { bookingId, vehicleType } = req.body;
    const vehicleNo = String(req.body.vehicleNo || '').toUpperCase().replace(/[\s-]/g, '');
    if (!['Car', 'Bike'].includes(vehicleType)) throw fail(400, 'Choose car or bike.');
    if (!/^[A-Z0-9]{6,12}$/.test(vehicleNo)) throw fail(400, 'Enter a valid vehicle number, e.g. MH12AB1234.');
    const [[b]] = await db.query('SELECT id, visit_date, status FROM bookings WHERE id = ? AND user_id = ?', [bookingId, req.user.id]);
    if (!b || b.status !== 'Confirmed' || b.visit_date < today()) throw fail(400, 'Parking can only be added to an upcoming confirmed booking.');

    const pass = await activePass(req.user.id, b.visit_date);
    const fee = pass && pass.freeParking ? 0 : await setting(vehicleType === 'Car' ? 'car_fee' : 'bike_fee');
    const [[old]] = await db.query('SELECT id, status FROM parking_bookings WHERE booking_id = ? AND vehicle_no = ?', [b.id, vehicleNo]);
    if (old && old.status === 'Booked') throw fail(400, 'This vehicle already has parking for this booking.');

    if (old) {
      const left = await num('SELECT fn_parking_left(?, ?) AS n', [b.visit_date, vehicleType]);
      if (left <= 0) throw fail(400, 'No parking slots left for this vehicle type on this date.');
      await db.query("UPDATE parking_bookings SET status = 'Booked', vehicle_type = ?, fee = ? WHERE id = ?", [vehicleType, fee, old.id]);
      return res.json({ id: old.id, fee });
    }
    let code;
    for (;;) {
      code = makeCode('PK', 5);
      const [[x]] = await db.query('SELECT id FROM parking_bookings WHERE parking_code = ?', [code]);
      if (!x) break;
    }
    const [r] = await db.query(
      'INSERT INTO parking_bookings (parking_code, booking_id, vehicle_type, vehicle_no, fee) VALUES (?, ?, ?, ?, ?)',
      [code, b.id, vehicleType, vehicleNo, fee]
    );
    res.json({ id: r.insertId, parkingCode: code, fee });
  }));

  app.put('/api/parking/:id/cancel', auth('visitor'), wrap(async (req, res) => {
    const [r] = await db.query(
      "UPDATE parking_bookings pk JOIN bookings b ON b.id = pk.booking_id SET pk.status = 'Cancelled' WHERE pk.id = ? AND b.user_id = ? AND pk.status = 'Booked'",
      [req.params.id, req.user.id]
    );
    if (!r.affectedRows) throw fail(400, 'This parking cannot be cancelled.');
    res.json({ ok: true });
  }));

  app.post('/api/passes/order', auth('visitor'), wrap(async (req, res) => {
    const [[plan]] = await db.query('SELECT id, price FROM pass_plans WHERE id = ? AND active = TRUE', [req.body.planId]);
    if (!plan) throw fail(400, 'This pass is not available.');
    if (await activePass(req.user.id, today())) throw fail(400, 'You already have an active annual pass.');
    const orderId = 'order_demo_' + crypto.randomBytes(6).toString('hex');
    demoPassOrders.set(orderId, { userId: req.user.id, planId: plan.id, amount: plan.price * 100, created: Date.now() });
    res.json({ mode: 'demo', orderId, amount: plan.price * 100, currency: 'INR' });
  }));

  app.post('/api/passes', auth('visitor'), wrap(async (req, res) => {
    const { planId, payment = {} } = req.body;
    const o = demoPassOrders.get(payment.orderId);
    if (!o || o.userId !== req.user.id || o.planId !== Number(planId) || Date.now() - o.created > 30 * 60 * 1000) {
      throw fail(400, 'Payment could not be verified. Please try again.');
    }
    demoPassOrders.delete(payment.orderId);
    const [[plan]] = await db.query('SELECT * FROM pass_plans WHERE id = ?', [planId]);
    let code;
    for (;;) {
      code = makeCode('WP', 6);
      const [[x]] = await db.query('SELECT id FROM passes WHERE pass_code = ?', [code]);
      if (!x) break;
    }
    const from = today();
    const to = addDays(from, plan.validity_days - 1);
    const paymentId = 'pay_demo_' + crypto.randomBytes(7).toString('hex');
    const [r] = await db.query(
      'INSERT INTO passes (pass_code, user_id, plan_id, price, valid_from, valid_to, payment_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code, req.user.id, plan.id, plan.price, from, to, paymentId]
    );
    res.json({ id: r.insertId, passCode: code, plan: plan.name, validFrom: from, validTo: to, paymentId });
  }));

  app.post('/api/lost', wrap(async (req, res) => {
    const u = who(req);
    const { name, phone, item, desc = '', lostDate, location = '' } = req.body;
    if (!String(name || '').trim() || !/^\d{10}$/.test(phone || '') || !String(item || '').trim()) {
      throw fail(400, 'Please enter your name, a 10-digit phone number and the lost item.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lostDate || '') || lostDate > today() || lostDate < addDays(today(), -60)) {
      throw fail(400, 'Please choose the date you lost it (within the last 60 days).');
    }
    const [r] = await db.query(
      'INSERT INTO lost_items (user_id, name, phone, item, description, lost_date, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u && u !== 'bad' ? u.id : null, String(name).trim(), phone, String(item).trim().slice(0, 80), String(desc).trim().slice(0, 300), lostDate, String(location).trim().slice(0, 100)]
    );
    res.json({ id: r.insertId });
  }));

  app.put('/api/settings', auth('admin'), wrap(async (req, res) => {
    const values = req.body.values || {};
    const [rows] = await db.query('SELECT name FROM settings');
    for (const { name } of rows) {
      if (values[name] === undefined) continue;
      const v = Number(values[name]);
      if (!Number.isInteger(v) || v < 0 || (name !== 'car_fee' && name !== 'bike_fee' && v < 1)) throw fail(400, `Please enter a valid number for ${name.replace('_', ' ')}.`);
      await db.query('UPDATE settings SET value = ? WHERE name = ?', [v, name]);
    }
    res.json({ ok: true });
  }));

  app.get('/api/lab', auth('admin'), wrap(async (req, res) => {
    res.json(LAB.map(({ key, concept, title, sql, params = [] }) => ({
      key, concept, title, sql,
      params: params.map((p) => ({ name: p.name, type: p.type, value: p.type === 'date' ? addDays(today(), p.def) : p.def })),
    })));
  }));

  app.post('/api/lab/:key', auth('admin'), wrap(async (req, res) => {
    const q = LAB.find((x) => x.key === req.params.key);
    if (!q) throw fail(404, 'Unknown query.');
    const values = (q.params || []).map((p, i) => {
      const v = (req.body.params || [])[i];
      if (p.type === 'number') {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 60) throw fail(400, `${p.name} must be a whole number from 1 to 60.`);
        return n;
      }
      if (p.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v || '')) throw fail(400, `Please choose a date for ${p.name}.`);
      return String(v || '');
    });
    const started = Date.now();
    const [result] = await db.query(q.sql, values);
    const rows = Array.isArray(result[0]) ? result[0] : Array.isArray(result) ? result : [];
    res.json({ columns: rows.length ? Object.keys(rows[0]) : [], rows, ms: Date.now() - started });
  }));

  return { WRITE, data, discounts, spotsLeft };
};