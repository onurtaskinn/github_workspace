// src/components/common/Notification.jsx
import React from 'react';

export const Notification = ({ message, type, onClose }) => (
  <div className={`fixed top-2 right-2 p-4 rounded-lg shadow-lg transition-opacity duration-300 
    ${type === 'success' ? 'bg-green-100 text-green-800' :
    type === 'error' ? 'bg-red-100 text-red-800' :
    'bg-blue-100 text-blue-800'}`}>
    <div className="flex items-center space-x-2">
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700">
        ✕
      </button>
    </div>
  </div>
);
