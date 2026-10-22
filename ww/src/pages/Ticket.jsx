import { useParams, Link } from 'react-router-dom';
import { all, inr } from '../api';
import { useAuth } from '../auth';
import Badge from '../components/Badge';

export default function Ticket() {
  const { id } = useParams();
  const { user } = useAuth();
  const b = all('bookings').find((x) => x.bookingId === id && x.userId === user.id);

  if (!b) {
    return (
      <section className="sec center-col">
        <h2>Ticket not found</h2>
        <Link to="/my-bookings" className="btn">My Bookings</Link>
      </section>
    );
  }

  const guests = b.items.reduce((s, i) => s + i.qty, 0);

  return (
    <section className="sec center-col">
      {b.status === 'Confirmed' && <div className="ok-msg no-print">🎉 Booking confirmed! Show this ticket at the park entry gate.</div>}

      <div className="ticket">
        <div className="t-left">
          <div className="logo">Wonder<span>World</span></div>
          <h2>Entry Ticket</h2>
          <div className="t-grid">
            <div><small>Booking ID</small><b>{b.bookingId}</b></div>
            <div><small>Visit Date</small><b>{b.visitDate}</b></div>
            <div><small>Name</small><b>{user.name}</b></div>
            <div><small>Status</small><Badge s={b.status} /></div>
          </div>
          {b.items.map((i) => (
            <div className="row between" key={i.typeId}><span>{i.name} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>
          ))}
          <div className="row between total"><span>Total Paid</span><span>{inr(b.total)}</span></div>
        </div>
        <div className="t-right">
          <div className="barcode" />
          <b>{b.bookingId}</b>
          <small>{guests} Guest{guests > 1 ? 's' : ''}</small>
        </div>
      </div>

      <div className="row center no-print">
        <button className="btn" onClick={() => window.print()}>Print Ticket</button>
        <Link to="/my-bookings" className="btn o dark">My Bookings</Link>
      </div>
    </section>
  );
}