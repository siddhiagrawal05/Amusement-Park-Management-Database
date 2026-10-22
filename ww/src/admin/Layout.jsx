import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { FaChartPie, FaRocket, FaCalendarCheck, FaUsers, FaClipboardList, FaFileInvoiceDollar, FaHome, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../auth';

const menu = [
  ['/admin', 'Dashboard', FaChartPie],
  ['/admin/rides', 'Rides', FaRocket],
  ['/admin/schedules', 'Schedules & Maintenance', FaCalendarCheck],
  ['/admin/staff', 'Employees', FaUsers],
  ['/admin/usage', 'Ride Usage', FaClipboardList],
  ['/admin/reports', 'Reports', FaFileInvoiceDollar],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="admin">
      <aside className="side">
        <Link to="/" className="logo">Wonder<span>World</span></Link>
        <p className="mut-l">Admin Panel</p>
        {menu.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end={to === '/admin'}><Icon /> {label}</NavLink>
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