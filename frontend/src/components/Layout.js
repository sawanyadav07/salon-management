import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/',            label: 'Dashboard',    icon: '📊' },
  { path: '/appointments',label: 'Appointments', icon: '📅' },
  { path: '/customers',   label: 'Customers',    icon: '👥' },
  { path: '/services',    label: 'Services',     icon: '✂️'  },
  { path: '/staff',       label: 'Staff',        icon: '👤' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>✂️</span> SalonPro
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            👤 {user?.name}<br />
            <small style={{ color: '#718096', textTransform: 'capitalize' }}>{user?.role}</small>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
