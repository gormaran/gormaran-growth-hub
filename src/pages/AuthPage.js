import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const { login, register, signInWithGoogle, currentUser, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (currentUser) navigate(from, { replace: true });
  }, [currentUser, navigate, from]);

  function clearForm() {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setSuccess('');
  }

  function switchMode(newMode) {
    setMode(newMode);
    clearForm();
    setShowForgot(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name.trim()) { setError('Please enter your name'); setLoading(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : err.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : err.message || 'Something went wrong';
      setError(msg);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    }
    setLoading(false);
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!email) { setError('Enter your email address first'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Password reset email sent. Check your inbox.');
      setShowForgot(false);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    }
    setLoading(false);
  }

  return (
    <div className="auth">
      {/* Background */}
      <div className="auth__bg">
        <div className="auth__orb auth__orb-1" />
        <div className="auth__orb auth__orb-2" />
      </div>

      <div className="auth__content">
        {/* Left panel (branding) */}
        <motion.div
          className="auth__left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="auth__brand">
            <span>⚡</span>
            <span className="gradient-text">Gormaran</span>
          </Link>
          <h2 className="auth__left-title">
            Grow Your Business
            <br />
            <span className="gradient-text">10x Faster</span>
          </h2>
          <p className="auth__left-desc">
            Join 2,000+ marketers, founders, and agencies using AI to create, strategize, and grow without limits.
          </p>
          <div className="auth__left-features">
            {[
              '✅ 7 AI-powered categories',
              '✅ 35+ precision-tuned tools',
              '✅ Real-time AI streaming',
              '✅ Start free — no credit card',
            ].map((f) => (
              <div key={f} className="auth__left-feature">{f}</div>
            ))}
          </div>
        </motion.div>

        {/* Auth card */}
        <motion.div
          className="auth__card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Tab switcher */}
          <div className="auth__tabs">
            <button
              className={`auth__tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              className={`auth__tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Get Started
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showForgot ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="auth__form-title">Reset Password</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Enter your email and we'll send you a reset link.
                </p>
                <form onSubmit={handleForgotPassword}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && <div className="alert alert-error">{error}</div>}
                  {success && <div className="alert alert-success">{success}</div>}
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Send Reset Link'}
                  </button>
                </form>
                <button className="auth__back-link" onClick={() => setShowForgot(false)}>
                  ← Back to Sign In
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="auth__form-title">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h3>

                {/* Google OAuth */}
                <button
                  type="button"
                  className="auth__google-btn"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="auth__divider">
                  <span>or continue with email</span>
                </div>

                <form onSubmit={handleSubmit}>
                  {mode === 'register' && (
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="John Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div className="auth__label-row">
                      <label className="form-label">Password</label>
                      {mode === 'login' && (
                        <button type="button" className="auth__forgot-link" onClick={() => setShowForgot(true)}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      className="form-input"
                      placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && <div className="alert alert-error">{error}</div>}
                  {success && <div className="alert alert-success">{success}</div>}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                    {loading ? (
                      <><span className="spinner" /> Processing...</>
                    ) : mode === 'login' ? (
                      'Sign In'
                    ) : (
                      'Create Account — Free'
                    )}
                  </button>
                </form>

                {mode === 'register' && (
                  <p className="auth__terms">
                    By creating an account you agree to our{' '}
                    <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
