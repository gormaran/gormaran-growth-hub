import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <img src="/TP-favicon-gormaran-SaaS.png" alt="Gormaran" className="footer__logo-img" />
              <span className="gradient-text">Gormaran</span>
            </Link>
            <p>{t('footer.brand.desc', { defaultValue: 'The AI-powered growth hub for freelances, marketers, agencies and founders. Built to help you move faster and grow smarter.' })}</p>
            <div className="footer__social">
              <a href="https://www.linkedin.com/in/gabrielaormazabal/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer__social-link">in</a>
              <a href="https://www.instagram.com/gormaran_marketing/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer__social-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer__col">
            <h4>{t('footer.product.title', { defaultValue: 'Product' })}</h4>
            <Link to="/pricing">{t('footer.product.pricing', { defaultValue: 'Pricing' })}</Link>
            <Link to="/dashboard">{t('footer.product.dashboard', { defaultValue: 'Dashboard' })}</Link>
            <Link to="/auth?mode=register">{t('footer.product.getStarted', { defaultValue: 'Get Started' })}</Link>
          </div>

          <div className="footer__col">
            <h4>{t('footer.tools.title', { defaultValue: 'Tools' })}</h4>
            <Link to="/category/marketing">{t('cat.marketing.name', { defaultValue: 'Marketing & Growth' })}</Link>
            <Link to="/category/strategy">{t('cat.strategy.name', { defaultValue: 'Business Strategy' })}</Link>
            <Link to="/category/content">{t('cat.content.name', { defaultValue: 'Content Creation' })}</Link>
            <Link to="/category/digital">{t('cat.digital.name', { defaultValue: 'Digital Marketing' })}</Link>
            <Link to="/category/ecommerce">{t('cat.ecommerce.name', { defaultValue: 'E-commerce Growth' })}</Link>
            <Link to="/category/agency">{t('cat.agency.name', { defaultValue: 'Agency Tools' })}</Link>
            <Link to="/category/startup">{t('cat.startup.name', { defaultValue: 'Startup Launchpad' })}</Link>
            <Link to="/category/creative">{t('cat.creative.name', { defaultValue: 'Creative Studio' })}</Link>
            <Link to="/category/finance">{t('cat.finance.name', { defaultValue: 'Finance & Investment' })}</Link>
            <Link to="/category/automation">{t('cat.automation.name', { defaultValue: 'n8n Automation' })}</Link>
          </div>

          <div className="footer__col">
            <h4>Gormaran</h4>
            <a href="https://gormaran-marketing.com" target="_blank" rel="noopener noreferrer">gormaran-marketing.com</a>
            <Link to="/privacy-policy">{t('footer.legal.privacy', { defaultValue: 'Privacy Policy' })}</Link>
            <Link to="/terms-of-service">{t('footer.legal.terms', { defaultValue: 'Terms of Service' })}</Link>
            <Link to="/cookie-policy">{t('footer.legal.cookies', { defaultValue: 'Cookie Policy' })}</Link>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} Gormaran AI Growth Hub. All rights reserved.</p>
          <p>AI-Powered Growth Tools</p>
        </div>
      </div>
    </footer>
  );
}
