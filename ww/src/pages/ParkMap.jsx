import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaDirections, FaCar, FaBus, FaTrain, FaParking, FaClock, FaRulerVertical, FaChild, FaUsers, FaTimes, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { all, PICS } from '../api';
import Banner from '../components/Banner';
import Badge from '../components/Badge';
import Img from '../components/Img';

// ---------- Location settings (change these to the real park address) ----------
const PARK_ADDRESS = 'WonderWorld Road, Near Expressway, Pune, Maharashtra';
const MAP_QUERY = 'Pune, Maharashtra'; // what Google Maps should show and give directions to

// ---------- Layout map settings ----------
const CATS = ['Thrill', 'Water', 'Family', 'Kids'];

const ZONES = {
  Thrill: { name: 'Thrill Zone', color: '#E26E18', x: 40, y: 50, w: 380, h: 230 },
  Water: { name: 'Water Kingdom', color: '#1E6ED2', x: 580, y: 50, w: 380, h: 230 },
  Family: { name: 'Family Fun', color: '#6228C8', x: 40, y: 340, w: 380, h: 220 },
  Kids: { name: 'Kids Land', color: '#7E9612', x: 580, y: 340, w: 380, h: 220 },
};

// Where ride pins go inside each zone (new rides fill the next free spot)
const SLOTS = {
  Thrill: [[100, 125], [210, 110], [330, 130], [120, 220], [235, 210], [355, 230]],
  Water: [[630, 125], [740, 110], [860, 130], [650, 220], [765, 210], [885, 230]],
  Family: [[100, 410], [210, 395], [330, 415], [120, 500], [235, 490], [355, 510]],
  Kids: [[630, 410], [740, 395], [860, 415], [650, 500], [765, 490], [885, 510]],
};

const STATUS_COLOR = { Open: '#16a34a', Closed: '#dc2626', 'Under Maintenance': '#f59e0b' };

// Park facilities shown on the map
const FACILITIES = [
  { label: 'Ticket Counter', short: 'T', x: 330, y: 600, color: '#1E44A8' },
  { label: 'Guest Services', short: 'i', x: 420, y: 545, color: '#1E44A8' },
  { label: 'Lockers', short: 'L', x: 580, y: 545, color: '#334155' },
  { label: 'First Aid', short: '+', x: 500, y: 470, color: '#dc2626' },
  { label: 'Restrooms', short: 'WC', x: 500, y: 140, color: '#0E7490' },
  { label: 'Parking', short: 'P', x: 700, y: 600, color: '#1E44A8' },
];

const label = { fontFamily: 'Quicksand, sans-serif', fontWeight: 700, paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3 };

export default function ParkMap() {
  const [sel, setSel] = useState(null);
  const [cat, setCat] = useState('All');
  const nav = useNavigate();

  const scheds = all('schedules');

  // Number the rides zone by zone and give each one a position
  const placed = [];
  CATS.forEach((c) => {
    all('rides')
      .filter((r) => r.category === c)
      .forEach((r, i) => {
        const base = SLOTS[c][i % SLOTS[c].length];
        const extra = Math.floor(i / SLOTS[c].length) * 22; // shift if a zone has more than 6 rides
        placed.push({ ...r, num: placed.length + 1, x: base[0] + extra, y: base[1] + extra });
      });
  });

  const ride = placed.find((r) => r.id === sel);
  const shown = (r) => cat === 'All' || r.category === cat;

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAP_QUERY)}`;
  const embed = `https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=13&output=embed`;

  return (
    <>
      <Banner img={PICS.zFamily} title="Park Map" sub="Find every ride, food court and facility" />

      {/* ---------- Park layout map ---------- */}
      <section className="sec cream">
        <div className="head">
          <h2>Explore The <span className="hl">Park</span></h2>
          <p className="mut">Tap a numbered pin for ride details, or tap the Central Plaza for food, shops and shows</p>
        </div>

        <div className="toolbar" style={{ justifyContent: 'center' }}>
          {['All', ...CATS].map((c) => (
            <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
              {c === 'All' ? 'All Zones' : ZONES[c].name}
            </button>
          ))}
        </div>

        <div className="book">
          {/* Map */}
          <div className="card" style={{ padding: 12 }}>
            <svg viewBox="0 0 1000 640" style={{ width: '100%', display: 'block', borderRadius: 16, background: '#CFE8B5' }}>
              {/* Paths */}
              <g stroke="#F3E2BC" strokeWidth="24" strokeLinecap="round" fill="none">
                <path d="M500 640 L500 310" />
                <path d="M500 310 L230 165" />
                <path d="M500 310 L770 165" />
                <path d="M500 310 L230 450" />
                <path d="M500 310 L770 450" />
                <path d="M500 310 L500 140" />
              </g>

              {/* Zones */}
              {CATS.map((c) => {
                const z = ZONES[c];
                const dim = cat !== 'All' && cat !== c;
                return (
                  <g key={c} opacity={dim ? 0.35 : 1}>
                    <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="40" fill={z.color} fillOpacity="0.16" stroke={z.color} strokeWidth="3" strokeDasharray="10 6" />
                    <text x={z.x + 24} y={z.y + 34} fontFamily="'Lilita One', cursive" fontSize="26" fill={z.color}>{z.name}</text>
                  </g>
                );
              })}

              {/* Water Kingdom lake */}
              <ellipse cx="770" cy="170" rx="70" ry="28" fill="#7DD3FC" opacity="0.7" />

              {/* Central plaza (clickable: opens the Plaza page) */}
              <g onClick={() => nav('/plaza')} style={{ cursor: 'pointer' }}>
                <title>Central Plaza – tap to see food, shops and live shows</title>
                <circle cx="500" cy="310" r="64" fill="#F5B84A" stroke="#fff" strokeWidth="5" />
                <text x="500" y="298" textAnchor="middle" fontFamily="'Lilita One', cursive" fontSize="18" fill="#1A1108">Central Plaza</text>
                <text x="500" y="319" textAnchor="middle" fontFamily="Quicksand, sans-serif" fontWeight="700" fontSize="13" fill="#1A1108">Food · Shops · Shows</text>
                <text x="500" y="339" textAnchor="middle" fontFamily="Quicksand, sans-serif" fontWeight="700" fontSize="11" fill="#1E44A8">Tap to explore</text>
              </g>

              {/* Main gate */}
              <rect x="445" y="585" width="110" height="40" rx="10" fill="#1E44A8" />
              <text x="500" y="611" textAnchor="middle" fontFamily="'Lilita One', cursive" fontSize="18" fill="#fff">MAIN GATE</text>

              {/* Facilities */}
              {FACILITIES.map((f) => (
                <g key={f.label} transform={`translate(${f.x},${f.y})`}>
                  <title>{f.label}</title>
                  <circle r="15" fill={f.color} stroke="#fff" strokeWidth="3" />
                  <text textAnchor="middle" dy="5" fontSize={f.short.length > 1 ? 10 : 14} fontWeight="700" fill="#fff">{f.short}</text>
                  <text textAnchor="middle" y="31" fontSize="12" fill="#1A1108" style={label}>{f.label}</text>
                </g>
              ))}

              {/* Ride pins */}
              {placed.map((r) => (
                <g
                  key={r.id}
                  transform={`translate(${r.x},${r.y})`}
                  onClick={() => setSel(r.id)}
                  style={{ cursor: 'pointer' }}
                  opacity={shown(r) ? 1 : 0.2}
                >
                  <title>{`${r.name} – ${r.status}`}</title>
                  {sel === r.id && <circle r="25" fill="none" stroke="#1A1108" strokeWidth="3" />}
                  <circle r="17" fill={STATUS_COLOR[r.status] || '#64748b'} stroke="#fff" strokeWidth="3" />
                  <text textAnchor="middle" dy="5" fontSize="14" fontWeight="700" fill="#fff">{r.num}</text>
                  <text textAnchor="middle" y="35" fontSize="12" fill="#1A1108" style={label}>{r.name}</text>
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="row center small" style={{ marginTop: 12, gap: 18 }}>
              {Object.entries(STATUS_COLOR).map(([s, c]) => (
                <span key={s} className="row" style={{ gap: 6 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: c, display: 'inline-block' }} /> {s}
                </span>
              ))}
            </div>
          </div>

          {/* Side panel */}
          <aside className="card summary" style={{ maxHeight: 640, overflowY: 'auto' }}>
            {ride ? (
              <>
                <div className="row between">
                  <h3 style={{ margin: 0 }}>{ride.num}. {ride.name}</h3>
                  <button className="btn sm o dark" onClick={() => setSel(null)} title="Close"><FaTimes /></button>
                </div>
                <div style={{ height: 170, borderRadius: 14, overflow: 'hidden', margin: '12px 0' }}>
                  <Img src={ride.img} alt={ride.name} className="" />
                </div>
                <div className="row" style={{ marginBottom: 8 }}>
                  <Badge s={ride.status} />
                  <span className="small mut">{ZONES[ride.category]?.name}</span>
                </div>
                <p className="mut small">{ride.desc}</p>
                <div className="facts">
                  <span><FaUsers /> {ride.capacity} seats</span>
                  <span><FaRulerVertical /> {ride.minHeight ? `${ride.minHeight}+ cm` : 'Any height'}</span>
                  <span><FaChild /> {ride.minAge ? `${ride.minAge}+ yrs` : 'All ages'}</span>
                  <span><FaClock /> {ride.duration} min</span>
                </div>
                {ride.rules && <p className="rule"><FaExclamationTriangle /> {ride.rules}</p>}
                <div className="sched">
                  {scheds.filter((s) => s.rideId === ride.id).map((s) => (
                    <span key={s.id}><FaCalendarAlt /> {s.days}: {s.open} – {s.close}</span>
                  ))}
                </div>
                <Link to="/tickets" className="btn full">Book Tickets</Link>
              </>
            ) : (
              <>
                <h3>All Rides</h3>
                <p className="mut small mb">Tap a pin on the map or a ride below.</p>
                {placed.filter(shown).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSel(r.id)}
                    className="row nowrap"
                    style={{ width: '100%', gap: 10, padding: '8px 4px', border: 'none', borderBottom: '1px solid #F3EDE0', background: 'none', textAlign: 'left' }}
                  >
                    <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: '50%', background: STATUS_COLOR[r.status] || '#64748b', color: '#fff', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {r.num}
                    </span>
                    <span style={{ flex: 1, fontWeight: 600 }}>{r.name}</span>
                    <span className="small mut">{r.category}</span>
                  </button>
                ))}
                <Link to="/plaza" className="btn full">Central Plaza: Food, Shops & Shows</Link>
              </>
            )}
          </aside>
        </div>
      </section>

      {/* ---------- Location map ---------- */}
      <section className="sec">
        <div className="head">
          <h2>How To <span className="hl">Reach Us</span></h2>
          <p className="mut"><FaMapMarkerAlt /> {PARK_ADDRESS}</p>
        </div>

        <div className="two">
          <div className="card" style={{ padding: 12 }}>
            <iframe
              title="WonderWorld location"
              src={embed}
              style={{ width: '100%', height: 400, border: 0, borderRadius: 16, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a href={directions} target="_blank" rel="noreferrer" className="btn full"><FaDirections /> Get Directions</a>
          </div>

          <div className="grid4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', alignContent: 'start' }}>
            <div className="card info"><FaCar /><h3>By Car</h3><p className="mut small">Click "Get Directions" for the fastest route from your location.</p></div>
            <div className="card info"><FaBus /><h3>Free Shuttle</h3><p className="mut small">Every 30 minutes from the city bus stand, 10 AM to 6 PM.</p></div>
            <div className="card info"><FaTrain /><h3>By Train / Air</h3><p className="mut small">From the city railway station or airport, take a cab or the free shuttle.</p></div>
            <div className="card info"><FaParking /><h3>Parking</h3><p className="mut small">Free parking for cars and two-wheelers at the main gate.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}