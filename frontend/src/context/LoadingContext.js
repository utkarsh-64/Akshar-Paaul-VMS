import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = (key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  };

  const isLoading = (key) => {
    return loadingStates[key] || false;
  };

  const isAnyLoading = () => {
    return Object.values(loadingStates).some(loading => loading);
  };

  return (
    <LoadingContext.Provider value={{
      setLoading,
      isLoading,
      isAnyLoading,
      loadingStates
    }}>
      {children}
      {isAnyLoading() && <GlobalLoadingIndicator />}
    </LoadingContext.Provider>
  );
};

const GlobalLoadingIndicator = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      backgroundColor: '#007bff',
      zIndex: 9998,
      animation: 'loadingBar 2s ease-in-out infinite'
    }}>
      <div style={{
        height: '100%',
        backgroundColor: '#0056b3',
        animation: 'loadingProgress 2s ease-in-out infinite'
      }} />
    </div>
  );
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes loadingBar {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
  
  @keyframes loadingProgress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }
`;
document.head.appendChild(style);