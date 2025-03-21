// src/components/features/auth/AuthScreen.jsx
import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export const AuthScreen = () => {
  const { setShowPinModal } = useAuth();
  
  return (
    <div className="flex flex-col h-96 justify-center space-y-4">
      <div className="flex items-center justify-center mt-4">
        <h2 className="text-lg font-semibold">E-SBSL</h2>
      </div>
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl shadow-md transition-colors duration-200 ease-in-out"
        onClick={() => setShowPinModal(true)}>
        Log in with E-Signature
      </button>
      <div className="flex justify-center items-center mt-2">
        <img
          src="icons/icon16.png"
          className="object-contain w-full h-auto rounded-lg"
          alt="E-SBSL Logo"
        />
      </div>
    </div>
  );
};

