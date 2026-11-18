import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaLeaf, FaTint, FaUtensils, FaShoppingBag, FaTheaterMasks, FaStar, FaMapMarkedAlt } from 'react-icons/fa';
import { inr } from '../api';
import Banner from '../components/Banner';
import Img from '../components/Img';

const u = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// ---------- Plaza content (edit here) ----------
const SHOWS = [
  {
    name: 'Grand WonderWorld Parade',
    desc: 'Colourful floats, dancers and costumed characters march around the plaza.',
    place: 'Central Plaza main road',
    times: ['13:00', '17:30'],
    duration: 30,
    img: u('1609051589207-264fb1f91000'),
  },
  {
    name: 'Live Band @ Plaza',
    desc: 'Bollywood hits and popular songs played live. Sing and dance along!',
    place: 'Plaza bandstand',
    times: ['12:00', '15:00', '18:30'],
    duration: 45,
    img: u('1623546835805-ba3d0f9fb7c5'),
  },
  {
    name: 'Carnival Street Performers',
    desc: 'Jugglers, stilt walkers and magicians perform right next to you.',
    place: 'Around the food court',
    times: ['11:30', '14:30', '16:30'],
    duration: 20,
    img: u('1784891743588-51e8ac5e8380'),
  },
  {
    name: 'Night Lights Finale',
    desc: 'The whole park lights up with music and colourful lights to end your day.',
    place: 'Central Plaza (best view near Sky Wheel)',
    times: ['19:30'],
    duration: 15,
    weekendOnly: true,
    img: u('1688582952217-e8617c8a5109'),
  },
];

const RESTAURANTS = [
  {
    name: 'Royal Thali House',
    tags: ['North Indian', 'Thali', 'Pure Veg'],
    hours: '11:00 AM – 7:00 PM',
    rating: 4.6,
    img: u('1742281257687-092746ad6021'),
    menu: [
      { item: 'Deluxe Veg Thali', price: 349, veg: true },
      { item: 'Jain Thali', price: 329, veg: true },
      { item: 'Paneer Butter Masala with Naan', price: 279, veg: true },
      { item: 'Dal Khichdi', price: 199, veg: true },
      { item: 'Masala Chaas', price: 79, veg: true },
    ],
  },
  {
    name: 'Burger Junction',
    tags: ['Burgers', 'Fries', 'Shakes'],
    hours: '10:30 AM – 8:00 PM',
    rating: 4.4,
    img: u('1561758033-d89a9ad46330'),
    menu: [
      { item: 'Classic Veg Burger', price: 179, veg: true },
      { item: 'Crispy Chicken Burger', price: 229, veg: false },
      { item: 'Peri Peri Fries', price: 129, veg: true },
      { item: 'Cheese Pizza Slice', price: 149, veg: true },
      { item: 'Chocolate Shake', price: 159, veg: true },
    ],
  },
  {
    name: 'Mumbai Street Bites',
    tags: ['Chaat', 'Pav Bhaji', 'Snacks'],
    hours: '10:30 AM – 8:00 PM',
    rating: 4.5,
    img: u('1589778655375-3e622a9fc91c'),
    menu: [
      { item: 'Pav Bhaji', price: 159, veg: true },
      { item: 'Vada Pav', price: 69, veg: true },
      { item: 'Pani Puri', price: 89, veg: true },
      { item: 'Masala Corn Cup', price: 99, veg: true },
      { item: 'Chicken Frankie', price: 169, veg: false },
    ],
  },
  {
    name: 'Scoops & Swirls',
    tags: ['Ice Cream', 'Desserts', 'Cold Drinks'],
    hours: '10:30 AM – 8:00 PM',
    rating: 4.7,
    img: u('1629385697093-57be2cc97fa6'),
    menu: [
      { item: 'Single Scoop Cone', price: 99, veg: true },
      { item: 'Double Scoop Sundae', price: 189, veg: true },
      { item: 'Mango Kulfi', price: 79, veg: true },
      { item: 'Brownie with Ice Cream', price: 199, veg: true },
      { item: 'Cold Coffee', price: 139, veg: true },
    ],
  },
];

const SHOPS = [
  {
    name: 'WonderWorld Souvenirs',
    desc: 'Caps, T-shirts, mugs, keychains and fridge magnets to remember your day.',
    price: '₹99 – ₹1,499',
    hours: '10:00 AM – 8:00 PM',
    img: u('1689527612745-a90ea8805008'),
  },
  {
    name: 'Toy Town',
    desc: 'Soft toys, ride models, water guns and party balloons for kids.',
    price: '₹149 – ₹2,499',
    hours: '10:00 AM – 8:00 PM',
    img: u('1715889868942-b6df178c60b3'),
  },
  {
    name: 'Ride Photo Studio',
    desc: 'Collect your on-ride photos and print them in a souvenir frame.',
    price: '₹199 – ₹699',
    hours: '10:30 AM – 8:00 PM',
    img: u('1759323321196-2813db509285'),
  },
];

// ---------- Helpers ----------
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

// Indian veg / non-veg mark
function VegMark({ veg }) {
  const c = veg ? '#16a34a' : '#b91c1c';
  return (
    <span title={veg ? 'Veg' : 'Non-veg'} style={{ width: 14, height: 14, border: `2px solid ${c}`, borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
    </span>
  );
}

const statusStyle = { position: 'absolute', top: 14, left: 14 };

export default function Plaza() {
  const [now, setNow] = useState(new Date());
  const [vegOnly, setVegOnly] = useState(false);

  // Refresh the live show status every minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const mins = now.getHours() * 60 + now.getMinutes();
  const weekend = [0, 6].includes(now.getDay());

  const showStatus = (s) => {
    if (s.weekendOnly && !weekend) return { label: 'Weekends only', tone: 'b-info' };
    const next = s.times.find((t) => toMin(t) + s.duration > mins); // running now or later today
    if (!next) return { label: 'Done for today', tone: 'b-bad' };
    const start = toMin(next);
    if (start <= mins) return { label: 'On now!', tone: 'b-ok' };
    const diff = start - mins;
    return { label: diff <= 60 ? `Starts in ${diff} min` : `Next at ${fmt12(next)}`, tone: 'b-warn' };
  };

  // The very next show today (across all shows)
  const nextShow = SHOWS
    .filter((s) => !(s.weekendOnly && !weekend))
    .flatMap((s) => s.times.map((t) => ({ s, t })))
    .filter((x) => toMin(x.t) > mins)
    .sort((a, b) => toMin(a.t) - toMin(b.t))[0];

  return (
    <>
      <Banner img={u('1758448500813-59f3770da00d', 1920)} title="Central Plaza" sub="Food, shopping and live shows at the heart of the park" />

      {/* ---------- Quick info ---------- */}
      <section className="sec cream" style={{ paddingBottom: 40 }}>
        <div className="grid4">
          <div className="card info"><FaClock /><h3>Open Daily</h3><p className="mut small">10:00 AM – 8:00 PM</p></div>
          <div className="card info"><FaMapMarkerAlt /><h3>Location</h3><p className="mut small">Centre of the park, 2 minutes from the Main Gate</p></div>
          <div className="card info"><FaLeaf /><h3>Veg & Jain</h3><p className="mut small">Pure veg and Jain options at every restaurant</p></div>
          <div className="card info"><FaTint /><h3>Free Water</h3><p className="mut small">Drinking water stations all around the plaza</p></div>
        </div>
      </section>

      {/* ---------- Live shows ---------- */}
      <section className="sec">
        <div className="head">
          <h2><FaTheaterMasks /> Live <span className="hl">Shows</span></h2>
          <p className="mut">
            {nextShow
              ? <>Next show today: <b>{nextShow.s.name}</b> at <b>{fmt12(nextShow.t)}</b></>
              : 'All shows are over for today. See you tomorrow!'}
          </p>
        </div>

        <div className="grid3">
          {SHOWS.map((s) => {
            const st = showStatus(s);
            return (
              <div className="ride" key={s.name}>
                <div className="pic">
                  <Img src={s.img} alt={s.name} />
                  <span className={`badge ${st.tone}`} style={statusStyle}>{st.label}</span>
                </div>
                <div className="body">
                  <h3>{s.name}</h3>
                  <p className="mut small">{s.desc}</p>
                  <div className="sched" style={{ marginTop: 10 }}>
                    <span><FaClock /> {s.times.map(fmt12).join(' · ')} ({s.duration} min)</span>
                    <span><FaMapMarkerAlt /> {s.place}</span>
                    {s.weekendOnly && <span><FaStar /> Saturday & Sunday only</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- Restaurants ---------- */}
      <section className="sec cream">
        <div className="head">
          <h2><FaUtensils /> Food <span className="hl">Court</span></h2>
        </div>

        <div className="toolbar" style={{ justifyContent: 'center' }}>
          <button className={`chip ${!vegOnly ? 'on' : ''}`} onClick={() => setVegOnly(false)}>All Items</button>
          <button className={`chip ${vegOnly ? 'on' : ''}`} onClick={() => setVegOnly(true)}>Veg Only</button>
        </div>

        <div className="grid3">
          {RESTAURANTS.map((r) => (
            <div className="ride" key={r.name}>
              <div className="pic">
                <Img src={r.img} alt={r.name} />
                <span className="cat-chip"><FaStar /> {r.rating}</span>
              </div>
              <div className="body">
                <h3>{r.name}</h3>
                <p className="small mut">{r.tags.join(' · ')}</p>
                <p className="small" style={{ margin: '6px 0 10px' }}><FaClock /> {r.hours}</p>
                {r.menu.filter((m) => !vegOnly || m.veg).map((m) => (
                  <div key={m.item} className="row between nowrap" style={{ padding: '7px 0', borderBottom: '1px dashed #EDE5D3' }}>
                    <span className="row nowrap" style={{ gap: 8 }}><VegMark veg={m.veg} /> {m.item}</span>
                    <b>{inr(m.price)}</b>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Shops ---------- */}
      <section className="sec">
        <div className="head">
          <h2><FaShoppingBag /> Plaza <span className="hl">Shops</span></h2>
        </div>
        <div className="grid3">
          {SHOPS.map((s) => (
            <div className="ride" key={s.name}>
              <div className="pic"><Img src={s.img} alt={s.name} /></div>
              <div className="body">
                <h3>{s.name}</h3>
                <p className="mut small">{s.desc}</p>
                <div className="sched" style={{ marginTop: 10 }}>
                  <span><FaShoppingBag /> {s.price}</span>
                  <span><FaClock /> {s.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Map link ---------- */}
      <div className="cta">
        <h2>Find The Plaza</h2>
        <p>The Central Plaza is right in the middle of the park, between all four zones.</p>
        <Link to="/map" className="btn y gap-top"><FaMapMarkedAlt /> Open Park Map</Link>
      </div>
    </>
  );
}