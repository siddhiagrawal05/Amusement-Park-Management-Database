import { useState } from 'react';
import { FaTrash, FaEdit, FaTags, FaIdCard, FaUsers } from 'react-icons/fa';
import { all, upsert, remove, inr, today, addDays } from '../api';
import Badge from '../components/Badge';

const TABS = [
  ['promos', 'Promo Codes', FaTags],
  ['plans', 'Pass Plans', FaIdCard],
  ['members', 'Pass Members', FaUsers],
];

export default function Offers() {
  const [tab, setTab] = useState('promos');
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);

  return (
    <>
      <h3 className="h">Offers & Annual Passes</h3>
      <div className="ptabs">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}><Icon /> {label}</button>
        ))}
      </div>
      {tab === 'promos' && <Promos re={re} />}
      {tab === 'plans' && <Plans re={re} />}
      {tab === 'members' && <Members re={re} />}
    </>
  );
}

async function run(fn, setErr, done) {
  try {
    await fn();
    setErr('');
    done();
  } catch (x) {
    setErr(x.message);
  }
}

const promoState = (p) => {
  const t = today();
  if (!p.active) return 'Off';
  if (t < p.validFrom) return 'Upcoming';
  if (t > p.validTo) return 'Expired';
  if (p.usedCount >= p.usageLimit) return 'Used up';
  return 'Active';
};

const blankPromo = () => ({ code: '', description: '', discountType: 'Percent', discountValue: 10, minAmount: 0, validFrom: today(), validTo: addDays(today(), 30), usageLimit: 100, active: true });

function Promos({ re }) {
  const [form, setForm] = useState(blankPromo);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const promos = all('promoCodes');

  const save = (e) => {
    e.preventDefault();
    if (form.validTo < form.validFrom) return setErr('End date must be after start date.');
    const data = { ...form };
    delete data.usedCount;
    run(() => upsert('promoCodes', {
      ...data,
      code: form.code.trim().toUpperCase(),
      discountValue: +form.discountValue,
      minAmount: +form.minAmount,
      usageLimit: +form.usageLimit,
      active: !!form.active,
    }), setErr, () => { setForm(blankPromo()); re(); });
  };

  const toggle = (p) => run(() => upsert('promoCodes', { id: p.id, active: !p.active }), setErr, re);
  const del = (p) => window.confirm(`Delete promo code ${p.code}?`) && run(() => remove('promoCodes', p.id), setErr, re);

  return (
    <>
      <form className="card fgrid mb" onSubmit={save}>
        <h4 className="span">{form.id ? `Update: ${form.code}` : 'Add Promo Code'}</h4>
        <label>Code<input required maxLength="20" value={form.code} onChange={set('code')} placeholder="e.g. SUMMER15" style={{ textTransform: 'uppercase' }} /></label>
        <label>Discount Type
          <select value={form.discountType} onChange={set('discountType')}><option>Percent</option><option>Flat</option></select>
        </label>
        <label>{form.discountType === 'Percent' ? 'Discount (%)' : 'Discount (₹)'}<input type="number" min="1" max={form.discountType === 'Percent' ? 90 : undefined} required value={form.discountValue} onChange={set('discountValue')} /></label>
        <label>Minimum Booking (₹)<input type="number" min="0" required value={form.minAmount} onChange={set('minAmount')} /></label>
        <label>Valid From<input type="date" required value={form.validFrom} onChange={set('validFrom')} /></label>
        <label>Valid To<input type="date" required value={form.validTo} onChange={set('validTo')} /></label>
        <label>Usage Limit<input type="number" min="1" required value={form.usageLimit} onChange={set('usageLimit')} /></label>
        <label className="check"><input type="checkbox" checked={!!form.active} onChange={set('active')} /> Active</label>
        <label className="span">Description<input value={form.description || ''} onChange={set('description')} /></label>
        {err && <p className="err span">{err}</p>}
        <div className="span row">
          <button className="btn">{form.id ? 'Update' : 'Add'} Code</button>
          {form.id && <button type="button" className="btn o dark" onClick={() => setForm(blankPromo())}>Cancel</button>}
        </div>
      </form>

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Code</th><th>Discount</th><th>Min</th><th>Valid</th><th>Used</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id}>
                <td><b>{p.code}</b><div className="small mut">{p.description}</div></td>
                <td>{p.discountType === 'Percent' ? `${p.discountValue}%` : inr(p.discountValue)}</td>
                <td>{inr(p.minAmount)}</td>
                <td className="small nowrap">{p.validFrom}<br />to {p.validTo}</td>
                <td>
                  <div className="small">{p.usedCount} / {p.usageLimit}</div>
                  <div className="bar"><i style={{ width: `${Math.min(100, (p.usedCount * 100) / p.usageLimit)}%` }} /></div>
                </td>
                <td><Badge s={promoState(p)} /></td>
                <td>
                  <div className="row nowrap">
                    <button className="btn sm o dark" onClick={() => toggle(p)}>{p.active ? 'Turn off' : 'Turn on'}</button>
                    <button className="btn sm" title="Edit" onClick={() => setForm({ ...p, active: !!p.active })}><FaEdit /></button>
                    <button className="btn sm red" title="Delete" onClick={() => del(p)}><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const blankPlan = { name: '', price: 4999, discountPct: 10, validityDays: 365, freeParking: false, perks: '', active: true };

function Plans({ re }) {
  const [form, setForm] = useState(blankPlan);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const plans = all('passPlans');
  const sold = (id) => all('passes').filter((p) => p.planId === id).length;

  const save = (e) => {
    e.preventDefault();
    run(() => upsert('passPlans', {
      ...form,
      price: +form.price,
      discountPct: +form.discountPct,
      validityDays: +form.validityDays,
      freeParking: !!form.freeParking,
      active: !!form.active,
    }), setErr, () => { setForm(blankPlan); re(); });
  };

  const toggle = (p) => run(() => upsert('passPlans', { id: p.id, active: !p.active }), setErr, re);

  return (
    <>
      <form className="card fgrid mb" onSubmit={save}>
        <h4 className="span">{form.id ? `Update: ${form.name}` : 'Add Pass Plan'}</h4>
        <label>Plan Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Price (₹)<input type="number" min="1" required value={form.price} onChange={set('price')} /></label>
        <label>Ticket Discount (%)<input type="number" min="0" max="50" required value={form.discountPct} onChange={set('discountPct')} /></label>
        <label>Valid For (days)<input type="number" min="1" required value={form.validityDays} onChange={set('validityDays')} /></label>
        <label className="check"><input type="checkbox" checked={!!form.freeParking} onChange={set('freeParking')} /> Free parking</label>
        <label className="check"><input type="checkbox" checked={!!form.active} onChange={set('active')} /> On sale</label>
        <label className="span">Perks<input value={form.perks || ''} onChange={set('perks')} /></label>
        {err && <p className="err span">{err}</p>}
        <div className="span row">
          <button className="btn">{form.id ? 'Update' : 'Add'} Plan</button>
          {form.id && <button type="button" className="btn o dark" onClick={() => setForm(blankPlan)}>Cancel</button>}
        </div>
      </form>

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Plan</th><th>Price</th><th>Discount</th><th>Validity</th><th>Parking</th><th>Sold</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td><b>{p.name}</b><div className="small mut">{p.perks}</div></td>
                <td>{inr(p.price)}</td>
                <td>{p.discountPct}%</td>
                <td>{p.validityDays} days</td>
                <td>{p.freeParking ? 'Free' : 'Paid'}</td>
                <td>{sold(p.id)}</td>
                <td><Badge s={p.active ? 'Active' : 'Off'} /></td>
                <td>
                  <div className="row nowrap">
                    <button className="btn sm o dark" onClick={() => toggle(p)}>{p.active ? 'Stop sale' : 'Start sale'}</button>
                    <button className="btn sm" title="Edit" onClick={() => setForm({ ...p, freeParking: !!p.freeParking, active: !!p.active })}><FaEdit /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Members({ re }) {
  const [err, setErr] = useState('');
  const passes = all('passes');
  const active = passes.filter((p) => p.currentStatus === 'Active');

  const cancel = (p) => window.confirm(`Cancel pass ${p.passCode} of ${p.userName}?`) && run(() => upsert('passes', { id: p.id, status: 'Cancelled' }), setErr, re);

  return (
    <>
      <div className="mini-stats mb">
        <div><small>Active members</small><b>{active.length}</b></div>
        <div><small>Passes sold</small><b>{passes.length}</b></div>
        <div><small>Pass income</small><b>{inr(passes.filter((p) => p.status === 'Active').reduce((s, p) => s + p.price, 0))}</b></div>
      </div>
      {err && <p className="err">{err}</p>}
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Pass</th><th>Member</th><th>Plan</th><th>Price</th><th>Valid</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {passes.map((p) => (
              <tr key={p.id}>
                <td><b>{p.passCode}</b><div className="small mut">{p.createdAt}</div></td>
                <td>{p.userName}<div className="small mut">{p.email}</div></td>
                <td>{p.planName} <span className="small mut">({p.discountPct}% off)</span></td>
                <td>{inr(p.price)}</td>
                <td className="small nowrap">{p.validFrom}<br />to {p.validTo}</td>
                <td><Badge s={p.currentStatus} /></td>
                <td>{p.currentStatus === 'Active' && <button className="btn sm red" onClick={() => cancel(p)}>Cancel</button>}</td>
              </tr>
            ))}
            {!passes.length && <tr><td colSpan="7" className="mut small">No passes sold yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}