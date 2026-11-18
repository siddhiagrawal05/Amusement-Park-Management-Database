// Adds sample users (with hashed passwords), bookings and ride usage.
// Run once: node seed.js   (running again resets these tables)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const fmt = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const today = () => fmt(new Date());
const addDays = (s, n) => {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return fmt(d);
};
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

(async () => {
  try {
    await db.query('DELETE FROM ride_logs');
    await db.query('DELETE FROM booking_items');
    await db.query('DELETE FROM bookings');
    await db.query('DELETE FROM users');

    const people = [
      ['Park Admin', 'admin@ww.com', '9000000000', 'admin123', 'admin'],
      ['Demo Visitor', 'demo@ww.com', '9876543210', 'demo123', 'visitor'],
      ['Riya Sharma', 'riya@mail.com', '9811111111', 'riya123', 'visitor'],
      ['Arjun Mehta', 'arjun@mail.com', '9822222222', 'arjun123', 'visitor'],
      ['Sara Khan', 'sara@mail.com', '9833333333', 'sara123', 'visitor'],
    ];
    const visitorIds = [];
    for (const [name, email, phone, pass, role] of people) {
      const hash = await bcrypt.hash(pass, 10);
      const [r] = await db.query(
        'INSERT INTO users (name, email, phone, password_hash, role, joined) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone, hash, role, addDays(today(), -rand(60, 200))]
      );
      if (role === 'visitor') visitorIds.push(r.insertId);
    }

    const [types] = await db.query('SELECT id, name, price FROM ticket_types ORDER BY id');
    const [rides] = await db.query('SELECT id FROM rides ORDER BY id');

    for (let i = 0; i < 60; i++) {
      const createdAt = addDays(today(), -rand(0, 120));
      let items = types.filter(() => Math.random() > 0.5).map((t) => ({ ...t, qty: rand(1, 3) }));
      if (!items.length) items = [{ ...types[1], qty: 2 }];
      const total = items.reduce((s, x) => s + x.price * x.qty, 0);
      const code = 'WW' + Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X');
      const [r] = await db.query(
        'INSERT INTO bookings (booking_code, user_id, visit_date, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [code, visitorIds[rand(0, visitorIds.length - 1)], addDays(createdAt, rand(0, 10)), total, Math.random() < 0.1 ? 'Cancelled' : 'Confirmed', createdAt]
      );
      for (const it of items) {
        await db.query(
          'INSERT INTO booking_items (booking_id, ticket_type_id, name, price, qty) VALUES (?, ?, ?, ?, ?)',
          [r.insertId, it.id, it.name, it.price, it.qty]
        );
      }
    }

    const base = [9, 7, 8, 6, 5, 4, 4, 3, 6];
    const weights = rides.map((_, i) => base[i] || 3);
    const sum = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < 200; i++) {
      let x = rand(1, sum);
      let k = 0;
      while (x > 0) x -= weights[k++];
      await db.query(
        'INSERT INTO ride_logs (user_id, ride_id, ride_date) VALUES (?, ?, ?)',
        [visitorIds[rand(0, visitorIds.length - 1)], rides[k - 1].id, addDays(today(), -rand(0, 60))]
      );
    }

    console.log('Sample data added.');
    console.log('Admin:   admin@ww.com / admin123');
    console.log('Visitor: demo@ww.com / demo123');
  } catch (e) {
    console.error('Seed failed:', e.message);
  }
  process.exit();
})();