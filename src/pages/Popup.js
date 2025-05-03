// src/pages/Popup.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import ExtensionUI from '../components/ExtensionUI';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import '../styles/tailwind.css';

const AppProviders = ({ children }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <AppProviders>
    <ExtensionUI />
  </AppProviders>
);


// Listen for messages to automatically open Gmail compose
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openGmailCompose') {
    console.log('Received request to open Gmail compose tab');
    
    window.directOpenGmailCompose = true;
    
    sendResponse({ success: true });
    return true;
  }
});

// Listen for messages to automatically open Gmail compose
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openGmailCompose') {
        console.log('Received request to open Gmail compose tab');

        window.directOpenGmailCompose = true;

        sendResponse({ success: true });
        return true;
    }

    // �ifreli e-posta ��zme i�lemi i�in mesaj
    if (request.action === 'showDecryptView') {
        console.log('Received request to show decryption view');

        window.showDecryptionView = true;
        window.encryptedEmailContent = request.encryptedContent;

        sendResponse({ success: true });
        return true;
    }
});
