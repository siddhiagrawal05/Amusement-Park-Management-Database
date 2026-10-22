import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Register() {
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const { register } = useAuth();
  const nav = useNavigate();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(f.phone)) return setErr('Phone number must be 10 digits.');
    if (f.password.length < 6) return setErr('Password must be at least 6 characters.');
    if (f.password !== f.confirm) return setErr('Passwords do not match.');
    try {
      register({ name: f.name.trim(), email: f.email.trim(), phone: f.phone, password: f.password });
      nav('/tickets');
    } catch (x) {
      setErr(x.message);
    }
  };

  return (
    <div className="auth">
      <form className="auth-box" onSubmit={submit}>
        <h2>🎉 Create Account</h2>
        <p className="mut">Join WonderWorld and book your fun day.</p>
        <label>Full Name<input required value={f.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
        <label>Phone<input required value={f.phone} onChange={set('phone')} placeholder="10 digit number" /></label>
        <label>Password<input type="password" required value={f.password} onChange={set('password')} /></label>
        <label>Confirm Password<input type="password" required value={f.confirm} onChange={set('confirm')} /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn full">Register</button>
        <p className="small center-t">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}