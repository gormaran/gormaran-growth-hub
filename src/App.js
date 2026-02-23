import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CategoryPage from './pages/CategoryPage';
import PricingPage from './pages/PricingPage';
import SettingsPage from './pages/SettingsPage';

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

import './App.css';

function AppLayout({ children, hideFooter }) {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}

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

export default function App() {
  return (
    <Router>
      <AnalyticsTracker />
      <AuthProvider>
        <SubscriptionProvider>
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

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}
