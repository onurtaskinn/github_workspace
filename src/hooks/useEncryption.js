// src/hooks/useEncryption.js
import { useFileSelection } from './useFileSelection';
import { useNotification } from '../contexts/NotificationContext';
import browserApi from '../utils/browserApi';

export const useEncryption = () => {
  const { handleFileSelection } = useFileSelection();
  const { showNotification } = useNotification();

  const handleEncryptForSelf = () => {
    handleFileSelection('*.*', async (file) => {
      try {
        console.log('Encrypting file for self:', file.name); // Debug log
        const response = await browserApi.encryptData(file.name);
        console.log('Encryption response:', response); // Debug log
        
        if (response.success) {
          showNotification('Document encrypted successfully for yourself', 'success');
        } else {
          showNotification(response.message || 'Failed to encrypt document', 'error');
        }
      } catch (error) {
        console.error('Error encrypting document:', error);
        showNotification('Error encrypting document', 'error');
      }
    });
  };

  const handleEncryptForSomeone = async () => {
    try {
      // First, select the file to encrypt
      showNotification('Select the file to encrypt', 'info');
      const fileToEncrypt = await new Promise((resolve) => {
        handleFileSelection('*.*', (file) => resolve(file));
      });

      // Then, select the public key file
      showNotification('Now select the public key file', 'info');
      const keyFile = await new Promise((resolve) => {
        handleFileSelection('.key,.pub', (file) => resolve(file));
      });

      console.log('Encrypting file for someone:', fileToEncrypt.name, 'with key:', keyFile.name); // Debug log
      const response = await browserApi.encryptWithPubkey(fileToEncrypt.name, keyFile.name);
      console.log('Encryption with pubkey response:', response); // Debug log

      if (response.success) {
        showNotification('Document encrypted successfully for recipient', 'success');
      } else {
        showNotification(response.message || 'Failed to encrypt document for recipient', 'error');
      }
    } catch (error) {
      console.error('Error encrypting document for someone:', error);
      showNotification('Error encrypting document for recipient', 'error');
    }
  };

  const handleDecrypt = async () => {
    handleFileSelection('*.*', async (file) => {
      handleFileSelection('*.*', async (keyFile) => {
        try {
          console.log('Decrypting file:', file.name, 'with key:', keyFile.name); // Debug log
          const response = await browserApi.decryptData(file.name, keyFile.name);
          console.log('Decryption response:', response); // Debug log

          if (response.success) {
            showNotification('Document decrypted successfully', 'success');
          } else {
            showNotification(response.message || 'Failed to decrypt document', 'error');
          }
        } catch (error) {
          console.error('Error decrypting document:', error);
          showNotification('Error decrypting document', 'error');
        }
      });
    });
  };

  return { handleEncryptForSelf, handleEncryptForSomeone, handleDecrypt };
};

