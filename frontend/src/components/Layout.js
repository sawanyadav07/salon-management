import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const navItems = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/appointments', label: 'Appointments' },
  { path: '/admin/customers', label: 'Customers' },
  { path: '/admin/services', label: 'Services' },
  { path: '/admin/staff', label: 'Staff' }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [openNotif, setOpenNotif] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    setOpenNotif(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('mobile-nav-open', sidebarOpen);
    return () => document.body.classList.remove('mobile-nav-open');
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleNotif = () => {
    setOpenNotif((open) => {
      const nextOpen = !open;
      if (nextOpen) markAllRead();
      return nextOpen;
    });
  };

  const activeNavLabel = navItems.find((item) => {
    if (item.path === '/admin') return location.pathname === '/admin';
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  })?.label || 'Dashboard';

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className={`layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <span>SalonPro</span>
          <small>Admin Suite</small>
        </div>
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          Close
        </button>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            {user?.name}
            <br />
            <small style={{ color: '#718096', textTransform: 'capitalize' }}>{user?.role}</small>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="main-content admin-main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-btn mobile-menu-btn"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
            >
              Menu
            </button>
            <div className="topbar-title-wrap">
              <p className="topbar-eyebrow">SalonPro Admin</p>
              <h2 className="topbar-title">{activeNavLabel}</h2>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="topbar-date-chip">{todayLabel}</span>
            <div className="topbar-user-chip">
              <span className="topbar-user-dot">{initial}</span>
              <div className="topbar-user-meta">
                <strong>{user?.name || 'Admin'}</strong>
                <small style={{ textTransform: 'capitalize' }}>{user?.role}</small>
              </div>
            </div>
            <button className="icon-btn" onClick={toggleNotif} aria-label="Notifications">
              <span style={{ fontSize: '20px' }}>{String.fromCodePoint(128276)}</span>
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
                  notifications.map((item) => (
                    <div key={item.id} className="notif-item">
                      <div className="notif-title">{item.title || 'Notification'}</div>
                      <div className="notif-message">{item.message}</div>
                      <div className="notif-meta">{new Date(item.at || Date.now()).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="admin-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
