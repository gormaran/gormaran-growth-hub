import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span>⚡</span>
              <span className="gradient-text">Gormaran</span>
            </Link>
            <p>The AI-powered growth hub for marketers, founders, and agencies. Built to help you move faster and grow smarter.</p>
            <div className="footer__social">
              <a href="#" aria-label="Twitter" className="footer__social-link">𝕏</a>
              <a href="#" aria-label="LinkedIn" className="footer__social-link">in</a>
            </div>
          </div>

          <div className="footer__col">
            <h4>Product</h4>
            <Link to="/pricing">Pricing</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/auth?mode=register">Get Started</Link>
          </div>

          <div className="footer__col">
            <h4>Tools</h4>
            <Link to="/dashboard">Marketing & Growth</Link>
            <Link to="/dashboard">Business Strategy</Link>
            <Link to="/dashboard">Content Creation</Link>
            <Link to="/dashboard">E-commerce</Link>
          </div>

          <div className="footer__col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} Gormaran AI Growth Hub. All rights reserved.</p>
          <p>Powered by Claude AI</p>
        </div>
      </div>
    </footer>
  );
}
