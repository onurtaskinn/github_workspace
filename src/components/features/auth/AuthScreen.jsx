import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../common/Button';

export const AuthScreen = () => {
  const { setShowPinModal } = useAuth();
  
  return (
    <div className="flex flex-col h-full justify-center items-center">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <img
            src="icons/icon128.png"
            className="w-24 h-24 object-contain"
            alt="E-SBSL Logo"
          />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">E-SBSL</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Secure document operations with e-signature
        </p>
      </div>
      
      <Button
        onClick={() => setShowPinModal(true)}
        className="px-8"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        }
      >
        Log in with E-Signature
      </Button>
    </div>
  );
};