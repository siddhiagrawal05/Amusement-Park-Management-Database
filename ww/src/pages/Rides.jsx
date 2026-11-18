import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaUsers, FaRulerVertical, FaChild, FaClock, FaSearch, FaExclamationTriangle, FaCalendarAlt, FaStar, FaTimes, FaTrash } from 'react-icons/fa';
import { all, logRide, saveReview, deleteMyReview, PICS } from '../api';
import { useAuth } from '../auth';
import Badge from '../components/Badge';
import Img from '../components/Img';
import Banner from '../components/Banner';

const avgOf = (list) => (list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0);

function Stars({ n }) {
  return <span className="rstars">{[1, 2, 3, 4, 5].map((i) => <FaStar key={i} className={i <= Math.round(n) ? 'on' : ''} />)}</span>;
}

function ReviewBox({ ride, onClose }) {
  const { user } = useAuth();
  const [, refresh] = useState(0);
  const list = all('reviews').filter((r) => r.rideId === ride.id).sort((a, b) => b.mine - a.mine);
  const mine = list.find((r) => r.mine);
  const [rating, setRating] = useState(mine?.rating || 0);
  const [comment, setComment] = useState(mine?.comment || '');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const avg = avgOf(list);

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!rating) return setErr('Please choose 1 to 5 stars.');
    setBusy(true);
    try {
      await saveReview(ride.id, rating, comment);
      setMsg(mine ? 'Your review has been updated.' : 'Thanks! Your review has been posted.');
      refresh((x) => x + 1);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };

  const del = async () => {
    if (!window.confirm('Delete your review?')) return;
    await deleteMyReview(mine.id);
    setRating(0);
    setComment('');
    setMsg('Your review has been deleted.');
    refresh((x) => x + 1);
  };

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="x" onClick={onClose} aria-label="Close"><FaTimes /></button>
        <h3>{ride.name}</h3>
        <p className="small mut">{ride.category} ride · Guest reviews</p>

        <div className="rv-sum">
          <div className="rv-big">
            <b>{list.length ? avg.toFixed(1) : '–'}</b>
            <Stars n={avg} />
            <div className="small mut">{list.length} review{list.length === 1 ? '' : 's'}</div>
          </div>
          <div className="rv-dist">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = list.filter((r) => r.rating === n).length;
              return (
                <div key={n}>
                  <span>{n}★</span>
                  <span><i style={{ width: `${list.length ? (c * 100) / list.length : 0}%` }} /></span>
                  <span>{c}</span>
                </div>
              );
            })}
          </div>
        </div>

        {user?.role === 'visitor' ? (
          <form className="rv-form" onSubmit={save}>
            <b>{mine ? 'Your review' : 'Write a review'}</b>
            <div className="rstars pick" style={{ margin: '8px 0' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button type="button" key={i} className={i <= rating ? 'on' : ''} onClick={() => setRating(i)} aria-label={`${i} stars`}><FaStar /></button>
              ))}
            </div>
            <textarea maxLength="300" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the ride? (optional)" />
            {err && <p className="err">{err}</p>}
            {msg && <p className="small save" style={{ fontWeight: 700 }}>{msg}</p>}
            <div className="row">
              <button className="btn sm" disabled={busy}>{busy ? 'Saving...' : mine ? 'Update Review' : 'Post Review'}</button>
              {mine && <button type="button" className="btn sm red" onClick={del}><FaTrash /> Delete</button>}
            </div>
            <p className="small mut gap-top">You can review a ride after you have been on it. Tap "I rode this!" on the ride card first.</p>
          </form>
        ) : (
          !user && <p className="rv-form small"><Link to="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>Log in</Link> to write a review.</p>
        )}

        <div className="rv-list">
          {list.map((r) => (
            <div key={r.id} className={`rv-item ${r.mine ? 'mine' : ''}`}>
              <div className="row between nowrap">
                <b>{r.userName}{r.mine && <span className="you">You</span>}</b>
                <span className="small mut">{r.createdAt}</span>
              </div>
              <Stars n={r.rating} />
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
          {!list.length && <p className="mut small">No reviews yet. Be the first!</p>}
        </div>
      </div>
    </div>
  );
}

export default function Rides() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || 'All';
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(null);
  const { user } = useAuth();

  const scheds = all('schedules');
  const reviews = all('reviews');
  const stats = (id) => {
    const list = reviews.filter((r) => r.rideId === id);
    return { count: list.length, avg: avgOf(list) };
  };
  const rides = all('rides')
    .filter((r) => (cat === 'All' || r.category === cat) && r.name.toLowerCase().includes(q.toLowerCase()))
    .map((r) => ({ ...r, ...stats(r.id) }))
    .sort((a, b) => (sort === 'rating' ? b.avg - a.avg || b.count - a.count : sort === 'reviews' ? b.count - a.count : 0));

  const rode = async (r) => {
    try {
      await logRide(r.id);
      setMsg(`Enjoy ${r.name}! Your ride has been recorded. You can now review it.`);
    } catch (e) {
      setMsg(e.message);
    }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <>
      <Banner img={PICS.bRides} title="Rides & Attractions" sub="Thrills for daredevils, smiles for little ones" />

      <section className="sec">
        <div className="toolbar">
          {['All', 'Thrill', 'Family', 'Kids', 'Water'].map((c) => (
            <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setParams(c === 'All' ? {} : { cat: c })}>
              {c}
            </button>
          ))}
          <select className="mini" style={{ margin: 0, width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">Sort: Default</option>
            <option value="rating">Sort: Top rated</option>
            <option value="reviews">Sort: Most reviewed</option>
          </select>
          <div className="search">
            <FaSearch />
            <input placeholder="Search rides..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {msg && <div className="ok-msg">{msg}</div>}

        <div className="grid3">
          {rides.map((r) => (
            <div className="ride" key={r.id}>
              <div className="pic">
                <Img src={r.img} alt={r.name} />
                <Badge s={r.status} />
                <span className="cat-chip">{r.category}</span>
              </div>
              <div className="body">
                <h3>{r.name}</h3>
                <button className="rate-line" onClick={() => setOpen(r)}>
                  <Stars n={r.avg} />
                  {r.count ? <>{r.avg.toFixed(1)} <u>({r.count} review{r.count > 1 ? 's' : ''})</u></> : <u>No reviews yet</u>}
                </button>
                <p className="mut small">{r.desc}</p>
                <div className="facts">
                  <span><FaUsers /> {r.capacity} seats</span>
                  <span><FaRulerVertical /> {r.minHeight ? `${r.minHeight}+ cm` : 'Any height'}</span>
                  <span><FaChild /> {r.minAge ? `${r.minAge}+ yrs` : 'All ages'}</span>
                  <span><FaClock /> {r.duration} min</span>
                </div>
                {r.rules && <p className="rule"><FaExclamationTriangle /> {r.rules}</p>}
                <div className="sched">
                  {scheds.filter((s) => s.rideId === r.id).map((s) => (
                    <span key={s.id}><FaCalendarAlt /> {s.days}: {s.open} – {s.close}</span>
                  ))}
                </div>
                {user?.role === 'visitor' && (
                  <div className="row nowrap" style={{ marginTop: 'auto' }}>
                    <button className="btn sm" style={{ flex: 1, marginTop: 0 }} disabled={r.status !== 'Open'} onClick={() => rode(r)}>
                      {r.status === 'Open' ? 'I rode this!' : 'Not available now'}
                    </button>
                    <button className="btn sm o dark" style={{ marginTop: 0 }} onClick={() => setOpen(r)}><FaStar /> Review</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!rides.length && <p>No rides found.</p>}
        </div>
      </section>

      {open && <ReviewBox key={open.id} ride={open} onClose={() => setOpen(null)} />}
    </>
  );
}