import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';
import heroImage from '../assets/hero_car.png';
import logo from '../assets/logo.png';

const Landing = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Logo" className="nav-logo-img" />
          <span>WheelsOnRent</span>
        </Link>
        <div className="navbar-links">
          <Link to="/login" className="nav-btn nav-btn-login">Login</Link>
          <Link to="/register" className="nav-btn nav-btn-register">Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <img src={heroImage} alt="Premium Car" className="hero-bg" />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Easy rentals<br />With WheelsOnRent</h1>
          <div className="cta-group">
            <Link to="/register" className="cta-btn cta-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>4 step process to book</h2>
          <p>select location -> select vehicle -> upload dl -> confirm booking</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">📍</span>
            <h3>select location</h3>
            <p>select from locations we serve</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🛞</span>
            <h3>select your wheels</h3>
            <p>select the kind of wheels you want to rent, based on your needs</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🪪</span>
            <h3>upload dl</h3>
            <p>upload your driving license, which will be verified by the vehicle owner on spot</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">✅</span>
            <h3>confirm booking</h3>
            <p>confirm your booking, and enjoy the ride</p>
          </div>
        </div>
      </section>

      {/* Future-Implementation Section */}
      <section className="Future-Implementation">
        <div className="section-header">
          <h2 style={{ color: 'white' }}>Future Implementation</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Dl verification using AI.</p>
        </div>
        <div className="steps-grid">
          <div className="step-item">
            <span className="step-number">01</span>
            <div className="step-content">
              <h3>Reduce manual verification</h3>
              <p>Using OCR implimentation we can reduce the manual verification of driving license.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo-container">
              <img src={logo} alt="Logo" className="footer-logo-img" />
              <h2>WheelsOnRent</h2>
            </div>
            <p style={{ color: '#6b7280', marginTop: '1rem' }}>Premium vehicle rental services for those who demand excellence in every journey.</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/reset-password">Forgot Password</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} WheelsOnRent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
