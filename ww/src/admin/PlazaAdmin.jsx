import { useState } from 'react';
import { FaTrash, FaEdit, FaUtensils, FaShoppingBag } from 'react-icons/fa';
import { all, upsert, remove, inr } from '../api';
import Img from '../components/Img';

const TABS = [
  ['food', 'Restaurants & Menus', FaUtensils],
  ['shops', 'Shops', FaShoppingBag],
];

export default function PlazaAdmin() {
  const [tab, setTab] = useState('food');
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);

  return (
    <>
      <h3 className="h">Central Plaza</h3>
      <p className="mut small mb">Changes show on the website's Plaza page straight away.</p>

      <div className="ptabs">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            <Icon /> {label}
          </button>
        ))}
      </div>

      {tab === 'food' && <Food re={re} />}
      {tab === 'shops' && <Shops re={re} />}
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

const sure = (msg) => window.confirm(msg);
const blankRest = { name: '', cuisine: '', open: '10:30', close: '20:00', rating: 4.5, img: '' };
const blankItem = { name: '', price: '', veg: true };

function Food({ re }) {
  const rests = all('restaurants');
  const [form, setForm] = useState(blankRest);
  const [selId, setSelId] = useState(rests[0]?.id ?? null);
  const [item, setItem] = useState(blankItem);
  const [err, setErr] = useState('');
  const [itemErr, setItemErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const sel = rests.find((r) => r.id === selId);
  const items = all('menuItems').filter((m) => m.restaurantId === selId);

  const save = (e) => {
    e.preventDefault();
    if (form.close <= form.open) return setErr('Closing time must be after opening time.');
    run(async () => {
      const saved = await upsert('restaurants', { ...form, rating: +form.rating });
      if (!form.id) setSelId(saved.id);
    }, setErr, () => { setForm(blankRest); re(); });
  };

  const del = (r) =>
    sure(`Delete "${r.name}" and its whole menu?`) &&
    run(() => remove('restaurants', r.id), setErr, () => { if (selId === r.id) setSelId(null); re(); });

  const saveItem = (e) => {
    e.preventDefault();
    if (!(+item.price > 0)) return setItemErr('Price must be more than 0.');
    run(() => upsert('menuItems', { ...item, price: +item.price, restaurantId: selId }), setItemErr, () => { setItem(blankItem); re(); });
  };

  const toggleVeg = (m) => run(() => upsert('menuItems', { id: m.id, veg: !m.veg }), setItemErr, re);
  const delItem = (m) => sure(`Remove "${m.name}" from the menu?`) && run(() => remove('menuItems', m.id), setItemErr, re);

  return (
    <>
      <form className="card fgrid mb" onSubmit={save}>
        <h4 className="span">{form.id ? `Update: ${form.name}` : 'Add New Restaurant'}</h4>
        <label>Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Cuisine<input value={form.cuisine} onChange={set('cuisine')} placeholder="e.g. Chaat · Snacks" /></label>
        <label>Opens<input type="time" required value={form.open} onChange={set('open')} /></label>
        <label>Closes<input type="time" required value={form.close} onChange={set('close')} /></label>
        <label>Rating (1 – 5)<input type="number" min="1" max="5" step="0.1" required value={form.rating} onChange={set('rating')} /></label>
        <label className="span">Photo Link (URL)<input value={form.img} onChange={set('img')} placeholder="https://images.unsplash.com/..." /></label>
        {err && <p className="err span">{err}</p>}
        <div className="span row">
          <button className="btn">{form.id ? 'Update' : 'Add'} Restaurant</button>
          {form.id && <button type="button" className="btn o dark" onClick={() => setForm(blankRest)}>Cancel</button>}
        </div>
      </form>

      <div className="two">
        <div className="card">
          <h3 className="h">Restaurants</h3>
          <p className="small mut mb">Click a restaurant to manage its menu.</p>
          <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Restaurant</th><th>Timing</th><th>Rating</th><th></th></tr></thead>
            <tbody>
              {rests.map((r) => (
                <tr key={r.id} className={r.id === selId ? 'sel' : ''} onClick={() => setSelId(r.id)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="row nowrap">
                      <Img src={r.img} alt={r.name} className="thumb" />
                      <div><b>{r.name}</b><div className="small mut">{r.cuisine}</div></div>
                    </div>
                  </td>
                  <td className="small nowrap">{r.open} – {r.close}</td>
                  <td>{r.rating}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="row nowrap">
                      <button className="btn sm" title="Edit" onClick={() => setForm(r)}><FaEdit /></button>
                      <button className="btn sm red" title="Delete" onClick={() => del(r)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <div className="card">
          {!sel ? (
            <p className="mut">Select a restaurant to see its menu.</p>
          ) : (
            <>
              <h3 className="h">Menu: {sel.name}</h3>
              <form className="fgrid" onSubmit={saveItem}>
                <label>Item Name<input required value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} /></label>
                <label>Price (₹)<input type="number" min="1" required value={item.price} onChange={(e) => setItem({ ...item, price: e.target.value })} /></label>
                <label>Type
                  <select value={item.veg ? 'Veg' : 'Non-veg'} onChange={(e) => setItem({ ...item, veg: e.target.value === 'Veg' })}>
                    <option>Veg</option><option>Non-veg</option>
                  </select>
                </label>
                {itemErr && <p className="err span">{itemErr}</p>}
                <div className="span row">
                  <button className="btn sm">{item.id ? 'Update Item' : '+ Add Item'}</button>
                  {item.id && <button type="button" className="btn sm o dark" onClick={() => setItem(blankItem)}>Cancel</button>}
                </div>
              </form>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Item</th><th>Type</th><th>Price</th><th></th></tr></thead>
                  <tbody>
                    {items.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>
                          <button type="button" className={`badge ${m.veg ? 'b-ok' : 'b-bad'}`} style={{ border: 'none', cursor: 'pointer' }} title="Click to switch" onClick={() => toggleVeg(m)}>
                            {m.veg ? 'Veg' : 'Non-veg'}
                          </button>
                        </td>
                        <td><b>{inr(m.price)}</b></td>
                        <td>
                          <div className="row nowrap">
                            <button className="btn sm" title="Edit" onClick={() => setItem(m)}><FaEdit /></button>
                            <button className="btn sm red" title="Delete" onClick={() => delItem(m)}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!items.length && <tr><td colSpan="4" className="mut small">No items yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
const blankShop = { name: '', priceRange: '', open: '10:00', close: '20:00', img: '', desc: '' };

function Shops({ re }) {
  const [form, setForm] = useState(blankShop);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const shops = all('shops');

  const save = (e) => {
    e.preventDefault();
    if (form.close <= form.open) return setErr('Closing time must be after opening time.');
    run(() => upsert('shops', form), setErr, () => { setForm(blankShop); re(); });
  };

  const del = (s) => sure(`Delete "${s.name}"?`) && run(() => remove('shops', s.id), setErr, re);

  return (
    <>
      <form className="card fgrid mb" onSubmit={save}>
        <h4 className="span">{form.id ? `Update: ${form.name}` : 'Add New Shop'}</h4>
        <label>Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Price Range<input value={form.priceRange} onChange={set('priceRange')} placeholder="e.g. ₹99 – ₹1,499" /></label>
        <label>Opens<input type="time" required value={form.open} onChange={set('open')} /></label>
        <label>Closes<input type="time" required value={form.close} onChange={set('close')} /></label>
        <label className="span">Photo Link (URL)<input value={form.img} onChange={set('img')} placeholder="https://images.unsplash.com/..." /></label>
        <label className="span">Description<input value={form.desc} onChange={set('desc')} /></label>
        {err && <p className="err span">{err}</p>}
        <div className="span row">
          <button className="btn">{form.id ? 'Update' : 'Add'} Shop</button>
          {form.id && <button type="button" className="btn o dark" onClick={() => setForm(blankShop)}>Cancel</button>}
        </div>
      </form>

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Shop</th><th>What They Sell</th><th>Price Range</th><th>Timing</th><th></th></tr></thead>
          <tbody>
            {shops.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="row nowrap">
                    <Img src={s.img} alt={s.name} className="thumb" />
                    <b>{s.name}</b>
                  </div>
                </td>
                <td className="small">{s.desc}</td>
                <td>{s.priceRange}</td>
                <td className="small">{s.open} – {s.close}</td>
                <td>
                  <div className="row nowrap">
                    <button className="btn sm" title="Edit" onClick={() => setForm(s)}><FaEdit /></button>
                    <button className="btn sm red" title="Delete" onClick={() => del(s)}><FaTrash /></button>
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