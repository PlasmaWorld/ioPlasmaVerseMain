import React, { ReactNode } from 'react';
import styles from '../M/modal.module.css'; 

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={styles['modal-wrapper']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-content']}>
          <button className={styles['close-button']} onClick={onClose}>Close</button>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
