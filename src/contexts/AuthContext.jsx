// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import browserApi from '../utils/browserApi';
import { useNotification } from '../hooks/useNotification';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [timeoutReached, setTimeoutReached] = useState(false); 
  const { showNotification } = useNotification();

  const resetTimer = () => {
    chrome.runtime.sendMessage({ action: 'resetTimer' }, (response) => {
      console.log(response.status);
    });
  };

  const handlePinSubmit = async () => {
    try {
      const response = await browserApi.verifyPIN(pin);
      if (response.success) {
        resetTimer();
        setShowPinModal(false);
        setIsAuthenticated(true);
        setTimeoutReached(false); // Reset timeout flag after successful login
        showNotification('Logged in successfully', 'success');
        setPin('');
      } else {
        showNotification('Wrong PIN', 'error');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      showNotification('Error logging in', 'error');
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setTimeoutReached(false);
    const response = await browserApi.logout();
    if (response.success) {
      showNotification('Logged out successfully', 'info');
    }
    else{
      console.log("Failed to logout: " + response);
    }
    
  };

  useEffect(() => {
    const handleTimeoutMessage = (message) => {
      if (message.timeoutReached) {
        setTimeoutReached(true);
        setShowPinModal(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleTimeoutMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleTimeoutMessage);
    };
  }, []);

  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated,
        showPinModal,
        pin,
        timeoutReached,
        setIsAuthenticated,
        setShowPinModal,
        setPin,
        setTimeoutReached,
        handlePinSubmit,
        handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};