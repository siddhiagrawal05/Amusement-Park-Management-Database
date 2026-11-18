import { useState } from 'react';
import { FaSyncAlt } from 'react-icons/fa';
import { all, upsert, loadData } from '../api';
import Badge from '../components/Badge';

const STATUSES = ['Open', 'In Progress', 'Resolved'];

export default function Support() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const [filter, setFilter] = useState('All');
  const [busy, setBusy] = useState(false);

  const everything = all('supportRequests');
  const list = everything.filter((r) => filter === 'All' || r.status === filter);

  const setStatus = async (r, status) => {
    try {
      await upsert('supportRequests', { id: r.id, status });
      re();
    } catch (e) {
      alert(e.message);
    }
  };

  const reload = async () => {
    setBusy(true);
    await loadData();
    setBusy(false);
    re();
  };

  return (
    <>
      <div className="row between">
        <h3 className="h">Help Requests (Call Backs)</h3>
        <button className="btn sm" onClick={reload} disabled={busy}><FaSyncAlt /> {busy ? 'Loading...' : 'Refresh'}</button>
      </div>

      <div className="mini-stats mb">
        <div><small>Total</small><b>{everything.length}</b></div>
        {STATUSES.map((s) => (
          <div key={s}><small>{s}</small><b>{everything.filter((r) => r.status === s).length}</b></div>
        ))}
      </div>

      <div className="toolbar">
        {['All', ...STATUSES].map((s) => (
          <button key={s} className={`chip ${filter === s ? 'on' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>#</th><th>Received</th><th>Name</th><th>Phone</th><th>Topic</th><th>Issue</th><th>Call Time</th><th>Status</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td><b>{r.id}</b></td>
                <td className="small">{r.createdAt}</td>
                <td>{r.name}<br /><span className="small mut">{r.email || (r.userId ? 'Registered visitor' : 'Guest')}</span></td>
                <td><a href={`tel:+91${r.phone}`}>{r.phone}</a></td>
                <td>{r.topic}</td>
                <td className="small" style={{ maxWidth: 260 }}>{r.message || '—'}</td>
                <td className="small">{r.preferredTime}</td>
                <td className="nowrap">
                  <Badge s={r.status} />
                  <select className="mini" value={r.status} onChange={(e) => setStatus(r, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan="8" className="mut">No help requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}