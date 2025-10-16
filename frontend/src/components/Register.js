import React, { useState } from 'react';
import axios from 'axios';

const Register = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'volunteer',
    full_name: '',
    phone: '',
    college_name: '',
    course: '',
    year_of_study: '',
    student_id: '',
    address: '',
    emergency_contact: '',
    emergency_phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/register/', formData);
      if (response.data.success) {
        onSuccess('User registered successfully!');
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  return (
    <>
      {/* Left Panel - Registration Form */}
      <div className="login-left-panel">
        <div className="login-form-container" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          {/* Logo and Header */}
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-icon">📚</div>
              <span className="logo-text">VolunteerHub</span>
            </div>
            <h1 className="login-title">Join Our Community</h1>
            <p className="login-subtitle">Register as a volunteer and start making a difference</p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button 
              className="auth-tab"
              onClick={onClose}
            >
              👤 Sign In
            </button>
            <button className="auth-tab active">
              ✨ Join Us
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}
          
          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="auth-form enhanced-form">
            <div className="form-row">
              <div className="form-field">
                <label>Username</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="enhanced-input"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="enhanced-input"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-field">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    className="enhanced-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label>Phone Number</label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    className="enhanced-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-field">
                <label>Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    className="enhanced-input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Create a strong password"
                    required
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label>College/University</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="enhanced-input"
                    value={formData.college_name}
                    onChange={(e) => setFormData({...formData, college_name: e.target.value})}
                    placeholder="e.g., ABC University"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-field">
                <label>Course/Program</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="enhanced-input"
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label>Year of Study</label>
                <div className="custom-select-wrapper">
                  <select
                    className="custom-select"
                    value={formData.year_of_study}
                    onChange={(e) => setFormData({...formData, year_of_study: e.target.value})}
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                  <div className="select-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-field">
                <label>Student ID</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="enhanced-input"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    placeholder="University student ID"
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label>Emergency Contact Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="enhanced-input"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                    placeholder="Parent/Guardian name"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-field">
                <label>Emergency Contact Phone</label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    className="enhanced-input"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-field">
              <label>Address</label>
              <div className="input-wrapper textarea-wrapper">
                <textarea
                  rows="2"
                  className="enhanced-textarea"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Full address"
                />
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
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account →
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <button 
                className="link-btn"
                onClick={onClose}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Same NGO Info */}
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
    </>
  );
};

export default Register;