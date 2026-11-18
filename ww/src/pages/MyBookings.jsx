import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaTicketAlt, FaHamburger, FaIdCard, FaSearch, FaCar, FaMotorcycle, FaSyncAlt, FaParking, FaThLarge, FaSignOutAlt, FaEnvelope, FaPhoneAlt, FaCalendarAlt, FaUserCheck, FaRupeeSign, FaUtensils, FaQuestionCircle, FaCrown } from 'react-icons/fa';
import { all, cancelBooking, canCancel, cancelFoodOrder, addParking, cancelParking, getCapacity, loadData, inr, today } from '../api';
import { useAuth } from '../auth';
import Badge from '../components/Badge';
import { PassCard } from './Passes';
import './account.css';

const TABS = [
  ['overview', 'Overview', FaThLarge],
  ['bookings', 'My Tickets', FaTicketAlt],
  ['orders', 'Food Orders', FaHamburger],
  ['pass', 'Annual Pass', FaIdCard],
  ['lost', 'Lost Items', FaSearch],
];
const FLOW = ['Placed', 'Preparing', 'Ready', 'Collected'];
const ACTIVE = ['Placed', 'Preparing', 'Ready'];

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const monthYear = (d) => (d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '');
const daysTo = (d) => Math.round((new Date(d + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000);
const longDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function MyBookings() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'overview';
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const pass = all('passes').find((p) => p.currentStatus === 'Active');
  const first = user.name.split(' ')[0];

  const counts = {
    bookings: all('bookings').filter((b) => b.status === 'Confirmed' && b.visitDate >= today()).length,
    orders: all('foodOrders').filter((o) => ACTIVE.includes(o.status)).length,
    pass: pass ? 1 : 0,
    lost: all('lostItems').filter((i) => ['Reported', 'Found'].includes(i.status)).length,
  };

  const go = (k) => {
    setParams(k === 'overview' ? {} : { tab: k });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const out = () => {
    logout();
    nav('/');
  };

  return (
    <section className="acct">
      <aside className="acct-side">
        <div className="acct-me">
          <div className="avatar big">{initials(user.name)}</div>
          <b>{user.name}</b>
          <small>{user.email}</small>
          <span className="me-tag"><FaUserCheck /> Logged in</span>
          {pass && <span className="me-tag gold"><FaCrown /> {pass.planName} Member</span>}
        </div>
        <nav className="acct-menu">
          {TABS.map(([k, label, Icon]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => go(k)}>
              <Icon /> <span>{label}</span> {counts[k] > 0 && <i>{counts[k]}</i>}
            </button>
          ))}
        </nav>
        <hr />
        <button className="acct-out" onClick={out}><FaSignOutAlt /> <span>Logout</span></button>
      </aside>

      <div className="acct-main">
        <div className="acct-top">
          <div>
            <h2>Welcome back, {first} 👋</h2>
            <p className="small mut">You are logged in as <b>{user.email}</b></p>
          </div>
          <span className="mut small">{new Date().toDateString()}</span>
        </div>

        {tab === 'overview' && <Overview user={user} pass={pass} go={go} />}
        {tab === 'bookings' && <Bookings re={re} />}
        {tab === 'orders' && <Orders re={re} />}
        {tab === 'pass' && <Pass />}
        {tab === 'lost' && <Lost />}
      </div>
    </section>
  );
}

function Overview({ user, pass, go }) {
  const bookings = all('bookings');
  const upcoming = bookings.filter((b) => b.status === 'Confirmed' && b.visitDate >= today()).sort((a, b) => a.visitDate.localeCompare(b.visitDate));
  const next = upcoming[0];
  const orders = all('foodOrders').filter((o) => ACTIVE.includes(o.status));
  const spent = bookings.filter((b) => b.status === 'Confirmed').reduce((s, b) => s + b.total, 0);
  const saved = bookings.filter((b) => b.status === 'Confirmed').reduce((s, b) => s + (b.passDiscount || 0) + (b.promoDiscount || 0), 0);
  const days = next ? daysTo(next.visitDate) : null;

  const stats = [
    ['Upcoming visits', upcoming.length, FaCalendarAlt, '#1E44A8,#2A5BD0', 'bookings'],
    ['Total bookings', bookings.length, FaTicketAlt, '#E9A23B,#F5B84A', 'bookings'],
    ['Food orders in progress', orders.length, FaUtensils, '#16a34a,#22c55e', 'orders'],
    ['Total spent', inr(spent), FaRupeeSign, '#7c3aed,#a855f7', 'bookings'],
  ];

  return (
    <>
      <div className="stats">
        {stats.map(([label, value, Icon, g, k]) => (
          <button className="stat acct-stat" key={label} style={{ background: `linear-gradient(135deg,${g})` }} onClick={() => go(k)}>
            <Icon />
            <small>{label}</small>
            <b>{value}</b>
          </button>
        ))}
      </div>

      <div className="acct-grid">
        <div className="card next-visit">
          <h3 className="h"><FaCalendarAlt /> Next Visit</h3>
          {next ? (
            <>
              <div className="nv-when">
                <b>{days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`}</b>
                <span>{longDate(next.visitDate)}</span>
              </div>
              <p className="small">Booking <b>{next.bookingId}</b> · {next.items.reduce((s, i) => s + i.qty, 0)} guests · {inr(next.total)}</p>
              <div className="row gap-top">
                <Link to={`/ticket/${next.bookingId}`} className="btn sm">View Ticket</Link>
                <button className="btn sm o dark" onClick={() => go('bookings')}>Add Parking</button>
              </div>
            </>
          ) : (
            <>
              <p className="mut">You have no upcoming visit.</p>
              <Link to="/tickets" className="btn sm gap-top">Book Tickets</Link>
            </>
          )}
        </div>

        <div className="card">
          <h3 className="h"><FaUserCheck /> My Details</h3>
          <ul className="me-list">
            <li><FaEnvelope /> <span><small>Email</small>{user.email}</span></li>
            <li><FaPhoneAlt /> <span><small>Phone</small>{user.phone || '—'}</span></li>
            <li><FaCalendarAlt /> <span><small>Member since</small>{monthYear(user.joined)}</span></li>
            <li><FaIdCard /> <span><small>Annual Pass</small>{pass ? `${pass.planName} · valid till ${pass.validTo}` : 'None'}</span></li>
          </ul>
          {saved > 0 && <p className="save small" style={{ fontWeight: 700, marginTop: 10 }}>You have saved {inr(saved)} with offers and your pass!</p>}
        </div>
      </div>

      {orders.length > 0 && (
        <div className="card gap-top">
          <div className="row between mb">
            <h3 className="h" style={{ margin: 0 }}><FaHamburger /> Food Orders in Progress</h3>
            <button className="add" onClick={() => go('orders')}>See all</button>
          </div>
          {orders.map((o) => (
            <div className="park-row" key={o.id}>
              <span><b>{o.orderCode}</b> <span className="small mut">{o.restaurant}</span></span>
              <span className="row nowrap" style={{ gap: 8 }}><span className="small">{inr(o.total)}</span><Badge s={o.status} /></span>
            </div>
          ))}
        </div>
      )}

      <h3 className="h gap-top">Quick Actions</h3>
      <div className="quick">
        <Link to="/tickets"><FaTicketAlt /> Book Tickets</Link>
        <Link to="/plaza"><FaUtensils /> Order Food</Link>
        <Link to="/passes"><FaIdCard /> {pass ? 'My Pass' : 'Get a Pass'}</Link>
        <Link to="/rides"><FaThLarge /> Rate a Ride</Link>
        <Link to="/lost-found"><FaSearch /> Report Lost Item</Link>
        <Link to="/help"><FaQuestionCircle /> Help</Link>
      </div>
    </>
  );
}

function Bookings({ re }) {
  const list = [...all('bookings')].sort((a, b) => b.id - a.id);
  const parking = all('parking');

  const cancel = async (b) => {
    if (!window.confirm(`Cancel booking ${b.bookingId}? Any parking on it will be cancelled too.`)) return;
    try {
      await cancelBooking(b.id);
      re();
    } catch (e) {
      alert(e.message);
    }
  };

  if (!list.length) {
    return (
      <div className="card center-t">
        <p>No bookings yet.</p>
        <Link to="/tickets" className="btn gap-top">Book Tickets</Link>
      </div>
    );
  }

  return (
    <>
      <p className="small mut mb">You can cancel a booking any time before your visit date. Add parking to any upcoming booking.</p>
      <div className="cards2">
        {list.map((b) => {
          const guests = b.items.reduce((s, i) => s + i.qty, 0);
          const upcoming = b.status === 'Confirmed' && b.visitDate >= today();
          return (
            <div className="card bk" key={b.id}>
              <div className="row between nowrap">
                <h4>{b.bookingId}</h4>
                <Badge s={b.status} />
              </div>
              <p className="small mut">Visit on <b>{b.visitDate}</b> · {guests} guest{guests > 1 ? 's' : ''} · booked {String(b.createdAt).slice(0, 10)}</p>
              <div className="lines">
                {b.items.map((i) => <div key={i.typeId}><span>{i.name} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>)}
                {b.passDiscount > 0 && <div className="save"><span>Pass discount</span><span>− {inr(b.passDiscount)}</span></div>}
                {b.promoDiscount > 0 && <div className="save"><span>Promo {b.promoCode}</span><span>− {inr(b.promoDiscount)}</span></div>}
                <div className="tot"><span>Paid</span><span>{inr(b.total)}</span></div>
              </div>
              <Parking b={b} list={parking.filter((p) => p.bookingId === b.id)} upcoming={upcoming} re={re} />
              <div className="row gap-top">
                <Link to={`/ticket/${b.bookingId}`} className="btn sm">View Ticket</Link>
                {canCancel(b) && <button className="btn sm red" onClick={() => cancel(b)}>Cancel</button>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Parking({ b, list, upcoming, re }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('Car');
  const [no, setNo] = useState('');
  const [cap, setCap] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const booked = list.filter((p) => p.status === 'Booked');
  const pass = all('passes').find((p) => p.currentStatus === 'Active' && p.freeParking && p.validFrom <= b.visitDate && b.visitDate <= p.validTo);

  useEffect(() => {
    if (open) getCapacity(b.visitDate).then(setCap).catch(() => setCap(null));
  }, [open, b.visitDate]);

  if (!upcoming && !list.length) return null;

  const fee = pass ? 0 : cap ? (type === 'Car' ? cap.carFee : cap.bikeFee) : null;
  const slots = cap ? (type === 'Car' ? cap.carLeft : cap.bikeLeft) : null;

  const add = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await addParking(b.id, type, no);
      setNo('');
      setOpen(false);
      re();
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };

  const cancel = async (p) => {
    if (!window.confirm(`Cancel parking for ${p.vehicleNo}?`)) return;
    try {
      await cancelParking(p.id);
      re();
    } catch (x) {
      setErr(x.message);
    }
  };

  return (
    <div className="park">
      <div className="row between nowrap">
        <b className="small"><FaParking /> Parking</b>
        {upcoming && !open && <button className="add" onClick={() => setOpen(true)}>+ Add vehicle</button>}
      </div>
      {list.map((p) => (
        <div className="park-row" key={p.id}>
          <span>{p.vehicleType === 'Car' ? <FaCar /> : <FaMotorcycle />} <b>{p.vehicleNo}</b> <span className="small mut">{p.parkingCode}</span></span>
          <span className="row nowrap" style={{ gap: 8 }}>
            <span className="small">{p.fee ? inr(p.fee) : 'Free'}</span>
            <Badge s={p.status} />
            {p.status === 'Booked' && upcoming && <button className="add" style={{ borderColor: 'var(--bad)', color: 'var(--bad)' }} onClick={() => cancel(p)}>Cancel</button>}
          </span>
        </div>
      ))}
      {!list.length && !open && <p className="small mut">No parking added.</p>}
      {open && (
        <>
          <form onSubmit={add}>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>Car</option>
              <option>Bike</option>
            </select>
            <input required placeholder="Vehicle no. e.g. MH12AB1234" value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} />
            <button className="btn sm" style={{ marginTop: 0 }} disabled={busy || slots === 0}>{busy ? 'Adding...' : 'Add'}</button>
          </form>
          <p className="small mut" style={{ marginTop: 6 }}>
            {fee === null ? 'Checking slots...' : <>Fee: <b>{fee ? `${inr(fee)} (pay at the gate)` : `Free with your ${pass.planName} Pass`}</b> · {slots > 0 ? `${slots} ${type.toLowerCase()} slots left` : `No ${type.toLowerCase()} slots left`}</>}
            {' · '}<button type="button" className="add" style={{ border: 'none', padding: 0 }} onClick={() => { setOpen(false); setErr(''); }}>Close</button>
          </p>
        </>
      )}
      {booked.length > 0 && !open && <p className="small mut" style={{ marginTop: 4 }}>Show your ticket QR at the parking gate.</p>}
      {err && <p className="err">{err}</p>}
    </div>
  );
}

function Orders({ re }) {
  const [busy, setBusy] = useState(false);
  const list = all('foodOrders');

  const reload = async () => {
    setBusy(true);
    await loadData();
    setBusy(false);
    re();
  };

  const cancel = async (o) => {
    if (!window.confirm(`Cancel order ${o.orderCode}?`)) return;
    try {
      await cancelFoodOrder(o.id);
      re();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <>
      <div className="row between mb">
        <p className="small mut">Orders can be cancelled until the kitchen starts preparing them.</p>
        <button className="btn sm" onClick={reload} disabled={busy}><FaSyncAlt /> {busy ? 'Checking...' : 'Refresh status'}</button>
      </div>
      {!list.length ? (
        <div className="card center-t">
          <p>No food orders yet.</p>
          <Link to="/plaza" className="btn gap-top">Order Food</Link>
        </div>
      ) : (
        <div className="cards2">
          {list.map((o) => {
            const step = FLOW.indexOf(o.status);
            return (
              <div className="card bk" key={o.id}>
                <div className="row between nowrap">
                  <h4>{o.orderCode}</h4>
                  <Badge s={o.status} />
                </div>
                <p className="small mut"><b>{o.restaurant}</b> · {o.createdAt}</p>
                {o.status !== 'Cancelled' && (
                  <div className="steps">
                    {FLOW.map((s, i) => <span key={s} className={i <= step ? 'done' : ''}>{s}</span>)}
                  </div>
                )}
                {o.status === 'Ready' && <p className="ok-msg" style={{ margin: 0 }}>Your food is ready! Collect it at the {o.restaurant} counter.</p>}
                <div className="lines">
                  {o.items.map((i, k) => <div key={k}><span>{i.qty} × {i.name}</span><span>{inr(i.price * i.qty)}</span></div>)}
                  <div className="tot"><span>{o.status === 'Collected' ? 'Paid' : 'Pay at counter'}</span><span>{inr(o.total)}</span></div>
                </div>
                {o.note && <p className="small mut">Note: {o.note}</p>}
                {o.status === 'Placed' && <div><button className="btn sm red" onClick={() => cancel(o)}>Cancel Order</button></div>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Pass() {
  const passes = all('passes');
  const active = passes.find((p) => p.currentStatus === 'Active');
  return (
    <>
      {active ? (
        <PassCard p={active} />
      ) : (
        <div className="card center-t">
          <p>You don't have an active Annual Pass.</p>
          <Link to="/passes" className="btn gap-top">See Annual Passes</Link>
        </div>
      )}
      {passes.filter((p) => p !== active).length > 0 && (
        <div className="card tbl-wrap gap-top">
          <h3 className="h">Pass History</h3>
          <table className="tbl">
            <thead><tr><th>Pass</th><th>Plan</th><th>Price</th><th>Valid</th><th>Status</th></tr></thead>
            <tbody>
              {passes.filter((p) => p !== active).map((p) => (
                <tr key={p.id}>
                  <td><b>{p.passCode}</b></td>
                  <td>{p.planName}</td>
                  <td>{inr(p.price)}</td>
                  <td className="small">{p.validFrom} to {p.validTo}</td>
                  <td><Badge s={p.currentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Lost() {
  const list = all('lostItems');
  return (
    <>
      <div className="row between mb">
        <p className="small mut">Reports you made while logged in. Our team updates the status when your item is found.</p>
        <Link to="/lost-found" className="btn sm">Report Lost Item</Link>
      </div>
      {!list.length ? (
        <div className="card center-t"><p>No lost item reports.</p></div>
      ) : (
        <div className="cards2">
          {list.map((i) => (
            <div className="card bk" key={i.id}>
              <div className="row between nowrap">
                <h4>{i.item}</h4>
                <Badge s={i.status} />
              </div>
              <p className="small mut">Lost on {i.lostDate}{i.location && ` · ${i.location}`}</p>
              {i.desc && <p className="small">{i.desc}</p>}
              {i.status === 'Found' && <p className="ok-msg" style={{ margin: 0 }}>Good news! Collect it from Guest Services near the Main Gate with an ID.</p>}
              {i.adminNote && <p className="note">Park team: {i.adminNote}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}