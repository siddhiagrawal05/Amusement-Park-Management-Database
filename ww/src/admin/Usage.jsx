import { useState } from 'react';
import { all, upsert, today } from '../api';

export default function Usage() {
  const [, refresh] = useState(0);
  const visitors = all('users').filter((u) => u.role === 'visitor');
  const rides = all('rides');
  const [f, setF] = useState({ userId: '', rideId: '', date: today() });
  const [filter, setFilter] = useState('');

  const allLogs = all('rideLogs').filter((l) => !filter || l.rideId === +filter);
  const logs = [...allLogs].sort((a, b) => b.id - a.id).slice(0, 50);
  const vname = (id) => visitors.find((u) => u.id === id)?.name || '-';
  const rname = (id) => rides.find((r) => r.id === id)?.name || '-';

  const add = (e) => {
    e.preventDefault();
    upsert('rideLogs', { userId: +f.userId, rideId: +f.rideId, date: f.date });
    setF({ ...f, rideId: '' });
    refresh((x) => x + 1);
  };

  return (
    <>
      <h3 className="h">📋 Ride Usage (Which visitor used which ride)</h3>

      <form className="card fgrid mb" onSubmit={add}>
        <label>Visitor
          <select required value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })}>
            <option value="">Select visitor</option>
            {visitors.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.email})</option>)}
          </select>
        </label>
        <label>Ride (open rides only)
          <select required value={f.rideId} onChange={(e) => setF({ ...f, rideId: e.target.value })}>
            <option value="">Select ride</option>
            {rides.filter((r) => r.status === 'Open').map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label>Date<input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        <div className="span"><button className="btn sm">+ Record Ride</button></div>
      </form>

      <div className="card tbl-wrap">
        <div className="row between mb">
          <b>{allLogs.length} records (showing latest 50)</b>
          <select className="mini" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All rides</option>
            {rides.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Visitor</th><th>Ride</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}><td>{l.date}</td><td>{vname(l.userId)}</td><td>{rname(l.rideId)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}