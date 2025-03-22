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
import Header from './layout/Header';
import TabNavigation from './layout/TabNavigation';

const ExtensionUI = () => {
  const { isAuthenticated, setShowPinModal, handleLogout } = useAuth();
  const { darkMode } = useTheme();
  const { notification, setNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('Signing');
  const [showingGmailCompose, setShowingGmailCompose] = useState(false);


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
      }
    };

    chrome.runtime.onMessage.addListener(handleTimeout);

    return () => {
      chrome.runtime.onMessage.removeListener(handleTimeout);
    };
  }, [setShowPinModal]);

  useEffect(() => {
    if (isAuthenticated) {
      // Define a handler function to reset the timer on user interaction
      const handleUserInteraction = () => {
        chrome.runtime.sendMessage({ action: 'resetTimer' });
      };
      
      // Add event listeners for common user interactions
      window.addEventListener('mousedown', handleUserInteraction);
      window.addEventListener('keydown', handleUserInteraction);
      window.addEventListener('mousemove', handleUserInteraction);
      window.addEventListener('touchstart', handleUserInteraction);
      
      // Clean up function to remove the listeners when component unmounts
      return () => {
        window.removeEventListener('mousedown', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
        window.removeEventListener('mousemove', handleUserInteraction);
        window.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [isAuthenticated]); 



  const renderMainScreen = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {activeTab === 'Signing' && <SigningTab />}
        {activeTab === 'Encryption' && <EncryptionTab />}
        {activeTab === 'Gmail' && <GmailTab directCompose={window.openGmailComposeDirectly} onComposeShown={() => {
          window.openGmailComposeDirectly = false;
          setShowingGmailCompose(false);
        }} />}
        {activeTab === 'Server' && <ServerTab />}        
        {activeTab === 'Settings' && <SettingsTab />}        
      </div>
    </div>
  );

  return (
    <div className={`h-[600px] w-[500px] ${darkMode ? 'dark bg-gray-900 text-gray-200' : 'bg-gray-50'} transition-colors duration-200 flex flex-col overflow-hidden`}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <PinModal />
      <div className="flex-1 overflow-hidden p-4">
        {!isAuthenticated ? <AuthScreen /> : renderMainScreen()}
      </div>
    </div>
  );
};

export default ExtensionUI;