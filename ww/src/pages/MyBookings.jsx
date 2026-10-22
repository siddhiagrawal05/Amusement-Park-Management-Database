import { useState } from 'react';
import { Link } from 'react-router-dom';
import { all, cancelBooking, canCancel, inr } from '../api';
import { useAuth } from '../auth';
import Badge from '../components/Badge';

export default function MyBookings() {
  const { user } = useAuth();
  const [, refresh] = useState(0);
  const list = all('bookings').filter((b) => b.userId === user.id).sort((a, b) => b.id - a.id);

  const cancel = (b) => {
    if (!window.confirm(`Cancel booking ${b.bookingId}?`)) return;
    try {
      cancelBooking(b.id);
      refresh((x) => x + 1);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section className="sec">
      <h2 className="title">My<span>Bookings</span></h2>
      <p className="mut mb">You can cancel a booking any time before your visit date.</p>

      {!list.length ? (
        <div className="card center-t">
          <p>No bookings yet.</p>
          <Link to="/tickets" className="btn gap-top">Book Tickets</Link>
        </div>
      ) : (
        <div className="card tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Booking ID</th><th>Booked On</th><th>Visit Date</th><th>Tickets</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td><b>{b.bookingId}</b></td>
                  <td>{b.createdAt}</td>
                  <td>{b.visitDate}</td>
                  <td className="small">{b.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</td>
                  <td>{inr(b.total)}</td>
                  <td><Badge s={b.status} /></td>
                  <td>
                    <div className="row nowrap">
                      <Link to={`/ticket/${b.bookingId}`} className="btn sm">View</Link>
                      {canCancel(b) && <button className="btn sm red" onClick={() => cancel(b)}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}