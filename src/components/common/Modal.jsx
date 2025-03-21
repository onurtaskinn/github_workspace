// src/components/common/Modal.jsx
import React from 'react';

export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="p-6 rounded-lg shadow-lg w-full max-w-sm mx-auto dark:bg-gray-800 bg-white">
        {children}
      </div>
    </div>
  );
};

