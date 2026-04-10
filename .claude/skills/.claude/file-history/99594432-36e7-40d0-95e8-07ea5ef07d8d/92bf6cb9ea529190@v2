import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "./i18n/i18n";
import ReactGA from "react-ga4";
import ErrorBoundary from './components/ErrorBoundary';
import { validateEnv } from './utils/envCheck';

validateEnv();

const gaId = process.env.REACT_APP_GA_MEASUREMENT_ID || "G-ND3CT7RGWF";
ReactGA.initialize(gaId);
ReactGA.send("pageview");

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();
