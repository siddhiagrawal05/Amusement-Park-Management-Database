import { useParams, Link } from 'react-router-dom';
import { FaCar, FaMotorcycle } from 'react-icons/fa';
import { all, inr, qrUrl } from '../api';
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
        <Link to="/my-bookings" className="btn">My Account</Link>
      </section>
    );
  }

  const guests = b.items.reduce((s, i) => s + i.qty, 0);
  const parking = all('parking').filter((p) => p.bookingId === b.id && p.status === 'Booked');

  return (
    <section className="sec center-col">
      {b.status === 'Confirmed' && (
        <div className="ok-msg no-print">
          Booking confirmed! A confirmation email has been sent to {user.email}. Show this QR code at the park entry gate.
        </div>
      )}

      <div className="ticket">
        <div className="t-left">
          <div className="logo">Wonder<span>World</span></div>
          <h2>Entry Ticket</h2>
          <div className="t-grid">
            <div><small>Booking ID</small><b>{b.bookingId}</b></div>
            <div><small>Visit Date</small><b>{b.visitDate}</b></div>
            <div><small>Name</small><b>{user.name}</b></div>
            <div><small>Status</small><Badge s={b.status} /></div>
            <div><small>Payment</small><b>{b.paymentId ? 'Paid online' : 'Paid at counter'}</b></div>
            <div><small>Payment ID</small><b>{b.paymentId || '—'}</b></div>
          </div>
          {b.items.map((i) => (
            <div className="row between" key={i.typeId}><span>{i.name} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>
          ))}
          {b.passDiscount > 0 && <div className="row between save"><span>Annual Pass discount</span><span>− {inr(b.passDiscount)}</span></div>}
          {b.promoDiscount > 0 && <div className="row between save"><span>Promo {b.promoCode}</span><span>− {inr(b.promoDiscount)}</span></div>}
          <div className="row between total"><span>Total Paid</span><span>{inr(b.total)}</span></div>
          {parking.length > 0 && (
            <div className="row gap-top">
              {parking.map((p) => (
                <span key={p.id} className="badge b-info">{p.vehicleType === 'Car' ? <FaCar /> : <FaMotorcycle />} Parking {p.vehicleNo}</span>
              ))}
            </div>
          )}
        </div>
        <div className="t-right">
          <img
            src={qrUrl(b)}
            alt={`QR code for booking ${b.bookingId}`}
            style={{ width: 150, height: 150, background: '#fff', padding: 6, borderRadius: 12 }}
          />
          <b>{b.bookingId}</b>
          <small>{guests} Guest{guests > 1 ? 's' : ''}</small>
        </div>
      </div>

      <div className="row center no-print">
        <button className="btn" onClick={() => window.print()}>Print Ticket</button>
        <Link to="/my-bookings" className="btn o dark">My Account</Link>
      </div>
    </section>
  );
}