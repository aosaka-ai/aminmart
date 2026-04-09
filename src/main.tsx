import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './AuthProvider';
import { CartProvider } from './CartProvider';

const rootElement = document.getElementById('root');

// Safety: Clear cache if requested via URL
if (window.location.search.includes('clear=true')) {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, document.title, window.location.pathname);
  window.location.reload();
}

console.log("main.tsx: Starting initialization...");

if (!rootElement) {
  console.error("main.tsx: Root element not found!");
  throw new Error('Failed to find the root element');
}

try {
  console.log("main.tsx: Rendering React app...");
  createRoot(rootElement).render(
    <StrictMode>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </StrictMode>,
  );
} catch (error) {
  console.error('Failed to render the app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: #ef4444; font-family: sans-serif; text-align: center;">
      <h2 style="margin-bottom: 10px;">Failed to start application</h2>
      <p style="font-size: 14px;">${error instanceof Error ? error.message : String(error)}</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 8px 16px; background: #16a34a; color: white; border: none; border-radius: 6px; cursor: pointer;">
        Try Refreshing
      </button>
    </div>
  `;
}
