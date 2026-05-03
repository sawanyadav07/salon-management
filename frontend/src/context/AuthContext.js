import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const getHomeByRole = (role) => (role === 'customer' ? '/customer' : '/admin');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuthSession = (token, sessionUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(sessionUser);
  };

  const clearAuthSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (token && token !== 'undefined' && savedUser) {
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      clearAuthSession();
    }

    setLoading(false);
  }, []);

  const loginStaff = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token, user: sessionUser } = res.data;

    if (sessionUser?.role === 'customer') {
      throw new Error('Use customer sign in for this account');
    }

    setAuthSession(token, sessionUser);
    return sessionUser;
  };

  const loginCustomer = async (email, password) => {
    const res = await axios.post('/api/customer-auth/login', { email, password });
    const { token, user: sessionUser } = res.data;
    setAuthSession(token, sessionUser);
    return sessionUser;
  };

  const signupCustomer = async (payload) => {
    const res = await axios.post('/api/customer-auth/signup', payload);
    const { token, user: sessionUser } = res.data;
    setAuthSession(token, sessionUser);
    return sessionUser;
  };

  const logout = () => {
    clearAuthSession();
  };

  // Auto-logout on 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      res => res,
      err => {
        const statusCode = err?.response?.status;
        const token = localStorage.getItem(TOKEN_KEY);

        if (statusCode === 401 && token) {
          const savedRole = JSON.parse(localStorage.getItem(USER_KEY) || '{}')?.role;
          clearAuthSession();
          window.location.href = savedRole === 'customer' ? '/customer/auth' : '/admin/login';
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginStaff,
        loginCustomer,
        signupCustomer,
        logout,
        getHomeByRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
