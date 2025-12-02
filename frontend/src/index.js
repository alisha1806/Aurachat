import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Hide loading screen
document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 1000);
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);