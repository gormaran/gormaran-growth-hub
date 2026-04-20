import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
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
import AcademyPage from './pages/AcademyPage';
import SuccessStoriesPage from './pages/SuccessStoriesPage';
import BlogPage from './pages/BlogPage';

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

            {/* Content pages */}
            <Route path="/academy" element={<AppLayout><AcademyPage /></AppLayout>} />
            <Route path="/success-stories" element={<AppLayout><SuccessStoriesPage /></AppLayout>} />
            <Route path="/blog" element={<AppLayout><BlogPage /></AppLayout>} />

            {/* Legal pages */}
            <Route path="/privacy-policy" element={<AppLayout><PrivacyPolicy /></AppLayout>} />
            <Route path="/terms-of-service" element={<AppLayout><TermsOfService /></AppLayout>} />
            <Route path="/cookie-policy" element={<AppLayout><CookiePolicy /></AppLayout>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </WorkspaceProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}
