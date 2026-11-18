import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import Foot from './components/Foot';
import Guard from './components/Guard';
import ChatBot from './components/ChatBot';
import Home from './pages/Home';
import Rides from './pages/Rides';
import ParkMap from './pages/ParkMap';
import Plaza from './pages/Plaza';
import Shows from './pages/Shows';
import Tickets from './pages/Tickets';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBookings from './pages/MyBookings';
import Ticket from './pages/Ticket';
import Help from './pages/Help';
import Layout from './admin/Layout';
import Dash from './admin/Dash';
import ARides from './admin/ARides';
import Sched from './admin/Sched';
import Staff from './admin/Staff';
import Usage from './admin/Usage';
import Reports from './admin/Reports';
import Support from './admin/Support';
import PlazaAdmin from './admin/PlazaAdmin';
import ShowsAdmin from './admin/ShowsAdmin';
import SqlLab from './admin/SqlLab';
import FoodOrders from './admin/FoodOrders';
import Offers from './admin/Offers';
import Capacity from './admin/Capacity';
import Shifts from './admin/Shifts';
import Reviews from './admin/Reviews';
import LostFound from './admin/LostFound';

function Site() {
  return (
    <>
      <Nav />
      <Outlet />
      <Foot />
      <ChatBot />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Site />}>
        <Route path="/" element={<Home />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/map" element={<ParkMap />} />
        <Route path="/plaza" element={<Plaza />} />
        <Route path="/shows" element={<Shows />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/help" element={<Help />} />
        <Route path="/login" element={<Login key="v" role="visitor" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<Login key="a" role="admin" />} />
        <Route path="/my-bookings" element={<Guard role="visitor"><MyBookings /></Guard>} />
        <Route path="/ticket/:id" element={<Guard role="visitor"><Ticket /></Guard>} />
      </Route>
      <Route path="/admin" element={<Guard role="admin"><Layout /></Guard>}>
        <Route index element={<Dash />} />
        <Route path="rides" element={<ARides />} />
        <Route path="schedules" element={<Sched />} />
        <Route path="staff" element={<Staff />} />
        <Route path="usage" element={<Usage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="help" element={<Support />} />
        <Route path="plaza" element={<PlazaAdmin />} />
        <Route path="shows" element={<ShowsAdmin />} />
        <Route path="lab" element={<SqlLab />} />
        <Route path="orders" element={<FoodOrders />} />
        <Route path="offers" element={<Offers />} />
        <Route path="capacity" element={<Capacity />} />
        <Route path="shifts" element={<Shifts />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="lost" element={<LostFound />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}