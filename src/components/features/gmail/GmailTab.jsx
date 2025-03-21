import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { ComposeModal } from './ComposeModal';

export const GmailTab = ({ directCompose = false, onComposeShown }) => {
  const [showComposeModal, setShowComposeModal] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (directCompose) {
      console.log('Direct compose flag detected, opening compose modal');
      handleComposeEmail();
      if (onComposeShown && typeof onComposeShown === 'function') {
        onComposeShown();
      }
    }
  }, [directCompose]);

  const handleComposeEmail = () => {
    chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
      if (response && response.success) {
        setShowComposeModal(true);
      } else {
        showNotification('Gmail authentication failed: ' + (response?.error || 'Unknown error'), 'error');
      }
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleComposeEmail}
        className="w-full text-left px-6 py-4 bg-blue-200 text-blue-700 rounded-xl hover:bg-blue-300 transition-colors duration-200 ease-in-out text-base font-medium"
      >
        ✉️ Compose Secure Email
      </button>
      
      {showComposeModal && (
        <ComposeModal onClose={() => setShowComposeModal(false)} />
      )}
    </div>
  );
};