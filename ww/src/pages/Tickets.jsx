import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMinus, FaPlus, FaCalendarAlt, FaTicketAlt, FaLock, FaTag, FaIdCard } from 'react-icons/fa';
import { all, createPaymentOrder, createBooking, getQuote, getCapacity, today, inr, PICS } from '../api';
import { useAuth } from '../auth';
import Img from '../components/Img';
import Banner from '../components/Banner';
import DemoPay from '../components/DemoPay';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function Tickets() {
  const types = all('ticketTypes');
  const [qty, setQty] = useState({});
  const [date, setDate] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(null);
  const [capRes, setCapRes] = useState(null);
  const [code, setCode] = useState('');
  const [promo, setPromo] = useState('');
  const [promoErr, setPromoErr] = useState('');
  const [qRes, setQRes] = useState(null);
  const { user } = useAuth();
  const nav = useNavigate();
  const visitor = user?.role === 'visitor';

  const change = (id, d) => setQty((q) => ({ ...q, [id]: Math.min(10, Math.max(0, (q[id] || 0) + d)) }));
  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const subtotal = types.reduce((s, t) => s + t.price * (qty[t.id] || 0), 0);
  const items = types.map((t) => ({ typeId: t.id, qty: qty[t.id] || 0 }));
  const itemsKey = JSON.stringify(items);
  const hasPass = all('passes').some((p) => p.currentStatus === 'Active');

  const qKey = JSON.stringify([date, items, promo]);
  const canQuote = visitor && !!date && date >= today() && count > 0;

  useEffect(() => {
    if (!date || date < today()) return;
    let off = false;
    getCapacity(date).then((d) => !off && setCapRes({ date, data: d })).catch(() => {});
    return () => {
      off = true;
    };
  }, [date]);

  useEffect(() => {
    if (!canQuote) return;
    let off = false;
    getQuote(date, JSON.parse(itemsKey), promo)
      .then((q) => !off && setQRes({ key: qKey, data: q }))
      .catch((e) => {
        if (off || !promo) return;
        setPromoErr(e.message);
        setPromo('');
      });
    return () => {
      off = true;
    };
  }, [canQuote, date, itemsKey, promo, qKey]);

  const cap = capRes && capRes.date === date ? capRes.data : null;
  const quote = canQuote && qRes && qRes.key === qKey ? qRes.data : null;
  const total = quote ? quote.total : subtotal;
  const left = cap ? cap.spotsLeft : null;
  const tooMany = left !== null && count > left;
  const pct = cap ? Math.round(((cap.capacity - cap.spotsLeft) * 100) / cap.capacity) : 0;

  const apply = (e) => {
    e.preventDefault();
    setPromoErr('');
    const c = code.trim().toUpperCase();
    if (!c) return;
    if (!user) return setPromoErr('Please log in to use a promo code.');
    if (!visitor) return setPromoErr('Promo codes are for visitor accounts.');
    if (!date || !count) return setPromoErr('Choose your visit date and tickets first.');
    setPromo(c);
  };

  const finish = async (payment) => {
    try {
      const b = await createBooking(date, items, payment, promo);
      nav(`/ticket/${b.bookingId}`);
    } catch (x) {
      setErr(x.message);
      setBusy(false);
      setDemo(null);
    }
  };

  const book = async () => {
    setErr('');
    if (!user) return nav('/login', { state: { from: '/tickets' } });
    if (!visitor) return setErr('Admins cannot book tickets. Please use a visitor account.');
    if (!date) return setErr('Please select your visit date.');
    if (date < today()) return setErr('Visit date cannot be in the past.');
    if (!count) return setErr('Please add at least one ticket.');
    if (tooMany) return setErr(left > 0 ? `Only ${left} tickets are left for this date.` : 'The park is full on this date. Please choose another day.');

    setBusy(true);
    try {
      const order = await createPaymentOrder(date, items, promo);

      if (order.mode === 'demo') {
        setDemo(order);
        return;
      }

      if (!(await loadRazorpay())) throw new Error('Could not load the payment window. Please check your internet.');
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'WonderWorld',
        description: `${count} ticket(s) for ${date}`,
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email, contact: `+91${user.phone}` },
        theme: { color: '#E9A23B' },
        handler: (resp) =>
          finish({
            orderId: resp.razorpay_order_id,
            paymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
          }),
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on('payment.failed', (r) => setErr(r.error?.description || 'Payment failed. Please try again.'));
      rzp.open();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  return (
    <>
      <Banner img={PICS.bTickets} title="Book Your Tickets" sub="Skip the queue. Book online in one minute." />

      <section className="sec cream">
        <div className="book">
          <div className="grid4">
            {types.map((t) => (
              <div className="tcard" key={t.id}>
                <div className="tpic"><Img src={t.img} alt={t.name} /></div>
                <div className="tbody">
                  <h3>{t.name}</h3>
                  <p className="mut small">{t.desc}</p>
                  <div className="price">{inr(t.price)}<small> /person</small></div>
                  <div className="qty">
                    <button onClick={() => change(t.id, -1)}><FaMinus /></button>
                    <b>{qty[t.id] || 0}</b>
                    <button onClick={() => change(t.id, 1)}><FaPlus /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="card summary">
            <h3><FaTicketAlt /> Booking Summary</h3>
            <label><FaCalendarAlt /> Visit Date
              <input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            {cap && (
              <div className={`spots ${left <= 20 ? 'hot' : pct >= 60 ? 'warm' : ''}`}>
                {left > 0 ? `${left} of ${cap.capacity} tickets left for this day` : 'Sold out for this day'}
                <div className="bar"><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
              </div>
            )}

            {types.filter((t) => qty[t.id]).map((t) => (
              <div className="row between" key={t.id}>
                <span>{t.name} × {qty[t.id]}</span><span>{inr(t.price * qty[t.id])}</span>
              </div>
            ))}

            <hr />
            {promo && quote?.promo ? (
              <div className="applied">
                <span><FaTag /> {quote.promo.code} applied</span>
                <button onClick={() => { setPromo(''); setCode(''); }}>Remove</button>
              </div>
            ) : (
              <form className="promo" onSubmit={apply}>
                <input placeholder="Promo code" value={code} onChange={(e) => { setCode(e.target.value); setPromoErr(''); }} />
                <button className="btn">Apply</button>
              </form>
            )}
            {promoErr && <p className="err">{promoErr}</p>}

            {count > 0 && (
              <>
                <div className="row between"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
                {quote?.passDiscount > 0 && (
                  <div className="row between save"><span><FaIdCard /> {quote.passName} Pass</span><span>− {inr(quote.passDiscount)}</span></div>
                )}
                {quote?.promoDiscount > 0 && (
                  <div className="row between save"><span><FaTag /> {quote.promo.code}</span><span>− {inr(quote.promoDiscount)}</span></div>
                )}
              </>
            )}
            <hr />
            <div className="row between total"><span>Total ({count} ticket{count === 1 ? '' : 's'})</span><span>{inr(total)}</span></div>
            {quote && subtotal > total && <p className="small save" style={{ fontWeight: 700 }}>You save {inr(subtotal - total)}!</p>}
            {err && <p className="err">{err}</p>}
            <button className="btn full" onClick={book} disabled={busy || tooMany}>
              {busy ? 'Processing...' : <><FaLock /> Pay {inr(total)} & Book</>}
            </button>
            <p className="mut small center-t">Secure online payment</p>
            {!user && <p className="mut small center-t">You will be asked to log in first.</p>}
            {visitor && !hasPass && <Link to="/passes" className="pass-hint"><FaIdCard /> Get an Annual Pass and save up to 30% on every visit</Link>}
          </aside>
        </div>
      </section>

      {demo && (
        <DemoPay
          amount={demo.amount / 100}
          onClose={() => { setDemo(null); setBusy(false); }}
          onPaid={(method) => finish({ orderId: demo.orderId, method })}
        />
      )}
    </>
  );
}