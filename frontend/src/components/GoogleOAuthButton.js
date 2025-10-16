import React, { useState } from 'react';

const GoogleOAuthButton = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    // Redirect directly to backend OAuth endpoint
    // This ensures the session is maintained throughout the OAuth flow
    window.location.href = 'http://localhost:5000/api/auth/google/login';
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="social-btn google"
      type="button"
    >
      <span className="social-icon">G</span>
      {loading ? 'Connecting...' : 'Google'}
    </button>
  );
};

export default GoogleOAuthButton;
