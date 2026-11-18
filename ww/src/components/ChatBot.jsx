import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCommentDots, FaTimes, FaPaperPlane, FaRobot, FaRedo } from 'react-icons/fa';
import { all, inr } from '../api';
import { useAuth } from '../auth';
import CallbackForm from './CallbackForm';
import { FAQS, TOPICS, SUPPORT_PHONE, SUPPORT_TEL, SUPPORT_EMAIL, SUPPORT_HOURS } from '../helpData';

// Quick-reply buttons
const MENU = [
  ...TOPICS.map((c) => ({ label: c, action: 'topic', value: c })),
  { label: 'My booking status', action: 'status' },
  { label: 'Talk to a person', action: 'person' },
];
const HELPFUL = [
  { label: 'Yes, that helped', action: 'yes' },
  { label: 'No, I need more help', action: 'no' },
];
const CONTACT = [
  { label: 'Request a call back', action: 'callback' },
  { label: 'Call us now', action: 'call' },
  { label: 'Email us', action: 'email' },
];
const BACK = [{ label: 'Back to menu', action: 'menu' }];

// Styles
const fab = { position: 'fixed', right: 24, bottom: 24, zIndex: 90, display: 'flex', alignItems: 'center', gap: 8, padding: '14px 22px', border: 'none', borderRadius: 40, background: 'linear-gradient(180deg, #F5B84A, #E9A23B)', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 10px 25px rgba(201,131,28,.45)' };
const panel = { position: 'fixed', right: 24, bottom: 24, zIndex: 95, width: 'min(370px, calc(100vw - 32px))', height: 'min(570px, calc(100vh - 110px))', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff', borderRadius: 22, boxShadow: '0 25px 60px rgba(14,36,99,.35)' };
const header = { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1E44A8, #0E2463)', color: '#fff' };
const iconBtn = { background: 'none', border: 'none', color: '#fff', fontSize: 16, padding: 6 };
const body = { flex: 1, overflowY: 'auto', padding: 14, background: '#F6F4EF' };
const bubbleBot = { background: '#fff', padding: '10px 12px', borderRadius: '14px 14px 14px 4px', maxWidth: '88%', fontSize: 14, lineHeight: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,.06)' };
const bubbleMe = { background: '#1E44A8', color: '#fff', padding: '10px 12px', borderRadius: '14px 14px 4px 14px', maxWidth: '80%', fontSize: 14 };
const chip = { padding: '6px 12px', border: '1.5px solid #E9A23B', borderRadius: 20, background: '#FFF4DE', color: '#1A1108', fontSize: 13, fontWeight: 600, textAlign: 'left' };
const linkStyle = { display: 'inline-block', marginTop: 8, color: '#C9831C', fontWeight: 700 };

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  // Bot reply with a short "typing" delay
  function bot(m) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((x) => [...x, { from: 'bot', ...m }]);
    }, 450);
  }

  function me(t) {
    setMsgs((x) => [...x, { from: 'me', text: t }]);
  }

  function restart() {
    setShowForm(false);
    const first = user ? ` ${user.name.split(' ')[0]}` : '';
    setMsgs([{ from: 'bot', text: `Hi${first}! I'm Wendy, your WonderWorld assistant. What can I help you with today?`, options: MENU }]);
  }

  // Start the conversation the first time the chat opens
  useEffect(() => {
    if (open && msgs.length === 0) restart();
  }, [open]);

  // Let other pages open the chat (Help page "Start chat" button)
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('open-chat', show);
    return () => window.removeEventListener('open-chat', show);
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing, showForm]);

  function answer(f) {
    bot({ title: f.q, text: f.a, options: HELPFUL });
  }

  function bookingStatus() {
    if (!user || user.role !== 'visitor') {
      return bot({ text: 'Please log in with your visitor account to check your bookings.', link: { to: '/login', label: 'Go to Login' }, options: BACK });
    }
    const list = [...all('bookings')].sort((a, b) => b.id - a.id);
    if (!list.length) {
      return bot({ text: "You don't have any bookings yet.", link: { to: '/tickets', label: 'Book tickets' }, options: BACK });
    }
    const b = list[0];
    bot({
      text: `Your latest booking ${b.bookingId} for ${b.visitDate} is ${b.status}. Amount: ${inr(b.total)}.`,
      link: { to: `/ticket/${b.bookingId}`, label: 'View ticket' },
      options: HELPFUL,
    });
  }

  function contactOptions() {
    bot({ text: "I'm sorry I couldn't solve that. How would you like to reach our support team?", options: CONTACT });
  }

  // When a quick-reply button is clicked
  function act(o) {
    me(o.label);
    setShowForm(false);
    switch (o.action) {
      case 'topic':
        bot({
          text: `Here are common questions about ${o.value}:`,
          options: FAQS.filter((f) => f.cat === o.value).map((f) => ({ label: f.q, action: 'faq', value: f.q })),
        });
        break;
      case 'faq':
        answer(FAQS.find((f) => f.q === o.value));
        break;
      case 'status':
        bookingStatus();
        break;
      case 'yes':
        bot({ text: 'Great! Is there anything else I can help you with?', options: MENU });
        break;
      case 'no':
      case 'person':
        contactOptions();
        break;
      case 'callback':
        bot({ text: 'Sure! Please share your details and our team will call you back.' });
        setTimeout(() => setShowForm(true), 500);
        break;
      case 'call':
        bot({
          text: `Call our helpline at ${SUPPORT_PHONE}. We are available ${SUPPORT_HOURS}.`,
          link: { href: `tel:${SUPPORT_TEL}`, label: 'Call now' },
          options: BACK,
        });
        break;
      case 'email':
        bot({
          text: `Email us at ${SUPPORT_EMAIL}. We reply within 24 hours.`,
          link: { href: `mailto:${SUPPORT_EMAIL}`, label: 'Send email' },
          options: BACK,
        });
        break;
      default:
        bot({ text: 'What would you like help with?', options: MENU });
    }
  }

  // When the visitor types a question
  function send(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    me(t);
    setShowForm(false);
    const words = t.toLowerCase();

    if (/(call|human|agent|person|executive|customer care|complaint)/.test(words)) return contactOptions();
    if (/(my booking|booking status|my ticket status|status of my)/.test(words)) return bookingStatus();

    let best = null;
    let score = 0;
    for (const f of FAQS) {
      const s = f.keys.filter((k) => words.includes(k)).length;
      if (s > score) {
        score = s;
        best = f;
      }
    }
    if (best) answer(best);
    else bot({ text: "Sorry, I didn't understand that. Choose a topic below or talk to our team.", options: MENU });
  }

  if (!open) {
    return (
      <button className="no-print" style={fab} onClick={() => setOpen(true)}>
        <FaCommentDots /> Help
      </button>
    );
  }

  return (
    <div className="no-print" style={panel}>
      <div style={header}>
        <FaRobot style={{ fontSize: 26 }} />
        <div style={{ flex: 1 }}>
          <b>Wendy · WonderWorld Help</b>
          <div style={{ fontSize: 12, opacity: 0.85 }}>● Online · usually replies instantly</div>
        </div>
        <button style={iconBtn} title="Start again" onClick={restart}><FaRedo /></button>
        <button style={iconBtn} title="Close" onClick={() => setOpen(false)}><FaTimes /></button>
      </div>

      <div style={body}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            <div style={m.from === 'me' ? bubbleMe : bubbleBot}>
              {m.title && <b style={{ display: 'block', marginBottom: 4, color: '#1E44A8' }}>{m.title}</b>}
              {m.text}
              {m.link && (m.link.to ? (
                <div><Link to={m.link.to} style={linkStyle} onClick={() => setOpen(false)}>{m.link.label} →</Link></div>
              ) : (
                <div><a href={m.link.href} style={linkStyle}>{m.link.label} →</a></div>
              ))}
              {m.options && i === msgs.length - 1 && !typing && !showForm && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {m.options.map((o) => (
                    <button key={o.label} style={chip} onClick={() => act(o)}>{o.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && <div style={{ ...bubbleBot, width: 'fit-content', color: '#6F6A62' }}>Wendy is typing...</div>}

        {showForm && (
          <div style={{ ...bubbleBot, maxWidth: '100%' }}>
            <CallbackForm
              compact
              onDone={(id) => {
                setShowForm(false);
                bot({ text: `Thank you! Your call back request #${id} is registered. Our team will call you within 2 hours (${SUPPORT_HOURS}).`, options: BACK });
              }}
            />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #eee' }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your question..." style={{ margin: 0 }} />
        <button className="btn sm" style={{ padding: '0 14px' }}><FaPaperPlane /></button>
      </form>
    </div>
  );
}