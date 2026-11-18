import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMinus, FaPlus, FaCalendarAlt, FaTicketAlt, FaLock } from 'react-icons/fa';
import { all, createPaymentOrder, createBooking, today, inr, PICS } from '../api';
import { useAuth } from '../auth';
import Img from '../components/Img';
import Banner from '../components/Banner';
import DemoPay from '../components/DemoPay';

// Load the Razorpay checkout script only when real Razorpay keys are set up
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
  const [demo, setDemo] = useState(null); // { order, items } when the demo payment window is open
  const { user } = useAuth();
  const nav = useNavigate();

  const change = (id, d) => setQty((q) => ({ ...q, [id]: Math.min(10, Math.max(0, (q[id] || 0) + d)) }));
  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const total = types.reduce((s, t) => s + t.price * (qty[t.id] || 0), 0);

  // Save the booking after payment
  const finish = async (items, payment) => {
    try {
      const b = await createBooking(date, items, payment);
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
    if (user.role !== 'visitor') return setErr('Admins cannot book tickets. Please use a visitor account.');
    if (!date) return setErr('Please select your visit date.');
    if (date < today()) return setErr('Visit date cannot be in the past.');
    if (!count) return setErr('Please add at least one ticket.');

    const items = types.map((t) => ({ typeId: t.id, qty: qty[t.id] || 0 }));
    setBusy(true);
    try {
      const order = await createPaymentOrder(date, items);

      // Demo payment (no Razorpay keys)
      if (order.mode === 'demo') {
        setDemo({ order, items });
        return;
      }

      // Real Razorpay test mode
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
          finish(items, {
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
            {types.filter((t) => qty[t.id]).map((t) => (
              <div className="row between" key={t.id}>
                <span>{t.name} × {qty[t.id]}</span><span>{inr(t.price * qty[t.id])}</span>
              </div>
            ))}
            <hr />
            <div className="row between total"><span>Total ({count} tickets)</span><span>{inr(total)}</span></div>
            {err && <p className="err">{err}</p>}
            <button className="btn full" onClick={book} disabled={busy}>
              {busy ? 'Processing...' : <><FaLock /> Pay {inr(total)} & Book</>}
            </button>
            <p className="mut small center-t">Secure online payment</p>
            {!user && <p className="mut small center-t">You will be asked to log in first.</p>}
          </aside>
        </div>
      </section>

      {demo && (
        <DemoPay
          amount={demo.order.amount / 100}
          onClose={() => { setDemo(null); setBusy(false); }}
          onPaid={(method) => finish(demo.items, { orderId: demo.order.orderId, method })}
        />
      )}
    </>
  );
}