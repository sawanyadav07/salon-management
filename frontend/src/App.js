import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import CustomerLayout from './components/CustomerLayout';
import Login from './pages/Login';
import CustomerAuth from './pages/CustomerAuth';
import CustomerPortal from './pages/CustomerPortal';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Customers from './pages/Customers';
import Services from './pages/Services';
import Staff from './pages/Staff';
import './App.css';

const Loader = () => <div className="loader">Loading...</div>;

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading, getHomeByRole } = useAuth();
  if (loading) return <div className="loader">Loading...</div>;

  if (!user) return <Navigate to="/customer/auth" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeByRole(user.role)} replace />;
  }

  return children;
};

const GuestRoute = ({ children }) => {
  const { user, loading, getHomeByRole } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to={getHomeByRole(user.role)} replace />;
  return children;
};

const RootRoute = () => {
  const { user, loading, getHomeByRole } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to={getHomeByRole(user.role)} replace />;
  return <Navigate to="/customer/auth" replace />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } />
            <Route path="/customer/auth" element={
              <GuestRoute>
                <CustomerAuth />
              </GuestRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="customers" element={<Customers />} />
              <Route path="services" element={<Services />} />
              <Route path="staff" element={<Staff />} />
            </Route>

            <Route path="/customer" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<CustomerPortal />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
