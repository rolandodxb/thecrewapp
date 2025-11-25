import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { enableOfflineSupport, registerServiceWorker } from './utils/enableOfflineSupport';

if (!localStorage.getItem('appInitialized')) {
  localStorage.clear();
  localStorage.setItem('appInitialized', 'true');
}

enableOfflineSupport();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
