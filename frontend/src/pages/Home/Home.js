import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
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
          </div>
        </div>
        <div className="hero-image">
          {/* Placeholder for hero illustration */}
          <div className="image-placeholder">🚀</div>
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
    </div>
  );
}
