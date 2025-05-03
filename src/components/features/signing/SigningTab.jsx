import React from 'react';
import { useSigning } from '../../../hooks/useSigning';
import Card from '../../common/Card';

export const SigningTab = () => {
  const { handleSignDocument, handleVerifySignature, handleSignPDFDocument, handleSignOfficeDocument} = useSigning();

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

      <Card 
        title="Sign PDF Document"
        icon={
          <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2a2 2 0 0 0-2 2v16c0 1.104.896 2 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zM14 3.5L20.5 10H15a1 1 0 0 1-1-1V3.5zM8 14v-4h1.5a1.5 1.5 0 0 1 0 3H9v1h-.5zm2.5-2a.5.5 0 0 0-.5-.5H9v1h1a.5.5 0 0 0 .5-.5zm2.5-1h1a2 2 0 1 1 0 4h-1v-4zm1 3a1 1 0 1 0 0-2h-.5v2H14zm2-3h3v1h-2v.5h2v1h-2V14h-1v-4z"/>
          </svg>
        }
        description="Sign PDF documents using your e-signature. It can be verified in any PDF viewer."
        actionText="Select PDF Document"
        onAction={handleSignPDFDocument}
      />

      <Card 
        title="Sign Office Document"

        icon={
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2a2 2 0 0 0-2 2v16c0 1.104.896 2 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zM14 3.5L20.5 10H15a1 1 0 0 1-1-1V3.5zM8 14v-4h1.2l.8 2.2L10.8 10H12v4h-1v-2.1l-.9 2.1H9.9l-.9-2.1V14H8z"/>
        </svg>
        }
        description="Sign Office documents using your e-signature. It can be verified in any Office program."
        actionText="Select Office Document"
        onAction={handleSignOfficeDocument}
      />
    </div>
  );
};