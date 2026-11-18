import { useEffect, useState } from 'react';
import { FaLock, FaTimes, FaMobileAlt, FaUniversity, FaCheckCircle, FaQrcode, FaRedo } from 'react-icons/fa';
import { inr } from '../api';

// Simulated payment window (no real money, no card details collected)
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'];

const overlay = { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(14,36,99,.65)' };
const box = { position: 'relative', width: '100%', maxWidth: 440, maxHeight: '95vh', overflowY: 'auto', background: '#fff', borderRadius: 24, boxShadow: '0 30px 60px rgba(0,0,0,.35)' };
const head = { padding: '22px 24px', background: 'linear-gradient(135deg, #1E44A8, #0E2463)', color: '#fff' };
const tabBtn = (on) => ({ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, border: 'none', borderBottom: `3px solid ${on ? '#E9A23B' : 'transparent'}`, background: '#fff', fontWeight: 700, fontSize: 14, color: on ? '#1E44A8' : '#6F6A62' });

const newRef = () => 'WWQR' + Math.random().toString(36).slice(2, 10).toUpperCase();

export default function DemoPay({ amount, onPaid, onClose }) {
  const [tab, setTab] = useState('qr');
  const [upi, setUpi] = useState('');
  const [bank, setBank] = useState(BANKS[0]);
  const [err, setErr] = useState('');
  const [stage, setStage] = useState('form'); // form | processing | done
  const [ref, setRef] = useState(newRef);
  const [left, setLeft] = useState(300); // 5-minute QR timer

  // Count down the QR timer
  useEffect(() => {
    if (stage !== 'form') return;
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [stage]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  // Demo QR content (not a real UPI link, so real apps cannot send money)
  const qrData = `WONDERWORLD DEMO PAYMENT | Ref ${ref} | Amount ${inr(amount)} | Test only, no real money`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(qrData)}`;

  const refreshQr = () => {
    setRef(newRef());
    setLeft(300);
    setErr('');
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const pay = async (result) => {
    setErr('');
    if (tab === 'upi' && !/^[\w.-]+@[a-zA-Z]+$/.test(upi.trim())) {
      return setErr('Enter a valid UPI ID, for example success@demo');
    }
    if (tab === 'qr' && left === 0) {
      return setErr('This QR code has expired. Click Refresh QR.');
    }
    setStage('processing');
    await wait(1500);
    const failed = tab === 'upi' ? upi.trim().toLowerCase().startsWith('failure') : result === 'fail';
    if (failed) {
      setStage('form');
      return setErr('Payment failed (demo). Please try again.');
    }
    setStage('done');
    await wait(800);
    onPaid(tab === 'qr' ? 'UPI QR' : tab === 'upi' ? 'UPI' : 'Net Banking');
  };

  const switchTab = (t) => {
    setTab(t);
    setErr('');
  };

  return (
    <div style={overlay}>
      <div style={box}>
        <div style={head}>
          {stage === 'form' && (
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 20 }}>
              <FaTimes />
            </button>
          )}
          <div style={{ fontFamily: "'Lilita One', cursive", fontSize: 24 }}>WonderWorld Pay</div>
          <div style={{ opacity: 0.85, fontSize: 14 }}>Amount to pay</div>
          <div style={{ fontFamily: "'Lilita One', cursive", fontSize: 34, color: '#F5B84A' }}>{inr(amount)}</div>
        </div>

        <div style={{ background: '#FEF3C7', color: '#92400E', padding: '8px 24px', fontSize: 13, fontWeight: 700 }}>
          DEMO MODE · No real money is charged
        </div>

        {stage === 'processing' && (
          <div style={{ padding: 48, textAlign: 'center', fontWeight: 700, color: '#1E44A8' }}>Processing payment...</div>
        )}

        {stage === 'done' && (
          <div style={{ padding: 40, textAlign: 'center', color: '#16a34a' }}>
            <FaCheckCircle style={{ fontSize: 56 }} />
            <p style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}>Payment successful!</p>
          </div>
        )}

        {stage === 'form' && (
          <>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <button style={tabBtn(tab === 'qr')} onClick={() => switchTab('qr')}><FaQrcode /> Scan QR</button>
              <button style={tabBtn(tab === 'upi')} onClick={() => switchTab('upi')}><FaMobileAlt /> UPI ID</button>
              <button style={tabBtn(tab === 'nb')} onClick={() => switchTab('nb')}><FaUniversity /> Net Banking</button>
            </div>

            <div style={{ padding: 24 }}>
              {/* ---------- Scan QR ---------- */}
              {tab === 'qr' && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, color: '#1E44A8' }}>Scan with any UPI app</p>
                  <p className="small mut">GPay · PhonePe · Paytm · BHIM</p>

                  <div style={{ position: 'relative', width: 220, height: 220, margin: '14px auto', border: '2px dashed #E9A23B', borderRadius: 16, overflow: 'hidden' }}>
                    <img src={qrSrc} alt="Payment QR code" width="220" height="220" style={{ opacity: left === 0 ? 0.15 : 1 }} />
                    {left === 0 && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 700 }}>
                        QR expired
                        <button className="btn sm" onClick={refreshQr}><FaRedo /> Refresh QR</button>
                      </div>
                    )}
                  </div>

                  <p className="small">
                    {left > 0 ? <>QR valid for <b>{mm}:{ss}</b></> : 'QR code expired'}
                  </p>
                  <p className="small mut">Ref: {ref}</p>

                  {err && <p className="err">{err}</p>}
                  <p className="small mut" style={{ marginTop: 10 }}>Demo: after "scanning", choose what happened.</p>
                  <div className="row" style={{ marginTop: 10 }}>
                    <button className="btn" style={{ flex: 1 }} onClick={() => pay('success')}>Payment Done</button>
                    <button className="btn red" style={{ flex: 1 }} onClick={() => pay('fail')}>Payment Failed</button>
                  </div>
                </div>
              )}

              {/* ---------- UPI ID ---------- */}
              {tab === 'upi' && (
                <>
                  <label>UPI ID
                    <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="success@demo" />
                  </label>
                  <p className="small mut">Use <b>success@demo</b> for a successful payment or <b>failure@demo</b> to test a failure.</p>
                  {err && <p className="err">{err}</p>}
                  <button className="btn full" onClick={() => pay()}><FaLock /> Pay {inr(amount)}</button>
                </>
              )}

              {/* ---------- Net Banking ---------- */}
              {tab === 'nb' && (
                <>
                  <label>Choose your bank
                    <select value={bank} onChange={(e) => setBank(e.target.value)}>
                      {BANKS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                  <p className="small mut">Demo bank page: choose what should happen.</p>
                  {err && <p className="err">{err}</p>}
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn" style={{ flex: 1 }} onClick={() => pay('success')}>Success</button>
                    <button className="btn red" style={{ flex: 1 }} onClick={() => pay('fail')}>Failure</button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}