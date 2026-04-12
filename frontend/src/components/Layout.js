import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const navItems = [
  { path: '/',            label: 'Dashboard',    icon: '📊' },
  { path: '/appointments',label: 'Appointments', icon: '📅' },
  { path: '/customers',   label: 'Customers',    icon: '👥' },
  { path: '/services',    label: 'Services',     icon: '✂️'  },
  { path: '/staff',       label: 'Staff',        icon: '👤' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [openNotif, setOpenNotif] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleNotif = () => {
    setOpenNotif((o) => {
      const next = !o;
      if (!o) markAllRead();
      return next;
    });
  };

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
        <div className="topbar">
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <button className="icon-btn" onClick={toggleNotif} aria-label="Notifications">
              <span style={{ fontSize: '20px' }}>🔔</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            {openNotif && (
              <div className="notif-panel">
                <div className="notif-header">
                  <span>Notifications</span>
                  <button className="link-btn" onClick={markAllRead}>Mark all read</button>
                </div>
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="notif-item">
                      <div className="notif-title">{n.title || 'Notification'}</div>
                      <div className="notif-message">{n.message}</div>
                      <div className="notif-meta">{new Date(n.at || Date.now()).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
