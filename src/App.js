import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSEO } from './utils/seo';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CategoryPage from './pages/CategoryPage';
import PricingPage from './pages/PricingPage';
import SettingsPage from './pages/SettingsPage';
import RealTimeDataPage from './pages/RealTimeDataPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import HistoryPage from './pages/HistoryPage';
import BlogListPage from './pages/BlogListPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminBlogPage from './pages/AdminBlogPage';

import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import ReactGA from "react-ga4";

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname + location.search,
    });
  }, [location]);

  return null;
}


function ComingSoon({ page }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith('es');
  const label = isEs ? 'Próximamente' : 'Coming Soon';
  useSEO({
    title: page === 'Academy'
      ? 'Gormaran.io | AI Marketing Training & Courses'
      : `Gormaran.io | ${page}`,
    description: page === 'Academy'
      ? 'AI marketing courses, tutorials and guides. Master AI tools for growth. Coming soon.'
      : `${page} — Gormaran AI Growth Hub`,
    canonical: `https://gormaran.io/${page.toLowerCase()}`,
  });
  const desc = page === 'Academy'
    ? (isEs ? 'Cursos, tutoriales y guías para dominar el marketing con IA. Disponible muy pronto.' : 'Courses, tutorials and guides to master AI marketing. Available very soon.')
    : (isEs ? 'Artículos, estrategias y tendencias de marketing con IA escritos por el equipo de Gormaran.' : 'Articles, strategies and AI marketing trends written by the Gormaran team.');
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '3rem' }}>{page === 'Academy' ? '🎓' : '📝'}</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{page} — <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{label}</span></h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 480 }}>{desc}</p>
    </div>
  );
}

function AppLayout({ children, hideFooter }) {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}


export default function App() {
  return (
    <Router>
      <AnalyticsTracker />
      <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <WorkspaceProvider>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <AppLayout>
                  <LandingPage />
                </AppLayout>
              }
            />
            <Route
              path="/auth"
              element={<AuthPage />}
            />
            <Route
              path="/pricing"
              element={
                <AppLayout>
                  <PricingPage />
                </AppLayout>
              }
            />
            <Route
              path="/real-time-data"
              element={
                <AppLayout>
                  <RealTimeDataPage />
                </AppLayout>
              }
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/category/:categoryId"
              element={
                <ProtectedRoute>
                  <AppLayout hideFooter>
                    <CategoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <HistoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Legal pages */}
            <Route path="/privacy-policy" element={<AppLayout><PrivacyPolicy /></AppLayout>} />
            <Route path="/terms-of-service" element={<AppLayout><TermsOfService /></AppLayout>} />
            <Route path="/cookie-policy" element={<AppLayout><CookiePolicy /></AppLayout>} />

            {/* Admin blog — MUST be before /blog routes to avoid matching conflicts */}
            <Route
              path="/admin/blog"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AdminBlogPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/blog/:postId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AdminBlogPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Blog */}
            <Route path="/blog" element={<AppLayout><BlogListPage /></AppLayout>} />
            <Route path="/blog/:slug" element={<AppLayout><BlogPostPage /></AppLayout>} />

            <Route path="/academy" element={<AppLayout><ComingSoon page="Academy" /></AppLayout>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </WorkspaceProvider>
        </SubscriptionProvider>
      </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
