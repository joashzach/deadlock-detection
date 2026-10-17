import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { attachPersistence, hydrateFromStorage } from './lib/persistence';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root was not found in index.html');
}

// Restore the previous workspace before the first render, then keep it saved.
hydrateFromStorage();
attachPersistence();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
