import React from 'react';

interface GeneralPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
}

const GeneralPopup: React.FC<GeneralPopupProps> = ({
  isOpen,
  onClose,
  title = 'Notification',
  message = '',
  type = 'info',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  children
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="popup-icon popup-icon-success">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="popup-icon popup-icon-warning">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="popup-icon popup-icon-error">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
        );
      case 'confirm':
        return (
          <div className="popup-icon popup-icon-confirm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="popup-icon popup-icon-info">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
            </svg>
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'success':
        return 'popup-btn popup-btn-success';
      case 'warning':
        return 'popup-btn popup-btn-warning';
      case 'error':
        return 'popup-btn popup-btn-error';
      case 'confirm':
        return 'popup-btn popup-btn-confirm';
      default:
        return 'popup-btn popup-btn-info';
    }
  };

  return (
    <div className="general-popup-overlay">
      <div className="general-popup">
        <div className="general-popup-header">
          <div className="general-popup-title-area">
            {getIcon()}
            <h3 className="general-popup-title">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="general-popup-close"
            aria-label="Close popup"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="general-popup-content">
          {message && (
            <p className="general-popup-message">{message}</p>
          )}
          {children}
        </div>

        <div className="general-popup-actions">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="popup-btn popup-btn-cancel"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralPopup;
