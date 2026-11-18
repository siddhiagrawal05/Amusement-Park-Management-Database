import { useState } from 'react';
import { FaTrash, FaEdit, FaPlus, FaTimes } from 'react-icons/fa';
import { all, upsert, remove } from '../api';
import Img from '../components/Img';

async function run(fn, setErr, done) {
  try {
    await fn();
    setErr('');
    done();
  } catch (x) {
    setErr(x.message);
  }
}

const sure = (msg) => window.confirm(msg);
const blankShow = { name: '', place: '', duration: 30, days: 'Daily', status: 'Running', img: '', desc: '', firstTime: '' };

export default function ShowsAdmin() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const [form, setForm] = useState(blankShow);
  const [newTime, setNewTime] = useState({});
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const times = all('showTimes');
  const shows = all('plazaShows');
  const timesOf = (id) => times.filter((t) => t.showId === id);

  const save = (e) => {
    e.preventDefault();
    const { firstTime, ...show } = form;
    run(async () => {
      const saved = await upsert('plazaShows', { ...show, duration: +show.duration });
      if (!form.id && firstTime) await upsert('showTimes', { showId: saved.id, time: firstTime });
    }, setErr, () => { setForm(blankShow); re(); });
  };

  const addTime = (show) => {
    const t = newTime[show.id];
    if (!t) return setErr('Pick a time first.');
    if (timesOf(show.id).some((x) => x.time === t)) return setErr(`${show.name} already has a show at ${t}.`);
    run(() => upsert('showTimes', { showId: show.id, time: t }), setErr, () => { setNewTime({ ...newTime, [show.id]: '' }); re(); });
  };

  const delTime = (t) => run(() => remove('showTimes', t.id), setErr, re);
  const setStatus = (s, status) => run(() => upsert('plazaShows', { id: s.id, status }), setErr, re);
  const del = (s) => sure(`Delete "${s.name}" and all its timings?`) && run(() => remove('plazaShows', s.id), setErr, re);

  return (
    <>
      <h3 className="h">Live Shows</h3>
      <p className="mut small mb">Changes show on the website's Shows page straight away. Set a show to Cancelled to hide it for today.</p>
      <form className="card fgrid mb" onSubmit={save}>
        <h4 className="span">{form.id ? `Update: ${form.name}` : 'Add New Show'}</h4>
        <label>Show Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Place<input required value={form.place} onChange={set('place')} placeholder="e.g. Plaza bandstand" /></label>
        <label>Duration (minutes)<input type="number" min="5" max="240" required value={form.duration} onChange={set('duration')} /></label>
        <label>Days
          <select value={form.days} onChange={set('days')}><option>Daily</option><option>Weekends</option></select>
        </label>
        <label>Status
          <select value={form.status} onChange={set('status')}><option>Running</option><option>Cancelled</option></select>
        </label>
        {!form.id && <label>First Start Time<input type="time" value={form.firstTime} onChange={set('firstTime')} /></label>}
        <label className="span">Photo Link (URL)<input value={form.img} onChange={set('img')} placeholder="https://images.unsplash.com/..." /></label>
        <label className="span">Description<input value={form.desc} onChange={set('desc')} /></label>
        {err && <p className="err span">{err}</p>}
        <div className="span row">
          <button className="btn">{form.id ? 'Update' : 'Add'} Show</button>
          {form.id && <button type="button" className="btn o dark" onClick={() => setForm(blankShow)}>Cancel</button>}
        </div>
      </form>

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Show</th><th>Place</th><th>Length</th><th>Days</th><th>Status</th><th>Start Times</th><th></th></tr></thead>
          <tbody>
            {shows.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="row nowrap">
                    <Img src={s.img} alt={s.name} className="thumb" />
                    <b>{s.name}</b>
                  </div>
                </td>
                <td className="small">{s.place}</td>
                <td>{s.duration} min</td>
                <td>{s.days}</td>
                <td>
                  <select className="mini" value={s.status} onChange={(e) => setStatus(s, e.target.value)}>
                    <option>Running</option><option>Cancelled</option>
                  </select>
                </td>
                <td>
                  <div className="tchips">
                    {timesOf(s.id).map((t) => (
                      <span key={t.id} className="tchip">
                        {t.time}
                        <button type="button" title="Remove time" onClick={() => delTime(t)}><FaTimes /></button>
                      </span>
                    ))}
                  </div>
                  <div className="tadd" style={{ marginTop: 6 }}>
                    <input type="time" value={newTime[s.id] || ''} onChange={(e) => setNewTime({ ...newTime, [s.id]: e.target.value })} />
                    <button type="button" className="btn sm" onClick={() => addTime(s)}><FaPlus /></button>
                  </div>
                </td>
                <td>
                  <div className="row nowrap">
                    <button className="btn sm" title="Edit" onClick={() => setForm({ ...blankShow, ...s })}><FaEdit /></button>
                    <button className="btn sm red" title="Delete" onClick={() => del(s)}><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}