import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app/index.css';
import './i18n'; // Initialize i18next
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
