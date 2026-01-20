import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ToastProvider } from './components/Popups/Popup';
// import { GoogleOAuthProvider } from "@react-oauth/google";
import { overrideFetchWithIdempotency } from "./utils/overridefetchWithIdempotency";

overrideFetchWithIdempotency();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
        <App />
    </ToastProvider>
  </React.StrictMode>
);
serviceWorkerRegistration.register();
