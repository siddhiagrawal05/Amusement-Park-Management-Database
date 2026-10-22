import { useState } from 'react';
import { all, upsert } from '../api';
import Badge from '../components/Badge';
import Img from '../components/Img';

const STATUSES = ['Open', 'Closed', 'Under Maintenance'];
const CATS = ['Thrill', 'Family', 'Kids', 'Water'];
const blank = { name: '', category: 'Thrill', img: '', status: 'Open', capacity: 20, minHeight: 0, minAge: 0, duration: 3, rules: '', desc: '' };

export default function ARides() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const [form, setForm] = useState(null);
  const rides = all('rides');
  const logs = all('rideLogs');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    upsert('rides', {
      ...form,
      capacity: +form.capacity, minHeight: +form.minHeight, minAge: +form.minAge, duration: +form.duration,
    });
    setForm(null);
    re();
  };

  const changeStatus = (r, s) => { upsert('rides', { id: r.id, status: s }); re(); };

  return (
    <>
      <div className="row between">
        <h3 className="h">Ride Management</h3>
        <button className="btn" onClick={() => setForm(blank)}>+ Add Ride</button>
      </div>

      {form && (
        <form className="card fgrid mb" onSubmit={save}>
          <h4 className="span">{form.id ? 'Edit Ride' : 'Add New Ride'}</h4>
          <label>Name<input required value={form.name} onChange={set('name')} /></label>
          <label>Category<select value={form.category} onChange={set('category')}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Status<select value={form.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label>Capacity (seats)<input type="number" min="1" required value={form.capacity} onChange={set('capacity')} /></label>
          <label>Min Height (cm)<input type="number" min="0" value={form.minHeight} onChange={set('minHeight')} /></label>
          <label>Min Age (years)<input type="number" min="0" value={form.minAge} onChange={set('minAge')} /></label>
          <label>Duration (minutes)<input type="number" min="1" value={form.duration} onChange={set('duration')} /></label>
          <label className="span">Photo URL (paste any image link)
            <input value={form.img} onChange={set('img')} placeholder="https://images.unsplash.com/..." />
          </label>
          {form.img && <div className="span prev"><Img src={form.img} alt="Preview" /></div>}
          <label className="span">Restrictions / Rules<input value={form.rules} onChange={set('rules')} /></label>
          <label className="span">Description<textarea rows="2" value={form.desc} onChange={set('desc')} /></label>
          <div className="span row">
            <button className="btn">Save Ride</button>
            <button type="button" className="btn o dark" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Ride</th><th>Category</th><th>Capacity</th><th>Restrictions</th><th>Times Ridden</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {rides.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="row nowrap">
                    <Img src={r.img} alt={r.name} className="thumb" />
                    <b>{r.name}</b>
                  </div>
                </td>
                <td>{r.category}</td>
                <td>{r.capacity}</td>
                <td className="small">
                  {r.minHeight ? `${r.minHeight} cm+` : 'Any height'}, {r.minAge ? `${r.minAge} yrs+` : 'All ages'}
                  <br /><span className="mut">{r.rules}</span>
                </td>
                <td>{logs.filter((l) => l.rideId === r.id).length}</td>
                <td className="nowrap">
                  <Badge s={r.status} />
                  <select className="mini" value={r.status} onChange={(e) => changeStatus(r, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td><button className="btn sm" onClick={() => setForm(r)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}