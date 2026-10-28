import React, { useState } from 'react';
import Logo from './Logo';
import { loginUser, registerUser } from '../apiService';

export default function LoginRegister({
  authenticatedUser,
  setAuthenticatedUser,
  setActivePage,
  authViewMode = 'login',
  setAuthViewMode,
  handleSignOut
}) {
  const [isRegister, setIsRegister] = useState(authViewMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (toRegister) => {
    setIsRegister(toRegister);
    if (setAuthViewMode) {
      setAuthViewMode(toRegister ? 'register' : 'login');
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginUser(email, password);
      setAuthenticatedUser(user);

      // Role-based landing page
      const role = (user.role || '').toLowerCase();
      const portal = (user.portal || '').toLowerCase();

      if (portal === 'admin' || role.includes('admin')) {
        setActivePage('Dashboards');
      } else if (portal === 'department' || role.includes('officer')) {
        setActivePage('Dashboards');
      } else {
        setActivePage('Home');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await registerUser(name, email, password, mobile);
      setAuthenticatedUser(user);
      setActivePage('Home');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (authenticatedUser) {
    return (
      <div className="container py-5 text-center">
        <div className="card rc-card border-0 rounded-4 shadow-sm p-4 mx-auto text-start" style={{ maxWidth: '480px' }}>
          <h4 className="fw-bold text-secondary mb-2">Already Signed In</h4>
          <p className="text-muted small mb-4">
            You are logged in as <strong>{authenticatedUser.name || authenticatedUser.fullName}</strong> ({authenticatedUser.email}) &bull; <span className="badge bg-primary">{authenticatedUser.role}</span>
          </p>
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary btn-sm rounded-pill px-4"
              onClick={() => setActivePage('Dashboards')}
            >
              Go to Dashboard
            </button>
            <button
              className="btn btn-outline-danger btn-sm rounded-pill px-4"
              onClick={handleSignOut}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card rc-card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white text-start">
            {/* Header / Brand */}
            <div className="text-center mb-4">
              <div className="d-inline-block mb-3">
                <Logo width={56} height={56} showText={false} />
              </div>
              <h3 className="fw-bold text-secondary mb-1">
                {isRegister ? 'Create Citizen Account' : 'Welcome to RajCivic'}
              </h3>
              <p className="text-muted small">
                {isRegister
                  ? 'Sign up to lodge and track municipal grievances online'
                  : 'Enter your credentials to access your account'}
              </p>
            </div>

            {errorMsg && (
              <div className="alert alert-danger rounded-3 py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-circle-fill"></i>
                <div>{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success rounded-3 py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill"></i>
                <div>{successMsg}</div>
              </div>
            )}

            {!isRegister ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary mb-1">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0">
                      <i className="bi bi-envelope text-muted"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control bg-light border-0 py-2 small"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary mb-1">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0">
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-light border-0 py-2 small"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-group-text bg-light border-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 rounded-pill fw-semibold shadow-sm mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="text-center">
                  <span className="text-muted small">Don't have an account? </span>
                  <button
                    type="button"
                    className="btn btn-link p-0 small fw-bold text-primary text-decoration-none"
                    onClick={() => switchMode(true)}
                  >
                    Register as Citizen
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER FORM (Citizen) */
              <form onSubmit={handleRegisterSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary mb-1">Full Name *</label>
                  <input
                    type="text"
                    className="form-control bg-light border-0 py-2 small"
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary mb-1">Email Address *</label>
                  <input
                    type="email"
                    className="form-control bg-light border-0 py-2 small"
                    placeholder="ramesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    className="form-control bg-light border-0 py-2 small"
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary mb-1">Password *</label>
                  <input
                    type="password"
                    className="form-control bg-light border-0 py-2 small"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    className="form-control bg-light border-0 py-2 small"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 rounded-pill fw-semibold shadow-sm mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Registering...
                    </span>
                  ) : (
                    'Register Account'
                  )}
                </button>

                <div className="text-center">
                  <span className="text-muted small">Already registered? </span>
                  <button
                    type="button"
                    className="btn btn-link p-0 small fw-bold text-primary text-decoration-none"
                    onClick={() => switchMode(false)}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
