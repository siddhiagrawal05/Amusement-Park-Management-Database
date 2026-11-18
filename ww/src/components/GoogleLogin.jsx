import { useEffect, useRef, useState } from 'react';
import { getGoogleConfig } from '../api';
import { useAuth } from '../auth';

const GSI = 'https://accounts.google.com/gsi/client';
let loading = null;

const loadGsi = () => {
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (!loading) {
    loading = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = GSI;
      s.async = true;
      s.onload = () => resolve(!!window.google?.accounts?.id);
      s.onerror = () => {
        loading = null;
        resolve(false);
      };
      document.head.appendChild(s);
    });
  }
  return loading;
};

const line = { flex: 1, height: 1, background: '#EDE5D3' };
const linkBtn = { border: 'none', background: 'none', padding: 0, color: 'var(--goldd)', fontWeight: 700 };

export default function GoogleLogin({ done, text = 'continue_with', onPending }) {
  const box = useRef(null);
  const handler = useRef(null);
  const [state, setState] = useState('loading');
  const [pending, setPending] = useState(null);
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { loginWithGoogle } = useAuth();

  const handle = async (credential, ph) => {
    setErr('');
    setBusy(true);
    try {
      const r = await loginWithGoogle(credential, ph);
      if (r.needPhone) {
        setPending({ ...r, credential });
        onPending?.(true);
        setBusy(false);
        return;
      }
      done();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  useEffect(() => {
    handler.current = handle;
  });

  useEffect(() => {
    let off = false;
    (async () => {
      let id;
      try {
        id = (await getGoogleConfig()).clientId;
      } catch {
        if (!off) setState('failed');
        return;
      }
      if (off) return;
      if (!id) return setState('off');
      const ok = await loadGsi();
      if (off) return;
      if (!ok || !box.current) return setState('failed');
      window.google.accounts.id.initialize({
        client_id: id,
        callback: (r) => handler.current(r.credential),
        ux_mode: 'popup',
      });
      window.google.accounts.id.renderButton(box.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text,
        logo_alignment: 'center',
        width: Math.max(220, Math.min(400, box.current.offsetWidth || 340)),
      });
      setState('ready');
    })();
    return () => {
      off = true;
    };
  }, [text]);

  const finish = (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) return setErr('Phone number must be 10 digits.');
    handle(pending.credential, phone);
  };

  const cancel = () => {
    setPending(null);
    onPending?.(false);
    setPhone('');
    setErr('');
  };

  return (
    <div style={{ marginTop: 18 }}>
      {pending && (
        <form onSubmit={finish}>
          <div className="hint" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {pending.picture && <img src={pending.picture} alt="" width="40" height="40" referrerPolicy="no-referrer" style={{ borderRadius: '50%' }} />}
            <span>Welcome, <b>{pending.name}</b>!<br /><span className="mut">{pending.email}</span></span>
          </div>
          <p className="small mut" style={{ marginBottom: 10 }}>One last step: add your phone number to create your WonderWorld account.</p>
          <label>Phone
            <input required autoFocus inputMode="numeric" maxLength="10" placeholder="10 digit number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
          </label>
          {err && <p className="err">{err}</p>}
          <button className="btn full" disabled={busy}>{busy ? 'Creating account...' : 'Create Account & Login'}</button>
          <p className="small center-t gap-top">Not you? <button type="button" style={linkBtn} onClick={cancel}>Use another Google account</button></p>
        </form>
      )}

      <div style={{ display: pending ? 'none' : 'block' }}>
        <div ref={box} style={{ display: 'flex', justifyContent: 'center', minHeight: state === 'ready' ? 44 : 0, opacity: busy ? 0.5 : 1, pointerEvents: busy ? 'none' : 'auto' }} />
        {state === 'loading' && <p className="small mut center-t">Loading Google sign-in...</p>}
        {state === 'off' && <div className="hint" style={{ margin: 0 }}>Google sign-in is not set up yet. Add <b>GOOGLE_CLIENT_ID</b> to <b>srv/.env</b> and restart the server.</div>}
        {state === 'failed' && <div className="hint" style={{ margin: 0 }}>Could not load Google sign-in. Please check your internet connection and refresh the page.</div>}
        {busy && <p className="small mut center-t" style={{ marginTop: 8 }}>Signing you in...</p>}
        {err && !pending && <p className="err center-t">{err}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 4px', color: 'var(--mut)', fontSize: 13, fontWeight: 700 }}>
          <span style={line} />or use<span style={line} />
        </div>
      </div>
    </div>
  );
}