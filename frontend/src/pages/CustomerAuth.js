import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

const emptySignup = {
  name: '',
  phone: '',
  email: '',
  password: '',
  gender: ''
};

const normalizePhone = (value) => value.replace(/\D/g, '').slice(0, 10);

export default function CustomerAuth() {
  const { loginCustomer, signupCustomer } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [loading, setLoading] = useState(false);

  const handleSignin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await loginCustomer(loginForm.email, loginForm.password);
      toast.success('Signed in successfully');
      navigate('/customer');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to sign in'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signupCustomer(signupForm);
      toast.success('Account created successfully');
      navigate('/customer');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to sign up'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card customer-auth-card">
        <div className="login-logo">
          <h1>SalonPro</h1>
          <p>Customer Portal</p>
        </div>

        <div className="auth-switch">
          <button
            type="button"
            className={`auth-switch-btn${mode === 'signin' ? ' active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-switch-btn${mode === 'signup' ? ' active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signin' ? (
          <form onSubmit={handleSignin}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="Enter email"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              />
            </div>
            <button className="btn btn-primary customer-auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                required
                placeholder="Your full name"
                value={signupForm.name}
                onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                required
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                title="Phone number must be 10 digits"
                placeholder="Enter mobile number"
                value={signupForm.phone}
                onChange={(event) => setSignupForm({ ...signupForm, phone: normalizePhone(event.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="Enter email"
                value={signupForm.email}
                onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={signupForm.password}
                onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Gender (optional)</label>
              <select
                value={signupForm.gender}
                onChange={(event) => setSignupForm({ ...signupForm, gender: event.target.value })}
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button className="btn btn-primary customer-auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="customer-auth-footer">
          Salon staff? <Link to="/admin/login">Go to admin sign in</Link>
        </p>
      </div>
    </div>
  );
}
0
