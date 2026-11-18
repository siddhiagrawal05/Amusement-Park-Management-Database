const BASE = 'http://localhost:5050/api';
const SKEY = 'ww_session';

const fmt = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const today = () => fmt(new Date());
export const addDays = (s, n) => {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return fmt(d);
};
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
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
export const qrUrl = (b, size = 200) => {
  const guests = b.items.reduce((s, i) => s + i.qty, 0);
  const data = `WONDERWORLD|${b.bookingId}|${b.visitDate}|${guests}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`;
};
export const getSession = () => JSON.parse(localStorage.getItem(SKEY) || 'null');
const setSession = (s) => (s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY));

async function req(path, method = 'GET', body) {
  const s = getSession();
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(s ? { Authorization: `Bearer ${s.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Server error. Please try again.');
  return data;
}
const empty = {
  users: [], ticketTypes: [], rides: [], schedules: [], maintenance: [],
  employees: [], bookings: [], rideLogs: [], supportRequests: [],
  plazaShows: [], showTimes: [], restaurants: [], menuItems: [], shops: [],
  reviews: [], passPlans: [], passes: [], foodOrders: [], parking: [], lostItems: [], foundItems: [],
  settings: [], promoCodes: [], shifts: [],
};
let cache = { ...empty };

export async function loadData() {
  try {
    cache = { ...empty, ...(await req('/data')) };
  } catch (e) {
    if (!getSession()) throw e;
    setSession(null);
    cache = { ...empty, ...(await req('/data')) };
  }
}

export const all = (table) => cache[table] || [];
export async function register(form) {
  const s = await req('/auth/register', 'POST', form);
  setSession(s);
  await loadData();
  return s.user;
}

export async function login(email, password, role) {
  const s = await req('/auth/login', 'POST', { email, password, role });
  setSession(s);
  await loadData();
  return s.user;
}

export const sendLoginCode = (email) => req('/auth/code/send', 'POST', { email });

export async function loginWithCode(email, code, name, phone) {
  const s = await req('/auth/code/verify', 'POST', { email, code, name, phone });
  setSession(s);
  await loadData();
  return s.user;
}

export const getGoogleConfig = () => req('/auth/google/config');

export async function loginWithGoogle(credential, phone) {
  const r = await req('/auth/google', 'POST', { credential, phone });
  if (r.needPhone) return r;
  setSession(r);
  await loadData();
  return r;
}

export async function logout() {
  setSession(null);
  await loadData();
}
export const getQuote = (visitDate, items, promoCode) => req('/price', 'POST', { visitDate, items, promoCode });
export const getCapacity = (date) => req(`/capacity?date=${date}`);
export const createPaymentOrder = (visitDate, items, promoCode) => req('/payments/order', 'POST', { visitDate, items, promoCode });
export async function createBooking(visitDate, items, payment, promoCode) {
  const b = await req('/bookings', 'POST', { visitDate, items, payment, promoCode });
  await loadData();
  return b;
}
export const canCancel = (b) => b.status === 'Confirmed' && b.visitDate > today();

export async function cancelBooking(id) {
  await req(`/bookings/${id}/cancel`, 'PUT');
  await loadData();
}
export async function logRide(rideId) {
  await req(`/rides/${rideId}/ride`, 'POST');
  await loadData();
}

export async function upsert(table, item) {
  const { id, ...rest } = item;
  const saved = id ? await req(`/${table}/${id}`, 'PUT', rest) : await req(`/${table}`, 'POST', rest);
  await loadData();
  return saved;
}

export async function remove(table, id) {
  await req(`/${table}/${id}`, 'DELETE');
  await loadData();
}

export const saveMaint = (m) => upsert('maintenance', m);
export const createSupportRequest = (form) => req('/support', 'POST', form);
export async function placeFoodOrder(restaurantId, items, note) {
  const o = await req('/orders', 'POST', { restaurantId, items, note });
  await loadData();
  return o;
}

export async function cancelFoodOrder(id) {
  await req(`/orders/${id}/cancel`, 'PUT');
  await loadData();
}

export async function saveReview(rideId, rating, comment) {
  await req('/reviews', 'POST', { rideId, rating, comment });
  await loadData();
}

export async function deleteMyReview(id) {
  await req(`/my-reviews/${id}`, 'DELETE');
  await loadData();
}

export async function addParking(bookingId, vehicleType, vehicleNo) {
  const p = await req('/parking', 'POST', { bookingId, vehicleType, vehicleNo });
  await loadData();
  return p;
}

export async function cancelParking(id) {
  await req(`/parking/${id}/cancel`, 'PUT');
  await loadData();
}

export const createPassOrder = (planId) => req('/passes/order', 'POST', { planId });

export async function buyPass(planId, payment) {
  const p = await req('/passes', 'POST', { planId, payment });
  await loadData();
  return p;
}

export async function reportLost(form) {
  const r = await req('/lost', 'POST', form);
  await loadData();
  return r;
}

export async function saveSettings(values) {
  await req('/settings', 'PUT', { values });
  await loadData();
}

export const labList = () => req('/lab');
export const labRun = (key, params) => req(`/lab/${key}`, 'POST', { params });

export const revenue = (list) => list.filter((b) => b.status === 'Confirmed').reduce((s, b) => s + b.total, 0);