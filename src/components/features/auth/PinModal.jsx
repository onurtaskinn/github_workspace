// src/components/features/auth/PinModal.jsx
import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Modal } from '../../common/Modal';

export const PinModal = () => {
  const { showPinModal, pin, setPin, setShowPinModal, handlePinSubmit } = useAuth();
  
  return (
    <Modal isOpen={showPinModal} onClose={() => setShowPinModal(false)}>
      <div className="space-y-4 p-6 rounded-lg shadow-lg max-w-sm w-full mx-auto bg-white">
        <h2 className="text-lg font-semibold text-gray-800">Enter PIN</h2>
        <input
          type="password"
          maxLength="6"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
          placeholder="****"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handlePinSubmit();
            }
          }}
        />
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors duration-200 ease-in-out dark:text-gray-300 dark:hover:text-gray-400"
            onClick={() => setShowPinModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ease-in-out"
            onClick={handlePinSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </Modal>
  );
};

