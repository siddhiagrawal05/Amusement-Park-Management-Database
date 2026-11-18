import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaRocket, FaTicketAlt, FaChartPie, FaSignInAlt, FaUserShield, FaSignOutAlt, FaStar, FaQuestionCircle, FaMapMarkedAlt, FaUtensils, FaTheaterMasks, FaIdCard, FaSearch } from 'react-icons/fa';
import { useAuth } from '../auth';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initials = (n = '') => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

  const items = [
    ['/', 'Home', FaHome],
    ['/rides', 'Rides', FaRocket],
    ['/map', 'Map', FaMapMarkedAlt],
    ['/plaza', 'Plaza', FaUtensils],
    ['/shows', 'Shows', FaTheaterMasks],
    ['/tickets', 'Tickets', FaTicketAlt],
    ['/passes', 'Passes', FaIdCard],
    ['/lost-found', 'Lost & Found', FaSearch],
    ['/help', 'Help', FaQuestionCircle],
    ...(user?.role === 'admin' ? [['/admin', 'Dashboard', FaChartPie]] : []),
    ...(!user ? [['/login', 'Login', FaSignInAlt], ['/admin/login', 'Admin', FaUserShield]] : []),
  ];

  return (
    <nav className="nav">
      <Link to="/" className="logo" onClick={() => setOpen(false)}>
        <FaStar className="star" />Wonder<span>World</span>
      </Link>

      <button className="menu-btn" onClick={() => setOpen(!open)}>{open ? <FaTimes /> : <FaBars />}</button>

      <div className={`links ${open ? 'show' : ''}`} onClick={() => setOpen(false)}>
        {items.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
        {user?.role === 'visitor' && (
          <NavLink to="/my-bookings" className="nav-me" title={`Logged in as ${user.email}`}>
            <span className="avatar">{initials(user.name)}</span>
            <span>Hi, {user.name.split(' ')[0]}</span>
          </NavLink>
        )}
        {user && (
          <button className="nav-out" onClick={() => { logout(); nav('/'); }}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        )}
      </div>

      <Link to="/tickets" className="book-tag">Book<br />Now</Link>
    </nav>
  );
}