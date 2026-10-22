import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FaRupeeSign, FaTicketAlt, FaUsers, FaRocket, FaTools, FaUserTie, FaCalendarDay, FaCalendarAlt, FaReceipt } from 'react-icons/fa';
import { all, today, addDays, inr, revenue } from '../api';
import Badge from '../components/Badge';

export default function Dash() {
  const bookings = all('bookings');
  const rides = all('rides');
  const users = all('users');
  const ok = bookings.filter((b) => b.status === 'Confirmed');
  const t = today();
  const month = t.slice(0, 7);

  const cards = [
    ['Total Revenue', inr(revenue(bookings)), FaRupeeSign, '#E9A23B,#C9831C'],
    ["Today's Sales", inr(revenue(bookings.filter((b) => b.createdAt === t))), FaCalendarDay, '#1E44A8,#0E2463'],
    ['This Month', inr(revenue(bookings.filter((b) => b.createdAt.startsWith(month)))), FaCalendarAlt, '#F5B84A,#E07B1F'],
    ['Total Bookings', bookings.length, FaReceipt, '#2A5BD0,#1E44A8'],
    ['Tickets Sold', ok.reduce((s, b) => s + b.items.reduce((a, i) => a + i.qty, 0), 0), FaTicketAlt, '#E07B1F,#B5541A'],
    ['Visitors', users.filter((u) => u.role === 'visitor').length, FaUsers, '#0E2463,#2A5BD0'],
    ['Rides Open', `${rides.filter((r) => r.status === 'Open').length} / ${rides.length}`, FaRocket, '#16a34a,#0e7a37'],
    ['Under Maintenance', rides.filter((r) => r.status === 'Under Maintenance').length, FaTools, '#C9831C,#8a5a12'],
    ['Employees', all('employees').length, FaUserTie, '#334155,#0E2463'],
  ];

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(t, i - 6);
    return { day: d.slice(5), revenue: revenue(bookings.filter((b) => b.createdAt === d)) };
  });

  const recent = [...bookings].sort((a, b) => b.id - a.id).slice(0, 6);
  const name = (id) => users.find((u) => u.id === id)?.name || '-';

  return (
    <>
      <div className="stats">
        {cards.map(([label, val, Icon, g]) => (
          <div className="stat" key={label} style={{ background: `linear-gradient(135deg,${g})` }}>
            <Icon />
            <small>{label}</small>
            <b>{val}</b>
          </div>
        ))}
      </div>

      <div className="two">
        <div className="card">
          <h3 className="h">Sales – Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={week}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E9A23B" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#E9A23B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(v) => inr(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#1E44A8" fill="url(#g1)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card tbl-wrap">
          <h3 className="h">Recent Bookings</h3>
          <table className="tbl">
            <thead><tr><th>Booking</th><th>Visitor</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td><b>{b.bookingId}</b><br /><span className="small mut">{b.createdAt}</span></td>
                  <td>{name(b.userId)}</td>
                  <td>{inr(b.total)}</td>
                  <td><Badge s={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}