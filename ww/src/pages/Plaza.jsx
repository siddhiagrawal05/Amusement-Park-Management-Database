import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaLeaf, FaTint, FaUtensils, FaShoppingBag, FaStar, FaMapMarkedAlt, FaChevronDown, FaChevronUp, FaMinus, FaPlus, FaTimes, FaShoppingCart, FaCheckCircle, FaReceipt } from 'react-icons/fa';
import { all, inr, placeFoodOrder } from '../api';
import { useAuth } from '../auth';
import Banner from '../components/Banner';
import Img from '../components/Img';
import Badge from '../components/Badge';

const BANNER = 'https://images.unsplash.com/photo-1758448500813-59f3770da00d?auto=format&fit=crop&w=1920&q=80';
const SHOW_FIRST = 6;
const CART_KEY = 'ww_cart';
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmt12 = (t) => {
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};
const isOpen = (place, mins) => toMin(place.open) <= mins && mins < toMin(place.close);
const emptyCart = { restaurantId: null, items: {} };
const readCart = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY)) || emptyCart;
  } catch {
    return emptyCart;
  }
};
const saveCart = (c) => {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(c));
  } catch {
    return;
  }
};

function VegMark({ veg }) {
  const c = veg ? '#16a34a' : '#b91c1c';
  return (
    <span title={veg ? 'Veg' : 'Non-veg'} style={{ width: 14, height: 14, border: `2px solid ${c}`, borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
    </span>
  );
}

export default function Plaza() {
  const [now, setNow] = useState(new Date());
  const [vegOnly, setVegOnly] = useState(false);
  const [openMenus, setOpenMenus] = useState([]);
  const [cart, setCart] = useState(readCart);
  const [showCart, setShowCart] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(null);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => saveCart(cart), [cart]);

  const mins = now.getHours() * 60 + now.getMinutes();
  const restaurants = all('restaurants');
  const menu = all('menuItems');
  const shops = all('shops');
  const active = all('foodOrders').filter((o) => ['Placed', 'Preparing', 'Ready'].includes(o.status));
  const toggleMenu = (id) => setOpenMenus(openMenus.includes(id) ? openMenus.filter((x) => x !== id) : [...openMenus, id]);

  const cartRest = restaurants.find((r) => r.id === cart.restaurantId);
  const lines = Object.entries(cart.items)
    .map(([id, qty]) => ({ item: menu.find((m) => m.id === +id), qty }))
    .filter((l) => l.item && l.qty > 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);

  const change = (m, d) => {
    if (cart.restaurantId && cart.restaurantId !== m.restaurantId && count > 0) {
      if (!window.confirm(`Your cart has food from ${cartRest?.name}. Start a new order from this restaurant instead?`)) return;
      setCart({ restaurantId: m.restaurantId, items: { [m.id]: 1 } });
      return;
    }
    const qty = Math.min(20, Math.max(0, (cart.items[m.id] || 0) + d));
    const items = { ...cart.items, [m.id]: qty };
    if (!qty) delete items[m.id];
    setCart(Object.keys(items).length ? { restaurantId: m.restaurantId, items } : emptyCart);
  };

  const order = async () => {
    setErr('');
    if (!user) return nav('/login', { state: { from: '/plaza' } });
    if (user.role !== 'visitor') return setErr('Admins cannot place food orders. Please use a visitor account.');
    setBusy(true);
    try {
      const o = await placeFoodOrder(cart.restaurantId, lines.map((l) => ({ menuItemId: l.item.id, qty: l.qty })), note);
      setPlaced(o);
      setCart(emptyCart);
      setNote('');
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };

  const closeCart = () => {
    setShowCart(false);
    setPlaced(null);
    setErr('');
  };

  return (
    <>
      <Banner img={BANNER} title="Central Plaza" sub="Order food online and shop at the heart of the park" />
      <section className="sec cream" style={{ paddingBottom: 40 }}>
        <div className="grid4">
          <div className="card info"><FaClock /><h3>Open Daily</h3><p className="mut small">10:00 AM – 8:00 PM</p></div>
          <div className="card info"><FaMapMarkerAlt /><h3>Location</h3><p className="mut small">Centre of the park, 2 minutes from the Main Gate</p></div>
          <div className="card info"><FaReceipt /><h3>Order Online</h3><p className="mut small">Skip the queue. Order here, then pay and collect at the counter.</p></div>
          <div className="card info"><FaTint /><h3>Free Water</h3><p className="mut small">Drinking water stations all around the plaza</p></div>
        </div>
      </section>

      <section className="sec">
        <div className="head">
          <h2><FaUtensils /> Food <span className="hl">Court</span></h2>
          <p className="mut">{restaurants.length} restaurants · {menu.length} dishes · tap <b>Add</b> to order</p>
        </div>

        {active.length > 0 && (
          <div className="my-orders">
            <b>Your orders:</b>
            {active.map((o) => (
              <Link key={o.id} to="/my-bookings?tab=orders">{o.orderCode} <Badge s={o.status} /></Link>
            ))}
          </div>
        )}

        <div className="toolbar" style={{ justifyContent: 'center' }}>
          <button className={`chip ${!vegOnly ? 'on' : ''}`} onClick={() => setVegOnly(false)}>All Items</button>
          <button className={`chip ${vegOnly ? 'on' : ''}`} onClick={() => setVegOnly(true)}><FaLeaf /> Veg Only</button>
        </div>

        <div className="grid3">
          {restaurants.map((r) => {
            const items = menu.filter((m) => m.restaurantId === r.id && (!vegOnly || m.veg));
            const full = openMenus.includes(r.id);
            const shown = full ? items : items.slice(0, SHOW_FIRST);
            const open = isOpen(r, mins);
            return (
              <div className="ride" key={r.id}>
                <div className="pic">
                  <Img src={r.img} alt={r.name} />
                  <span className={`badge ${open ? 'b-ok' : 'b-bad'}`}>{open ? 'Open now' : 'Closed now'}</span>
                  <span className="cat-chip"><FaStar /> {r.rating}</span>
                </div>
                <div className="body">
                  <h3>{r.name}</h3>
                  <p className="small mut">{r.cuisine}</p>
                  <p className="small" style={{ margin: '6px 0 10px' }}><FaClock /> {fmt12(r.open)} – {fmt12(r.close)}</p>
                  {!open && <p className="rule">Closed now. You can still pre-order and collect after {fmt12(r.open)}.</p>}
                  {items.length === 0 && <p className="small mut">No items to show.</p>}
                  {shown.map((m) => {
                    const q = cart.restaurantId === r.id ? cart.items[m.id] || 0 : 0;
                    return (
                      <div key={m.id} className="menu-row">
                        <span className="nm"><VegMark veg={m.veg} /> {m.name}</span>
                        <span className="pr">
                          <b>{inr(m.price)}</b>
                          {q ? (
                            <span className="mq">
                              <button onClick={() => change(m, -1)} aria-label="Remove one"><FaMinus /></button>
                              <b>{q}</b>
                              <button onClick={() => change(m, 1)} aria-label="Add one"><FaPlus /></button>
                            </span>
                          ) : (
                            <button className="add" onClick={() => change(m, 1)}>Add</button>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {items.length > SHOW_FIRST && (
                    <button className="more" onClick={() => toggleMenu(r.id)}>
                      {full ? <>Show less <FaChevronUp /></> : <>See full menu ({items.length} items) <FaChevronDown /></>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sec cream">
        <div className="head">
          <h2><FaShoppingBag /> Plaza <span className="hl">Shops</span></h2>
        </div>
        <div className="grid3">
          {shops.map((s) => (
            <div className="ride" key={s.id}>
              <div className="pic">
                <Img src={s.img} alt={s.name} />
                <span className={`badge ${isOpen(s, mins) ? 'b-ok' : 'b-bad'}`}>
                  {isOpen(s, mins) ? 'Open now' : 'Closed now'}
                </span>
              </div>
              <div className="body">
                <h3>{s.name}</h3>
                <p className="mut small">{s.desc}</p>
                <div className="sched" style={{ marginTop: 10 }}>
                  {s.priceRange && <span><FaShoppingBag /> {s.priceRange}</span>}
                  <span><FaClock /> {fmt12(s.open)} – {fmt12(s.close)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="cta">
        <h2>Find The Plaza</h2>
        <p>The Central Plaza is right in the middle of the park, between all four zones.</p>
        <Link to="/map" className="btn y gap-top"><FaMapMarkedAlt /> Open Park Map</Link>
      </div>

      {count > 0 && !showCart && (
        <div className="cartbar">
          <FaShoppingCart />
          <div>
            <b>{count} item{count > 1 ? 's' : ''} · {inr(total)}</b>
            <small>{cartRest?.name}</small>
          </div>
          <button className="btn sm" onClick={() => setShowCart(true)}>View Cart</button>
        </div>
      )}

      {(showCart || placed) && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && closeCart()}>
          <div className="modal">
            <button className="x" onClick={closeCart} aria-label="Close"><FaTimes /></button>
            {placed ? (
              <div className="center-t">
                <FaCheckCircle style={{ fontSize: 52, color: 'var(--ok)' }} />
                <h3 style={{ padding: 0, marginTop: 8 }}>Order Placed!</h3>
                <p className="mut">Show this code at the <b>{placed.restaurant}</b> counter.</p>
                <div className="big-code">{placed.orderCode}</div>
                <p>Amount to pay at the counter: <b>{inr(placed.total)}</b></p>
                <p className="small mut gap-top">You can watch the order status change in My Account.</p>
                <div className="row center gap-top">
                  <Link to="/my-bookings?tab=orders" className="btn">Track Order</Link>
                  <button className="btn o dark" onClick={closeCart}>Order More</button>
                </div>
              </div>
            ) : (
              <>
                <h3>Your Order</h3>
                <p className="small mut mb">{cartRest?.name}</p>
                {lines.map((l) => (
                  <div className="cart-line" key={l.item.id}>
                    <span className="row nowrap" style={{ gap: 8 }}><VegMark veg={l.item.veg} /> {l.item.name}</span>
                    <span className="mq">
                      <button onClick={() => change(l.item, -1)} aria-label="Remove one"><FaMinus /></button>
                      <b>{l.qty}</b>
                      <button onClick={() => change(l.item, 1)} aria-label="Add one"><FaPlus /></button>
                    </span>
                    <b style={{ minWidth: 70, textAlign: 'right' }}>{inr(l.item.price * l.qty)}</b>
                  </div>
                ))}
                {!lines.length && <p className="mut">Your cart is empty.</p>}
                <label className="gap-top">Note for the kitchen (optional)
                  <textarea maxLength="150" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. less spicy, no onion" />
                </label>
                <div className="row between total"><span>Total</span><span>{inr(total)}</span></div>
                <p className="small mut">Pay at the counter when you collect your food.</p>
                {err && <p className="err">{err}</p>}
                <button className="btn full" onClick={order} disabled={busy || !lines.length}>
                  {busy ? 'Placing order...' : user ? `Place Order · ${inr(total)}` : 'Log in to Place Order'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}