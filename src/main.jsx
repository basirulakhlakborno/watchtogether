import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.less'
import App from './App.jsx'

// Initialize theme before React loads
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
};

initializeTheme();

// Hide loading overlay once React is ready
const hideLoading = () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('fade-out');
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
    }, 500); // Match fade-out transition duration
  }
};

// Wait for DOM and fonts to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for initial render, then hide loading
    setTimeout(hideLoading, 1000);
  });
} else {
  // DOM already loaded
  setTimeout(hideLoading, 1000);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
