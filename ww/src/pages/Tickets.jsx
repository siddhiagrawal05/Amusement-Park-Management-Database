import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMinus, FaPlus, FaCalendarAlt, FaTicketAlt } from 'react-icons/fa';
import { all, createBooking, today, inr, PICS } from '../api';
import { useAuth } from '../auth';
import Img from '../components/Img';
import Banner from '../components/Banner';

export default function Tickets() {
  const types = all('ticketTypes');
  const [qty, setQty] = useState({});
  const [date, setDate] = useState('');
  const [err, setErr] = useState('');
  const { user } = useAuth();
  const nav = useNavigate();

  const change = (id, d) => setQty((q) => ({ ...q, [id]: Math.min(10, Math.max(0, (q[id] || 0) + d)) }));
  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const total = types.reduce((s, t) => s + t.price * (qty[t.id] || 0), 0);

  const book = () => {
    setErr('');
    if (!user) return nav('/login', { state: { from: '/tickets' } });
    if (user.role !== 'visitor') return setErr('Admins cannot book tickets. Please use a visitor account.');
    if (!date) return setErr('Please select your visit date.');
    if (date < today()) return setErr('Visit date cannot be in the past.');
    if (!count) return setErr('Please add at least one ticket.');
    const b = createBooking(user.id, date, types.map((t) => ({ typeId: t.id, qty: qty[t.id] || 0 })));
    nav(`/ticket/${b.bookingId}`);
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
            <button className="btn full" onClick={book}>Confirm Booking</button>
            {!user && <p className="mut small center-t">You will be asked to log in first.</p>}
          </aside>
        </div>
      </section>
    </>
  );
}