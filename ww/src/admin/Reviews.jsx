import { useState } from 'react';
import { FaStar, FaTrash } from 'react-icons/fa';
import { all, remove } from '../api';

const Stars = ({ n }) => (
  <span className="stars">{[1, 2, 3, 4, 5].map((i) => <FaStar key={i} className={i <= n ? 'on' : ''} />)}</span>
);

export default function Reviews() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const [ride, setRide] = useState('');
  const [stars, setStars] = useState(0);

  const reviews = all('reviews');
  const rides = all('rides');
  const rname = (id) => rides.find((r) => r.id === id)?.name || '—';
  const avg = (list) => (list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : '–');

  const perRide = rides
    .map((r) => {
      const list = reviews.filter((v) => v.rideId === r.id);
      return { ...r, count: list.length, avg: avg(list) };
    })
    .filter((r) => r.count)
    .sort((a, b) => b.avg - a.avg || b.count - a.count);

  const list = reviews.filter((v) => (!ride || v.rideId === +ride) && (!stars || v.rating === stars));

  const del = async (v) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await remove('reviews', v.id);
      re();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <>
      <h3 className="h">Ride Reviews</h3>

      <div className="mini-stats mb">
        <div><small>Reviews</small><b>{reviews.length}</b></div>
        <div><small>Average rating</small><b>{avg(reviews)} ★</b></div>
        {[5, 4, 3, 2, 1].map((n) => (
          <div key={n}><small>{n} star</small><b>{reviews.filter((r) => r.rating === n).length}</b></div>
        ))}
      </div>

      <div className="two">
        <div className="card tbl-wrap">
          <h3 className="h">Ratings by Ride</h3>
          <table className="tbl">
            <thead><tr><th>Ride</th><th>Rating</th><th>Reviews</th></tr></thead>
            <tbody>
              {perRide.map((r) => (
                <tr key={r.id} className={+ride === r.id ? 'sel' : ''} onClick={() => setRide(+ride === r.id ? '' : String(r.id))} style={{ cursor: 'pointer' }}>
                  <td><b>{r.name}</b><div className="small mut">{r.category}</div></td>
                  <td className="nowrap"><Stars n={Math.round(r.avg)} /> {r.avg}</td>
                  <td>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="toolbar" style={{ marginBottom: 14 }}>
            <select className="mini" style={{ margin: 0 }} value={ride} onChange={(e) => setRide(e.target.value)}>
              <option value="">All rides</option>
              {rides.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {[0, 5, 4, 3, 2, 1].map((n) => (
              <button key={n} className={`chip ${stars === n ? 'on' : ''}`} style={{ padding: '6px 12px' }} onClick={() => setStars(n)}>{n ? `${n}★` : 'All'}</button>
            ))}
          </div>
          <div className="reviews">
            {list.map((v) => (
              <div className="review" key={v.id}>
                <div className="row between nowrap">
                  <b>{v.userName}</b>
                  <button className="btn sm red" title="Delete" onClick={() => del(v)}><FaTrash /></button>
                </div>
                <div className="small mut"><Stars n={v.rating} /> · {rname(v.rideId)} · {v.createdAt}</div>
                {v.comment && <p className="small">{v.comment}</p>}
              </div>
            ))}
            {!list.length && <p className="mut small">No reviews match.</p>}
          </div>
        </div>
      </div>
    </>
  );
}