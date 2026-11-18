import { useState } from 'react';
import { FaSearch, FaPlus, FaMinus, FaCommentDots, FaPhoneAlt, FaEnvelope, FaHeadset } from 'react-icons/fa';
import { PICS } from '../api';
import Banner from '../components/Banner';
import CallbackForm from '../components/CallbackForm';
import { FAQS, TOPICS, SUPPORT_PHONE, SUPPORT_TEL, SUPPORT_EMAIL, SUPPORT_HOURS } from '../helpData';

export default function Help() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(null);

  const s = q.trim().toLowerCase();
  const list = FAQS.filter(
    (f) => (cat === 'All' || f.cat === cat) && (!s || `${f.q} ${f.a} ${f.keys.join(' ')}`.toLowerCase().includes(s))
  );

  return (
    <>
      <Banner img={PICS.hero3} title="Help Center" sub="Answers and support for a wonderful day" />

      {/* ---------- FAQs ---------- */}
      <section className="sec cream">
        <div className="head">
          <h2>How Can We <span className="hl">Help You?</span></h2>
        </div>

        <div className="search" style={{ maxWidth: 640, margin: '0 auto 24px', padding: '6px 20px' }}>
          <FaSearch />
          <input placeholder="Search e.g. refund, timings, parking" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="toolbar" style={{ justifyContent: 'center' }}>
          {['All', ...TOPICS].map((c) => (
            <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        <div className="faq">
          {list.map((f) => (
            <div className={`q ${open === f.q ? 'open' : ''}`} key={f.q}>
              <button onClick={() => setOpen(open === f.q ? null : f.q)}>
                <span>
                  {f.q}
                  <br />
                  <small className="mut">{f.cat}</small>
                </span>
                <i className="pm">{open === f.q ? <FaMinus /> : <FaPlus />}</i>
              </button>
              {open === f.q && <p className="ans">{f.a}</p>}
            </div>
          ))}
        </div>
        {!list.length && <p className="center-t">No questions found. Try different words or contact us below.</p>}
      </section>

      {/* ---------- Contact options ---------- */}
      <section className="sec">
        <div className="head">
          <h2>Still Need <span className="hl">Help?</span></h2>
          <p className="mut">Our support team is available {SUPPORT_HOURS}</p>
        </div>

        <div className="grid4" style={{ marginBottom: 40 }}>
          <div className="card info">
            <FaCommentDots />
            <h3>Chat with Wendy</h3>
            <p className="mut small">Instant answers from our virtual assistant, any time.</p>
            <button className="btn sm gap-top" onClick={() => window.dispatchEvent(new Event('open-chat'))}>Start chat</button>
          </div>
          <div className="card info">
            <FaPhoneAlt />
            <h3>Call Us</h3>
            <p className="mut small">{SUPPORT_PHONE}<br />{SUPPORT_HOURS}</p>
            <a href={`tel:${SUPPORT_TEL}`} className="btn sm gap-top">Call now</a>
          </div>
          <div className="card info">
            <FaEnvelope />
            <h3>Email Us</h3>
            <p className="mut small">{SUPPORT_EMAIL}<br />Reply within 24 hours</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn sm gap-top">Send email</a>
          </div>
          <div className="card info">
            <FaHeadset />
            <h3>Call Back</h3>
            <p className="mut small">Leave your number and we will call you within 2 hours.</p>
            <a href="#callback" className="btn sm gap-top">Request call back</a>
          </div>
        </div>

        <div id="callback" className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
          <h3 className="h"><FaHeadset /> Request a Call Back</h3>
          <p className="mut small mb">Tell us your issue and the best time to call. Our team will contact you.</p>
          <CallbackForm />
        </div>
      </section>
    </>
  );
}