import { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { all, upsert, remove, saveMaint, today } from '../api';
import Badge from '../components/Badge';
import Img from '../components/Img';

const DAYS = ['All Days', 'Mon - Fri', 'Sat - Sun', 'Mon - Sat'];
const MSTAT = ['Scheduled', 'In Progress', 'Completed'];

export default function Sched() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const rides = all('rides');
  const rname = (id) => rides.find((r) => r.id === id)?.name || '-';
  const schedules = all('schedules');
  const maint = [...all('maintenance')].sort((a, b) => b.date.localeCompare(a.date));

  const [s, setS] = useState({ rideId: '', days: 'All Days', open: '10:00', close: '18:00' });
  const [m, setM] = useState({ rideId: '', date: today(), desc: '', status: 'Scheduled' });
  const [err, setErr] = useState('');

  const addS = (e) => {
    e.preventDefault();
    if (s.close <= s.open) return setErr('Closing time must be after opening time.');
    upsert('schedules', { ...s, rideId: +s.rideId });
    setErr('');
    setS({ ...s, rideId: '' });
    re();
  };

  const delS = (id) => {
    if (window.confirm('Delete this schedule?')) { remove('schedules', id); re(); }
  };

  const addM = (e) => {
    e.preventDefault();
    saveMaint({ ...m, rideId: +m.rideId });
    setM({ ...m, rideId: '', desc: '' });
    re();
  };

  const setMS = (x, status) => { saveMaint({ ...x, status }); re(); };

  return (
    <>
      <h3 className="h">Ride Availability</h3>
      <div className="avail">
        {rides.map((r) => {
          const next = maint.filter((x) => x.rideId === r.id && x.status !== 'Completed').map((x) => x.date).sort()[0];
          return (
            <div className="card av" key={r.id}>
              <Img src={r.img} alt={r.name} className="thumb" />
              <div>
                <b>{r.name}</b><br />
                <Badge s={r.status} />
                {next && <div className="small mut">Maintenance: {next}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="two">
        {/* Operating schedules */}
        <div className="card">
          <h3 className="h">Operating Schedules</h3>
          <form className="fgrid" onSubmit={addS}>
            <label>Ride
              <select required value={s.rideId} onChange={(e) => setS({ ...s, rideId: e.target.value })}>
                <option value="">Select ride</option>
                {rides.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label>Days
              <select value={s.days} onChange={(e) => setS({ ...s, days: e.target.value })}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select>
            </label>
            <label>Opens<input type="time" required value={s.open} onChange={(e) => setS({ ...s, open: e.target.value })} /></label>
            <label>Closes<input type="time" required value={s.close} onChange={(e) => setS({ ...s, close: e.target.value })} /></label>
            {err && <p className="err span">{err}</p>}
            <div className="span"><button className="btn sm">+ Add Schedule</button></div>
          </form>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Ride</th><th>Days</th><th>Timing</th><th></th></tr></thead>
              <tbody>
                {schedules.map((x) => (
                  <tr key={x.id}>
                    <td>{rname(x.rideId)}</td><td>{x.days}</td><td>{x.open} – {x.close}</td>
                    <td><button className="btn sm red" onClick={() => delS(x.id)}><FaTrash /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance */}
        <div className="card">
          <h3 className="h">Maintenance Records</h3>
          <form className="fgrid" onSubmit={addM}>
            <label>Ride
              <select required value={m.rideId} onChange={(e) => setM({ ...m, rideId: e.target.value })}>
                <option value="">Select ride</option>
                {rides.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label>Date<input type="date" required value={m.date} onChange={(e) => setM({ ...m, date: e.target.value })} /></label>
            <label>Status
              <select value={m.status} onChange={(e) => setM({ ...m, status: e.target.value })}>{MSTAT.map((x) => <option key={x}>{x}</option>)}</select>
            </label>
            <label className="span">Description<input required value={m.desc} onChange={(e) => setM({ ...m, desc: e.target.value })} /></label>
            <div className="span"><button className="btn sm">+ Add Record</button></div>
          </form>
          <p className="small mut mb">"In Progress" sets the ride to Under Maintenance. "Completed" opens it again.</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Ride</th><th>Work</th><th>Status</th></tr></thead>
              <tbody>
                {maint.map((x) => (
                  <tr key={x.id}>
                    <td>{x.date}</td><td>{rname(x.rideId)}</td><td className="small">{x.desc}</td>
                    <td>
                      <select className="mini" value={x.status} onChange={(e) => setMS(x, e.target.value)}>
                        {MSTAT.map((st) => <option key={st}>{st}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}