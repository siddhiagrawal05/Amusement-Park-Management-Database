import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaUsers, FaRulerVertical, FaChild, FaClock, FaSearch, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import { all, logRide, PICS } from '../api';
import { useAuth } from '../auth';
import Badge from '../components/Badge';
import Img from '../components/Img';
import Banner from '../components/Banner';

export default function Rides() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || 'All';
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const { user } = useAuth();

  const scheds = all('schedules');
  const rides = all('rides').filter(
    (r) => (cat === 'All' || r.category === cat) && r.name.toLowerCase().includes(q.toLowerCase())
  );

  const rode = (r) => {
    logRide(user.id, r.id);
    setMsg(`Enjoy ${r.name}! Your ride has been recorded.`);
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
                  <button className="btn sm full" disabled={r.status !== 'Open'} onClick={() => rode(r)}>
                    {r.status === 'Open' ? 'I rode this!' : 'Not available now'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {!rides.length && <p>No rides found.</p>}
        </div>
      </section>
    </>
  );
}