import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ToastProvider } from './components/Popups/Popup';
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId = "200813946279-v05eo3bae8nlc3nu7qa4lhui1lm8avid.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
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
