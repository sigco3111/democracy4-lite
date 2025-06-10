import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isDelegationModeActive?: boolean; // Optional: for auto-closing
  autoCloseDelay?: number; // Optional: delay in ms
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, isDelegationModeActive, autoCloseDelay }) => {
  useEffect(() => {
    let timerId: number | undefined;
    if (isOpen && isDelegationModeActive && autoCloseDelay && autoCloseDelay > 0) {
      timerId = window.setTimeout(() => {
        onClose();
      }, autoCloseDelay);
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isOpen, isDelegationModeActive, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-indigo-400">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors text-2xl"
            aria-label="모달 닫기"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;