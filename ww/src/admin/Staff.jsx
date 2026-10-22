import { useState } from 'react';
import { all, upsert } from '../api';

const ROLES = ['Ride Operator', 'Technician', 'Ticket Counter', 'Security', 'Supervisor', 'Manager'];
const blank = { name: '', role: 'Ride Operator', phone: '', email: '', rideId: '' };

export default function Staff() {
  const [, refresh] = useState(0);
  const re = () => refresh((x) => x + 1);
  const [form, setForm] = useState(blank);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const rides = all('rides');
  const rname = (id) => rides.find((r) => r.id === id)?.name || '—';
  const list = all('employees').filter((e) => (e.name + e.role).toLowerCase().includes(q.toLowerCase()));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.phone)) return setErr('Phone number must be 10 digits.');
    upsert('employees', { ...form, rideId: form.rideId ? +form.rideId : null });
    setForm(blank);
    setErr('');
    re();
  };

  const assign = (emp, rideId) => { upsert('employees', { id: emp.id, rideId: rideId ? +rideId : null }); re(); };

  return (
    <>
      <h3 className="h">👷 Employee Management</h3>

      <form className="card fgrid mb" onSubmit={save}>
        <h4 className="span">{form.id ? `Update: ${form.name}` : 'Add New Employee'}</h4>
        <label>Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Role<select value={form.role} onChange={set('role')}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label>Phone<input required value={form.phone} onChange={set('phone')} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Assigned Ride
          <select value={form.rideId ?? ''} onChange={set('rideId')}>
            <option value="">Not assigned</option>
            {rides.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        {err && <p className="err span">{err}</p>}
        <div className="span row">
          <button className="btn">{form.id ? 'Update' : 'Add'} Employee</button>
          {form.id && <button type="button" className="btn o dark" onClick={() => setForm(blank)}>Cancel</button>}
        </div>
      </form>

      <div className="card tbl-wrap">
        <div className="search mb"><input placeholder="Search by name or role..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Assigned Ride</th><th></th></tr></thead>
          <tbody>
            {list.map((emp) => (
              <tr key={emp.id}>
                <td><b>{emp.name}</b></td>
                <td>{emp.role}</td>
                <td>{emp.phone}</td>
                <td>{emp.email}</td>
                <td>
                  <select className="mini" value={emp.rideId ?? ''} onChange={(e) => assign(emp, e.target.value)}>
                    <option value="">Not assigned</option>
                    {rides.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <div className="small mut">{rname(emp.rideId)}</div>
                </td>
                <td><button className="btn sm" onClick={() => setForm({ ...emp, rideId: emp.rideId ?? '' })}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}