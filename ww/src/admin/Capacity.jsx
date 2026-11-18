import { useEffect, useState } from 'react';
import { FaSave, FaCar, FaMotorcycle } from 'react-icons/fa';
import { all, saveSettings, labRun, upsert, today, inr } from '../api';
import Badge from '../components/Badge';

export default function Capacity() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const ORDER = ['daily_capacity', 'car_slots', 'bike_slots', 'car_fee', 'bike_fee'];
  const settings = [...all('settings')].sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
  const [values, setValues] = useState(() => Object.fromEntries(settings.map((s) => [s.name, s.value])));
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [days, setDays] = useState([]);
  const [date, setDate] = useState('');
  const [pErr, setPErr] = useState('');

  const loadDays = () => labRun('proc2', [today(), 14]).then((r) => setDays(r.rows)).catch((e) => setErr(e.message));
  useEffect(() => {
    loadDays();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await saveSettings(values);
      setErr('');
      setMsg('Settings saved.');
      loadDays();
      re();
    } catch (x) {
      setMsg('');
      setErr(x.message);
    }
  };

  const parking = all('parking').filter((p) => !date || p.visitDate === date);
  const cancel = async (p) => {
    if (!window.confirm(`Cancel parking ${p.parkingCode}?`)) return;
    try {
      await upsert('parking', { id: p.id, status: 'Cancelled' });
      setPErr('');
      loadDays();
      re();
    } catch (x) {
      setPErr(x.message);
    }
  };

  return (
    <>
      <h3 className="h">Capacity & Parking</h3>

      <div className="two mb">
        <form className="card" onSubmit={save}>
          <h3 className="h">Park Limits</h3>
          <p className="small mut mb">Bookings and parking are blocked automatically by database triggers when these limits are reached.</p>
          <div className="fgrid">
            {settings.map((s) => (
              <label key={s.name}>{s.label}
                <input type="number" min="0" required value={values[s.name] ?? ''} onChange={(e) => setValues({ ...values, [s.name]: e.target.value })} />
              </label>
            ))}
          </div>
          {msg && <p className="ok-msg">{msg}</p>}
          {err && <p className="err">{err}</p>}
          <button className="btn"><FaSave /> Save Limits</button>
        </form>

        <div className="card tbl-wrap">
          <h3 className="h">Next 14 Days</h3>
          <p className="small mut mb">From stored procedure <code>sp_occupancy</code></p>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Visitors</th><th>Full</th><th><FaCar /></th><th><FaMotorcycle /></th></tr></thead>
            <tbody>
              {days.map((d) => {
                const pct = Number(d.percent_full);
                return (
                  <tr key={d.day}>
                    <td className="nowrap">{d.day}</td>
                    <td>{d.guests} / {d.capacity}</td>
                    <td style={{ minWidth: 110 }}>
                      <div className="small">{pct}%</div>
                      <div className={`bar ${pct >= 90 ? 'hot' : pct >= 60 ? 'warm' : ''}`}><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
                    </td>
                    <td>{d.cars_parked}</td>
                    <td>{d.bikes_parked}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card tbl-wrap">
        <div className="row between mb">
          <h3 className="h" style={{ margin: 0 }}>Parking Bookings</h3>
          <div className="row nowrap">
            <input type="date" className="mini" value={date} onChange={(e) => setDate(e.target.value)} />
            {date && <button className="btn sm o dark" onClick={() => setDate('')}>All dates</button>}
          </div>
        </div>
        {pErr && <p className="err">{pErr}</p>}
        <table className="tbl">
          <thead><tr><th>Parking</th><th>Visit Date</th><th>Visitor</th><th>Vehicle</th><th>Fee</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {parking.map((p) => (
              <tr key={p.id}>
                <td><b>{p.parkingCode}</b><div className="small mut">Booking {p.bookingCode}</div></td>
                <td>{p.visitDate}</td>
                <td>{p.userName}</td>
                <td>{p.vehicleType === 'Car' ? <FaCar /> : <FaMotorcycle />} {p.vehicleNo}</td>
                <td>{p.fee ? inr(p.fee) : 'Free (pass)'}</td>
                <td><Badge s={p.status} /></td>
                <td>{p.status === 'Booked' && <button className="btn sm red" onClick={() => cancel(p)}>Cancel</button>}</td>
              </tr>
            ))}
            {!parking.length && <tr><td colSpan="7" className="mut small">No parking bookings.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}