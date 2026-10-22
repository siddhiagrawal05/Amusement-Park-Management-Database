import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { FaPrint } from 'react-icons/fa';
import { all, today, inr, revenue } from '../api';
import Badge from '../components/Badge';

const COLORS = ['#E9A23B', '#1E44A8', '#E07B1F', '#2A5BD0', '#16a34a', '#C9831C', '#0E2463', '#F5B84A', '#6366f1'];
const tickets = (b) => b.items.reduce((s, i) => s + i.qty, 0);

function Sum({ list }) {
  const ok = list.filter((b) => b.status === 'Confirmed');
  return (
    <div className="mini-stats">
      <div><small>Bookings</small><b>{list.length}</b></div>
      <div><small>Cancelled</small><b>{list.length - ok.length}</b></div>
      <div><small>Tickets Sold</small><b>{ok.reduce((s, b) => s + tickets(b), 0)}</b></div>
      <div><small>Revenue</small><b>{inr(revenue(list))}</b></div>
    </div>
  );
}

export default function Reports() {
  const bookings = all('bookings');
  const rides = all('rides');
  const logs = all('rideLogs');
  const users = all('users');
  const [day, setDay] = useState(today());
  const [month, setMonth] = useState(today().slice(0, 7));

  const dayB = bookings.filter((b) => b.createdAt === day);
  const monB = bookings.filter((b) => b.createdAt.startsWith(month));

  const [y, mo] = month.split('-').map(Number);
  const daysIn = new Date(y, mo, 0).getDate();
  const monthly = Array.from({ length: daysIn }, (_, i) => {
    const d = `${month}-${String(i + 1).padStart(2, '0')}`;
    return { day: i + 1, revenue: revenue(bookings.filter((b) => b.createdAt === d)) };
  });

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 5 + i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { month: d.toLocaleString('en', { month: 'short' }), revenue: revenue(bookings.filter((b) => b.createdAt.startsWith(k))) };
  });

  const popular = rides
    .map((r) => ({ name: r.name, rides: logs.filter((l) => l.rideId === r.id).length }))
    .sort((a, b) => b.rides - a.rides);

  const confirmed = bookings.filter((b) => b.status === 'Confirmed');
  const byType = all('ticketTypes').map((t) => ({
    name: t.name,
    value: confirmed.reduce((s, b) => s + (b.items.find((i) => i.typeId === t.id)?.qty || 0), 0),
  }));
  const canc = bookings.length - confirmed.length;
  const name = (id) => users.find((u) => u.id === id)?.name || '-';

  return (
    <>
      <div className="row between">
        <h3 className="h">Revenue & Reports</h3>
        <button className="btn no-print" onClick={() => window.print()}><FaPrint /> Print Report</button>
      </div>

      <div className="card mb">
        <h3 className="h">Booking Statistics (All Time)</h3>
        <Sum list={bookings} />
        <p className="small mut">
          Confirmed: {confirmed.length} • Cancelled: {canc} • Cancel rate: {bookings.length ? Math.round((canc * 100) / bookings.length) : 0}% •
          Average booking value: {inr(confirmed.length ? Math.round(revenue(bookings) / confirmed.length) : 0)}
        </p>
      </div>

      <div className="two mb">
        <div className="card">
          <div className="row between">
            <h3 className="h">Daily Sales Report</h3>
            <input type="date" className="mini" value={day} onChange={(e) => setDay(e.target.value)} />
          </div>
          <Sum list={dayB} />
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Booking</th><th>Visitor</th><th>Tickets</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {dayB.map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.bookingId}</b></td><td>{name(b.userId)}</td><td>{tickets(b)}</td><td>{inr(b.total)}</td><td><Badge s={b.status} /></td>
                  </tr>
                ))}
                {!dayB.length && <tr><td colSpan="5" className="mut">No bookings on this day.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="row between">
            <h3 className="h">Monthly Sales Report</h3>
            <input type="month" className="mini" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <Sum list={monB} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(v) => inr(v)} />
              <Bar dataKey="revenue" fill="#1E44A8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mb">
        <h3 className="h">Revenue – Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={last6}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => inr(v)} />
            <Bar dataKey="revenue" fill="#E9A23B" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="two">
        <div className="card">
          <h3 className="h">Popular Rides</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={popular} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip />
              <Bar dataKey="rides" radius={[0, 6, 6, 0]}>
                {popular.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="h">Tickets Sold by Type</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}