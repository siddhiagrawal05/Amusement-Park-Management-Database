import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaIdCard, FaPercent, FaCar, FaCalendarCheck, FaTicketAlt } from 'react-icons/fa';
import { all, createPassOrder, buyPass, inr, PICS } from '../api';
import { useAuth } from '../auth';
import Banner from '../components/Banner';
import Badge from '../components/Badge';
import DemoPay from '../components/DemoPay';

const TIER = { Silver: '#64748b', Gold: '#C9831C', Platinum: '#6d28d9' };
const tierColor = (name) => TIER[name] || '#1E44A8';

export function PassCard({ p }) {
  return (
    <div className="member" style={{ '--tier': tierColor(p.planName) }}>
      <Badge s={p.currentStatus} />
      <div className="logo">Wonder<span>World</span></div>
      <h3>{p.planName} Annual Pass</h3>
      <div className="code">{p.passCode}</div>
      <div className="t-grid">
        <div><small>Member</small><b>{p.userName}</b></div>
        <div><small>Ticket discount</small><b>{p.discountPct}% off</b></div>
        <div><small>Valid from</small><b>{p.validFrom}</b></div>
        <div><small>Valid till</small><b>{p.validTo}</b></div>
        <div><small>Parking</small><b>{p.freeParking ? 'Free' : 'Paid'}</b></div>
        <div><small>Paid</small><b>{inr(p.price)}</b></div>
      </div>
    </div>
  );
}

export default function Passes() {
  const plans = all('passPlans');
  const mine = all('passes').find((p) => p.currentStatus === 'Active');
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');
  const [demo, setDemo] = useState(null);
  const [done, setDone] = useState(false);
  const best = plans.length > 1 ? plans[Math.floor(plans.length / 2)].id : null;

  const buy = async (plan) => {
    setErr('');
    if (!user) return nav('/login', { state: { from: '/passes' } });
    if (user.role !== 'visitor') return setErr('Admins cannot buy passes. Please use a visitor account.');
    setBusy(plan.id);
    try {
      const order = await createPassOrder(plan.id);
      setDemo({ plan, order });
    } catch (x) {
      setErr(x.message);
      setBusy(null);
    }
  };

  const paid = async () => {
    try {
      await buyPass(demo.plan.id, { orderId: demo.order.orderId });
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (x) {
      setErr(x.message);
    }
    setDemo(null);
    setBusy(null);
  };

  return (
    <>
      <Banner img={PICS.hero2} title="Annual Pass" sub="Visit all year and save on every ticket" />

      {mine && (
        <section className="sec cream" style={{ paddingBottom: 50 }}>
          {done && <div className="ok-msg center-t" style={{ maxWidth: 460, margin: '0 auto 20px' }}>Welcome to the club! Your pass is active now.</div>}
          <PassCard p={mine} />
          <div className="row center gap-top">
            <Link to="/tickets" className="btn"><FaTicketAlt /> Book with my discount</Link>
          </div>
          <p className="small mut center-t gap-top">The discount is applied automatically at checkout for any visit date within your pass validity.</p>
        </section>
      )}

      <section className="sec">
        <div className="head">
          <h2>Choose Your <span className="hl">Pass</span></h2>
          <p className="mut">One payment, a whole year of fun</p>
        </div>

        <div className="grid4" style={{ maxWidth: 1100, margin: '0 auto 50px' }}>
          <div className="card info"><FaPercent /><h3>Save Every Visit</h3><p className="mut small">Up to 30% off all tickets you book</p></div>
          <div className="card info"><FaCar /><h3>Free Parking</h3><p className="mut small">On Gold and Platinum passes</p></div>
          <div className="card info"><FaCalendarCheck /><h3>Valid 1 Year</h3><p className="mut small">Starts the day you buy it</p></div>
          <div className="card info"><FaIdCard /><h3>Instant</h3><p className="mut small">Active right after payment</p></div>
        </div>

        {err && <p className="err center-t mb">{err}</p>}

        <div className="plans">
          {plans.map((p) => (
            <div key={p.id} className={`plan-card ${p.id === best ? 'best' : ''}`} style={{ '--tier': tierColor(p.name) }}>
              {p.id === best && <span className="tag">Most Popular</span>}
              <h3>{p.name}</h3>
              <div className="amt">{inr(p.price)}<small> / {p.validityDays} days</small></div>
              <ul>
                <li><FaCheckCircle /> {p.discountPct}% off every ticket booking</li>
                <li className={p.freeParking ? '' : 'no'}>{p.freeParking ? <FaCheckCircle /> : <FaTimesCircle />} Free car and bike parking</li>
                <li><FaCheckCircle /> Valid for {p.validityDays} days</li>
                {p.perks && <li className="small mut" style={{ display: 'block' }}>{p.perks}</li>}
              </ul>
              <button className="btn full" disabled={!!mine || busy !== null} onClick={() => buy(p)}>
                {mine ? (mine.planId === p.id ? 'Your current pass' : 'You already have a pass') : busy === p.id ? 'Please wait...' : `Buy ${p.name} Pass`}
              </button>
            </div>
          ))}
          {!plans.length && <p className="mut center-t">No passes are on sale right now.</p>}
        </div>
        {!user && <p className="small mut center-t gap-top">You will be asked to log in first.</p>}
      </section>

      {demo && (
        <DemoPay
          amount={demo.order.amount / 100}
          onClose={() => { setDemo(null); setBusy(null); }}
          onPaid={paid}
        />
      )}
    </>
  );
}