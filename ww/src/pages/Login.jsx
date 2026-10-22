import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login({ role }) {
  const admin = role === 'admin';
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const submit = (e) => {
    e.preventDefault();
    try {
      login(f.email.trim(), f.password, role);
      nav(loc.state?.from || (admin ? '/admin' : '/'), { replace: true });
    } catch (x) {
      setErr(x.message);
    }
  };

  return (
    <div className="auth">
      <form className="auth-box" onSubmit={submit}>
        <h2>{admin ? '🛡️ Admin Login' : '🎟️ Visitor Login'}</h2>
        <p className="mut">{admin ? 'Park staff and managers only.' : 'Log in to book tickets and see your bookings.'}</p>
        <div className="hint">Demo: {admin ? 'admin@ww.com / admin123' : 'demo@ww.com / demo123'}</div>
        <label>Email
          <input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </label>
        <label>Password
          <input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn full">Login</button>
        {admin ? (
          <p className="small center-t">Visitor? <Link to="/login">Login here</Link></p>
        ) : (
          <p className="small center-t">
            New here? <Link to="/register">Create an account</Link> · <Link to="/admin/login">Admin login</Link>
          </p>
        )}
      </form>
    </div>
  );
}