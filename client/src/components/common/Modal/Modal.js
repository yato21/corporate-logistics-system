import React from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  children, 
  type = 'default',
  showActions = false 
}) => {
  if (!isOpen) return null;

  const modalContentClass = `modal-content ${type}-modal`;
  const overlayClass = type === 'confirmation' ? 'confirmation-modal-overlay' : 'modal-overlay';

  const renderContent = () => {
    if (type === 'confirmation') {
      return (
        <>
          <div className="modal-header">
            <h3>{title}</h3>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Нет
            </button>
            <button className="btn btn-danger" onClick={onConfirm}>
              Да
            </button>
          </div>
        </>
      );
    }

    return children;
  };

  return (
    <div className={overlayClass} onClick={onClose}>
      <div 
        className={modalContentClass}
        onClick={e => e.stopPropagation()}
      >
        {type === 'confirmation' ? (
          renderContent()
        ) : (
          <>
            <button className="modal-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
            {children}
          </>
        )}
      </div>
    </div>
  );
};

export default Modal; 