import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Register from './Register';
import CursorFollower from './CursorFollower';
import GoogleOAuthButton from './GoogleOAuthButton';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthStatus = params.get('oauth');
    
    if (oauthStatus === 'success') {
      setMessage('Successfully logged in with Google!');
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else if (oauthStatus === 'error') {
      setError('Google login failed. Please try again.');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleRegisterSuccess = (msg) => {
    setMessage(msg);
    setShowRegister(false);
  };

  if (showRegister) {
    return (
      <>
        <CursorFollower />
        <div className="split-login-container">
          <Register
            onClose={() => setShowRegister(false)}
            onSuccess={handleRegisterSuccess}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <CursorFollower />
      <div className="split-login-container">
      {/* Left Panel - Login Form */}
      <div className="login-left-panel">
        <div className="login-form-container">
          {/* Logo and Header */}
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-icon">📚</div>
              <span className="logo-text">VolunteerHub</span>
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to continue your volunteer journey</p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button className="auth-tab active">
              👤 Sign In
            </button>
            <button 
              className="auth-tab"
              onClick={() => setShowRegister(true)}
            >
              ✨ Join Us
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}
          
          {message && (
            <div className="auth-message success">
              {message}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-field">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Password</label>
                <div className="password-field">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button type="button" className="password-toggle">
                    👁️
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In →
                </>
              )}
            </button>
          </form>

          {/* Social Login Options */}
          <div className="social-login">
            <div className="divider">
              <span>Or sign in with</span>
            </div>
            <div className="social-buttons">
              <GoogleOAuthButton />
            </div>
          </div>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              New to our community?{' '}
              <button 
                className="link-btn"
                onClick={() => setShowRegister(true)}
              >
                Create Account
              </button>
            </p>
            <div className="footer-links">
              <span>Privacy Policy</span> • <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - NGO Information */}
      <div className="login-right-panel">
        <div className="right-panel-content">
          {/* Background Animation */}
          <div className="background-animation">
            {/* Gradient Orbs */}
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
            
            {/* Floating Particles Network */}
            <div className="particles-network">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={i}
                  className="network-particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${10 + Math.random() * 10}s`
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* NGO Information */}
          <div className="ngo-info">
            <div className="ngo-logo">
              <div className="ngo-icon">📚</div>
              <h2 className="ngo-name">Akshar Paaul NGO</h2>
            </div>
            
            <div className="ngo-tagline">
              "Empowering communities through education, skill development, and sustainable growth"
            </div>
            
            <div className="ngo-description">
              Join a community of passionate volunteers who are transforming lives through education and empowerment. 
              Every contribution matters, every hour counts, and together we're building a brighter future for all.
            </div>

            <div className="ngo-features">
              <div className="ngo-feature">
                <div className="feature-icon-circle">⏱️</div>
                <div className="feature-text">
                  <strong>Track Your Impact</strong>
                  <span>Monitor volunteer hours and contributions</span>
                </div>
              </div>
              
              <div className="ngo-feature">
                <div className="feature-icon-circle">🎯</div>
                <div className="feature-text">
                  <strong>Lead Projects</strong>
                  <span>Create and manage community initiatives</span>
                </div>
              </div>
              
              <div className="ngo-feature">
                <div className="feature-icon-circle">🤝</div>
                <div className="feature-text">
                  <strong>Build Connections</strong>
                  <span>Collaborate with fellow volunteers</span>
                </div>
              </div>
              
              <div className="ngo-feature">
                <div className="feature-icon-circle">🌟</div>
                <div className="feature-text">
                  <strong>Make a Difference</strong>
                  <span>Transform lives through education</span>
                </div>
              </div>
            </div>


          </div>

          {/* Background Particles */}
          <div className="bg-particles">
            {[...Array(15)].map((_, i) => (
              <div 
                key={i}
                className="bg-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;