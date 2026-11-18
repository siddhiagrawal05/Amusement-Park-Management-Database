import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaBoxOpen, FaMapMarkerAlt, FaPhoneAlt, FaClipboardList } from 'react-icons/fa';
import { all, reportLost, today, addDays, PICS } from '../api';
import { useAuth } from '../auth';
import Banner from '../components/Banner';
import Badge from '../components/Badge';

const PLACES = ['Main Gate', 'Central Plaza', 'Food Court', 'Thrill Zone', 'Water Zone', 'Family Zone', 'Kids Zone', 'Lockers', 'Parking', 'Washrooms', 'Show Arena'];

export default function LostFound() {
  const { user } = useAuth();
  const blank = () => ({ name: user?.name || '', phone: user?.phone || '', item: '', desc: '', lostDate: today(), location: '' });
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const found = all('foundItems');
  const mine = all('lostItems').slice(0, 4);

  const send = async (e) => {
    e.preventDefault();
    setErr('');
    if (!/^\d{10}$/.test(f.phone)) return setErr('Phone number must be 10 digits.');
    setBusy(true);
    try {
      const r = await reportLost(f);
      setDone({ id: r.id, item: f.item, phone: f.phone });
      setF(blank());
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };

  return (
    <>
      <Banner img={PICS.hero3} title="Lost & Found" sub="Lost something in the park? We will help you find it." />

      <section className="sec cream">
        <div className="lf">
          <form className="card" onSubmit={send}>
            <h3 className="h"><FaClipboardList /> Report a Lost Item</h3>
            {done && (
              <div className="ok-msg">
                Report #{done.id} received for "{done.item}". We will call you on {done.phone} as soon as it is found.
              </div>
            )}
            <div className="fgrid">
              <label>Your Name<input required value={f.name} onChange={set('name')} /></label>
              <label>Phone<input required value={f.phone} onChange={set('phone')} placeholder="10 digit number" maxLength="10" /></label>
              <label>What did you lose?<input required maxLength="80" value={f.item} onChange={set('item')} placeholder="e.g. Black wallet" /></label>
              <label>When?<input type="date" required min={addDays(today(), -60)} max={today()} value={f.lostDate} onChange={set('lostDate')} /></label>
              <label className="span">Where? (best guess)
                <input list="lf-places" maxLength="100" value={f.location} onChange={set('location')} placeholder="e.g. Near Sky Screamer queue" />
                <datalist id="lf-places">{PLACES.map((p) => <option key={p} value={p} />)}</datalist>
              </label>
              <label className="span">Description
                <textarea maxLength="300" value={f.desc} onChange={set('desc')} placeholder="Colour, brand, anything that helps us identify it" />
              </label>
            </div>
            {err && <p className="err">{err}</p>}
            <button className="btn full" disabled={busy}>{busy ? 'Sending...' : 'Submit Report'}</button>
            {!user && <p className="small mut center-t gap-top"><Link to="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>Log in</Link> first to track your report in My Account.</p>}
          </form>

          <div>
            <div className="card mb">
              <h3 className="h"><FaBoxOpen /> Recently Found</h3>
              <p className="small mut mb">Items our team has found. If one is yours, visit Guest Services near the Main Gate with an ID.</p>
              <div className="found">
                {found.map((i) => (
                  <div key={i.id}>
                    <FaSearch />
                    <span>
                      <b>{i.item}</b>
                      <span className="small mut" style={{ display: 'block' }}><FaMapMarkerAlt /> {i.location || 'In the park'} · {i.lostDate}</span>
                    </span>
                  </div>
                ))}
                {!found.length && <p className="small mut">Nothing waiting to be collected right now.</p>}
              </div>
            </div>

            {user?.role === 'visitor' && (
              <div className="card mb">
                <div className="row between nowrap mb">
                  <h3 className="h" style={{ margin: 0 }}>My Reports</h3>
                  <Link to="/my-bookings?tab=lost" className="small" style={{ color: 'var(--blue)', fontWeight: 700 }}>See all</Link>
                </div>
                <div className="found">
                  {mine.map((i) => (
                    <div key={i.id} style={{ justifyContent: 'space-between' }}>
                      <span><b>{i.item}</b><span className="small mut" style={{ display: 'block' }}>{i.lostDate}</span></span>
                      <Badge s={i.status} />
                    </div>
                  ))}
                  {!mine.length && <p className="small mut">You have not reported anything.</p>}
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="h"><FaPhoneAlt /> Need it urgently?</h3>
              <p className="small">For phones, wallets, keys or a lost child, go straight to any staff member or the Guest Services desk at the Main Gate.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}