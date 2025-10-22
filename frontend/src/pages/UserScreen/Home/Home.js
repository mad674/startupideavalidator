import React from "react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Home.css";

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    // Optional: Detect if app is already installed
    window.addEventListener("appinstalled", () => {
      console.log("App installed!");
      setShowInstallBtn(false);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };
  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h1>Validate Your Startup Ideas with Confidence</h1>
          <p>
            AI-powered insights to refine your concept, assess market fit, and
            accelerate your journey from idea to reality.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn primary-btn">
              Get Started Free
            </Link>
            <Link to="/login" className="btn secondary-btn">
              Login
            </Link>
          </div><br /><br /><br />
            Are you an expert?  
            <Link to="/expert/login">
               Login
            </Link>
            <br /><br />
            Join our community of Experts 
            <Link to="/expert/register"> 
               Join Now
            </Link>
        </div>
        
        <div className="hero-image">
          {/* Placeholder for hero illustration */}
          <div className="image-placeholder">
          <img
            src={require('../../../assets/home.png')}
            alt="A beautiful landscape"
            loading="lazy"
          />
        </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature">
          <div className="feature-icon">💡</div>
          <h3>Instant Validation</h3>
          <p>Get quick AI feedback to understand your idea’s strengths and weaknesses.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">📈</div>
          <h3>Market Insights</h3>
          <p>Identify trends, competitors, and opportunities with data-backed insights.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🤝</div>
          <h3>Collaborate & Grow</h3>
          <p>Share your idea with the community and get constructive feedback.</p>
        </div>
      </section>
      {showInstallBtn && (
        <button className="install-btn" onClick={handleInstallClick}>
          Install App
        </button>
      )}
    </div>
  );
}
