import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { FaChartPie, FaRocket, FaCalendarCheck, FaUsers, FaClipboardList, FaFileInvoiceDollar, FaHeadset, FaHome, FaSignOutAlt, FaUtensils, FaTheaterMasks, FaDatabase, FaHamburger, FaTags, FaParking, FaUserClock, FaStar, FaSearch } from 'react-icons/fa';
import { useAuth } from '../auth';
import './admin.css';

const menu = [
  ['Overview', [
    ['/admin', 'Dashboard', FaChartPie],
    ['/admin/reports', 'Reports', FaFileInvoiceDollar],
    ['/admin/lab', 'SQL Lab', FaDatabase],
  ]],
  ['Park', [
    ['/admin/rides', 'Rides', FaRocket],
    ['/admin/schedules', 'Schedules & Maintenance', FaCalendarCheck],
    ['/admin/usage', 'Ride Usage', FaClipboardList],
    ['/admin/reviews', 'Ride Reviews', FaStar],
    ['/admin/capacity', 'Capacity & Parking', FaParking],
  ]],
  ['Plaza', [
    ['/admin/plaza', 'Central Plaza', FaUtensils],
    ['/admin/orders', 'Food Orders', FaHamburger],
    ['/admin/shows', 'Live Shows', FaTheaterMasks],
  ]],
  ['Sales', [
    ['/admin/offers', 'Offers & Passes', FaTags],
  ]],
  ['People', [
    ['/admin/staff', 'Employees', FaUsers],
    ['/admin/shifts', 'Staff Shifts', FaUserClock],
    ['/admin/help', 'Help Requests', FaHeadset],
    ['/admin/lost', 'Lost & Found', FaSearch],
  ]],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="admin">
      <aside className="side">
        <Link to="/" className="logo">Wonder<span>World</span></Link>
        <p className="mut-l">Admin Panel</p>
        {menu.map(([group, links]) => (
          <div key={group}>
            <p className="side-group">{group}</p>
            {links.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === '/admin'}><Icon /> {label}</NavLink>
            ))}
          </div>
        ))}
        <hr />
        <Link to="/"><FaHome /> View Website</Link>
        <button onClick={() => { logout(); nav('/admin/login'); }}><FaSignOutAlt /> Logout</button>
      </aside>

      <main className="main">
        <div className="topbar">
          <h2>Welcome, {user.name} 👋</h2>
          <span className="mut">{new Date().toDateString()}</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}