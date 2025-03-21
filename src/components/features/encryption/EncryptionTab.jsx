import React from 'react';
import { useEncryption } from '../../../hooks/useEncryption';
import Card from '../../common/Card';

export const EncryptionTab = () => {
  const { handleEncryptForSelf, handleEncryptForSomeone, handleDecrypt } = useEncryption();

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card 
        title="Encrypt for Yourself"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        description="Encrypt a document with your own key"
        actionText="Select Document"
        onAction={handleEncryptForSelf}
      />
      
      <Card 
        title="Encrypt for Someone"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        description="Encrypt a document with someone else's public key"
        actionText="Select Document"
        onAction={handleEncryptForSomeone}
      />
      
      <Card 
        title="Decrypt Document"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        }
        description="Decrypt an encrypted document with a key file"
        actionText="Select Document & Key"
        onAction={handleDecrypt}
      />
    </div>
  );
};