import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ToastProvider } from './components/Popups/Popup';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
    <App />
    </ToastProvider>
  </React.StrictMode>
);
serviceWorkerRegistration.register();