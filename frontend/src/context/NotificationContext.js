import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message, duration) => addNotification(message, 'success', duration);
  const showError = (message, duration) => addNotification(message, 'error', duration);
  const showWarning = (message, duration) => addNotification(message, 'warning', duration);
  const showInfo = (message, duration) => addNotification(message, 'info', duration);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px'
    }}>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onRemove }) => {
  const getNotificationStyle = (type) => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '14px',
      fontWeight: '500',
      animation: 'slideIn 0.3s ease-out',
      cursor: 'pointer'
    };

    const styles = {
      success: {
        ...baseStyle,
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb'
      },
      error: {
        ...baseStyle,
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb'
      },
      warning: {
        ...baseStyle,
        backgroundColor: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffeaa7'
      },
      info: {
        ...baseStyle,
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        border: '1px solid #bee5eb'
      }
    };

    return styles[type] || styles.info;
  };

  const getIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  };

  return (
    <div
      style={getNotificationStyle(notification.type)}
      onClick={() => onRemove(notification.id)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{getIcon(notification.type)}</span>
        <span>{notification.message}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(notification.id);
        }}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          opacity: 0.7,
          padding: '0 4px'
        }}
      >
        ×
      </button>
    </div>
  );
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);