import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/customer/auth');
  };

  return (
    <div className="customer-shell">
      <header className="customer-header">
        <div>
          <p className="customer-brand">SalonPro Customer</p>
          <h1>Hello, {user?.name}</h1>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
      </header>
      <main className="customer-main">
        <Outlet />
      </main>
    </div>
  );
}
