// WonderWorld data layer.
// Data is saved in the browser (localStorage) so the app works without a server.
// Later, replace these functions with fetch() calls to a Node + MySQL backend.

const KEY = 'ww_db_v2'; // new key, so the new sample data (with photos) loads

const fmt = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const today = () => fmt(new Date());
export const addDays = (s, n) => {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return fmt(d);
};
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const nextId = (arr) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;

function genId(list) {
  let id;
  do {
    id = 'WW' + Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (list.some((b) => b.bookingId === id));
  return id;
}

// ---------- Photos (free Unsplash images) ----------
const u = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PICS = {
  hero1: u('1502136969935-8d8eef54d77b', 1920),
  hero2: u('1713426225330-014fbfd04aa0', 1920),
  hero3: u('1502137914655-3ab2fb4dc4cc', 1920),
  zThrill: u('1628835788312-41d61f5ddce8'),
  zWater: u('1739295194212-0602c4d1e797'),
  zFamily: u('1533543853290-8417b3a0ba55'),
  zKids: u('1605457867610-e990b192418e'),
  o1: u('1597172984973-fa1a221fe91d', 800),
  o2: u('1706843540966-1a1685971dc0', 800),
  o3: u('1688582952217-e8617c8a5109', 800),
  o4: u('1533856493584-0c6ca8ca9ce3', 800),
  bRides: u('1627035983655-0ceec61bb733', 1920),
  bTickets: u('1544441452-326ff5a947fd', 1920),
};

// ---------- Sample data (created the first time the app runs) ----------
function seed() {
  const ticketTypes = [
    { id: 1, name: 'Child', price: 899, img: u('1542332606-b2d1c52a6c33', 800), desc: 'Age 3 to 12 years' },
    { id: 2, name: 'Adult', price: 1499, img: u('1704925052388-070244d29a3a', 800), desc: 'Age 13 to 59 years' },
    { id: 3, name: 'Senior', price: 999, img: u('1584049382558-d7332851effd', 800), desc: 'Age 60 years and above' },
    { id: 4, name: 'VIP Express', price: 2999, img: u('1578937228099-a6fe1dd01b59', 800), desc: 'Skip queues + free lunch' },
  ];

  const rides = [
    { id: 1, name: 'Thunder Coaster', category: 'Thrill', img: u('1567609894562-d00168e290f6', 900), status: 'Open', capacity: 24, minHeight: 140, minAge: 12, duration: 3, rules: 'Not for heart patients or pregnant women', desc: 'Loops, drops and 100 km/h of pure speed.' },
    { id: 2, name: 'Loop Fury', category: 'Thrill', img: u('1759179125042-98534a3d47bf', 900), status: 'Closed', capacity: 20, minHeight: 135, minAge: 12, duration: 2, rules: 'Loose items must be kept in lockers', desc: 'Three upside-down loops in under a minute.' },
    { id: 3, name: 'Space Drop', category: 'Thrill', img: u('1751896077567-c5529b9173f9', 900), status: 'Open', capacity: 12, minHeight: 145, minAge: 14, duration: 2, rules: 'Maximum weight 110 kg', desc: 'Free-fall 80 metres in 3 seconds.' },
    { id: 4, name: 'Sky Wheel', category: 'Family', img: u('1464059728276-d877187d61a9', 900), status: 'Open', capacity: 48, minHeight: 0, minAge: 0, duration: 12, rules: 'Children below 8 must ride with an adult', desc: 'See the whole park from 60 metres up.' },
    { id: 5, name: 'Dino Safari', category: 'Family', img: u('1633876204719-dd74580764ea', 900), status: 'Open', capacity: 40, minHeight: 100, minAge: 4, duration: 8, rules: 'Keep hands inside the vehicle', desc: 'Drive through a jungle full of dinosaurs.' },
    { id: 6, name: 'Royal Carousel', category: 'Kids', img: u('1577774438656-768f1e5d9ed6', 900), status: 'Open', capacity: 30, minHeight: 0, minAge: 2, duration: 4, rules: 'Kids below 6 must ride with an adult', desc: 'A classic merry-go-round with magical horses.' },
    { id: 7, name: 'Wave Swinger', category: 'Kids', img: u('1601930113377-729966035f34', 900), status: 'Open', capacity: 32, minHeight: 110, minAge: 6, duration: 4, rules: 'Hold on to the chains at all times', desc: 'Fly round and round on high swings.' },
    { id: 8, name: 'Splash Rapids', category: 'Water', img: u('1707575878561-794d400bbb1e', 900), status: 'Under Maintenance', capacity: 16, minHeight: 120, minAge: 8, duration: 5, rules: 'You will get wet!', desc: 'Raft through wild rapids and big splashes.' },
    { id: 9, name: 'Aqua Twister', category: 'Water', img: u('1703167906241-03f513c604fb', 900), status: 'Open', capacity: 10, minHeight: 120, minAge: 8, duration: 2, rules: 'Swimwear required', desc: 'A giant twisting slide into the wave pool.' },
  ];

  const users = [
    { id: 1, name: 'Park Admin', email: 'admin@ww.com', phone: '9000000000', password: 'admin123', role: 'admin', joined: addDays(today(), -200) },
    { id: 2, name: 'Demo Visitor', email: 'demo@ww.com', phone: '9876543210', password: 'demo123', role: 'visitor', joined: addDays(today(), -120) },
    { id: 3, name: 'Riya Sharma', email: 'riya@mail.com', phone: '9811111111', password: 'riya123', role: 'visitor', joined: addDays(today(), -100) },
    { id: 4, name: 'Arjun Mehta', email: 'arjun@mail.com', phone: '9822222222', password: 'arjun123', role: 'visitor', joined: addDays(today(), -80) },
    { id: 5, name: 'Sara Khan', email: 'sara@mail.com', phone: '9833333333', password: 'sara123', role: 'visitor', joined: addDays(today(), -60) },
  ];

  const bookings = [];
  for (let i = 1; i <= 60; i++) {
    const createdAt = addDays(today(), -rand(0, 120));
    const items = ticketTypes
      .filter(() => Math.random() > 0.5)
      .map((t) => ({ typeId: t.id, name: t.name, price: t.price, qty: rand(1, 3) }));
    if (!items.length) items.push({ typeId: 2, name: 'Adult', price: 1499, qty: 2 });
    bookings.push({
      id: i,
      bookingId: genId(bookings),
      userId: rand(2, 5),
      visitDate: addDays(createdAt, rand(0, 10)),
      items,
      total: items.reduce((s, x) => s + x.price * x.qty, 0),
      status: Math.random() < 0.1 ? 'Cancelled' : 'Confirmed',
      createdAt,
    });
  }

  const weights = [9, 7, 8, 6, 5, 4, 4, 3, 6]; // one number per ride (popularity)
  const rideLogs = [];
  for (let i = 1; i <= 200; i++) {
    let r = rand(1, weights.reduce((a, b) => a + b, 0));
    let rideId = 0;
    while (r > 0) r -= weights[rideId++];
    rideLogs.push({ id: i, userId: rand(2, 5), rideId, date: addDays(today(), -rand(0, 60)) });
  }

  const schedules = [];
  rides.forEach((r) => {
    schedules.push({ id: schedules.length + 1, rideId: r.id, days: 'Mon - Fri', open: '10:30', close: '18:00' });
    schedules.push({ id: schedules.length + 1, rideId: r.id, days: 'Sat - Sun', open: '10:00', close: '20:00' });
  });

  const maintenance = [
    { id: 1, rideId: 8, date: today(), desc: 'Water pump replacement', status: 'In Progress' },
    { id: 2, rideId: 1, date: addDays(today(), -20), desc: 'Track bolt inspection', status: 'Completed' },
    { id: 3, rideId: 3, date: addDays(today(), 7), desc: 'Brake system safety audit', status: 'Scheduled' },
  ];

  const employees = [
    { id: 1, name: 'Rahul Verma', role: 'Ride Operator', phone: '9844444444', email: 'rahul@ww.com', rideId: 1 },
    { id: 2, name: 'Priya Nair', role: 'Technician', phone: '9855555555', email: 'priya@ww.com', rideId: 8 },
    { id: 3, name: 'Imran Shaikh', role: 'Ride Operator', phone: '9866666666', email: 'imran@ww.com', rideId: 5 },
    { id: 4, name: 'Neha Joshi', role: 'Ticket Counter', phone: '9877777777', email: 'neha@ww.com', rideId: null },
    { id: 5, name: 'Vikram Singh', role: 'Security', phone: '9888888888', email: 'vikram@ww.com', rideId: null },
  ];

  return { users, ticketTypes, rides, schedules, maintenance, employees, bookings, rideLogs };
}

// ---------- Basic database helpers ----------
function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const d = seed();
  localStorage.setItem(KEY, JSON.stringify(d));
  return d;
}
const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));

export const all = (table) => load()[table];

export function upsert(table, item) {
  const d = load();
  if (item.id) {
    d[table] = d[table].map((x) => (x.id === item.id ? { ...x, ...item } : x));
  } else {
    item = { ...item, id: nextId(d[table]) };
    d[table].push(item);
  }
  save(d);
  return d[table].find((x) => x.id === item.id);
}

export function remove(table, id) {
  const d = load();
  d[table] = d[table].filter((x) => x.id !== id);
  save(d);
}

// ---------- Module 1: Register & Login ----------
const safe = ({ password, ...u }) => u;

export function register({ name, email, phone, password }) {
  const d = load();
  if (d.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('This email is already registered.');
  }
  const u = { id: nextId(d.users), name, email, phone, password, role: 'visitor', joined: today() };
  d.users.push(u);
  save(d);
  return safe(u);
}

export function login(email, password, role) {
  const u = load().users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
  if (!u) throw new Error('Wrong email or password.');
  if (u.role !== role) {
    throw new Error(role === 'admin' ? 'This is not an admin account.' : 'Admins must use the Admin Login page.');
  }
  return safe(u);
}

// ---------- Module 2: Ticket Booking ----------
export function createBooking(userId, visitDate, items) {
  const d = load();
  const lines = items
    .filter((i) => i.qty > 0)
    .map((i) => {
      const t = d.ticketTypes.find((x) => x.id === i.typeId);
      return { typeId: t.id, name: t.name, price: t.price, qty: i.qty };
    });
  const b = {
    id: nextId(d.bookings),
    bookingId: genId(d.bookings),
    userId,
    visitDate,
    items: lines,
    total: lines.reduce((s, l) => s + l.price * l.qty, 0),
    status: 'Confirmed',
    createdAt: today(),
  };
  d.bookings.push(b);
  save(d);
  return b;
}

// A booking can be cancelled only if it is confirmed and the visit date is in the future
export const canCancel = (b) => b.status === 'Confirmed' && b.visitDate > today();

export function cancelBooking(id) {
  const d = load();
  const b = d.bookings.find((x) => x.id === id);
  if (!b || !canCancel(b)) throw new Error('This booking cannot be cancelled.');
  b.status = 'Cancelled';
  save(d);
}

// ---------- Module 3 & 4: Rides, usage and maintenance ----------
export const logRide = (userId, rideId) => upsert('rideLogs', { userId, rideId, date: today() });

export function saveMaint(m) {
  const saved = upsert('maintenance', m);
  if (saved.status === 'In Progress') upsert('rides', { id: saved.rideId, status: 'Under Maintenance' });
  if (saved.status === 'Completed') upsert('rides', { id: saved.rideId, status: 'Open' });
  return saved;
}

// ---------- Module 6: Revenue ----------
export const revenue = (list) => list.filter((b) => b.status === 'Confirmed').reduce((s, b) => s + b.total, 0);