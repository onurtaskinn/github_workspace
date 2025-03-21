// src/hooks/useSigning.js
import { useFileSelection } from './useFileSelection';
import { useNotification } from '../contexts/NotificationContext'; // NotificationContext'ten import ediyoruz
import browserApi from '../utils/browserApi';

export const useSigning = () => {
  const { handleFileSelection } = useFileSelection();
  const { showNotification } = useNotification();

  const handleSignDocument = () => {
    handleFileSelection('*.*', async (file) => {
      try {
        console.log('Signing file:', file.name); // Debug log
        const response = await browserApi.signDocument(file.name);
        console.log('Signing response:', response); // Debug log

        if (response.success) {
          showNotification('Document signed successfully', 'success');
        } else {
          showNotification(response.message || 'Failed to sign document', 'error');
        }
      } catch (error) {
        console.error('Error signing document:', error);
        showNotification('Error signing document', 'error');
      }
    });
  };

  const handleVerifySignature = () => {
    handleFileSelection('*.*', async (file) => {
      // Sonra imza dosyasını seç
      handleFileSelection('*.*', async (signatureFile) => {
        try {
          console.log('Verifying file:', file.name, 'with signature:', signatureFile.name); // Debug log
          const response = await browserApi.verifySignature(file.name, signatureFile.name);
          console.log('Verification response:', response); // Debug log

          if (response.success) {
            showNotification('Signature is valid', 'success');
          } else {
            showNotification(response.message || 'Invalid signature', 'error');
          }
        } catch (error) {
          console.error('Error verifying signature:', error);
          showNotification('Error verifying signature', 'error');
        }
      });
    });
  };

  return { handleSignDocument, handleVerifySignature };
};

