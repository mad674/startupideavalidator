import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ToastProvider } from './components/Popups/Popup';
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById('root'));
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

if (!clientId) {
  console.error("Google Client ID is missing!");
}
root.render(
  <React.StrictMode>
    <ToastProvider>
      {clientId ? (
        <GoogleOAuthProvider clientId={clientId}>
          <App />
        </GoogleOAuthProvider>
      ) : (
        <App />
      )}
    </ToastProvider>
  </React.StrictMode>
);
serviceWorkerRegistration.register();
