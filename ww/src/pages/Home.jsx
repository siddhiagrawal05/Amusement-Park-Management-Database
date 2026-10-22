import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaClock, FaFirstAid, FaTools, FaUserCheck, FaTint, FaClipboardCheck, FaMapMarkedAlt, FaPlus, FaMinus } from 'react-icons/fa';
import { all, inr, PICS } from '../api';
import Badge from '../components/Badge';
import Img from '../components/Img';

const slides = [
  { img: PICS.hero1, top: "INDIA'S WILDEST", sub: 'ADVENTURE PARK' },
  { img: PICS.hero2, top: 'SCREAM. LAUGH.', sub: 'REPEAT ALL DAY' },
  { img: PICS.hero3, top: 'MAGICAL NIGHTS', sub: 'LIGHTS • SHOWS • FUN' },
];

const zones = [
  { name: 'Thrill Zone', cat: 'Thrill', img: PICS.zThrill, tint: '226,110,24', text: 'Record-breaking coasters, loops and drops for true adrenaline lovers.' },
  { name: 'Water Kingdom', cat: 'Water', img: PICS.zWater, tint: '30,110,210', text: 'Giant slides, wild rapids and wave pools to beat the heat.' },
  { name: 'Family Fun', cat: 'Family', img: PICS.zFamily, tint: '98,40,200', text: 'Rides the whole family can enjoy together.' },
  { name: 'Kids Land', cat: 'Kids', img: PICS.zKids, tint: '140,165,20', text: 'Gentle, colourful rides made for little explorers.' },
];

const offers = [
  { title: 'Festival Night Carnival', tag: 'Limited Period', img: PICS.o1 },
  { title: 'Weekday Saver', tag: 'Lowest Price', img: PICS.o2 },
  { title: 'VIP Express Pass', tag: 'Premium', img: PICS.o3 },
  { title: 'School & Group Trips', tag: 'Groups of 20+', img: PICS.o4 },
];

const safety = [
  [FaTint, 'Water Quality Checks'],
  [FaTools, 'Daily Ride Maintenance'],
  [FaFirstAid, 'Medical Support On-Site'],
  [FaClipboardCheck, 'Independent Audits'],
  [FaUserCheck, 'Trained Staff'],
];

const faqs = [
  ['What should I wear to the park?', 'Wear light, comfortable clothes and closed shoes like sneakers. Avoid loose items that can fly off on rides.'],
  ['Can I cancel my booking?', 'Yes. You can cancel any confirmed booking from My Bookings before your visit date.'],
  ['Are there height or age limits on rides?', 'Some rides have minimum height and age limits for safety. You can see them on every ride card on the Rides page.'],
  ['Is food available inside the park?', 'Yes, there are restaurants and snack kiosks across the park. Outside food is not allowed.'],
  ['What are the park timings?', 'Weekdays 10:30 AM to 6:00 PM and weekends 10:00 AM to 8:00 PM.'],
  ['Is parking available?', 'Yes, free parking is available for cars and two-wheelers near the main gate.'],
];

function Wave({ from, to }) {
  return (
    <svg className="wave" viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ background: from, color: to }}>
      <path d="M0,60 C240,0 480,0 720,40 C960,80 1200,90 1440,30 L1440,100 L0,100 Z" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const [i, setI] = useState(0);
  const [tab, setTab] = useState('All');
  const [open, setOpen] = useState(0);
  const rail = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const rides = all('rides');
  const logs = all('rideLogs');
  const used = (id) => logs.filter((l) => l.rideId === id).length;
  const shown = rides.filter((r) => tab === 'All' || r.category === tab).sort((a, b) => used(b.id) - used(a.id));
  const types = all('ticketTypes');
  const scroll = (d) => rail.current?.scrollBy({ left: d * 330, behavior: 'smooth' });
  const strip = 'LOVED BY 1 LAKH+ HAPPY VISITORS • 100% SAFETY CHECKED • ';

  return (
    <>
      {/* ---------- Hero slider ---------- */}
      <section className="hero">
        {slides.map((s, k) => (
          <div key={k} className={`slide ${k === i ? 'on' : ''}`}>
            <Img src={s.img} alt={s.top} />
          </div>
        ))}
        <div className="hero-txt" key={i}>
          <h1>{slides[i].top}</h1>
          <p className="sub"><span />{slides[i].sub}<span /></p>
          <Link to="/tickets" className="btn big">Book Tickets</Link>
        </div>
        <div className="dots">
          {slides.map((_, k) => (
            <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} />
          ))}
        </div>
      </section>

      {/* ---------- Zones ---------- */}
      <section className="sec">
        <div className="head">
          <h2>Pick Your<br /><span className="hl">Adventure Zone</span></h2>
        </div>
        <div className="zones">
          {zones.map((z) => (
            <Link to={`/rides?cat=${z.cat}`} key={z.name} className="zone">
              <Img src={z.img} alt={z.name} />
              <div className="tint" style={{ background: `linear-gradient(160deg, rgba(${z.tint},.95) 0%, rgba(${z.tint},.6) 45%, rgba(${z.tint},.05) 85%)` }} />
              <div className="zbody">
                <h3>{z.name}</h3>
                <p>{z.text}</p>
                <span className="btn-line">Explore More</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Popular rides ---------- */}
      <Wave from="var(--bg)" to="var(--blue)" />
      <section className="blue sec">
        <div className="head">
          <h2 className="white">Popular <span className="hl">Rides</span></h2>
        </div>
        <div className="tabs">
          {['All', 'Thrill', 'Family', 'Kids', 'Water'].map((t) => (
            <button key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => { setTab(t); rail.current?.scrollTo({ left: 0 }); }}>
              {t}
            </button>
          ))}
        </div>
        <div className="rail" ref={rail}>
          {shown.map((r) => (
            <div className="rcard" key={r.id}>
              <Img src={r.img} alt={r.name} />
              <Badge s={r.status} />
              <div className="info">
                <h3>{r.name}</h3>
                <p>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="row between rail-foot">
          <Link to="/rides" className="btn white">Explore All Rides</Link>
          <div className="arrows">
            <button className="arw" onClick={() => scroll(-1)}><FaChevronLeft /></button>
            <button className="arw fill" onClick={() => scroll(1)}><FaChevronRight /></button>
          </div>
        </div>
      </section>

      {/* ---------- Offers ---------- */}
      <Wave from="var(--navy)" to="var(--gold)" />
      <section className="gold sec">
        <div className="head">
          <h2 className="white">Special <span className="hl dark">Offers</span></h2>
        </div>
        <div className="grid4">
          {offers.map((o) => (
            <div className="ocard" key={o.title}>
              <div className="opic">
                <Img src={o.img} alt={o.title} />
                <span className="otag"><FaClock /> {o.tag}</span>
              </div>
              <h3>{o.title}</h3>
              <div className="obtns">
                <Link to="/rides" className="btn o dark sm">View Details</Link>
                <Link to="/tickets" className="btn sm">Book Tickets</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="strip"><div>{strip.repeat(8)}</div></div>

      {/* ---------- Tickets ---------- */}
      <section className="sec">
        <div className="head">
          <h2>Tickets For<br /><span className="hl">Everyone</span></h2>
        </div>
        <div className="grid4">
          {types.map((t) => (
            <div className="tcard" key={t.id}>
              <div className="tpic"><Img src={t.img} alt={t.name} /></div>
              <div className="tbody">
                <h3>{t.name}</h3>
                <p className="mut small">{t.desc}</p>
                <div className="price">{inr(t.price)}<small> /person</small></div>
                <Link to="/tickets" className="btn full">Book Now</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Safety ---------- */}
      <section className="safety">
        <h2>Great Times Begin<br /><span className="hl">With Safety</span></h2>
        <div className="safe-items">
          {safety.map(([Icon, t]) => (
            <div key={t}><Icon /><b>{t}</b></div>
          ))}
        </div>
      </section>

      {/* ---------- Plan visit ---------- */}
      <section className="gold sec">
        <div className="head">
          <h2 className="white">Plan Your<br /><span className="hl dark">Park Visit</span></h2>
        </div>
        <div className="plan">
          <div className="pcard">
            <FaMapMarkedAlt />
            <div>
              <h3>How to Reach</h3>
              <p>45 minutes from the city centre. Free shuttle buses every 30 minutes and free parking at the main gate.</p>
            </div>
          </div>
          <div className="pcard">
            <FaClock />
            <div>
              <h3>Park Timings</h3>
              <p>Weekdays: 10:30 AM – 6:00 PM<br />Weekends: 10:00 AM – 8:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="sec cream">
        <div className="head">
          <h2>Before You <span className="hl">Arrive</span></h2>
          <p className="mut">All you need to know</p>
        </div>
        <div className="faq">
          {faqs.map(([q, a], k) => (
            <div className={`q ${open === k ? 'open' : ''}`} key={q}>
              <button onClick={() => setOpen(open === k ? -1 : k)}>
                <span>{q}</span>
                <i className="pm">{open === k ? <FaMinus /> : <FaPlus />}</i>
              </button>
              {open === k && <p className="ans">{a}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}