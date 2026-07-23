import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Notification Manager</span>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Create
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'active' : '')}>
          Notifications
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
