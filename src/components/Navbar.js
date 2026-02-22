import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { subscription } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const navLinks = currentUser
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/pricing', label: 'Pricing' },
      ]
    : [
        { to: '/#features', label: 'Features' },
        { to: '/pricing', label: 'Pricing' },
      ];

  const isActive = (to) => location.pathname === to;

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">⚡</span>
          <span className="navbar__logo-text">
            <span className="gradient-text">Gormaran</span>
            <span className="navbar__logo-sub">AI Growth Hub</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar__links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar__link ${isActive(link.to) ? 'navbar__link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right section */}
        <div className="navbar__right">
          {currentUser ? (
            <div className="navbar__user">
              <span className={`badge ${subscription === 'free' ? 'badge-free' : 'badge-pro'}`}>
                {subscription === 'free' ? 'Free' : subscription === 'pro' ? '⭐ Pro' : '💎 Business'}
              </span>
              <button
                className="navbar__avatar"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} />
                ) : (
                  <span>{(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}</span>
                )}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    className="navbar__dropdown"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="navbar__dropdown-header">
                      <strong>{currentUser.displayName || 'User'}</strong>
                      <small>{currentUser.email}</small>
                    </div>
                    <div className="navbar__dropdown-divider" />
                    <Link to="/dashboard" className="navbar__dropdown-item">📊 Dashboard</Link>
                    <Link to="/settings" className="navbar__dropdown-item">⚙️ Settings</Link>
                    <Link to="/pricing" className="navbar__dropdown-item">💳 Upgrade Plan</Link>
                    <div className="navbar__dropdown-divider" />
                    <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                      🚪 Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="navbar__auth">
              <Link to="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/auth?mode=register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="navbar__mobile-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`navbar__hamburger ${mobileOpen ? 'open' : ''}`}>
              <span /><span /><span />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="navbar__mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="navbar__mobile-link">
                {link.label}
              </Link>
            ))}
            {currentUser ? (
              <>
                <Link to="/settings" className="navbar__mobile-link">Settings</Link>
                <button className="navbar__mobile-link navbar__mobile-link--danger" onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="navbar__mobile-link">Sign In</Link>
                <Link to="/auth?mode=register" className="navbar__mobile-link navbar__mobile-link--cta">
                  Get Started Free
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for user menu */}
      {userMenuOpen && (
        <div className="navbar__backdrop" onClick={() => setUserMenuOpen(false)} />
      )}
    </motion.nav>
  );
}
