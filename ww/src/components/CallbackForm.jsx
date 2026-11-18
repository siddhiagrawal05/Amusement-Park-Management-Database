import { useState } from 'react';
import { createSupportRequest } from '../api';
import { useAuth } from '../auth';

const CB_TOPICS = ['Booking', 'Payment', 'Cancellation / Refund', 'Rides', 'Lost & Found', 'Other'];
const TIMES = ['Anytime', 'Morning (9 AM – 12 PM)', 'Afternoon (12 PM – 4 PM)', 'Evening (4 PM – 9 PM)'];

// "Request a call back" form, used on the Help page and inside the chatbot (compact)
export default function CallbackForm({ compact = false, onDone }) {
  const { user } = useAuth();
  const [f, setF] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    topic: CB_TOPICS[0],
    preferredTime: TIMES[0],
    message: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.name.trim()) return setErr('Please enter your name.');
    if (!/^\d{10}$/.test(f.phone)) return setErr('Phone number must be 10 digits.');
    setBusy(true);
    try {
      const r = await createSupportRequest(f);
      setDoneId(r.id);
      if (onDone) onDone(r.id);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };

  if (doneId && !compact) {
    return (
      <div className="ok-msg">
        Request #{doneId} received! Our team will call you on {f.phone} ({f.preferredTime}).
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? '' : 'fgrid'}>
      <label>Name<input value={f.name} onChange={set('name')} required /></label>
      <label>Phone<input value={f.phone} onChange={set('phone')} placeholder="10 digit number" required /></label>
      {!compact && <label>Email (optional)<input type="email" value={f.email} onChange={set('email')} /></label>}
      <label>Topic
        <select value={f.topic} onChange={set('topic')}>
          {CB_TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      {!compact && (
        <label>Best time to call
          <select value={f.preferredTime} onChange={set('preferredTime')}>
            {TIMES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
      )}
      <label className={compact ? '' : 'span'}>Describe your issue
        <textarea rows={compact ? 2 : 3} value={f.message} onChange={set('message')} placeholder="Tell us briefly what went wrong" />
      </label>
      {err && <p className="err span">{err}</p>}
      <div className={compact ? '' : 'span'}>
        <button className={`btn ${compact ? 'sm full' : ''}`} disabled={busy}>
          {busy ? 'Sending...' : 'Request Call Back'}
        </button>
      </div>
    </form>
  );
}