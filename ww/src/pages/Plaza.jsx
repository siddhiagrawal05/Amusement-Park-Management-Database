import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaLeaf, FaTint, FaUtensils, FaShoppingBag, FaStar, FaMapMarkedAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { all, inr } from '../api';
import Banner from '../components/Banner';
import Img from '../components/Img';

const BANNER = 'https://images.unsplash.com/photo-1758448500813-59f3770da00d?auto=format&fit=crop&w=1920&q=80';
const SHOW_FIRST = 6;
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmt12 = (t) => {
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};
const isOpen = (place, mins) => toMin(place.open) <= mins && mins < toMin(place.close);
function VegMark({ veg }) {
  const c = veg ? '#16a34a' : '#b91c1c';
  return (
    <span title={veg ? 'Veg' : 'Non-veg'} style={{ width: 14, height: 14, border: `2px solid ${c}`, borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
    </span>
  );
}

export default function Plaza() {
  const [now, setNow] = useState(new Date());
  const [vegOnly, setVegOnly] = useState(false);
  const [openMenus, setOpenMenus] = useState([]);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const mins = now.getHours() * 60 + now.getMinutes();
  const restaurants = all('restaurants');
  const menu = all('menuItems');
  const shops = all('shops');
  const toggleMenu = (id) => setOpenMenus(openMenus.includes(id) ? openMenus.filter((x) => x !== id) : [...openMenus, id]);

  return (
    <>
      <Banner img={BANNER} title="Central Plaza" sub="Food and shopping at the heart of the park" />
      <section className="sec cream" style={{ paddingBottom: 40 }}>
        <div className="grid4">
          <div className="card info"><FaClock /><h3>Open Daily</h3><p className="mut small">10:00 AM – 8:00 PM</p></div>
          <div className="card info"><FaMapMarkerAlt /><h3>Location</h3><p className="mut small">Centre of the park, 2 minutes from the Main Gate</p></div>
          <div className="card info"><FaLeaf /><h3>Veg & Jain</h3><p className="mut small">Pure veg and Jain options at every restaurant</p></div>
          <div className="card info"><FaTint /><h3>Free Water</h3><p className="mut small">Drinking water stations all around the plaza</p></div>
        </div>
      </section>
      <section className="sec">
        <div className="head">
          <h2><FaUtensils /> Food <span className="hl">Court</span></h2>
          <p className="mut">{restaurants.length} restaurants · {menu.length} dishes</p>
        </div>

        <div className="toolbar" style={{ justifyContent: 'center' }}>
          <button className={`chip ${!vegOnly ? 'on' : ''}`} onClick={() => setVegOnly(false)}>All Items</button>
          <button className={`chip ${vegOnly ? 'on' : ''}`} onClick={() => setVegOnly(true)}>Veg Only</button>
        </div>

        <div className="grid3">
          {restaurants.map((r) => {
            const items = menu.filter((m) => m.restaurantId === r.id && (!vegOnly || m.veg));
            const full = openMenus.includes(r.id);
            const shown = full ? items : items.slice(0, SHOW_FIRST);
            return (
              <div className="ride" key={r.id}>
                <div className="pic">
                  <Img src={r.img} alt={r.name} />
                  <span className={`badge ${isOpen(r, mins) ? 'b-ok' : 'b-bad'}`}>
                    {isOpen(r, mins) ? 'Open now' : 'Closed now'}
                  </span>
                  <span className="cat-chip"><FaStar /> {r.rating}</span>
                </div>
                <div className="body">
                  <h3>{r.name}</h3>
                  <p className="small mut">{r.cuisine}</p>
                  <p className="small" style={{ margin: '6px 0 10px' }}><FaClock /> {fmt12(r.open)} – {fmt12(r.close)}</p>
                  {items.length === 0 && <p className="small mut">No items to show.</p>}
                  {shown.map((m) => (
                    <div key={m.id} className="row between nowrap" style={{ padding: '7px 0', borderBottom: '1px dashed #EDE5D3' }}>
                      <span className="row nowrap" style={{ gap: 8 }}><VegMark veg={m.veg} /> {m.name}</span>
                      <b>{inr(m.price)}</b>
                    </div>
                  ))}
                  {items.length > SHOW_FIRST && (
                    <button className="more" onClick={() => toggleMenu(r.id)}>
                      {full ? <>Show less <FaChevronUp /></> : <>See full menu ({items.length} items) <FaChevronDown /></>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="sec cream">
        <div className="head">
          <h2><FaShoppingBag /> Plaza <span className="hl">Shops</span></h2>
        </div>
        <div className="grid3">
          {shops.map((s) => (
            <div className="ride" key={s.id}>
              <div className="pic">
                <Img src={s.img} alt={s.name} />
                <span className={`badge ${isOpen(s, mins) ? 'b-ok' : 'b-bad'}`}>
                  {isOpen(s, mins) ? 'Open now' : 'Closed now'}
                </span>
              </div>
              <div className="body">
                <h3>{s.name}</h3>
                <p className="mut small">{s.desc}</p>
                <div className="sched" style={{ marginTop: 10 }}>
                  {s.priceRange && <span><FaShoppingBag /> {s.priceRange}</span>}
                  <span><FaClock /> {fmt12(s.open)} – {fmt12(s.close)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="cta">
        <h2>Find The Plaza</h2>
        <p>The Central Plaza is right in the middle of the park, between all four zones.</p>
        <Link to="/map" className="btn y gap-top"><FaMapMarkedAlt /> Open Park Map</Link>
      </div>
    </>
  );
}