import { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaTrash } from 'react-icons/fa';
import { all, upsert, remove, today, addDays } from '../api';

const ATTEND = ['Scheduled', 'Present', 'Absent', 'Leave'];
const hours = (s) => {
  const [a, b] = [s.start, s.end].map((t) => t.split(':').map(Number));
  return ((b[0] * 60 + b[1] - a[0] * 60 - a[1]) / 60).toFixed(1);
};

export default function Shifts() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const [date, setDate] = useState(today());
  const [form, setForm] = useState({ employeeId: '', rideId: '', start: '10:00', end: '18:00' });
  const [err, setErr] = useState('');

  const employees = all('employees');
  const rides = all('rides');
  const ename = (id) => employees.find((e) => e.id === id) || {};
  const rname = (id) => rides.find((r) => r.id === id)?.name || '—';
  const list = all('shifts').filter((s) => s.date === date).sort((a, b) => a.start.localeCompare(b.start));
  const count = (a) => list.filter((s) => s.attendance === a).length;
  const off = employees.filter((e) => !list.some((s) => s.employeeId === e.id));

  const pickEmployee = (id) => {
    const e = ename(+id);
    setForm({ ...form, employeeId: id, rideId: e.rideId ?? '' });
  };

  const add = async (e) => {
    e.preventDefault();
    if (form.end <= form.start) return setErr('End time must be after start time.');
    try {
      await upsert('shifts', { ...form, employeeId: +form.employeeId, rideId: form.rideId ? +form.rideId : '', date });
      setErr('');
      setForm({ ...form, employeeId: '', rideId: '' });
      re();
    } catch (x) {
      setErr(x.message);
    }
  };

  const mark = async (s, attendance) => {
    try {
      await upsert('shifts', { id: s.id, attendance });
      re();
    } catch (x) {
      alert(x.message);
    }
  };

  const del = async (s) => {
    if (!window.confirm('Delete this shift?')) return;
    await remove('shifts', s.id);
    re();
  };

  return (
    <>
      <h3 className="h">Staff Shifts & Attendance</h3>

      <div className="row mb">
        <button className="btn sm o dark" onClick={() => setDate(addDays(date, -1))}><FaChevronLeft /></button>
        <input type="date" className="mini" style={{ margin: 0 }} value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn sm o dark" onClick={() => setDate(addDays(date, 1))}><FaChevronRight /></button>
        {date !== today() && <button className="btn sm" onClick={() => setDate(today())}>Today</button>}
      </div>

      <div className="mini-stats mb">
        <div><small>Shifts</small><b>{list.length}</b></div>
        {ATTEND.map((a) => <div key={a}><small>{a}</small><b>{count(a)}</b></div>)}
        <div><small>Not on shift</small><b>{off.length}</b></div>
      </div>

      <form className="card fgrid mb" onSubmit={add}>
        <h4 className="span">Add Shift on {date}</h4>
        <label>Employee
          <select required value={form.employeeId} onChange={(e) => pickEmployee(e.target.value)}>
            <option value="">Select employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
          </select>
        </label>
        <label>Ride
          <select value={form.rideId} onChange={(e) => setForm({ ...form, rideId: e.target.value })}>
            <option value="">No ride</option>
            {rides.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label>Start<input type="time" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
        <label>End<input type="time" required value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
        {err && <p className="err span">{err}</p>}
        <div className="span"><button className="btn">+ Add Shift</button></div>
      </form>

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Employee</th><th>Ride</th><th>Time</th><th>Hours</th><th>Attendance</th><th></th></tr></thead>
          <tbody>
            {list.map((s) => {
              const e = ename(s.employeeId);
              return (
                <tr key={s.id}>
                  <td><b>{e.name}</b><div className="small mut">{e.role}</div></td>
                  <td>{rname(s.rideId)}</td>
                  <td className="nowrap">{s.start} – {s.end}</td>
                  <td>{hours(s)}</td>
                  <td>
                    <div className="seg">
                      {ATTEND.map((a) => (
                        <button key={a} type="button" className={`${s.attendance === a ? 'on' : ''} ${a.toLowerCase()}`} onClick={() => mark(s, a)}>{a}</button>
                      ))}
                    </div>
                  </td>
                  <td><button className="btn sm red" title="Delete" onClick={() => del(s)}><FaTrash /></button></td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan="6" className="mut small">No shifts on this day.</td></tr>}
          </tbody>
        </table>
      </div>
      {off.length > 0 && <p className="small mut gap-top">Not on shift: {off.map((e) => e.name).join(', ')}</p>}
    </>
  );
}