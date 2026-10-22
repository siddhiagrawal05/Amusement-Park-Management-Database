import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaYoutube, FaLinkedin, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaStar } from 'react-icons/fa';

export default function Foot() {
  return (
    <footer className="foot">
      <div className="foot-grid">
        <div>
          <div className="logo"><FaStar className="star" />Wonder<span>World</span></div>
          <p className="tagline">India's most exciting amusement park. Thrills, smiles and memories for every age.</p>
          <div className="social"><FaFacebook /><FaInstagram /><FaYoutube /><FaLinkedin /></div>
          <h4>Contact Us</h4>
          <p><FaEnvelope /> hello@wonderworld.in</p>
          <p><FaPhoneAlt /> +91 98765 43210</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/rides">All Rides</Link>
          <Link to="/rides?cat=Thrill">Thrill Zone</Link>
          <Link to="/rides?cat=Water">Water Kingdom</Link>
          <Link to="/rides?cat=Family">Family Fun</Link>
          <Link to="/rides?cat=Kids">Kids Land</Link>
        </div>
        <div>
          <h4>Guest Info</h4>
          <Link to="/tickets">Tickets</Link>
          <Link to="/my-bookings">My Bookings</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/admin/login">Admin Login</Link>
        </div>
        <div>
          <h4>Address & Timings</h4>
          <p><FaMapMarkerAlt /> WonderWorld Road, Near Expressway, Pune 410000</p>
          <p><FaClock /> Mon – Fri: 10:30 AM – 6:00 PM</p>
          <p><FaClock /> Sat – Sun: 10:00 AM – 8:00 PM</p>
        </div>
      </div>
      <p className="copy">© {new Date().getFullYear()} WonderWorld Amusement Park. All rights reserved.</p>
    </footer>
  );
}