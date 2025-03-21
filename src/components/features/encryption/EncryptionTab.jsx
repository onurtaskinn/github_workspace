// src/components/features/encryption/EncryptionTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useEncryption } from '../../../hooks/useEncryption';

export const EncryptionTab = () => {
  const { handleEncryptForSelf, handleEncryptForSomeone, handleDecrypt } = useEncryption();
  const [showEncryptOptions, setShowEncryptOptions] = useState(false);
  const dropdownRef = useRef(null);

  const handleEncryptClick = () => {
    setShowEncryptOptions(!showEncryptOptions);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEncryptOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="space-y-4">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleEncryptClick}
          className="w-full text-left px-6 py-4 bg-green-200 text-green-700 rounded-xl hover:bg-green-300 transition-colors duration-200 ease-in-out text-base font-medium"
        >
          🔒 Encrypt Document
        </button>
        {showEncryptOptions && (
          <div className="absolute mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
            <button
              className="w-full text-left px-6 py-4 bg-green-100 text-green-700 dark:bg-gray-600 dark:text-green-300 rounded-t-xl hover:bg-green-200 dark:hover:bg-gray-500 transition-colors duration-200 ease-in-out text-base font-medium"
              onClick={() => {
                handleEncryptForSelf();
                setShowEncryptOptions(false);
              }}
            >
              🔒 Encrypt for Yourself
            </button>
            <button
              className="w-full text-left px-6 py-4 bg-green-100 text-green-700 dark:bg-gray-600 dark:text-green-300 rounded-b-xl hover:bg-green-200 dark:hover:bg-gray-500 transition-colors duration-200 ease-in-out text-base font-medium"
              onClick={() => {
                handleEncryptForSomeone();
                setShowEncryptOptions(false);
              }}
            >
              🔒 Encrypt for Someone
            </button>
          </div>
        )}
      </div>
      <button
        onClick={handleDecrypt}
        className="w-full text-left px-6 py-4 bg-green-200 text-green-700 rounded-xl hover:bg-green-300 transition-colors duration-200 ease-in-out text-base font-medium"
      >
        🔓 Decrypt Document (Select File & Key)
      </button>
    </div>
  );
};