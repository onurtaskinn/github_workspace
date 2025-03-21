// src/components/ExtensionUI.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { Notification } from './common/Notification';
import { AuthScreen } from './features/auth/AuthScreen';
import { PinModal } from './features/auth/PinModal';
import { SigningTab } from './features/signing/SigningTab';
import { EncryptionTab } from './features/encryption/EncryptionTab';
import { SettingsTab } from './features/settings/SettingsTab';
import { GmailTab } from './features/gmail/GmailTab';
import { ServerTab } from './features/server/ServerTab';



const ExtensionUI = () => {
  const { isAuthenticated, setShowPinModal} = useAuth();
  const { darkMode } = useTheme();
  const { notification, setNotification } = useNotification();
  const [ activeTab, setActiveTab] = useState('Signing');
  const [ showingGmailCompose, setShowingGmailCompose ] = useState(false);


  let timeoutReached = false;


  // Check if we should directly open Gmail compose
  useEffect(() => {
    if (window.directOpenGmailCompose && isAuthenticated) {
      console.log('Opening Gmail compose tab directly');
      setActiveTab('Gmail');
      if (!showingGmailCompose) {
        setShowingGmailCompose(true);
        window.openGmailComposeDirectly = true;
      }
      window.directOpenGmailCompose = false;
    }
  }, [isAuthenticated, showingGmailCompose]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  useEffect(() => {
    const handleTimeout = (message) => {
      if (message.timeoutReached) {
        setShowPinModal(true);
        timeoutReached = true;
      }
    };

    chrome.runtime.onMessage.addListener(handleTimeout);

    return () => {
      chrome.runtime.onMessage.removeListener(handleTimeout);
    };
  }, [setShowPinModal]);


  

  const renderMainScreen = () => (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b">
        {['Signing', 'Encryption', 'Gmail', 'Settings','Server'].map((tab) => (
          <button
            key={tab}
            className={`p-2 rounded-t-lg ${
              activeTab === tab 
                ? 'border-b-2 border-blue-500 bg-blue-50 dark:bg-gray-700 dark:border-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-600'
            } focus:outline-none focus:ring-0 focus:border-none`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="p-4 bg-white dark:bg-gray-800 min-h-full">
        {activeTab === 'Signing' && <SigningTab />}
        {activeTab === 'Encryption' && <EncryptionTab />}
        {activeTab === 'Gmail' && <GmailTab directCompose={window.openGmailComposeDirectly} onComposeShown={() => {
          window.openGmailComposeDirectly = false;
          setShowingGmailCompose(false);
        }} />}
        {activeTab === 'Settings' && <SettingsTab />}
        {activeTab === 'Server' && <ServerTab />}

      </div>
    </div>
  );

  return (
    <div className={`w-80 p-4 ${darkMode ? 'dark bg-gray-900 text-gray-200' : 'bg-white'} min-h-screen`}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <PinModal />
      {!isAuthenticated || timeoutReached ? <AuthScreen /> : renderMainScreen()}
    </div>
  );
};

export default ExtensionUI;