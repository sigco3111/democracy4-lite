
import React, { useEffect } from 'react';
import type { ToastNotificationState, ToastNotificationType } from '../types';

interface ToastNotificationProps extends ToastNotificationState {
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // 일치하도록 App.tsx와 동일한 시간

    return () => clearTimeout(timer);
  }, [id, onClose]); // Added id to dependency array as it might change if a new toast appears quickly

  let bgColor = 'bg-green-500'; // 기본 success
  if (type === 'error') bgColor = 'bg-red-500';
  if (type === 'warning') bgColor = 'bg-yellow-500';
  if (type === 'info') bgColor = 'bg-blue-500';

  return (
    <div 
      className={`fixed top-5 right-5 ${bgColor} text-white p-4 rounded-lg shadow-lg transition-opacity duration-300 animate-fadeInOut z-50`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button 
          onClick={onClose} 
          className="ml-4 text-xl font-semibold leading-none hover:text-gray-200"
          aria-label="알림 닫기"
        >
          &times;
        </button>
      </div>
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
          .animate-fadeInOut {
            animation: fadeInOut 3s ease-in-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default ToastNotification;
