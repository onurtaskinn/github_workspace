import React from 'react';
import { usePgp } from '../../../hooks/usePgp';
import { useFileSelection } from '../../../hooks/useFileSelection';
import Card from '../../common/Card';

export const PgpTab = () => {
  const { 
    handleGenerateKeyPair, 
    handleSignFile, 
    handleVerifySignature 
  } = usePgp();

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card 
        title="Generate PGP Key Pair"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        description="Generate a new PGP key pair with passphrase"
        actionText="Generate Keys"
        onAction={handleGenerateKeyPair}
      />
      
      <Card 
        title="Sign File"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
        description="Sign a file using your private key"
        actionText="Sign File"
        onAction={handleSignFile}
      />
      
      <Card 
        title="Verify Signature"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
        description="Verify a file signature using public key"
        actionText="Verify Signature"
        onAction={handleVerifySignature}
      />
    </div>
  );
};