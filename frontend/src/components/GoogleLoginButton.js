// GoogleLoginButton.jsx
import React, { useEffect, useRef } from "react";

const GoogleLoginButton = ({ onSuccess, onError }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (!window.google) {
      onError?.("Google API not loaded");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: onSuccess,
    });

    window.google.accounts.id.renderButton(divRef.current, {
      theme: "outline",
      size: "large",
    });

    // Optional: show One Tap prompt
    window.google.accounts.id.prompt();
  }, [onSuccess, onError]);

  return <div ref={divRef}></div>;
};

export default GoogleLoginButton;
