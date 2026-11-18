import { useState } from 'react';
import { FaSyncAlt, FaTrash, FaSave } from 'react-icons/fa';
import { all, upsert, remove, loadData } from '../api';
import Badge from '../components/Badge';

const STATUSES = ['Reported', 'Found', 'Returned', 'Closed'];

export default function LostFound() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const [filter, setFilter] = useState('Open');
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(false);

  const items = all('lostItems');
  const list = items.filter((i) => filter === 'All' || (filter === 'Open' ? ['Reported', 'Found'].includes(i.status) : i.status === filter));

  const save = async (i, data) => {
    try {
      await upsert('lostItems', { id: i.id, ...data });
      re();
    } catch (e) {
      alert(e.message);
    }
  };

  const del = async (i) => {
    if (!window.confirm(`Delete report for "${i.item}"?`)) return;
    await remove('lostItems', i.id);
    re();
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
        <h3 className="h">Lost & Found</h3>
        <button className="btn sm" onClick={reload} disabled={busy}><FaSyncAlt /> {busy ? 'Loading...' : 'Refresh'}</button>
      </div>

      <div className="mini-stats mb">
        <div><small>Total reports</small><b>{items.length}</b></div>
        {STATUSES.map((s) => <div key={s}><small>{s}</small><b>{items.filter((i) => i.status === s).length}</b></div>)}
      </div>

      <div className="toolbar">
        {['Open', 'All', ...STATUSES].map((s) => (
          <button key={s} className={`chip ${filter === s ? 'on' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Item</th><th>Lost</th><th>Reported By</th><th>Status</th><th>Note for visitor</th><th></th></tr></thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td><b>{i.item}</b><div className="small mut">{i.desc}</div></td>
                <td className="small">{i.lostDate}<br />{i.location}</td>
                <td className="small">{i.name}<br /><a href={`tel:${i.phone}`}>{i.phone}</a></td>
                <td>
                  <Badge s={i.status} />
                  <select className="mini" style={{ display: 'block', margin: '6px 0 0' }} value={i.status} onChange={(e) => save(i, { status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <div className="row nowrap">
                    <input className="mini" style={{ margin: 0, minWidth: 180 }} placeholder="e.g. Kept at Guest Services" value={notes[i.id] ?? i.adminNote ?? ''} onChange={(e) => setNotes({ ...notes, [i.id]: e.target.value })} />
                    <button className="btn sm" title="Save note" onClick={() => save(i, { adminNote: notes[i.id] ?? i.adminNote ?? '' })}><FaSave /></button>
                  </div>
                </td>
                <td><button className="btn sm red" title="Delete" onClick={() => del(i)}><FaTrash /></button></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan="6" className="mut small">Nothing here.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}