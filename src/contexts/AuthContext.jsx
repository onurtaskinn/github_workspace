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

  const [isBackgroundConnected, setIsBackgroundConnected] = useState(true);


  const resetTimer = () => {
    try {
      chrome.runtime.sendMessage({ action: 'resetTimer' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("Connection error:", chrome.runtime.lastError.message);
          setIsBackgroundConnected(false);
          return;
        }
        console.log(response ? response.status : "No response");
      });
    } catch (error) {
      console.error("Error sending resetTimer message:", error);
    }
  };

  const handlePinSubmit = async () => {
    try {
      const response = await browserApi.verifyPIN(pin);
      if (response.success) {
        resetTimer();
        setShowPinModal(false);
        setIsAuthenticated(true);
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
    try {
      setIsAuthenticated(false);
      const response = await browserApi.logout();
      if (response.success) {
        showNotification('Logged out successfully', 'info');
      } else {
        console.log("Failed to logout: " + response);
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Still set isAuthenticated to false even if API call fails
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const handleTimeoutMessage = (message) => {
      if (message.timeoutReached) {
        // Instead of setting a separate flag, just log the user out
        setIsAuthenticated(false);
        setShowPinModal(true);
      }
    };

    try {
      chrome.runtime.onMessage.addListener(handleTimeoutMessage);
    } catch (error) {
      console.error("Error adding message listener:", error);
    }

    return () => {
      try {
        chrome.runtime.onMessage.removeListener(handleTimeoutMessage);
      } catch (error) {
        console.error("Error removing message listener:", error);
      }
    };
  }, []);

  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated,
        showPinModal,
        pin,
        setIsAuthenticated,
        setShowPinModal,
        setPin,
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