import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaKey } from 'react-icons/fa';
import { useAuth } from '../auth';
import { sendLoginCode } from '../api';
import GoogleLogin from '../components/GoogleLogin';

function CodeLogin({ done }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [info, setInfo] = useState(null);
  const [wait, setWait] = useState(0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { loginWithCode } = useAuth();

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (e) => {
    if (e) e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await sendLoginCode(email.trim());
      setInfo(r);
      setStep('code');
      setCode('');
      setWait(60);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };

  const verify = async (e) => {
    e.preventDefault();
    setErr('');
    if (!/^\d{6}$/.test(code)) return setErr('Please enter the 6-digit code from your email.');
    if (info.newUser && !/^\d{10}$/.test(phone)) return setErr('Phone number must be 10 digits.');
    setBusy(true);
    try {
      await loginWithCode(email.trim(), code, name.trim(), phone);
      done();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  const change = () => {
    setStep('email');
    setInfo(null);
    setErr('');
  };

  if (step === 'email') {
    return (
      <form onSubmit={send}>
        <p className="small mut" style={{ margin: '10px 0 14px' }}>We will email you a 6-digit code. No password needed. New visitors get an account created automatically.</p>
        <label>Email
          <input type="email" required autoComplete="email" placeholder="yourname@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn full" disabled={busy}>{busy ? 'Sending...' : 'Send Code'}</button>
      </form>
    );
  }

  return (
    <form onSubmit={verify}>
      <p className="small" style={{ margin: '10px 0 14px' }}>
        We sent a code to <b>{email.trim()}</b>. Check your inbox and spam folder.{' '}
        <button type="button" onClick={change} style={{ border: 'none', background: 'none', padding: 0, color: 'var(--goldd)', fontWeight: 700 }}>Change</button>
      </p>
      {info.demoCode && (
        <div className="hint">Demo mode: email sending is not set up on the server, so here is your code: <b>{info.demoCode}</b></div>
      )}
      {info.newUser && (
        <>
          <p className="small mut" style={{ marginBottom: 10 }}>New here? Tell us a little about you to create your account.</p>
          <label>Full Name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Phone<input required inputMode="numeric" maxLength="10" placeholder="10 digit number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} /></label>
        </>
      )}
      <label>6-digit code
        <input
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength="6"
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, letterSpacing: 10 }}
        />
      </label>
      {err && <p className="err">{err}</p>}
      <button className="btn full" disabled={busy}>{busy ? 'Checking...' : info.newUser ? 'Create Account & Login' : 'Verify & Login'}</button>
      <p className="small center-t gap-top">
        Didn't get it?{' '}
        {wait > 0 ? (
          <span className="mut">Resend in {wait}s</span>
        ) : (
          <button type="button" onClick={() => send()} disabled={busy} style={{ border: 'none', background: 'none', padding: 0, color: 'var(--goldd)', fontWeight: 700 }}>Resend code</button>
        )}
      </p>
    </form>
  );
}

export default function Login({ role }) {
  const admin = role === 'admin';
  const [mode, setMode] = useState(admin ? 'password' : 'code');
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [gStep, setGStep] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const done = () => nav(loc.state?.from || (admin ? '/admin' : '/'), { replace: true });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(f.email.trim(), f.password, role);
      done();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-box">
        <h2>{admin ? 'Admin Login' : 'Visitor Login'}</h2>
        <p className="mut">{admin ? 'Park staff and managers only.' : 'Use your Google account, an email code or your password.'}</p>

        {!admin && <GoogleLogin done={done} onPending={setGStep} />}

        {!gStep && (
          <>
            {!admin && (
              <div className="ptabs" style={{ margin: '12px 0 0' }}>
                <button type="button" className={`chip ${mode === 'code' ? 'on' : ''}`} onClick={() => setMode('code')}><FaEnvelope /> Email Code</button>
                <button type="button" className={`chip ${mode === 'password' ? 'on' : ''}`} onClick={() => setMode('password')}><FaKey /> Password</button>
              </div>
            )}

            {mode === 'code' ? (
              <CodeLogin done={done} />
            ) : (
              <form onSubmit={submit}>
                <div className="hint">Demo: {admin ? 'admin@ww.com / admin123' : 'demo@ww.com / demo123'}</div>
                <label>Email
                  <input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
                </label>
                <label>Password
                  <input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
                </label>
                {err && <p className="err">{err}</p>}
                <button className="btn full" disabled={busy}>{busy ? 'Please wait...' : 'Login'}</button>
              </form>
            )}
          </>
        )}

        {admin ? (
          <p className="small center-t gap-top">Visitor? <Link to="/login">Login here</Link></p>
        ) : (
          <p className="small center-t gap-top">
            New here? <Link to="/register">Create an account</Link> · <Link to="/admin/login">Admin login</Link>
          </p>
        )}
      </div>
    </div>
  );
}