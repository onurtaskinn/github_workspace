import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { ComposeModal } from './ComposeModal';
import Card from '../../common/Card';

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
      <Card 
        title="Compose Secure Email"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        description="Send encrypted email with attachments through Gmail"
        actionText="Compose Email"
        onAction={handleComposeEmail}
      />
      
      {showComposeModal && (
        <ComposeModal onClose={() => setShowComposeModal(false)} />
      )}
    </div>
  );
};