import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaStar, FaHourglassHalf, FaTicketAlt } from 'react-icons/fa';
import { all } from '../api';
import Banner from '../components/Banner';
import Img from '../components/Img';

const BANNER = 'https://images.unsplash.com/photo-1609051589207-264fb1f91000?auto=format&fit=crop&w=1920&q=80';
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
const hourLabel = (h) => `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
const inTime = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}`);

export default function Shows() {
  const [now, setNow] = useState(new Date());
  const [pickId, setPickId] = useState(null);
  const scrollRef = useRef(null);
  const detailRef = useRef(null);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const mins = now.getHours() * 60 + now.getMinutes();
  const weekend = [0, 6].includes(now.getDay());
  const times = all('showTimes');
  const shows = all('plazaShows').map((s) => ({
    ...s,
    times: times.filter((t) => t.showId === s.id).map((t) => t.time),
    off: s.status === 'Cancelled' ? 'Cancelled today' : s.days === 'Weekends' && !weekend ? 'Weekends only' : '',
  }));
  const slots = shows
    .filter((s) => !s.off)
    .flatMap((s) => s.times.map((t) => ({ show: s, start: toMin(t), end: toMin(t) + s.duration, time: t })))
    .sort((a, b) => a.start - b.start);
  const liveNow = slots.filter((x) => x.start <= mins && mins < x.end);
  const upNext = slots.find((x) => x.start > mins);

  const slotState = (start, end) => {
    if (end <= mins) return 'past';
    if (start <= mins) return 'live';
    if (upNext && start === upNext.start) return 'next';
    return 'soon';
  };
  const allTimes = shows.flatMap((s) => s.times.map((t) => [toMin(t), toMin(t) + s.duration]));
  const startH = Math.min(10, ...allTimes.map(([a]) => Math.floor(a / 60)));
  const endH = Math.max(20, ...allTimes.map(([, b]) => Math.ceil(b / 60)));
  const span = (endH - startH) * 60;
  const pos = (m) => `${((m - startH * 60) / span) * 100}%`;
  const hours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);
  const showNowLine = mins >= startH * 60 && mins <= endH * 60;
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || box.scrollWidth <= box.clientWidth) return;
    const labelW = box.querySelector('.tt-label')?.offsetWidth || 0;
    const trackW = box.scrollWidth - labelW;
    const frac = Math.min(Math.max((mins - startH * 60) / span, 0), 1);
    box.scrollLeft = labelW + frac * trackW - box.clientWidth / 2;
  }, []);

  const pick = shows.find((s) => s.id === pickId) || upNext?.show || liveNow[0]?.show || shows[0];

  const cardStatus = (s) => {
    if (s.off) return { label: s.off, tone: s.status === 'Cancelled' ? 'b-bad' : 'b-info' };
    const live = liveNow.find((x) => x.show.id === s.id);
    if (live) return { label: 'On now!', tone: 'b-ok' };
    const next = slots.find((x) => x.show.id === s.id && x.start > mins);
    if (next) return { label: `Next at ${fmt12(next.time)}`, tone: 'b-warn' };
    return { label: 'Done for today', tone: 'b-bad' };
  };

  const openShow = (id) => {
    setPickId(id);
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      <Banner img={BANNER} title="Live Shows" sub="Parades, music and street magic all day long" />
      <section className="sec">
        <div className="head">
          <h2>Today's Show <span className="hl">Timetable</span></h2>
          <p className="mut">{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {weekend ? 'Weekend' : 'Weekday'} schedule</p>
        </div>
        <div className="tt-strip">
          <div className="tt-now">
            <span className="tt-k">ON NOW</span>
            {liveNow.length
              ? liveNow.map((x) => <b key={x.show.id + x.time}><span className="tt-dot" /> {x.show.name} <span className="small">· {x.show.place}</span></b>)
              : <b className="mut">No show right now</b>}
          </div>
          <div className="tt-next">
            <span className="tt-k">UP NEXT</span>
            {upNext ? (
              <b>
                {upNext.show.name} at {fmt12(upNext.time)}
                <span className="tt-count"><FaHourglassHalf /> in {inTime(upNext.start - mins)}</span>
              </b>
            ) : (
              <b>All shows are over for today. See you tomorrow!</b>
            )}
          </div>
        </div>

        {shows.length === 0 ? (
          <p className="center-t mut">No shows added yet.</p>
        ) : (
          <div className="card tt-card">
            <div className="tt-scroll" ref={scrollRef}>
              <div className="tt">
                <div className="tt-row tt-head">
                  <div className="tt-label" />
                  <div className="tt-track">
                    {hours.map((h) => (
                      <span key={h} className="tt-hour" style={{ left: pos(h * 60) }}>{hourLabel(h)}</span>
                    ))}
                  </div>
                </div>
                {shows.map((s) => (
                  <div key={s.id} className={`tt-row ${pick?.id === s.id ? 'on' : ''} ${s.off ? 'off' : ''}`} onClick={() => setPickId(s.id)}>
                    <div className="tt-label">
                      <Img src={s.img} alt={s.name} className="tt-thumb" />
                      <div>
                        <b>{s.name}</b>
                        <div className="small mut">{s.duration} min · {s.place}</div>
                      </div>
                    </div>
                    <div className="tt-track">
                      {hours.map((h) => <span key={h} className="tt-grid" style={{ left: pos(h * 60) }} />)}
                      {s.off ? (
                        <span className="tt-offmsg">{s.off}</span>
                      ) : (
                        s.times.map((t) => {
                          const st = toMin(t);
                          const state = slotState(st, st + s.duration);
                          return (
                            <span
                              key={t}
                              className={`tt-slot ${state}`}
                              style={{ left: pos(st), width: `max(${(s.duration / span) * 100}%, 64px)` }}
                              title={`${s.name} · ${fmt12(t)} (${s.duration} min)`}
                            >
                              {state === 'live' ? 'LIVE' : fmt12(t)}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
                {showNowLine && (
                  <div className="tt-nowline-wrap">
                    <div className="tt-label" />
                    <div className="tt-track">
                      <span className="tt-nowline" style={{ left: pos(mins) }}><em>Now</em></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="row center small tt-legend">
              <span><i className="tt-slot live" /> On now</span>
              <span><i className="tt-slot next" /> Up next</span>
              <span><i className="tt-slot soon" /> Later today</span>
              <span><i className="tt-slot past" /> Finished</span>
            </div>
            {pick && (
              <div className="tt-detail" ref={detailRef}>
                <Img src={pick.img} alt={pick.name} className="tt-detail-pic" />
                <div>
                  <h3>{pick.name}</h3>
                  <p className="mut small">{pick.desc}</p>
                  <div className="sched" style={{ marginTop: 10 }}>
                    <span><FaClock /> {pick.times.length ? pick.times.map(fmt12).join(' · ') : 'No timings yet'} ({pick.duration} min)</span>
                    <span><FaMapMarkerAlt /> {pick.place}</span>
                    <span><FaStar /> {pick.days === 'Weekends' ? 'Saturday & Sunday only' : 'Every day'}</span>
                  </div>
                  {pick.status === 'Cancelled' && <p className="err">This show is cancelled today.</p>}
                </div>
              </div>
            )}
            <p className="small mut center-t">Tap any show to see its details.</p>
          </div>
        )}
      </section>
      <section className="sec cream">
        <div className="head">
          <h2>Meet The <span className="hl">Shows</span></h2>
        </div>
        <div className="grid3">
          {shows.map((s) => {
            const st = cardStatus(s);
            return (
              <div className="ride" key={s.id} onClick={() => openShow(s.id)} style={{ cursor: 'pointer' }}>
                <div className="pic">
                  <Img src={s.img} alt={s.name} />
                  <span className={`badge ${st.tone}`}>{st.label}</span>
                  <span className="cat-chip">{s.duration} min</span>
                </div>
                <div className="body">
                  <h3>{s.name}</h3>
                  <p className="mut small">{s.desc}</p>
                  <div className="tchips" style={{ margin: '12px 0' }}>
                    {s.times.map((t) => <span key={t} className="tchip" style={{ paddingRight: 12 }}>{fmt12(t)}</span>)}
                  </div>
                  <div className="sched">
                    <span><FaMapMarkerAlt /> {s.place}</span>
                    <span><FaStar /> {s.days === 'Weekends' ? 'Saturday & Sunday only' : 'Every day'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <div className="cta">
        <h2>Don't Miss The Show</h2>
        <p>All shows are free with your park ticket. Book now and plan your day around them.</p>
        <Link to="/tickets" className="btn y gap-top"><FaTicketAlt /> Book Tickets</Link>
      </div>
    </>
  );
}