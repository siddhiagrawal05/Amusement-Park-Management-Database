import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaRocket, FaTicketAlt, FaListAlt, FaChartPie, FaSignInAlt, FaUserShield, FaSignOutAlt, FaStar } from 'react-icons/fa';
import { useAuth } from '../auth';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const items = [
    ['/', 'Home', FaHome],
    ['/rides', 'Rides', FaRocket],
    ['/tickets', 'Tickets', FaTicketAlt],
    ...(user?.role === 'visitor' ? [['/my-bookings', 'My Bookings', FaListAlt]] : []),
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
        {user && (
          <button className="nav-out" onClick={() => { logout(); nav('/'); }}>
            <FaSignOutAlt />
            <span>Logout ({user.name.split(' ')[0]})</span>
          </button>
        )}
      </div>

      <Link to="/tickets" className="book-tag">Book<br />Now</Link>
    </nav>
  );
}