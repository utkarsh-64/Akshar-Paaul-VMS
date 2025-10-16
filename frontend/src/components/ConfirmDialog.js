import React from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  confirmButtonStyle = 'danger',
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  const getButtonClass = (style) => {
    const styles = {
      danger: 'btn-danger',
      success: 'btn-success',
      primary: 'btn-primary',
      warning: 'btn-warning'
    };
    return `btn ${styles[style] || styles.primary}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        animation: 'modalSlideIn 0.3s ease-out'
      }}>
        {title && (
          <h3 style={{ 
            margin: '0 0 16px 0', 
            color: '#2c3e50',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            {title}
          </h3>
        )}
        
        <div style={{ 
          marginBottom: '24px', 
          color: '#34495e',
          fontSize: '14px',
          lineHeight: '1.5',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end' 
        }}>
          <button 
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            {cancelText}
          </button>
          <button 
            className={getButtonClass(confirmButtonStyle)}
            onClick={onConfirm}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes modalSlideIn {
    from {
      transform: translateY(-50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

export default ConfirmDialog;