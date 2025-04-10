import React from 'react';
import { useSigning } from '../../../hooks/useSigning';
import Card from '../../common/Card';

export const SigningTab = () => {
  const { handleSignDocument, handleVerifySignature } = useSigning();

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card 
        title="Sign Document"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
        description="Securely sign documents using your e-signature"
        actionText="Select Document"
        onAction={handleSignDocument}
      />
      
      <Card 
        title="Verify Signature"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
        description="Validate the authenticity of signed documents"
        actionText="Verify Document"
        onAction={handleVerifySignature}
      />
    </div>
  );
};