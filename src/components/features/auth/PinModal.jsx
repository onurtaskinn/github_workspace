import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Modal } from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';

export const PinModal = () => {
  const { 
    showPinModal, 
    pin, 
    setPin, 
    setShowPinModal, 
    handlePinSubmit,
    handleLogout, 
    isAuthenticating,
    isAuthenticated
  } = useAuth();

  const handleCancel = () => {
    setShowPinModal(false);
    
    // If not authenticated (timeout has occurred), log out
    if (!isAuthenticated) {
      handleLogout();
    }
  };
  
  return (
    <Modal isOpen={showPinModal} onClose={handleCancel} title="Enter PIN">
      <div className="space-y-4">
        <Input
          type="password"
          maxLength="6"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handlePinSubmit();
            }
          }}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePinSubmit}
            isLoading={isAuthenticating}
          >
            Login
          </Button>
        </div>
      </div>
    </Modal>
  );
};