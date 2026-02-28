import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "./i18n/i18n";
import ReactGA from "react-ga4";

ReactGA.initialize("G-ND3CT7RGWF");
ReactGA.send("pageview");

const rootElement = document.getElementById('root');
if (rootElement.hasChildNodes()) {
  // Pre-rendered by react-snap — hydrate instead of full mount
  ReactDOM.hydrateRoot(rootElement, <React.StrictMode><App /></React.StrictMode>);
} else {
  ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
