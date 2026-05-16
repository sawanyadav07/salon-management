import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [openNotif, setOpenNotif] = useState(false);
  const firstName = user?.name?.split(' ')?.[0] || user?.name || 'Guest';
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleLogout = () => {
    logout();
    navigate('/customer/auth');
  };

  const toggleNotif = () => {
    setOpenNotif((open) => {
      const nextOpen = !open;
      if (nextOpen) markAllRead();
      return nextOpen;
    });
  };

  return (
    <div className="customer-shell">
      <div className="customer-shell-glow customer-shell-glow-top" />
      <div className="customer-shell-glow customer-shell-glow-bottom" />
      <header className="customer-header">
        <div className="customer-header-main">
          <p className="customer-brand">SalonPro Customer Experience</p>
          <h1>Hi, {firstName}</h1>
          <p className="customer-header-note">
            Plan your next salon visit, manage appointments, and stay updated in one place.
          </p>
        </div>
        <div className="customer-header-actions">
          <span className="customer-header-date">{todayLabel}</span>
          <div className="customer-notif-wrap">
            <button className="icon-btn customer-notif-btn" onClick={toggleNotif} aria-label="Notifications">
              <span style={{ fontSize: '18px' }}>{String.fromCodePoint(128276)}</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            {openNotif && (
              <div className="notif-panel customer-notif-panel">
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
          <button className="btn btn-secondary customer-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="customer-main">
        <Outlet />
      </main>
    </div>
  );
}
