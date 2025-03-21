// src/components/features/signing/SigningTab.jsx
import React from 'react';
import { useSigning } from '../../../hooks/useSigning';

export const SigningTab = () => {
  const { handleSignDocument, handleVerifySignature } = useSigning();

  return (
    <div className="space-y-4">
      <button
        onClick={handleSignDocument}
        className="w-full text-left px-6 py-4 bg-blue-200 text-blue-700 rounded-xl hover:bg-blue-300 transition-colors duration-200 ease-in-out text-base font-medium"
      >
        ✍️ Sign Document
      </button>
      <button
        onClick={handleVerifySignature}
        className="w-full text-left px-6 py-4 bg-blue-200 text-blue-700 rounded-xl hover:bg-blue-300 transition-colors duration-200 ease-in-out text-base font-medium"
      >
        🔍 Verify Signature
      </button>
    </div>
  );
};