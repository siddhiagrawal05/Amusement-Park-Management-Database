import { useState } from 'react';
import { FaSyncAlt, FaArrowRight } from 'react-icons/fa';
import { all, upsert, loadData, inr, today } from '../api';
import Badge from '../components/Badge';

const FLOW = ['Placed', 'Preparing', 'Ready', 'Collected'];
const STATUSES = [...FLOW, 'Cancelled'];

export default function FoodOrders() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const [filter, setFilter] = useState('Active');
  const [rest, setRest] = useState('');
  const [busy, setBusy] = useState(false);

  const orders = all('foodOrders');
  const restaurants = all('restaurants');
  const t = today();
  const todays = orders.filter((o) => o.createdAt.startsWith(t) && o.status !== 'Cancelled');

  const list = orders.filter((o) =>
    (filter === 'All' || (filter === 'Active' ? ['Placed', 'Preparing', 'Ready'].includes(o.status) : o.status === filter)) &&
    (!rest || o.restaurantId === +rest)
  );

  const setStatus = async (o, status) => {
    try {
      await upsert('foodOrders', { id: o.id, status });
      re();
    } catch (e) {
      alert(e.message);
    }
  };

  const reload = async () => {
    setBusy(true);
    await loadData();
    setBusy(false);
    re();
  };

  return (
    <>
      <div className="row between">
        <h3 className="h">Food Orders</h3>
        <button className="btn sm" onClick={reload} disabled={busy}><FaSyncAlt /> {busy ? 'Loading...' : 'Refresh'}</button>
      </div>

      <div className="mini-stats mb">
        <div><small>Orders today</small><b>{todays.length}</b></div>
        <div><small>Sales today</small><b>{inr(todays.reduce((s, o) => s + o.total, 0))}</b></div>
        {['Placed', 'Preparing', 'Ready'].map((s) => (
          <div key={s}><small>{s}</small><b>{orders.filter((o) => o.status === s).length}</b></div>
        ))}
      </div>

      <div className="toolbar">
        {['Active', 'All', ...STATUSES].map((s) => (
          <button key={s} className={`chip ${filter === s ? 'on' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
        <select className="mini" style={{ marginLeft: 'auto' }} value={rest} onChange={(e) => setRest(e.target.value)}>
          <option value="">All restaurants</option>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <p className="card mut">No orders here.</p>
      ) : (
        <div className="orders">
          {list.map((o) => {
            const next = FLOW[FLOW.indexOf(o.status) + 1];
            return (
              <div className="card order" key={o.id}>
                <div className="row between">
                  <b>{o.orderCode}</b>
                  <Badge s={o.status} />
                </div>
                <p className="small mut">{o.createdAt} · {o.userName}</p>
                <p className="small"><b>{o.restaurant}</b></p>
                <ul className="order-items">
                  {o.items.map((i, k) => (
                    <li key={k}><span>{i.qty} × {i.name}</span><span>{inr(i.price * i.qty)}</span></li>
                  ))}
                </ul>
                {o.note && <p className="rule small">Note: {o.note}</p>}
                <div className="row between">
                  <b>{inr(o.total)}</b>
                  <div className="row nowrap">
                    {next && <button className="btn sm" onClick={() => setStatus(o, next)}>{next} <FaArrowRight /></button>}
                    {o.status === 'Placed' && <button className="btn sm red" onClick={() => setStatus(o, 'Cancelled')}>Cancel</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}